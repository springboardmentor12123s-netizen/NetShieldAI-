"""
SMTP email service.

Used by:
  - Feature 2: password reset emails (auth_router.forgot_password)
  - Feature 3: critical attack alert emails (predict_router.predict)

All credentials come from environment variables via app.config.settings
(SMTP_SERVER, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD) — nothing is hardcoded.

Sending is done in a background thread via asyncio.to_thread so a slow/failed
SMTP connection never blocks or crashes an API request. If SMTP is not
configured (fresh install, no .env values yet), emails are logged to the
console instead so the rest of the app keeps working during development/demo.
"""
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def _send_sync(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.email_from_name} <{settings.smtp_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.smtp_server, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
            print("========== SMTP DEBUG ==========")
            print("SMTP Server:", settings.smtp_server)
            print("SMTP Port:", settings.smtp_port)
            print("SMTP Email:", settings.smtp_email)
            print("SMTP Password Length:", len(settings.smtp_password))
            print("SMTP Configured:", settings.smtp_configured)
            print("================================")
        server.login(settings.smtp_email, settings.smtp_password)
        server.sendmail(settings.smtp_email, [to_email], msg.as_string())


async def send_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Returns True if the email was sent (or logged, in dev mode without
    SMTP configured), False if sending genuinely failed."""
    if not settings.smtp_configured:
        print(
            "[NetShield AI] SMTP not configured — email not sent.\n"
            f"  To: {to_email}\n  Subject: {subject}\n  Body (text):\n  {text_body}"
        )
        return True

    try:
        await asyncio.to_thread(_send_sync, to_email, subject, html_body, text_body)
        return True
    except Exception as exc:  # never let email failures break the caller
        print(f"[NetShield AI] Failed to send email to {to_email}: {exc}")
        return False


def _base_template(inner_html: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0b0f17;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f17;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#10151f;border:1px solid #1e2733;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#0f766e;padding:20px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">
              🛡️ NETSHIELD AI
            </span>
          </td>
        </tr>
        <tr><td style="padding:28px;color:#e6edf3;">{inner_html}</td></tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #1e2733;color:#7d8590;font-size:12px;">
            This is an automated message from NetShield AI — Network Anomaly Detection &amp;
            Threat Monitoring System. Do not reply to this email.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_password_reset_email(to_email: str, reset_link: str, expires_minutes: int) -> bool:
    subject = "Reset your NetShield AI password"
    inner = f"""
      <h2 style="margin:0 0 12px;color:#e6edf3;">Password Reset Requested</h2>
      <p style="color:#a8b3bd;line-height:1.6;">
        We received a request to reset the password for your NetShield AI account.
        Click the button below to choose a new password. This link expires in
        {expires_minutes} minutes.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="{reset_link}"
           style="background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 28px;
                  border-radius:8px;font-weight:600;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color:#7d8590;font-size:13px;line-height:1.6;">
        If you didn't request this, you can safely ignore this email — your password
        will not be changed. If the button doesn't work, copy this link into your browser:<br/>
        <a href="{reset_link}" style="color:#2dd4bf;">{reset_link}</a>
      </p>
    """
    text = (
        "Password Reset Requested\n\n"
        f"Open this link to reset your NetShield AI password (expires in {expires_minutes} minutes):\n"
        f"{reset_link}\n\nIf you didn't request this, you can ignore this email."
    )
    return await send_email(to_email, subject, _base_template(inner), text)


async def send_critical_alert_email(
    to_email: str,
    attack_type: str,
    source_ip: str,
    destination_ip: str,
    risk_score: float,
    confidence: float,
    severity: str,
    timestamp: str,
    recommended_actions: list[str],
) -> bool:
    subject = f"[CRITICAL] NetShield AI detected a {attack_type.upper()} attack"
    actions_html = "".join(f"<li>{a}</li>" for a in recommended_actions) or "<li>Investigate immediately</li>"
    inner = f"""
      <h2 style="margin:0 0 4px;color:#f87171;">🚨 Critical Threat Detected</h2>
      <p style="color:#a8b3bd;margin:0 0 20px;">Severity: <b style="color:#f87171;text-transform:uppercase;">{severity}</b></p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:6px 0;color:#7d8590;">Attack Type</td><td style="padding:6px 0;color:#e6edf3;font-weight:600;">{attack_type}</td></tr>
        <tr><td style="padding:6px 0;color:#7d8590;">Source IP</td><td style="padding:6px 0;color:#e6edf3;">{source_ip}</td></tr>
        <tr><td style="padding:6px 0;color:#7d8590;">Destination IP</td><td style="padding:6px 0;color:#e6edf3;">{destination_ip}</td></tr>
        <tr><td style="padding:6px 0;color:#7d8590;">Risk Score</td><td style="padding:6px 0;color:#f87171;font-weight:700;">{risk_score}/100</td></tr>
        <tr><td style="padding:6px 0;color:#7d8590;">Confidence</td><td style="padding:6px 0;color:#e6edf3;">{confidence}%</td></tr>
        <tr><td style="padding:6px 0;color:#7d8590;">Timestamp</td><td style="padding:6px 0;color:#e6edf3;">{timestamp}</td></tr>
      </table>
      <p style="color:#e6edf3;font-weight:600;margin-bottom:8px;">Recommended Action</p>
      <ul style="color:#a8b3bd;line-height:1.7;margin:0;padding-left:20px;">{actions_html}</ul>
    """
    text = (
        f"CRITICAL THREAT DETECTED\n\n"
        f"Attack Type: {attack_type}\nSource IP: {source_ip}\nDestination IP: {destination_ip}\n"
        f"Risk Score: {risk_score}/100\nConfidence: {confidence}%\nSeverity: {severity}\n"
        f"Timestamp: {timestamp}\n\nRecommended Actions: {', '.join(recommended_actions)}"
    )
    return await send_email(to_email, subject, _base_template(inner), text)
