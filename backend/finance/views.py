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
            trimestre  = (today.month - 1) // 3
            mois_debut = trimestre * 3 + 1
            queryset   = Montant.objects.filter(
                date_debut__year=today.year,
                date_debut__month__gte=mois_debut
            )
        elif periode == 'annuel':
            queryset = Montant.objects.filter(date_debut__year=today.year)
        else:
            queryset = Montant.objects.all()

        total_debours  = queryset.aggregate(t=Sum('montant_debours'))['t'] or 0
        total_factures = queryset.aggregate(t=Sum('montant_facture'))['t'] or 0

        return Response({
            'periode':        periode,
            'total_debours':  float(total_debours),
            'total_factures': float(total_factures),
            'solde':          float(total_factures - total_debours),
            'nb_paiements':   queryset.count(),
        })

    @action(detail=False, methods=['get'])
    def recettes_journalieres(self, request):
        """Recettes journalières pour le directeur : détail + total."""
        if not (request.user.est_admin or request.user.role in ('direction', 'assistant_directeur')):
            return Response({'error': 'Accès refusé'}, status=403)

        date_str = request.query_params.get('date', str(timezone.now().date()))
        try:
            from datetime import date
            jour = date.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'Format de date invalide (YYYY-MM-DD)'}, status=400)

        montants_jour = Montant.objects.filter(
            date_debut=jour,
            statut_paiement='paye'
        ).select_related('dossier', 'dossier__client', 'enregistre_par')

        detail = []
        for m in montants_jour:
            detail.append({
                'id':              m.id,
                'dossier':         m.dossier.numero_dossier,
                'client':          m.dossier.client.nom,
                'libelle':         m.libelle,
                'type_montant':    m.type_montant,
                'mode_paiement':   m.mode_paiement,
                'montant_debours': float(m.montant_debours),
                'montant_facture': float(m.montant_facture),
                'enregistre_par':  m.enregistre_par.nom_complet,
            })

        totaux = montants_jour.aggregate(
            total_debours=Sum('montant_debours'),
            total_factures=Sum('montant_facture'),
        )

        return Response({
            'date':             str(jour),
            'nb_operations':    montants_jour.count(),
            'total_debours':    float(totaux['total_debours'] or 0),
            'total_recettes':   float(totaux['total_factures'] or 0),
            'solde_journalier': float((totaux['total_factures'] or 0) - (totaux['total_debours'] or 0)),
            'detail':           detail,
        })


class FactureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = FactureSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['type_facture', 'statut', 'dossier']
    search_fields      = ['numero_facture', 'emetteur', 'dossier__numero_dossier']

    def get_queryset(self):
        user = self.request.user
        if user.est_admin:
            return Facture.objects.select_related('dossier', 'enregistre_par')
        elif user.role in ('caisse', 'comptabilite'):
            return Facture.objects.select_related('dossier', 'enregistre_par')
        return Facture.objects.none()

    def perform_create(self, serializer):
        serializer.save(enregistre_par=self.request.user)