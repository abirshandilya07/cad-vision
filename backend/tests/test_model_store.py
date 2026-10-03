"""Tests for app/model_store.py. They build tiny throw-away models from synthetic data,
so they run in CI without the real dataset or A's artifacts.

Run from the repo root:  pytest tests/test_model_store.py
(an empty conftest.py in the repo root makes `import app...` work)
"""
import json
import random
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from app.services.model_store import (ModelInputError, ModelStore, STUB_PARTIAL_VERSION, STUB_VERSION)

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "ml" / "schema" / "feature_schema.json"

assert SCHEMA_PATH.is_file(), f"Schema not found at {SCHEMA_PATH}"
SCHEMA = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
INPUTS = {f["name"]: f for f in SCHEMA["features"]}
DEFAULTS = {name: spec["default"] for name, spec in INPUTS.items()}


# ------------------------------------------------------------------ helpers
def synthetic_training_frame(n=120, seed=0):
    """Random rows in RAW dataset encoding, with the schema's column order."""
    rng = random.Random(seed)
    store = ModelStore(SCHEMA, Path("."))
    rows = []
    for _ in range(n):
        api = {}
        for name, spec in INPUTS.items():
            if spec["type"] == "number":
                api[name] = round(rng.uniform(spec["train_min"], spec["train_max"]), 1)
            elif spec["type"] == "binary":
                api[name] = rng.choice([0, 1])
            else:
                api[name] = rng.choice([o["value"] for o in spec["options"]])
        rows.append(store.build_frame(api).iloc[0])
    return pd.DataFrame(rows).reset_index(drop=True)


def make_pipeline(frame, y):
    text_cols = [c for c in frame.columns if frame[c].dtype == object or str(frame[c].dtype) in ("str", "string")]
    pre = ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), text_cols)],
                            remainder="passthrough")
    model = Pipeline([("pre", pre), ("rf", RandomForestClassifier(n_estimators=10, random_state=0))])
    return model.fit(frame, y)


@pytest.fixture(scope="module")
def train_frame():
    return synthetic_training_frame()


def write_artifacts(folder: Path, frame, targets=("Cath", "LAD", "LCX", "RCA"), version="test-v1"):
    folder.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(1)
    for name in targets:
        if name == "Cath":                       # string labels, like 'CAD'/'Normal'
            y = np.where(rng.random(len(frame)) > 0.5, "CAD", "Normal")
        elif name == "LAD":                      # string labels, positive class sorts second
            y = np.where(rng.random(len(frame)) > 0.5, "Stenotic", "Normal")
        else:                                    # 0/1 labels, 1 = positive
            y = (rng.random(len(frame)) > 0.5).astype(int)
        joblib.dump(make_pipeline(frame, y), folder / f"{name}_model.joblib")
    (folder / "VERSION").write_text(version + "\n")


# ------------------------------------------------------------------ build_frame
def test_frame_columns_follow_schema_order_whatever_the_input_order():
    store = ModelStore(SCHEMA, Path("."))
    shuffled = dict(reversed(list(DEFAULTS.items())))
    frame = store.build_frame(shuffled)
    assert list(frame.columns) == SCHEMA["model_feature_order"]
    assert frame.shape == (1, 54)
    pd.testing.assert_frame_equal(frame, store.build_frame(DEFAULTS))


def test_encoding_to_dataset_values():
    store = ModelStore(SCHEMA, Path("."))
    f = dict(DEFAULTS, Sex="Female", CRF=1, DM=1, VHD="mild", BBB="LBBB")
    row = store.build_frame(f).iloc[0]
    assert row["Sex"] == "Fmale"          # API 'Female' -> dataset 'Fmale'
    assert row["CRF"] == "Y"              # Y/N column
    assert row["DM"] == 1                 # 0/1 column stays numeric
    assert row["VHD"] == "mild"
    assert row["BBB"] == "LBBB"


def test_derived_columns():
    store = ModelStore(SCHEMA, Path("."))
    f = dict(DEFAULTS, Weight=80, Length=200)              # BMI = 20.0
    row = store.build_frame(f).iloc[0]
    assert row["BMI"] == pytest.approx(20.0)
    assert row["Obesity"] == "N"
    f = dict(DEFAULTS, Weight=100, Length=170)             # BMI ~ 34.6
    assert store.build_frame(f).iloc[0]["Obesity"] == "Y"
    assert store.derive(f) == {"BMI": pytest.approx(34.602, abs=1e-3), "Obesity": 1}


@pytest.mark.parametrize("bad", [
    dict(DEFAULTS, **{"ST Elevation": 0}),                 # typo'd name (extra key)
    {k: v for k, v in DEFAULTS.items() if k != "Age"},     # missing key
    dict(DEFAULTS, Cath="CAD"),                            # target sent as input
    dict(DEFAULTS, BMI=25),                                # derived field sent
])
def test_bad_keys_raise_model_input_error(bad):
    with pytest.raises(ModelInputError):
        ModelStore(SCHEMA, Path(".")).build_frame(bad)


def test_bad_values_raise_model_input_error():
    store = ModelStore(SCHEMA, Path("."))
    with pytest.raises(ModelInputError):
        store.build_frame(dict(DEFAULTS, DM=2))
    with pytest.raises(ModelInputError):
        store.build_frame(dict(DEFAULTS, Sex="Fmale"))     # internal spelling is not accepted


# ------------------------------------------------------------------ stub fallback
def test_starts_without_artifacts_and_serves_stub(tmp_path):
    store = ModelStore.load(SCHEMA_PATH, tmp_path / "does_not_exist")
    out = store.predict(DEFAULTS)
    assert out["model_version"] == STUB_VERSION
    assert set(out["predictions"]) == {"Cath", "LAD", "LCX", "RCA"}
    assert store.status()["models_loaded"] is False
    for p in out["predictions"].values():
        assert 0 <= p["probability"] <= 1 and p["threshold"] == 0.5
    assert out["predictions"]["Cath"]["label"] in ("CAD", "Normal")
    assert out["predictions"]["LAD"]["label"] in ("Stenotic", "Normal")


def test_stub_reacts_to_what_if_changes(tmp_path):
    store = ModelStore.load(SCHEMA_PATH, tmp_path)
    low = store.predict(dict(DEFAULTS, **{"Typical Chest Pain": 0}))["predictions"]["Cath"]["probability"]
    high = store.predict(dict(DEFAULTS, **{"Typical Chest Pain": 1}))["predictions"]["Cath"]["probability"]
    assert high > low


# ------------------------------------------------------------------ real artifacts
def test_full_artifacts_are_used(tmp_path, train_frame):
    write_artifacts(tmp_path, train_frame)
    store = ModelStore.load(SCHEMA_PATH, tmp_path)
    assert store.all_loaded and store.model_version == "test-v1"
    out = store.predict(DEFAULTS)
    assert out["model_version"] == "test-v1"
    for name, p in out["predictions"].items():
        assert 0 <= p["probability"] <= 1
        positive = next(t["positive_class"] for t in SCHEMA["targets"] if t["name"] == name)
        assert p["label"] == (positive if p["probability"] >= p["threshold"] else "Normal")
    assert store.status()["targets"] == {t: "artifact" for t in ("Cath", "LAD", "LCX", "RCA")}


def test_positive_class_probability_is_picked_for_string_and_int_labels(tmp_path, train_frame):
    write_artifacts(tmp_path, train_frame)
    store = ModelStore.load(SCHEMA_PATH, tmp_path)
    frame = store.build_frame(DEFAULTS)
    for name in ("Cath", "LAD", "LCX"):
        model = store.models[name]
        classes = list(model.classes_)
        positive = "CAD" if name == "Cath" else "Stenotic" if name == "LAD" else 1
        expected = model.predict_proba(frame)[0][classes.index(positive)]
        assert store.predict(DEFAULTS)["predictions"][name]["probability"] == pytest.approx(expected, abs=1e-4)


def test_partial_artifacts_mix_real_and_stub(tmp_path, train_frame):
    write_artifacts(tmp_path, train_frame, targets=("Cath",))
    store = ModelStore.load(SCHEMA_PATH, tmp_path)
    assert not store.all_loaded
    assert store.model_version == STUB_PARTIAL_VERSION        # still starts with "stub"
    assert store.sources["Cath"] == "artifact"
    assert store.sources["LAD"].startswith("stub")
    assert set(store.predict(DEFAULTS)["predictions"]) == {"Cath", "LAD", "LCX", "RCA"}


def test_corrupt_artifact_does_not_crash_startup(tmp_path, train_frame):
    write_artifacts(tmp_path, train_frame)
    (tmp_path / "RCA_model.joblib").write_bytes(b"this is not a model")
    store = ModelStore.load(SCHEMA_PATH, tmp_path)
    assert "RCA" not in store.models and store.sources["RCA"].startswith("stub: failed to load")
    assert store.predict(DEFAULTS)["predictions"]["RCA"]["probability"] is not None


def test_model_expecting_a_missing_column_is_caught_at_startup(tmp_path, train_frame):
    wrong = train_frame.assign(Foo=1.0)                       # A's model expects a column we never send
    joblib.dump(make_pipeline(wrong, np.arange(len(wrong)) % 2), tmp_path / "Cath_model.joblib")
    store = ModelStore.load(SCHEMA_PATH, tmp_path)
    assert "Cath" not in store.models
    assert "stub: failed to load" in store.sources["Cath"]

def test_missing_threshold_config_raises(monkeypatch):
    bad_thresholds = {
        "Cath": 0.5,
        "LAD": 0.5,
        "LCX": 0.5,
        # RCA intentionally missing
    }

    monkeypatch.setattr(
        "app.services.model_store.THRESHOLDS",
        bad_thresholds,
    )

    with pytest.raises(ValueError, match="Missing threshold"):
        ModelStore(SCHEMA, Path("."))

def test_per_target_thresholds(monkeypatch, tmp_path):
    custom_thresholds = {
        "Cath": 0.41,
        "LAD": 0.52,
        "LCX": 0.63,
        "RCA": 0.74,
    }

    monkeypatch.setattr(
        "app.services.model_store.THRESHOLDS",
        custom_thresholds,
    )

    store = ModelStore.load(
        schema_path=SCHEMA_PATH,
        artifacts_dir=tmp_path,
    )

    assert store.thresholds == custom_thresholds
