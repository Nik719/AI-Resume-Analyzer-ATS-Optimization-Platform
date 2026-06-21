from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobDescriptionViewSet

router = DefaultRouter()
router.register("", JobDescriptionViewSet, basename="job")

urlpatterns = [path("", include(router.urls))]
