from django.db import models
from django.utils import timezone
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
    CLASSIFICATION_CHOICES = [
        ('standard',    'Standard'),
        ('urgent',      'Urgent'),
        ('vip',         'VIP'),
        ('contentieux', 'Contentieux'),
    ]
    MODE_SORTIE_CHOICES = [
        ('camion',        'Camion'),
        ('depotage',      'Dépotage'),
        ('terminal_pia',  'Terminal PIA'),
        ('terminal_togo', 'Terminal Togo'),
        ('terminal_bmh',  'Terminal BMH'),
        ('autre',         'Autre terminal'),
    ]

    numero_dossier = models.CharField(max_length=30, unique=True, blank=True)
    client         = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='dossiers')
    cree_par       = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name='dossiers_crees')
    type_transport = models.CharField(max_length=20, choices=TYPE_TRANSPORT)
    statut         = models.CharField(max_length=30, choices=STATUT_CHOICES, default='nouveau')
    classification = models.CharField(max_length=20, choices=CLASSIFICATION_CHOICES, default='standard')
    mode_sortie    = models.CharField(max_length=30, choices=MODE_SORTIE_CHOICES, null=True, blank=True)
    date_debut     = models.DateField(auto_now_add=True)
    date_fin       = models.DateField(null=True, blank=True)
    observations   = models.TextField(blank=True)
    cree_le        = models.DateTimeField(auto_now_add=True)
    modifie_le     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'dossiers'
        ordering     = ['-cree_le']
        verbose_name = 'Dossier'

    def __str__(self):
        return self.numero_dossier

    def duree_totale_jours(self):
        """Durée totale du dossier depuis sa création."""
        fin = self.date_fin or timezone.now().date()
        return (fin - self.date_debut).days

    def duree_par_utilisateur(self):
        """Retourne un dict {utilisateur: durée en jours} basé sur l'historique."""
        historique = self.historique.order_by('date_changement')
        resultats  = {}
        for i, entree in enumerate(historique):
            if entree.utilisateur:
                nom = entree.utilisateur.nom_complet
                if i + 1 < len(historique):
                    duree = (historique[i+1].date_changement - entree.date_changement).days
                else:
                    fin   = timezone.now()
                    duree = (fin - entree.date_changement).days
                if nom in resultats:
                    resultats[nom] += duree
                else:
                    resultats[nom]  = duree
        return resultats


# ── HISTORIQUE DOSSIER ─────────────────────────────────────────────────────────

class HistoriqueDossier(models.Model):
    dossier         = models.ForeignKey(Dossier, on_delete=models.CASCADE,
                                        related_name='historique')
    statut_avant    = models.CharField(max_length=30, blank=True)
    statut_apres    = models.CharField(max_length=30)
    utilisateur     = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL,
                                        null=True, blank=True,
                                        related_name='historique_dossiers')
    date_changement = models.DateTimeField(auto_now_add=True)
    commentaire     = models.TextField(blank=True)
    duree_jours     = models.IntegerField(default=0,
                                          help_text="Jours passés dans le statut précédent")

    class Meta:
        db_table     = 'historique_dossiers'
        ordering     = ['date_changement']
        verbose_name = 'Historique dossier'

    def __str__(self):
        return f"{self.dossier} : {self.statut_avant} → {self.statut_apres}"


# ── DETAILS CONTENEUR (transport maritime) ─────────────────────────────────────

class ConteneurDetail(models.Model):
    TYPE_CONTENEUR = [
        ('20_standard', "20' Standard"),
        ('40_standard', "40' Standard"),
        ('40_hc',       "40' High Cube"),
        ('20_frigo',    "20' Frigorifique"),
        ('40_frigo',    "40' Frigorifique"),
        ('open_top',    'Open Top'),
        ('flat_rack',   'Flat Rack'),
    ]

    dossier            = models.OneToOneField(Dossier, on_delete=models.CASCADE,
                                              related_name='conteneur', null=True, blank=True)
    type_conteneur     = models.CharField(max_length=30, choices=TYPE_CONTENEUR, blank=True)
    nombre_conteneurs  = models.PositiveIntegerField(default=1)
    type_marchandise   = models.CharField(max_length=200, blank=True)
    poids_total_kg     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    volume_m3          = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    numero_bl          = models.CharField(max_length=50, blank=True, verbose_name="N° B/L")
    port_chargement    = models.CharField(max_length=100, blank=True)
    port_dechargement  = models.CharField(max_length=100, blank=True)
    compagnie_maritime = models.CharField(max_length=100, blank=True)
    observations       = models.TextField(blank=True)
    cree_le            = models.DateTimeField(auto_now_add=True)
    modifie_le         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'conteneurs'
        verbose_name = 'Détail conteneur'

    def __str__(self):
        return f"{self.get_type_conteneur_display()} x{self.nombre_conteneurs} — {self.dossier}"


# ── PIÈCES REQUISES POUR UN CONTRAT ───────────────────────────────────────────

PIECES_REQUISES = [
    ('certificat_origine',  "Certificat d'origine"),
    ('facture_commerciale', 'Facture commerciale'),
    ('bordereau',           'Bordereau'),
    ('connaissement',       'Connaissement / Bill of Lading'),
    ('assurance_maritime',  "Ordre d'assurance maritime"),
]


# ── CONTRAT ────────────────────────────────────────────────────────────────────

class Contrat(models.Model):
    STATUT_CHOICES = [
        ('brouillon',  'Brouillon'),
        ('en_attente', 'En attente de validation'),
        ('valide',     'Validé'),
        ('resilie',    'Résilié'),
    ]

    dossier             = models.OneToOneField(Dossier, on_delete=models.CASCADE,
                                               related_name='contrat')
    numero_contrat      = models.CharField(max_length=30, unique=True, blank=True)
    redige_par          = models.ForeignKey(Utilisateur, on_delete=models.PROTECT,
                                            related_name='contrats_rediges')
    valide_par          = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL,
                                            null=True, blank=True,
                                            related_name='contrats_valides')
    statut              = models.CharField(max_length=20, choices=STATUT_CHOICES,
                                           default='brouillon')
    objet               = models.TextField(blank=True)
    conditions          = models.TextField(blank=True)
    date_signature      = models.DateField(null=True, blank=True)
    date_debut          = models.DateField(auto_now_add=True)
    date_fin            = models.DateField(null=True, blank=True)
    signature_dg        = models.TextField(blank=True, null=True)
    signature_client    = models.TextField(blank=True, null=True)
    signe_par_dg_le     = models.DateTimeField(null=True, blank=True)
    signe_par_client_le = models.DateTimeField(null=True, blank=True)
    cree_le             = models.DateTimeField(auto_now_add=True)
    modifie_le          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'contrats'
        ordering     = ['-cree_le']
        verbose_name = 'Contrat'

    def __str__(self):
        return self.numero_contrat

    @property
    def pieces_validees(self):
        return self.pieces.filter(valide=True).count()

    @property
    def total_pieces(self):
        return len(PIECES_REQUISES)

    @property
    def avancement_pieces(self):
        return f"{self.pieces_validees}/{self.total_pieces}"

    @property
    def toutes_pieces_valides(self):
        return self.pieces_validees == self.total_pieces

    @property
    def est_signe(self):
        return bool(self.signature_dg and self.signature_client)

    def save(self, *args, **kwargs):
        if not self.numero_contrat:
            annee = timezone.now().year
            mois  = timezone.now().month
            count = Contrat.objects.filter(
                numero_contrat__startswith=f'CONT-{annee}-{str(mois).zfill(2)}'
            ).count()
            self.numero_contrat = f'CONT-{annee}-{str(mois).zfill(2)}-{str(count+1).zfill(3)}'
        super().save(*args, **kwargs)


# ── DOCUMENT JOINT AU CONTRAT ──────────────────────────────────────────────────

class DocumentContrat(models.Model):
    TYPE_CHOICES = [
        ('contrat_signe', 'Contrat signé'),
        ('annexe',        'Annexe'),
        ('procuration',   'Procuration'),
        ('autre',         'Autre document'),
    ]

    contrat     = models.ForeignKey(Contrat, on_delete=models.CASCADE,
                                    related_name='documents')
    nom         = models.CharField(max_length=200)
    type_doc    = models.CharField(max_length=30, choices=TYPE_CHOICES, default='autre')
    fichier     = models.FileField(upload_to='contrats/documents/')
    taille_kb   = models.PositiveIntegerField(default=0)
    uploade_par = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    uploade_le  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'documents_contrat'
        ordering     = ['-uploade_le']
        verbose_name = 'Document de contrat'

    def __str__(self):
        return f"{self.nom} — {self.contrat.numero_contrat}"

    def save(self, *args, **kwargs):
        if self.fichier:
            self.taille_kb = self.fichier.size // 1024
        super().save(*args, **kwargs)


# ── PIÈCE DE CONTRAT ───────────────────────────────────────────────────────────

class PieceContrat(models.Model):
    contrat      = models.ForeignKey(Contrat, on_delete=models.CASCADE, related_name='pieces')
    code_piece   = models.CharField(max_length=50, choices=PIECES_REQUISES)
    valide       = models.BooleanField(default=False)
    observations = models.CharField(max_length=255, blank=True)
    valide_le    = models.DateTimeField(null=True, blank=True)
    valide_par   = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL,
                                     null=True, blank=True)

    class Meta:
        db_table        = 'pieces_contrat'
        unique_together = ('contrat', 'code_piece')
        verbose_name    = 'Pièce de contrat'

    def __str__(self):
        return f"{self.get_code_piece_display()} — {self.contrat.numero_contrat}"