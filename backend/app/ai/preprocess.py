import pandas as pd


import os
import pandas as pd

DATASET_FOLDER = r"C:\Users\KARETI POSHITA\Desktop\NetShield-AI-Learning\datasets\CICIDS2017"

all_files = []

for file in os.listdir(DATASET_FOLDER):
    if file.endswith(".csv"):
        all_files.append(os.path.join(DATASET_FOLDER, file))

print("Files Found:")
for file in all_files:
    print(file)


df_list = []

for file in all_files:
    print("Loading:", file)
    temp = pd.read_csv(file)
    df_list.append(temp)


df = pd.concat(df_list, ignore_index=True)

print("Combined Dataset Shape:")
print(df.shape)

df.columns = df.columns.str.strip()

print("\n========== DATASET INFORMATION ==========\n")

print("Dataset Shape:")
print(df.shape)

print("\nColumn Names:")
print(df.columns.tolist())


print("\nFirst 5 Rows:")
print(df.head())


print("\nDataset Info:")
df.info()

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Rows:")
print(df.duplicated().sum())

print("\nAttack Labels:")
print(df["Label"].value_counts())