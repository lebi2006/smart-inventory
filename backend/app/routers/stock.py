from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.stock_movement import StockMovement, MovementType
from app.models.product import Product
from app.schemas.stock import StockMovementCreate, StockMovementResponse
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/stock", tags=["Stock Movements"])

@router.get("/", response_model=List[StockMovementResponse])
def get_movements(
    product_id: Optional[int] = Query(None),
    movement_type: Optional[MovementType] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StockMovement)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    return query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/in", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
def stock_in(
    data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    product.current_stock += data.quantity
    movement = StockMovement(
        product_id=data.product_id,
        user_id=current_user.id,
        movement_type=MovementType.STOCK_IN,
        quantity=data.quantity,
        note=data.note
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    log_activity(db, current_user.id, "STOCK_IN", "PRODUCT", data.product_id, f"Stock in: +{data.quantity} units for {product.name}")
    return movement

@router.post("/out", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
def stock_out(
    data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    if product.current_stock < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    product.current_stock -= data.quantity
    movement = StockMovement(
        product_id=data.product_id,
        user_id=current_user.id,
        movement_type=MovementType.STOCK_OUT,
        quantity=data.quantity,
        note=data.note
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    log_activity(db, current_user.id, "STOCK_OUT", "PRODUCT", data.product_id, f"Stock out: -{data.quantity} units for {product.name}")
    return movement

@router.post("/adjust", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
def adjust_stock(
    data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.current_stock = data.quantity
    movement = StockMovement(
        product_id=data.product_id,
        user_id=current_user.id,
        movement_type=MovementType.ADJUSTMENT,
        quantity=data.quantity,
        note=data.note
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    log_activity(db, current_user.id, "ADJUSTMENT", "PRODUCT", data.product_id, f"Stock adjusted to {data.quantity} for {product.name}")
    return movement