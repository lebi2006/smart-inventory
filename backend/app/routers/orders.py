from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
import random, string

from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.product import Product
from app.models.stock_movement import StockMovement, MovementType
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.utils.dependencies import get_current_user, require_manager_or_above
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def generate_order_number():
    chars = string.ascii_uppercase + string.digits
    return "ORD-" + "".join(random.choices(chars, k=8))


# PUBLIC endpoint — no auth needed (self-service customers)
@router.get("/public/products")
def get_public_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.current_stock > 0
    ).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "selling_price": p.selling_price,
            "current_stock": p.current_stock,
            "description": p.description,
            "category": p.category.name if p.category else None,
        }
        for p in products
    ]


# PUBLIC endpoint — customers can place orders without login
@router.post("/public/place", response_model=OrderResponse)
def place_order_public(data: OrderCreate, db: Session = Depends(get_db)):
    return _create_order(data, db, created_by=None)


# STAFF endpoint — staff places order on behalf of customer
@router.post("/staff/place", response_model=OrderResponse)
def place_order_staff(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return _create_order(data, db, created_by=current_user.id)


def _create_order(data: OrderCreate, db: Session, created_by: Optional[int]):
    # Validate all items first
    order_items = []
    subtotal = 0

    for item in data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product #{item.product_id} not found")
        if product.current_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. Available: {product.current_stock}"
            )
        item_total = product.selling_price * item.quantity
        subtotal += item_total
        order_items.append((product, item.quantity, item_total))

    # Create order
    order = Order(
        order_number=generate_order_number(),
        customer_name=data.customer_name,
        table_number=data.table_number,
        payment_method=data.payment_method,
        notes=data.notes,
        is_self_service=data.is_self_service,
        subtotal=round(subtotal, 2),
        total_amount=round(subtotal, 2),
        status=OrderStatus.PENDING,
        created_by=created_by,
        created_at=datetime.utcnow()
    )
    db.add(order)
    db.flush()

    # Create order items and deduct stock
    for product, quantity, item_total in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            quantity=quantity,
            unit_price=product.selling_price,
            total_price=round(item_total, 2)
        )
        db.add(order_item)

        # Deduct stock
        product.current_stock -= quantity
        movement = StockMovement(
            product_id=product.id,
            user_id=created_by,
            movement_type=MovementType.STOCK_OUT,
            quantity=quantity,
            note=f"Order {order.order_number}"
        )
        db.add(movement)

    db.commit()
    db.refresh(order)

    if created_by:
        log_activity(db, created_by, "CREATE", "ORDER", order.id, f"Order {order.order_number} placed")

    return order


@router.get("/", response_model=List[OrderResponse])
def get_orders(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()


@router.get("/summary")
def get_orders_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import timedelta
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    total_orders = db.query(Order).count()
    today_orders = db.query(Order).filter(Order.created_at >= today_start).count()
    pending = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
    completed = db.query(Order).filter(Order.status == OrderStatus.COMPLETED).count()

    today_revenue = sum(
        o.total_amount for o in
        db.query(Order).filter(
            Order.created_at >= today_start,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
        ).all()
    )

    total_revenue = sum(
        o.total_amount for o in
        db.query(Order).filter(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
        ).all()
    )

    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "pending_orders": pending,
        "completed_orders": completed,
        "today_revenue": round(today_revenue, 2),
        "total_revenue": round(total_revenue, 2),
    }


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    payment_method: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status
    if payment_method:
        order.payment_method = payment_method
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    log_activity(db, current_user.id, "UPDATE", "ORDER", order.id,
                 f"Order {order.order_number} status → {status}")
    return order


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order