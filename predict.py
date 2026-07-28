import os
import joblib
import pandas as pd

MODEL_DIR = "./ml/models"


NEW_DATA_PATH = "./ml/data/new_traffic_sample.csv"


def load_models():
    rf_model = joblib.load(os.path.join(MODEL_DIR, "random_forest.pkl"))
    xgb_model = joblib.load(os.path.join(MODEL_DIR, "xgboost_model.pkl"))
    iso_forest = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
    feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
    return rf_model, xgb_model, iso_forest, scaler, label_encoder, feature_names


def predict_new_data(path: str = NEW_DATA_PATH):
    rf_model, xgb_model, iso_forest, scaler, label_encoder, feature_names = load_models()

    df = pd.read_csv(path, low_memory=False)
    df.columns = df.columns.str.strip()

    # Keep only the columns the model was trained on, in the same order
    X = df[feature_names]
    X_scaled = scaler.transform(X)

    xgb_preds = xgb_model.predict(X_scaled)
    xgb_labels = label_encoder.inverse_transform(xgb_preds)

    iso_raw = iso_forest.predict(X_scaled)
    anomaly_flags = ["ANOMALY" if p == -1 else "NORMAL" for p in iso_raw]

    results = pd.DataFrame({
        "predicted_attack_type": xgb_labels,
        "anomaly_flag": anomaly_flags,
    })

    print(results.head(20))
    results.to_csv("./ml/predictions_output.csv", index=False)
    print("\nSaved full predictions to ml/predictions_output.csv")
    return results


if __name__ == "__main__":
    predict_new_data()
