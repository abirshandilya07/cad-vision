from backend.app.services.narrative import build_narrative


def test_build_narrative_with_increasing_and_decreasing_features():
    features = [
        {
            "feature": "Typical Chest Pain",
            "value": 1,
            "shap": 0.184,
            "direction": "increases",
        },
        {
            "feature": "Age",
            "value": 67,
            "shap": 0.121,
            "direction": "increases",
        },
        {
            "feature": "HDL",
            "value": 53,
            "shap": -0.076,
            "direction": "decreases",
        },
    ]

    narrative = build_narrative("LAD", 0.78, features)

    assert "78%" in narrative
    assert "Typical Chest Pain" in narrative
    assert "Age" in narrative
    assert "HDL cholesterol" in narrative
    assert "increasing" in narrative
    assert "decreasing" in narrative


def test_build_narrative_with_no_features():
    narrative = build_narrative("RCA", 0.42, [])

    assert "No feature-level explanation is available" in narrative