import os
import joblib


# =====================================================
# Model Folder Path
# =====================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

MODEL_DIR = os.path.join(
    BASE_DIR,
    "..",
    "ml",
    "models"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "model.pkl"
)

ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "label_encoder.pkl"
)

FEATURE_PATH = os.path.join(
    MODEL_DIR,
    "feature_names.pkl"
)

# =====================================================
# Load Model
# =====================================================

print("=" * 50)
print("Loading AI Model")
print("=" * 50)

model = joblib.load(MODEL_PATH)

label_encoder = joblib.load(ENCODER_PATH)

feature_names = joblib.load(FEATURE_PATH)

print("AI Model Loaded Successfully.")
print("Classes :", len(label_encoder.classes_))
print("Features :", len(feature_names))