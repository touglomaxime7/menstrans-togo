from rest_framework import serializers
from .models import Camion, PositionCamion


class PositionCamionSerializer(serializers.ModelSerializer):
    camion_immat = serializers.CharField(source='camion.immatriculation', read_only=True)
    dossier_num  = serializers.CharField(source='dossier.numero_dossier', read_only=True)

    class Meta:
        model  = PositionCamion
        fields = ['id', 'camion', 'camion_immat', 'dossier', 'dossier_num',
                  'latitude', 'longitude', 'position_text', 'vitesse', 'date_position']
        read_only_fields = ['date_position']


class CamionSerializer(serializers.ModelSerializer):
    type_label     = serializers.CharField(read_only=True)
    statut_label   = serializers.CharField(read_only=True)
    dossier_num    = serializers.CharField(source='dossier_actuel.numero_dossier', read_only=True)
    dossier_client = serializers.CharField(source='dossier_actuel.client.nom', read_only=True)
    chauffeur_nom  = serializers.CharField(source='chauffeur.nom_complet', read_only=True)

    class Meta:
        model  = Camion
        fields = [
            'id', 'immatriculation', 'marque', 'modele',
            'type_camion', 'type_label',
            'capacite_tonnes', 'nom_chauffeur', 'telephone_chauffeur',
            'chauffeur', 'chauffeur_nom',
            'statut', 'statut_label', 'notes',
            'dossier_actuel', 'dossier_num', 'dossier_client',
            'marchandise_transportee', 'destination_actuelle',
            'position_actuelle', 'derniere_position_lat', 'derniere_position_lng',
            'derniere_mise_a_jour',
            'cree_le', 'modifie_le'
        ]