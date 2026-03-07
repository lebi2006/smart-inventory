from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.stock_movement import MovementType
from app.schemas.product import ProductResponse
from app.schemas.user import UserResponse
from typing import Optional

class StockMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int
    note: Optional[str] = None

class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    user_id: Optional[int] = None
    movement_type: MovementType
    quantity: int
    note: Optional[str] = None
    created_at: datetime
    product: Optional[ProductResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True