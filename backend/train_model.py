import os
import pickle
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

UNSW_PATH   = os.path.join("dataset", "Payload_data_UNSW.csv")
CICIDS_PATH = os.path.join("dataset", "Payload_data_CICIDS2017.csv")
MODEL_DIR   = os.path.join("backend", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("  NetShield AI — Clean 10k Balanced Model Training")
print("=" * 60)

drop_cols = ['id', 'srcip', 'dstip', 'sport', 'dsport', 'stime', 'ltime',
             'Stime', 'Ltime', 'src_ip', 'dst_ip', 't_delta']

def map_protocol(val):
    val_str = str(val).strip().lower()
    if 'tcp' in val_str or val_str == '6': return 6.0
    if 'udp' in val_str or val_str == '17': return 17.0
    if 'icmp' in val_str or val_str == '1': return 1.0
    try:
        return float(val_str)
    except:
        return 0.0

print("\n[1/5] Loading and balancing 10,000 clean records...")

df_unsw = pd.read_csv(UNSW_PATH, nrows=50000, low_memory=False)
y_unsw_bin = df_unsw['label'].astype(str).str.strip().apply(
    lambda v: 0 if v in ['0', 'Normal', 'normal', 'BENIGN'] else 1
)
df_unsw['bin_label'] = y_unsw_bin
df_unsw['cat_label'] = y_unsw_bin.apply(lambda v: 'Normal' if v == 0 else 'Attack')

unsw_normal = df_unsw[df_unsw['bin_label'] == 0].sample(n=min(2500, len(df_unsw[df_unsw['bin_label'] == 0])), random_state=42)
unsw_attack = df_unsw[df_unsw['bin_label'] == 1].sample(n=min(2500, len(df_unsw[df_unsw['bin_label'] == 1])), random_state=42)

df_cicids = pd.read_csv(CICIDS_PATH, nrows=50000, low_memory=False)
df_cicids['bin_label'] = df_cicids['label'].astype(str).str.strip().apply(
    lambda v: 0 if v in ['0', 'Normal', 'normal', 'BENIGN'] else 1
)
df_cicids['cat_label'] = df_cicids['label'].astype(str).str.strip().replace({'BENIGN': 'Normal'})

cicids_normal = df_cicids[df_cicids['bin_label'] == 0].sample(n=min(2500, len(df_cicids[df_cicids['bin_label'] == 0])), random_state=42)
cicids_attack = df_cicids[df_cicids['bin_label'] == 1].sample(n=min(2500, len(df_cicids[df_cicids['bin_label'] == 1])), random_state=42)

df_clean = pd.concat([unsw_normal, unsw_attack, cicids_normal, cicids_attack], ignore_index=True)
df_clean = df_clean.sample(frac=1.0, random_state=42).reset_index(drop=True)

print(f"      Total clean sampled rows: {len(df_clean)}")
print(f"      Binary distribution:\n{df_clean['bin_label'].value_counts().to_string()}")
print(f"      Attack category breakdown:\n{df_clean['cat_label'].value_counts().to_string()}")

print("\n[2/5] Cleaning features and handling non-numeric data...")

y_bin = df_clean['bin_label']
y_cat = df_clean['cat_label']

X = df_clean.drop(columns=['label', 'bin_label', 'cat_label'])
X = X.drop(columns=[c for c in drop_cols if c in X.columns], errors='ignore')

if 'protocol' in X.columns:
    X['protocol'] = X['protocol'].apply(map_protocol)

for col in X.columns:
    if not pd.api.types.is_numeric_dtype(X[col]):
        X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)

X = X.fillna(0).astype(np.float32)
feature_columns = list(X.columns)
print(f"      Clean feature count: {len(feature_columns)}")

le_cat = LabelEncoder()
y_cat_encoded = le_cat.fit_transform(y_cat)
cat_classes = list(le_cat.classes_)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test, yc_train, yc_test = train_test_split(
    X_scaled, y_bin, y_cat_encoded, test_size=0.2, random_state=42, stratify=y_bin
)
print(f"      Train size: {len(X_train)}, Test size: {len(X_test)}")

print("\n[3/5] Training Isolation Forest (Anomaly Detection)...")
iso_forest = IsolationForest(
    n_estimators=100,
    contamination=0.45,
    random_state=42,
    n_jobs=-1
)
iso_forest.fit(X_train)

iso_pred = iso_forest.predict(X_test)
iso_binary = np.where(iso_pred == -1, 1, 0)
iso_acc = accuracy_score(y_test, iso_binary)
print(f"      Isolation Forest Accuracy: {iso_acc:.4f}")

print("\n[4/5] Training Regularized Random Forest Classifier...")
rf_clf = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)
rf_clf.fit(X_train, yc_train)

rf_pred = rf_clf.predict(X_test)
rf_acc = accuracy_score(yc_test, rf_pred)
print(f"      Random Forest Accuracy: {rf_acc:.4f}")
print(f"      Classification Report:\n{classification_report(yc_test, rf_pred, target_names=cat_classes, zero_division=0)}")

print("\n[5/5] Saving clean production models...")

def save_pkl(obj, filename):
    path = os.path.join(MODEL_DIR, filename)
    with open(path, "wb") as f:
        pickle.dump(obj, f)
    print(f"      Saved → {path}")

save_pkl(iso_forest,      "isolation_forest.pkl")
save_pkl(rf_clf,          "random_forest.pkl")
save_pkl(le_cat,          "label_encoder.pkl")
save_pkl(feature_columns, "feature_columns.pkl")
save_pkl(scaler,          "scaler.pkl")
save_pkl(cat_classes,     "attack_classes.pkl")

print("\n" + "=" * 60)
print("  Clean 10k Model Training Complete!")
print(f"  Random Forest Accuracy: {rf_acc:.4f}")
print("=" * 60)
