from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Logistique, Livraison
from .serializers import LogistiqueSerializer, LivraisonSerializer
from camions.models import Camion


class LogistiqueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = LogistiqueSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['terminal', 'dfu_paye', 'bon_recupere']
    search_fields      = ['dossier__numero_dossier', 'dossier__client__nom']

    def get_queryset(self):
        user  = self.request.user
        today = timezone.now().date()

        date_debut = self.request.query_params.get('date_debut', str(today))
        date_fin   = self.request.query_params.get('date_fin',   str(today))

        if user.est_admin:
            queryset = Logistique.objects.select_related(
                'dossier', 'dossier__client', 'traite_par', 'camion'
            )
        elif user.role == 'logistique':
            queryset = Logistique.objects.filter(
                traite_par=user
            ).select_related('dossier', 'dossier__client', 'traite_par', 'camion')
        else:
            queryset = Logistique.objects.none()

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
    def payer_dfu(self, request, pk=None):
        logistique = self.get_object()
        logistique.dfu_paye          = True
        logistique.date_paiement_dfu = timezone.now().date()
        logistique.save()
        # Mettre à jour le statut du camion
        if logistique.camion:
            logistique.camion.statut = 'en_mission'
            logistique.camion.save()
        return Response({'message': 'DFU payé avec succès'})

    @action(detail=True, methods=['post'])
    def recuperer_bon(self, request, pk=None):
        logistique = self.get_object()
        logistique.bon_recupere          = True
        logistique.date_recuperation_bon = timezone.now().date()
        logistique.save()
        return Response({'message': 'Bon récupéré avec succès'})

    @action(detail=True, methods=['post'])
    def envoyer_passation(self, request, pk=None):
        """Phase initiale terminée : envoie le dossier à la Passation."""
        logistique = self.get_object()
        dossier    = logistique.dossier

        if dossier.statut != 'logistique_initial':
            return Response(
                {'erreur': "Seul un dossier en phase initiale peut être envoyé à la Passation."},
                status=400
            )

        dossier.statut = 'passation'
        dossier.save()
        return Response({'message': 'Dossier envoyé à la Passation'})

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        """Clôture la logistique. Seul un dossier en phase finale peut être clôturé."""
        logistique = self.get_object()
        dossier    = logistique.dossier

        if dossier.statut != 'logistique_final':
            return Response(
                {'erreur': "La logistique ne peut être clôturée que lorsque le dossier est en phase finale (après validation de la Passation)."},
                status=400
            )

        logistique.date_fin = timezone.now().date()
        logistique.save()
        # Mettre le dossier en livraison
        dossier.statut = 'livraison'
        dossier.save()
        # Libérer le camion
        if logistique.camion:
            logistique.camion.statut = 'disponible'
            logistique.camion.save()
        return Response({'message': 'Logistique clôturée — dossier en livraison'})

    @action(detail=False, methods=['get'])
    def aujourd_hui(self, request):
        today    = timezone.now().date()
        queryset = self.get_queryset().filter(date_debut=today)
        serializer = LogistiqueSerializer(queryset, many=True)
        return Response(serializer.data)


class LivraisonViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = LivraisonSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['zone_livraison', 'statut']
    search_fields      = ['logistique__dossier__numero_dossier', 'ville', 'localite', 'pays']

    def get_queryset(self):
        user  = self.request.user
        today = timezone.now().date()

        date_debut = self.request.query_params.get('date_debut', str(today))
        date_fin   = self.request.query_params.get('date_fin',   str(today))

        if user.est_admin:
            queryset = Livraison.objects.select_related('logistique__dossier')
        elif user.role == 'logistique':
            queryset = Livraison.objects.filter(
                enregistre_par=user
            ).select_related('logistique__dossier')
        else:
            queryset = Livraison.objects.none()

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        return queryset

    def perform_create(self, serializer):
        serializer.save(enregistre_par=self.request.user)

    @action(detail=True, methods=['post'])
    def confirmer_livraison(self, request, pk=None):
        livraison          = self.get_object()
        livraison.statut   = 'livre'
        livraison.date_fin = timezone.now().date()
        livraison.save()
        # Clôturer le dossier
        dossier        = livraison.logistique.dossier
        dossier.statut = 'cloture'
        dossier.date_fin = timezone.now().date()
        dossier.save()
        return Response({'message': 'Livraison confirmée — dossier clôturé'})