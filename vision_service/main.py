import os
import io
import time
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import onnxruntime as ort

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("pantryo-vision")

# Model directory resolution
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODELS_DIR = (
    Path(os.environ.get("MODELS_DIR"))
    if os.environ.get("MODELS_DIR")
    else (BASE_DIR.parent / "public" / "models" / "grocery_model")
)
MODELS_DIR = Path(os.environ.get("MODELS_DIR", DEFAULT_MODELS_DIR))
logger.info(f"Target models directory: {MODELS_DIR}")

# Bilingual department dictionary for Super C taxonomy
DEPARTMENT_METADATA = {
    "fruits-legumes": {
        "slug": "fruits-legumes",
        "pantryo_category": "Produce",
        "name_fr": "Fruits & Légumes",
        "name_en": "Produce",
        "icon": "Apple",
        "default_location": "Fridge",
    },
    "produits-laitiers-oeufs": {
        "slug": "produits-laitiers-oeufs",
        "pantryo_category": "Dairy & Eggs",
        "name_fr": "Produits laitiers & Œufs",
        "name_en": "Dairy & Eggs",
        "icon": "Milk",
        "default_location": "Fridge",
    },
    "viandes-volailles": {
        "slug": "viandes-volailles",
        "pantryo_category": "Meat & Seafood",
        "name_fr": "Viandes & Volailles",
        "name_en": "Meat & Poultry",
        "icon": "Beef",
        "default_location": "Fridge",
    },
    "poissonnerie-fruits-de-mer": {
        "slug": "poissonnerie-fruits-de-mer",
        "pantryo_category": "Meat & Seafood",
        "name_fr": "Poissonnerie & Fruits de mer",
        "name_en": "Fish & Seafood",
        "icon": "Fish",
        "default_location": "Fridge",
    },
    "garde-manger": {
        "slug": "garde-manger",
        "pantryo_category": "Pantry Staples",
        "name_fr": "Garde-manger",
        "name_en": "Pantry Staples",
        "icon": "Package",
        "default_location": "Pantry",
    },
    "boulangerie-patisserie": {
        "slug": "boulangerie-patisserie",
        "pantryo_category": "Bakery",
        "name_fr": "Boulangerie & Pâtisserie",
        "name_en": "Bakery",
        "icon": "Wheat",
        "default_location": "Pantry",
    },
    "surgeles": {
        "slug": "surgeles",
        "pantryo_category": "Frozen Meals",
        "name_fr": "Surgelés",
        "name_en": "Frozen Foods",
        "icon": "Snowflake",
        "default_location": "Freezer",
    },
    "boissons": {
        "slug": "boissons",
        "pantryo_category": "Beverages",
        "name_fr": "Boissons",
        "name_en": "Beverages",
        "icon": "Coffee",
        "default_location": "Pantry",
    },
    "collations-bonbons": {
        "slug": "collations-bonbons",
        "pantryo_category": "Snacks",
        "name_fr": "Collations & Bonbons",
        "name_en": "Snacks & Sweets",
        "icon": "Cookie",
        "default_location": "Pantry",
    },
}

# ImageNet normalization parameters
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 3, 1, 1)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 3, 1, 1)


class VisionEngine:
    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self.tier1_session: Optional[ort.InferenceSession] = None
        self.tier2_session: Optional[ort.InferenceSession] = None
        self.tier1_input_name: str = ""
        self.tier2_input_name: str = ""
        self.tier1_labels: Dict[int, str] = {}
        self.tier2_metadata: Dict[str, Dict[str, Any]] = {}
        self.tier2_index_to_key: Dict[int, str] = {}
        self.is_initialized: bool = False
        self.initialization_error: Optional[str] = None

    def initialize(self):
        """Loads both ONNX models with CPU execution provider and labels mapping."""
        try:
            logger.info("Initializing VisionEngine...")
            so = ort.SessionOptions()
            so.intra_op_num_threads = int(os.environ.get("ONNX_NUM_THREADS", "2"))
            so.inter_op_num_threads = 1
            so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

            providers = ["CPUExecutionProvider"]

            # 1. Load Tier 1 (Super C Aisle Classifier)
            t1_path = self.models_dir / "superc_grocery_model.onnx"
            t1_labels_path = self.models_dir / "superc_labels.json"

            if t1_path.exists() and t1_labels_path.exists():
                with open(t1_labels_path, "r", encoding="utf-8") as f:
                    raw_labels = json.load(f)
                    self.tier1_labels = {int(k): str(v) for k, v in raw_labels.items()}
                self.tier1_session = ort.InferenceSession(str(t1_path), sess_options=so, providers=providers)
                self.tier1_input_name = self.tier1_session.get_inputs()[0].name
                logger.info(f"Tier 1 model loaded from {t1_path} ({len(self.tier1_labels)} departments).")
            else:
                logger.warning(f"Tier 1 model file missing at {t1_path} or labels missing at {t1_labels_path}")

            # 2. Load Tier 2 (Granular 399 Produce Recognizer)
            t2_path = self.models_dir / "grocery_model.onnx"
            t2_meta_path = self.models_dir / "classes_metadata_399.json"
            t2_txt_path = self.models_dir / "classes_399.txt"

            if t2_path.exists():
                self.tier2_session = ort.InferenceSession(str(t2_path), sess_options=so, providers=providers)
                self.tier2_input_name = self.tier2_session.get_inputs()[0].name
                logger.info(f"Tier 2 model loaded from {t2_path}.")

                if t2_meta_path.exists():
                    with open(t2_meta_path, "r", encoding="utf-8") as f:
                        self.tier2_metadata = json.load(f)
                    for key, val in self.tier2_metadata.items():
                        idx = val.get("index")
                        if idx is not None:
                            self.tier2_index_to_key[int(idx)] = key

                if not self.tier2_index_to_key and t2_txt_path.exists():
                    with open(t2_txt_path, "r", encoding="utf-8") as f:
                        lines = [line.strip() for line in f if line.strip()]
                    for idx, line in enumerate(lines):
                        self.tier2_index_to_key[idx] = line
                        if line not in self.tier2_metadata:
                            self.tier2_metadata[line] = {
                                "index": idx,
                                "label_en": line.replace("_", " "),
                                "label_fr": line.replace("_", " "),
                                "category": "produce",
                            }

                logger.info(f"Tier 2 loaded {len(self.tier2_index_to_key)} produce classes.")
            else:
                logger.warning(f"Tier 2 model file missing at {t2_path}")

            self.is_initialized = bool(self.tier1_session or self.tier2_session)
            if not self.is_initialized:
                self.initialization_error = "Neither Tier 1 nor Tier 2 ONNX model could be loaded."
        except Exception as e:
            self.initialization_error = str(e)
            logger.exception("Failed to initialize VisionEngine")

    @staticmethod
    def preprocess_image(image_bytes: bytes) -> np.ndarray:
        """
        Converts raw image bytes to BCHW float32 tensor [1, 3, 224, 224]
        with ImageNet standard normalization:
        mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
        """
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image format: {e}")

        # Bilinear resize to 224x224
        img = img.resize((224, 224), Image.Resampling.BILINEAR)

        # Convert to numpy array [224, 224, 3], scale to [0.0, 1.0]
        arr = np.asarray(img, dtype=np.float32) / 255.0

        # Transpose to [3, 224, 224] (CHW) and add batch dimension -> [1, 3, 224, 224]
        tensor = np.transpose(arr, (2, 0, 1))[np.newaxis, :, :, :]

        # Apply ImageNet normalization
        tensor = (tensor - IMAGENET_MEAN) / IMAGENET_STD
        return tensor.astype(np.float32)

    @staticmethod
    def softmax(x: np.ndarray) -> np.ndarray:
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum(axis=-1, keepdims=True)

    def classify(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Executes hierarchical two-tier classification pipeline:
        1. Tier 1 classifies aisle/department.
        2. If fruits-legumes detected OR inside top 3 OR confidence < 0.65,
           automatically run Tier 2 granular produce recognizer.
        """
        t_start = time.perf_counter()
        tensor = self.preprocess_image(image_bytes)

        t1_top = None
        t1_alternatives: List[Dict[str, Any]] = []
        t2_result: Optional[Dict[str, Any]] = None
        t2_alternatives: List[Dict[str, Any]] = []
        tier2_triggered = False
        trigger_reason = "none"

        # -------------------------------------------------------------
        # Tier 1: Super C Store Department Classifier
        # -------------------------------------------------------------
        if self.tier1_session:
            t1_out = self.tier1_session.run(None, {self.tier1_input_name: tensor})[0][0]
            t1_probs = self.softmax(t1_out)
            top_indices = np.argsort(t1_probs)[::-1]

            top_idx = int(top_indices[0])
            top_slug = self.tier1_labels.get(top_idx, f"department_{top_idx}")
            top_conf = float(t1_probs[top_idx])
            top_meta = DEPARTMENT_METADATA.get(top_slug, {})

            t1_top = {
                "slug": top_slug,
                "pantryo_category": top_meta.get("pantryo_category", "Pantry Staples"),
                "name_fr": top_meta.get("name_fr", top_slug),
                "name_en": top_meta.get("name_en", top_slug),
                "icon": top_meta.get("icon", "Package"),
                "default_location": top_meta.get("default_location", "Pantry"),
                "confidence": round(top_conf, 4),
            }

            for idx in top_indices[1:4]:
                slug = self.tier1_labels.get(int(idx), f"department_{idx}")
                meta = DEPARTMENT_METADATA.get(slug, {})
                t1_alternatives.append({
                    "slug": slug,
                    "pantryo_category": meta.get("pantryo_category", "Pantry Staples"),
                    "name_fr": meta.get("name_fr", slug),
                    "name_en": meta.get("name_en", slug),
                    "confidence": round(float(t1_probs[idx]), 4),
                })

            top_3_slugs = [top_slug] + [alt["slug"] for alt in t1_alternatives[:2]]

            # Hierarchical trigger rules:
            # - Tier 1 top department is fruits-legumes
            # - OR fruits-legumes is among the top 3 department predictions
            # - OR Tier 1 top confidence is < 0.65
            if top_slug == "fruits-legumes":
                tier2_triggered = True
                trigger_reason = "top_department_is_produce"
            elif "fruits-legumes" in top_3_slugs:
                tier2_triggered = True
                trigger_reason = "produce_in_top_3_departments"
            elif top_conf < 0.65:
                tier2_triggered = True
                trigger_reason = "low_department_confidence"
        else:
            # If Tier 1 is absent, run Tier 2 directly
            tier2_triggered = True
            trigger_reason = "tier1_unavailable"

        # -------------------------------------------------------------
        # Tier 2: 399-Class Granular Produce Recognizer
        # -------------------------------------------------------------
        if tier2_triggered and self.tier2_session:
            t2_out = self.tier2_session.run(None, {self.tier2_input_name: tensor})[0][0]
            t2_probs = self.softmax(t2_out)
            top_t2_indices = np.argsort(t2_probs)[::-1]

            t2_top_idx = int(top_t2_indices[0])
            t2_conf = float(t2_probs[t2_top_idx])
            t2_key = self.tier2_index_to_key.get(t2_top_idx, f"produce_{t2_top_idx}")
            t2_meta = self.tier2_metadata.get(t2_key, {})

            # Clean readable names
            label_fr = t2_meta.get("label_fr") or t2_key.replace("_", " ")
            label_en = t2_meta.get("label_en") or t2_key.replace("_", " ")

            t2_result = {
                "detected": True,
                "class_key": t2_key,
                "class_index": t2_top_idx,
                "label_fr": label_fr,
                "label_en": label_en,
                "category": t2_meta.get("category", "produce"),
                "confidence": round(t2_conf, 4),
            }

            # Top 3 alternatives (ranks 2, 3, 4)
            for idx in top_t2_indices[1:4]:
                alt_idx = int(idx)
                alt_key = self.tier2_index_to_key.get(alt_idx, f"produce_{alt_idx}")
                alt_meta = self.tier2_metadata.get(alt_key, {})
                t2_alternatives.append({
                    "class_key": alt_key,
                    "class_index": alt_idx,
                    "label_fr": alt_meta.get("label_fr") or alt_key.replace("_", " "),
                    "label_en": alt_meta.get("label_en") or alt_key.replace("_", " "),
                    "confidence": round(float(t2_probs[alt_idx]), 4),
                })

            t2_result["alternatives"] = t2_alternatives

        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)

        return {
            "success": True,
            "latency_ms": latency_ms,
            "department": {
                **t1_top,
                "alternatives": t1_alternatives,
            } if t1_top else None,
            "produce": t2_result,
            "hierarchical_trigger": {
                "triggered": tier2_triggered,
                "reason": trigger_reason,
            },
        }


# Initialize FastAPI app and VisionEngine
app = FastAPI(
    title="Pantryo Vision Microservice",
    description="Edge CPU ONNX microservice with two-tier hierarchical grocery and produce vision.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = VisionEngine(MODELS_DIR)


@app.on_event("startup")
def on_startup():
    engine.initialize()


@app.get("/health")
def health_check():
    return {
        "status": "ok" if engine.is_initialized else "degraded",
        "models_dir": str(engine.models_dir),
        "tier1_loaded": engine.tier1_session is not None,
        "tier2_loaded": engine.tier2_session is not None,
        "produce_classes_count": len(engine.tier2_index_to_key),
        "department_classes_count": len(engine.tier1_labels),
        "initialization_error": engine.initialization_error,
    }


@app.get("/api/v1/departments")
def get_departments():
    return {
        "departments": list(DEPARTMENT_METADATA.values()),
        "mapping": engine.tier1_labels,
    }


@app.post("/api/v1/classify")
async def classify_image(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None),
):
    """
    Classifies a grocery item using two-tier ONNX edge inference:
    - Tier 1: Department / Aisle classification (Super C 9-class)
    - Tier 2: Granular Produce recognition (399 global produce & herb varieties)
    """
    image_bytes: Optional[bytes] = None

    if file is not None:
        image_bytes = await file.read()
    elif imageBase64:
        import base64
        clean = imageBase64
        if "base64," in clean:
            clean = clean.split("base64,")[1]
        image_bytes = base64.b64decode(clean)

    if not image_bytes:
        raise HTTPException(status_code=400, detail="No image provided. Upload a file or pass imageBase64.")

    try:
        result = engine.classify(image_bytes)
        return result
    except Exception as e:
        logger.exception("Inference error in /api/v1/classify")
        raise HTTPException(status_code=500, detail=str(e))
