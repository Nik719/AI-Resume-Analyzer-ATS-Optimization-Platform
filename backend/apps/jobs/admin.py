from django.contrib import admin
from .models import JobDescription


@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ["title", "company", "user", "created_at"]
    search_fields = ["title", "company", "user__email"]
