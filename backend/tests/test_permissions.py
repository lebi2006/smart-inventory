from tests.conftest import register_user, login


def _make_user(client, email, role, admin_token):
    register_user(client, email=email, password="Passw0rd!", role=role, token=admin_token)
    return login(client, email, "Passw0rd!").json()["access_token"]


def _bootstrap_admin(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    return login(client, "admin@example.com", "Passw0rd!").json()["access_token"]


def test_staff_cannot_create_product(client):
    admin_token = _bootstrap_admin(client)
    staff_token = _make_user(client, "staff@example.com", "STAFF", admin_token)

    resp = client.post(
        "/api/products/",
        json={"name": "Coffee", "sku": "SKU-1", "unit_price": 2.5, "selling_price": 5.0, "current_stock": 10},
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert resp.status_code == 403


def test_manager_can_create_product(client):
    admin_token = _bootstrap_admin(client)
    manager_token = _make_user(client, "manager@example.com", "MANAGER", admin_token)

    resp = client.post(
        "/api/products/",
        json={"name": "Coffee", "sku": "SKU-1", "unit_price": 2.5, "selling_price": 5.0, "current_stock": 10},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert resp.status_code == 201


def test_manager_cannot_delete_product(client):
    admin_token = _bootstrap_admin(client)
    manager_token = _make_user(client, "manager@example.com", "MANAGER", admin_token)

    create_resp = client.post(
        "/api/products/",
        json={"name": "Coffee", "sku": "SKU-1", "unit_price": 2.5, "selling_price": 5.0, "current_stock": 10},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    product_id = create_resp.json()["id"]

    resp = client.delete(f"/api/products/{product_id}", headers={"Authorization": f"Bearer {manager_token}"})
    assert resp.status_code == 403


def test_admin_can_delete_product(client):
    admin_token = _bootstrap_admin(client)
    create_resp = client.post(
        "/api/products/",
        json={"name": "Coffee", "sku": "SKU-1", "unit_price": 2.5, "selling_price": 5.0, "current_stock": 10},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_resp.json()["id"]

    resp = client.delete(f"/api/products/{product_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 204


def test_unauthenticated_request_is_rejected(client):
    resp = client.get("/api/products/")
    assert resp.status_code == 401
