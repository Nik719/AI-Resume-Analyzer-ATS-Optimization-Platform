import uuid
from django.db import models
from django.conf import settings


class JobDescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_descriptions")
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    job_type = models.CharField(max_length=50, blank=True)  # full-time | contract | etc.
    experience_level = models.CharField(max_length=50, blank=True)
    raw_text = models.TextField()

    # Parsed fields
    required_skills = models.JSONField(default=list)
    preferred_skills = models.JSONField(default=list)
    responsibilities = models.JSONField(default=list)
    qualifications = models.JSONField(default=list)
    keywords = models.JSONField(default=list)

    source_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_descriptions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} @ {self.company or 'Unknown'}"
