import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import (
    SMTP_SERVER,
    SMTP_PORT,
    EMAIL_ADDRESS,
    EMAIL_PASSWORD,
)


def send_email(
    receiver: str,
    subject: str,
    body: str,
):

    message = MIMEMultipart()

    message["From"] = EMAIL_ADDRESS
    message["To"] = receiver
    message["Subject"] = subject

    message.attach(
        MIMEText(
            body,
            "plain",
        )
    )

    try:

        server = smtplib.SMTP(
            SMTP_SERVER,
            SMTP_PORT,
        )

        server.starttls()

        server.login(
            EMAIL_ADDRESS,
            EMAIL_PASSWORD,
        )

        server.sendmail(
            EMAIL_ADDRESS,
            receiver,
            message.as_string(),
        )

        server.quit()

        print("Email sent successfully.")

        return True

    except Exception as e:

        print("Email Error:", e)

        return False