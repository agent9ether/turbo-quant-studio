from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    source_path: str
    architecture: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class QuantJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    target_format: str
    target_preset: str
    status: str = Field(default="pending") # pending, running, completed, failed
    log_path: Optional[str] = None
    output_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class Benchmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    quant_job_id: Optional[int] = Field(default=None, foreign_key="quantjob.id")
    tokens_per_second: float
    time_to_first_token: float
    peak_ram_mb: float
    peak_vram_mb: float
    output_file_size_mb: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
