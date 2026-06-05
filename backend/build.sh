#!/usr/bin/env bash
# Script de build exécuté par Render à chaque déploiement
# Exit immédiatement en cas d'erreur
set -o errexit

# 1. Installer les paquets Python listés dans requirements.txt
pip install -r requirements.txt

# 2. Collecter les fichiers statiques de Django dans STATIC_ROOT (servi par WhiteNoise)
python manage.py collectstatic --no-input

# 3. Appliquer les migrations à la base PostgreSQL distante
python manage.py migrate