from __future__ import annotations

from typing import Any


def _format_feature_name(name: str) -> str:
    """
    Convert schema feature names into slightly more readable labels.
    Keep this conservative so we do not change their medical meaning.
    """
    replacements = {
        "BP": "blood pressure",
        "PR": "pulse rate",
        "FBS": "fasting blood sugar",
        "CR": "creatinine",
        "TG": "triglycerides",
        "LDL": "LDL cholesterol",
        "HDL": "HDL cholesterol",
        "BUN": "blood urea nitrogen",
        "HB": "hemoglobin",
        "WBC": "white blood cell count",
        "PLT": "platelet count",
        "EF-TTE": "ejection fraction",
        "DM": "diabetes",
        "HTN": "hypertension",
        "DLP": "dyslipidemia",
    }

    return replacements.get(name, name)


def _join_features(features: list[str]) -> str:
    if not features:
        return ""

    if len(features) == 1:
        return features[0]

    if len(features) == 2:
        return f"{features[0]} and {features[1]}"

    return ", ".join(features[:-1]) + f", and {features[-1]}"


def build_narrative(
    target: str,
    probability: float,
    top_features: list[dict[str, Any]],
) -> str:
    """
    Turn a patient's local SHAP explanation into plain language.

    This describes model influence only. It does not claim that a feature
    medically caused coronary disease.
    """

    if not top_features:
        return (
            f"No feature-level explanation is available for the {target} "
            "prediction."
        )

    increasing = [
        _format_feature_name(item["feature"])
        for item in top_features
        if item["shap"] > 0
    ]

    decreasing = [
        _format_feature_name(item["feature"])
        for item in top_features
        if item["shap"] < 0
    ]

    probability_percent = round(probability * 100)

    parts: list[str] = [
        f"The model estimated a {probability_percent}% probability "
        f"for {target}."
    ]

    if increasing:
        parts.append(
            f"The strongest factors increasing this prediction were "
            f"{_join_features(increasing)}."
        )

    if decreasing:
        parts.append(
            f"The strongest factors decreasing this prediction were "
            f"{_join_features(decreasing)}."
        )

    parts.append(
        "These are model explanation values and should not be interpreted "
        "as proof that these factors caused the outcome."
    )

    return " ".join(parts)