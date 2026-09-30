from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_predict_shape_and_vessel_keys():
    r = client.post("/predict", json={"features": {"Age": 65, "BP": 150}})
    body = r.json()
    assert r.status_code == 200
    assert set(body["vessels"]) == {"LAD", "LCX", "RCA"}
    for p in [body["cad"], *body["vessels"].values()]:
        assert 0 <= p["probability"] <= 1 and p["label"] in (0, 1)


def test_schema_and_samples():
    assert len(client.get("/schema").json()["features"]) > 0
    assert set(client.get("/samples").json()) == {"low_risk", "medium_risk", "high_risk"}


def test_schema_does_not_contain_leak_columns():
    names = {f["name"] for f in client.get("/schema").json()["features"]}
    assert not names & {"LAD", "LCX", "RCA", "Cath"}
