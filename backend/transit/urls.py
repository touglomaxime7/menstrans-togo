from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EtudeValeurViewSet, DeclarationDouaneViewSet

router = DefaultRouter()
router.register(r'etudes',       EtudeValeurViewSet,      basename='etudes')
router.register(r'declarations', DeclarationDouaneViewSet, basename='declarations')

urlpatterns = [
    path('', include(router.urls)),
]