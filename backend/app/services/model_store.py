"""model_store.py  (Member B, Oct 2)

What this module does
---------------------
1. Loads feature_schema.json and the trained models ONCE, at startup.
2. Turns an API request ("features" object, see docs/API.md) into the exact one-row
   DataFrame the models were trained on: correct column order, dataset encoding
   (Y/N, Fmale ...) and the derived columns BMI and Obesity.
3. Returns predictions in the response shape frozen in docs/API.md.
4. If artifacts are missing or broken, falls back to a deterministic STUB so the API
   always starts. The stub is fake data, and `model_version` starts with "stub" so the
   frontend can show a "demo data" banner.

Artifact layout (agree this with A)
-----------------------------------
    artifacts/
        Cath_model.joblib     one file per target: Cath, LAD, LCX, RCA
        LAD_model.joblib
        LCX_model.joblib
        RCA_model.joblib
        VERSION               optional, one line of text, e.g. "2026-10-05-rf"

Each .joblib must be a fitted model (ideally an sklearn Pipeline) that:
  * accepts a DataFrame with the columns in feature_schema.json["model_feature_order"],
    holding the RAW dataset values (Y/N, Fmale, mild ...), and
  * has predict_proba().
If A's models expect already-encoded numbers instead, the only place to change is
`ModelStore._to_dataset_value`.

Environment variables (all optional)
------------------------------------
    SCHEMA_PATH      path to feature_schema.json  (default: searched upwards from this file)
    ARTIFACTS_DIR    folder with the .joblib files (default: <repo root>/artifacts)

SECURITY NOTE: joblib/pickle files can run code when loaded. Only load artifacts that
come from teammates.
"""
from __future__ import annotations

import json
import logging
import math
import os
from pathlib import Path
from typing import Any
from ml.config import THRESHOLDS
import joblib
import pandas as pd

log = logging.getLogger("cad.model_store")

STUB_VERSION = "stub-0"
STUB_PARTIAL_VERSION = "stub-partial"


class ModelInputError(ValueError):
    """The features cannot be turned into a model row (missing key, unknown key, bad value).

    The validation layer should catch all of these first and return a 422. This is the
    safety net so a bug never turns into a confusing pandas/sklearn error.
    """


# --------------------------------------------------------------------------- paths
# --------------------------------------------------------------------------- paths

# model_store.py lives at:
# cad-vision/backend/app/services/model_store.py
#
# parents[0] -> services
# parents[1] -> app
# parents[2] -> backend
# parents[3] -> cad-vision
REPO_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_SCHEMA_PATH = REPO_ROOT / "ml" / "schema" / "feature_schema.json"
DEFAULT_ARTIFACTS_DIR = REPO_ROOT / "ml" / "artifacts" / "models"


def _resolve_schema_path(explicit: str | Path | None) -> Path:
    if explicit is not None:
        return Path(explicit)

    env = os.getenv("SCHEMA_PATH")
    if env:
        return Path(env)

    return DEFAULT_SCHEMA_PATH


# --------------------------------------------------------------------------- stub
# Fake but deterministic: the same input always gives the same output, and changing
# an input (what-if) moves the numbers, so the frontend looks alive without models.
_STUB_BIAS = {"Cath": 0.8, "LAD": 0.3, "LCX": -0.5, "RCA": -0.6}
_STUB_SCALE = {"Cath": 1.0, "LAD": 0.8, "LCX": 0.5, "RCA": 0.5}


def _stub_probability(target: str, f: dict[str, Any]) -> float:
    signal = (
        0.35 * (f.get("Age", 58) - 58) / 10
        + 1.2 * f.get("Typical Chest Pain", 0)
        + 0.6 * f.get("DM", 0)
        + 0.5 * f.get("HTN", 0)
        + 0.5 * f.get("St Depression", 0)
        + 0.5 * f.get("Tinversion", 0)
        - 0.4 * (f.get("EF-TTE", 50) - 50) / 10
    )
    z = _STUB_BIAS[target] + _STUB_SCALE[target] * signal
    return 1.0 / (1.0 + math.exp(-z))


# --------------------------------------------------------------------------- store
class ModelStore:
    def __init__(self, schema: dict, artifacts_dir: Path):
        self.schema = schema
        self.artifacts_dir = Path(artifacts_dir)

        self.targets: list[dict] = schema["targets"]
        self.column_order: list[str] = schema["model_feature_order"]
        self._inputs: dict[str, dict] = {f["name"]: f for f in schema["features"]}
        self._derived: dict[str, dict] = {d["name"]: d for d in schema["derived_features"]}
        target_names = {t["name"] for t in self.targets}

        missing_thresholds = target_names - set(THRESHOLDS)

        if missing_thresholds:
            raise ValueError(
                f"Missing threshold(s) in config for: {sorted(missing_thresholds)}"
            )
        self.thresholds: dict[str, float] = {t["name"]: THRESHOLDS[t["name"]] for t in self.targets}
        self.models: dict[str, Any] = {}          # target -> fitted model (real ones only)
        self._positive_col: dict[str, int] = {}   # target -> column of the positive class
        self.sources: dict[str, str] = {}         # target -> "artifact" or "stub: <reason>"
        self._version_text: str | None = None

    # ------------------------------------------------------------ construction
    @classmethod
    def load(cls, schema_path: str | Path | None = None,
             artifacts_dir: str | Path | None = None) -> "ModelStore":
        """Build the store. A missing schema is fatal; missing artifacts are not."""
        path = _resolve_schema_path(schema_path)
        if not path.is_file():
            raise FileNotFoundError(
                f"Feature schema not found at {path}"
            )

        schema = json.loads(path.read_text(encoding="utf-8"))

        if artifacts_dir is None:
            artifacts_dir = os.getenv("ARTIFACTS_DIR") or DEFAULT_ARTIFACTS_DIR

        store = cls(schema, Path(artifacts_dir))
        store._load_models()    
        return store

    def _load_models(self) -> None:
        for t in self.targets:
            name = t["name"]
            artifact = self.artifacts_dir / f"{name}_model.joblib"

            if not artifact.is_file():
                self.sources[name] = "stub: artifact not found"
                log.warning("No artifact for %s at %s, using stub", name, artifact)
                continue

            try:
                model = joblib.load(artifact)
                col = self._check_model(model, t)   # smoke test, raises if the model is unusable
            except Exception as exc:                # noqa: BLE001 - we want to survive anything
                self.sources[name] = f"stub: failed to load ({type(exc).__name__}: {exc})"
                log.error("Could not use artifact for %s, using stub: %s", name, exc, exc_info=True)
                continue

            self.models[name] = model
            self._positive_col[name] = col
            self.sources[name] = "artifact"
            log.info("Loaded model for %s from %s", name, artifact)

        version_file = self.artifacts_dir / "VERSION"
        if version_file.is_file():
            self._version_text = version_file.read_text(encoding="utf-8").strip() or None

        log.info("Model store ready: version=%s sources=%s", self.model_version, self.sources)

    def _check_model(self, model: Any, target: dict) -> int:
        """Run one default row through the model right now, so a structurally broken artifact
        (expects a column we don't send, wrong dtypes, no predict_proba) is found at startup,
        not on the first user request. Returns the column of the positive class.

        Limit: it cannot catch silent encoding drift, e.g. a OneHotEncoder with
        handle_unknown='ignore' quietly ignoring a category spelled differently.
        That is why the encoding must be agreed with A (decision 4 in docs/API.md)."""
        if not hasattr(model, "predict_proba"):
            raise TypeError("model has no predict_proba()")

        defaults = {name: spec["default"] for name, spec in self._inputs.items()}
        proba = model.predict_proba(self.build_frame(defaults))

        col = self._find_positive_col(model, target["positive_class"])
        value = float(proba[0][col])
        if not 0.0 <= value <= 1.0:
            raise ValueError(f"predict_proba returned {value}, expected a value in [0, 1]")
        return col

    @staticmethod
    def _find_positive_col(model: Any, positive_class: str) -> int:
        """predict_proba has one column per class. Find the one for the positive class.
        Works whether A trained on strings ('CAD'/'Normal') or on 0/1 (1 = positive)."""
        classes = list(getattr(model, "classes_", [0, 1]))
        for candidate in (positive_class, 1):
            if candidate in classes:
                return classes.index(candidate)
        raise ValueError(f"positive class {positive_class!r} not in model classes {classes}")

    # ------------------------------------------------------------ status
    @property
    def all_loaded(self) -> bool:
        return len(self.models) == len(self.targets)

    @property
    def model_version(self) -> str:
        if self.all_loaded:
            return self._version_text or "unversioned"
        return STUB_PARTIAL_VERSION if self.models else STUB_VERSION

    def status(self) -> dict:
        """For GET /health. `targets` is an additive debug field (add it to docs/API.md)."""
        return {
            "status": "ok",
            "model_version": self.model_version,
            "models_loaded": self.all_loaded,
            "targets": dict(self.sources),
        }

    # ------------------------------------------------------------ input -> DataFrame
    @staticmethod
    def derive(features: dict[str, Any]) -> dict[str, Any]:
        """Columns the backend computes itself (see feature_schema.json derived_features).
        Returned in API form: Obesity is 0/1."""
        try:
            bmi = features["Weight"] / (features["Length"] / 100) ** 2
        except KeyError as exc:
            raise ModelInputError(f"missing field needed to compute BMI: {exc.args[0]}") from None
        except ZeroDivisionError:
            raise ModelInputError("Length must not be 0") from None
        return {"BMI": bmi, "Obesity": 1 if bmi >= 25 else 0}

    def _to_dataset_value(self, name: str, value: Any) -> Any:
        """API value -> the raw value used in the dataset (and in A's training frame)."""
        spec = self._inputs[name]
        kind = spec["type"]

        if kind == "number":
            return value
        if kind == "binary":
            try:
                return spec["dataset_encoding"][str(int(value))]
            except (KeyError, ValueError, TypeError):
                raise ModelInputError(f"{name}: expected 0 or 1, got {value!r}") from None
        # category and ordinal: look the value up in the schema options
        for option in spec["options"]:
            if option["value"] == value:
                return option["dataset_value"]
        allowed = [o["value"] for o in spec["options"]]
        raise ModelInputError(f"{name}: {value!r} is not one of {allowed}")

    def build_frame(self, features: dict[str, Any]) -> pd.DataFrame:
        """One-row DataFrame, columns in model_feature_order, raw dataset values.
        Used by predict() now and by the SHAP code on Oct 6."""
        unknown = set(features) - set(self._inputs)
        if unknown:
            raise ModelInputError(f"unknown field(s): {sorted(unknown)}")
        missing = set(self._inputs) - set(features)
        if missing:
            raise ModelInputError(f"missing field(s): {sorted(missing)}")

        derived = self.derive(features)

        row: dict[str, Any] = {}
        for column in self.column_order:
            if column in self._inputs:
                row[column] = self._to_dataset_value(column, features[column])
            else:  # BMI or Obesity
                value = derived[column]
                if column == "Obesity":
                    value = self._derived["Obesity"]["dataset_encoding"][str(value)]
                row[column] = value
        return pd.DataFrame([row], columns=self.column_order)

    # ------------------------------------------------------------ prediction
    def predict(self, features: dict[str, Any]) -> dict:
        """Returns the body of POST /predict exactly as frozen in docs/API.md."""
        frame = self.build_frame(features)
        derived = self.derive(features)

        predictions = {}
        for t in self.targets:
            name = t["name"]
            if name in self.models:
                proba = float(self.models[name].predict_proba(frame)[0][self._positive_col[name]])
            else:
                proba = _stub_probability(name, features)

            threshold = self.thresholds[name]
            predictions[name] = {
                "probability": round(proba, 4),
                "label": t["positive_class"] if proba >= threshold else t["negative_class"],
                "threshold": threshold,
            }

        return {
            "predictions": predictions,
            "derived_features": {"BMI": round(derived["BMI"], 2), "Obesity": derived["Obesity"]},
            "model_version": self.model_version,
        }


# --------------------------------------------------------------------------- singleton
_store: ModelStore | None = None


def get_store() -> ModelStore:
    """The one shared store. First call loads everything; later calls are free."""
    global _store
    if _store is None:
        _store = ModelStore.load()
    return _store


def reset_store() -> None:
    """For tests only: forget the loaded store."""
    global _store
    _store = None
