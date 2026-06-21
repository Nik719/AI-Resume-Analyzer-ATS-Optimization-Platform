import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.resumes.models import Resume
from apps.jobs.models import JobDescription
from apps.analysis.models import AnalysisResult
from apps.analysis.services.ats_scorer import (
    skill_match_ratio, keyword_density_score, format_score, compute_local_ats_score,
)


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="analysis@example.com", password="testpass123", full_name="Analysis User")


@pytest.fixture
def auth_client(client, user):
    res = client.post(reverse("auth-login"), {"email": "analysis@example.com", "password": "testpass123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return client


@pytest.fixture
def resume(db, user):
    return Resume.objects.create(
        user=user, title="My CV", file="test.pdf", file_type="pdf", file_size=1024,
        status=Resume.Status.PARSED,
        skills=["Python", "Django", "PostgreSQL"],
        raw_text="Experienced Python developer with Django and PostgreSQL. Led team of 5 engineers.",
    )


@pytest.fixture
def job(db, user):
    return JobDescription.objects.create(
        user=user, title="Backend Engineer", company="Tech Co",
        raw_text="Looking for Python, Django, PostgreSQL experience.",
        required_skills=["Python", "Django"],
        preferred_skills=["Redis"],
        keywords=["python", "django", "api"],
    )


@pytest.fixture
def completed_analysis(db, user, resume, job):
    return AnalysisResult.objects.create(
        user=user, resume=resume, job_description=job,
        status=AnalysisResult.Status.COMPLETED,
        ats_score=80, match_score=75, keyword_match_score=70,
        skills_match_score=85, experience_match_score=72,
        matched_skills=["Python", "Django"],
        missing_required_skills=[],
        missing_preferred_skills=["Redis"],
        strengths=["Strong Python background"],
        gaps=["No Redis experience"],
        recommendations=[{"priority": "low", "category": "skills", "title": "Learn Redis", "description": "...", "action": "..."}],
        resume_improvements=["Add quantified achievements"],
        overall_verdict="Good match",
        hire_probability="moderate",
    )


class TestAnalysisCreate:
    def test_create_requires_auth(self, client, resume, job):
        res = client.post(reverse("analysis-list"), {"resume": str(resume.id), "job_description": str(job.id)})
        assert res.status_code == 401

    def test_create_unparsed_resume_rejected(self, auth_client, user, job, db):
        pending_resume = Resume.objects.create(
            user=user, title="Pending", file="p.pdf", file_type="pdf", file_size=100,
            status=Resume.Status.PENDING,
        )
        res = auth_client.post(reverse("analysis-list"), {
            "resume": str(pending_resume.id),
            "job_description": str(job.id),
        })
        assert res.status_code == 400

    @patch("apps.analysis.views.run_analysis_task.delay")
    def test_create_success_queues_task(self, mock_delay, auth_client, resume, job, db):
        res = auth_client.post(reverse("analysis-list"), {
            "resume": str(resume.id),
            "job_description": str(job.id),
        })
        assert res.status_code == 202
        assert res.data["status"] == "pending"
        mock_delay.assert_called_once()

    @patch("apps.analysis.views.run_analysis_task.delay")
    def test_rerun_completed_analysis(self, mock_delay, auth_client, completed_analysis, db):
        res = auth_client.post(reverse("analysis-list"), {
            "resume": str(completed_analysis.resume.id),
            "job_description": str(completed_analysis.job_description.id),
        })
        assert res.status_code == 202
        mock_delay.assert_called_once()


class TestAnalysisDetail:
    def test_get_own_analysis(self, auth_client, completed_analysis):
        res = auth_client.get(reverse("analysis-detail", kwargs={"pk": str(completed_analysis.id)}))
        assert res.status_code == 200
        assert res.data["ats_score"] == 80
        assert res.data["status"] == "completed"

    def test_cannot_access_other_users_analysis(self, client, db, completed_analysis):
        other = User.objects.create_user(email="other@ex.com", password="pass", full_name="Other")
        tokens = client.post(reverse("auth-login"), {"email": "other@ex.com", "password": "pass"}).data
        other_client = APIClient()
        other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        res = other_client.get(reverse("analysis-detail", kwargs={"pk": str(completed_analysis.id)}))
        assert res.status_code == 404


class TestDashboard:
    def test_dashboard_returns_stats(self, auth_client, completed_analysis):
        res = auth_client.get(reverse("analysis-dashboard"))
        assert res.status_code == 200
        assert "total_resumes" in res.data
        assert "avg_ats_score" in res.data
        assert "recent_analyses" in res.data
        assert res.data["avg_ats_score"] == 80.0

    def test_dashboard_empty_for_new_user(self, auth_client, db):
        res = auth_client.get(reverse("analysis-dashboard"))
        assert res.status_code == 200
        assert res.data["total_resumes"] == 0
        assert res.data["total_analyses"] == 0


class TestATSScorer:
    def test_skill_match_full(self):
        assert skill_match_ratio(["Python", "Django"], ["python", "django"]) == 1.0

    def test_skill_match_partial(self):
        ratio = skill_match_ratio(["Python"], ["Python", "Go"])
        assert ratio == 0.5

    def test_skill_match_empty_jd(self):
        assert skill_match_ratio(["Python"], []) == 1.0

    def test_keyword_density(self):
        text = "We use python and django for our REST API"
        score = keyword_density_score(text, ["python", "django", "kubernetes"])
        assert score == pytest.approx(2 / 3)

    def test_format_score_good_resume(self):
        text = """
        John Doe | john@example.com | +1-555-0100
        Experience:
        • Led development of microservices platform, reduced latency by 40%
        • Built REST APIs with Django and PostgreSQL
        Education: BS Computer Science, Stanford
        Skills: Python, Django, PostgreSQL
        LinkedIn: linkedin.com/in/johndoe
        """
        score = format_score(text)
        assert score >= 60

    def test_format_score_bare_resume(self):
        score = format_score("I did some stuff at a company")
        assert score < 30

    def test_compute_local_ats_score_returns_dict(self):
        result = compute_local_ats_score(
            resume_text="Python developer with Django experience",
            resume_skills=["Python", "Django"],
            jd_required_skills=["Python", "Django"],
            jd_preferred_skills=["Redis"],
            jd_keywords=["python", "django"],
        )
        assert "local_ats_score" in result
        assert 0 <= result["local_ats_score"] <= 100
