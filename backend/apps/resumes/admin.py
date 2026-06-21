from django.contrib import admin
from .models import Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "file_type", "status", "is_primary", "created_at"]
    list_filter = ["status", "file_type", "is_primary"]
    search_fields = ["title", "user__email"]
    readonly_fields = ["raw_text", "skills", "experience", "education", "parsed_at"]
