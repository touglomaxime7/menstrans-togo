from rest_framework import serializers
from .models import Montant, Facture


class MontantSerializer(serializers.ModelSerializer):
    montant_total    = serializers.ReadOnlyField()
    type_label       = serializers.CharField(source='get_type_montant_display',  read_only=True)
    mode_label       = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    statut_label     = serializers.CharField(source='get_statut_paiement_display', read_only=True)
    dossier_numero   = serializers.CharField(source='dossier.numero_dossier',    read_only=True)
    enregistre_par_nom = serializers.CharField(source='enregistre_par.nom_complet', read_only=True)

    class Meta:
        model  = Montant
        fields = [
            'id', 'dossier', 'dossier_numero',
            'type_montant', 'type_label', 'libelle',
            'montant_debours', 'montant_facture', 'montant_total',
            'mode_paiement', 'mode_label',
            'reference_paiement', 'date_debut', 'date_fin',
            'statut_paiement', 'statut_label',
            'enregistre_par', 'enregistre_par_nom', 'cree_le'
        ]
        read_only_fields = ['montant_total', 'enregistre_par', 'date_debut', 'cree_le']


class FactureSerializer(serializers.ModelSerializer):
    montant_ttc      = serializers.ReadOnlyField()
    type_label       = serializers.CharField(source='get_type_facture_display', read_only=True)
    statut_label     = serializers.CharField(source='get_statut_display',       read_only=True)
    dossier_numero   = serializers.CharField(source='dossier.numero_dossier',   read_only=True)
    enregistre_par_nom = serializers.CharField(source='enregistre_par.nom_complet', read_only=True)

    class Meta:
        model  = Facture
        fields = [
            'id', 'dossier', 'dossier_numero',
            'numero_facture', 'type_facture', 'type_label',
            'emetteur', 'montant_ht', 'tva', 'montant_ttc',
            'statut', 'statut_label',
            'date_debut', 'date_fin',
            'enregistre_par', 'enregistre_par_nom', 'cree_le'
        ]
        read_only_fields = ['numero_facture', 'montant_ttc', 'enregistre_par', 'cree_le']