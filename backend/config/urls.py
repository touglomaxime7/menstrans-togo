from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',          admin.site.urls),
    path('api/auth/',       include('utilisateurs.urls')),
    path('api/clients/',    include('clients.urls')),
    path('api/dossiers/',   include('dossiers.urls')),
    path('api/transit/',    include('transit.urls')),
    path('api/camions/',    include('camions.urls')),
    path('api/passation/',  include('passation.urls')),
    path('api/logistique/', include('logistique.urls')),
    path('api/finance/',    include('finance.urls')),
    path('api/archives/',   include('archives.urls')),
    path('api/',            include('documents.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)