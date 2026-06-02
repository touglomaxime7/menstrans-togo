from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Passation
from .serializers import PassationSerializer


class PassationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = PassationSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['statut_douane', 'dossier_conforme']
    search_fields      = ['dossier__numero_dossier', 'dossier__client__nom']

    def get_queryset(self):
        user  = self.request.user
        today = timezone.now().date()

        date_debut = self.request.query_params.get('date_debut', str(today))
        date_fin   = self.request.query_params.get('date_fin',   str(today))

        if user.est_admin:
            queryset = Passation.objects.select_related('dossier', 'traite_par')
        elif user.role == 'passation':
            queryset = Passation.objects.filter(
                traite_par=user
            ).select_related('dossier', 'traite_par')
        else:
            queryset = Passation.objects.none()

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            traite_par=self.request.user,
            date_debut=timezone.now().date()
        )

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Validation OK : renvoie le dossier au Logistique pour la phase finale."""
        passation = self.get_object()
        passation.statut_douane    = 'confirme'
        passation.dossier_conforme = True
        passation.date_fin         = timezone.now().date()
        passation.save()
        # Renvoyer le dossier au Logistique en phase finale
        dossier        = passation.dossier
        dossier.statut = 'logistique_final'
        dossier.save()
        return Response({'message': 'Passation confirmée — dossier renvoyé au Logistique (phase finale)'})

    @action(detail=True, methods=['post'])
    def infirmer(self, request, pk=None):
        """Non conforme : renvoie le dossier au Logistique en phase initiale pour complément."""
        passation = self.get_object()
        passation.statut_douane    = 'infirme'
        passation.dossier_conforme = False
        passation.save()
        # Renvoyer le dossier au Logistique en phase initiale
        dossier        = passation.dossier
        dossier.statut = 'logistique_initial'
        dossier.save()
        return Response({'message': 'Passation infirmée — dossier renvoyé au Logistique (phase initiale) pour complément'})

    @action(detail=False, methods=['get'])
    def aujourd_hui(self, request):
        today    = timezone.now().date()
        queryset = self.get_queryset().filter(date_debut=today)
        serializer = PassationSerializer(queryset, many=True)
        return Response(serializer.data)