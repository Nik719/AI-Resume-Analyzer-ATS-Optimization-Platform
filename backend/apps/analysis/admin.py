from django.contrib import admin
from .models import AnalysisResult


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "resume", "job_description", "status", "ats_score", "match_score", "created_at"]
    list_filter = ["status", "hire_probability"]
    search_fields = ["user__email", "job_description__title"]
    readonly_fields = ["ats_score", "match_score", "matched_skills", "recommendations"]
