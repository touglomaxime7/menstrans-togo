from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Camion, PositionCamion
from .serializers import CamionSerializer, PositionCamionSerializer


class CamionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = CamionSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['statut', 'type_camion']
    search_fields      = ['immatriculation', 'marque', 'modele', 'nom_chauffeur']

    def get_queryset(self):
        return Camion.objects.select_related('dossier_actuel', 'dossier_actuel__client', 'chauffeur').all()

    def create(self, request, *args, **kwargs):
        if not (request.user.est_admin or request.user.role == 'logistique'):
            return Response({'error': 'Accès refusé'}, status=403)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        camions = Camion.objects.filter(statut='disponible')
        serializer = CamionSerializer(camions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def en_mission(self, request):
        camions = Camion.objects.filter(statut='en_mission').select_related('dossier_actuel', 'dossier_actuel__client')
        serializer = CamionSerializer(camions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response({
            'total':           Camion.objects.count(),
            'disponibles':     Camion.objects.filter(statut='disponible').count(),
            'en_mission':      Camion.objects.filter(statut='en_mission').count(),
            'en_maintenance':  Camion.objects.filter(statut='en_maintenance').count(),
        })

    @action(detail=False, methods=['get'])
    def mon_camion(self, request):
        """Récupérer le camion assigné au chauffeur connecté"""
        camion = Camion.objects.filter(chauffeur=request.user).first()
        if not camion:
            return Response({'error': 'Aucun camion assigné'}, status=404)
        serializer = CamionSerializer(camion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        camion = self.get_object()
        nouveau_statut = request.data.get('statut')
        if nouveau_statut not in ['disponible', 'en_mission', 'en_maintenance', 'indisponible']:
            return Response({'error': 'Statut invalide'}, status=400)
        camion.statut = nouveau_statut
        camion.save()
        return Response({'message': 'Statut mis à jour'})

    @action(detail=True, methods=['post'])
    def affecter_mission(self, request, pk=None):
        """Affecter un camion à un dossier avec marchandise et destination"""
        camion = self.get_object()
        dossier_id    = request.data.get('dossier_id')
        marchandise   = request.data.get('marchandise', '')
        destination   = request.data.get('destination', '')
        
        if not dossier_id:
            return Response({'error': 'Dossier requis'}, status=400)
        
        from dossiers.models import Dossier
        try:
            dossier = Dossier.objects.get(id=dossier_id)
        except Dossier.DoesNotExist:
            return Response({'error': 'Dossier introuvable'}, status=404)
        
        camion.dossier_actuel = dossier
        camion.marchandise_transportee = marchandise
        camion.destination_actuelle = destination
        camion.statut = 'en_mission'
        camion.position_actuelle = 'Au dépôt'
        camion.derniere_mise_a_jour = timezone.now()
        camion.save()
        
        PositionCamion.objects.create(
            camion=camion,
            dossier=dossier,
            position_text='Au dépôt - Départ de mission'
        )
        
        return Response({'message': 'Camion affecté à la mission'})

    @action(detail=True, methods=['post'])
    def mettre_a_jour_position(self, request, pk=None):
        """Mettre à jour la position du camion"""
        camion = self.get_object()
        position    = request.data.get('position', '')
        latitude    = request.data.get('latitude')
        longitude   = request.data.get('longitude')
        vitesse     = request.data.get('vitesse')
        
        if not position:
            return Response({'error': 'Position requise'}, status=400)
        
        camion.position_actuelle = position
        if latitude:
            camion.derniere_position_lat = latitude
        if longitude:
            camion.derniere_position_lng = longitude
        camion.derniere_mise_a_jour = timezone.now()
        camion.save()
        
        PositionCamion.objects.create(
            camion=camion,
            dossier=camion.dossier_actuel,
            latitude=latitude,
            longitude=longitude,
            position_text=position,
            vitesse=vitesse
        )
        
        return Response({'message': 'Position mise à jour', 'position': position})

    @action(detail=True, methods=['post'])
    def terminer_mission(self, request, pk=None):
        """Terminer la mission du camion"""
        camion = self.get_object()
        camion.dossier_actuel = None
        camion.marchandise_transportee = ''
        camion.destination_actuelle = ''
        camion.position_actuelle = 'Au dépôt'
        camion.statut = 'disponible'
        camion.derniere_mise_a_jour = timezone.now()
        camion.save()
        return Response({'message': 'Mission terminée, camion disponible'})

    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        """Récupérer l'historique des positions du camion"""
        camion = self.get_object()
        positions = camion.positions.all()[:50]
        serializer = PositionCamionSerializer(positions, many=True)
        return Response(serializer.data)