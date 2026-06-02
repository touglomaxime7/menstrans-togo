import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

export default function MonCamion() {
  const navigate = useNavigate();
  const { utilisateur, handleLogout } = useAuth();
  const [camion, setCamion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [positions, setPositions] = useState([]);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchCamion = async () => {
    try {
      const res = await api.get('/camions/mon_camion/');
      setCamion(res.data);
      
      // Charger l'historique des positions
      const posRes = await api.get(`/camions/${res.data.id}/positions/`);
      setPositions(posRes.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Aucun camion ne vous est assigné');
      } else {
        toast.error('Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCamion(); }, []);

  // Géolocalisation automatique
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur');
      return;
    }

    setTracking(true);
    toast.success('🛰️ Suivi GPS activé');

    // Envoyer la position toutes les 30 secondes
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, speed } = position.coords;
          
          // Obtenir le nom du lieu via reverse geocoding (OpenStreetMap Nominatim)
          let positionText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`
            );
            const geoData = await geoRes.json();
            if (geoData.display_name) {
              // Prendre seulement les parties importantes (rue + ville)
              const parts = geoData.display_name.split(',');
              positionText = parts.slice(0, 3).join(',').trim();
            }
          } catch {
            // Si erreur, garder les coordonnées
          }

          try {
            await api.post(`/camions/${camion.id}/mettre_a_jour_position/`, {
              position: positionText,
              latitude: latitude,
              longitude: longitude,
              vitesse: speed ? (speed * 3.6).toFixed(2) : null, // m/s vers km/h
            });
            setLastPosition({
              position: positionText,
              latitude, longitude,
              time: new Date(),
            });
            // Recharger l'historique
            const posRes = await api.get(`/camions/${camion.id}/positions/`);
            setPositions(posRes.data);
          } catch {
            // Erreur silencieuse pour éviter les notifications répétées
          }
        },
        (error) => {
          console.error('Erreur GPS:', error);
          if (error.code === 1) {
            toast.error('Vous devez autoriser la géolocalisation');
            stopTracking();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }, 30000); // Toutes les 30 secondes

    // Première position immédiate
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, speed } = position.coords;
        
        let positionText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`
          );
          const geoData = await geoRes.json();
          if (geoData.display_name) {
            const parts = geoData.display_name.split(',');
            positionText = parts.slice(0, 3).join(',').trim();
          }
        } catch {}

        try {
          await api.post(`/camions/${camion.id}/mettre_a_jour_position/`, {
            position: positionText,
            latitude: latitude,
            longitude: longitude,
            vitesse: speed ? (speed * 3.6).toFixed(2) : null,
          });
          setLastPosition({
            position: positionText,
            latitude, longitude,
            time: new Date(),
          });
        } catch {}
      },
      (error) => {
        if (error.code === 1) {
          toast.error('Vous devez autoriser la géolocalisation');
          stopTracking();
        }
      },
      { enableHighAccuracy: true }
    );
  };

  const stopTracking = () => {
    setTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    toast.info('🛑 Suivi GPS désactivé');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleTerminerMission = async () => {
    if (!window.confirm('Confirmer la fin de la mission ?')) return;
    try {
      await api.post(`/camions/${camion.id}/terminer_mission/`);
      toast.success('Mission terminée !');
      stopTracking();
      fetchCamion();
    } catch {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!camion) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex flex-col">
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🚛</div>
          <h2 className="text-lg font-medium text-gray-800 mb-2">Aucun camion assigné</h2>
          <p className="text-sm text-gray-500 mb-4">
            Vous n'avez pas de camion qui vous est assigné pour le moment.
          </p>
          <button onClick={handleLogout}
            className="h-9 px-4 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#1F3864] text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-200">Bienvenue</div>
            <div className="text-sm font-medium">{utilisateur?.prenom} {utilisateur?.nom}</div>
          </div>
          <button onClick={handleLogout}
            className="h-8 px-3 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700">
            Déconnexion
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto">
        
        {/* Carte du camion */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-blue-900">🚛 {camion.immatriculation}</div>
              <div className="text-sm text-gray-500 mt-1">{camion.marque} {camion.modele}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              camion.statut === 'en_mission' ? 'bg-blue-100 text-blue-800' :
              camion.statut === 'disponible' ? 'bg-green-100 text-green-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {camion.statut_label}
            </span>
          </div>

          {camion.statut === 'en_mission' && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mt-3">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📦</span>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Marchandise</div>
                    <div className="text-gray-700 font-medium">{camion.marchandise_transportee}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">🎯</span>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Destination</div>
                    <div className="text-gray-700 font-medium">{camion.destination_actuelle}</div>
                  </div>
                </div>
                {camion.dossier_num && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">📋</span>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">Dossier</div>
                      <div className="text-purple-700 font-medium">{camion.dossier_num} - {camion.dossier_client}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bouton GPS */}
        {camion.statut === 'en_mission' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-800 mb-3">📍 Suivi GPS</div>
            
            {tracking ? (
              <>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">Suivi GPS actif</span>
                  </div>
                  <div className="text-[10px] text-green-600 mt-1">
                    Position envoyée toutes les 30 secondes
                  </div>
                </div>
                
                {lastPosition && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                    <div className="text-[10px] text-gray-400 uppercase mb-1">Dernière position</div>
                    <div className="text-xs text-gray-700">{lastPosition.position}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      🕐 {lastPosition.time.toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                )}
                
                <button onClick={stopTracking}
                  className="w-full h-12 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                  ⏸️ Arrêter le suivi GPS
                </button>
              </>
            ) : (
              <button onClick={startTracking}
                className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md">
                ▶️ Démarrer le suivi GPS
              </button>
            )}
          </div>
        )}

        {/* Bouton terminer */}
        {camion.statut === 'en_mission' && (
          <button onClick={handleTerminerMission}
            className="w-full h-12 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 shadow-md">
            ✓ Mission terminée
          </button>
        )}

        {/* Historique des positions */}
        {positions.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-800 mb-3">📜 Historique récent</div>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {positions.slice(0, 20).map((p, idx) => (
                <div key={p.id} className="flex gap-2 pb-2 border-b border-gray-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1 ${idx === 0 ? 'bg-green-500' : 'bg-blue-400'}`} />
                  <div className="flex-1">
                    <div className="text-xs text-gray-700">{p.position_text}</div>
                    {p.vitesse && (
                      <div className="text-[10px] text-gray-500">🚀 {p.vitesse} km/h</div>
                    )}
                    <div className="text-[10px] text-gray-400">
                      {new Date(p.date_position).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}