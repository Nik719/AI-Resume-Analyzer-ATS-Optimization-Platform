from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions
from .models import JobDescription
from .serializers import JobDescriptionSerializer, JobDescriptionListSerializer
from apps.analysis.tasks import parse_job_description_task


class JobDescriptionViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JobDescription.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return JobDescriptionListSerializer
        return JobDescriptionSerializer

    def perform_create(self, serializer):
        jd = serializer.save()
        parse_job_description_task.delay(str(jd.id))
