import os
import subprocess
import platform

ENGINES_DIR = os.path.join(os.path.dirname(__file__), "..", "engines")
LLAMACPP_DIR = os.path.join(ENGINES_DIR, "llama.cpp")
REPO_URL = "https://github.com/ggerganov/llama.cpp.git"

def install_llama_cpp(yield_logs=False):
    """
    Clones and builds llama.cpp.
    If yield_logs is True, acts as a generator yielding output lines.
    """
    if not os.path.exists(ENGINES_DIR):
        os.makedirs(ENGINES_DIR)

    # Check for cmake
    try:
        subprocess.run(["cmake", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        yield "ERROR: 'cmake' is not installed or not in PATH. Please install it (e.g. 'sudo apt install cmake') and try again.\n"
        return False

    # 1. Clone or pull
    if not os.path.exists(LLAMACPP_DIR):
        cmd_clone = ["git", "clone", REPO_URL, "llama.cpp"]
        yield f"Cloning llama.cpp to {LLAMACPP_DIR}...\n"
        process = subprocess.Popen(cmd_clone, cwd=ENGINES_DIR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            if yield_logs: yield line
            else: print(line, end="")
        process.wait()
        if process.returncode != 0:
            yield "ERROR: Git clone failed.\n"
            return False
    else:
        yield f"llama.cpp already exists in {LLAMACPP_DIR}. Pulling latest...\n"
        cmd_pull = ["git", "pull"]
        process = subprocess.Popen(cmd_pull, cwd=LLAMACPP_DIR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            if yield_logs: yield line
            else: print(line, end="")
        process.wait()

    # 2. Build via CMake
    yield "Configuring llama.cpp using CMake...\n"
    # Create build directory and configure
    cmd_cmake_config = ["cmake", "-B", "build"]
    process = subprocess.Popen(cmd_cmake_config, cwd=LLAMACPP_DIR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        if yield_logs: yield line
    process.wait()
    if process.returncode != 0:
        yield "ERROR: CMake configuration failed.\n"
        return False

    yield "Building llama.cpp using CMake...\n"
    # Build the project
    cmd_cmake_build = ["cmake", "--build", "build", "--config", "Release", "-j"]
    process = subprocess.Popen(cmd_cmake_build, cwd=LLAMACPP_DIR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        if yield_logs: yield line
    process.wait()
    
    if process.returncode == 0:
        yield "Successfully built llama.cpp binaries!\n"
        
        # 3. Install Python dependencies for conversion
        yield "Installing Python dependencies (torch, numpy, transformers, etc.) for HF conversion...\n"
        # Use our current venv's pip
        import sys
        pip_path = os.path.join(os.path.dirname(sys.executable), "pip")
        
        # Standard requirements from llama.cpp
        if os.path.exists(os.path.join(LLAMACPP_DIR, "requirements.txt")):
            cmd_pip = [pip_path, "install", "-r", "requirements.txt"]
            subprocess.run(cmd_pip, cwd=LLAMACPP_DIR, capture_output=True)
        
        # Explicitly ensure core conversion libs are present
        cmd_pip_extra = [pip_path, "install", "gguf", "safetensors", "sentencepiece", "transformers", "torch", "numpy"]
        process = subprocess.Popen(cmd_pip_extra, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
             if yield_logs: yield f" - {line}"
        process.wait()
        
        yield "Successfully installed python build dependencies!\n"
        return True
    else:
        yield "ERROR: Failed to build llama.cpp.\n"
        return False
