from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, date
from .models import Client
from .serializers import ClientSerializer


STATUT_LABELS = {
    'nouveau':            'Nouveau',
    'transit':            'Transit',
    'logistique_initial': 'Logistique initiale',
    'passation':          'Passation',
    'logistique_final':   'Logistique finale',
    'livraison':          'Livraison',
    'cloture':            'Clôture',
    'archive':            'Archive',
}

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ClientSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    search_fields      = ['nom', 'email', 'telephone']
    filterset_fields   = ['ville', 'pays']

    def get_queryset(self):
        return Client.objects.all()

    @action(detail=True, methods=['get'])
    def dossiers(self, request, pk=None):
        """Retourne tous les dossiers liés à ce client."""
        from dossiers.models import Dossier
        from dossiers.serializers import DossierSerializer

        client   = self.get_object()
        dossiers = Dossier.objects.filter(client=client).select_related('client', 'cree_par')
        serializer = DossierSerializer(dossiers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        """Timeline complète d'activité du client : dossiers, statuts, contrats, paiements."""
        from dossiers.models import Dossier, HistoriqueDossier, Contrat
        client = self.get_object()

        def vers_datetime_aware(d):
            """Convertit une date ou un datetime en datetime avec fuseau horaire."""
            if d is None:
                return timezone.now()
            if isinstance(d, datetime):
                if timezone.is_naive(d):
                    return timezone.make_aware(d)
                return d
            if isinstance(d, date):
                return timezone.make_aware(datetime.combine(d, datetime.min.time()))
            return timezone.now()

        evenements = []

        # 1. Création des dossiers
        dossiers = Dossier.objects.filter(client=client).select_related('cree_par')
        for d in dossiers:
            evenements.append({
                'type':        'dossier_cree',
                'titre':       f'Dossier {d.numero_dossier} créé',
                'description': f'Transport {d.type_transport} · {d.get_classification_display()}',
                'date_obj':    vers_datetime_aware(d.cree_le),
                'utilisateur': d.cree_par.nom_complet if d.cree_par else '—',
                'dossier':     d.numero_dossier,
                'dossier_id':  d.id,
                'icone':       '📁',
            })

        # 2. Changements de statut
        historique_statuts = HistoriqueDossier.objects.filter(
            dossier__client=client
        ).select_related('dossier', 'utilisateur')
        for h in historique_statuts:
            evenements.append({
                'type':        'changement_statut',
                'titre':       f'{h.dossier.numero_dossier} → {STATUT_LABELS.get(h.statut_apres, h.statut_apres)}',
                'description': h.commentaire or f'Passage en {STATUT_LABELS.get(h.statut_apres, h.statut_apres)}',
                'date_obj':    vers_datetime_aware(h.date_changement),
                'utilisateur': h.utilisateur.nom_complet if h.utilisateur else '—',
                'dossier':     h.dossier.numero_dossier,
                'dossier_id':  h.dossier.id,
                'icone':       '🔄',
            })

        # 3. Contrats
        contrats = Contrat.objects.filter(dossier__client=client).select_related('dossier', 'redige_par')
        for c in contrats:
            evenements.append({
                'type':        'contrat_cree',
                'titre':       f'Contrat {c.numero_contrat} créé',
                'description': f'Statut : {c.get_statut_display()}',
                'date_obj':    vers_datetime_aware(c.cree_le),
                'utilisateur': c.redige_par.nom_complet if c.redige_par else '—',
                'dossier':     c.dossier.numero_dossier,
                'dossier_id':  c.dossier.id,
                'icone':       '📝',
            })
            if c.signe_par_dg_le:
                evenements.append({
                    'type':        'contrat_signe_dg',
                    'titre':       f'Contrat {c.numero_contrat} signé par le DG',
                    'description': '',
                    'date_obj':    vers_datetime_aware(c.signe_par_dg_le),
                    'utilisateur': '—',
                    'dossier':     c.dossier.numero_dossier,
                    'dossier_id':  c.dossier.id,
                    'icone':       '✍️',
                })
            if c.signe_par_client_le:
                evenements.append({
                    'type':        'contrat_signe_client',
                    'titre':       f'Contrat {c.numero_contrat} signé par le client',
                    'description': '',
                    'date_obj':    vers_datetime_aware(c.signe_par_client_le),
                    'utilisateur': '—',
                    'dossier':     c.dossier.numero_dossier,
                    'dossier_id':  c.dossier.id,
                    'icone':       '✍️',
                })

        # 4. Paiements / montants financiers
        try:
            from finance.models import Montant
            montants = Montant.objects.filter(dossier__client=client).select_related('dossier', 'enregistre_par')
            for m in montants:
                evenements.append({
                    'type':        'paiement',
                    'titre':       f'Paiement enregistré — {m.libelle}',
                    'description': f'{m.montant_facture} FCFA · {m.mode_paiement}',
                    'date_obj':    vers_datetime_aware(m.date_debut),
                    'utilisateur': m.enregistre_par.nom_complet if m.enregistre_par else '—',
                    'dossier':     m.dossier.numero_dossier,
                    'dossier_id':  m.dossier.id,
                    'icone':       '💰',
                })
        except Exception:
            pass

        # Trier par date décroissante (plus récent en premier)
        evenements.sort(key=lambda e: e['date_obj'], reverse=True)

        # Formater les dates en string pour le JSON, puis retirer l'objet datetime
        for e in evenements:
            e['date'] = e['date_obj'].strftime('%d/%m/%Y %H:%M')
            del e['date_obj']

        return Response({
            'client':          client.nom,
            'nb_evenements':   len(evenements),
            'evenements':      evenements,
        })