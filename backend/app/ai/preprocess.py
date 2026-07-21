import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder

DATASET_PATH = "datasets/WebAttacks-Thursday-no-metadata.parquet"


def preprocess_data():

    df = pd.read_parquet(DATASET_PATH)

    # Remove missing values
    df = df.dropna()

    # Separate features and labels
    X = df.drop(columns=["Label"])
    y = df["Label"]

    # Save feature names
    joblib.dump(list(X.columns), "app/ai/feature_columns.pkl")

    # Encode labels
    encoder = LabelEncoder()

    y = encoder.fit_transform(y)

    joblib.dump(encoder, "app/ai/label_encoder.pkl")

    return X, y