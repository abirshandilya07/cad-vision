# CAD-Vision: Cardiovascular Risk Visualization & Prediction (Track A)

> ⚠️ **Clinical safety disclaimer:** This tool is for **decision support and educational purposes only**. It is **not** a substitute for formal diagnostic imaging (e.g., coronary angiography) or clinical judgment.

CAD-Vision predicts overall Coronary Artery Disease (CAD) status and stenosis of the three major coronary vessels (LAD, LCX, RCA) from clinical, ECG, laboratory and echocardiographic features. Predictions are mapped onto an interactive 3D heart, with per-patient SHAP explanations in a clinical dashboard.

- **Demo video:** `TODO: YouTube link`
- **Team:** `Abir Shandilya, Aditya Ranjan, Jitesh Garg, Ojasv Jain`

## Features

- Classification models for overall CAD and LAD / LCX / RCA stenosis
- Leakage-safe pipeline: `LAD`, `LCX`, `RCA` and `Cath` are never used as inputs (enforced by a unit test)
- Interactive 3D heart (rotate, zoom, click a vessel); vessel colors update with predicted probability
- Dashboard: CAD status, vessel probabilities, SHAP feature contributions, patient measurements
- Schema-driven design: features are defined in one file, `ml/schema/feature_schema.json`

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Python | 3.11 or newer | `python --version` |
| Node.js (with npm) | 20 LTS or newer | `node --version` |
| Git | any recent | `git --version` |
| Docker Desktop | optional, only for the Docker route | `docker --version` |

A modern browser (Chrome, Edge, Firefox) is required. No dedicated GPU is needed.

## Setup and run

### 1. Clone

```bash
git clone https://github.com/<owner>/cad-vision.git
cd cad-vision
```

### 2. Get the dataset

Download the **Z-Alizadeh Sani CAD dataset** (`TODO: add exact link the organizers provided`) and place the file in `data/raw/` (`TODO: exact filename`). Check the dataset license before redistributing it.

### 3. Backend (Python)

macOS / Linux:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt -r backend/requirements.txt
```

Windows (PowerShell):
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r ml/requirements.txt -r backend/requirements.txt
```

If PowerShell blocks the activation script, run `Set-ExecutionPolicy -Scope Process RemoteSigned` first.

Train the models (skip if trained models are already committed in `ml/artifacts/models/`):
```bash
python -m ml.src.train
```

Start the API:
```bash
uvicorn app.main:app --reload --port 8000 --app-dir backend
```
API docs: http://localhost:8000/docs

### 4. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

### Alternative: Docker (one command)

```bash
docker compose up --build
```
Frontend: http://localhost:5173. API: http://localhost:8000/docs.

## Run the tests

```bash
pytest ml/tests backend/tests -q
```
This includes `ml/tests/test_no_leakage.py`, which fails if any target column enters the model inputs.

## Usage

1. Open the app and pick a sample patient (low, medium or high risk) or enter values in the form.
2. Submit to get the predicted CAD status and LAD / LCX / RCA probabilities.
3. Watch the vessel colors change on the 3D heart. Rotate and zoom with the mouse; click a vessel to see its details.
4. Open the explanation panel to see which features pushed the prediction up or down (SHAP).

## API

| Route | Method | Purpose |
|---|---|---|
| `/health` | GET | Service status |
| `/schema` | GET | Feature definitions (drives the input form) |
| `/samples` | GET | Example patients |
| `/predict` | POST | Body `{"features": {...}}`, returns CAD and vessel probabilities |
| `/explain` | POST | SHAP contributions per target (`TODO: implement`) |
| `/metrics` | GET | Stored evaluation results (`TODO: implement`) |

Vessel keys are always `LAD`, `LCX`, `RCA`.

## Project structure

```
ml/         data loading, preprocessing, training, evaluation, schema
backend/    FastAPI service
frontend/   React + Vite + React Three Fiber
data/       raw dataset (not committed if license forbids), sample patients
docs/       documentation, attributions, video script
```

## Methodology summary

`TODO: fill in from real results before submitting`
- Preprocessing, class balance and models used
- Validation: repeated stratified cross-validation, hold-out set, calibration
- Results table: accuracy, precision, recall, F1, ROC-AUC per target (mean ± std)

## Limitations

- Small single-source dataset (about 300 patients), no external validation
- Predictions are vessel-level, not lesion- or segment-level. `Region with RWMA` is a clinical input feature, not an anatomical coordinate
- Not validated for clinical use

## Attributions and license

- Dataset: Z-Alizadeh Sani (`TODO: source and license`)
- 3D heart mesh: `TODO: name, author, source URL, license`
- Code license: MIT, see [LICENSE](LICENSE). Third-party assets keep their own licenses, listed in [docs/ATTRIBUTIONS.md](docs/ATTRIBUTIONS.md).
