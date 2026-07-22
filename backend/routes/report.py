from fastapi import APIRouter
from fastapi.responses import FileResponse

from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from routes.ai import prediction_history

router = APIRouter(prefix="/report", tags=["Reports"])


@router.get("/generate")
def generate():

    if prediction_history:
        latest = prediction_history[0]
    else:
        latest = {
            "threat": "No Prediction",
            "confidence": 0,
            "risk": 0,
            "severity": "Unknown",
            "anomaly": False,
            "recommendation": "No recommendation available."
        }

    filename = "AI_Security_Report.pdf"

    doc = SimpleDocTemplate(filename)

    styles = getSampleStyleSheet()

    story = []

    story.append(Paragraph("<b>NETSHIELD AI SECURITY REPORT</b>", styles["Title"]))
    story.append(Paragraph("<br/>", styles["BodyText"]))

    story.append(Paragraph(f"<b>Threat:</b> {latest['threat']}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Confidence:</b> {latest['confidence']}%", styles["BodyText"]))
    story.append(Paragraph(f"<b>Risk Score:</b> {latest['risk']}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Severity:</b> {latest['severity']}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Anomaly:</b> {'YES' if latest['anomaly'] else 'NO'}", styles["BodyText"]))

    story.append(Paragraph("<br/>", styles["BodyText"]))

    story.append(Paragraph("<b>Recommendation</b>", styles["Heading2"]))

    story.append(
        Paragraph(
            latest.get("recommendation", "No recommendation available."),
            styles["BodyText"],
        )
    )

    doc.build(story)

    return FileResponse(
        filename,
        media_type="application/pdf",
        filename="AI_Security_Report.pdf",
    )