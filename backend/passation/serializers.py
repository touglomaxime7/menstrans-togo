from rest_framework import serializers
from .models import Passation


class PassationSerializer(serializers.ModelSerializer):
    dossier_numero  = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    traite_par_nom  = serializers.CharField(source='traite_par.nom_complet', read_only=True)
    statut_label    = serializers.CharField(source='get_statut_douane_display', read_only=True)

    class Meta:
        model  = Passation
        fields = [
            'id', 'dossier', 'dossier_numero',
            'statut_douane', 'statut_label',
            'date_debut', 'date_fin',
            'dossier_conforme', 'observations',
            'traite_par', 'traite_par_nom',
            'cree_le', 'modifie_le'
        ]
        read_only_fields = ['traite_par', 'cree_le']