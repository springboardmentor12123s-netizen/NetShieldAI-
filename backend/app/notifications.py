import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# --- CONFIGURATION ---
# Replace these with your Gmail credentials
SENDER_EMAIL = "smallscreennetwork2023@gmail.com"      # Replace with your Gmail
SENDER_PASSWORD = "bagz aguq oxtz biiv" # Replace with your App Password
RECEIVER_EMAIL = "naikshreyash1147@gmail.com"    # Replace with where you want to receive alerts

def send_alert_email(threat_type, risk_score, src_ip, dst_ip):
    try:
        msg = MIMEMultipart("alternative")
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"🚨 [URGENT] NetShield AI Alert: {threat_type} Detected!"

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 8px; border-top: 5px solid #ef4444;">
              <h2 style="color: #ef4444;">Security Alert Triggered</h2>
              <p>The NetShield AI engine has detected a malicious network flow.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Threat Type:</td><td style="padding: 8px; border: 1px solid #ddd; color: #ef4444;">{threat_type}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Risk Score:</td><td style="padding: 8px; border: 1px solid #ddd;">{risk_score}/100</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Source IP:</td><td style="padding: 8px; border: 1px solid #ddd;">{src_ip}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Destination IP:</td><td style="padding: 8px; border: 1px solid #ddd;">{dst_ip}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time:</td><td style="padding: 8px; border: 1px solid #ddd;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td></tr>
              </table>
              <p style="margin-top: 20px; font-size: 12px; color: gray;">This is an automated message from NetShield AI. Please log in to the dashboard to investigate.</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))

        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print("[+] Threat alert email sent successfully!")
    except Exception as e:
        print(f"[-] Failed to send email: {e}")