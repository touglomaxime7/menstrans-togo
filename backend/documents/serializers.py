from rest_framework import serializers
from .models import Document, HistoriqueDocument, Notification


class DocumentSerializer(serializers.ModelSerializer):
    dossier_numero     = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    client_nom         = serializers.CharField(source='dossier.client.nom', read_only=True)
    type_label         = serializers.CharField(source='get_type_document_display', read_only=True)
    statut_label       = serializers.CharField(source='get_statut_display', read_only=True)
    assigne_a_nom      = serializers.CharField(source='assigne_a.nom_complet', read_only=True)
    scanne_par_nom     = serializers.CharField(source='scanne_par.nom_complet', read_only=True)
    taille_fichier_mb  = serializers.SerializerMethodField()

    class Meta:
        model  = Document
        fields = [
            'id', 'code_document', 'dossier', 'dossier_numero', 'client_nom',
            'type_document', 'type_label', 'nom_fichier', 'chemin_fichier',
            'taille_fichier', 'taille_fichier_mb', 'nombre_pages',
            'statut', 'statut_label',
            'assigne_a', 'assigne_a_nom',
            'scanne_par', 'scanne_par_nom',
            'date_scan', 'date_debut', 'date_fin',
            'observations', 'donnees_extraites',
            'cree_le', 'modifie_le'
        ]
        read_only_fields = [
            'code_document', 'scanne_par', 'date_scan', 'cree_le',
            'nom_fichier', 'chemin_fichier', 'taille_fichier'
        ]

    def get_taille_fichier_mb(self, obj):
        if obj.taille_fichier:
            return round(obj.taille_fichier / (1024 * 1024), 2)
        return 0


class HistoriqueDocumentSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.nom_complet', read_only=True)
    document_code   = serializers.CharField(source='document.code_document', read_only=True)

    class Meta:
        model  = HistoriqueDocument
        fields = [
            'id', 'document', 'document_code',
            'utilisateur', 'utilisateur_nom',
            'action', 'details',
            'ancien_statut', 'nouveau_statut',
            'date_action'
        ]
        read_only_fields = ['date_action']


class NotificationSerializer(serializers.ModelSerializer):
    type_label    = serializers.CharField(source='get_type_notification_display', read_only=True)
    document_code = serializers.CharField(source='document.code_document', read_only=True)
    dossier_num   = serializers.CharField(source='dossier.numero_dossier', read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id', 'utilisateur',
            'document', 'document_code',
            'dossier', 'dossier_num',
            'type_notification', 'type_label',
            'titre', 'message',
            'lue', 'date_lecture', 'cree_le'
        ]
        read_only_fields = ['cree_le']