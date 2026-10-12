import pandas as pd
import joblib
from sklearn.metrics import accuracy_score

cath_model = joblib.load("models/Cath_model.pkl")
lad_model = joblib.load("models/LAD_model.pkl")
lcx_model = joblib.load("models/LCX_model.pkl")
rca_model = joblib.load("models/RCA_model.pkl")

feature_names = cath_model.feature_names_in_ #all are trained on same X
# print(feature_names)
#test=pd.read_excel("dataset.xlsx")

# print(pd.Series(feature_names)) 

def predict(patient):
    patient_df = pd.DataFrame([patient])
    patient_df = patient_df[feature_names]
    predictions = {
    "Cath": int(cath_model.predict(patient_df)[0]),
    "LAD": int(lad_model.predict(patient_df)[0]),
    "LCX": int(lcx_model.predict(patient_df)[0]),
    "RCA": int(rca_model.predict(patient_df)[0]),
}

    predprobabilities = {
    "Cath": round(float(cath_model.predict_proba(patient_df)[0, 1]) * 100, 2),
    "LAD": round(float(lad_model.predict_proba(patient_df)[0, 1]) * 100, 2),
    "LCX": round(float(lcx_model.predict_proba(patient_df)[0, 1]) * 100, 2),
    "RCA": round(float(rca_model.predict_proba(patient_df)[0, 1]) * 100, 2),
}

    return {
        "predictions": predictions,
        "probabilities": predprobabilities
    }
    



