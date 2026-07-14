from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Case, When, IntegerField
from datetime import datetime, date
from .models import (Dossier, Contrat, PieceContrat, DocumentContrat,
                     ConteneurDetail, HistoriqueDossier, PIECES_REQUISES)
from .serializers import (DossierSerializer, ContratSerializer,
                          PieceContratSerializer, DocumentContratSerializer,
                          ConteneurDetailSerializer)
from .pdf_generator import generer_pdf_dossier


STATUTS_APRES_TRANSIT    = ['transit', 'logistique_initial', 'passation',
                            'logistique_final', 'livraison', 'cloture']
STATUTS_APRES_LOGISTIQUE = ['logistique_initial', 'passation',
                            'logistique_final', 'livraison', 'cloture']
STATUTS_APRES_PASSATION  = ['passation', 'logistique_final', 'livraison', 'cloture']

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


def vers_datetime_aware(d):
    if d is None:
        return timezone.now()
    if isinstance(d, datetime):
        if timezone.is_naive(d):
            return timezone.make_aware(d)
        return d
    if isinstance(d, date):
        return timezone.make_aware(datetime.combine(d, datetime.min.time()))
    return timezone.now()


def enregistrer_historique(dossier, statut_avant, statut_apres, utilisateur, commentaire=''):
    duree = 0
    dernier = dossier.historique.order_by('-date_changement').first()
    if dernier:
        duree = (timezone.now() - dernier.date_changement).days
    HistoriqueDossier.objects.create(
        dossier=dossier,
        statut_avant=statut_avant,
        statut_apres=statut_apres,
        utilisateur=utilisateur,
        commentaire=commentaire,
        duree_jours=duree,
    )


class DossierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = DossierSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['statut', 'type_transport', 'client', 'classification', 'mode_sortie']
    search_fields      = ['numero_dossier', 'client__nom', 'observations']

    def get_queryset(self):
        user = self.request.user
        date_debut = self.request.query_params.get('date_debut')
        date_fin   = self.request.query_params.get('date_fin')

        if user.est_admin or user.role == 'assistant_directeur':
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
        else:
            queryset = Dossier.objects.select_related('client', 'cree_par')

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        queryset = queryset.annotate(
            priorite=Case(
                When(classification='urgent',     then=1),
                When(classification='vip',        then=2),
                When(classification='contentieux',then=3),
                default=4,
                output_field=IntegerField(),
            )
        ).order_by('priorite', '-cree_le')

        return queryset

    def perform_create(self, serializer):
        annee   = timezone.now().year
        prefixe = f'DOS-{annee}-'
        dernier = Dossier.objects.filter(numero_dossier__startswith=prefixe).count()
        numero  = f'{prefixe}{str(dernier + 1).zfill(3)}'
        dossier = serializer.save(cree_par=self.request.user, numero_dossier=numero)
        enregistrer_historique(dossier, '', 'nouveau', self.request.user, 'Création du dossier')

    def perform_update(self, serializer):
        dossier      = self.get_object()
        statut_avant = dossier.statut
        instance     = serializer.save()
        statut_apres = instance.statut
        if statut_avant != statut_apres:
            enregistrer_historique(
                instance, statut_avant, statut_apres,
                self.request.user,
                f'Changement de statut : {STATUT_LABELS.get(statut_avant)} → {STATUT_LABELS.get(statut_apres)}'
            )
        else:
            enregistrer_historique(
                instance, statut_avant, statut_apres,
                self.request.user,
                'Modification des informations du dossier'
            )

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
        today      = timezone.now().date()
        queryset   = self.get_queryset().filter(date_debut=today)
        serializer = DossierSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def recapitulatif(self, request, pk=None):
        dossier    = self.get_object()
        historique = dossier.historique.select_related('utilisateur').order_by('date_changement')
        duree_totale = dossier.duree_totale_jours()

        detail_historique = []
        for i, h in enumerate(historique):
            if i + 1 < len(historique):
                duree = (historique[i+1].date_changement - h.date_changement).days
            else:
                duree = (timezone.now() - h.date_changement).days
            detail_historique.append({
                'type':            'changement_statut',
                'statut_avant':    h.statut_avant,
                'statut_apres':    h.statut_apres,
                'statut_label':    STATUT_LABELS.get(h.statut_apres, h.statut_apres),
                'utilisateur':     h.utilisateur.nom_complet if h.utilisateur else '—',
                'date_obj':        vers_datetime_aware(h.date_changement),
                'duree_jours':     duree,
                'commentaire':     h.commentaire,
            })

        duree_par_user = {}
        for entry in detail_historique:
            nom = entry['utilisateur']
            duree_par_user[nom] = duree_par_user.get(nom, 0) + entry['duree_jours']

        fichiers           = []
        evenements_annexes = []

        try:
            from documents.models import Document
            for doc in Document.objects.filter(dossier=dossier).select_related('scanne_par'):
                fichiers.append({
                    'source':  'Documents',
                    'nom':     doc.type_document,
                    'date':    doc.date_scan.strftime('%d/%m/%Y') if doc.date_scan else '—',
                    'fichier': request.build_absolute_uri(doc.fichier.url) if doc.fichier else None,
                })
                evenements_annexes.append({
                    'type':        'document_ajoute',
                    'statut_apres':'',
                    'statut_label': f'Document ajouté : {doc.type_document}',
                    'utilisateur': getattr(doc, 'scanne_par', None) and doc.scanne_par.nom_complet or '—',
                    'date_obj':    vers_datetime_aware(doc.date_scan),
                    'duree_jours': 0,
                    'commentaire': f'Document scanné',
                })
        except Exception:
            pass

        try:
            if hasattr(dossier, 'contrat'):
                for doc in dossier.contrat.documents.all():
                    fichiers.append({
                        'source':  'Contrat',
                        'nom':     doc.nom,
                        'date':    doc.uploade_le.strftime('%d/%m/%Y'),
                        'fichier': request.build_absolute_uri(doc.fichier.url) if doc.fichier else None,
                    })
                    evenements_annexes.append({
                        'type':        'document_contrat_ajoute',
                        'statut_apres':'',
                        'statut_label': f'Document de contrat ajouté : {doc.nom}',
                        'utilisateur': doc.uploade_par.nom_complet if doc.uploade_par else '—',
                        'date_obj':    vers_datetime_aware(doc.uploade_le),
                        'duree_jours': 0,
                        'commentaire': doc.get_type_doc_display(),
                    })
                c = dossier.contrat
                evenements_annexes.append({
                    'type':        'contrat_cree',
                    'statut_apres':'',
                    'statut_label': f'Contrat {c.numero_contrat} créé',
                    'utilisateur': c.redige_par.nom_complet if c.redige_par else '—',
                    'date_obj':    vers_datetime_aware(c.cree_le),
                    'duree_jours': 0,
                    'commentaire': c.get_statut_display(),
                })
                if c.signe_par_dg_le:
                    evenements_annexes.append({
                        'type':        'contrat_signe_dg',
                        'statut_apres':'',
                        'statut_label': 'Contrat signé par le DG',
                        'utilisateur': '—',
                        'date_obj':    vers_datetime_aware(c.signe_par_dg_le),
                        'duree_jours': 0,
                        'commentaire': '',
                    })
                if c.signe_par_client_le:
                    evenements_annexes.append({
                        'type':        'contrat_signe_client',
                        'statut_apres':'',
                        'statut_label': 'Contrat signé par le client',
                        'utilisateur': '—',
                        'date_obj':    vers_datetime_aware(c.signe_par_client_le),
                        'duree_jours': 0,
                        'commentaire': '',
                    })
        except Exception:
            pass

        try:
            from finance.models import Montant
            for m in Montant.objects.filter(dossier=dossier).select_related('enregistre_par'):
                evenements_annexes.append({
                    'type':        'paiement',
                    'statut_apres':'',
                    'statut_label': f'Paiement enregistré : {m.libelle}',
                    'utilisateur': m.enregistre_par.nom_complet if m.enregistre_par else '—',
                    'date_obj':    vers_datetime_aware(m.date_debut),
                    'duree_jours': 0,
                    'commentaire': f'{m.montant_facture} FCFA · {m.mode_paiement}',
                })
        except Exception:
            pass

        tous_evenements = detail_historique + evenements_annexes
        tous_evenements.sort(key=lambda e: e['date_obj'])

        for e in tous_evenements:
            e['date_changement'] = e['date_obj'].strftime('%d/%m/%Y %H:%M')
            del e['date_obj']

        return Response({
            'dossier':               dossier.numero_dossier,
            'client':                dossier.client.nom,
            'statut_actuel':         STATUT_LABELS.get(dossier.statut, dossier.statut),
            'date_debut':            str(dossier.date_debut),
            'date_fin':              str(dossier.date_fin) if dossier.date_fin else None,
            'duree_totale_jours':    duree_totale,
            'duree_par_utilisateur': [
                {'utilisateur': u, 'duree_jours': j}
                for u, j in duree_par_user.items()
            ],
            'historique':            tous_evenements,
            'fichiers':              fichiers,
            'nb_fichiers':           len(fichiers),
        })

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        dossier        = self.get_object()
        nouveau_statut = request.data.get('statut')
        commentaire    = request.data.get('commentaire', '')

        statuts_valides = [s[0] for s in Dossier.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response({'error': 'Statut invalide'}, status=400)

        # ── Vérification contrat obligatoire avant Transit ──────────────────────
        if nouveau_statut == 'transit':
            try:
                contrat = dossier.contrat
                if contrat.statut != 'valide':
                    return Response({
                        'error': f'Impossible d\'envoyer au Transit : le contrat {contrat.numero_contrat} n\'est pas encore validé.',
                        'code': 'contrat_non_valide',
                        'contrat_statut': contrat.statut,
                        'contrat_numero': contrat.numero_contrat,
                    }, status=400)
            except Exception:
                return Response({
                    'error': 'Impossible d\'envoyer au Transit : aucun contrat n\'existe pour ce dossier.',
                    'code': 'contrat_absent',
                }, status=400)

        statut_avant   = dossier.statut
        dossier.statut = nouveau_statut
        if nouveau_statut == 'cloture':
            dossier.date_fin = timezone.now().date()
        dossier.save()

        enregistrer_historique(dossier, statut_avant, nouveau_statut, request.user, commentaire)

        return Response(DossierSerializer(dossier).data)

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        dossier   = self.get_object()
        documents = []
        montants  = []
        factures  = []
        try:
            from documents.models import Document
            documents = list(Document.objects.filter(dossier=dossier).order_by('-date_scan'))
        except Exception:
            pass
        try:
            from finance.models import Montant
            montants = list(Montant.objects.filter(dossier=dossier).order_by('-date_debut'))
        except Exception:
            pass
        try:
            from finance.models import Facture
            factures = list(Facture.objects.filter(dossier=dossier).order_by('-date_debut'))
        except Exception:
            pass
        pdf      = generer_pdf_dossier(dossier, documents, montants, factures)
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="Dossier_{dossier.numero_dossier}.pdf"'
        )
        return response


# ── CONTENEUR ──────────────────────────────────────────────────────────────────

class ConteneurViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ConteneurDetailSerializer

    def get_queryset(self):
        return ConteneurDetail.objects.select_related('dossier')


# ── CONTRAT ────────────────────────────────────────────────────────────────────

class ContratViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ContratSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['statut', 'dossier']
    search_fields      = ['numero_contrat', 'dossier__numero_dossier', 'dossier__client__nom']

    def get_queryset(self):
        return Contrat.objects.select_related(
            'dossier', 'dossier__client', 'redige_par', 'valide_par'
        ).prefetch_related('pieces', 'documents')

    def perform_create(self, serializer):
        contrat = serializer.save(redige_par=self.request.user)
        for code, _ in PIECES_REQUISES:
            PieceContrat.objects.get_or_create(contrat=contrat, code_piece=code)

    @action(detail=True, methods=['post'])
    def valider_piece(self, request, pk=None):
        contrat    = self.get_object()
        code_piece = request.data.get('code_piece')
        valide     = request.data.get('valide', True)
        try:
            piece = contrat.pieces.get(code_piece=code_piece)
        except PieceContrat.DoesNotExist:
            return Response({'error': 'Pièce introuvable'}, status=404)
        piece.valide       = valide
        piece.valide_par   = request.user if valide else None
        piece.valide_le    = timezone.now() if valide else None
        piece.observations = request.data.get('observations', piece.observations)
        piece.save()
        return Response({
            'avancement':     contrat.avancement_pieces,
            'toutes_valides': contrat.toutes_pieces_valides,
            'piece':          PieceContratSerializer(piece).data,
        })

    @action(detail=True, methods=['post'])
    def valider_contrat(self, request, pk=None):
        contrat = self.get_object()
        if not contrat.toutes_pieces_valides:
            return Response({
                'error': f'Impossible : seulement {contrat.avancement_pieces} pièces validées.'
            }, status=400)
        contrat.statut     = 'valide'
        contrat.valide_par = request.user
        contrat.save()
        return Response(ContratSerializer(contrat).data)

    @action(detail=True, methods=['post'])
    def signer_dg(self, request, pk=None):
        contrat   = self.get_object()
        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Signature manquante'}, status=400)
        contrat.signature_dg    = signature
        contrat.signe_par_dg_le = timezone.now()
        if contrat.signature_client:
            contrat.statut = 'en_attente'
        contrat.save()
        return Response({
            'message':     'Signature DG enregistrée',
            'est_signe':   contrat.est_signe,
            'signe_dg_le': str(contrat.signe_par_dg_le),
        })

    @action(detail=True, methods=['post'])
    def signer_client(self, request, pk=None):
        contrat   = self.get_object()
        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Signature manquante'}, status=400)
        contrat.signature_client    = signature
        contrat.signe_par_client_le = timezone.now()
        if contrat.signature_dg:
            contrat.statut = 'en_attente'
        contrat.save()
        return Response({
            'message':         'Signature client enregistrée',
            'est_signe':       contrat.est_signe,
            'signe_client_le': str(contrat.signe_par_client_le),
        })

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        contrat  = self.get_object()
        fichier  = request.FILES.get('fichier')
        nom      = request.data.get('nom', fichier.name if fichier else 'Document')
        type_doc = request.data.get('type_doc', 'autre')
        if not fichier:
            return Response({'error': 'Fichier manquant'}, status=400)
        doc = DocumentContrat.objects.create(
            contrat=contrat, nom=nom, type_doc=type_doc,
            fichier=fichier, uploade_par=request.user,
        )
        return Response(
            DocumentContratSerializer(doc, context={'request': request}).data,
            status=201
        )

    @action(detail=True, methods=['delete'],
            url_path='supprimer_document/(?P<doc_id>[^/.]+)')
    def supprimer_document(self, request, pk=None, doc_id=None):
        contrat = self.get_object()
        try:
            doc = contrat.documents.get(id=doc_id)
            doc.fichier.delete(save=False)
            doc.delete()
            return Response({'message': 'Document supprimé'})
        except DocumentContrat.DoesNotExist:
            return Response({'error': 'Document introuvable'}, status=404)