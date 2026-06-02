from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MontantViewSet, FactureViewSet

router = DefaultRouter()
router.register(r'montants', MontantViewSet, basename='montants')
router.register(r'factures', FactureViewSet, basename='factures')

urlpatterns = [
    path('', include(router.urls)),
]