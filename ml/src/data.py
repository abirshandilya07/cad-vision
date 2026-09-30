"""Data loading with a hard leakage guard."""
import pandas as pd
from ml.config import LEAK_COLUMNS, TARGET_COLUMN


def get_features(df: pd.DataFrame) -> pd.DataFrame:
    """Return model inputs: every column except LAD, LCX, RCA and Cath."""
    return df.drop(columns=[c for c in LEAK_COLUMNS if c in df.columns])


def get_target(df: pd.DataFrame, target: str) -> pd.Series:
    """Return a binary 0/1 series for CAD, LAD, LCX or RCA."""
    y = df[TARGET_COLUMN[target]]
    if not pd.api.types.is_numeric_dtype(y):  # UCI encodes Cath as 'Cad' / 'Normal'
        y = y.astype(str).str.strip().str.lower().isin(["cad", "stenotic", "1"])
    return y.astype(int)


def load_raw(path: str) -> pd.DataFrame:
    return pd.read_csv(path) if path.endswith(".csv") else pd.read_excel(path)


def make_xy(df: pd.DataFrame, target: str):
    X, y = get_features(df), get_target(df, target)
    assert not set(LEAK_COLUMNS) & set(X.columns), "Target leakage detected"
    return X, y
