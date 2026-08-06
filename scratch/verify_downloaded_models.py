import pickle
import os

MODEL_DIR = r"C:\Users\Victus\Videos\InfosysSpringBoard\model"

files_to_check = {
    "attack_classes.pkl": "attack_classes.pkl",
    "feature_columns_refined.pkl": "feature_columns.pkl",
    "isolation_forest_refined.pkl": "isolation_forest.pkl",
    "label_encoder_refined.pkl": "label_encoder.pkl",
    "random_forest_refined.pkl": "random_forest.pkl",
    "scaler_refined.pkl": "scaler.pkl"
}

print("=" * 60)
print("  Verifying Downloaded Refined Models  ")
print("=" * 60)

for filename, target_name in files_to_check.items():
    filepath = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(filepath):
        print(f"❌ Missing expected file: {filename}")
        continue
        
    try:
        with open(filepath, "rb") as f:
            obj = pickle.load(f)
        
        # Check details based on file type
        if "feature_columns" in filename:
            print(f"[OK] {filename}: Loaded successfully. Feature count: {len(obj)}")
        elif "attack_classes" in filename:
            print(f"[OK] {filename}: Loaded successfully. Classes: {obj}")
        elif "random_forest" in filename:
            print(f"[OK] {filename}: Loaded successfully. Estimators: {len(obj.estimators_) if hasattr(obj, 'estimators_') else 'N/A'}")
        elif "scaler" in filename:
            print(f"[OK] {filename}: Loaded successfully. Mean shape: {obj.mean_.shape if hasattr(obj, 'mean_') else 'N/A'}")
        else:
            print(f"[OK] {filename}: Loaded successfully. Type: {type(obj)}")
            
    except Exception as e:
        print(f"[ERROR] Error loading {filename}: {e}")

print("=" * 60)
