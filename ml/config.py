SEED = 42
TARGETS = ["CAD", "LAD", "LCX", "RCA"]
VESSELS = ["LAD", "LCX", "RCA"]
# Never allowed as model inputs (target leakage)
LEAK_COLUMNS = ["LAD", "LCX", "RCA", "Cath"]
# Column each target is read from in the raw dataset
TARGET_COLUMN = {"CAD": "Cath", "LAD": "LAD", "LCX": "LCX", "RCA": "RCA"}
THRESHOLDS = {
    "Cath": 0.5,
    "LAD": 0.5,
    "LCX": 0.5,
    "RCA": 0.5,
}
