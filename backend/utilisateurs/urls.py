from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, MoiView, ListeUtilisateursView, 
    RegisterView, UpdateUtilisateurView,
    ChangerMotDePasseView, ResetMotDePasseView
)

urlpatterns = [
    path('login/',                   LoginView.as_view(),            name='login'),
    path('token/refresh/',           TokenRefreshView.as_view(),     name='token_refresh'),
    path('moi/',                     MoiView.as_view(),              name='moi'),
    path('utilisateurs/',            ListeUtilisateursView.as_view(),name='utilisateurs'),
    path('register/',                RegisterView.as_view(),         name='register'),
    path('utilisateurs/<int:pk>/',   UpdateUtilisateurView.as_view(),name='update_utilisateur'),
    path('changer-mot-de-passe/',    ChangerMotDePasseView.as_view(),name='changer_mdp'),
    path('reset-mot-de-passe/',      ResetMotDePasseView.as_view(),  name='reset_mdp'),
]