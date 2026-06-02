from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Archive
from .serializers import ArchiveSerializer


class ArchiveViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ArchiveSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    search_fields      = ['dossier__numero_dossier', 'reference_physique']

    def get_queryset(self):
        return Archive.objects.select_related('dossier', 'archive_par')

    def perform_create(self, serializer):
        archive = serializer.save(archive_par=self.request.user)
        # Mettre le dossier en archive
        dossier = archive.dossier
        dossier.statut = 'archive'
        dossier.save()