from django.db import models
from dossiers.models import Dossier
from utilisateurs.models import Utilisateur


class Document(models.Model):
    TYPES = [
        # Anciens types
        ('bordereau',           'Bordereau'),
        ('manifeste',           'Manifeste'),
        ('facture_commerciale', 'Facture commerciale'),
        ('certificat_origine',  'Certificat d\'origine'),
        ('liste_colisage',      'Liste de colisage'),
        ('bon_livraison',       'Bon de livraison'),
        # Nouveaux types
        ('besc',                'BESC (Bordereau Électronique de Suivi des Cargaisons)'),
        ('connaissement',       'Connaissement / Bill of Lading (OBL)'),
        ('awb_lta',             'AWB / LTA (Lettre de Transport Aérien)'),
        ('cmr',                 'CMR / Lettre de voiture'),
        ('declaration_export',  'Déclaration d\'exportation'),
        ('autorisation_import', 'Autorisation d\'importation'),
        ('assurance_maritime',  'Ordre d\'assurance maritime'),
        ('booking',             'Booking (export)'),
        ('certificat_sanitaire','Certificat sanitaire'),
        ('facture',             'Facture'),
        ('bae',                 'BAE (Bon À Enlever)'),
        ('bad',                 'BAD (Bon À Délivrer)'),
        ('dfu',                 'DFU (Droit de Fret Unique)'),
        ('autre',               'Autre'),
    ]

    STATUTS = [
        ('en_attente',   'En attente'),
        ('en_traitement','En traitement'),
        ('valide',       'Validé'),
        ('rejete',       'Rejeté'),
        ('archive',      'Archivé'),
    ]

    code_document     = models.CharField(max_length=50, unique=True, blank=True)
    dossier           = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='documents')
    type_document     = models.CharField(max_length=50, choices=TYPES)
    nom_fichier       = models.CharField(max_length=255)
    chemin_fichier    = models.CharField(max_length=500)
    taille_fichier    = models.IntegerField(null=True, blank=True)
    nombre_pages      = models.IntegerField(null=True, blank=True)
    statut            = models.CharField(max_length=30, choices=STATUTS, default='en_attente')
    assigne_a         = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='documents_assignes')
    scanne_par        = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='documents_scannes')
    date_scan         = models.DateTimeField(auto_now_add=True)
    date_debut        = models.DateField(auto_now_add=True)
    date_fin          = models.DateField(null=True, blank=True)
    observations      = models.TextField(blank=True)
    donnees_extraites = models.JSONField(null=True, blank=True)
    cree_le           = models.DateTimeField(auto_now_add=True)
    modifie_le        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'documents'
        ordering     = ['-date_scan']
        verbose_name = 'Document'

    def __str__(self):
        return f"{self.code_document} — {self.nom_fichier}"


class HistoriqueDocument(models.Model):
    document       = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='historique')
    utilisateur    = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    action         = models.CharField(max_length=100)
    details        = models.TextField(blank=True)
    ancien_statut  = models.CharField(max_length=30, blank=True)
    nouveau_statut = models.CharField(max_length=30, blank=True)
    date_action    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'historique_documents'
        ordering     = ['-date_action']
        verbose_name = 'Historique Document'

    def __str__(self):
        return f"{self.action} — {self.document.code_document}"


class Notification(models.Model):
    TYPES = [
        ('nouveau_document',  'Nouveau document'),
        ('document_assigne',  'Document assigné'),
        ('action_requise',    'Action requise'),
        ('document_valide',   'Document validé'),
        ('document_rejete',   'Document rejeté'),
    ]

    utilisateur       = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='notifications')
    document          = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    dossier           = models.ForeignKey(Dossier, on_delete=models.CASCADE, null=True, blank=True)
    type_notification = models.CharField(max_length=50, choices=TYPES)
    titre             = models.CharField(max_length=255)
    message           = models.TextField(blank=True)
    lue               = models.BooleanField(default=False)
    date_lecture      = models.DateTimeField(null=True, blank=True)
    cree_le           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'notifications'
        ordering     = ['-cree_le']
        verbose_name = 'Notification'

    def __str__(self):
        return f"{self.titre} — {self.utilisateur.nom_complet}"