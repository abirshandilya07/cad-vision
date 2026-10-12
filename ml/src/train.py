import os

import joblib
from pathlib import Path
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.impute import SimpleImputer
from lightgbm import LGBMClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline 
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split , GridSearchCV

from sklearn.metrics import (
    accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        roc_auc_score,
    )
from sklearn.svm import SVC

x = Path(__file__).resolve().parent
pth= x.parents[1]/"data"/"raw"/"z_alizadeh_sani.xlsx"

df=pd.read_excel(pth)

dropcolumn=["RCA","LAD","LCX","Cath","Exertional CP"] #removed Exertional CP kyunki it is staying constant and does not provide any information to the model
target=["Cath","RCA","LAD","LCX"]

X=df.drop(columns=dropcolumn)

for columns in target:
    if columns == "Cath":
        y=df["Cath"].map(
            {
                "CAD":1,
                "Normal":0
            })
    if columns == "RCA":
        y=df["RCA"].map(
            {
                "Stenotic":1,
                "Normal":0})
    if columns == "LAD":
        y=df["LAD"].map(
            {
                "Stenotic":1,
                "Normal":0})
    if columns == "LCX":
        y=df["LCX"].map(
            {
                "Stenotic":1,
                "Normal":0})
        
    print("Training for", columns, "column")

    num_columns = X.select_dtypes(
        include=["int64", "float64"]
    ).columns

    obj_columns = X.select_dtypes(
        include=["str"]
    ).columns

    X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=0.2, random_state=42, stratify=y)

    best_model = None
    best_model_name = None
    best_accuracy = -1
    best_params = None


    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    obj_pipeline = Pipeline([
        ("inputer", SimpleImputer(strategy="most_frequent")),
         ("encoder", OneHotEncoder(handle_unknown="ignore",sparse_output=False)) 
    ])

    preprocessor = ColumnTransformer([
        ("num", numerical_pipeline, num_columns),
        ("cat", obj_pipeline, obj_columns)
    ])

    algo={
        "LogisticRegression": LogisticRegression(max_iter=2000),
        "RandomForestClassifier": RandomForestClassifier(),
        "SVC": CalibratedClassifierCV(
            SVC(),
            ensemble=False),
        "Gradient boosting": GradientBoostingClassifier(
            n_estimators=100, learning_rate=0.05, max_depth=2, random_state=42,
        ),
        "LGBMClassifier": LGBMClassifier(
            random_state=42,
            verbosity=-1
        )
    }

    for name,model in algo.items():
        pipe = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
        ])

        print(f"\n\n{name} Model :")

        if name == "LogisticRegression":

            param_grid = {
                "model__C": [0.01, 0.1, 1, 10, 50, 100],
                "model__class_weight": [None, "balanced"]
            }

        elif name == "RandomForestClassifier":

            param_grid = {
                "model__n_estimators": [50, 100, 200],
                "model__max_depth": [None, 5, 10, 20],
                "model__class_weight": [None, "balanced"]
            }

        elif name == "SVC":

            param_grid = {
            "model__estimator__C": [0.1, 1, 10],
            "model__estimator__kernel": ["linear", "rbf"],
            "model__estimator__gamma": ["scale", "auto"],
            "model__estimator__class_weight": [None, "balanced"]
        }
        elif name == "Gradient boosting":

            param_grid = {
                "model__n_estimators": [50, 100, 200],
                "model__learning_rate": [0.01, 0.1, 0.5],
                "model__max_depth": [1, 2, 3]
            }
        elif name == "LGBMClassifier":
            param_grid = {
    "model__n_estimators": [50, 100, 200],
    "model__learning_rate": [0.01, 0.05, 0.1],
    "model__num_leaves": [5, 10, 20],
    "model__max_depth": [2, 3, 5],
}

        mod=GridSearchCV(estimator=pipe, param_grid=param_grid, cv=5)

        mod.fit(X_train, y_train)
        print(f"{name} Model :")
        print(mod.best_params_)
        print(mod.best_score_)

        skrr=mod.best_estimator_

        y_pred = skrr.predict(X_test)
        y_prob = skrr.predict_proba(X_test)[:, 1]  

        print("MODEL RESULTS")
        print("Accuracy :", round(accuracy_score(y_test, y_pred), 3))
        print("Precision:", round(precision_score(y_test, y_pred), 3))
        print("Recall   :", round(recall_score(y_test, y_pred), 3))
        print("F1 Score :", round(f1_score(y_test, y_pred), 3))
        print("ROC-AUC  :", round(roc_auc_score(y_test, y_prob), 3))

        if accuracy_score(y_test, y_pred) > best_accuracy:
            best_accuracy = accuracy_score(y_test, y_pred)
            best_model = skrr
            best_model_name = name
            best_params = mod.best_params_

    print("BEST MODEL")
    print("Model:", best_model_name)
    print("Accuracy:", round(best_accuracy, 3))
    print("Best Parameters:", best_params)


    print("Saved", best_model_name)
    os.makedirs("models", exist_ok=True)
    joblib.dump(best_model, f"models/{columns}_model.pkl" )
