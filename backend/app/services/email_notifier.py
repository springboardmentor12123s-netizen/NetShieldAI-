import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings


def send_alert_email(alert_title: str, description: str, severity: str, risk_score: float):
    """
    Sends an email notification for a critical/high severity alert.
    Fails silently (logs to console) if SMTP isn't configured or fails,
    so a broken email setup never blocks the scoring pipeline.
    """
    if not settings.smtp_enabled:
        return

    if not settings.smtp_username or not settings.alert_email_to:
        print("[email_notifier] SMTP enabled but username/recipient missing — skipping email.")
        return

    subject = f"🚨 NetShield AI Alert: {alert_title}"
    body = f"""
NetShield AI — Threat Alert

Severity: {severity.upper()}
Risk Score: {risk_score}

{description}

This is an automated notification from your NetShield AI monitoring platform.
""".strip()

    message = MIMEMultipart()
    message["From"] = settings.alert_email_from or settings.smtp_username
    message["To"] = settings.alert_email_to
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls(context=context)
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(
                message["From"],
                settings.alert_email_to,
                message.as_string(),
            )
        print(f"[email_notifier] Alert email sent for: {alert_title}")
    except Exception as e:
        print(f"[email_notifier] Failed to send email: {e}")