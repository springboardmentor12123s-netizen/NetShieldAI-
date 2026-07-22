from fastapi import APIRouter
from data.audit_logs import audit_logs

router = APIRouter()


@router.get("/audit-logs")
def get_logs():
    return audit_logs


@router.post("/audit-logs")
def create_log(log: dict):

    new_log = {
        "id": len(audit_logs) + 1,
        "user": log["user"],
        "action": log["action"]
    }

    audit_logs.append(new_log)

    return {
        "message": "Audit Log Added",
        "log": new_log
    }