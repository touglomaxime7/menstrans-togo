from rest_framework import serializers
from .models import Dossier, Contrat, PieceContrat, DocumentContrat, ConteneurDetail, PIECES_REQUISES
from clients.serializers import ClientSerializer
from utilisateurs.serializers import UtilisateurSerializer


STATUT_LABELS = {
    'nouveau':            'Nouveau',
    'transit':            'Transit',
    'logistique_initial': 'Logistique - phase initiale',
    'passation':          'Passation',
    'logistique_final':   'Logistique - phase finale',
    'livraison':          'Livraison',
    'cloture':            'Clôturé',
    'archive':            'Archivé',
}


# ── CONTENEUR ──────────────────────────────────────────────────────────────────

class ConteneurDetailSerializer(serializers.ModelSerializer):
    type_conteneur_label = serializers.CharField(
        source='get_type_conteneur_display', read_only=True)

    class Meta:
        model  = ConteneurDetail
        fields = [
            'id', 'dossier', 'type_conteneur', 'type_conteneur_label',
            'nombre_conteneurs', 'type_marchandise',
            'poids_total_kg', 'volume_m3', 'numero_bl',
            'port_chargement', 'port_dechargement',
            'compagnie_maritime', 'observations',
            'cree_le', 'modifie_le',
        ]
        read_only_fields = ['dossier']


# ── DOSSIER ────────────────────────────────────────────────────────────────────

class DossierSerializer(serializers.ModelSerializer):
    client_nom   = serializers.CharField(source='client.nom', read_only=True)
    cree_par_nom = serializers.CharField(source='cree_par.nom_complet', read_only=True)
    statut_label = serializers.SerializerMethodField()
    conteneur    = ConteneurDetailSerializer(read_only=True)

    class Meta:
        model  = Dossier
        fields = [
            'id', 'numero_dossier', 'client', 'client_nom',
            'cree_par', 'cree_par_nom', 'type_transport',
            'statut', 'statut_label', 'classification', 'mode_sortie',
            'date_debut', 'date_fin', 'observations',
            'conteneur', 'cree_le', 'modifie_le',
        ]
        read_only_fields = ['numero_dossier', 'cree_par', 'date_debut']

    def get_statut_label(self, obj):
        return STATUT_LABELS.get(obj.statut, obj.statut)


class DossierDetailSerializer(DossierSerializer):
    client   = ClientSerializer(read_only=True)
    cree_par = UtilisateurSerializer(read_only=True)


# ── PIÈCES CONTRAT ─────────────────────────────────────────────────────────────

class PieceContratSerializer(serializers.ModelSerializer):
    libelle = serializers.SerializerMethodField()

    class Meta:
        model  = PieceContrat
        fields = ['id', 'contrat', 'code_piece', 'libelle', 'valide',
                  'observations', 'valide_le', 'valide_par']
        read_only_fields = ['contrat']

    def get_libelle(self, obj):
        return obj.get_code_piece_display()


# ── DOCUMENT CONTRAT ───────────────────────────────────────────────────────────

class DocumentContratSerializer(serializers.ModelSerializer):
    uploade_par_nom  = serializers.CharField(source='uploade_par.nom_complet', read_only=True)
    type_doc_label   = serializers.CharField(source='get_type_doc_display', read_only=True)
    fichier_url      = serializers.SerializerMethodField()

    class Meta:
        model  = DocumentContrat
        fields = [
            'id', 'contrat', 'nom', 'type_doc', 'type_doc_label',
            'fichier', 'fichier_url', 'taille_kb',
            'uploade_par', 'uploade_par_nom', 'uploade_le',
        ]
        read_only_fields = ['contrat', 'uploade_par', 'taille_kb']

    def get_fichier_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None


# ── CONTRAT ────────────────────────────────────────────────────────────────────

class ContratSerializer(serializers.ModelSerializer):
    pieces                = PieceContratSerializer(many=True, read_only=True)
    documents             = DocumentContratSerializer(many=True, read_only=True)
    avancement_pieces     = serializers.CharField(read_only=True)
    toutes_pieces_valides = serializers.BooleanField(read_only=True)
    est_signe             = serializers.BooleanField(read_only=True)
    dossier_numero        = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    client_nom            = serializers.CharField(source='dossier.client.nom', read_only=True)
    redige_par_nom        = serializers.CharField(source='redige_par.nom_complet', read_only=True)
    valide_par_nom        = serializers.CharField(source='valide_par.nom_complet',
                                                  read_only=True, allow_null=True)

    class Meta:
        model  = Contrat
        fields = [
            'id', 'numero_contrat', 'dossier', 'dossier_numero', 'client_nom',
            'redige_par', 'redige_par_nom', 'valide_par', 'valide_par_nom',
            'statut', 'objet', 'conditions',
            'date_signature', 'date_debut', 'date_fin',
            'signature_dg', 'signature_client',
            'signe_par_dg_le', 'signe_par_client_le', 'est_signe',
            'avancement_pieces', 'toutes_pieces_valides',
            'pieces', 'documents',
            'cree_le', 'modifie_le',
        ]
        read_only_fields = ['numero_contrat', 'redige_par', 'date_debut']