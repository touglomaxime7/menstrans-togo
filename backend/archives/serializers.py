from rest_framework import serializers
from .models import Archive


class ArchiveSerializer(serializers.ModelSerializer):
    dossier_numero  = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    archive_par_nom = serializers.CharField(source='archive_par.nom_complet', read_only=True)

    class Meta:
        model  = Archive
        fields = [
            'id', 'dossier', 'dossier_numero',
            'date_debut', 'date_fin',
            'reference_physique', 'emplacement_numerique',
            'archive_par', 'archive_par_nom', 'cree_le'
        ]
        read_only_fields = ['archive_par', 'date_debut', 'cree_le']