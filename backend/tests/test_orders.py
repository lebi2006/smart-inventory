from tests.conftest import create_product


def test_placing_a_public_order_deducts_stock(client):
    product_id = create_product(client.session_local, name="Coffee", sku="SKU-1", stock=10, price=5.0)

    resp = client.post(
        "/api/orders/public/place",
        json={"table_number": "5", "items": [{"product_id": product_id, "quantity": 3}]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_amount"] == 15.0

    product_resp = client.get(f"/api/products/barcode/SKU-1")
    # barcode lookup requires auth; instead check stock directly via db session
    db = client.session_local()
    from app.models.product import Product
    product = db.query(Product).filter(Product.id == product_id).first()
    assert product.current_stock == 7
    db.close()


def test_placing_an_order_exceeding_stock_is_rejected(client):
    product_id = create_product(client.session_local, name="Coffee", sku="SKU-1", stock=2, price=5.0)

    resp = client.post(
        "/api/orders/public/place",
        json={"items": [{"product_id": product_id, "quantity": 5}]},
    )
    assert resp.status_code == 400

    db = client.session_local()
    from app.models.product import Product
    product = db.query(Product).filter(Product.id == product_id).first()
    assert product.current_stock == 2
    db.close()


def test_placing_an_order_for_unknown_product_returns_404(client):
    resp = client.post(
        "/api/orders/public/place",
        json={"items": [{"product_id": 9999, "quantity": 1}]},
    )
    assert resp.status_code == 404
