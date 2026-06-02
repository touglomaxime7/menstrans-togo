from django.db import models

# Create your models here.
from django.db import models
from dossiers.models import Dossier
from utilisateurs.models import Utilisateur


class Montant(models.Model):

    TYPES = [
        ('banque',          'Banque'),
        ('dfu',             'DFU'),
        ('manutention',     'Manutention'),
        ('douane',          'Douane'),
        ('transport',       'Transport'),
        ('consignataire',   'Consignataire'),
        ('honoraires',      'Honoraires'),
        ('frais_portuaires','Frais portuaires'),
        ('frais_transit',   'Frais de transit'),
        ('remboursement',   'Remboursement'),
        ('autre',           'Autre'),
    ]

    MODES_PAIEMENT = [
        ('especes',      'Espèces'),
        ('virement',     'Virement'),
        ('cheque',       'Chèque'),
        ('mobile_money', 'Mobile Money'),
    ]

    STATUTS = [
        ('paye',       'Payé'),
        ('en_attente', 'En attente'),
        ('annule',     'Annulé'),
    ]

    dossier            = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='montants')
    type_montant       = models.CharField(max_length=40, choices=TYPES)
    libelle            = models.CharField(max_length=200)
    montant_debours    = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_facture    = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    mode_paiement      = models.CharField(max_length=20, choices=MODES_PAIEMENT, default='especes')
    reference_paiement = models.CharField(max_length=100, blank=True)
    date_debut         = models.DateField(auto_now_add=True)
    date_fin           = models.DateField(null=True, blank=True)
    statut_paiement    = models.CharField(max_length=20, choices=STATUTS, default='paye')
    enregistre_par     = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                           related_name='montants_enregistres')
    cree_le            = models.DateTimeField(auto_now_add=True)
    modifie_le         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'montants'
        ordering     = ['-date_debut']
        verbose_name = 'Montant'

    def __str__(self):
        return f"{self.libelle} — {self.dossier.numero_dossier}"

    @property
    def montant_total(self):
        return self.montant_debours + self.montant_facture


class Facture(models.Model):

    TYPES = [
        ('emise', 'Émise'),
        ('recue', 'Reçue'),
    ]

    STATUTS = [
        ('en_attente', 'En attente'),
        ('payee',      'Payée'),
        ('annulee',    'Annulée'),
    ]

    dossier        = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='factures')
    numero_facture = models.CharField(max_length=50, unique=True, blank=True)
    type_facture   = models.CharField(max_length=20, choices=TYPES)
    emetteur       = models.CharField(max_length=200, blank=True)
    montant_ht     = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tva            = models.DecimalField(max_digits=5,  decimal_places=2, default=18.00)
    statut         = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    date_debut     = models.DateField(auto_now_add=True)
    date_fin       = models.DateField(null=True, blank=True)
    enregistre_par = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                       related_name='factures_enregistrees')
    cree_le        = models.DateTimeField(auto_now_add=True)
    modifie_le     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'factures'
        ordering     = ['-date_debut']
        verbose_name = 'Facture'

    def __str__(self):
        return f"{self.numero_facture} — {self.dossier.numero_dossier}"

    @property
    def montant_ttc(self):
        return self.montant_ht + (self.montant_ht * self.tva / 100)

    def save(self, *args, **kwargs):
        if not self.numero_facture:
            from django.utils import timezone
            annee = timezone.now().year
            mois  = timezone.now().month
            count = Facture.objects.filter(
                numero_facture__startswith=f'FACT-{annee}-{str(mois).zfill(2)}'
            ).count()
            self.numero_facture = f'FACT-{annee}-{str(mois).zfill(2)}-{str(count+1).zfill(3)}'
        super().save(*args, **kwargs)