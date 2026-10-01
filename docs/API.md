# CAD Vision API contract

**Status:** DRAFT v1.0, waiting for sign-off from A, C and D.
**Freeze rule:** once everyone has approved, this file is frozen. Any change needs agreement from all four of us and a line in the change log at the bottom.
**Source of truth for field names:** [`feature_schema.json`](../feature_schema.json). Every name below is copied from the dataset columns exactly (case, spaces and spelling), so do not "tidy" them. `Length` means height in cm, and the UI label is "Height".

## 1. Conventions

| Item | Value |
|---|---|
| Base URL (dev) | `http://localhost:8000` |
| Format | JSON in and out, `Content-Type: application/json` |
| Auth | None (hackathon demo) |
| CORS | Allowed origins default to `http://localhost:3000` and `http://localhost:5173`, configurable with the `CORS_ORIGINS` env var. C/D: tell B if your dev server uses another port. |
| Probabilities | Floats from 0 to 1, rounded to 4 decimals |
| Targets | `Cath` (CAD or Normal), `LAD`, `LCX`, `RCA` (Stenotic or Normal). All probabilities are for the **positive class**: `CAD` for `Cath`, `Stenotic` for the three arteries. |

## 2. Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/predict` | Probabilities for all 4 targets. Also used for what-if (just re-send changed features). |
| POST | `/explain` | SHAP explanation, plain-language narrative and global importance for all 4 targets |
| GET | `/metrics` | Model performance numbers |
| GET | `/schema` | Returns `feature_schema.json` so the frontend can build the form from it (**new, see decisions**) |
| GET | `/health` | Liveness check for Docker and CI (**new, see decisions**) |

## 3. How input values are represented

The API uses one clean representation. The backend converts it to the raw dataset encoding before calling the models.

| Type | What the client sends | Notes |
|---|---|---|
| `number` | JSON number, within `min` and `max` from the schema | `train_min` and `train_max` in the schema give the range the models saw. The UI may warn outside it, but the API only enforces `min` and `max`. |
| `binary` | Integer `0` or `1` | Backend maps to `Y`/`N` where the dataset uses letters. |
| `category` | One of the `value` strings in the schema `options` | Send the **value**, not the label. Example: `VHD` is `N`, `mild`, `Moderate` or `Severe` (the dataset has a lowercase `mild`). |
| `ordinal` | One of the integers in `options` | `Function Class` is 0 to 3, `Region RWMA` is 0 to 4. |

Rules for the `features` object:

1. **All 52 input features are required.** The backend does not fill in defaults or impute. A missing field returns 422.
2. **Unknown fields are rejected** (422). This catches typos like `ST Elevation` (the correct name is `St Elevation`).
3. **The 4 targets are never accepted as input** (`Cath`, `LAD`, `LCX`, `RCA`).
4. **`BMI` and `Obesity` are never accepted.** The backend computes them (see decisions below) and returns them in `derived_features`.
5. **`Sex` is sent as `Male` or `Female`.** The dataset spells it `Fmale`, so the backend maps `Female` to `Fmale` internally.
6. `Exertional CP` is not a feature (constant column in the dataset, excluded).

## 4. `POST /predict`

Request (the example uses the schema defaults, which are dataset medians for numbers and "absent" for flags):

```json
{
  "features": {
    "Age": 58,
    "Weight": 74,
    "Length": 165,
    "Sex": "Male",
    "DM": 0,
    "HTN": 0,
    "Current Smoker": 0,
    "EX-Smoker": 0,
    "FH": 0,
    "CRF": 0,
    "CVA": 0,
    "Airway disease": 0,
    "Thyroid Disease": 0,
    "CHF": 0,
    "DLP": 0,
    "BP": 130,
    "PR": 70,
    "Edema": 0,
    "Weak Peripheral Pulse": 0,
    "Lung rales": 0,
    "Systolic Murmur": 0,
    "Diastolic Murmur": 0,
    "Typical Chest Pain": 0,
    "Dyspnea": 0,
    "Function Class": 0,
    "Atypical": 0,
    "Nonanginal": 0,
    "LowTH Ang": 0,
    "Q Wave": 0,
    "St Elevation": 0,
    "St Depression": 0,
    "Tinversion": 0,
    "LVH": 0,
    "Poor R Progression": 0,
    "BBB": "N",
    "FBS": 98,
    "CR": 1,
    "TG": 122,
    "LDL": 100,
    "HDL": 39,
    "BUN": 16,
    "ESR": 15,
    "HB": 13.2,
    "K": 4.2,
    "Na": 141,
    "WBC": 7100,
    "Lymph": 32,
    "Neut": 60,
    "PLT": 210,
    "EF-TTE": 50,
    "Region RWMA": 0,
    "VHD": "N"
  }
}
```

Response `200`:

```json
{
  "predictions": {
    "Cath": { "probability": 0.8231, "label": "CAD", "threshold": 0.5 },
    "LAD":  { "probability": 0.6412, "label": "Stenotic", "threshold": 0.5 },
    "LCX":  { "probability": 0.3105, "label": "Normal", "threshold": 0.5 },
    "RCA":  { "probability": 0.4688, "label": "Normal", "threshold": 0.5 }
  },
  "derived_features": { "BMI": 27.18, "Obesity": 1 },
  "model_version": "stub-0"
}
```

- `label` is the positive class name when `probability >= threshold`, otherwise the negative class name.
- `threshold` comes from backend config (default 0.5 for each target).
- `model_version` starts with `stub` when the API is running without real model artifacts. C/D: show a "demo data" banner in that case.

**What-if:** send the same request with some values changed. There is no separate route.

## 5. `POST /explain`

Request: identical to `/predict`.

Response `200`:

```json
{
  "shap_units": "log_odds",
  "explanations": {
    "Cath": {
      "probability": 0.8231,
      "base_value": 0.41,
      "top_features": [
        { "feature": "Typical Chest Pain", "value": 1, "shap": 0.42, "direction": "increases" },
        { "feature": "Age", "value": 58, "shap": -0.11, "direction": "decreases" }
      ],
      "narrative": "Typical chest pain raised the predicted CAD risk the most."
    },
    "LAD": { "probability": 0.6412, "base_value": 0.0, "top_features": [], "narrative": "" },
    "LCX": { "probability": 0.3105, "base_value": 0.0, "top_features": [], "narrative": "" },
    "RCA": { "probability": 0.4688, "base_value": 0.0, "top_features": [], "narrative": "" }
  },
  "global_importance": {
    "Cath": [ { "feature": "Typical Chest Pain", "importance": 0.31 } ],
    "LAD": [], "LCX": [], "RCA": []
  }
}
```

- All 4 targets are always present under `explanations` and `global_importance` (shortened above for readability).
- `top_features` holds the **10** features with the largest `abs(shap)`, sorted from largest to smallest.
- `value` is the value in the request format (for example `1` for a flag, `"Male"` for `Sex`), not the internal dataset encoding.
- `direction` is `increases` or `decreases`, meaning the effect on the risk of the positive class.
- `shap_units` is `log_odds` or `probability`, depending on the model type A ships. The frontend should label the axis from this field and not assume one.
- `global_importance` is mean absolute SHAP per target, top 10, sorted descending, computed once at startup.

## 6. `GET /metrics`

Response `200`:

```json
{
  "model_version": "stub-0",
  "evaluation": "Stratified 5-fold cross-validation",
  "models": {
    "Cath": { "auc": 0.93, "accuracy": 0.88, "sensitivity": 0.90, "specificity": 0.84, "threshold": 0.5 },
    "LAD":  { "auc": 0.90, "accuracy": 0.85, "sensitivity": 0.86, "specificity": 0.83, "threshold": 0.5 },
    "LCX":  { "auc": 0.80, "accuracy": 0.76, "sensitivity": 0.70, "specificity": 0.80, "threshold": 0.5 },
    "RCA":  { "auc": 0.82, "accuracy": 0.78, "sensitivity": 0.72, "specificity": 0.82, "threshold": 0.5 }
  }
}
```

These are fake numbers until A provides `metrics.json`. The shape is what is frozen.

## 7. `GET /schema` and `GET /health`

`GET /schema` returns `feature_schema.json` exactly as stored.

`GET /health` returns:

```json
{ "status": "ok", "model_version": "stub-0", "models_loaded": false }
```

## 8. Errors

Every error uses this shape:

```json
{
  "error": "validation_error",
  "message": "2 fields failed validation",
  "details": [
    { "field": "Age", "message": "must be between 18 and 100" },
    { "field": "Sex", "message": "must be one of: Male, Female" }
  ]
}
```

| HTTP | `error` | When |
|---|---|---|
| 400 | `invalid_json` | Body is not valid JSON or is not an object |
| 422 | `validation_error` | Missing, unknown or out-of-range fields, wrong type, bad category, target or derived field sent. `details` lists each problem. |
| 500 | `internal_error` | Unexpected server error. `details` is an empty list. |

`details[].field` is the exact feature name, or `features` if the whole object is missing. Typical messages: `field required`, `unknown field`, `must be 0 or 1`, `must be a number`, `target columns are not accepted as input`, `derived field, do not send`.

## 9. Feature reference (generated from `feature_schema.json`)

52 input features. Send every one of them.

| Name | Label | Group | Type | Allowed values | Unit | Default |
|---|---|---|---|---|---|---|
| `Age` | Age | Demographics | number | 18 to 100 | years | `58` |
| `Weight` | Weight | Demographics | number | 30 to 200 | kg | `74` |
| `Length` | Height | Demographics | number | 120 to 220 | cm | `165` |
| `Sex` | Sex | Demographics | category | `Male`, `Female` |  | `"Male"` |
| `DM` | Diabetes mellitus | History & risk factors | binary | 0 or 1 |  | `0` |
| `HTN` | Hypertension | History & risk factors | binary | 0 or 1 |  | `0` |
| `Current Smoker` | Current smoker | History & risk factors | binary | 0 or 1 |  | `0` |
| `EX-Smoker` | Ex-smoker | History & risk factors | binary | 0 or 1 |  | `0` |
| `FH` | Family history of CAD | History & risk factors | binary | 0 or 1 |  | `0` |
| `CRF` | Chronic renal failure | History & risk factors | binary | 0 or 1 |  | `0` |
| `CVA` | Stroke (cerebrovascular accident) | History & risk factors | binary | 0 or 1 |  | `0` |
| `Airway disease` | Airway disease | History & risk factors | binary | 0 or 1 |  | `0` |
| `Thyroid Disease` | Thyroid disease | History & risk factors | binary | 0 or 1 |  | `0` |
| `CHF` | Congestive heart failure | History & risk factors | binary | 0 or 1 |  | `0` |
| `DLP` | Dyslipidemia | History & risk factors | binary | 0 or 1 |  | `0` |
| `BP` | Systolic blood pressure | Symptoms & examination | number | 70 to 250 | mmHg | `130` |
| `PR` | Pulse rate | Symptoms & examination | number | 30 to 180 | bpm | `70` |
| `Edema` | Edema | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Weak Peripheral Pulse` | Weak peripheral pulse | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Lung rales` | Lung rales | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Systolic Murmur` | Systolic murmur | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Diastolic Murmur` | Diastolic murmur | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Typical Chest Pain` | Typical chest pain | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Dyspnea` | Dyspnea (shortness of breath) | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Function Class` | Functional class | Symptoms & examination | ordinal | `0`, `1`, `2`, `3` |  | `0` |
| `Atypical` | Atypical chest pain | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Nonanginal` | Nonanginal chest pain | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `LowTH Ang` | Low-threshold angina | Symptoms & examination | binary | 0 or 1 |  | `0` |
| `Q Wave` | Q wave | ECG | binary | 0 or 1 |  | `0` |
| `St Elevation` | ST elevation | ECG | binary | 0 or 1 |  | `0` |
| `St Depression` | ST depression | ECG | binary | 0 or 1 |  | `0` |
| `Tinversion` | T inversion | ECG | binary | 0 or 1 |  | `0` |
| `LVH` | Left ventricular hypertrophy | ECG | binary | 0 or 1 |  | `0` |
| `Poor R Progression` | Poor R-wave progression | ECG | binary | 0 or 1 |  | `0` |
| `BBB` | Bundle branch block | ECG | category | `N`, `LBBB`, `RBBB` |  | `"N"` |
| `FBS` | Fasting blood sugar | Laboratory | number | 40 to 600 | mg/dL | `98` |
| `CR` | Creatinine | Laboratory | number | 0.2 to 10 | mg/dL | `1` |
| `TG` | Triglycerides | Laboratory | number | 20 to 2000 | mg/dL | `122` |
| `LDL` | LDL cholesterol | Laboratory | number | 10 to 400 | mg/dL | `100` |
| `HDL` | HDL cholesterol | Laboratory | number | 5 to 150 | mg/dL | `39` |
| `BUN` | Blood urea nitrogen | Laboratory | number | 2 to 200 | mg/dL | `16` |
| `ESR` | Erythrocyte sedimentation rate | Laboratory | number | 0 to 150 | mm/h | `15` |
| `HB` | Hemoglobin | Laboratory | number | 5 to 22 | g/dL | `13.2` |
| `K` | Potassium | Laboratory | number | 2 to 9 | mEq/L | `4.2` |
| `Na` | Sodium | Laboratory | number | 110 to 170 | mEq/L | `141` |
| `WBC` | White blood cell count | Laboratory | number | 1000 to 50000 | cells/mm3 | `7100` |
| `Lymph` | Lymphocytes | Laboratory | number | 0 to 100 | % | `32` |
| `Neut` | Neutrophils | Laboratory | number | 0 to 100 | % | `60` |
| `PLT` | Platelets | Laboratory | number | 10 to 1500 | 1000/mm3 | `210` |
| `EF-TTE` | Ejection fraction (echo) | Echocardiography | number | 10 to 80 | % | `50` |
| `Region RWMA` | Regional wall motion abnormality | Echocardiography | ordinal | `0`, `1`, `2`, `3`, `4` |  | `0` |
| `VHD` | Valvular heart disease | Echocardiography | category | `N`, `mild`, `Moderate`, `Severe` |  | `"N"` |

Computed by the backend (never sent): `BMI` = `Weight / (Length / 100) ** 2`, `Obesity` = `1` if `BMI >= 25` else `0`.

## 10. Decisions that need a "yes"

| # | Decision | Who confirms |
|---|---|---|
| 1 | `Sex` is sent as `Male`/`Female` and mapped to the dataset's `Fmale` by the backend | A |
| 2 | `BMI` and `Obesity` are computed by the backend, not entered. `BMI` matches the dataset exactly. `Obesity` matches 302 of 303 rows. | A (model still uses both), C/D (no input fields for them; show BMI from `derived_features`) |
| 3 | `Exertional CP` is dropped (constant column) | A |
| 4 | Binary inputs are `0`/`1`. The backend converts to the dataset's raw values (`Y`/`N` or `0`/`1`) before the model. Does A's pipeline expect the raw dataset values, or already-encoded ones? | A |
| 5 | Each target's model is trained **without** the other three targets as features (`Cath` is defined from `LAD`/`LCX`/`RCA`, so including them leaks the answer) | A |
| 6 | `shap_units` is returned in `/explain`, so the frontend must handle both `log_odds` and `probability` | A (which one), C/D |
| 7 | All 52 inputs are required, with no server-side defaults | C/D (the form always sends everything) |
| 8 | Default threshold 0.5 for every target, set in backend config | A |
| 9 | Extra routes `GET /schema` and `GET /health` | C/D |
| 10 | `global_importance` is per target, not one list | C/D |
| 11 | CORS origins `localhost:3000` and `localhost:5173` | C/D |

## 11. Sign-off

Reply "approved" (chat or PR approval) once you have checked your part.

- [ ] **A** (models): names, targets, encodings and decisions 1, 3, 4, 5, 6, 8
- [ ] **C** (frontend): form fields, response shapes, decisions 2, 6, 7, 9, 10, 11
- [ ] **D** (frontend): form fields, response shapes, decisions 2, 6, 7, 9, 10, 11
- [ ] **B** (backend): written and implemented as above

## 12. Change log

| Date | Version | Change |
|---|---|---|
| 2026-10-01 | 1.0 draft | First full draft |
