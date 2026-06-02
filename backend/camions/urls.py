from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CamionViewSet

router = DefaultRouter()
router.register(r'', CamionViewSet, basename='camions')

urlpatterns = [
    path('', include(router.urls)),
]