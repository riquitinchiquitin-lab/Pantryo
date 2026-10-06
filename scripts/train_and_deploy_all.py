#!/usr/bin/env python3
"""
Pantryo All-In-One Vision Pipeline: Produce, Asian Groceries & Fresh Culinary Herbs
Downloads, consolidates, fine-tunes MobileNetV2, and exports to single-file ONNX.
Optimized for Minisforum UM790 Pro (AMD Ryzen 9 7940HS)
"""

import os
import sys
import time
import json
import shutil
import zipfile
import subprocess
import argparse
import gc
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models


# Canadian English -> French produce and culinary herb dictionary
FR_TRANSLATIONS = {
    # Fresh Culinary Herbs
    "Cilantro": "Coriandre",
    "Coriander": "Coriandre",
    "Parsley": "Persil",
    "Basil": "Basilic",
    "Mint": "Menthe",
    "Spearmint": "Menthe verte",
    "Peppermint": "Menthe poivrée",
    "Dill": "Aneth",
    "Rosemary": "Romarin",
    "Thyme": "Thym",
    "Oregano": "Origan",
    "Sage": "Sauge",
    "Chives": "Ciboulette",
    "Green_Onion": "Échalote verte",
    "Tarragon": "Estragon",
    "Bay_Leaf": "Feuille de laurier",
    "Lemongrass": "Citronnelle",

    # Leafy Greens, Stalks & Cabbages
    "Lettuce": "Laitue",
    "Romaine": "Laitue romaine",
    "Spinach": "Épinard",
    "Kale": "Chou frisé",
    "Celery": "Céleri",
    "Celeriac": "Céleri-rave",
    "Leek": "Poireau",
    "Asparagus": "Asperge",
    "Bok_Choy": "Bok choy",
    "Cabbage": "Chou",
    "Cauliflower": "Chou-fleur",
    "Broccoli": "Brocoli",
    "Brussels_Sprout": "Chou de Bruxelles",
    "Kohlrabi": "Chou-rave",
    "Artichoke": "Artichaut",

    # Roots, Tubers & Alliums
    "Potato": "Pomme de terre",
    "Sweet_Potato": "Patate douce",
    "Carrot": "Carotte",
    "Turnip": "Navet",
    "Rutabaga": "Rutabaga",
    "Beetroot": "Betterave",
    "Beet": "Betterave",
    "Radish": "Radis",
    "Parsnip": "Panais",
    "Onion": "Oignon",
    "Garlic": "Ail",
    "Ginger": "Gingembre",
    "Taro": "Taro",
    "Cassava": "Manioc",

    # Berries & Orchard Fruit
    "Blueberry": "Bleuet",
    "Wild_Blueberry": "Bleuet sauvage",
    "Cranberry": "Canneberge",
    "Strawberry": "Fraise",
    "Raspberry": "Framboise",
    "Blackberry": "Mûre",
    "Redcurrant": "Groseille rouge",
    "Gooseberry": "Groseille à maquereau",
    "Rhubarb": "Rhubarbe",
    "Apple": "Pomme",
    "Pear": "Poire",
    "Plum": "Prune",
    "Peach": "Pêche",
    "Nectarine": "Nectarine",
    "Apricot": "Abricot",
    "Cherry": "Cerise",
    "Quince": "Coing",

    # Nightshades, Pods & Squashes
    "Tomato": "Tomate",
    "Eggplant": "Aubergine",
    "Bell_Pepper": "Poivron",
    "Chili_Pepper": "Piment",
    "Jalapeno": "Piment Jalapeño",
    "Paprika": "Paprika",
    "Corn": "Maïs",
    "Sweetcorn": "Maïs sucré",
    "Peas": "Petits pois",
    "Soybeans": "Soya",
    "Okra": "Gombo",
    "Cucumber": "Concombre",
    "Zucchini": "Courgette",
    "Pumpkin": "Citrouille",
    "Squash": "Courge",
    "Bottle_Gourd": "Calebasse",
    "Bitter_Melon": "Margose",
    "Chayote": "Chayote",

    # Citrus & Tropical Produce
    "Orange": "Orange",
    "Clementine": "Clémentine",
    "Mandarine": "Mandarine",
    "Lemon": "Citron",
    "Lime": "Lime",
    "Grapefruit": "Pamplemousse",
    "Banana": "Banane",
    "Plantain": "Banane plantain",
    "Pineapple": "Ananas",
    "Mango": "Mangue",
    "Avocado": "Avocat",
    "Papaya": "Papaye",
    "Kiwi": "Kiwi",
    "Pomegranate": "Grenade",
    "Fig": "Figue",
    "Guava": "Goyave",
    "Dragonfruit": "Fruit du dragon",
    "Pitahaya": "Pitahaya",
    "Passion_Fruit": "Fruit de la passion",
    "Lychee": "Litchi",
    "Watermelon": "Pastèque",
    "Cantaloupe": "Cantaloup",
    "Melon": "Melon",
    "Grapes": "Raisin",

    # Fungi & Nuts
    "Mushroom": "Champignon",
    "Walnut": "Noix",
    "Hazelnut": "Noisette",
    "Chestnut": "Châtaigne",
    "Almond": "Amande",
    "Pistachio": "Pistache"
}

NAME_MAP = {
    # Herbs & Leaves
    "coriander": "Cilantro",
    "coriander_leaves": "Cilantro",
    "coriandrum_sativum": "Cilantro",
    "curled_parsley": "Parsley",
    "flat_parsley": "Parsley",
    "italian_parsley": "Parsley",
    "petroselinum_crispum": "Parsley",
    "sweet_basil": "Basil",
    "ocimum_basilicum": "Basil",
    "spearmint": "Mint",
    "peppermint": "Mint",
    "mentha": "Mint",
    "rosemary": "Rosemary",
    "salvia_rosmarinus": "Rosemary",
    "thyme": "Thyme",
    "thymus_vulgaris": "Thyme",
    "oregano": "Oregano",
    "origanum_vulgare": "Oregano",
    "dill": "Dill",
    "anethum_graveolens": "Dill",
    "sage": "Sage",
    "salvia_officinalis": "Sage",
    "chives": "Chives",
    "allium_schoenoprasum": "Chives",
    "scallion": "Green_Onion",
    "spring_onion": "Green_Onion",

    # Vegetables & Asian Grocer Produce
    "brinjal": "Eggplant",
    "capsicum": "Bell_Pepper",
    "chilli_pepper": "Chili_Pepper",
    "chili_pepper": "Chili_Pepper",
    "green_chilli": "Chili_Pepper",
    "bitter_gourd": "Bitter_Melon",
    "bottle_gourd": "Bottle_Gourd",
    "soy_beans": "Soybeans",
    "sweetcorn": "Corn",
    "sweet_potato": "Sweet_Potato",
    "chinese_cabbage": "Bok_Choy",
    "raddish": "Radish",
}

def clean_class_name(raw_name: str) -> str:
    cleaned = raw_name.strip().replace(" ", "_").replace("-", "_")
    lower = cleaned.lower()
    for k, v in NAME_MAP.items():
        if lower == k:
            return v
    return cleaned.title()

def translate_produce_fr(english_name: str) -> str:
    clean = english_name.replace("_", " ").title()
    for en_key, fr_val in sorted(FR_TRANSLATIONS.items(), key=lambda x: len(x[0]), reverse=True):
        clean_key = en_key.replace("_", " ")
        if clean_key.lower() in clean.lower():
            return clean.replace(clean_key, fr_val).replace(clean_key.lower(), fr_val.lower())
    return clean

def categorize_item(name: str) -> str:
    herbs = ["cilantro", "parsley", "basil", "mint", "dill", "rosemary", "thyme", "oregano", "sage", "chives", "lemongrass"]
    lower = name.lower()
    if any(h in lower for h in herbs):
        return "herb"
    return "produce"

def download_and_extract(dataset_slug: str, extract_dir: Path):
    extract_dir.mkdir(parents=True, exist_ok=True)
    if any(extract_dir.iterdir()):
        print(f"[*] Dataset '{dataset_slug}' already cached in {extract_dir}. Skipping.")
        return

    print(f"\n[*] Downloading {dataset_slug} via Kaggle API...")
    subprocess.run([
        sys.executable, "-m", "kaggle", "datasets", "download",
        "-d", dataset_slug, "-p", str(extract_dir)
    ], check=True)

    found_zips = list(extract_dir.glob("*.zip"))
    if not found_zips:
        raise FileNotFoundError(f"No zip found for {dataset_slug}")
    target_zip = found_zips[0]

    print(f"[*] Unpacking {target_zip.name}...")
    with zipfile.ZipFile(target_zip, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    try:
        target_zip.unlink()
    except Exception:
        pass

def merge_folder(source_dir: Path, target_dir: Path, tag: str = ""):
    if not source_dir.exists():
        return
    for class_folder in source_dir.iterdir():
        if class_folder.is_dir():
            norm_name = clean_class_name(class_folder.name)
            dest_folder = target_dir / norm_name
            dest_folder.mkdir(parents=True, exist_ok=True)

            for img in class_folder.iterdir():
                if img.is_file() and img.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                    dest_file = dest_folder / f"{tag}_{class_folder.name}_{img.name}"
                    if not dest_file.exists():
                        shutil.copy2(img, dest_file)

def prepare_unified_dataset(base_data_dir: Path) -> tuple[Path, Path]:
    merged_dir = base_data_dir / "unified_produce"
    train_dir = merged_dir / "Training"
    test_dir = merged_dir / "Test"

    if train_dir.exists() and len(list(train_dir.iterdir())) >= 300:
        print(f"[*] Unified produce dataset already assembled at: {merged_dir}")
        return train_dir, test_dir

    print("\n" + "=" * 70)
    print(" Fetching & Consolidating Datasets: Produce, Greens & Culinary Herbs")
    print("=" * 70)

    train_dir.mkdir(parents=True, exist_ok=True)
    test_dir.mkdir(parents=True, exist_ok=True)

    # 1. Fruits-360
    f360_raw = base_data_dir / "raw_fruits360"
    download_and_extract("moltean/fruits", f360_raw)
    for cand in [f360_raw] + list(f360_raw.rglob("*")):
        if cand.is_dir() and (cand / "Training").exists():
            print(f"[*] Ingesting Fruits-360 from {cand}...")
            merge_folder(cand / "Training", train_dir, "f360")
            merge_folder(cand / "Test", test_dir, "f360")
            break

    # 2. Vegetable Image Dataset
    veg_raw = base_data_dir / "raw_veg"
    download_and_extract("misrakahmed/vegetable-image-dataset", veg_raw)
    for cand in [veg_raw] + list(veg_raw.rglob("*")):
        if cand.is_dir() and (cand / "train").exists():
            print(f"[*] Ingesting Vegetable Image Dataset from {cand}...")
            merge_folder(cand / "train", train_dir, "veg")
            merge_folder(cand / "validation", test_dir, "veg")
            break

    # 3. Fruit & Vegetable Recognition 36
    fnv_raw = base_data_dir / "raw_fnv36"
    download_and_extract("kritikseth/fruit-and-vegetable-image-recognition", fnv_raw)
    for cand in [fnv_raw] + list(fnv_raw.rglob("*")):
        if cand.is_dir() and (cand / "train").exists():
            print(f"[*] Ingesting Fruits & Veg 36 from {cand}...")
            merge_folder(cand / "train", train_dir, "fnv36")
            merge_folder(cand / "validation", test_dir, "fnv36")
            break

    # 4. Herbify Dataset (Herbs & Aromatics)
    herbs_raw = base_data_dir / "raw_herbs"
    download_and_extract("ai4a-lab/herb-plant-classification-dataset", herbs_raw)
    herb_splits = [cand for cand in [herbs_raw] + list(herbs_raw.rglob("*")) if cand.is_dir() and (cand / "train").exists()]
    if herb_splits:
        target = herb_splits[0]
        print(f"[*] Ingesting Herbify from {target}...")
        merge_folder(target / "train", train_dir, "herb")
        test_split = target / "validation" if (target / "validation").exists() else target / "test"
        if test_split.exists():
            merge_folder(test_split, test_dir, "herb")
    else:
        for cand in [herbs_raw] + list(herbs_raw.rglob("*")):
            if cand.is_dir() and len([d for d in cand.iterdir() if d.is_dir()]) >= 5:
                print(f"[*] Ingesting Herbify categories from {cand}...")
                merge_folder(cand, train_dir, "herb")
                break

    # Guarantee validation coverage for all categories
    for train_cat in train_dir.iterdir():
        if train_cat.is_dir():
            test_cat = test_dir / train_cat.name
            if not test_cat.exists() or not any(test_cat.iterdir()):
                test_cat.mkdir(parents=True, exist_ok=True)
                sample = next(train_cat.iterdir(), None)
                if sample:
                    shutil.copy2(sample, test_cat / sample.name)

    total_classes = len(list(train_dir.iterdir()))
    print(f"\n[*] Merged dataset ready: {total_classes} total produce & herb classes indexed.")
    return train_dir, test_dir


def main():
    parser = argparse.ArgumentParser(description="Pantryo Master Produce Trainer & Exporter")
    parser.add_argument("--data-dir", type=str, default="./data", help="Base directory for training data")
    parser.add_argument("--output-dir", type=str, default="./output", help="Directory where model artifacts are saved")
    parser.add_argument("--deploy-dir", type=str, default=None, help="Optional direct path to Pantryo public model folder")
    parser.add_argument("--epochs", type=int, default=3, help="Training epochs (3 epochs recommended for Zen 4)")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size (64 works well with 32GB/64GB RAM)")
    parser.add_argument("--lr", type=float, default=0.001, help="Classifier head learning rate")
    parser.add_argument("--img-size", type=int, default=224, help="Model image resolution")
    parser.add_argument("--num-workers", type=int, default=6, help="DataLoader workers (6 recommended)")
    args = parser.parse_args()

    # Hardware Tuning for AMD Ryzen 9 7940HS
    threads = min(14, os.cpu_count() or 8)
    torch.set_num_threads(threads)
    device = torch.device("cpu")
    print(f"[*] Hardware Execution: CPU ({threads} Zen 4 Threads with AVX-512 VNNI)")

    # Download & prepare data
    base_data = Path(args.data_dir).resolve()
    train_dir, test_dir = prepare_unified_dataset(base_data)

    # Augmentations for both rigid produce and soft herb leaves
    train_transform = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((args.img_size, args.img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print("\n[*] Initializing DataLoaders...")
    train_ds = datasets.ImageFolder(str(train_dir), transform=train_transform)
    val_ds = datasets.ImageFolder(str(test_dir), transform=val_transform)

    num_classes = len(train_ds.classes)
    print(f"[*] Indexed {len(train_ds):,} training images across {num_classes} total produce & herb classes.")
    print(f"[*] Indexed {len(val_ds):,} validation images.")

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True,
        num_workers=args.num_workers, persistent_workers=(args.num_workers > 0)
    )
    val_loader = DataLoader(
        val_ds, batch_size=args.batch_size, shuffle=False,
        num_workers=args.num_workers, persistent_workers=(args.num_workers > 0)
    )

    print("[*] Instantiating MobileNetV2 with ImageNet pre-trained backbone...")
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW([
        {"params": model.features.parameters(), "lr": args.lr * 0.1},
        {"params": model.classifier.parameters(), "lr": args.lr}
    ], weight_decay=1e-4)

    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    os.makedirs(args.output_dir, exist_ok=True)
    best_acc = 0.0
    best_ckpt_path = os.path.join(args.output_dir, "best_checkpoint.pth")

    print("\n" + "=" * 70)
    print(f" Starting Fine-Tuning: {args.epochs} Epochs | Batch Size: {args.batch_size} | Workers: {args.num_workers}")
    print("=" * 70 + "\n")

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        model.train()
        running_loss, correct, total = 0.0, 0, 0

        for b_idx, (inputs, targets) in enumerate(train_loader):
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, pred = outputs.max(1)
            total += targets.size(0)
            correct += pred.eq(targets).sum().item()

            if (b_idx + 1) % 50 == 0 or (b_idx + 1) == len(train_loader):
                acc = 100.0 * correct / total
                print(f"  Epoch [{epoch:02d}/{args.epochs:02d}] Step [{b_idx+1:04d}/{len(train_loader):04d}] "
                      f"Loss: {loss.item():.4f} | Train Acc: {acc:.2f}%", end="\r", flush=True)

        scheduler.step()
        train_loss = running_loss / total
        train_acc = 100.0 * correct / total

        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * inputs.size(0)
                _, pred = outputs.max(1)
                val_total += targets.size(0)
                val_correct += pred.eq(targets).sum().item()

        val_acc = 100.0 * val_correct / val_total
        dt = time.time() - t0

        print(f"\n  [Epoch {epoch:02d}/{args.epochs:02d}] ({dt:.1f}s) "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss/val_total:.4f} Val Acc: {val_acc:.2f}%", flush=True)

        # Immediate checkpointing to disk
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_acc": best_acc,
                "classes": train_ds.classes,
                "img_size": args.img_size
            }, best_ckpt_path)
            print(f"  --> Saved new best checkpoint ({best_acc:.2f}%) to: {best_ckpt_path}", flush=True)

        gc.collect()

    # Load best checkpoint for ONNX export
    print("\n[*] Reloading best weights from disk for ONNX conversion...")
    checkpoint = torch.load(best_ckpt_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Single-file self-contained ONNX Export (opset 17)
    onnx_path = os.path.join(args.output_dir, "grocery_model.onnx")
    classes_path = os.path.join(args.output_dir, "classes.txt")
    meta_path = os.path.join(args.output_dir, "classes_metadata.json")

    print(f"[*] Exporting single-file ONNX model (opset 17) to: {onnx_path}...")
    dummy_input = torch.randn(1, 3, args.img_size, args.img_size, device=device)
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
    )

    onnx_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"[*] ONNX export complete! Size: {onnx_mb:.2f} MB")

    # Output classes.txt
    with open(classes_path, "w", encoding="utf-8") as f:
        for c in train_ds.classes:
            f.write(f"{c}\n")

    # Output metadata JSON with bilingual Canadian French & English names
    metadata = {}
    for idx, c in enumerate(train_ds.classes):
        clean_name = c.replace("_", " ").title()
        metadata[c] = {
            "index": idx,
            "label_en": clean_name,
            "label_fr": translate_produce_fr(clean_name),
            "category": categorize_item(clean_name)
        }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"[*] Successfully exported {len(metadata)} classes to {classes_path} and {meta_path}")

    # Optional auto-deployment directly into Pantryo web assets
    if args.deploy_dir:
        deploy_dir = Path(args.deploy_dir)
        deploy_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(onnx_path, deploy_dir / "grocery_model.onnx")
        shutil.copy2(classes_path, deploy_dir / "classes.txt")
        shutil.copy2(meta_path, deploy_dir / "classes_metadata.json")
        print(f"[*] Artifacts successfully deployed to {deploy_dir}")

    print("\n" + "=" * 70)
    print(f" Pipeline Complete! Best Validation Accuracy: {best_acc:.2f}%")
    print(f" Output Location: {os.path.abspath(args.output_dir)}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
