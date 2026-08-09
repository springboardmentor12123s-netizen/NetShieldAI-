import os
import glob
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

CICIDS_PATH = os.path.join(BASE_DIR, "..", "datasets", "CICIDS2017")
UNSW_PATH = os.path.join(BASE_DIR, "..", "datasets", "UNSW-NB15")


def load_summary():

    summary = {
        "totalFlows": 0,
        "benign": 0,
        "attacks": 0,
        "attackTypes": {},
        "datasets": []
    }

    # ----------------------------
    # CICIDS2017
    # ----------------------------
    cic_files = glob.glob(os.path.join(CICIDS_PATH, "*.csv"))

    for file in cic_files:

        try:

            df = pd.read_csv(
                file,
                nrows=50000,          # Read only first 50k rows
                low_memory=False,
                on_bad_lines="skip",
                encoding="latin1"
            )
            

            summary["datasets"].append({
                "name": os.path.basename(file),
                "rows": len(df),
                "features": len(df.columns)
            })

            summary["totalFlows"] += len(df)

            if "Label" in df.columns:

                counts = df["Label"].value_counts()

                for attack, count in counts.items():

                    summary["attackTypes"][attack] = summary["attackTypes"].get(attack, 0) + int(count)

                    if attack.upper() == "BENIGN":

                        summary["benign"] += int(count)

                    else:

                        summary["attacks"] += int(count)

        except Exception as e:

            print("CICIDS Error:", file, e)

    # ----------------------------
    # UNSW-NB15
    # ----------------------------
    unsw_files = glob.glob(os.path.join(UNSW_PATH, "*.csv"))

    for file in unsw_files:

        if "features" in file.lower():
            continue

        if "LIST_EVENTS" in file.upper():
            continue

        try:

            df = pd.read_csv(
                file,
                nrows=50000,          # Read only first 50k rows
                low_memory=False,
                on_bad_lines="skip",
                encoding="latin1"
            )

            summary["datasets"].append({
                "name": os.path.basename(file),
                "rows": len(df),
                "features": len(df.columns)
            })

            summary["totalFlows"] += len(df)

            if "attack_cat" in df.columns:

                counts = df["attack_cat"].fillna("Normal").value_counts()

                for attack, count in counts.items():

                    summary["attackTypes"][attack] = summary["attackTypes"].get(attack, 0) + int(count)

                    if attack.lower() == "normal":

                        summary["benign"] += int(count)

                    else:

                        summary["attacks"] += int(count)

        except Exception as e:

            print("UNSW Error:", file, e)

    return summary
# Cache the summary when the server starts
DATASET_SUMMARY = load_summary()