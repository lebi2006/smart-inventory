import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import app.main as main_module
from app.database import Base, get_db
from app.models.product import Product
from app.utils.rate_limit import _attempts as _login_attempts


@pytest.fixture()
def client():
    _login_attempts.clear()
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    main_module.app.dependency_overrides[get_db] = override_get_db
    with TestClient(main_module.app) as test_client:
        test_client.session_local = TestingSessionLocal
        yield test_client
    main_module.app.dependency_overrides.clear()


def register_user(client, email="user@example.com", password="Passw0rd!", name="Test User", role=None, token=None):
    payload = {"name": name, "email": email, "password": password}
    if role:
        payload["role"] = role
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post("/api/auth/register", json=payload, headers=headers)


def login(client, email, password):
    return client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def create_product(session_local, name="Coffee", sku="SKU-1", stock=10, price=5.0):
    db = session_local()
    try:
        product = Product(
            name=name, sku=sku, unit_price=price / 2, selling_price=price,
            current_stock=stock, reorder_level=2, is_active=True,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product.id
    finally:
        db.close()
