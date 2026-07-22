import pandas as pd
from datetime import datetime

# Load both datasets
cicids = pd.read_csv("cicids2017_cleaned.csv")
unsw = pd.read_csv("UNSW_NB15_training-set.csv")

report_lines = []

def add(line=""):
    print(line)
    report_lines.append(line)

add("=" * 60)
add("NetShield AI - Threat Intelligence Report")
add(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
add("=" * 60)

# ---------- CICIDS2017 summary ----------
add("\n--- Dataset 1: CICIDS2017 ---")
total_cicids = len(cicids)
attack_counts = cicids["Attack Type"].value_counts()
normal_count = attack_counts.get("Normal Traffic", 0)
attack_total = total_cicids - normal_count

add(f"Total records analyzed: {total_cicids:,}")
add(f"Normal traffic: {normal_count:,} ({normal_count/total_cicids*100:.1f}%)")
add(f"Attack traffic: {attack_total:,} ({attack_total/total_cicids*100:.1f}%)")
add("\nTop attack types detected:")
for attack, count in attack_counts.items():
    if attack != "Normal Traffic":
        pct = count / total_cicids * 100
        add(f"  - {attack}: {count:,} incidents ({pct:.2f}% of all traffic)")

# ---------- UNSW-NB15 summary ----------
add("\n--- Dataset 2: UNSW-NB15 ---")
total_unsw = len(unsw)
cat_counts = unsw["attack_cat"].value_counts()
normal_unsw = cat_counts.get("Normal", 0)
attack_unsw = total_unsw - normal_unsw

add(f"Total records analyzed: {total_unsw:,}")
add(f"Normal traffic: {normal_unsw:,} ({normal_unsw/total_unsw*100:.1f}%)")
add(f"Attack traffic: {attack_unsw:,} ({attack_unsw/total_unsw*100:.1f}%)")
add("\nTop attack categories detected:")
for cat, count in cat_counts.items():
    if cat != "Normal":
        pct = count / total_unsw * 100
        add(f"  - {cat}: {count:,} incidents ({pct:.2f}% of all traffic)")

# ---------- Combined risk assessment ----------
add("\n--- Combined Threat Assessment ---")
combined_attack_pct = ((attack_total + attack_unsw) / (total_cicids + total_unsw)) * 100
add(f"Across both datasets ({total_cicids + total_unsw:,} total records),")
add(f"{combined_attack_pct:.1f}% of traffic was classified as malicious.")

# Most severe/common attack overall
top_cicids_attack = attack_counts.drop("Normal Traffic", errors="ignore").idxmax()
top_unsw_attack = cat_counts.drop("Normal", errors="ignore").idxmax()
add(f"\nMost frequent attack type (CICIDS2017): {top_cicids_attack}")
add(f"Most frequent attack type (UNSW-NB15): {top_unsw_attack}")

add("\n--- Recommendations ---")
add("1. Prioritize detection tuning for the most frequent attack types above.")
add("2. Investigate protocols/services with disproportionate attack ratios")
add("   (see packet_monitor.py output for protocol-level breakdown).")
add("3. Continue monitoring low-sample attack classes (e.g. Bots, Worms) as")
add("   they are harder for the model to learn reliably with limited examples.")

add("\nReport generation completed successfully.")

# Save to file
with open("../models/threat_intelligence_report.txt", "w") as f:
    f.write("\n".join(report_lines))

print("\nSaved to models/threat_intelligence_report.txt")