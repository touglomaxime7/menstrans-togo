from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArchiveViewSet

router = DefaultRouter()
router.register(r'', ArchiveViewSet, basename='archives')

urlpatterns = [
    path('', include(router.urls)),
]