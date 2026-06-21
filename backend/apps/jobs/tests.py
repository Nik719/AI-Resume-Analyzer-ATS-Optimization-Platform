import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.jobs.models import JobDescription


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="jobs@example.com", password="testpass123", full_name="Jobs User")


@pytest.fixture
def auth_client(client, user):
    res = client.post(reverse("auth-login"), {"email": "jobs@example.com", "password": "testpass123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return client


@pytest.fixture
def job(db, user):
    return JobDescription.objects.create(
        user=user,
        title="Senior Python Engineer",
        company="Acme Corp",
        raw_text="We need a Python expert with 5+ years Django experience.",
        required_skills=["Python", "Django"],
        preferred_skills=["Redis", "Celery"],
        keywords=["python", "django", "api"],
    )


class TestJobCreate:
    def test_create_requires_auth(self, client, db):
        res = client.post(reverse("job-list"), {"title": "Test", "raw_text": "text"})
        assert res.status_code == 401

    def test_create_success(self, auth_client, db):
        res = auth_client.post(reverse("job-list"), {
            "title": "Backend Engineer",
            "company": "Tech Co",
            "raw_text": "Looking for a backend engineer with Python skills.",
        })
        assert res.status_code == 201
        assert res.data["title"] == "Backend Engineer"

    def test_create_missing_required_fields(self, auth_client, db):
        res = auth_client.post(reverse("job-list"), {"company": "No title"})
        assert res.status_code == 400


class TestJobList:
    def test_list_own_jobs_only(self, auth_client, job, db):
        other = User.objects.create_user(email="other@ex.com", password="pass", full_name="Other")
        JobDescription.objects.create(user=other, title="Other JD", raw_text="text")
        res = auth_client.get(reverse("job-list"))
        assert res.status_code == 200
        results = res.data.get("results") or res.data
        assert len(results) == 1
        assert results[0]["title"] == job.title

    def test_list_unauthenticated(self, client):
        res = client.get(reverse("job-list"))
        assert res.status_code == 401


class TestJobDelete:
    def test_delete_own_job(self, auth_client, job):
        res = auth_client.delete(reverse("job-detail", kwargs={"pk": str(job.id)}))
        assert res.status_code == 204
        assert not JobDescription.objects.filter(id=job.id).exists()

    def test_cannot_delete_other_users_job(self, client, db):
        user_a = User.objects.create_user(email="a@ex.com", password="pass", full_name="A")
        user_b = User.objects.create_user(email="b@ex.com", password="pass", full_name="B")
        jd = JobDescription.objects.create(user=user_b, title="B's JD", raw_text="text")
        tokens = client.post(reverse("auth-login"), {"email": "a@ex.com", "password": "pass"}).data
        a_client = APIClient()
        a_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        res = a_client.delete(reverse("job-detail", kwargs={"pk": str(jd.id)}))
        assert res.status_code == 404
