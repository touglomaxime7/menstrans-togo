from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ClientSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    search_fields      = ['nom', 'email', 'telephone']
    filterset_fields   = ['ville', 'pays']

    def get_queryset(self):
        return Client.objects.all()