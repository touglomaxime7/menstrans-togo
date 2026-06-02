from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display  = ('email', 'nom', 'prenom', 'role', 'actif', 'date_debut')
    list_filter   = ('role', 'actif')
    search_fields = ('email', 'nom', 'prenom')
    ordering      = ('nom',)

    fieldsets = (
        ('Connexion',     {'fields': ('email', 'password')}),
        ('Informations',  {'fields': ('nom', 'prenom', 'role')}),
        ('Statut',        {'fields': ('actif', 'is_staff', 'is_superuser', 'date_debut', 'date_fin')}),
        ('Permissions',   {'fields': ('groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nom', 'prenom', 'role', 'password1', 'password2'),
        }),
    )