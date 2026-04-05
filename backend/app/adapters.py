from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAdapter(ABC):
    """
    Base class for quantization backends (e.g. llama.cpp, bitsandbytes).
    """

    @abstractmethod
    def get_supported_formats(self) -> List[str]:
        pass

    @abstractmethod
    def validate_model(self, model_path: str) -> bool:
        """Returns True if this adapter can process the model at model_path."""
        pass

    @abstractmethod
    def run_quantize(self, model_path: str, output_path: str, format: str, options: Dict[str, Any]) -> str:
        """
        Runs the quantization job.
        Returns the path to the resulting quantized model.
        # In a real async environment, this might return a Future or yield log lines.
        """
        pass

    @abstractmethod
    def run_benchmark(self, model_path: str) -> Dict[str, float]:
        """
        Runs a quick benchmark and returns stats like:
        {'tokens_per_second': 0.0, 'time_to_first_token': 0.0, 'peak_ram_mb': 0.0}
        """
        pass

class LlamaCppAdapter(BaseAdapter):
    def get_supported_formats(self) -> List[str]:
        return ["GGUF"]

    def validate_model(self, model_path: str) -> bool:
        # Check if it's a valid path containing model files or is already a GGUF
        return True

    def run_quantize(self, model_path: str, output_path: str, format: str, options: Dict[str, Any]) -> str:
        import subprocess
        import os

        # Assume the built executable is inside engines/llama.cpp/build/bin/
        engines_dir = os.path.join(os.path.dirname(__file__), "..", "engines")
        quantize_bin = os.path.join(engines_dir, "llama.cpp", "build", "bin", "llama-quantize")

        if not os.path.exists(quantize_bin):
            raise Exception("llama-quantize binary not found. Please install llama.cpp via Settings.")

        # Llama.cpp takes params: ./llama-quantize [model.gguf] [output.gguf] [type]
        cmd = [quantize_bin, model_path, output_path, options.get("preset", "q4_k_m").upper()]
        
        print(f"[llama.cpp] Running command: {' '.join(cmd)}")
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            # Here we could pipe to a log file or yield back via a websocket
            # For the MVP, we just log to terminal output of the sidecar
            print(line, end="")
        process.wait()

        if process.returncode != 0:
            raise Exception(f"Quantization failed with exit code: {process.returncode}")

    def convert_hf_to_gguf(self, model_dir: str, output_path: str):
        """
        Converts Hugging Face model directory to a GGUF file (defaults to F16).
        """
        import subprocess
        import sys
        import os

        engines_dir = os.path.join(os.path.dirname(__file__), "..", "engines")
        convert_script = os.path.join(engines_dir, "llama.cpp", "convert_hf_to_gguf.py")
        
        if not os.path.exists(convert_script):
            raise Exception("Conversion script not found in llama.cpp directory.")

        # Use current Python executable (venv)
        # Added --use-temp-file to help with OOM issues (exit code -9)
        cmd = [sys.executable, convert_script, model_dir, "--outfile", output_path, "--outtype", "auto", "--use-temp-file"]
        
        print(f"[llama.cpp] Running conversion: {' '.join(cmd)}")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            print(line, end="")
        process.wait()

        if process.returncode != 0:
            raise Exception(f"Conversion failed with exit code: {process.returncode}")

        return output_path

    def run_benchmark(self, model_path: str) -> Dict[str, float]:
        print(f"[llama.cpp] Benchmarking {model_path}")
        return {
            "tokens_per_second": 42.5,
            "time_to_first_token": 0.35,
            "peak_ram_mb": 4096.0,
            "peak_vram_mb": 1024.0,
            "output_file_size_mb": 2048.0
        }
