from django.db import models

# Create your models here.
from django.db import models
from dossiers.models import Dossier
from utilisateurs.models import Utilisateur


class Passation(models.Model):

    STATUTS_DOUANE = [
        ('en_attente', 'En attente'),
        ('confirme',   'Confirmé'),
        ('infirme',    'Infirmé'),
    ]

    dossier          = models.OneToOneField(Dossier, on_delete=models.CASCADE, related_name='passation')
    statut_douane    = models.CharField(max_length=20, choices=STATUTS_DOUANE, default='en_attente')
    date_debut       = models.DateField(null=True, blank=True)
    date_fin         = models.DateField(null=True, blank=True)
    dossier_conforme = models.BooleanField(default=False)
    observations     = models.TextField(blank=True)
    traite_par       = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                         related_name='passations_traitees')
    cree_le          = models.DateTimeField(auto_now_add=True)
    modifie_le       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'passation'
        ordering     = ['-date_debut']
        verbose_name = 'Passation'

    def __str__(self):
        return f"Passation — {self.dossier.numero_dossier}"