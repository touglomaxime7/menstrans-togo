from django.db import models

# Create your models here.
from django.db import models
from dossiers.models import Dossier
from utilisateurs.models import Utilisateur


class EtudeValeur(models.Model):
    dossier           = models.OneToOneField(Dossier, on_delete=models.CASCADE, related_name='etude_valeur')
    droit_taxe_douane = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    frais_transit     = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    frais_manutention = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    frais_portuaires  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    autres_frais      = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    approuve_client   = models.BooleanField(default=False)
    date_debut        = models.DateField(null=True, blank=True)
    date_fin          = models.DateField(null=True, blank=True)
    approuve_par      = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='etudes_approuvees')
    cree_le           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'etudes_valeur'
        verbose_name = 'Étude de valeur'

    def __str__(self):
        return f"Étude — {self.dossier.numero_dossier}"

    @property
    def total(self):
        return (
            self.droit_taxe_douane +
            self.frais_transit +
            self.frais_manutention +
            self.frais_portuaires +
            self.autres_frais
        )


class DeclarationDouane(models.Model):

    STATUTS = [
        ('en_cours', 'En cours'),
        ('soumise',  'Soumise'),
        ('validee',  'Validée'),
        ('rejetee',  'Rejetée'),
    ]

    dossier            = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='declarations')
    numero_declaration = models.CharField(max_length=50, unique=True, blank=True, null=True)
    date_debut         = models.DateField(null=True, blank=True)
    date_fin           = models.DateField(null=True, blank=True)
    nom_navire         = models.CharField(max_length=150, blank=True)
    port_arrivee       = models.CharField(max_length=100, default='Port de Lomé')
    dtd_montant        = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    autres_frais       = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    statut             = models.CharField(max_length=30, choices=STATUTS, default='en_cours')
    saisi_par          = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                           related_name='declarations_saisies')
    valide_par         = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='declarations_validees')
    cree_le            = models.DateTimeField(auto_now_add=True)
    modifie_le         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'declarations_douane'
        ordering     = ['-cree_le']
        verbose_name = 'Déclaration douanière'

    def __str__(self):
        return f"{self.numero_declaration or 'Sans numéro'} — {self.dossier.numero_dossier}"

    @property
    def total_valeur(self):
        return self.dtd_montant + self.autres_frais