import uuid
from django.db import models
from django.conf import settings


def resume_upload_path(instance, filename):
    return f"resumes/{instance.user.id}/{uuid.uuid4()}_{filename}"


class Resume(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PARSING = "parsing", "Parsing"
        PARSED = "parsed", "Parsed"
        ERROR = "error", "Error"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to=resume_upload_path)
    file_type = models.CharField(max_length=10)  # pdf | docx
    file_size = models.PositiveIntegerField(help_text="Bytes")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    is_primary = models.BooleanField(default=False)

    # Parsed content
    raw_text = models.TextField(blank=True)
    contact_info = models.JSONField(default=dict)
    skills = models.JSONField(default=list)          # ["Python", "React", ...]
    experience = models.JSONField(default=list)       # [{title, company, duration, bullets}]
    education = models.JSONField(default=list)        # [{degree, institution, year}]
    certifications = models.JSONField(default=list)
    summary = models.TextField(blank=True)
    total_years_experience = models.FloatField(null=True, blank=True)
    seniority_level = models.CharField(max_length=50, blank=True)  # junior|mid|senior|lead

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parsed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = "resumes"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user.email} — {self.title or self.file.name}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            Resume.objects.filter(user=self.user, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
