import pandas as pd

# Load the UNSW-NB15 training set
df = pd.read_csv("UNSW_NB15_training-set.csv")

print("=" * 50)
print("UNSW-NB15 Dataset - Basic Info")
print("=" * 50)

print(f"\nShape (rows, columns): {df.shape}")

print(f"\nColumn names:\n{list(df.columns)}")

print(f"\nFirst 5 rows:\n{df.head()}")

print(f"\nData types:\n{df.dtypes}")

print(f"\nMissing values per column:\n{df.isnull().sum()}")

# UNSW-NB15 typically has a binary 'label' column (0 = normal, 1 = attack)
# and an 'attack_cat' column (specific attack type name)
if "label" in df.columns:
    print(f"\nLabel distribution (0=Normal, 1=Attack):\n{df['label'].value_counts()}")

if "attack_cat" in df.columns:
    print(f"\nAttack category breakdown:\n{df['attack_cat'].value_counts()}")