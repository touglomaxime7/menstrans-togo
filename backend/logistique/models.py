from django.db import models

# Create your models here.
from django.db import models
from dossiers.models import Dossier
from utilisateurs.models import Utilisateur
from camions.models import Camion


class Logistique(models.Model):

    TERMINAUX = [
        ('T.TL',  'Port 1 — Terminal T.TL'),
        ('LCT',   'Port 2 — Terminal LCT'),
        ('autre', 'Autre terminal'),
    ]

    TYPES_BON = [
        ('BAD',              'Bon à Délivrer (BAD)'),
        ('BAD_manutention',  'BAD Manutention'),
        ('appointement_LCT', 'Appointement LCT'),
        ('autre',            'Autre'),
    ]

    dossier               = models.OneToOneField(Dossier, on_delete=models.CASCADE, related_name='logistique')
    terminal              = models.CharField(max_length=20, choices=TERMINAUX, blank=True)
    montant_dfu           = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    dfu_paye              = models.BooleanField(default=False)
    date_paiement_dfu     = models.DateField(null=True, blank=True)
    type_bon              = models.CharField(max_length=30, choices=TYPES_BON, blank=True)
    bon_recupere          = models.BooleanField(default=False)
    date_recuperation_bon = models.DateField(null=True, blank=True)
    camion                = models.ForeignKey(Camion, on_delete=models.SET_NULL,
                                              null=True, blank=True, related_name='missions')
    date_debut            = models.DateField(null=True, blank=True)
    date_fin              = models.DateField(null=True, blank=True)
    traite_par            = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                              related_name='logistiques_traitees')
    cree_le               = models.DateTimeField(auto_now_add=True)
    modifie_le            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'logistique'
        ordering     = ['-date_debut']
        verbose_name = 'Logistique'

    def __str__(self):
        return f"Logistique — {self.dossier.numero_dossier}"


class Livraison(models.Model):

    ZONES = [
        ('lome',      'Lomé'),
        ('hors_lome', 'Hors Lomé (Togo)'),
        ('hors_togo', 'Hors Togo'),
    ]

    STATUTS = [
        ('en_cours', 'En cours'),
        ('livre',    'Livré'),
        ('echoue',   'Échoué'),
    ]

    logistique              = models.ForeignKey(Logistique, on_delete=models.CASCADE, related_name='livraisons')
    zone_livraison          = models.CharField(max_length=20, choices=ZONES)
    magasin_destination     = models.CharField(max_length=200, blank=True)
    localite                = models.CharField(max_length=100, blank=True)
    ville                   = models.CharField(max_length=100, blank=True)
    pays                    = models.CharField(max_length=100, blank=True)
    adresse_complete        = models.TextField(blank=True)
    date_debut              = models.DateField(null=True, blank=True)
    date_fin                = models.DateField(null=True, blank=True)
    duree_livraison_heures  = models.IntegerField(null=True, blank=True)
    statut                  = models.CharField(max_length=20, choices=STATUTS, default='en_cours')
    observations            = models.TextField(blank=True)
    enregistre_par          = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                                related_name='livraisons_enregistrees')
    cree_le                 = models.DateTimeField(auto_now_add=True)
    modifie_le              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'livraisons'
        ordering     = ['-date_debut']
        verbose_name = 'Livraison'

    def __str__(self):
        return f"Livraison — {self.logistique.dossier.numero_dossier}"

    def save(self, *args, **kwargs):
        # Calcul automatique de la durée en heures
        if self.date_debut and self.date_fin:
            delta = self.date_fin - self.date_debut
            self.duree_livraison_heures = delta.days * 24
        super().save(*args, **kwargs)