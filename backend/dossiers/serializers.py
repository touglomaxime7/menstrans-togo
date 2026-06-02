from rest_framework import serializers
from .models import Dossier
from clients.serializers import ClientSerializer
from utilisateurs.serializers import UtilisateurSerializer


# Libellés lisibles des statuts (affichés dans l'interface)
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


class DossierSerializer(serializers.ModelSerializer):
    client_nom    = serializers.CharField(source='client.nom', read_only=True)
    cree_par_nom  = serializers.CharField(source='cree_par.nom_complet', read_only=True)
    statut_label  = serializers.SerializerMethodField()

    class Meta:
        model  = Dossier
        fields = [
            'id', 'numero_dossier', 'client', 'client_nom',
            'cree_par', 'cree_par_nom', 'type_transport',
            'statut', 'statut_label', 'date_debut', 'date_fin',
            'observations', 'cree_le', 'modifie_le'
        ]
        read_only_fields = ['numero_dossier', 'cree_par', 'date_debut']

    def get_statut_label(self, obj):
        return STATUT_LABELS.get(obj.statut, obj.statut)


class DossierDetailSerializer(DossierSerializer):
    client = ClientSerializer(read_only=True)
    cree_par = UtilisateurSerializer(read_only=True)