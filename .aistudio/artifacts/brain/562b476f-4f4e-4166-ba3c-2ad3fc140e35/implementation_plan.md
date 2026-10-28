# Production Grocery & Produce Vision Training Pipeline

A self-contained, enterprise-grade PyTorch training and fine-tuning pipeline designed to classify grocery products, fresh produce, packages, and cans from multi-source datasets (GroceryStoreDataset, Open Food Facts, FooDI-ML/RPC), exporting to optimized FP32 and INT8 ONNX models with zero-dependency runtime inference.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural decisions confirmed in Phase 1:
> - **Vision Backbone**: `mobilenetv3_large_100` (pre-trained via `timm` / ImageNet-1k) for ultra-low latency (<15 ms) and edge/browser compatibility.
> - **Dataset Ingestion**: Flexible, multi-format PyTorch `Dataset` supporting both CSV/JSON metadata mappings and nested class-folder layouts with automatic class index harmonization.
> - **Export Format**: Full FP32 ONNX model with dynamic batching `[batch_size, 3, 224, 224]`, accompanied by an optimized **INT8 dynamic quantized model** (`model_int8.onnx`) and `labels.json`.

---

## 1. Overview & Core Concept

Home inventory and grocery checkouts face severe computer vision challenges: long-tail class distributions (hundreds of fresh fruits vs. thousands of packaged brand goods), variable supermarket and kitchen lighting, reflective packaging glare, and deformed plastic bags.

This script implements an end-to-end, reproducible training script (`train_grocery_vision.py`) providing:
1. **Multi-Dataset Ingestion**: Unifies GroceryStoreDataset (fine-grained produce), Open Food Facts (packaging/labels), and RPC/FooDI-ML into a unified class taxonomy.
2. **Transfer Learning Head**: Modular classification head with LayerNorm, Dropout, and balanced cross-entropy with label smoothing ($\epsilon = 0.1$) to prevent overconfidence on sparse categories.
3. **Domain-Specific Augmentations**: Perspective warps, color temperature shifts, and coarse dropouts simulating handheld camera photography.
4. **Resilient Training**: Mixed precision (`torch.amp.autocast`), AdamW with decoupled weight decay, Cosine Annealing with linear warmup, and Top-1/Top-5/Macro-F1 evaluation.
5. **Edge Deployment**: Automated ONNX export with dynamic batch sizes, dynamic INT8 quantization via `onnxruntime.quantization`, and a standalone Python verification runner.

---

## 2. Pipeline Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Data Sources & Ingestion                             │
│                                                                        │
│  GroceryStoreDataset ──┐                                               │
│  Open Food Facts ──────┼──> UnifiedGroceryDataset                      │
│  FooDI-ML / RPC ───────┘      ├── Class balancing & Label Smoothing    │
│                               └── Albumentations Lighting/Perspective  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Transfer Learning & Training                         │
│                                                                        │
│  Pretrained Backbone (MobileNetV3-Large / timm)                        │
│    ├── Phase 1: Frozen backbone (warmup head)                          │
│    └── Phase 2: Full fine-tuning with Cosine Annealing                 │
│                                                                        │
│  Loss: LabelSmoothingCrossEntropy (with optional class weights)        │
│  Optimization: Mixed Precision AMP + AdamW (weight_decay=1e-2)         │
│  Metrics: Top-1 Accuracy, Top-5 Accuracy, Macro F1-Score               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Artifact Export & Validation                         │
│                                                                        │
│  ├── best_model.pt               (PyTorch Checkpoint)                  │
│  ├── model.onnx                  (FP32 Dynamic Batching)               │
│  ├── model_int8.onnx             (Quantized Edge Model)                │
│  ├── labels.json                 (Class ID <-> Name Dictionary)        │
│  └── run_inference()             (Zero-dependency ONNX Runtime Tester) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Technical Decisions & Strategy

### 1. Data Ingestion & Imbalance Handling
- **Unified Schema**: Samples mapped to `(image_path, label_id, label_name, dataset_source)`.
- **Handling Long Tails**: Calculate class frequencies and apply effective-number-of-samples weighting or label smoothing ($\alpha = 0.1$). Label smoothing softens one-hot vectors to handle noisy crowd-sourced annotations from Open Food Facts.

### 2. Augmentations (Albumentations)
- **Geometry**: `RandomResizedCrop(224, 224, scale=(0.7, 1.0))`, `HorizontalFlip(p=0.5)`, `ShiftScaleRotate(shift_limit=0.1, scale_limit=0.1, rotate_limit=15, p=0.5)`.
- **Photometry**: `ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05, p=0.7)` and `RandomToneCurve(p=0.3)` to emulate fluorescent store lighting vs. warm kitchen lamps.
- **Occlusion**: `CoarseDropout(max_holes=4, max_height=24, max_width=24, p=0.3)` to force the model to look beyond brand logos.

### 3. Model Architecture & Fine-Tuning Schedule
- **Backbone**: `timm.create_model('mobilenetv3_large_100', pretrained=True, num_classes=0)` yielding 960-dim feature embeddings.
- **Head**:
  ```python
  nn.Sequential(
      nn.BatchNorm1d(960),
      nn.Dropout(p=0.3),
      nn.Linear(960, 512),
      nn.SiLU(),
      nn.BatchNorm1d(512),
      nn.Dropout(p=0.2),
      nn.Linear(512, num_classes)
  )
  ```
- **Two-Stage Fine-Tuning**:
  - *Warmup (Epochs 1–3)*: Train head only ($lr = 10^{-3}$, backbone frozen).
  - *Main Fine-Tuning (Epochs 4–30)*: Unfreeze all layers with discriminative learning rates ($lr_{backbone} = 10^{-4}, lr_{head} = 5 \times 10^{-4}$) using Cosine Annealing with minimum $lr = 10^{-6}$.

### 4. ONNX & INT8 Dynamic Quantization
- Dynamic batch axis: `dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}`.
- Uses `onnxruntime.quantization.quantize_dynamic` targeting `Linear` and `Conv` weights to reduce model footprint by ~4x (from ~22 MB down to ~6 MB) with negligible top-1 accuracy loss.

---

## 4. Deliverable File Structure

The script will be written as a comprehensive, production-grade script:
- `train_grocery_vision.py`: Complete, standalone script containing:
  1. Dependencies specification and command-line argument parser (`argparse`).
  2. Dataset classes: `UnifiedGroceryDataset` supporting CSV/JSON and class folders.
  3. Albumentations transform pipelines.
  4. PyTorch model definition with custom classification head.
  5. Training & validation engine with AMP, early stopping, Top-1/Top-5/F1 metrics.
  6. ONNX export and INT8 dynamic quantization pipeline.
  7. Standalone inference function `predict_image(image_path, model_path, labels_path)` using `onnxruntime`.
  8. Synthetic mock dataset generator for out-of-the-box pipeline validation without external downloads.

---

## 5. Verification Plan

1. **Syntax & Type Checking**: Validate types and syntax using Python AST and standard compilation tools.
2. **End-to-End Dry Run**:
   - Run the script in synthetic benchmark mode to verify:
     - DataLoader batching and augmentations.
     - Mixed precision forward and backward passes.
     - Metric computations (Top-1, Top-5, F1).
     - Model checkpoint generation (`best_model.pt`).
     - ONNX FP32 export and ONNX INT8 quantization.
     - Inference verification with ONNX Runtime.
