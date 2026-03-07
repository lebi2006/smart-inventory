from pydantic import BaseModel
from typing import List
from datetime import datetime
from typing import Optional

class DashboardSummary(BaseModel):
    total_products: int
    total_stock_value: float
    low_stock_count: int
    out_of_stock_count: int
    total_categories: int
    total_suppliers: int

class TopProduct(BaseModel):
    product_id: int
    product_name: str
    sku: str
    total_sold: int

    class Config:
        from_attributes = True

class StockMovementTrend(BaseModel):
    date: str
    stock_in: int
    stock_out: int

class InventoryValueByCategory(BaseModel):
    category_name: str
    total_value: float
    product_count: int

class DemandForecast(BaseModel):
    product_id: int
    product_name: str
    sku: str
    current_stock: int
    avg_daily_usage: float
    forecasted_demand_7_days: int
    safety_stock: int
    recommended_order_quantity: int
    days_until_stockout: int
    trend: str
    forecast_confidence: str

class DashboardSummary(BaseModel):
    total_products: int
    total_stock_value: float
    low_stock_count: int
    out_of_stock_count: int
    total_categories: int
    total_suppliers: int
    expiring_soon_count: int = 0
    expired_count: int = 0

class ProductProfitAnalysis(BaseModel):
    product_id: int
    product_name: str
    sku: str
    unit_price: float
    selling_price: float
    margin_amount: float
    margin_percent: float
    current_stock: int
    total_profit_potential: float
    units_sold: int
    total_revenue: float
    total_profit_realized: float

class ProfitSummary(BaseModel):
    total_profit_potential: float
    total_revenue_realized: float
    total_profit_realized: float
    avg_margin_percent: float
    most_profitable_product: str
    least_profitable_product: str