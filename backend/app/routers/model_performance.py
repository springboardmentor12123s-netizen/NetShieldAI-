from fastapi import APIRouter

router = APIRouter()


@router.get("/performance")
def get_model_performance():

    return {
        "model": {
            "name": "Random Forest Classifier",
            "validation_samples": 50000
        },

        "overall_metrics": {
            "accuracy": 99.70,
            "weighted_precision": 99.69,
            "weighted_recall": 99.70,
            "weighted_f1": 99.69
        },

        "macro_metrics": {
            "macro_precision": 86.12,
            "macro_recall": 82.37,
            "macro_f1": 83.78
        },

        "performance": {
            "average_confidence": 99.73,
            "predictions_per_second": 203647.49,
            "total_prediction_time_seconds": 0.2455,
            "average_prediction_time_ms": 0.0049
        },

        "class_performance": [
            {
                "attack_type": "BENIGN",
                "precision": 1.00,
                "recall": 1.00,
                "f1_score": 1.00
            },
            {
                "attack_type": "Bot",
                "precision": 0.96,
                "recall": 0.59,
                "f1_score": 0.73
            },
            {
                "attack_type": "DDoS",
                "precision": 1.00,
                "recall": 1.00,
                "f1_score": 1.00
            },
            {
                "attack_type": "DoS GoldenEye",
                "precision": 0.97,
                "recall": 0.97,
                "f1_score": 0.97
            },
            {
                "attack_type": "DoS Hulk",
                "precision": 1.00,
                "recall": 0.99,
                "f1_score": 1.00
            },
            {
                "attack_type": "DoS Slowhttptest",
                "precision": 1.00,
                "recall": 0.98,
                "f1_score": 0.99
            },
            {
                "attack_type": "DoS slowloris",
                "precision": 1.00,
                "recall": 0.99,
                "f1_score": 1.00
            },
            {
                "attack_type": "FTP-Patator",
                "precision": 1.00,
                "recall": 1.00,
                "f1_score": 1.00
            },
            {
                "attack_type": "PortScan",
                "precision": 0.99,
                "recall": 1.00,
                "f1_score": 0.99
            },
            {
                "attack_type": "SSH-Patator",
                "precision": 1.00,
                "recall": 0.97,
                "f1_score": 0.98
            },
            {
                "attack_type": "Web Attack - Brute Force",
                "precision": 0.22,
                "recall": 0.15,
                "f1_score": 0.18
            },
            {
                "attack_type": "Web Attack - XSS",
                "precision": 0.20,
                "recall": 0.25,
                "f1_score": 0.22
            }
        ]
    }