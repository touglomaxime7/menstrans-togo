from django.db import models

# Create your models here.
from django.db import models
from utilisateurs.models import Utilisateur
from clients.models import Client


class Dossier(models.Model):
    TYPE_TRANSPORT = [
        ('maritime',  'Maritime'),
        ('aerien',    'Aérien'),
        ('terrestre', 'Terrestre'),
    ]
    STATUT_CHOICES = [
        ('nouveau',             'Nouveau'),
        ('transit',             'Transit'),
        ('logistique_initial',  'Logistique - phase initiale'),
        ('passation',           'Passation'),
        ('logistique_final',    'Logistique - phase finale'),
        ('livraison',           'Livraison'),
        ('cloture',             'Clôture'),
        ('archive',             'Archive'),
    ]
    numero_dossier  = models.CharField(max_length=30, unique=True, blank=True)
    client          = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='dossiers')
    cree_par        = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name='dossiers_crees')
    type_transport  = models.CharField(max_length=20, choices=TYPE_TRANSPORT)
    statut          = models.CharField(max_length=30, choices=STATUT_CHOICES, default='nouveau')
    date_debut      = models.DateField(auto_now_add=True)
    date_fin        = models.DateField(null=True, blank=True)
    observations    = models.TextField(blank=True)
    cree_le         = models.DateTimeField(auto_now_add=True)
    modifie_le      = models.DateTimeField(auto_now=True)