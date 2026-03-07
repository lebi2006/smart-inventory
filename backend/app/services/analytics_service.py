from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.stock_movement import StockMovement, MovementType
from app.models.product import Product
import numpy as np

def get_demand_forecast(db: Session, product_id: int, forecast_days: int = 7):
    # Get last 30 days of stock out movements
    since = datetime.utcnow() - timedelta(days=30)

    daily_usage = db.query(
        func.date(StockMovement.created_at).label("date"),
        func.sum(StockMovement.quantity).label("total")
    ).filter(
        StockMovement.product_id == product_id,
        StockMovement.movement_type == MovementType.STOCK_OUT,
        StockMovement.created_at >= since
    ).group_by(
        func.date(StockMovement.created_at)
    ).order_by(
        func.date(StockMovement.created_at)
    ).all()

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    # Build daily usage array (fill missing days with 0)
    usage_by_date = {str(r.date): r.total for r in daily_usage}
    all_dates = [(datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(29, -1, -1)]
    usage_array = np.array([usage_by_date.get(d, 0) for d in all_dates], dtype=float)

    # Calculate metrics
    avg_daily_usage = float(np.mean(usage_array))
    max_daily_usage = float(np.max(usage_array))

    # Weighted moving average (recent days matter more)
    if len(usage_array) >= 7:
        weights = np.array([0.05, 0.05, 0.1, 0.1, 0.15, 0.25, 0.30])
        weighted_avg = float(np.dot(usage_array[-7:], weights))
    else:
        weighted_avg = avg_daily_usage

    # Forecast
    forecasted_demand = round(weighted_avg * forecast_days)
    safety_stock = round(max_daily_usage * 3)
    recommended_order = max(0, forecasted_demand + safety_stock - product.current_stock)

    # Trend detection
    if len(usage_array) >= 14:
        first_half = np.mean(usage_array[:15])
        second_half = np.mean(usage_array[15:])
        if second_half > first_half * 1.2:
            trend = "INCREASING"
        elif second_half < first_half * 0.8:
            trend = "DECREASING"
        else:
            trend = "STABLE"
    else:
        trend = "INSUFFICIENT_DATA"

    # Days until stockout
    if weighted_avg > 0:
        days_until_stockout = round(product.current_stock / weighted_avg)
    else:
        days_until_stockout = 999

    return {
        "product_id": product_id,
        "product_name": product.name,
        "sku": product.sku,
        "current_stock": product.current_stock,
        "avg_daily_usage": round(avg_daily_usage, 2),
        "forecasted_demand_7_days": forecasted_demand,
        "safety_stock": safety_stock,
        "recommended_order_quantity": recommended_order,
        "days_until_stockout": days_until_stockout,
        "trend": trend,
        "forecast_confidence": "HIGH" if len(daily_usage) >= 14 else "LOW"
    }


def get_all_forecasts(db: Session):
    products = db.query(Product).filter(Product.is_active == True).all()
    forecasts = []
    for product in products:
        forecast = get_demand_forecast(db, product.id)
        if forecast:
            forecasts.append(forecast)
    # Sort by days until stockout (most urgent first)
    forecasts.sort(key=lambda x: x["days_until_stockout"])
    return forecasts