from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_valid_features():
    """
    Build a completely valid request directly from feature_schema.json.

    This keeps the test synchronized with the schema even if features
    are added or removed later.
    """
    schema = client.get("/schema").json()

    return {
        feature["name"]: feature["default"]
        for feature in schema["features"]
    }


def test_health():
    r = client.get("/health")

    assert r.status_code == 200

    body = r.json()

    assert body["status"] == "ok"
    assert "model_version" in body
    assert "models_loaded" in body
    assert "targets" in body

    assert set(body["targets"]) == {"Cath", "LAD", "LCX", "RCA"}


def test_predict_valid_request():
    features = get_valid_features()

    r = client.post(
        "/predict",
        json={"features": features},
    )

    assert r.status_code == 200

    body = r.json()

    assert set(body) == {
        "predictions",
        "derived_features",
        "model_version",
    }

    assert set(body["predictions"]) == {
        "Cath",
        "LAD",
        "LCX",
        "RCA",
    }

    for prediction in body["predictions"].values():
        assert 0 <= prediction["probability"] <= 1
        assert "label" in prediction
        assert 0 <= prediction["threshold"] <= 1

    assert "BMI" in body["derived_features"]
    assert "Obesity" in body["derived_features"]


def test_predict_missing_field_returns_422():
    features = get_valid_features()

    missing_field = next(iter(features))
    del features[missing_field]

    r = client.post(
        "/predict",
        json={"features": features},
    )

    assert r.status_code == 422


def test_predict_unknown_field_returns_422():
    features = get_valid_features()

    features["Definitely Not A Real Feature"] = 123

    r = client.post(
        "/predict",
        json={"features": features},
    )

    assert r.status_code == 422


def test_predict_invalid_binary_returns_422():
    schema = client.get("/schema").json()
    features = get_valid_features()

    binary_feature = next(
        feature
        for feature in schema["features"]
        if feature["type"] == "binary"
    )

    features[binary_feature["name"]] = 2

    r = client.post(
        "/predict",
        json={"features": features},
    )

    assert r.status_code == 422


def test_schema():
    r = client.get("/schema")

    assert r.status_code == 200

    body = r.json()

    assert "features" in body
    assert len(body["features"]) > 0


def test_samples():
    r = client.get("/samples")

    assert r.status_code == 200

    assert set(r.json()) == {
        "low_risk",
        "medium_risk",
        "high_risk",
    }


def test_schema_does_not_contain_leak_columns():
    schema = client.get("/schema").json()

    names = {
        feature["name"]
        for feature in schema["features"]
    }

    assert not names & {
        "LAD",
        "LCX",
        "RCA",
        "Cath",
    }