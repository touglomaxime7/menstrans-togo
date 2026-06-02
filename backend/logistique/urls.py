from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogistiqueViewSet, LivraisonViewSet

router = DefaultRouter()
router.register(r'missions',   LogistiqueViewSet, basename='logistique')
router.register(r'livraisons', LivraisonViewSet,  basename='livraisons')

urlpatterns = [
    path('', include(router.urls)),
]