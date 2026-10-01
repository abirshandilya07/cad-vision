"""STUB API. /predict returns placeholder values so the frontend can be built now.
Replace predict logic with real models loaded from ml/artifacts (owner B)."""
import json
import os
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .services.model_store import get_store

ROOT = Path(os.getenv("REPO_ROOT", Path(__file__).resolve().parents[2]))
SCHEMA_PATH = ROOT / "ml" / "schema" / "feature_schema.json"
SAMPLES_DIR = ROOT / "data" / "samples"

app = FastAPI(title="CAD-Vision API", version="0.1.0-stub")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class PredictRequest(BaseModel):
    features: Dict[str, Any]


class Prediction(BaseModel):
    ...

class PredictResponse(BaseModel):
    ...

@app.get("/health")
def health():
    return get_store().status()


@app.post("/predict")
def predict(req: PredictRequest):
    store = get_store()
    return store.predict(req.features)

@app.get("/schema")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


@app.get("/samples")
def samples():
    return {p.stem: json.loads(p.read_text()) for p in sorted(SAMPLES_DIR.glob("*.json"))}
