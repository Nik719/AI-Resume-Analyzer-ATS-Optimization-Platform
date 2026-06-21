from rest_framework import serializers
from .models import AnalysisResult
from apps.resumes.serializers import ResumeListSerializer
from apps.jobs.serializers import JobDescriptionListSerializer


class AnalysisResultSerializer(serializers.ModelSerializer):
    resume_detail = ResumeListSerializer(source="resume", read_only=True)
    job_detail = JobDescriptionListSerializer(source="job_description", read_only=True)

    class Meta:
        model = AnalysisResult
        fields = [
            "id", "status",
            "resume", "job_description", "resume_detail", "job_detail",
            "ats_score", "match_score", "keyword_match_score",
            "experience_match_score", "skills_match_score",
            "matched_skills", "missing_required_skills", "missing_preferred_skills",
            "matched_keywords", "missing_keywords",
            "strengths", "gaps", "recommendations", "resume_improvements",
            "overall_verdict", "hire_probability",
            "created_at", "completed_at", "error_message",
        ]
        read_only_fields = [f for f in fields if f not in ("resume", "job_description")]

    def validate(self, attrs):
        user = self.context["request"].user
        resume = attrs.get("resume")
        jd = attrs.get("job_description")
        if resume and resume.user != user:
            raise serializers.ValidationError({"resume": "Resume not found."})
        if jd and jd.user != user:
            raise serializers.ValidationError({"job_description": "Job description not found."})
        return attrs


class AnalysisCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = ["resume", "job_description"]
        validators = []  # unique_together is handled by get_or_create in the view


class DashboardStatsSerializer(serializers.Serializer):
    total_resumes = serializers.IntegerField()
    total_analyses = serializers.IntegerField()
    avg_ats_score = serializers.FloatField()
    best_match_score = serializers.IntegerField()
    recent_analyses = AnalysisResultSerializer(many=True)
    score_trend = serializers.ListField(child=serializers.DictField())
