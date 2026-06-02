\# MENSTRANS-TOGO



Application web de gestion du transit douanier et de la facturation, développée dans le cadre d'un mémoire de Licence Professionnelle en Développement d'Application (HEST, 2025-2026).



\## Stack technique



\- \*\*Backend\*\* : Django 5 + Django REST Framework + JWT

\- \*\*Frontend\*\* : React 18 + Vite + Tailwind CSS

\- \*\*Base de données\*\* : PostgreSQL 16



\## Installation locale



\### Backend

```bash

cd backend

python -m venv venv

venv\\Scripts\\activate

pip install -r requirements.txt

\# Créer un fichier .env à la racine du projet avec les variables nécessaires

python manage.py migrate

python manage.py runserver 8001

```



\### Frontend

```bash

cd frontend

npm install

\# Créer frontend/.env avec VITE\_API\_URL=http://127.0.0.1:8001/api

npm run dev

```



\## Modules



\- Gestion des dossiers de transit

\- Gestion documentaire (20 types, capture fichier/photo/caméra)

\- Service Transit (déclarations, études de valeur)

\- Direction (frais confidentiels)

\- Service Passation (validation physique)

\- Service Logistique (missions, suivi camions GPS)

\- Finance (caisse, comptabilité, bilans)



\## Auteur



Étudiant en Licence Pro Développement d'Application — HEST, Togo

Stage chez MENSTRANS-TOGO (2025-2026)

