# 📖 TurboQuant Studio: User Guide

Welcome to your high-performance quantization workstation. This guide walks you through the end-to-end operation of **TurboQuant Studio v1.1.0**.

---

## 🛰️ 1. Project Initialization
To start a new quantization sequence, you must first index a model from your host machine.

1.  Navigate to the **Initialize** (Import) tab.
2.  Paste the **Absolute Path** of your model.
    *   **Hugging Face / Safetensors**: Path to the folder containing `config.json` and `.safetensors` files.
    *   **GGUF**: Path directly to the `.gguf` binary file to skip conversion and go straight to quantization/testing.
3.  Click **Verify**. The studio will perform a signature check to validate the model's architecture (e.g., Llama, Mistral, Qwen).
4.  Enter an **Internal Project Name** and click **Deploy Project**.

## 🛠️ 2. The Quantization Workbench
Once initialized, your project will appear in the **Model Repository**. Click **Workbench** to configure your optimization strategy.

1.  **Engine Select**: Choose the backend toolchain. (Currently optimized for `llama.cpp`).
2.  **Weight Preset Tuning**: Select your target bit-depth.
    *   `Q4_K_M`: The "Golden Standard" for a balance between speed and quality.
    *   `Q8_0`: Near-lossless, but heavy on RAM/VRAM.
    *   `Q3_K_M`: Extreme compression for low-powered devices.
3.  **Review Estimates**: Check the **Preflight Estimates** panel for Peak RAM Demand and Estimated Process Time.
4.  Click **Start Quantization**.

## 📊 3. Monitoring the Pulse
Quantization is a compute-intensive process. Use the Studio's telemetry to monitor your hardware.

1.  **Job Queue**: Navigate to the **Jobs** tab to watch terminal-style logs as the weights are compressed.
2.  **Live Analytics**: Check the **Analytics** page to view real-time SVG gauges of your CPU, RAM, and GPU.
    *   **Cyan**: Safe operating range.
    *   **Amber**: High load (>60%).
    *   **Rose**: Critical load (>85%). Monitor temperatures closely.

## 💬 4. The Playground
After quantization is complete, your `.gguf` output will be stored in your project directory.

1.  Navigate to the **Playground**.
2.  Select your new model from the dropdown.
3.  Click **Load Model**.
4.  Chat with the model using the real-time streaming interface to verify the weights aren't "hallucinating" or overly degraded from compression.

---

## 🗑️ 5. Maintenance
*   **Purging Projects**: In the **Repository**, use the trash icon to remove project metadata. Note: This does **not** delete your actual model files on disk for safety.
*   **Cleaning Jobs**: Delete old job logs in the **Jobs** tab to keep your workstation telemetry clean.

---
Built by **Hustla** | Powered by **Ethernine Protocol**
