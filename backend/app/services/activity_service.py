from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog

def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int = None,
    details: str = None,
    ip_address: str = None
):
    try:
        log = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()