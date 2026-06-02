from django.db import models

# Create your models here.
from django.db import models


class Client(models.Model):

    nom        = models.CharField(max_length=200)
    telephone  = models.CharField(max_length=30, blank=True)
    email      = models.EmailField(blank=True)
    adresse    = models.TextField(blank=True)
    ville      = models.CharField(max_length=100, default='Lomé')
    pays       = models.CharField(max_length=100, default='Togo')
    date_debut = models.DateField(auto_now_add=True)
    date_fin   = models.DateField(null=True, blank=True)
    cree_le    = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'clients'
        ordering     = ['nom']
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'

    def __str__(self):
        return self.nom