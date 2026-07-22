import os
import joblib
import pandas as pd

from sklearn.preprocessing import OrdinalEncoder

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

train_path = os.path.join(BASE_DIR, "dataset", "UNSW_NB15_training-set.csv")
test_path = os.path.join(BASE_DIR, "dataset", "UNSW_NB15_testing-set.csv")

train_df = pd.read_csv(train_path)
test_df = pd.read_csv(test_path)

print("Training Shape:", train_df.shape)
print("Testing Shape :", test_df.shape)

categorical_columns = train_df.select_dtypes(include=["object", "string"]).columns

encoder = OrdinalEncoder(
    handle_unknown="use_encoded_value",
    unknown_value=-1
)

train_df[categorical_columns] = encoder.fit_transform(train_df[categorical_columns])

test_df[categorical_columns] = encoder.transform(test_df[categorical_columns])

os.makedirs("ml/models", exist_ok=True)

joblib.dump(encoder, "ml/models/ordinal_encoder.pkl")

train_df.to_csv("ml/models/train_processed.csv", index=False)
test_df.to_csv("ml/models/test_processed.csv", index=False)

print("\nPreprocessing Completed Successfully!")
print("Files Saved:")
print("ml/models/train_processed.csv")
print("ml/models/test_processed.csv")