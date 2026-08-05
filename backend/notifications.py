import requests
import json
import os

# Paste your copied Slack Webhook URL right here inside the quotes
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
def send_critical_alert(source_ip: str, threat_type: str, severity: str, details: str):
    # ... (the rest of the function remains exactly the same as before) ...
    if not SLACK_WEBHOOK_URL:
        print("Webhook URL not configured. Skipping Slack alert.")
        return

    slack_payload = {
        "attachments": [
            {
                "color": "#FF0000",
                "pretext": "🚨 *CRITICAL THREAT DETECTED* 🚨",
                "title": f"Threat Category: {threat_type}",
                "text": "The NetShield AI engine has intercepted a high-risk anomaly.",
                "fields": [
                    {
                        "title": "Source IP",
                        "value": source_ip,
                        "short": True
                    },
                    {
                        "title": "Severity",
                        "value": severity,
                        "short": True
                    },
                    {
                        "title": "Technical Details",
                        "value": details,
                        "short": False
                    }
                ],
                "footer": "NetShield AI • Security Operations Center"
            }
        ]
    }

    try:
        response = requests.post(
            SLACK_WEBHOOK_URL, 
            data=json.dumps(slack_payload),
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code != 200:
            print(f"Failed to send Slack alert: {response.text}")
        else:
            print("Slack alert fired successfully!")
    except Exception as e:
        print(f"Error firing Slack webhook: {str(e)}")