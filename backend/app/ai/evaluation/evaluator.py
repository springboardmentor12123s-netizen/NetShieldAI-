"""Evaluator module to output HTML and JSON metric reports for trained models."""

import os
import json


class ModelEvaluator:
    def __init__(self):
        self.reports_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            "docs",
            "reports"
        )

    def write_reports(self, metrics: dict):
        """Write evaluation metrics as JSON and HTML for auditors."""
        os.makedirs(self.reports_dir, exist_ok=True)
        
        # 1. Save JSON metrics
        json_path = os.path.join(self.reports_dir, "anomaly_detection_report.json")
        with open(json_path, mode="w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=4)
        print(f"Saved audit JSON report to {json_path}")
        
        # 2. Save HTML metrics
        html_path = os.path.join(self.reports_dir, "anomaly_detection_report.html")
        
        report_title = "NetShield AI - Model Performance & Accuracy Audit Report"
        
        # Construct classification report HTML rows
        class_rows_html = ""
        cr = metrics.get("classification_report", {})
        for label, scores in cr.items():
            if not isinstance(scores, dict):
                continue
            precision = scores.get("precision", 0) * 100
            recall = scores.get("recall", 0) * 100
            f1 = scores.get("f1-score", 0) * 100
            support = scores.get("support", 0)
            
            class_rows_html += f"""
            <tr>
                <td style="padding: 10px; border: 1px solid #1e293b; font-weight: bold; color: #ffffff;">{label}</td>
                <td style="padding: 10px; border: 1px solid #1e293b; text-align: center; color: #94a3b8;">{precision:.2f}%</td>
                <td style="padding: 10px; border: 1px solid #1e293b; text-align: center; color: #94a3b8;">{recall:.2f}%</td>
                <td style="padding: 10px; border: 1px solid #1e293b; text-align: center; color: #94a3b8;">{f1:.2f}%</td>
                <td style="padding: 10px; border: 1px solid #1e293b; text-align: center; color: #64748b;">{int(support)}</td>
            </tr>
            """
            
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{report_title}</title>
    <style>
        body {{
            background-color: #090d16;
            color: #e2e8f0;
            font-family: 'Segoe UI', Inter, sans-serif;
            margin: 0;
            padding: 40px;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background-color: #0c1322;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }}
        h1 {{
            color: #6366f1;
            margin-top: 0;
            font-size: 24px;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 15px;
        }}
        .stat-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            margin-top: 20px;
        }}
        .stat-card {{
            background-color: #090d16;
            border: 1px solid #1e293b;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }}
        .stat-title {{
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: bold;
        }}
        .stat-value {{
            font-size: 20px;
            font-weight: bold;
            color: #ffffff;
            margin-top: 5px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
        }}
        th {{
            background-color: #060b13;
            color: #64748b;
            padding: 12px;
            text-align: left;
            border: 1px solid #1e293b;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            background-color: #1e1b4b;
            color: #818cf8;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ NetShield AI Performance Audit Report</h1>
        <p>This automated report summarizes the metrics of the trained network security models (DDoS, Port Scanning, Exploits, DoS, Fuzzers, and outlier events).</p>
        
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-title">Dataset size</div>
                <div class="stat-value">{metrics.get("dataset_size", 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Test Size</div>
                <div class="stat-value">{metrics.get("test_size", 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Anomalies Detected</div>
                <div class="stat-value" style="color: #f43f5e;">{metrics.get("anomalies_flagged", 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Classifier Accuracy</div>
                <div class="stat-value" style="color: #10b981;">{metrics.get("threat_classifier_accuracy", 0)*100:.2f}%</div>
            </div>
        </div>
        
        <h3 style="color: #ffffff; margin-bottom: 5px;">Supervised Threat Classifier Performance</h3>
        <p style="color: #64748b; font-size: 12px; margin-top: 0;">Evaluation of the multi-class RandomForest model on segregated test data:</p>
        <table>
            <thead>
                <tr>
                    <th>Threat Category</th>
                    <th style="text-align: center;">Precision</th>
                    <th style="text-align: center;">Recall</th>
                    <th style="text-align: center;">F1-Score</th>
                    <th style="text-align: center;">Tested Samples</th>
                </tr>
            </thead>
            <tbody>
                {class_rows_html}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 15px; text-align: right; font-size: 11px; color: #475569;">
            NetShield AI Modeling Engine • Generated automatically at training runtime.
        </div>
    </div>
</body>
</html>
"""
        with open(html_path, mode="w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"Saved audit HTML report to {html_path}")
