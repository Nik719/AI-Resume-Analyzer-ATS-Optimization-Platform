import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Max, Count
from .models import AnalysisResult
from .serializers import AnalysisResultSerializer, AnalysisCreateSerializer
from .tasks import run_analysis_task

logger = logging.getLogger(__name__)


class AnalysisViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return (
            AnalysisResult.objects
            .filter(user=self.request.user)
            .select_related("resume", "job_description")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return AnalysisCreateSerializer
        return AnalysisResultSerializer

    def create(self, request, *args, **kwargs):
        serializer = AnalysisCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        resume = serializer.validated_data["resume"]
        jd = serializer.validated_data["job_description"]

        # Ensure resume is parsed
        if resume.status != "parsed":
            return Response(
                {"detail": "Resume is still being parsed. Please wait."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        analysis, created = AnalysisResult.objects.get_or_create(
            user=request.user,
            resume=resume,
            job_description=jd,
            defaults={"status": AnalysisResult.Status.PENDING},
        )

        if not created and analysis.status == AnalysisResult.Status.COMPLETED:
            # Re-run analysis
            analysis.status = AnalysisResult.Status.PENDING
            analysis.save(update_fields=["status"])

        run_analysis_task.delay(str(analysis.id))
        return Response(
            AnalysisResultSerializer(analysis, context={"request": request}).data,
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        qs = AnalysisResult.objects.filter(user=request.user, status=AnalysisResult.Status.COMPLETED)
        aggregates = qs.aggregate(
            avg_ats=Avg("ats_score"),
            best_match=Max("match_score"),
            total=Count("id"),
        )

        recent = (
            AnalysisResult.objects
            .filter(user=request.user)
            .select_related("resume", "job_description")
            .order_by("-created_at")[:5]
        )

        # Last 10 completed analyses, most recent first (frontend reverses for the chart)
        trend = list(
            qs.order_by("-completed_at")
            .values("completed_at", "ats_score", "match_score")[:10]
        )

        return Response({
            "total_resumes": request.user.resumes.count(),
            "total_analyses": aggregates["total"] or 0,
            "avg_ats_score": round(aggregates["avg_ats"] or 0, 1),
            "best_match_score": aggregates["best_match"] or 0,
            "recent_analyses": AnalysisResultSerializer(recent, many=True, context={"request": request}).data,
            "score_trend": trend,
        })
