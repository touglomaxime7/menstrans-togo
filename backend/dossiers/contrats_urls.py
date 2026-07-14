from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContratViewSet, ConteneurViewSet

router = DefaultRouter()
router.register(r'', ContratViewSet, basename='contrats')

conteneur_router = DefaultRouter()
conteneur_router.register(r'', ConteneurViewSet, basename='conteneurs')

urlpatterns = [
    path('', include(router.urls)),
]