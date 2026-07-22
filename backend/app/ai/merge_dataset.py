import os
import pandas as pd

DATASET_FOLDER = r"C:\Users\KARETI POSHITA\Desktop\NetShield-AI-Learning\datasets\CICIDS2017"

all_data = []

for file in os.listdir(DATASET_FOLDER):

    if file.endswith(".csv"):

        print(f"Loading {file}")

        file_path = os.path.join(DATASET_FOLDER, file)

        df = pd.read_csv(file_path)

        df.columns = df.columns.str.strip()

        all_data.append(df)

merged_df = pd.concat(all_data, ignore_index=True)

print("\nMerged Dataset Shape:")
print(merged_df.shape)

output_path = os.path.join(DATASET_FOLDER, "merged_dataset.csv")

merged_df.to_csv(output_path, index=False)

print("\nMerged dataset saved successfully.")
print(output_path)