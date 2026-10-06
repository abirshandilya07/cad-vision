import json
import os
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .services.model_store import get_store,ModelInputError,ExplanationUnavailableError
from fastapi.responses import JSONResponse
ROOT = Path(os.getenv("REPO_ROOT", Path(__file__).resolve().parents[2]))
SCHEMA_PATH = ROOT / "ml" / "schema" / "feature_schema.json"
SAMPLES_DIR = ROOT / "data" / "samples"

app = FastAPI(title="CAD-Vision API", version="0.1.0-stub")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(ModelInputError)
async def model_input_error_handler(
    request: Request,
    exc: ModelInputError,
):
    return JSONResponse(
        status_code=422,
        content={
            "detail": str(exc)
        },
    )
@app.exception_handler(ExplanationUnavailableError)
async def explanation_unavailable_handler(
    request: Request,
    exc: ExplanationUnavailableError,
):
    return JSONResponse(
        status_code=503,
        content={
            "detail": str(exc)
        },
    )
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

@app.post("/explain")
def explain(req: PredictRequest):
    store = get_store()
    return store.explain(req.features)

@app.get("/schema")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


@app.get("/samples")
def samples():
    return {p.stem: json.loads(p.read_text()) for p in sorted(SAMPLES_DIR.glob("*.json"))}
