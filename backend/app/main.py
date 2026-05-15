from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from sqlalchemy import text
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.routers import auth, products, categories, suppliers, stock, analytics, exports, activity
from app.models.activity_log import ActivityLog
from app.routers import orders
from app.models.order import Order, OrderItem

app = FastAPI(
    title="Smart Inventory Management System",
    description="Production-grade inventory management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend.vercel.app",  # ← add this after deploying frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(analytics.router)
app.include_router(exports.router)
app.include_router(activity.router)
app.include_router(orders.router)

@app.on_event("startup")
def startup():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("SUCCESS: Database connected successfully")
        Base.metadata.create_all(bind=engine)
        print("SUCCESS: All tables created successfully")
        print("Registered tables: " + str(list(Base.metadata.tables.keys())))
    except Exception as e:
        print("ERROR: " + str(e))

@app.get("/")
def root():
    return {
        "message": "Smart Inventory API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}