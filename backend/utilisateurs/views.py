from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Utilisateur
from .serializers import UtilisateurSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, username=email, password=password)

        if not user:
            return Response(
                {'error': 'Email ou mot de passe incorrect'},
                status=400
            )

        if not user.actif:
            return Response(
                {'error': 'Compte désactivé'},
                status=403
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':      str(refresh.access_token),
            'refresh':     str(refresh),
            'utilisateur': UtilisateurSerializer(user).data
        })


class MoiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)


class ListeUtilisateursView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Tous les utilisateurs authentifiés peuvent voir la liste
        # (nécessaire pour le workflow d'envoi de documents)
        utilisateurs = Utilisateur.objects.filter(actif=True)
        serializer = UtilisateurSerializer(utilisateurs, many=True)
        return Response(serializer.data)

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny

class RegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.est_admin:
            return Response({'error': 'Accès refusé'}, status=403)
        
        from django.contrib.auth.hashers import make_password
        
        data = request.data.copy()
        # Hash le mot de passe
        if 'password' in data:
            data['password'] = make_password(data['password'])
        
        # Créer l'utilisateur
        try:
            utilisateur = Utilisateur.objects.create(
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                email=data.get('email'),
                password=data['password'],
                role=data.get('role', 'transit'),
                actif=data.get('actif', True),
            )
            serializer = UtilisateurSerializer(utilisateur)
            return Response(serializer.data, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class UpdateUtilisateurView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.est_admin:
            return Response({'error': 'Accès refusé'}, status=403)
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=404)
        for field in ['nom', 'prenom', 'role', 'actif']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UtilisateurSerializer(user).data)
class ChangerMotDePasseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ancien = request.data.get('ancien_password')
        nouveau = request.data.get('nouveau_password')
        
        if not ancien or not nouveau:
            return Response({'error': 'Ancien et nouveau mot de passe requis'}, status=400)
        
        # Vérifier l'ancien mot de passe
        from django.contrib.auth.hashers import check_password, make_password
        if not check_password(ancien, request.user.password):
            return Response({'error': 'Ancien mot de passe incorrect'}, status=400)
        
        # Valider le nouveau mot de passe
        import re
        if len(nouveau) < 8:
            return Response({'error': 'Le mot de passe doit faire au moins 8 caractères'}, status=400)
        if not re.search(r'[A-Z]', nouveau):
            return Response({'error': 'Le mot de passe doit contenir une majuscule'}, status=400)
        if not re.search(r'[a-z]', nouveau):
            return Response({'error': 'Le mot de passe doit contenir une minuscule'}, status=400)
        if not re.search(r'[0-9]', nouveau):
            return Response({'error': 'Le mot de passe doit contenir un chiffre'}, status=400)
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', nouveau):
            return Response({'error': 'Le mot de passe doit contenir un caractère spécial'}, status=400)
        
        # Mettre à jour
        request.user.password = make_password(nouveau)
        request.user.save()
        
        return Response({'message': 'Mot de passe mis à jour avec succès'})


class ResetMotDePasseView(APIView):
    """Admin uniquement : réinitialiser le mot de passe d'un autre utilisateur"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.est_admin:
            return Response({'error': 'Accès refusé'}, status=403)
        
        utilisateur_id = request.data.get('utilisateur_id')
        nouveau = request.data.get('nouveau_password')
        
        if not utilisateur_id or not nouveau:
            return Response({'error': 'Utilisateur et nouveau mot de passe requis'}, status=400)
        
        from django.contrib.auth.hashers import make_password
        import re
        
        if len(nouveau) < 8:
            return Response({'error': 'Au moins 8 caractères'}, status=400)
        if not re.search(r'[A-Z]', nouveau):
            return Response({'error': 'Une majuscule requise'}, status=400)
        if not re.search(r'[a-z]', nouveau):
            return Response({'error': 'Une minuscule requise'}, status=400)
        if not re.search(r'[0-9]', nouveau):
            return Response({'error': 'Un chiffre requis'}, status=400)
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', nouveau):
            return Response({'error': 'Un caractère spécial requis'}, status=400)
        
        try:
            user = Utilisateur.objects.get(pk=utilisateur_id)
            user.password = make_password(nouveau)
            user.save()
            return Response({'message': f'Mot de passe réinitialisé pour {user.email}'})
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)