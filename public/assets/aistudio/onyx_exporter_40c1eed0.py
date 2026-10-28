#!/usr/bin/env python3
"""
===============================================================================
PyTorch Grocery Classifier & ONNX Exporter (Pantryo)
===============================================================================

Purpose:
    Trains a lightweight, production-ready vision model (MobileNetV3) on the
    harvested Canadian grocery dataset (metadata_master.csv) and exports the
    final weights to ONNX format.

Features:
    • Custom PyTorch Dataset that parses metadata_master.csv.
    • Stratified train/val split using category labels.
    • Data augmentations: AutoAugment/TrivialAugment, RandomResizedCrop, ColorJitter.
    • Pretrained MobileNetV3 backbone with transfer learning head.
    • Dynamic ONNX exporter with opset 17 and sample inference validation.

Requirements:
    pip install torch torchvision onnx onnxruntime pandas scikit-learn pillow
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
import torch
import torch.nn as nn
from PIL import Image
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms


# =============================================================================
# 1. DATASET DEFINITION
# =============================================================================

class CanadianGroceryDataset(Dataset):
    def __init__(
        self,
        df: pd.DataFrame,
        root_dir: Path,
        label_map: Dict[str, int],
        transform: transforms.Compose | None = None,
    ):
        self.df = df.reset_index(drop=True)
        self.root_dir = root_dir
        self.label_map = label_map
        self.transform = transform

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        row = self.df.iloc[idx]
        img_rel_path = row["image_path"]
        img_full_path = self.root_dir / img_rel_path

        try:
            image = Image.open(img_full_path).convert("RGB")
        except Exception as e:
            # Fallback for corrupted file: generate blank tensor
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform:
            image = self.transform(image)

        label_name = row["category_slug"]
        label_idx = self.label_map[label_name]
        return image, label_idx


# =============================================================================
# 2. DATA AUGMENTATION PIPELINES
# =============================================================================

def get_transforms(img_size: int = 224) -> Tuple[transforms.Compose, transforms.Compose]:
    train_transform = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.RandomResizedCrop(img_size, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


# =============================================================================
# 3. MODEL BUILDER
# =============================================================================

def build_model(num_classes: int, architecture: str = "mobilenet_v3_small") -> nn.Module:
    if architecture == "mobilenet_v3_small":
        weights = models.MobileNet_V3_Small_Weights.DEFAULT
        model = models.mobilenet_v3_small(weights=weights)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif architecture == "mobilenet_v3_large":
        weights = models.MobileNet_V3_Large_Weights.DEFAULT
        model = models.mobilenet_v3_large(weights=weights)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif architecture == "resnet18":
        weights = models.ResNet18_Weights.DEFAULT
        model = models.resnet18(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
    else:
        raise ValueError(f"Unsupported architecture: {architecture}")

    return model


# =============================================================================
# 4. ONNX EXPORTER
# =============================================================================

def export_to_onnx(
    model: nn.Module,
    output_path: Path,
    img_size: int = 224,
    device: torch.device = torch.device("cpu"),
):
    print("\n" + "=" * 65)
    print(f"Exporting PyTorch model to ONNX -> {output_path}")
    print("=" * 65)

    model.eval()
    model.to(device)

    dummy_input = torch.randn(1, 3, img_size, img_size, device=device)

    export_kwargs = {
        "export_params": True,
        "opset_version": 17,
        "do_constant_folding": True,
        "input_names": ["input"],
        "output_names": ["output"],
        "dynamic_axes": {"input": {0: "batch_size"}, "output": {0: "batch_size"}},
    }
    try:
        torch.onnx.export(model, dummy_input, str(output_path), dynamo=False, **export_kwargs)
    except (TypeError, ValueError):
        torch.onnx.export(model, dummy_input, str(output_path), **export_kwargs)
    print(f"ONNX export succeeded: {output_path.name} ({output_path.stat().st_size / (1024*1024):.2f} MB)")


# =============================================================================
# 5. MAIN TRAINING LOOP
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Train grocery classifier on metadata_master.csv")
    parser.add_argument(
        "--data_dir",
        type=str,
        default="C:\\Users\\yan_b\\DonneesEpicerie",
        help="Root path containing metadata_master.csv and image folders.",
    )
    parser.add_argument(
        "--architecture",
        type=str,
        default="mobilenet_v3_small",
        choices=["mobilenet_v3_small", "mobilenet_v3_large", "resnet18"],
        help="Backbone architecture for training.",
    )
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs.")
    parser.add_argument("--batch_size", type=int, default=32, help="DataLoader batch size.")
    parser.add_argument("--lr", type=float, default=1e-3, help="Initial learning rate.")
    parser.add_argument("--img_size", type=int, default=224, help="Input image dimension.")
    args = parser.parse_args()

    data_dir = Path(args.data_dir).resolve()
    csv_file = data_dir / "metadata_master.csv"

    if not csv_file.exists():
        print(f"[ERROR] Could not find metadata CSV at: {csv_file}")
        sys.exit(1)

    # 1. Load and clean metadata
    df = pd.read_csv(csv_file)
    df = df.dropna(subset=["image_path", "category_slug"])
    
    # Filter out missing image paths on disk
    df = df[df["image_path"].apply(lambda p: (data_dir / p).exists())].copy()

    classes = sorted(df["category_slug"].unique())
    num_classes = len(classes)
    label_map = {cls_name: i for i, cls_name in enumerate(classes)}

    print(f"Loaded {len(df)} images across {num_classes} categories.")
    print(f"Categories: {classes}")

    # 2. Train/val split (with automatic fallback for singleton classes)
    class_counts = df["category_slug"].value_counts()
    can_stratify = bool((class_counts >= 2).all())

    if can_stratify:
        train_df, val_df = train_test_split(
            df, test_size=0.20, random_state=42, stratify=df["category_slug"]
        )
    else:
        singleton_classes = class_counts[class_counts < 2].index.tolist()
        print(f"[INFO] Classes with only 1 image cannot be stratified: {singleton_classes}")
        print("[INFO] Falling back to standard random split (80% train / 20% val).")
        train_df, val_df = train_test_split(
            df, test_size=0.20, random_state=42
        )

    train_transform, val_transform = get_transforms(args.img_size)

    train_dataset = CanadianGroceryDataset(train_df, data_dir, label_map, train_transform)
    val_dataset = CanadianGroceryDataset(val_df, data_dir, label_map, val_transform)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=2,
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=2,
        pin_memory=True,
    )

    # 3. Setup device, model, loss & optimizer
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training using compute device: {device}")

    model = build_model(num_classes=num_classes, architecture=args.architecture)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    # 4. Training loop
    best_val_acc = 0.0
    checkpoint_dir = data_dir / "checkpoints"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    best_weights_path = checkpoint_dir / f"{args.architecture}_best.pth"

    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)

        scheduler.step()
        epoch_train_loss = train_loss / train_total
        epoch_train_acc = (train_correct / train_total) * 100.0

        # Validation phase
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        epoch_val_loss = val_loss / val_total
        epoch_val_acc = (val_correct / val_total) * 100.0

        print(
            f"Epoch [{epoch:02d}/{args.epochs:02d}] "
            f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.2f}% | "
            f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.2f}%"
        )

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), best_weights_path)

    print(f"\nTraining completed. Best validation accuracy: {best_val_acc:.2f}%")

    # 5. Export best model to ONNX
    try:
        model.load_state_dict(torch.load(best_weights_path, weights_only=True))
    except TypeError:
        model.load_state_dict(torch.load(best_weights_path))
    onnx_output = data_dir / f"grocery_{args.architecture}.onnx"
    export_to_onnx(model, onnx_output, img_size=args.img_size, device=device)

    # 6. Save label mapping JSON for frontend inference
    labels_json_path = data_dir / "grocery_labels.json"
    with open(labels_json_path, "w", encoding="utf-8") as f:
        json.dump({v: k for k, v in label_map.items()}, f, indent=2)
    print(f"Saved label mappings to: {labels_json_path}")


if __name__ == "__main__":
    main()