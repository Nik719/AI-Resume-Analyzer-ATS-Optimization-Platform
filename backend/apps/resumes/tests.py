import io
import pytest
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.resumes.models import Resume


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="resume@example.com",
        password="testpass123",
        full_name="Resume User",
    )


@pytest.fixture
def auth_client(client, user):
    res = client.post(reverse("auth-login"), {"email": "resume@example.com", "password": "testpass123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return client


@pytest.fixture
def pdf_file():
    content = b"%PDF-1.4 fake pdf content for testing"
    return SimpleUploadedFile("resume.pdf", content, content_type="application/pdf")


@pytest.fixture
def resume(db, user):
    return Resume.objects.create(
        user=user,
        title="My Resume",
        file="resumes/test.pdf",
        file_type="pdf",
        file_size=1024,
        status=Resume.Status.PARSED,
        skills=["Python", "Django", "React"],
        raw_text="Software engineer with 5 years of experience",
    )


class TestResumeUpload:
    def test_upload_requires_auth(self, client, pdf_file):
        res = client.post(reverse("resume-list"), {"file": pdf_file}, format="multipart")
        assert res.status_code == 401

    def test_upload_pdf_success(self, auth_client, pdf_file, db):
        res = auth_client.post(reverse("resume-list"), {"file": pdf_file, "title": "My CV"}, format="multipart")
        assert res.status_code == 201
        assert res.data["file_type"] == "pdf"
        assert res.data["title"] == "My CV"
        assert res.data["status"] == "pending"

    def test_upload_auto_title_from_filename(self, auth_client, db):
        f = SimpleUploadedFile("my_software_resume.pdf", b"%PDF content", content_type="application/pdf")
        res = auth_client.post(reverse("resume-list"), {"file": f}, format="multipart")
        assert res.status_code == 201
        assert res.data["title"] == "My Software Resume"

    def test_upload_invalid_extension(self, auth_client, db):
        f = SimpleUploadedFile("resume.txt", b"plain text", content_type="text/plain")
        res = auth_client.post(reverse("resume-list"), {"file": f}, format="multipart")
        assert res.status_code == 400

    def test_upload_too_large(self, auth_client, db):
        big = SimpleUploadedFile("big.pdf", b"x" * (11 * 1024 * 1024), content_type="application/pdf")
        res = auth_client.post(reverse("resume-list"), {"file": big}, format="multipart")
        assert res.status_code == 400


class TestResumeList:
    def test_list_own_resumes_only(self, auth_client, resume, db):
        other_user = User.objects.create_user(email="other@example.com", password="pass", full_name="Other")
        Resume.objects.create(user=other_user, title="Other", file="x.pdf", file_type="pdf", file_size=100)
        res = auth_client.get(reverse("resume-list"))
        assert res.status_code == 200
        ids = [r["id"] for r in (res.data.get("results") or res.data)]
        assert str(resume.id) in ids
        assert len(ids) == 1

    def test_list_unauthenticated(self, client):
        res = client.get(reverse("resume-list"))
        assert res.status_code == 401


class TestResumeSetPrimary:
    def test_set_primary(self, auth_client, resume):
        res = auth_client.post(reverse("resume-set-primary", kwargs={"pk": str(resume.id)}))
        assert res.status_code == 200
        resume.refresh_from_db()
        assert resume.is_primary is True

    def test_only_one_primary(self, auth_client, user, resume):
        r2 = Resume.objects.create(user=user, title="R2", file="r2.pdf", file_type="pdf", file_size=100)
        auth_client.post(reverse("resume-set-primary", kwargs={"pk": str(resume.id)}))
        auth_client.post(reverse("resume-set-primary", kwargs={"pk": str(r2.id)}))
        resume.refresh_from_db()
        r2.refresh_from_db()
        assert resume.is_primary is False
        assert r2.is_primary is True


class TestResumeDelete:
    def test_delete_own_resume(self, auth_client, resume):
        res = auth_client.delete(reverse("resume-detail", kwargs={"pk": str(resume.id)}))
        assert res.status_code == 204
        assert not Resume.objects.filter(id=resume.id).exists()

    def test_cannot_delete_other_users_resume(self, client, db):
        other = User.objects.create_user(email="x@x.com", password="pass", full_name="X")
        r = Resume.objects.create(user=other, title="X", file="x.pdf", file_type="pdf", file_size=100)
        tokens = client.post(reverse("auth-login"), {"email": "x@x.com", "password": "pass"}).data
        attacker = APIClient()
        victim = User.objects.create_user(email="victim@x.com", password="pass", full_name="V")
        victim_r = Resume.objects.create(user=victim, title="V", file="v.pdf", file_type="pdf", file_size=100)
        attacker.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        res = attacker.delete(reverse("resume-detail", kwargs={"pk": str(victim_r.id)}))
        assert res.status_code == 404
