import pandas as pd

# Load the UNSW-NB15 dataset (acts as our captured traffic sample)
df = pd.read_csv("UNSW_NB15_training-set.csv")

print("=" * 55)
print("NetShield AI - Packet Monitoring Workflow (Simplified)")
print("=" * 55)

# ---------- 1. Protocol breakdown ----------
print("\n--- Protocol Distribution ---")
print(df["proto"].value_counts().head(10))

# ---------- 2. Service breakdown (application layer) ----------
print("\n--- Top Services/Ports Used ---")
print(df["service"].value_counts().head(10))

# ---------- 3. Connection state breakdown ----------
print("\n--- Connection State Distribution ---")
print(df["state"].value_counts())

# ---------- 4. Traffic volume stats ----------
print("\n--- Traffic Volume Summary (bytes) ---")
print(f"Total source bytes sent:      {df['sbytes'].sum():,}")
print(f"Total destination bytes sent: {df['dbytes'].sum():,}")
print(f"Average packet size (src):    {df['sbytes'].mean():.2f} bytes")
print(f"Average packet size (dst):    {df['dbytes'].mean():.2f} bytes")

# ---------- 5. Top 10 "heaviest" flows (highest byte count) ----------
print("\n--- Top 10 Heaviest Flows (by total bytes) ---")
df["total_bytes"] = df["sbytes"] + df["dbytes"]
top_flows = df.sort_values("total_bytes", ascending=False).head(10)
print(top_flows[["proto", "service", "state", "sbytes", "dbytes", "total_bytes", "attack_cat"]])

# ---------- 6. Packet count summary ----------
print("\n--- Packet Count Summary ---")
print(f"Total source packets:      {df['spkts'].sum():,}")
print(f"Total destination packets: {df['dpkts'].sum():,}")

# ---------- 7. Normal vs Attack traffic by protocol ----------
print("\n--- Normal vs Attack Traffic by Protocol (Top 5 protocols) ---")
top_protocols = df["proto"].value_counts().head(5).index
for proto in top_protocols:
    subset = df[df["proto"] == proto]
    normal_count = (subset["label"] == 0).sum()
    attack_count = (subset["label"] == 1).sum()
    print(f"{proto:10s} -> Normal: {normal_count:6d} | Attack: {attack_count:6d}")

print("\nPacket monitoring workflow completed successfully.")