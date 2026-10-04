#!/usr/bin/env bash
# ==============================================================================
# Pantryo - Automated Fruits-360 Training & Deployment Runner
# ==============================================================================
set -euo pipefail

DATA_DIR="${1:-./data/fruits-360}"
OUTPUT_DIR="${2:-./output_model}"
EPOCHS="${3:-15}"
BATCH_SIZE="${4:-64}"

echo "======================================================================"
echo "  Pantryo Fruits-360 Produce Vision Model Training Runner"
echo "======================================================================"
echo "Data Directory:   ${DATA_DIR}"
echo "Output Directory: ${OUTPUT_DIR}"
echo "Epochs:           ${EPOCHS}"
echo "Batch Size:       ${BATCH_SIZE}"
echo "======================================================================"

# 1. Check Python3
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] python3 is required but not installed."
  exit 1
fi

# 2. Check or install dependencies
echo "[*] Checking Python environment..."
python3 -c "import torch, torchvision, onnx, numpy" 2>/dev/null || {
  echo "[*] Installing required PyTorch and ONNX packages..."
  pip install --quiet torch torchvision numpy onnx onnxruntime
}

# 3. Check for dataset existence or guide download
if [ ! -d "${DATA_DIR}/Training" ] && [ ! -d "${DATA_DIR}/train" ]; then
  echo "[!] Dataset not found at '${DATA_DIR}'."
  echo "[*] Attempting to download Fruits-360 repository..."
  mkdir -p "${DATA_DIR}"
  if command -v git &>/dev/null; then
    echo "[*] Cloning Fruits-360 from GitHub repository..."
    git clone --depth 1 https://github.com/Horea94/Fruit-Images-Dataset.git "${DATA_DIR}"
  else
    echo "[ERROR] Please download Fruits-360 from Kaggle (moltean/fruits) and extract into ${DATA_DIR}"
    exit 1
  fi
fi

# 4. Run Training
echo "[*] Starting training script..."
python3 scripts/train_fruits360.py \
  --data-dir "${DATA_DIR}" \
  --output-dir "${OUTPUT_DIR}" \
  --epochs "${EPOCHS}" \
  --batch-size "${BATCH_SIZE}"

# 5. Automatically deploy into Pantryo public directory
if [ -f "${OUTPUT_DIR}/grocery_model.onnx" ]; then
  echo "[*] Deploying trained ONNX model to Pantryo..."
  mkdir -p public/models/grocery_model
  cp "${OUTPUT_DIR}/grocery_model.onnx" public/models/grocery_model/grocery_model.onnx
  cp "${OUTPUT_DIR}/classes.txt" public/models/grocery_model/classes.txt
  echo "[SUCCESS] Trained Fruits-360 model successfully deployed to public/models/grocery_model/!"
fi
