from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models
from django.db.models import Q
from django.core.files.storage import default_storage
from django.conf import settings
from django.http import FileResponse
import os
from .models import Document, HistoriqueDocument, Notification
from .serializers import DocumentSerializer, HistoriqueDocumentSerializer, NotificationSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = DocumentSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['type_document', 'statut', 'dossier', 'assigne_a']
    search_fields      = ['code_document', 'nom_fichier', 'dossier__numero_dossier']

    def get_queryset(self):
        user = self.request.user
        if user.est_admin:
            return Document.objects.select_related('dossier', 'assigne_a', 'scanne_par')
        else:
            # Voir TOUS les documents qui ont touché cet utilisateur
            documents_traites = HistoriqueDocument.objects.filter(
                utilisateur=user
            ).values_list('document_id', flat=True).distinct()
            
            return Document.objects.filter(
                Q(assigne_a=user) | 
                Q(scanne_par=user) |
                Q(id__in=documents_traites)
            ).select_related('dossier', 'assigne_a', 'scanne_par').distinct()

    def create(self, request, *args, **kwargs):
        fichier = request.FILES.get('fichier')
        dossier_id = request.data.get('dossier')
        type_document = request.data.get('type_document')
        
        if not fichier:
            return Response({'fichier': 'Fichier requis'}, status=400)
        if not dossier_id:
            return Response({'dossier': 'Dossier requis'}, status=400)
        if not type_document:
            return Response({'type_document': 'Type de document requis'}, status=400)
        
        types_acceptes = [
            'application/pdf',
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
        ]
        if fichier.content_type not in types_acceptes:
            return Response({'fichier': f'Type non accepté: {fichier.content_type}'}, status=400)
        
        chemin_relatif = f'documents/{dossier_id}/{fichier.name}'
        chemin_complet = os.path.join(settings.MEDIA_ROOT, chemin_relatif)
        os.makedirs(os.path.dirname(chemin_complet), exist_ok=True)
        chemin_sauvegarde = default_storage.save(chemin_relatif, fichier)
        
        from dossiers.models import Dossier
        try:
            dossier = Dossier.objects.get(id=dossier_id)
        except Dossier.DoesNotExist:
            return Response({'dossier': 'Dossier introuvable'}, status=404)
        
        document = Document.objects.create(
            dossier=dossier,
            type_document=type_document,
            nom_fichier=fichier.name,
            chemin_fichier=chemin_sauvegarde,
            taille_fichier=fichier.size,
            observations=request.data.get('observations', ''),
            scanne_par=request.user,
        )
        
        HistoriqueDocument.objects.create(
            document=document,
            utilisateur=request.user,
            action='scanne',
            details=f'Document scanné: {fichier.name}',
            nouveau_statut='en_attente'
        )
        
        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def assigner(self, request, pk=None):
        document = self.get_object()
        utilisateur_id = request.data.get('utilisateur_id')
        
        if not utilisateur_id:
            return Response({'error': 'Utilisateur requis'}, status=400)
        
        from utilisateurs.models import Utilisateur
        try:
            utilisateur = Utilisateur.objects.get(id=utilisateur_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)
        
        ancien_statut = document.statut
        document.assigne_a = utilisateur
        document.statut = 'en_traitement'
        document.save()
        
        # Historique pour l'expéditeur
        HistoriqueDocument.objects.create(
            document=document,
            utilisateur=request.user,
            action='envoye',
            details=f'Document envoyé à {utilisateur.nom_complet} ({utilisateur.role})',
            ancien_statut=ancien_statut,
            nouveau_statut='en_traitement'
        )
        
        # Historique pour le destinataire
        HistoriqueDocument.objects.create(
            document=document,
            utilisateur=utilisateur,
            action='recu',
            details=f'Document reçu de {request.user.nom_complet} ({request.user.role})',
            ancien_statut=ancien_statut,
            nouveau_statut='en_traitement'
        )
        
        Notification.objects.create(
            utilisateur=utilisateur,
            document=document,
            dossier=document.dossier,
            type_notification='document_assigne',
            titre='Document reçu',
            message=f'Le document {document.code_document} vous a été envoyé par {request.user.nom_complet}'
        )
        
        return Response({'message': 'Document assigné avec succès'})

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        document = self.get_object()
        ancien_statut = document.statut
        document.statut = 'valide'
        document.date_fin = timezone.now().date()
        document.save()
        
        HistoriqueDocument.objects.create(
            document=document,
            utilisateur=request.user,
            action='valide',
            details='Document validé',
            ancien_statut=ancien_statut,
            nouveau_statut='valide'
        )
        
        if document.scanne_par:
            Notification.objects.create(
                utilisateur=document.scanne_par,
                document=document,
                dossier=document.dossier,
                type_notification='document_valide',
                titre='Document validé',
                message=f'Le document {document.code_document} a été validé'
            )
        
        return Response({'message': 'Document validé'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        document = self.get_object()
        motif = request.data.get('motif', '')
        ancien_statut = document.statut
        
        document.statut = 'rejete'
        document.observations = motif
        document.save()
        
        HistoriqueDocument.objects.create(
            document=document,
            utilisateur=request.user,
            action='rejete',
            details=f'Document rejeté: {motif}',
            ancien_statut=ancien_statut,
            nouveau_statut='rejete'
        )
        
        if document.scanne_par:
            Notification.objects.create(
                utilisateur=document.scanne_par,
                document=document,
                dossier=document.dossier,
                type_notification='document_rejete',
                titre='Document rejeté',
                message=f'Le document {document.code_document} a été rejeté: {motif}'
            )
        
        return Response({'message': 'Document rejeté'})

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        document = self.get_object()
        historique = document.historique.all()
        serializer = HistoriqueDocumentSerializer(historique, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def telecharger(self, request, pk=None):
        document = self.get_object()
        
        HistoriqueDocument.objects.create(
            document=document,
            utilisateur=request.user,
            action='telecharge',
            details='Document téléchargé'
        )
        
        fichier_path = os.path.join(settings.MEDIA_ROOT, document.chemin_fichier)
        
        if os.path.exists(fichier_path):
            return FileResponse(open(fichier_path, 'rb'), as_attachment=True, filename=document.nom_fichier)
        else:
            return Response({'error': 'Fichier introuvable'}, status=404)


class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['lue', 'type_notification']

    def get_queryset(self):
        return Notification.objects.filter(
            utilisateur=self.request.user
        ).select_related('document', 'dossier')

    @action(detail=True, methods=['post'])
    def marquer_lue(self, request, pk=None):
        notification = self.get_object()
        notification.lue = True
        notification.date_lecture = timezone.now()
        notification.save()
        return Response({'message': 'Notification marquée comme lue'})

    @action(detail=False, methods=['post'])
    def marquer_toutes_lues(self, request):
        Notification.objects.filter(
            utilisateur=request.user,
            lue=False
        ).update(lue=True, date_lecture=timezone.now())
        return Response({'message': 'Toutes les notifications marquées comme lues'})

    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        count = Notification.objects.filter(
            utilisateur=request.user,
            lue=False
        ).count()
        return Response({'count': count})