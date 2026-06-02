from rest_framework import serializers
from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model  = Utilisateur
        fields = [
            'id', 'nom', 'prenom', 'email',
            'role', 'actif', 'date_debut',
            'date_fin', 'nom_complet', 'cree_le'
        ]


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)