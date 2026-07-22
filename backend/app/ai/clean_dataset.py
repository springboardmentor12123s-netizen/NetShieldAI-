import pandas as pd
import numpy as np

DATASET_PATH = r"C:\Users\KARETI POSHITA\Desktop\NetShield-AI-Learning\datasets\CICIDS2017\merged_dataset.csv"

print("Loading merged dataset...")

df = pd.read_csv(DATASET_PATH)

df.columns = df.columns.str.strip()

print("Original Shape:", df.shape)

df.replace([np.inf, -np.inf], np.nan, inplace=True)

df.dropna(inplace=True)

print("After removing missing values:", df.shape)

df.drop_duplicates(inplace=True)

print("After removing duplicates:", df.shape)

print("\nAttack Distribution:")
print(df["Label"].value_counts())

OUTPUT_PATH = r"C:\Users\KARETI POSHITA\Desktop\NetShield-AI-Learning\datasets\CICIDS2017\clean_dataset.csv"

df.to_csv(OUTPUT_PATH, index=False)

print("\nClean dataset saved successfully.")
print(OUTPUT_PATH)