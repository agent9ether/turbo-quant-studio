from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, create_engine, select
from typing import List, Dict, Any
from .models import Project, QuantJob, Benchmark
import os
import subprocess

sqlite_file_name = "database.db"
# Use an absolute path or a robust path logic depending on where Tauri spawns it
sqlite_url = f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', sqlite_file_name)}"
engine = create_engine(sqlite_url, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI(title="TurboQuant Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For Tauri MVP allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "TurboQuant Studio Backend is running!"}

@app.get("/projects", response_model=List[Project])
def get_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    return projects

@app.post("/projects", response_model=Project)
def create_project(project: Project, session: Session = Depends(get_session)):
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@app.get("/system/diagnostics")
def system_diagnostics():
    """Returns comprehensive system diagnostics including GPU."""
    import psutil
    try:
        import GPUtil
        gpus = GPUtil.getGPUs()
        gpu_info = [
            {
                "id": g.id,
                "name": g.name,
                "load": round(g.load * 100, 1),
                "memory_used": round(g.memoryUsed, 1),
                "memory_total": round(g.memoryTotal, 1),
                "memory_util": round(g.memoryUtil * 100, 1),
                "temp": g.temperature
            } for g in gpus
        ]
    except Exception as e:
        gpu_info = []
        print(f"GPU Diagnostic error: {e}")

    vm = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_usage": psutil.cpu_percent(interval=None),
        "ram_usage": vm.percent,
        "ram_total_gb": round(vm.total / (1024**3), 2),
        "ram_used_gb": round(vm.used / (1024**3), 2),
        "ram_available_gb": round(vm.available / (1024**3), 2),
        "disk_usage": disk.percent,
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "gpu": gpu_info[0] if gpu_info else {"name": "No GPU detected", "load": 0, "memory_util": 0, "temp": 0},
        "all_gpus": gpu_info,
        "platform": os.uname().sysname if hasattr(os, "uname") else "Windows",
        "cpu_cores": psutil.cpu_count(logical=False),
        "cpu_threads": psutil.cpu_count(logical=True)
    }

from .adapters import LlamaCppAdapter
import uuid
from fastapi.responses import StreamingResponse
from .installer import install_llama_cpp
from pydantic import BaseModel
import json

class ModelValidationRequest(BaseModel):
    path: str

class ModelValidationResponse(BaseModel):
    valid: bool
    is_gguf: bool
    is_dir: bool
    architecture: str
    message: str

@app.post("/system/validate-model", response_model=ModelValidationResponse)
def validate_model(req: ModelValidationRequest):
    p = req.path
    if not os.path.exists(p):
        return {"valid": False, "is_gguf": False, "is_dir": False, "architecture": "unknown", "message": "Path does not exist."}
    
    if os.path.isfile(p):
        if p.lower().endswith(".gguf"):
            return {"valid": True, "is_gguf": True, "is_dir": False, "architecture": "GGUF Binary", "message": "Valid GGUF file."}
        else:
            return {"valid": False, "is_gguf": False, "is_dir": False, "architecture": "unknown", "message": "File is not a GGUF."}
    
    if os.path.isdir(p):
        config_path = os.path.join(p, "config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    config = json.load(f)
                    arch = config.get("architectures", ["Unknown"])[0]
                return {"valid": True, "is_gguf": False, "is_dir": True, "architecture": arch, "message": "Valid model directory."}
            except Exception as e:
                return {"valid": False, "is_gguf": False, "is_dir": True, "architecture": "error", "message": str(e)}
        else:
            return {"valid": False, "is_gguf": False, "is_dir": True, "architecture": "unknown", "message": "No config.json found in directory."}

@app.post("/system/install-llama")
def install_llama_endpoint():
    """
    Streams the installation logs of llama.cpp directly to the client.
    """
    return StreamingResponse(install_llama_cpp(yield_logs=True), media_type="text/plain")

from fastapi import BackgroundTasks

def run_quant_job(job_id: int):
    """Background task to execute quantization."""
    with Session(engine) as session:
        job = session.get(QuantJob, job_id)
        if not job: return
        
        project = session.get(Project, job.project_id)
        if not project:
            job.status = "failed"
            session.add(job)
            session.commit()
            return

        job.status = "running"
        session.add(job)
        session.commit()

        try:
            adapter = LlamaCppAdapter()
            source_path = project.source_path
            temp_gguf = None
            
            # 1. Check if source is a directory (HF format)
            if os.path.isdir(source_path):
                job.notes = "Converting HF to GGUF (FP16)..."
                session.add(job)
                session.commit()
                
                temp_name = f"temp_{job.id}_fp16.gguf"
                temp_gguf = os.path.join(os.path.dirname(source_path), temp_name)
                
                adapter.convert_hf_to_gguf(source_path, temp_gguf)
                source_path = temp_gguf
                
            # 2. Quantize
            job.notes = f"Quantizing to {job.target_preset}..."
            session.add(job)
            session.commit()
            
            out_name = f"{project.name}_{job.target_preset}.gguf".replace(" ", "_")
            out_path = os.path.join(os.path.dirname(project.source_path), out_name)
            
            adapter.run_quantize(
                model_path=source_path,
                output_path=out_path,
                format=job.target_format,
                options={"preset": job.target_preset}
            )
            
            # Cleanup temp file
            if temp_gguf and os.path.exists(temp_gguf):
                os.remove(temp_gguf)
                
            job.status = "completed"
            job.output_path = out_path
            job.notes = f"Successfully quantized to {out_path}"
        except Exception as e:
            print(f"Job {job_id} failed: {e}")
            job.status = "failed"
            job.notes = f"Error: {str(e)}"
        
        session.add(job)
        session.commit()

@app.get("/jobs", response_model=List[QuantJob])
def get_jobs(session: Session = Depends(get_session)):
    jobs = session.exec(select(QuantJob)).all()
    return jobs

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(QuantJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    session.delete(job)
    session.commit()
    return {"message": "Job deleted successfully"}

import asyncio
import httpx

class ModelServer:
    def __init__(self):
        self.process = None
        self.current_model = None
        self.port = 11425
        self.base_url = f"http://127.0.0.1:{self.port}"

    async def start(self, model_path: str):
        if self.process:
            self.stop()
        
        engines_dir = os.path.join(os.path.dirname(__file__), "..", "engines")
        server_bin = os.path.join(engines_dir, "llama.cpp", "build", "bin", "llama-server")
        
        if not os.path.exists(server_bin):
            raise Exception("llama-server binary not found. Build llama.cpp first.")

        # Log to file for debugging
        log_path = os.path.join(os.path.dirname(__file__), "..", "llama_server.log")
        log_file = open(log_path, "w")

        cmd = [
            server_bin,
            "-m", model_path,
            "--port", str(self.port),
            "-c", "4096", # Reduce context size to improve CPU performance
            "-ngl", "99" # Try GPU
        ]
        
        print(f"[ModelServer] Starting with model: {model_path}")
        print(f"[ModelServer] Logs at: {log_path}")
        self.process = subprocess.Popen(cmd, stdout=log_file, stderr=log_file)
        self.current_model = model_path
        
        # Wait for server to be ready
        async with httpx.AsyncClient() as client:
            for _ in range(45): # Give it more time
                try:
                    resp = await client.get(f"{self.base_url}/health")
                    if resp.status_code == 200:
                        print("[ModelServer] Server is ready.")
                        return True
                except Exception as e:
                    pass
                await asyncio.sleep(1)
        return False

    def stop(self):
        if self.process:
            print("[ModelServer] Stopping server...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except:
                self.process.kill()
            self.process = None
            self.current_model = None

model_server = ModelServer()

class ChatRequest(BaseModel):
    model_path: str
    messages: List[Dict[str, str]]

async def stream_generator(model_path: str, messages: List[Dict[str, str]]):
    async with httpx.AsyncClient() as client:
        # Retry logic for loading model
        for attempt in range(5):
            try:
                async with client.stream(
                    "POST",
                    f"{model_server.base_url}/v1/chat/completions",
                    json={
                        "model": "local-model",
                        "messages": messages,
                        "stream": True
                    },
                    timeout=httpx.Timeout(300.0, connect=60.0)
                ) as response:
                    if response.status_code == 503:
                        # Inspect the first chunk if possible or just retry if 503
                        print("[Inference/Stream] Model is loading (503)...")
                        await asyncio.sleep(5)
                        continue
                    
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': {'message': f'Server error {response.status_code}'}})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if line.strip():
                            yield f"{line}\n\n"
                    return # Success
            except Exception as e:
                print(f"[Inference/Stream] Attempt {attempt+1} failed: {e}")
                if attempt == 4:
                    yield f"data: {json.dumps({'error': {'message': str(e)}})}\n\n"
                await asyncio.sleep(3)

@app.post("/inference/chat")
async def chat_inference(req: ChatRequest):
    # Ensure server is running the correct model
    if model_server.current_model != req.model_path:
        success = await model_server.start(req.model_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to start inference server. Check llama_server.log")

    return StreamingResponse(stream_generator(req.model_path, req.messages), media_type="text/event-stream")

@app.on_event("shutdown")
def shutdown_event():
    model_server.stop()

@app.post("/jobs", response_model=QuantJob)
def create_quant_job(job: QuantJob, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    session.add(job)
    session.commit()
    session.refresh(job)
    
    background_tasks.add_task(run_quant_job, job.id)
    
    return job

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Also delete associated jobs
    jobs = session.exec(select(QuantJob).where(QuantJob.project_id == project_id)).all()
    for job in jobs:
        session.delete(job)
        
    session.delete(project)
    session.commit()
    return {"message": "Project deleted successfully"}
