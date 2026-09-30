# CAD-Vision: Cardiovascular Risk Visualization & Prediction (Track A)

> **For decision support and educational purposes only. Not a substitute for formal diagnostic imaging or clinical judgment.**

## Quick start (Docker, no venv needed)
```bash
docker compose up --build
# frontend: http://localhost:5173   API docs: http://localhost:8000/docs
```

## Local dev with a virtual environment
```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r ml/requirements.txt -r backend/requirements.txt
make test                          # leakage test + API test
make api                           # FastAPI on :8000
cd frontend && npm install && npm run dev   # UI on :5173
```

## Layout
- `ml/` data loading, leakage guard, training (owner A)
- `backend/` FastAPI (owner B). `/predict` is currently a STUB returning placeholder values
- `frontend/` React + Vite (owners C, D). Add the React Three Fiber scene in `src/scene/`
- `ml/schema/feature_schema.json` single source of truth for features

## API contract
`POST /predict` body `{"features": {...}}` returns
`{"cad": {"probability", "label"}, "vessels": {"LAD": {...}, "LCX": {...}, "RCA": {...}}}`
Other routes: `GET /health`, `GET /schema`, `GET /samples`.

## Rules
1. LAD, LCX, RCA and Cath are never model inputs (`ml/src/data.py`, tested in `ml/tests/test_no_leakage.py`).
2. Vessel keys are always `LAD`, `LCX`, `RCA`.
3. Random seed is 42 (`ml/config.py`).

## Attributions
Dataset: Z-Alizadeh Sani (UCI/Kaggle), confirm license. 3D mesh: add source and license in `docs/ATTRIBUTIONS.md`.
