from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from .models import Dossier
from .serializers import DossierSerializer
from .pdf_generator import generer_pdf_dossier


# Statuts visibles par chaque rôle dans le nouveau workflow.
# Un rôle voit toujours les statuts égaux ou postérieurs à son intervention.
STATUTS_APRES_TRANSIT     = ['transit', 'logistique_initial', 'passation',
                             'logistique_final', 'livraison', 'cloture']
STATUTS_APRES_LOGISTIQUE  = ['logistique_initial', 'passation',
                             'logistique_final', 'livraison', 'cloture']
STATUTS_APRES_PASSATION   = ['passation', 'logistique_final',
                             'livraison', 'cloture']


class DossierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = DossierSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['statut', 'type_transport', 'client']
    search_fields      = ['numero_dossier', 'client__nom', 'observations']

    def get_queryset(self):
        user = self.request.user

        date_debut = self.request.query_params.get('date_debut')
        date_fin   = self.request.query_params.get('date_fin')

        if user.est_admin:
            queryset = Dossier.objects.select_related('client', 'cree_par')
        elif user.role == 'assistant_directeur':
            queryset = Dossier.objects.select_related('client', 'cree_par')
        elif user.role == 'transit':
            queryset = Dossier.objects.filter(
                statut__in=STATUTS_APRES_TRANSIT
            ).select_related('client', 'cree_par')
        elif user.role == 'logistique':
            queryset = Dossier.objects.filter(
                statut__in=STATUTS_APRES_LOGISTIQUE
            ).select_related('client', 'cree_par')
        elif user.role == 'passation':
            queryset = Dossier.objects.filter(
                statut__in=STATUTS_APRES_PASSATION
            ).select_related('client', 'cree_par')
        elif user.role in ('caisse', 'comptabilite'):
            queryset = Dossier.objects.select_related('client', 'cree_par')
        else:
            queryset = Dossier.objects.select_related('client', 'cree_par')

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        return queryset

    def perform_create(self, serializer):
        from django.utils import timezone
        # Génération du numéro de dossier au format DOS-AAAA-NNN
        annee = timezone.now().year
        prefixe = f'DOS-{annee}-'
        dernier = Dossier.objects.filter(
            numero_dossier__startswith=prefixe
        ).count()
        numero = f'{prefixe}{str(dernier + 1).zfill(3)}'
        serializer.save(cree_par=self.request.user, numero_dossier=numero)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not request.user.est_admin:
            return Response({'error': 'Accès refusé'}, status=403)
        today = timezone.now().date()
        return Response({
            'total':       Dossier.objects.count(),
            'en_cours':    Dossier.objects.exclude(statut='cloture').count(),
            'clotures':    Dossier.objects.filter(statut='cloture').count(),
            'aujourd_hui': Dossier.objects.filter(date_debut=today).count(),
        })

    @action(detail=False, methods=['get'])
    def aujourd_hui(self, request):
        today = timezone.now().date()
        queryset = self.get_queryset().filter(date_debut=today)
        serializer = DossierSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Export du dossier en PDF"""
        dossier = self.get_object()

        # Récupérer les données liées
        documents = []
        montants = []
        factures = []

        try:
            from documents.models import Document
            documents = list(Document.objects.filter(dossier=dossier).order_by('-date_scan'))
        except:
            pass

        try:
            from finance.models import Montant
            montants = list(Montant.objects.filter(dossier=dossier).order_by('-date_creation'))
        except:
            pass

        try:
            from finance.models import Facture
            factures = list(Facture.objects.filter(dossier=dossier).order_by('-date_facture'))
        except:
            pass

        # Générer le PDF
        pdf = generer_pdf_dossier(dossier, documents, montants, factures)

        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Dossier_{dossier.numero_dossier}.pdf"'
        return response