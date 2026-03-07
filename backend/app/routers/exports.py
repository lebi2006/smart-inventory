from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.services.export_service import (
    export_products_excel,
    export_products_pdf,
    export_stock_movements_excel
)
from datetime import datetime

router = APIRouter(prefix="/api/exports", tags=["Exports"])

@router.get("/products/excel")
def download_products_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = export_products_excel(db)
    filename = f"inventory_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/products/pdf")
def download_products_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = export_products_pdf(db)
    filename = f"inventory_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/stock-movements/excel")
def download_movements_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = export_stock_movements_excel(db)
    filename = f"stock_movements_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )