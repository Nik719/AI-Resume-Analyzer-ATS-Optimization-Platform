from rest_framework import serializers
from django.conf import settings
from .models import Resume


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["id", "title", "file", "status", "file_type", "file_size"]
        read_only_fields = ["id", "status", "file_type", "file_size"]

    def validate_file(self, value):
        ext = value.name.rsplit(".", 1)[-1].lower()
        if ext not in ("pdf", "docx"):
            raise serializers.ValidationError("Only PDF and DOCX files are accepted.")
        if value.size > settings.MAX_UPLOAD_SIZE:
            raise serializers.ValidationError(
                f"File too large. Max size is {settings.MAX_UPLOAD_SIZE // (1024*1024)} MB."
            )
        return value

    def create(self, validated_data):
        file = validated_data["file"]
        ext = file.name.rsplit(".", 1)[-1].lower()
        validated_data["file_type"] = ext
        validated_data["file_size"] = file.size
        validated_data["user"] = self.context["request"].user
        if not validated_data.get("title"):
            validated_data["title"] = file.name.rsplit(".", 1)[0].replace("_", " ").title()
        return super().create(validated_data)


class ResumeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            "id", "title", "file_url", "file_type", "file_size", "status",
            "is_primary", "skills", "experience", "education", "certifications",
            "summary", "contact_info", "total_years_experience", "seniority_level",
            "created_at", "parsed_at", "error_message",
        ]
        read_only_fields = [f for f in fields if f not in ("title", "is_primary")]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ResumeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    class Meta:
        model = Resume
        fields = ["id", "title", "file_type", "status", "is_primary", "skills", "created_at"]
