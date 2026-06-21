import uuid
from django.db import models
from django.conf import settings


class AnalysisResult(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="analyses")
    resume = models.ForeignKey("resumes.Resume", on_delete=models.CASCADE, related_name="analyses")
    job_description = models.ForeignKey("jobs.JobDescription", on_delete=models.CASCADE, related_name="analyses")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Scores
    ats_score = models.PositiveSmallIntegerField(null=True, blank=True)
    match_score = models.PositiveSmallIntegerField(null=True, blank=True)
    keyword_match_score = models.PositiveSmallIntegerField(null=True, blank=True)
    experience_match_score = models.PositiveSmallIntegerField(null=True, blank=True)
    skills_match_score = models.PositiveSmallIntegerField(null=True, blank=True)

    # Detailed results (from Gemini)
    matched_skills = models.JSONField(default=list)
    missing_required_skills = models.JSONField(default=list)
    missing_preferred_skills = models.JSONField(default=list)
    matched_keywords = models.JSONField(default=list)
    missing_keywords = models.JSONField(default=list)
    strengths = models.JSONField(default=list)
    gaps = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    resume_improvements = models.JSONField(default=list)
    overall_verdict = models.CharField(max_length=255, blank=True)
    hire_probability = models.CharField(max_length=20, blank=True)  # low|moderate|high

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = "analysis_results"
        ordering = ["-created_at"]
        unique_together = [("resume", "job_description")]

    def __str__(self) -> str:
        return f"Analysis {self.id}: {self.resume} vs {self.job_description}"
