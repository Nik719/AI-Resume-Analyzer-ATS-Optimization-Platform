import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com",
        password="securepass123",
        full_name="Test User",
    )


@pytest.fixture
def auth_client(client, user):
    res = client.post(reverse("auth-login"), {"email": "test@example.com", "password": "securepass123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return client


class TestRegister:
    def test_register_success(self, client, db):
        res = client.post(reverse("auth-register"), {
            "email": "new@example.com",
            "full_name": "New User",
            "password": "strongpass123",
            "password2": "strongpass123",
        })
        assert res.status_code == 201
        assert "tokens" in res.data
        assert res.data["user"]["email"] == "new@example.com"

    def test_register_password_mismatch(self, client, db):
        res = client.post(reverse("auth-register"), {
            "email": "new@example.com",
            "full_name": "New User",
            "password": "strongpass123",
            "password2": "different123",
        })
        assert res.status_code == 400

    def test_register_duplicate_email(self, client, user):
        res = client.post(reverse("auth-register"), {
            "email": "test@example.com",
            "full_name": "Dup User",
            "password": "strongpass123",
            "password2": "strongpass123",
        })
        assert res.status_code == 400

    def test_register_weak_password(self, client, db):
        res = client.post(reverse("auth-register"), {
            "email": "new@example.com",
            "full_name": "New User",
            "password": "123",
            "password2": "123",
        })
        assert res.status_code == 400


class TestLogin:
    def test_login_success(self, client, user):
        res = client.post(reverse("auth-login"), {
            "email": "test@example.com",
            "password": "securepass123",
        })
        assert res.status_code == 200
        assert "access" in res.data
        assert "refresh" in res.data
        assert res.data["user"]["email"] == "test@example.com"

    def test_login_wrong_password(self, client, user):
        res = client.post(reverse("auth-login"), {
            "email": "test@example.com",
            "password": "wrongpass",
        })
        assert res.status_code == 401

    def test_login_unknown_email(self, client, db):
        res = client.post(reverse("auth-login"), {
            "email": "nobody@example.com",
            "password": "anypass",
        })
        assert res.status_code == 401


class TestProfile:
    def test_get_profile_authenticated(self, auth_client, user):
        res = auth_client.get(reverse("auth-profile"))
        assert res.status_code == 200
        assert res.data["email"] == user.email
        assert res.data["full_name"] == user.full_name

    def test_get_profile_unauthenticated(self, client):
        res = client.get(reverse("auth-profile"))
        assert res.status_code == 401

    def test_update_profile(self, auth_client):
        res = auth_client.patch(reverse("auth-profile"), {"full_name": "Updated Name"})
        assert res.status_code == 200
        assert res.data["full_name"] == "Updated Name"


class TestLogout:
    def test_logout_blacklists_token(self, auth_client, client, user):
        tokens = client.post(reverse("auth-login"), {
            "email": "test@example.com", "password": "securepass123"
        }).data
        auth_client.post(reverse("auth-logout"), {"refresh": tokens["refresh"]})
        res = client.post(reverse("token-refresh"), {"refresh": tokens["refresh"]})
        assert res.status_code == 401
