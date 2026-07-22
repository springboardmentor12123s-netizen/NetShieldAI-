import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

DATASET_PATH = r"C:\Users\KARETI POSHITA\Desktop\NetShield-AI-Learning\datasets\CICIDS2017\clean_dataset.csv"

print("Loading clean dataset...")

df = pd.read_csv(DATASET_PATH)

print("Dataset Shape:", df.shape)

X = df.drop("Label", axis=1)
y = df["Label"]

print("Encoding labels...")

encoder = LabelEncoder()
y = encoder.fit_transform(y)

joblib.dump(encoder, "app/ai/label_encoder.pkl")

print("Splitting dataset...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

joblib.dump((X_train, X_test, y_train, y_test), "app/ai/dataset.pkl")

print("\nDataset prepared successfully.")