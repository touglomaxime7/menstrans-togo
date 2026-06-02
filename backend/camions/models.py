from django.db import models
from dossiers.models import Dossier


class Camion(models.Model):
    TYPES = [
        ('porteur',       'Porteur'),
        ('semi_remorque', 'Semi-remorque'),
        ('plateau',       'Plateau'),
        ('frigorifique',  'Frigorifique'),
        ('citerne',       'Citerne'),
        ('autre',         'Autre'),
    ]

    STATUTS = [
        ('disponible',     'Disponible'),
        ('en_mission',     'En mission'),
        ('en_maintenance', 'En maintenance'),
        ('indisponible',   'Indisponible'),
    ]

    immatriculation       = models.CharField(max_length=20, unique=True)
    marque                = models.CharField(max_length=50, blank=True)
    modele                = models.CharField(max_length=50, blank=True)
    type_camion           = models.CharField(max_length=30, choices=TYPES, default='porteur')
    capacite_tonnes       = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    nom_chauffeur         = models.CharField(max_length=100, blank=True)
    telephone_chauffeur   = models.CharField(max_length=20, blank=True)
    chauffeur             = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, blank=True, related_name='camion_assigne')
    statut                = models.CharField(max_length=20, choices=STATUTS, default='disponible')
    notes                 = models.TextField(blank=True)
    
    # Suivi de mission
    dossier_actuel        = models.ForeignKey(Dossier, on_delete=models.SET_NULL, null=True, blank=True,
                                              related_name='camions_affectes')
    marchandise_transportee = models.TextField(blank=True)
    destination_actuelle  = models.CharField(max_length=200, blank=True)
    position_actuelle     = models.CharField(max_length=200, blank=True)
    derniere_position_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    derniere_position_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    derniere_mise_a_jour  = models.DateTimeField(null=True, blank=True)
    
    cree_le               = models.DateTimeField(auto_now_add=True)
    modifie_le            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'camions'
        ordering     = ['immatriculation']
        verbose_name = 'Camion'

    def __str__(self):
        return f"{self.immatriculation} — {self.marque} {self.modele}"

    @property
    def type_label(self):
        return dict(self.TYPES).get(self.type_camion, self.type_camion)

    @property
    def statut_label(self):
        return dict(self.STATUTS).get(self.statut, self.statut)


class PositionCamion(models.Model):
    camion        = models.ForeignKey(Camion, on_delete=models.CASCADE, related_name='positions')
    dossier       = models.ForeignKey(Dossier, on_delete=models.SET_NULL, null=True, blank=True)
    latitude      = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude     = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    position_text = models.CharField(max_length=200, blank=True)
    vitesse       = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    date_position = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'positions_camions'
        ordering     = ['-date_position']
        verbose_name = 'Position Camion'

    def __str__(self):
        return f"{self.camion.immatriculation} — {self.position_text}"