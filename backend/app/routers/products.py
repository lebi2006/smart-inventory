from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.utils.dependencies import get_current_user, require_manager_or_above, require_admin
from app.models.user import User
from datetime import date, timedelta
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    low_stock: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") |
            Product.sku.ilike(f"%{search}%")
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if low_stock:
        query = query.filter(Product.current_stock <= Product.reorder_level)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    return query.offset(skip).limit(limit).all()

@router.get("/low-stock", response_model=List[ProductResponse])
def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Product).filter(
        Product.current_stock <= Product.reorder_level,
        Product.is_active == True
    ).all()

from datetime import date, timedelta

@router.get("/expiring-soon", response_model=List[ProductResponse])
def get_expiring_soon(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    expiry_threshold = today + timedelta(days=days)
    return db.query(Product).filter(
        Product.expiry_date != None,
        Product.expiry_date <= expiry_threshold,
        Product.expiry_date >= today,
        Product.is_active == True
    ).order_by(Product.expiry_date.asc()).all()

@router.get("/expired", response_model=List[ProductResponse])
def get_expired_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    return db.query(Product).filter(
        Product.expiry_date != None,
        Product.expiry_date < today,
        Product.is_active == True
    ).order_by(Product.expiry_date.asc()).all()

@router.get("/{id}", response_model=ProductResponse)
def get_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    existing = db.query(Product).filter(Product.sku == data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    log_activity(db, current_user.id, "CREATE", "PRODUCT", product.id, f"Created product: {product.name}")
    return product

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    log_activity(db, current_user.id, "UPDATE", "PRODUCT", product.id, f"Updated product: {product.name}")
    return product

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    log_activity(db, current_user.id, "DELETE", "PRODUCT", id, f"Deleted product: {product.name}")
    db.delete(product)
    db.commit()

@router.get("/barcode/{sku}", response_model=ProductResponse)
def get_product_by_barcode(
    sku: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.sku == sku,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"No product found with SKU: {sku}")
    return product