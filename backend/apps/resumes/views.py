import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from .models import Resume
from .serializers import ResumeUploadSerializer, ResumeSerializer, ResumeListSerializer
from apps.analysis.tasks import parse_resume_task

logger = logging.getLogger(__name__)


class ResumeViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    # Always include multipart parsers — file upload is this viewset's primary job.
    # get_parsers() is called before self.action is set, so we can't branch on it there.
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return ResumeUploadSerializer
        if self.action == "list":
            return ResumeListSerializer
        return ResumeSerializer

    def perform_create(self, serializer):
        resume = serializer.save()
        # Kick off async parsing
        parse_resume_task.delay(str(resume.id))
        logger.info(f"Resume {resume.id} queued for parsing.")

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["post"], url_path="set-primary")
    def set_primary(self, request, pk=None):
        resume = self.get_object()
        resume.is_primary = True
        resume.save()
        return Response({"detail": "Set as primary resume."})
