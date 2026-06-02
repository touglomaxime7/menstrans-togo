from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Client
        fields = [
            'id', 'nom', 'telephone', 'email',
            'adresse', 'ville', 'pays',
            'date_debut', 'date_fin', 'cree_le'
        ]