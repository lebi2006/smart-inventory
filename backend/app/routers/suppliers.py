from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.product import SupplierCreate, SupplierResponse
from app.utils.dependencies import require_manager_or_above
from app.models.user import User

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    return db.query(Supplier).all()

@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{id}", response_model=SupplierResponse)
def update_supplier(
    id: int,
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for key, value in data.model_dump().items():
        setattr(supplier, key, value)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()