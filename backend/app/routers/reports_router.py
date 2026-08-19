"""
Reports module — exports Threat / Prediction / Traffic reports as CSV or PDF.
"""
import io
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.auth import get_current_user
from app.database import alerts_collection, packets_collection, predictions_collection

router = APIRouter(prefix="/api/reports", tags=["reports"])

REPORT_SOURCES = {
    "threat": (alerts_collection, ["source_ip", "attack_type", "severity", "risk_score", "resolved", "false_positive", "created_at"]),
    "prediction": (predictions_collection, ["prediction_id", "source_ip", "attack_type", "confidence", "risk_score", "threat_level", "created_at"]),
    "traffic": (packets_collection, ["packet_id", "source_ip", "destination_ip", "protocol", "packet_size", "duration", "flow_rate", "status", "timestamp"]),
}


async def _fetch_rows(report_type: str, limit: int) -> list[dict]:
    if report_type not in REPORT_SOURCES:
        raise HTTPException(status_code=400, detail=f"Unknown report type. Use one of: {list(REPORT_SOURCES)}")
    collection, columns = REPORT_SOURCES[report_type]
    sort_field = "created_at" if "created_at" in columns else "timestamp"
    cursor = collection.find().sort(sort_field, -1).limit(limit)
    rows = []
    async for doc in cursor:
        rows.append({col: doc.get(col, "") for col in columns})
    return rows, columns


@router.get("/{report_type}/csv")
async def export_csv(report_type: str, limit: int = 1000, current_user=Depends(get_current_user)):
    rows, columns = await _fetch_rows(report_type, limit)
    df = pd.DataFrame(rows, columns=columns)
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    filename = f"netshield_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{report_type}/pdf")
async def export_pdf(report_type: str, limit: int = 200, current_user=Depends(get_current_user)):
    rows, columns = await _fetch_rows(report_type, limit)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(f"NetShield AI — {report_type.title()} Report", styles["Title"]),
        Paragraph(f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} · {len(rows)} records", styles["Normal"]),
        Spacer(1, 16),
    ]

    table_data = [columns] + [[str(row.get(col, "")) for col in columns] for row in rows]
    table = Table(table_data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    filename = f"netshield_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
