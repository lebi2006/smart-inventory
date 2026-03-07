from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_name: Optional[str] = None
    table_number: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_self_service: Optional[str] = "false"
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: Optional[str] = None
    table_number: Optional[str] = None
    status: str
    payment_method: Optional[str] = None
    subtotal: float
    total_amount: float
    notes: Optional[str] = None
    is_self_service: str
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True