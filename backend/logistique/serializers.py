from rest_framework import serializers
from .models import Logistique, Livraison
from camions.serializers import CamionSerializer


class LivraisonSerializer(serializers.ModelSerializer):
    zone_label   = serializers.CharField(source='get_zone_livraison_display', read_only=True)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model  = Livraison
        fields = [
            'id', 'logistique', 'zone_livraison', 'zone_label',
            'magasin_destination', 'localite', 'ville', 'pays',
            'adresse_complete', 'date_debut', 'date_fin',
            'duree_livraison_heures', 'statut', 'statut_label',
            'observations', 'enregistre_par', 'cree_le'
        ]
        read_only_fields = ['duree_livraison_heures', 'enregistre_par', 'cree_le']


class LogistiqueSerializer(serializers.ModelSerializer):
    dossier_numero  = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    client_nom      = serializers.CharField(source='dossier.client.nom',     read_only=True)
    traite_par_nom  = serializers.CharField(source='traite_par.nom_complet', read_only=True)
    camion_detail   = CamionSerializer(source='camion', read_only=True)
    livraisons      = LivraisonSerializer(many=True, read_only=True)
    terminal_label  = serializers.CharField(source='get_terminal_display',   read_only=True)

    class Meta:
        model  = Logistique
        fields = [
            'id', 'dossier', 'dossier_numero', 'client_nom',
            'terminal', 'terminal_label',
            'montant_dfu', 'dfu_paye', 'date_paiement_dfu',
            'type_bon', 'bon_recupere', 'date_recuperation_bon',
            'camion', 'camion_detail',
            'date_debut', 'date_fin',
            'traite_par', 'traite_par_nom',
            'livraisons', 'cree_le', 'modifie_le'
        ]
        read_only_fields = ['traite_par', 'cree_le']