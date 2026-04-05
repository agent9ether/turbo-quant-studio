# 🚀 TurboQuant Studio

**TurboQuant Studio** is a professional-grade, local quantization workstation built with Tauri, React, and `llama.cpp`. It provides an end-to-end pipeline to convert, quantize, and test LLMs directly on your desktop with a premium, real-time interface.

![TurboQuant Studio Banner](./banner.png)

## 🌟 Key Features

- **Memory-Efficient GGUF Conversion**: Seamlessly convert HuggingFace models to GGUF using disk-swapping (`--use-temp-file`) to prevent OOM errors on limited hardware.
- **Advanced Quantization**: Support for all major `llama.cpp` quantization levels (Q4_K_M, Q8_0, etc.) with a visual job queue.
- **Real-time Streaming Playground**: A built-in chat interface with SSE (Server-Sent Events) streaming for instant feedback during model testing.
- **Local Analytics**: Monitor your quantization jobs and manage your model library locally.
- **GPU Accelerated**: Built to leverage available GPU layers for lightning-fast inference.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui
- **Desktop Shell**: Tauri (Rust)
- **Backend**: Python FastAPI Sidecar
- **Engine**: `llama.cpp` (C++)
- **Database**: SQLModel / SQLite

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **CMake** (for building the quantization engine)
- **Rust** (for Tauri)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/agent9ether/turbo-quant-studio.git
   cd turbo-quant-studio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run tauri dev
   ```

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for the open-source AI community.
