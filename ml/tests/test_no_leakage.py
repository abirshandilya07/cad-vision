import pandas as pd
import pytest
from ml.config import LEAK_COLUMNS, TARGETS
from ml.src.data import get_features, make_xy


def toy():
    return pd.DataFrame({
        "Age": [50, 60, 70, 45], "Sex": [0, 1, 1, 0],
        "LAD": [0, 1, 1, 0], "LCX": [0, 0, 1, 0], "RCA": [1, 0, 1, 0],
        "Cath": ["Normal", "Cad", "Cad", "Normal"],
    })


def test_leak_columns_removed():
    X = get_features(toy())
    assert not set(LEAK_COLUMNS) & set(X.columns)
    assert list(X.columns) == ["Age", "Sex"]


@pytest.mark.parametrize("target", TARGETS)
def test_make_xy_never_contains_targets(target):
    X, y = make_xy(toy(), target)
    for col in LEAK_COLUMNS:
        assert col not in X.columns
    assert set(y.unique()) <= {0, 1}
    assert len(X) == len(y)


def test_cath_is_binarised():
    _, y = make_xy(toy(), "CAD")
    assert y.tolist() == [0, 1, 1, 0]
