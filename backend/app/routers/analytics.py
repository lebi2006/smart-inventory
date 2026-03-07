from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.stock_movement import StockMovement, MovementType
from app.schemas.analytics import (
    DashboardSummary,
    TopProduct,
    StockMovementTrend,
    InventoryValueByCategory
)
from app.utils.dependencies import require_manager_or_above
from app.models.user import User
from app.services.analytics_service import get_demand_forecast, get_all_forecasts
from app.schemas.analytics import DemandForecast
from typing import List

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    from datetime import date, timedelta

    total_products = db.query(Product).filter(Product.is_active == True).count()

    stock_value_result = db.query(
        func.sum(Product.current_stock * Product.unit_price)
    ).filter(Product.is_active == True).scalar()
    total_stock_value = round(stock_value_result or 0, 2)

    low_stock_count = db.query(Product).filter(
        Product.current_stock <= Product.reorder_level,
        Product.current_stock > 0,
        Product.is_active == True
    ).count()

    out_of_stock_count = db.query(Product).filter(
        Product.current_stock == 0,
        Product.is_active == True
    ).count()

    total_categories = db.query(Category).count()
    total_suppliers = db.query(Supplier).count()

    today = date.today()
    expiring_soon_count = db.query(Product).filter(
        Product.expiry_date != None,
        Product.expiry_date <= today + timedelta(days=30),
        Product.expiry_date >= today,
        Product.is_active == True
    ).count()

    expired_count = db.query(Product).filter(
        Product.expiry_date != None,
        Product.expiry_date < today,
        Product.is_active == True
    ).count()

    return DashboardSummary(
        total_products=total_products,
        total_stock_value=total_stock_value,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        total_categories=total_categories,
        total_suppliers=total_suppliers,
        expiring_soon_count=expiring_soon_count,
        expired_count=expired_count
    )

@router.get("/top-products", response_model=List[TopProduct])
def get_top_products(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    results = db.query(
        StockMovement.product_id,
        Product.name.label("product_name"),
        Product.sku.label("sku"),
        func.sum(StockMovement.quantity).label("total_sold")
    ).join(Product).filter(
        StockMovement.movement_type == MovementType.STOCK_OUT
    ).group_by(
        StockMovement.product_id,
        Product.name,
        Product.sku
    ).order_by(
        func.sum(StockMovement.quantity).desc()
    ).limit(limit).all()

    return [
        TopProduct(
            product_id=r.product_id,
            product_name=r.product_name,
            sku=r.sku,
            total_sold=r.total_sold
        ) for r in results
    ]

@router.get("/stock-value-by-category", response_model=List[InventoryValueByCategory])
def get_stock_value_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    results = db.query(
        Category.name.label("category_name"),
        func.sum(Product.current_stock * Product.unit_price).label("total_value"),
        func.count(Product.id).label("product_count")
    ).join(Product, Product.category_id == Category.id).filter(
        Product.is_active == True
    ).group_by(Category.name).all()

    return [
        InventoryValueByCategory(
            category_name=r.category_name,
            total_value=round(r.total_value or 0, 2),
            product_count=r.product_count
        ) for r in results
    ]

@router.get("/movement-trend", response_model=List[StockMovementTrend])
def get_movement_trend(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    since = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        func.date(StockMovement.created_at).label("date"),
        func.sum(
            case((StockMovement.movement_type == MovementType.STOCK_IN, StockMovement.quantity), else_=0)
        ).label("stock_in"),
        func.sum(
            case((StockMovement.movement_type == MovementType.STOCK_OUT, StockMovement.quantity), else_=0)
        ).label("stock_out")
    ).filter(
        StockMovement.created_at >= since
    ).group_by(
        func.date(StockMovement.created_at)
    ).order_by(
        func.date(StockMovement.created_at)
    ).all()

    return [
        StockMovementTrend(
            date=str(r.date),
            stock_in=r.stock_in or 0,
            stock_out=r.stock_out or 0
        ) for r in results
    ]

@router.get("/forecast", response_model=List[DemandForecast])
def get_forecasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    return get_all_forecasts(db)

@router.get("/forecast/{product_id}", response_model=DemandForecast)
def get_product_forecast(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    forecast = get_demand_forecast(db, product_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="Product not found")
    return forecast

@router.get("/profit-analysis")
def get_profit_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    products = db.query(Product).filter(Product.is_active == True).all()
    results = []

    for product in products:
        margin_amount = product.selling_price - product.unit_price
        margin_percent = (margin_amount / product.selling_price * 100) if product.selling_price > 0 else 0
        total_profit_potential = margin_amount * product.current_stock

        # Get total units sold and revenue
        sold_data = db.query(
            func.sum(StockMovement.quantity).label("total_sold")
        ).filter(
            StockMovement.product_id == product.id,
            StockMovement.movement_type == MovementType.STOCK_OUT
        ).scalar() or 0

        total_revenue = sold_data * product.selling_price
        total_profit_realized = sold_data * margin_amount

        results.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "unit_price": product.unit_price,
            "selling_price": product.selling_price,
            "margin_amount": round(margin_amount, 2),
            "margin_percent": round(margin_percent, 2),
            "current_stock": product.current_stock,
            "total_profit_potential": round(total_profit_potential, 2),
            "units_sold": sold_data,
            "total_revenue": round(total_revenue, 2),
            "total_profit_realized": round(total_profit_realized, 2),
        })

    # Sort by margin percent descending
    results.sort(key=lambda x: x["margin_percent"], reverse=True)
    return results


@router.get("/profit-summary")
def get_profit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above)
):
    products = db.query(Product).filter(Product.is_active == True).all()
    if not products:
        return {
            "total_profit_potential": 0,
            "total_revenue_realized": 0,
            "total_profit_realized": 0,
            "avg_margin_percent": 0,
            "most_profitable_product": "N/A",
            "least_profitable_product": "N/A"
        }

    margins = []
    total_potential = 0
    total_revenue = 0
    total_profit = 0

    for product in products:
        margin_amount = product.selling_price - product.unit_price
        margin_percent = (margin_amount / product.selling_price * 100) if product.selling_price > 0 else 0
        margins.append((product.name, margin_percent))
        total_potential += margin_amount * product.current_stock

        sold = db.query(func.sum(StockMovement.quantity)).filter(
            StockMovement.product_id == product.id,
            StockMovement.movement_type == MovementType.STOCK_OUT
        ).scalar() or 0

        total_revenue += sold * product.selling_price
        total_profit += sold * margin_amount

    margins.sort(key=lambda x: x[1], reverse=True)
    avg_margin = sum(m[1] for m in margins) / len(margins)

    return {
        "total_profit_potential": round(total_potential, 2),
        "total_revenue_realized": round(total_revenue, 2),
        "total_profit_realized": round(total_profit, 2),
        "avg_margin_percent": round(avg_margin, 2),
        "most_profitable_product": margins[0][0] if margins else "N/A",
        "least_profitable_product": margins[-1][0] if margins else "N/A"
    }