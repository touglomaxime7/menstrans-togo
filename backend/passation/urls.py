from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PassationViewSet

router = DefaultRouter()
router.register(r'', PassationViewSet, basename='passation')

urlpatterns = [
    path('', include(router.urls)),
]