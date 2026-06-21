import logging
from django.utils import timezone
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def parse_resume_task(self, resume_id: str):
    """Parse a resume file and extract structured data using Gemini."""
    from apps.resumes.models import Resume
    from apps.resumes.parsers import extract_text_from_field
    from .services.gemini import parse_resume_with_gemini

    try:
        resume = Resume.objects.get(id=resume_id)
        resume.status = Resume.Status.PARSING
        resume.save(update_fields=["status"])

        # 1. Extract raw text
        # Use extract_text_from_field (not .path) so this works with
        # S3 and any other cloud storage backend.
        raw_text = extract_text_from_field(resume.file, resume.file_type)
        resume.raw_text = raw_text

        # 2. Parse with Gemini
        parsed = parse_resume_with_gemini(raw_text)

        resume.contact_info = parsed.get("contact_info", {})
        resume.skills = parsed.get("skills", [])
        resume.experience = parsed.get("experience", [])
        resume.education = parsed.get("education", [])
        resume.certifications = parsed.get("certifications", [])
        resume.summary = parsed.get("summary", "")
        resume.total_years_experience = parsed.get("total_years_experience")
        resume.seniority_level = parsed.get("seniority_level", "")
        resume.status = Resume.Status.PARSED
        resume.parsed_at = timezone.now()
        resume.save()

        logger.info(f"Resume {resume_id} parsed successfully.")
        return {"status": "success", "resume_id": resume_id}

    except Exception as exc:
        logger.error(f"Resume parsing failed for {resume_id}: {exc}")
        try:
            resume = Resume.objects.get(id=resume_id)
            resume.status = Resume.Status.ERROR
            resume.error_message = str(exc)
            resume.save(update_fields=["status", "error_message"])
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def parse_job_description_task(self, jd_id: str):
    """Parse job description text using Gemini."""
    from apps.jobs.models import JobDescription
    from .services.gemini import parse_job_description_with_gemini

    try:
        jd = JobDescription.objects.get(id=jd_id)
        parsed = parse_job_description_with_gemini(jd.raw_text)

        jd.required_skills = parsed.get("required_skills", [])
        jd.preferred_skills = parsed.get("preferred_skills", [])
        jd.responsibilities = parsed.get("responsibilities", [])
        jd.qualifications = parsed.get("qualifications", [])
        jd.keywords = parsed.get("keywords", [])

        if not jd.title:
            jd.title = parsed.get("title", jd.title)
        if not jd.company:
            jd.company = parsed.get("company", "")

        jd.save()
        logger.info(f"JD {jd_id} parsed successfully.")
        return {"status": "success", "jd_id": jd_id}

    except Exception as exc:
        logger.error(f"JD parsing failed for {jd_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def run_analysis_task(self, analysis_id: str):
    """Run full resume-vs-JD analysis using Gemini."""
    from .models import AnalysisResult
    from .services.gemini import analyze_resume_job_match

    try:
        analysis = AnalysisResult.objects.select_related("resume", "job_description").get(id=analysis_id)
        analysis.status = AnalysisResult.Status.PROCESSING
        analysis.save(update_fields=["status"])

        resume = analysis.resume
        jd = analysis.job_description

        result = analyze_resume_job_match(
            resume_text=resume.raw_text,
            resume_skills=resume.skills,
            jd_text=jd.raw_text,
            jd_required_skills=jd.required_skills,
            jd_preferred_skills=jd.preferred_skills,
        )

        analysis.ats_score = result.get("ats_score", 0)
        analysis.match_score = result.get("match_score", 0)
        analysis.keyword_match_score = result.get("keyword_match_score", 0)
        analysis.experience_match_score = result.get("experience_match_score", 0)
        analysis.skills_match_score = result.get("skills_match_score", 0)
        analysis.matched_skills = result.get("matched_skills", [])
        analysis.missing_required_skills = result.get("missing_required_skills", [])
        analysis.missing_preferred_skills = result.get("missing_preferred_skills", [])
        analysis.matched_keywords = result.get("matched_keywords", [])
        analysis.missing_keywords = result.get("missing_keywords", [])
        analysis.strengths = result.get("strengths", [])
        analysis.gaps = result.get("gaps", [])
        analysis.recommendations = result.get("recommendations", [])
        analysis.resume_improvements = result.get("resume_improvements", [])
        analysis.overall_verdict = result.get("overall_verdict", "")
        analysis.hire_probability = result.get("hire_probability", "")
        analysis.status = AnalysisResult.Status.COMPLETED
        analysis.completed_at = timezone.now()
        analysis.save()

        logger.info(f"Analysis {analysis_id} completed. ATS: {analysis.ats_score}")
        return {"status": "success", "analysis_id": analysis_id, "ats_score": analysis.ats_score}

    except Exception as exc:
        logger.error(f"Analysis {analysis_id} failed: {exc}")
        try:
            analysis = AnalysisResult.objects.get(id=analysis_id)
            analysis.status = AnalysisResult.Status.FAILED
            analysis.error_message = str(exc)
            analysis.save(update_fields=["status", "error_message"])
        except Exception:
            pass
        raise self.retry(exc=exc)
