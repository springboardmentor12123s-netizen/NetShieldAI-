from fastapi import APIRouter

from app.services.email_service import send_email
from app.config import EMAIL_ADDRESS

router = APIRouter()


@router.get("/test-email")
def test_email():

    success = send_email(
        receiver=EMAIL_ADDRESS,
        subject="NetShield AI Test Email",
        body=(
            "Congratulations!\n\n"
            "Your NetShield AI email configuration is working successfully."
        ),
    )

    if success:
        return {
            "message": "Email sent successfully."
        }

    return {
        "message": "Email sending failed."
    }