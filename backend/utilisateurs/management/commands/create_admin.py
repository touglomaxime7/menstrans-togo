"""
Commande Django pour créer un compte admin si aucun n'existe.
Utile pour le déploiement sur des hébergeurs sans accès shell.
Les credentials sont lus depuis les variables d'environnement.
"""

import os
from django.core.management.base import BaseCommand
from utilisateurs.models import Utilisateur


class Command(BaseCommand):
    help = "Cree un compte admin si aucun n'existe (lit ADMIN_EMAIL et ADMIN_PASSWORD depuis l'environnement)"

    def handle(self, *args, **options):
        email    = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASSWORD')
        nom      = os.environ.get('ADMIN_NOM',    'Admin')
        prenom   = os.environ.get('ADMIN_PRENOM', 'MENSTRANS')

        if not email or not password:
            self.stdout.write(self.style.WARNING(
                "ADMIN_EMAIL ou ADMIN_PASSWORD non definis dans l'environnement, etape ignoree."
            ))
            return

        if Utilisateur.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(
                f"Le compte admin {email} existe deja, rien a faire."
            ))
            return

        Utilisateur.objects.create_superuser(
            email=email,
            password=password,
            nom=nom,
            prenom=prenom,
        )
        self.stdout.write(self.style.SUCCESS(
            f"Compte admin cree : {email}"
        ))