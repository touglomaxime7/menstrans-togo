from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'documents',     DocumentViewSet,     basename='documents')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('', include(router.urls)),
]