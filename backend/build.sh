#!/usr/bin/env bash
# Script de build execute par Render a chaque deploiement
set -o errexit

# 1. Installer les paquets Python
pip install -r requirements.txt

# 2. Collecter les fichiers statiques
python manage.py collectstatic --no-input

# 3. Appliquer les migrations
python manage.py migrate

# 4. Creer le compte admin si necessaire (lit ADMIN_EMAIL / ADMIN_PASSWORD depuis l'env)
python manage.py create_admin