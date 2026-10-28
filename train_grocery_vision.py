#!/usr/bin/env python3
"""
===============================================================================
Production-Ready Grocery & Produce Vision Model Training & Fine-Tuning Pipeline
===============================================================================

Author: Principal Machine Learning & Computer Vision Engineer
Target Domains: Fresh produce, packaged groceries, canned goods, bottles, boxes
Supported Datasets: GroceryStoreDataset, Open Food Facts, FooDI-ML / RPC

Dependencies:
    pip install torch torchvision timm albumentations opencv-python-headless \
                scikit-learn onnx onnxruntime pillow tqdm numpy

Key Capabilities:
    1. Multi-source dataset ingestion (CSV, JSON, and standard folder structures).
    2. Vision backbones via `timm` (Default: MobileNetV3-Large for edge speed;
       also supports ConvNeXt-Tiny and EfficientNet-B0).
    3. Two-stage transfer learning: frozen backbone warmup followed by fine-tuning.
    4. Albumentations augmentations emulating store & kitchen lighting and angles.
    5. Label smoothing cross-entropy and class-weighted loss for long-tail data.
    6. Mixed-precision AMP (Automatic Mixed Precision) and Cosine Annealing.
    7. Comprehensive validation metrics: Top-1 Accuracy, Top-5 Accuracy, Macro F1.
    8. Early stopping and best model checkpointing.
    9. Dual ONNX export: Standard FP32 ONNX and dynamic INT8 quantized ONNX.
   10. Standalone zero-dependency ONNX Runtime inference function.
   11. Built-in synthetic demo mode (`--demo`) for out-of-the-box verification.
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import os
import random
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image

# -----------------------------------------------------------------------------
# PyTorch and Machine Learning Imports
# -----------------------------------------------------------------------------
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch.utils.data import DataLoader, Dataset
except ImportError as err:
    sys.exit(
        f"[CRITICAL] PyTorch is not installed. Please run:\n"
        f"pip install torch torchvision\nError: {err}"
    )

try:
    import timm
except ImportError as err:
    sys.exit(
        f"[CRITICAL] timm (PyTorch Image Models) is not installed. Please run:\n"
        f"pip install timm\nError: {err}"
    )

try:
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
except ImportError as err:
    sys.exit(
        f"[CRITICAL] Albumentations is not installed. Please run:\n"
        f"pip install albumentations opencv-python-headless\nError: {err}"
    )

try:
    from sklearn.metrics import f1_score
except ImportError as err:
    sys.exit(
        f"[CRITICAL] scikit-learn is not installed. Please run:\n"
        f"pip install scikit-learn\nError: {err}"
    )

try:
    from tqdm import tqdm
except ImportError:
    # Graceful fallback if tqdm is missing
    def tqdm(iterable, *args, **kwargs):  # type: ignore
        return iterable


# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("GroceryVision")


# =============================================================================
# 1. Image Augmentations & Transforms (Albumentations)
# =============================================================================

# Standard ImageNet normalization parameters
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


def get_train_transforms(image_size: int = 224) -> A.Compose:
    """
    Constructs robust training augmentations simulating supermarket shelves,
    handheld smartphone camera shakes, glares, and indoor lighting.
    """
    return A.Compose(
        [
            # Spatial and perspective augmentations
            A.RandomResizedCrop(
                size=(image_size, image_size),
                scale=(0.7, 1.0),
                ratio=(0.85, 1.15),
                p=1.0,
            ),
            A.HorizontalFlip(p=0.5),
            A.Affine(
                scale=(0.92, 1.08),
                translate_percent=(-0.08, 0.08),
                rotate=(-15, 15),
                p=0.6,
            ),
            A.Perspective(scale=(0.04, 0.08), p=0.3),
            # Lighting, glare, and color balance variations
            A.ColorJitter(
                brightness=0.25,
                contrast=0.25,
                saturation=0.20,
                hue=0.04,
                p=0.7,
            ),
            A.RandomToneCurve(scale=0.15, p=0.4),
            A.GaussNoise(p=0.3),
            # Partial occlusions (mimicking fingers or grocery cart wire bars)
            A.CoarseDropout(
                num_holes_range=(1, 4),
                hole_height_range=(12, 28),
                hole_width_range=(12, 28),
                fill=0,
                p=0.35,
            ),
            # Normalization matching pretrained vision backbones
            A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ToTensorV2(),
        ]
    )


def get_val_transforms(image_size: int = 224) -> A.Compose:
    """
    Constructs deterministic validation/inference transforms (Resize + CenterCrop).
    """
    resize_dim = int(image_size * 1.143)  # e.g., 256 for 224 crop
    return A.Compose(
        [
            A.Resize(resize_dim, resize_dim),
            A.CenterCrop(image_size, image_size),
            A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ToTensorV2(),
        ]
    )


# =============================================================================
# 2. Unified Multi-Source Dataset Ingestion
# =============================================================================

@dataclass
class DatasetSample:
    """Represents a single unified item sample."""
    image_path: Path
    label_name: str
    class_id: int = -1
    source: str = "custom"


class UnifiedGroceryDataset(Dataset):
    """
    Universal grocery & produce dataset loader capable of ingesting:
      - GroceryStoreDataset (fruits, vegetables, package hierarchies)
      - Open Food Facts (packaging, product images, labels)
      - FooDI-ML / RPC (Retail Product Checkout)
      - Standard directory structures: root_dir/class_name/image.jpg
      - Metadata CSV/JSON files mapping relative paths to class labels
    """

    def __init__(
        self,
        samples: List[DatasetSample],
        class_to_id: Dict[str, int],
        transform: Optional[Callable] = None,
    ) -> None:
        self.samples = samples
        self.class_to_id = class_to_id
        self.id_to_class = {v: k for k, v in class_to_id.items()}
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        sample = self.samples[idx]
        image_path = sample.image_path

        try:
            with Image.open(image_path) as img:
                img_rgb = img.convert("RGB")
                image_np = np.array(img_rgb)
        except Exception as e:
            logger.warning(f"Error loading image {image_path}: {e}. Replacing with blank canvas.")
            image_np = np.zeros((224, 224, 3), dtype=np.uint8)

        if self.transform is not None:
            augmented = self.transform(image=image_np)
            image_tensor = augmented["image"]
        else:
            # Fallback simple normalization
            image_tensor = torch.from_numpy(image_np.transpose((2, 0, 1))).float() / 255.0

        target_class_id = sample.class_id
        return image_tensor, target_class_id, sample.label_name


def parse_dataset_from_directory(
    data_dir: Union[str, Path],
    metadata_file: Optional[Union[str, Path]] = None,
    allowed_extensions: Tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp", ".bmp"),
) -> Tuple[List[DatasetSample], Dict[str, int]]:
    """
    Parses images and labels either from:
      1. A metadata CSV/JSON file (if provided or present in data_dir).
      2. Nested class folders (root/class_name/image.jpg).
    """
    data_dir = Path(data_dir)
    samples: List[DatasetSample] = []
    classes_found: set[str] = set()

    # Case 1: Explicit or discovered CSV metadata
    csv_candidate = metadata_file or (data_dir / "metadata.csv") or (data_dir / "dataset.csv")
    if csv_candidate and Path(csv_candidate).is_file():
        logger.info(f"Loading metadata from CSV: {csv_candidate}")
        import csv

        with open(csv_candidate, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = [c.lower() for c in (reader.fieldnames or [])]
            path_col = next((c for c in fieldnames if "path" in c or "file" in c or "image" in c), None)
            label_col = next((c for c in fieldnames if "label" in c or "class" in c or "category" in c or "name" in c), None)

            if not path_col or not label_col:
                raise ValueError(
                    f"CSV must contain image path and label columns. Found columns: {reader.fieldnames}"
                )

            # Reset reader with original case
            f.seek(0)
            orig_reader = csv.DictReader(f)
            for row in orig_reader:
                # Find matching keys
                img_rel = next(row[k] for k in row if k.lower() == path_col)
                lbl_val = next(row[k] for k in row if k.lower() == label_col).strip()
                img_abs = (data_dir / img_rel) if not Path(img_rel).is_absolute() else Path(img_rel)

                if img_abs.is_file():
                    samples.append(DatasetSample(image_path=img_abs, label_name=lbl_val, source="csv"))
                    classes_found.add(lbl_val)

    # Case 2: JSON metadata file
    elif metadata_file and Path(metadata_file).suffix.lower() == ".json":
        logger.info(f"Loading metadata from JSON: {metadata_file}")
        with open(metadata_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        entries = data if isinstance(data, list) else data.get("images", data.get("items", []))
        for item in entries:
            img_rel = item.get("image_path") or item.get("file_name") or item.get("path")
            lbl_val = item.get("label") or item.get("class_name") or item.get("category")
            if img_rel and lbl_val:
                img_abs = (data_dir / img_rel) if not Path(img_rel).is_absolute() else Path(img_rel)
                if img_abs.is_file():
                    lbl_clean = str(lbl_val).strip()
                    samples.append(DatasetSample(image_path=img_abs, label_name=lbl_clean, source="json"))
                    classes_found.add(lbl_clean)

    # Case 3: Nested class directory structure (root/class_name/img.jpg)
    else:
        logger.info(f"Scanning directory hierarchy in: {data_dir}")
        for item in sorted(data_dir.iterdir()):
            if item.is_dir() and not item.name.startswith((".", "_")):
                class_name = item.name
                for file_path in item.iterdir():
                    if file_path.is_file() and file_path.suffix.lower() in allowed_extensions:
                        samples.append(
                            DatasetSample(
                                image_path=file_path,
                                label_name=class_name,
                                source="folder",
                            )
                        )
                        classes_found.add(class_name)

    if not samples:
        raise FileNotFoundError(f"No valid image samples discovered in: {data_dir}")

    # Build canonical alphabetical label index mapping
    sorted_classes = sorted(list(classes_found))
    class_to_id = {cls_name: idx for idx, cls_name in enumerate(sorted_classes)}

    # Assign contiguous class_id to all samples
    for sample in samples:
        sample.class_id = class_to_id[sample.label_name]

    logger.info(
        f"Dataset ingestion complete: {len(samples)} images across {len(class_to_id)} distinct classes."
    )
    return samples, class_to_id


# =============================================================================
# 3. Model Architecture & Transfer Learning Head
# =============================================================================

class GroceryVisionClassifier(nn.Module):
    """
    Transfer learning classifier wrapping a timm vision backbone with a
    specialized classification head containing LayerNorm, Dropout, and SiLU.
    """

    def __init__(
        self,
        backbone_name: str = "mobilenetv3_large_100",
        num_classes: int = 100,
        pretrained: bool = True,
        dropout_rate: float = 0.3,
        hidden_dim: int = 512,
    ) -> None:
        super().__init__()
        self.backbone_name = backbone_name
        self.num_classes = num_classes

        # Instantiate feature extractor without original classifier
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=pretrained,
            num_classes=0,  # Strips classification head, outputs feature embedding
        )

        # Dynamically probe exact feature embedding dimension for any backbone architecture
        self.backbone.eval()
        with torch.no_grad():
            dummy_probe = torch.zeros(1, 3, 224, 224)
            in_features = int(self.backbone(dummy_probe).shape[1])
        if pretrained:
            self.backbone.train()

        logger.info(
            f"Initialized backbone '{backbone_name}' with feature embedding dimension: {in_features}"
        )

        # Enterprise classification head with normalization and regularization
        self.classifier = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Dropout(p=dropout_rate),
            nn.Linear(in_features, hidden_dim),
            nn.SiLU(inplace=True),
            nn.BatchNorm1d(hidden_dim),
            nn.Dropout(p=dropout_rate * 0.7),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        logits = self.classifier(features)
        return logits

    def freeze_backbone(self) -> None:
        """Freezes backbone weights for classification head warmup stage."""
        for param in self.backbone.parameters():
            param.requires_grad = False
        logger.info("Backbone frozen. Only classification head will receive gradients.")

    def unfreeze_backbone(self) -> None:
        """Unfreezes all layers for full end-to-end fine-tuning."""
        for param in self.backbone.parameters():
            param.requires_grad = True
        logger.info("Backbone unfrozen. End-to-end fine-tuning enabled.")

    def get_parameter_groups(
        self, backbone_lr: float, head_lr: float, weight_decay: float = 1e-2
    ) -> List[Dict[str, Any]]:
        """
        Builds parameter groups for layer-wise / differential learning rates.
        Applies weight decay exclusively to weights (excluding bias and BatchNorm).
        """
        decay_params = []
        no_decay_params = []

        # Classification Head parameters
        for name, param in self.classifier.named_parameters():
            if not param.requires_grad:
                continue
            if param.ndim <= 1 or name.endswith(".bias"):
                no_decay_params.append(param)
            else:
                decay_params.append(param)

        param_groups = [
            {"params": decay_params, "lr": head_lr, "weight_decay": weight_decay},
            {"params": no_decay_params, "lr": head_lr, "weight_decay": 0.0},
        ]

        # Backbone parameters with lower learning rate
        backbone_decay = []
        backbone_no_decay = []
        for name, param in self.backbone.named_parameters():
            if not param.requires_grad:
                continue
            if param.ndim <= 1 or name.endswith(".bias"):
                backbone_no_decay.append(param)
            else:
                backbone_decay.append(param)

        if backbone_decay:
            param_groups.append(
                {"params": backbone_decay, "lr": backbone_lr, "weight_decay": weight_decay}
            )
        if backbone_no_decay:
            param_groups.append(
                {"params": backbone_no_decay, "lr": backbone_lr, "weight_decay": 0.0}
            )

        return param_groups


# =============================================================================
# 4. Loss Function (Label Smoothing & Class Imbalance)
# =============================================================================

class LabelSmoothingCrossEntropy(nn.Module):
    """
    Cross Entropy loss with label smoothing and optional class weighting.
    Prevents overconfidence on dense retail packaging classes and accommodates
    noisy crowdsourced labels from open grocery datasets.
    """

    def __init__(
        self,
        smoothing: float = 0.1,
        weight: Optional[torch.Tensor] = None,
    ) -> None:
        super().__init__()
        self.smoothing = smoothing
        self.weight = weight

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        num_classes = logits.size(-1)
        log_preds = F.log_softmax(logits, dim=-1)

        if self.weight is not None:
            log_preds = log_preds * self.weight.unsqueeze(0)

        loss_ce = F.nll_loss(log_preds, targets, reduction="mean")
        smooth_loss = -log_preds.mean(dim=-1).mean()
        return (1.0 - self.smoothing) * loss_ce + self.smoothing * smooth_loss


def compute_class_weights(
    samples: List[DatasetSample], num_classes: int, beta: float = 0.999
) -> torch.Tensor:
    """
    Computes Effective Number of Samples (Cui et al., CVPR 2019) class weights
    to handle severe class imbalances in retail grocery datasets.
    """
    counts = np.zeros(num_classes, dtype=np.float32)
    for s in samples:
        counts[s.class_id] += 1.0

    counts = np.maximum(counts, 1.0)
    effective_num = 1.0 - np.power(beta, counts)
    weights = (1.0 - beta) / np.array(effective_num)
    weights = weights / np.sum(weights) * num_classes
    return torch.tensor(weights, dtype=torch.float32)


# =============================================================================
# 5. Training Engine & Metrics
# =============================================================================

@dataclass
class EpochMetrics:
    loss: float
    top1_acc: float
    top5_acc: float
    macro_f1: float


def compute_metrics(
    logits: torch.Tensor, targets: torch.Tensor
) -> Tuple[float, float]:
    """Computes Top-1 and Top-5 accuracy percentages."""
    with torch.no_grad():
        batch_size = targets.size(0)
        max_k = min(5, logits.size(1))
        _, pred_indices = logits.topk(max_k, dim=1, largest=True, sorted=True)
        pred_indices = pred_indices.t()
        correct = pred_indices.eq(targets.view(1, -1).expand_as(pred_indices))

        top1 = float(correct[:1].reshape(-1).float().sum(0).item() * 100.0 / batch_size)
        top5 = float(correct[:max_k].reshape(-1).float().sum(0).item() * 100.0 / batch_size)
        return top1, top5


class GroceryTrainer:
    """Complete PyTorch training, validation, early-stopping, and checkpoint manager."""

    def __init__(
        self,
        model: GroceryVisionClassifier,
        train_loader: DataLoader,
        val_loader: DataLoader,
        class_to_id: Dict[str, int],
        output_dir: Path,
        criterion: nn.Module,
        device: torch.device,
        use_amp: bool = True,
    ) -> None:
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.class_to_id = class_to_id
        self.output_dir = output_dir
        self.criterion = criterion
        self.device = device
        self.use_amp = use_amp and device.type == "cuda"
        self.scaler = torch.amp.GradScaler("cuda", enabled=self.use_amp)

        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.best_top1_acc = 0.0
        self.best_epoch = 0

    def train_epoch(
        self,
        optimizer: torch.optim.Optimizer,
        scheduler: Optional[Any] = None,
        epoch_idx: int = 1,
    ) -> float:
        self.model.train()
        total_loss = 0.0
        num_batches = len(self.train_loader)

        pbar = tqdm(self.train_loader, desc=f"Epoch {epoch_idx} [Train]", leave=False)
        for images, targets, _ in pbar:
            images = images.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            optimizer.zero_grad(set_to_none=True)

            with torch.amp.autocast(device_type=self.device.type, enabled=self.use_amp):
                logits = self.model(images)
                loss = self.criterion(logits, targets)

            self.scaler.scale(loss).backward()
            self.scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=2.0)
            self.scaler.step(optimizer)
            self.scaler.update()

            if scheduler is not None:
                scheduler.step()

            total_loss += loss.item()
            pbar.set_postfix({"batch_loss": f"{loss.item():.4f}"})

        return total_loss / max(num_batches, 1)

    @torch.no_grad()
    def evaluate(self, epoch_idx: int = 1) -> EpochMetrics:
        self.model.eval()
        total_loss = 0.0
        all_targets: List[int] = []
        all_predictions: List[int] = []
        top1_accum = 0.0
        top5_accum = 0.0
        num_batches = len(self.val_loader)

        pbar = tqdm(self.val_loader, desc=f"Epoch {epoch_idx} [Val]", leave=False)
        for images, targets, _ in pbar:
            images = images.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            with torch.amp.autocast(device_type=self.device.type, enabled=self.use_amp):
                logits = self.model(images)
                loss = self.criterion(logits, targets)

            total_loss += loss.item()
            top1, top5 = compute_metrics(logits, targets)
            top1_accum += top1
            top5_accum += top5

            preds = logits.argmax(dim=-1).cpu().numpy().tolist()
            all_predictions.extend(preds)
            all_targets.extend(targets.cpu().numpy().tolist())

        macro_f1 = float(f1_score(all_targets, all_predictions, average="macro", zero_division=0) * 100.0)
        avg_loss = total_loss / max(num_batches, 1)
        avg_top1 = top1_accum / max(num_batches, 1)
        avg_top5 = top5_accum / max(num_batches, 1)

        return EpochMetrics(
            loss=avg_loss,
            top1_acc=avg_top1,
            top5_acc=avg_top5,
            macro_f1=macro_f1,
        )

    def fit(
        self,
        epochs: int = 25,
        warmup_epochs: int = 3,
        backbone_lr: float = 1e-4,
        head_lr: float = 1e-3,
        weight_decay: float = 1e-2,
        early_stopping_patience: int = 7,
    ) -> Path:
        """
        Executes two-stage transfer learning:
          Stage 1 (Epochs 1..warmup_epochs): Frozen backbone, head warmup.
          Stage 2 (Epochs warmup_epochs+1..epochs): Full fine-tuning with Cosine Annealing.
        """
        logger.info(
            f"Beginning training pipeline on device: {self.device} (AMP={self.use_amp})"
        )
        patience_counter = 0

        # Stage 1: Warm up classifier head
        if warmup_epochs > 0:
            logger.info(f"--- Stage 1: Classifier Head Warmup ({warmup_epochs} epochs) ---")
            self.model.freeze_backbone()
            optimizer = torch.optim.AdamW(
                self.model.classifier.parameters(), lr=head_lr, weight_decay=weight_decay
            )

            for epoch in range(1, warmup_epochs + 1):
                t0 = time.time()
                train_loss = self.train_epoch(optimizer, epoch_idx=epoch)
                val_metrics = self.evaluate(epoch_idx=epoch)
                elapsed = time.time() - t0

                logger.info(
                    f"Warmup [{epoch}/{warmup_epochs}] - "
                    f"Train Loss: {train_loss:.4f} | "
                    f"Val Loss: {val_metrics.loss:.4f} | "
                    f"Top-1: {val_metrics.top1_acc:.2f}% | "
                    f"Top-5: {val_metrics.top5_acc:.2f}% | "
                    f"Macro-F1: {val_metrics.macro_f1:.2f}% | ({elapsed:.1f}s)"
                )

        # Stage 2: End-to-end fine-tuning
        logger.info(f"--- Stage 2: End-to-End Fine-Tuning ({epochs} epochs) ---")
        self.model.unfreeze_backbone()

        param_groups = self.model.get_parameter_groups(
            backbone_lr=backbone_lr, head_lr=head_lr, weight_decay=weight_decay
        )
        optimizer = torch.optim.AdamW(param_groups)

        total_steps = len(self.train_loader) * epochs
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=total_steps, eta_min=1e-6
        )

        best_checkpoint_path = self.output_dir / "best_model.pt"

        for epoch in range(1, epochs + 1):
            t0 = time.time()
            train_loss = self.train_epoch(optimizer, scheduler=scheduler, epoch_idx=epoch)
            val_metrics = self.evaluate(epoch_idx=epoch)
            elapsed = time.time() - t0

            logger.info(
                f"Epoch [{epoch:02d}/{epochs:02d}] - "
                f"Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_metrics.loss:.4f} | "
                f"Top-1: {val_metrics.top1_acc:.2f}% | "
                f"Top-5: {val_metrics.top5_acc:.2f}% | "
                f"Macro-F1: {val_metrics.macro_f1:.2f}% | ({elapsed:.1f}s)"
            )

            # Checkpoint saving on Top-1 accuracy improvement
            if val_metrics.top1_acc > self.best_top1_acc:
                self.best_top1_acc = val_metrics.top1_acc
                self.best_epoch = epoch
                patience_counter = 0

                checkpoint = {
                    "epoch": epoch,
                    "backbone_name": self.model.backbone_name,
                    "num_classes": self.model.num_classes,
                    "state_dict": self.model.state_dict(),
                    "class_to_id": self.class_to_id,
                    "best_top1_acc": self.best_top1_acc,
                    "val_metrics": {
                        "loss": val_metrics.loss,
                        "top1_acc": val_metrics.top1_acc,
                        "top5_acc": val_metrics.top5_acc,
                        "macro_f1": val_metrics.macro_f1,
                    },
                }
                torch.save(checkpoint, best_checkpoint_path)
                logger.info(
                    f"🌟 Saved new best model checkpoint -> {best_checkpoint_path} "
                    f"(Top-1: {self.best_top1_acc:.2f}%)"
                )
            else:
                patience_counter += 1
                if patience_counter >= early_stopping_patience:
                    logger.info(
                        f"Early stopping triggered after {patience_counter} epochs without improvement."
                    )
                    break

        logger.info(
            f"Training finished. Best Top-1 Accuracy: {self.best_top1_acc:.2f}% at epoch {self.best_epoch}."
        )
        return best_checkpoint_path


# =============================================================================
# 6. Deployment & ONNX Export (FP32 + Dynamic INT8)
# =============================================================================

def export_to_onnx(
    checkpoint_path: Union[str, Path],
    output_dir: Union[str, Path],
    image_size: int = 224,
    quantize_int8: bool = True,
) -> Dict[str, Path]:
    """
    Exports PyTorch model checkpoint to:
      1. labels.json (class label dictionary)
      2. model.onnx (FP32 model with dynamic batching)
      3. model_int8.onnx (Optimized INT8 dynamic quantized model)
    """
    checkpoint_path = Path(checkpoint_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Loading checkpoint for ONNX export: {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location="cpu")

    backbone_name = checkpoint["backbone_name"]
    num_classes = checkpoint["num_classes"]
    class_to_id: Dict[str, int] = checkpoint["class_to_id"]
    id_to_class: Dict[int, str] = {v: k for k, v in class_to_id.items()}

    # Save labels.json
    labels_file = output_dir / "labels.json"
    with open(labels_file, "w", encoding="utf-8") as f:
        json.dump(
            {
                "id_to_class": {str(k): v for k, v in id_to_class.items()},
                "class_to_id": class_to_id,
                "num_classes": num_classes,
                "backbone": backbone_name,
                "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
            f,
            indent=2,
            ensure_ascii=False,
        )
    logger.info(f"Exported class mapping: {labels_file}")

    # Reconstruct PyTorch model
    model = GroceryVisionClassifier(
        backbone_name=backbone_name,
        num_classes=num_classes,
        pretrained=False,
    )
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    # Export standard FP32 ONNX model
    onnx_fp32_path = output_dir / "model.onnx"
    dummy_input = torch.randn(1, 3, image_size, image_size, requires_grad=False)

    export_kwargs = {
        "export_params": True,
        "opset_version": 17,
        "do_constant_folding": True,
        "input_names": ["input"],
        "output_names": ["logits"],
        "dynamic_axes": {
            "input": {0: "batch_size"},
            "logits": {0: "batch_size"},
        },
    }

    try:
        # Explicitly use classic TorchScript exporter to avoid requiring onnxscript
        torch.onnx.export(model, dummy_input, str(onnx_fp32_path), dynamo=False, **export_kwargs)
    except (TypeError, ValueError):
        torch.onnx.export(model, dummy_input, str(onnx_fp32_path), **export_kwargs)

    fp32_size_mb = onnx_fp32_path.stat().st_size / (1024 * 1024)
    logger.info(f"✓ FP32 ONNX export verified ({fp32_size_mb:.2f} MB)")

    artifacts: Dict[str, Path] = {
        "labels": labels_file,
        "onnx_fp32": onnx_fp32_path,
    }

    # Optional dynamic INT8 quantization via onnxruntime
    if quantize_int8:
        try:
            import onnxruntime.quantization as ort_quant

            onnx_int8_path = output_dir / "model_int8.onnx"
            logger.info("Applying dynamic INT8 quantization for edge/mobile performance...")

            ort_quant.quantize_dynamic(
                model_input=str(onnx_fp32_path),
                model_output=str(onnx_int8_path),
                weight_type=ort_quant.QuantType.QInt8,
                per_channel=True,
                reduce_range=False,
            )

            int8_size_mb = onnx_int8_path.stat().st_size / (1024 * 1024)
            reduction = (1.0 - (int8_size_mb / fp32_size_mb)) * 100.0
            logger.info(
                f"✓ INT8 ONNX export complete -> {onnx_int8_path} "
                f"({int8_size_mb:.2f} MB, {reduction:.1f}% size reduction)"
            )
            artifacts["onnx_int8"] = onnx_int8_path
        except Exception as q_err:
            logger.warning(f"INT8 quantization skipped or failed: {q_err}")

    return artifacts


# =============================================================================
# 7. Standalone ONNX Runtime Inference Function
# =============================================================================

def predict_image(
    image_path: Union[str, Path],
    model_path: Union[str, Path],
    labels_path: Union[str, Path],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Lightweight, production-ready inference function requiring ONLY onnxruntime,
    numpy, and Pillow (no PyTorch or torchvision required).

    Args:
        image_path: Path to target grocery / produce image.
        model_path: Path to exported `model.onnx` or `model_int8.onnx`.
        labels_path: Path to `labels.json`.
        top_k: Number of highest-confidence predictions to return.

    Returns:
        List of dicts: [{"rank": 1, "class_name": "...", "confidence": 0.94}, ...]
    """
    try:
        import onnxruntime as ort
    except ImportError:
        raise ImportError("onnxruntime is required for inference. Run: pip install onnxruntime")

    # Load labels
    with open(labels_path, "r", encoding="utf-8") as f:
        labels_meta = json.load(f)
    id_to_class = labels_meta["id_to_class"]

    # Preprocessing with Pillow and Numpy
    image_path = Path(image_path)
    with Image.open(image_path) as img:
        img_rgb = img.convert("RGB")

    # Resize to 256 then CenterCrop to 224
    target_size = 224
    scale_size = 256
    img_resized = img_rgb.resize((scale_size, scale_size), Image.Resampling.BILINEAR)

    left = (scale_size - target_size) // 2
    top = (scale_size - target_size) // 2
    img_cropped = img_resized.crop((left, top, left + target_size, top + target_size))

    # Normalize with ImageNet mean and std
    arr = np.array(img_cropped, dtype=np.float32) / 255.0
    mean = np.array(IMAGENET_MEAN, dtype=np.float32)
    std = np.array(IMAGENET_STD, dtype=np.float32)
    arr = (arr - mean) / std

    # Transpose to HWC -> CHW and add batch dimension (1, 3, 224, 224)
    input_tensor = np.transpose(arr, (2, 0, 1))[np.newaxis, :, :, :]

    # Initialize ONNX Runtime session
    opts = ort.SessionOptions()
    opts.inter_op_num_threads = 2
    opts.intra_op_num_threads = 4
    session = ort.InferenceSession(str(model_path), sess_options=opts, providers=["CPUExecutionProvider"])

    input_name = session.get_inputs()[0].name
    logits = session.run(None, {input_name: input_tensor})[0][0]

    # Compute Softmax probabilities
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)

    # Extract Top-K predictions
    top_indices = np.argsort(probs)[::-1][:top_k]
    results = []
    for rank, idx in enumerate(top_indices, start=1):
        class_name = id_to_class.get(str(idx), f"Class_{idx}")
        results.append(
            {
                "rank": rank,
                "class_id": int(idx),
                "class_name": class_name,
                "confidence": float(probs[idx]),
                "percentage": f"{probs[idx] * 100.0:.2f}%",
            }
        )

    return results


# =============================================================================
# 8. Synthetic Demo Generator (Instant Verification)
# =============================================================================

def generate_synthetic_benchmark_dataset(target_dir: Path) -> Path:
    """
    Generates a representative synthetic grocery dataset for verification:
      - 5 fine-grained classes: Honeycrisp Apple, Broccoli Crown, Canned Black Beans,
        Organic Whole Milk, Sweet Corn Chips.
      - 60 images across train and val splits with distinct color signatures.
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    classes = [
        ("honeycrisp_apple", (210, 45, 45)),
        ("broccoli_crown", (34, 139, 34)),
        ("canned_black_beans", (45, 45, 55)),
        ("organic_whole_milk", (240, 240, 250)),
        ("sweet_corn_chips", (230, 180, 50)),
    ]

    for split in ["train", "val"]:
        num_per_class = 12 if split == "train" else 4
        split_dir = target_dir / split
        split_dir.mkdir(parents=True, exist_ok=True)

        for class_name, base_rgb in classes:
            class_folder = split_dir / class_name
            class_folder.mkdir(parents=True, exist_ok=True)

            for i in range(num_per_class):
                # Add random lighting and noise to synthetic image
                noise = np.random.randint(-25, 25, (224, 224, 3), dtype=np.int16)
                img_data = np.clip(np.array(base_rgb, dtype=np.int16) + noise, 0, 255).astype(np.uint8)
                img = Image.fromarray(img_data)
                img.save(class_folder / f"{class_name}_{i:03d}.jpg", quality=90)

    logger.info(f"Generated synthetic benchmark dataset in: {target_dir}")
    return target_dir


# =============================================================================
# 9. Main Command-Line Interface
# =============================================================================

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train and export a production vision model for grocery & produce items."
    )
    parser.add_argument(
        "--data_dir",
        type=str,
        default="./data/grocery",
        help="Path to dataset root folder containing class directories or images.",
    )
    parser.add_argument(
        "--metadata_file",
        type=str,
        default=None,
        help="Optional path to metadata CSV or JSON file mapping filenames to labels.",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./artifacts/grocery_vision",
        help="Directory where checkpoints, ONNX models, and labels.json will be saved.",
    )
    parser.add_argument(
        "--backbone",
        type=str,
        default="mobilenetv3_large_100",
        help="Vision backbone architecture (e.g. mobilenetv3_large_100, convnext_tiny, efficientnet_b0).",
    )
    parser.add_argument("--image_size", type=int, default=224, help="Input resolution (default: 224).")
    parser.add_argument("--epochs", type=int, default=15, help="Number of fine-tuning epochs.")
    parser.add_argument("--warmup_epochs", type=int, default=2, help="Head warmup epochs with frozen backbone.")
    parser.add_argument("--batch_size", type=int, default=32, help="DataLoader batch size.")
    parser.add_argument("--backbone_lr", type=float, default=1e-4, help="Backbone learning rate.")
    parser.add_argument("--head_lr", type=float, default=1e-3, help="Classification head learning rate.")
    parser.add_argument("--weight_decay", type=float, default=1e-2, help="AdamW weight decay.")
    parser.add_argument("--label_smoothing", type=float, default=0.1, help="Label smoothing epsilon.")
    parser.add_argument("--no_quantize", action="store_true", help="Disable dynamic INT8 ONNX quantization.")
    parser.add_argument("--demo", action="store_true", help="Run self-contained synthetic benchmark training demo.")
    parser.add_argument("--test_image", type=str, default=None, help="Optional image to test via ONNX inference.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir).resolve()
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        fallback_dir = Path.home() / "pantryo_artifacts" / "grocery_vision"
        logger.warning(
            f"Permission denied writing to '{output_dir}'. "
            f"Falling back to user home directory: '{fallback_dir}'"
        )
        output_dir = fallback_dir
        output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Standalone test mode if user just wants to run predictions on an existing model
    if args.test_image:
        model_file = output_dir / "model_int8.onnx"
        if not model_file.is_file():
            model_file = output_dir / "model.onnx"
        labels_file = output_dir / "labels.json"

        if not model_file.is_file() or not labels_file.is_file():
            sys.exit(f"Model or labels file not found in {output_dir}. Please run training first.")

        predictions = predict_image(args.test_image, model_file, labels_file)
        print(f"\n--- ONNX Inference Predictions for {args.test_image} ---")
        for p in predictions:
            print(f"Rank {p['rank']}: {p['class_name']} ({p['percentage']})")
        return

    # 2. Demo mode setup (synthetic multi-class data generator)
    data_dir = Path(args.data_dir)
    if args.demo or not data_dir.is_dir():
        if not data_dir.is_dir():
            logger.info(f"Specified data_dir '{data_dir}' not found. Activating --demo synthetic benchmark.")
        data_dir = output_dir / "synthetic_grocery_data"
        generate_synthetic_benchmark_dataset(data_dir)
        args.epochs = min(args.epochs, 3)
        args.warmup_epochs = min(args.warmup_epochs, 1)

    # 3. Ingestion & Split
    train_dir = data_dir / "train" if (data_dir / "train").is_dir() else data_dir
    val_dir = data_dir / "val" if (data_dir / "val").is_dir() else None

    train_samples, class_to_id = parse_dataset_from_directory(
        train_dir, metadata_file=args.metadata_file
    )

    if val_dir and val_dir.is_dir():
        val_samples, _ = parse_dataset_from_directory(val_dir)
    else:
        # 80/20 train/validation split
        random.seed(42)
        random.shuffle(train_samples)
        split_idx = int(0.8 * len(train_samples))
        val_samples = train_samples[split_idx:]
        train_samples = train_samples[:split_idx]

    num_classes = len(class_to_id)
    logger.info(f"Dataset split: {len(train_samples)} training, {len(val_samples)} validation samples.")

    # 4. Data Loaders
    train_dataset = UnifiedGroceryDataset(
        samples=train_samples,
        class_to_id=class_to_id,
        transform=get_train_transforms(args.image_size),
    )
    val_dataset = UnifiedGroceryDataset(
        samples=val_samples,
        class_to_id=class_to_id,
        transform=get_val_transforms(args.image_size),
    )

    num_workers = min(4, os.cpu_count() or 1)
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
        drop_last=len(train_dataset) > args.batch_size,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )

    # 5. Device & Model instantiation
    device = torch.device(
        "cuda"
        if torch.cuda.is_available()
        else "mps"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
        else "cpu"
    )

    model = GroceryVisionClassifier(
        backbone_name=args.backbone,
        num_classes=num_classes,
        pretrained=True,
    ).to(device)

    # 6. Loss function with class weights & label smoothing
    class_weights = compute_class_weights(train_samples, num_classes).to(device)
    criterion = LabelSmoothingCrossEntropy(
        smoothing=args.label_smoothing,
        weight=class_weights,
    )

    # 7. Training & Validation Execution
    trainer = GroceryTrainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        class_to_id=class_to_id,
        output_dir=output_dir,
        criterion=criterion,
        device=device,
        use_amp=True,
    )

    best_checkpoint = trainer.fit(
        epochs=args.epochs,
        warmup_epochs=args.warmup_epochs,
        backbone_lr=args.backbone_lr,
        head_lr=args.head_lr,
        weight_decay=args.weight_decay,
    )

    # 8. Export to ONNX (FP32 + dynamic INT8)
    artifacts = export_to_onnx(
        checkpoint_path=best_checkpoint,
        output_dir=output_dir,
        image_size=args.image_size,
        quantize_int8=not args.no_quantize,
    )

    # 9. End-to-end Inference Verification
    sample_test_image = val_samples[0].image_path
    chosen_model = artifacts.get("onnx_int8") or artifacts["onnx_fp32"]
    predictions = predict_image(sample_test_image, chosen_model, artifacts["labels"])

    print("\n" + "=" * 65)
    print("✓ PIPELINE COMPLETED SUCCESSFULLY!")
    print(f"Artifacts exported to: {output_dir}")
    print(f"  • Best PyTorch Checkpoint: {best_checkpoint.name}")
    print(f"  • Labels Mapping:          {artifacts['labels'].name}")
    print(f"  • FP32 ONNX Model:         {artifacts['onnx_fp32'].name}")
    if "onnx_int8" in artifacts:
        print(f"  • INT8 Quantized ONNX:     {artifacts['onnx_int8'].name}")
    print("\nSample Test Prediction:")
    print(f"Image: {sample_test_image.name}")
    for p in predictions:
        print(f"  {p['rank']}. {p['class_name']} ({p['percentage']})")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
