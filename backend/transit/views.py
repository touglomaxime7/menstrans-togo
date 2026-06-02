from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import EtudeValeur, DeclarationDouane
from .serializers import EtudeValeurSerializer, DeclarationDouaneSerializer
from dossiers.models import Dossier


# Champs financiers confidentiels — réservés à la Direction et à l'Admin
CHAMPS_CONFIDENTIELS = [
    'frais_transit',
    'frais_manutention',
    'frais_portuaires',
    'autres_frais',
]


def _est_direction_ou_admin(user):
    return user.est_admin or user.role == 'direction'


class EtudeValeurViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = EtudeValeurSerializer

    def get_queryset(self):
        user = self.request.user
        if user.est_admin or user.role == 'direction':
            return EtudeValeur.objects.select_related('dossier', 'approuve_par')
        return EtudeValeur.objects.filter(
            dossier__statut__in=[
                'transit', 'logistique_initial', 'passation',
                'logistique_final', 'livraison', 'cloture'
            ]
        ).select_related('dossier', 'approuve_par')

    def perform_create(self, serializer):
        """
        À la création, on filtre les champs confidentiels :
        seuls la Direction et l'Admin peuvent les renseigner directement.
        Pour les autres rôles, ces champs sont forcés à 0.
        """
        user = self.request.user
        if not _est_direction_ou_admin(user):
            # On force les frais confidentiels à 0 pour le Service Transit
            extra = {champ: 0 for champ in CHAMPS_CONFIDENTIELS}
            serializer.save(**extra)
        else:
            serializer.save()

    def perform_update(self, serializer):
        """
        En modification, on protège également les champs confidentiels.
        Si un utilisateur non autorisé tente de modifier les frais,
        on rétablit les anciennes valeurs.
        """
        user = self.request.user
        if not _est_direction_ou_admin(user):
            # Récupérer l'instance actuelle pour préserver les anciens montants
            instance = self.get_object()
            extra = {champ: getattr(instance, champ) for champ in CHAMPS_CONFIDENTIELS}
            serializer.save(**extra)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def completer(self, request, pk=None):
        """
        Action réservée à la Direction : compléter les frais confidentiels
        d'une étude de valeur après la saisie initiale du DTD par le Transit.
        """
        if not _est_direction_ou_admin(request.user):
            return Response(
                {'erreur': "Action réservée à la Direction."},
                status=403
            )

        etude = self.get_object()
        donnees = request.data

        # Mettre à jour uniquement les champs confidentiels fournis
        for champ in CHAMPS_CONFIDENTIELS:
            if champ in donnees:
                try:
                    setattr(etude, champ, float(donnees[champ]))
                except (ValueError, TypeError):
                    return Response(
                        {'erreur': f"Valeur invalide pour {champ}."},
                        status=400
                    )

        etude.save()
        return Response({'message': 'Étude complétée avec succès'})

    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        etude = self.get_object()
        etude.approuve_client = True
        etude.date_fin        = timezone.now().date()
        etude.approuve_par    = request.user
        etude.save()
        # Mettre à jour le statut du dossier
        dossier = etude.dossier
        dossier.statut = 'transit'
        dossier.save()
        return Response({'message': 'Étude de valeur approuvée'})


class DeclarationDouaneViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = DeclarationDouaneSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['statut', 'dossier']
    search_fields      = ['numero_declaration', 'nom_navire', 'dossier__numero_dossier']

    def get_queryset(self):
        user  = self.request.user
        today = timezone.now().date()

        # Filtre date — aujourd'hui par défaut
        date_debut = self.request.query_params.get('date_debut', str(today))
        date_fin   = self.request.query_params.get('date_fin',   str(today))

        if user.est_admin:
            queryset = DeclarationDouane.objects.select_related('dossier', 'saisi_par')
        elif user.role == 'transit':
            queryset = DeclarationDouane.objects.filter(
                saisi_par=user
            ).select_related('dossier', 'saisi_par')
        else:
            queryset = DeclarationDouane.objects.none()

        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_debut__lte=date_fin)

        return queryset

    def perform_create(self, serializer):
        serializer.save(saisi_par=self.request.user)

    @action(detail=True, methods=['post'])
    def soumettre(self, request, pk=None):
        declaration = self.get_object()
        declaration.statut = 'soumise'
        declaration.save()
        return Response({'message': 'Déclaration soumise avec succès'})

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        if not request.user.est_admin:
            return Response({'error': 'Accès refusé'}, status=403)
        declaration            = self.get_object()
        declaration.statut     = 'validee'
        declaration.date_fin   = timezone.now().date()
        declaration.valide_par = request.user
        declaration.save()
        # Transmettre le dossier au Logistique pour la phase initiale
        dossier        = declaration.dossier
        dossier.statut = 'logistique_initial'
        dossier.save()
        return Response({'message': 'Déclaration validée — dossier transmis au Logistique (phase initiale)'})

    @action(detail=False, methods=['get'])
    def aujourd_hui(self, request):
        today    = timezone.now().date()
        queryset = self.get_queryset().filter(date_debut=today)
        serializer = DeclarationDouaneSerializer(queryset, many=True)
        return Response(serializer.data)