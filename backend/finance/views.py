from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum
from .models import Montant, Facture
from .serializers import MontantSerializer, FactureSerializer


class MontantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = MontantSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['type_montant', 'statut_paiement', 'mode_paiement', 'dossier']
    search_fields      = ['libelle', 'dossier__numero_dossier', 'reference_paiement']

    def get_queryset(self):
        user  = self.request.user
        today = timezone.now().date()

        date_debut = self.request.query_params.get('date_debut', str(today))
        date_fin   = self.request.query_params.get('date_fin',   str(today))

        if user.est_admin:
            queryset = Montant.objects.select_related('dossier', 'enregistre_par')
        elif user.role in ('caisse', 'comptabilite'):
            queryset = Montant.objects.select_related('dossier', 'enregistre_par')
        else:
            queryset = Montant.objects.none()

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        return queryset

    def perform_create(self, serializer):
        serializer.save(enregistre_par=self.request.user)

    @action(detail=False, methods=['get'])
    def bilan(self, request):
        if not request.user.role in ('admin', 'direction', 'caisse', 'comptabilite'):
            return Response({'error': 'Accès refusé'}, status=403)

        periode = request.query_params.get('periode', 'mensuel')
        today   = timezone.now().date()

        if periode == 'mensuel':
            queryset = Montant.objects.filter(
                date_debut__year=today.year,
                date_debut__month=today.month
            )
        elif periode == 'trimestriel':
            trimestre = (today.month - 1) // 3
            mois_debut = trimestre * 3 + 1
            queryset = Montant.objects.filter(
                date_debut__year=today.year,
                date_debut__month__gte=mois_debut
            )
        elif periode == 'annuel':
            queryset = Montant.objects.filter(date_debut__year=today.year)
        else:
            queryset = Montant.objects.all()

        total_debours  = queryset.aggregate(t=Sum('montant_debours'))['t']  or 0
        total_factures = queryset.aggregate(t=Sum('montant_facture'))['t']  or 0

        return Response({
            'periode':        periode,
            'total_debours':  float(total_debours),
            'total_factures': float(total_factures),
            'solde':          float(total_factures - total_debours),
            'nb_paiements':   queryset.count(),
        })

    @action(detail=False, methods=['get'])
    def aujourd_hui(self, request):
        today    = timezone.now().date()
        queryset = self.get_queryset().filter(date_debut=today)
        serializer = MontantSerializer(queryset, many=True)
        return Response(serializer.data)


class FactureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = FactureSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['type_facture', 'statut', 'dossier']
    search_fields      = ['numero_facture', 'emetteur', 'dossier__numero_dossier']

    def get_queryset(self):
        user  = self.request.user
        today = timezone.now().date()

        date_debut = self.request.query_params.get('date_debut', str(today))
        date_fin   = self.request.query_params.get('date_fin',   str(today))

        if user.est_admin:
            queryset = Facture.objects.select_related('dossier', 'enregistre_par')
        elif user.role in ('caisse', 'comptabilite'):
            queryset = Facture.objects.select_related('dossier', 'enregistre_par')
        else:
            queryset = Facture.objects.none()

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        return queryset

    def perform_create(self, serializer):
        serializer.save(enregistre_par=self.request.user)

    @action(detail=True, methods=['post'])
    def marquer_payee(self, request, pk=None):
        facture        = self.get_object()
        facture.statut = 'payee'
        facture.date_fin = timezone.now().date()
        facture.save()
        return Response({'message': 'Facture marquée comme payée'})

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        if not request.user.est_admin:
            return Response({'error': 'Accès refusé'}, status=403)
        facture        = self.get_object()
        facture.statut = 'annulee'
        facture.save()
        return Response({'message': 'Facture annulée'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not request.user.role in ('admin', 'direction', 'caisse', 'comptabilite'):
            return Response({'error': 'Accès refusé'}, status=403)
        today = timezone.now().date()
        return Response({
            'total':       Facture.objects.count(),
            'en_attente':  Facture.objects.filter(statut='en_attente').count(),
            'payees':      Facture.objects.filter(statut='payee').count(),
            'annulees':    Facture.objects.filter(statut='annulee').count(),
            'aujourd_hui': Facture.objects.filter(date_debut=today).count(),
        })