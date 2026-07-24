import os
import glob
import numpy as np
import pandas as pd

# ==========================================
# Paths
# ==========================================

dataset_path = "../datasets/CICIDS2017"

# ==========================================
# Find all CSV files
# ==========================================

csv_files = glob.glob(os.path.join(dataset_path, "*.csv"))

print("=" * 50)
print("CICIDS2017 Dataset")
print("=" * 50)

print(f"\nCSV Files Found : {len(csv_files)}\n")

for file in csv_files:
    print(os.path.basename(file))

# ==========================================
# Read all CSV files
# ==========================================

print("\nReading CSV files...\n")

dfs = []

for file in csv_files:

    try:
        df = pd.read_csv(file, low_memory=False)

        print(
            f"{os.path.basename(file)} -> {df.shape}"
        )

        dfs.append(df)

    except Exception as e:

        print(f"Error reading {file}")
        print(e)

# ==========================================
# Merge all datasets
# ==========================================

print("\nMerging datasets...\n")

df = pd.concat(dfs, ignore_index=True)

print("Dataset merged successfully.\n")

# ==========================================
# Remove extra spaces from column names
# ==========================================

df.columns = df.columns.str.strip()

# ==========================================
# Dataset Information
# ==========================================

print("=" * 50)
print("Dataset Information")
print("=" * 50)

print("\nRows :", df.shape[0])
print("Columns :", df.shape[1])

print("\nFirst 5 Rows\n")
print(df.head())

print("\nColumn Names\n")
print(df.columns.tolist())

# ==========================================
# Missing Values
# ==========================================

print("\nChecking Missing Values...\n")

missing = df.isnull().sum()

missing = missing[missing > 0]

if len(missing) == 0:
    print("No Missing Values Found.")
else:
    print(missing)

# ==========================================
# Infinite Values
# ==========================================

print("\nChecking Infinite Values...\n")

numeric_cols = df.select_dtypes(include=np.number).columns

inf_count = np.isinf(df[numeric_cols]).sum().sum()

print("Infinite Values :", inf_count)

# Replace Infinite values

df.replace([np.inf, -np.inf], np.nan, inplace=True)

# ==========================================
# Remove Missing Values
# ==========================================

before = len(df)

df.dropna(inplace=True)

after = len(df)

print("\nRows Removed :", before - after)
print("Remaining Rows :", after)

# ==========================================
# Remove Duplicate Rows
# ==========================================

before = len(df)

df.drop_duplicates(inplace=True)

after = len(df)

print("\nDuplicate Rows Removed :", before - after)

# ==========================================
# Attack Labels
# ==========================================

print("\nAttack Distribution\n")

print(df["Label"].value_counts())

# ==========================================
# Dataset Summary
# ==========================================

print("\nDataset Summary\n")

print(df.describe())

# ==========================================
# Save Clean Dataset
# ==========================================

output_file = "cleaned_dataset.csv"

df.to_csv(output_file, index=False)

print("\nCleaned dataset saved successfully.")

print("File Name :", output_file)

print("\nFinished Successfully.")