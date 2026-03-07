from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.utils.dependencies import require_manager_or_above
from pydantic import BaseModel
from datetime import datetime

class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None
    user_role: Optional[str] = None

    class Config:
        from_attributes = True

router = APIRouter(prefix="/api/activity", tags=["Activity Log"])

@router.get("/", response_model=List[ActivityLogResponse])
def get_activity_logs(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    query = db.query(ActivityLog)
    if action:
        query = query.filter(ActivityLog.action == action)
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)

    logs = query.order_by(desc(ActivityLog.created_at)).offset(skip).limit(limit).all()

    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append(ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at,
            user_name=user.name if user else "Unknown",
            user_role=user.role if user else None
        ))
    return result

@router.get("/summary")
def get_activity_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    from sqlalchemy import func
    from datetime import timedelta, datetime

    today = datetime.utcnow()
    since_24h = today - timedelta(hours=24)
    since_7d = today - timedelta(days=7)

    total = db.query(ActivityLog).count()
    last_24h = db.query(ActivityLog).filter(ActivityLog.created_at >= since_24h).count()
    last_7d = db.query(ActivityLog).filter(ActivityLog.created_at >= since_7d).count()

    action_counts = db.query(
        ActivityLog.action,
        func.count(ActivityLog.id).label("count")
    ).group_by(ActivityLog.action).all()

    return {
        "total_activities": total,
        "last_24_hours": last_24h,
        "last_7_days": last_7d,
        "by_action": {r.action: r.count for r in action_counts}
    }