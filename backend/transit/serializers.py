from rest_framework import serializers
from .models import EtudeValeur, DeclarationDouane


class EtudeValeurSerializer(serializers.ModelSerializer):
    total = serializers.ReadOnlyField()
    dossier_numero = serializers.CharField(source='dossier.numero_dossier', read_only=True)

    class Meta:
        model  = EtudeValeur
        fields = [
            'id', 'dossier', 'dossier_numero',
            'droit_taxe_douane', 'frais_transit',
            'frais_manutention', 'frais_portuaires', 'autres_frais',
            'total', 'approuve_client', 'date_debut', 'date_fin',
            'approuve_par', 'cree_le'
        ]
        read_only_fields = ['total', 'cree_le']

    def to_representation(self, instance):
        """
        Filtrage de confidentialité des montants.
        Seuls les rôles 'admin' et 'direction' voient les frais confidentiels.
        Pour tous les autres rôles, ces champs sont remplacés par null.
        """
        data = super().to_representation(instance)

        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            est_autorise = user.est_admin or user.role == 'direction'

            if not est_autorise:
                # Masquer les frais confidentiels et le total
                data['frais_transit']     = None
                data['frais_manutention'] = None
                data['frais_portuaires']  = None
                data['autres_frais']      = None
                data['total']             = None

        return data


class DeclarationDouaneSerializer(serializers.ModelSerializer):
    total_valeur     = serializers.ReadOnlyField()
    dossier_numero   = serializers.CharField(source='dossier.numero_dossier', read_only=True)
    saisi_par_nom    = serializers.CharField(source='saisi_par.nom_complet',  read_only=True)

    class Meta:
        model  = DeclarationDouane
        fields = [
            'id', 'dossier', 'dossier_numero', 'numero_declaration',
            'date_debut', 'date_fin', 'nom_navire', 'port_arrivee',
            'dtd_montant', 'autres_frais', 'total_valeur',
            'statut', 'saisi_par', 'saisi_par_nom',
            'valide_par', 'cree_le', 'modifie_le'
        ]
        read_only_fields = ['total_valeur', 'saisi_par', 'cree_le']