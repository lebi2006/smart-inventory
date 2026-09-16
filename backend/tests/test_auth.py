from tests.conftest import register_user, login


def test_first_registration_becomes_admin_regardless_of_requested_role(client):
    resp = register_user(client, email="first@example.com", role="STAFF")
    assert resp.status_code == 201
    assert resp.json()["role"] == "ADMIN"


def test_second_registration_without_auth_is_rejected(client):
    register_user(client, email="admin@example.com")
    resp = register_user(client, email="second@example.com")
    assert resp.status_code == 403


def test_second_registration_by_non_admin_is_rejected(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    admin_token = login(client, "admin@example.com", "Passw0rd!").json()["access_token"]
    register_user(client, email="staff@example.com", password="Passw0rd!", role="STAFF", token=admin_token)
    staff_token = login(client, "staff@example.com", "Passw0rd!").json()["access_token"]

    resp = register_user(client, email="third@example.com", token=staff_token)
    assert resp.status_code == 403


def test_registration_by_admin_honors_requested_role(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    admin_token = login(client, "admin@example.com", "Passw0rd!").json()["access_token"]

    resp = register_user(client, email="staff@example.com", role="STAFF", token=admin_token)
    assert resp.status_code == 201
    assert resp.json()["role"] == "STAFF"


def test_a_non_admin_cannot_self_promote_to_admin_via_register_payload(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    admin_token = login(client, "admin@example.com", "Passw0rd!").json()["access_token"]
    register_user(client, email="staff@example.com", password="Passw0rd!", role="STAFF", token=admin_token)
    staff_token = login(client, "staff@example.com", "Passw0rd!").json()["access_token"]

    resp = register_user(client, email="attacker@example.com", role="ADMIN", token=staff_token)
    assert resp.status_code == 403


def test_login_success_returns_token(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    resp = login(client, "admin@example.com", "Passw0rd!")
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "admin@example.com"


def test_login_wrong_password_fails(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    resp = login(client, "admin@example.com", "WrongPassword")
    assert resp.status_code == 401


def test_login_rate_limited_after_repeated_failures(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    for _ in range(5):
        resp = login(client, "admin@example.com", "WrongPassword")
        assert resp.status_code == 401
    resp = login(client, "admin@example.com", "WrongPassword")
    assert resp.status_code == 429


def test_refresh_issues_a_new_token(client):
    register_user(client, email="admin@example.com", password="Passw0rd!")
    token = login(client, "admin@example.com", "Passw0rd!").json()["access_token"]

    resp = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "admin@example.com"


def test_refresh_without_token_is_rejected(client):
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401
