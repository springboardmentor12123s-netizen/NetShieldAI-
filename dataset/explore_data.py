import pandas as pd

df = pd.read_csv("cicids2017_cleaned.csv")


print("Shape of dataset (rows, columns):", df.shape)
print("\nColumn names:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head())

print("\nLabel counts (normal vs attack types):")
print(df.iloc[:, -1].value_counts())