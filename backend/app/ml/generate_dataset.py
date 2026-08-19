"""
========================================================================
 THIS IS WHERE YOU GIVE NETSHIELD AI YOUR DATASET.
========================================================================

Option A — Use your own real dataset (recommended for the final project):
    1. Get a network intrusion dataset, e.g.:
         - NSL-KDD        https://www.unb.ca/cic/datasets/nsl.html
         - CICIDS2017      https://www.unb.ca/cic/datasets/ids-2017.html
         - UNSW-NB15       https://research.unsw.edu.au/projects/unsw-nb15-dataset
    2. Drop the CSV file at:
         backend/app/data/network_traffic.csv
       (the exact path is controlled by DATASET_PATH in backend/.env)
    3. Make sure it has a label column indicating "normal" vs attack type.
       If your column names differ from what train_model.py expects,
       edit the FEATURE_COLUMNS / LABEL_COLUMN section in train_model.py
       to match your dataset's headers.

Option B — No dataset yet / just want the app running end-to-end:
    Run this script. It generates a realistic *synthetic* network-traffic
    dataset (normal + DDoS + PortScan + BruteForce + Botnet samples) and
    saves it to the same path, so the rest of the pipeline (training,
    prediction, dashboard) works immediately.

        python -m app.ml.generate_dataset
========================================================================
"""
import numpy as np
import pandas as pd
from pathlib import Path

from app.config import settings

RNG = np.random.default_rng(42)


def _make_class(n, protocol_choices, src_bytes_range, dst_bytes_range,
                 duration_range, flow_rate_range, label, wrong_frag_p=0.02,
                 urgent_p=0.01):
    return pd.DataFrame({
        "duration": RNG.uniform(*duration_range, n),
        "protocol_type": RNG.choice(protocol_choices, n),
        "src_bytes": RNG.uniform(*src_bytes_range, n),
        "dst_bytes": RNG.uniform(*dst_bytes_range, n),
        "packet_count": RNG.integers(1, 5000, n),
        "flow_rate": RNG.uniform(*flow_rate_range, n),
        "wrong_fragment": RNG.binomial(1, wrong_frag_p, n),
        "urgent": RNG.binomial(1, urgent_p, n),
        "count": RNG.integers(1, 500, n),
        "srv_count": RNG.integers(1, 500, n),
        "label": label,
    })


def generate(n_normal=6000, n_attack_each=1000) -> pd.DataFrame:
    normal = _make_class(
        n_normal, ["tcp", "udp"], (40, 1500), (40, 1500),
        (0.1, 30), (1, 50), "normal",
    )
    ddos = _make_class(
        n_attack_each, ["udp", "tcp"], (0, 60), (0, 60),
        (0, 1), (500, 5000), "ddos", wrong_frag_p=0.15,
    )
    portscan = _make_class(
        n_attack_each, ["tcp"], (0, 40), (0, 40),
        (0, 0.5), (50, 400), "portscan",
    )
    bruteforce = _make_class(
        n_attack_each, ["tcp"], (20, 200), (20, 200),
        (0.5, 5), (20, 150), "bruteforce", urgent_p=0.1,
    )
    botnet = _make_class(
        n_attack_each, ["tcp", "udp"], (10, 800), (10, 800),
        (1, 20), (30, 300), "botnet", wrong_frag_p=0.08,
    )

    df = pd.concat([normal, ddos, portscan, bruteforce, botnet], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle
    return df


if __name__ == "__main__":
    out_path = Path(settings.dataset_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    dataset = generate()
    dataset.to_csv(out_path, index=False)
    print(f"Synthetic dataset written to {out_path.resolve()} ({len(dataset)} rows)")
