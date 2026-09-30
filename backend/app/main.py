"""STUB API. /predict returns placeholder values so the frontend can be built now.
Replace predict logic with real models loaded from ml/artifacts (owner B)."""
import json
import os
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(os.getenv("REPO_ROOT", Path(__file__).resolve().parents[2]))
SCHEMA_PATH = ROOT / "ml" / "schema" / "feature_schema.json"
SAMPLES_DIR = ROOT / "data" / "samples"
THRESHOLD = 0.5

app = FastAPI(title="CAD-Vision API", version="0.1.0-stub")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class PredictRequest(BaseModel):
    features: Dict[str, Any]


class Prediction(BaseModel):
    probability: float
    label: int


class PredictResponse(BaseModel):
    cad: Prediction
    vessels: Dict[str, Prediction]
    stub: bool = True


def _pred(p: float) -> Prediction:
    p = max(0.0, min(1.0, p))
    return Prediction(probability=round(p, 3), label=int(p >= THRESHOLD))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    f = req.features
    age = float(f.get("Age", 55))
    bp = float(f.get("BP", 130))
    base = (age - 30) / 70 * 0.6 + (bp - 100) / 150 * 0.2
    base += 0.15 * float(f.get("Typical Chest Pain", 0)) + 0.1 * float(f.get("Tinversion", 0))
    return PredictResponse(
        cad=_pred(base + 0.1),
        vessels={"LAD": _pred(base + 0.05), "LCX": _pred(base - 0.15), "RCA": _pred(base - 0.05)},
    )


@app.get("/schema")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


@app.get("/samples")
def samples():
    return {p.stem: json.loads(p.read_text()) for p in sorted(SAMPLES_DIR.glob("*.json"))}
