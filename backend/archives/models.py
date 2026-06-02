from django.db import models

# Create your models here.
from django.db import models
from dossiers.models import Dossier
from utilisateurs.models import Utilisateur


class Archive(models.Model):
    dossier               = models.OneToOneField(Dossier, on_delete=models.CASCADE, related_name='archive')
    date_debut            = models.DateField(auto_now_add=True)
    date_fin              = models.DateField(null=True, blank=True)
    reference_physique    = models.CharField(max_length=100, blank=True)
    emplacement_numerique = models.CharField(max_length=300, blank=True)
    archive_par           = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                              related_name='archives_creees')
    cree_le               = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'archives'
        ordering     = ['-date_debut']
        verbose_name = 'Archive'

    def __str__(self):
        return f"Archive — {self.dossier.numero_dossier}"