from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):

    ROLES = [
        ('admin',          'Administrateur'),
        ('direction',      'Direction Générale'),
        ('assistant_directeur','Assistant Directeur'),
        ('transit',        'Service Transit'),
        ('passation',      'Service Passation'),
        ('logistique',     'Service Logistique'),
        ('caisse',         'Service Caisse'),
        ('comptabilite',   'Comptabilité'),
    ]

    nom        = models.CharField(max_length=100)
    prenom     = models.CharField(max_length=100)
    email      = models.EmailField(unique=True)
    role       = models.CharField(max_length=50, choices=ROLES, default='transit')
    actif      = models.BooleanField(default=True)
    date_debut = models.DateField(auto_now_add=True)
    date_fin   = models.DateField(null=True, blank=True)
    is_staff   = models.BooleanField(default=False)
    cree_le    = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    objects = UtilisateurManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']
    
    

    class Meta:
        db_table  = 'utilisateurs'
        ordering  = ['nom', 'prenom']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.get_role_display()})"

    @property
    def est_admin(self):
        return self.role in ('admin', 'direction')

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

    @property
    def peut_creer_dossier(self):
        return self.role in ('admin', 'direction', 'assistant_directeur')