from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    unit_price: float
    selling_price: float
    current_stock: int = 0
    reorder_level: int = 10
    expiry_date: Optional[date] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    unit_price: Optional[float] = None
    selling_price: Optional[float] = None
    reorder_level: Optional[int] = None
    expiry_date: Optional[date] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    unit_price: float
    selling_price: float
    current_stock: int
    reorder_level: int
    expiry_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    category: Optional[CategoryResponse] = None
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True