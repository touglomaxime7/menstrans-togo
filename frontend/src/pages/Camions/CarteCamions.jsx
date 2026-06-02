import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function CarteCamions() {
  const [camions, setCamions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamion, setSelectedCamion] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/camions/');
      setCamions(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const camionsEnMission = camions.filter(c => 
    c.statut === 'en_mission' && c.derniere_position_lat && c.derniere_position_lng
  );

  const camionsEnMissionSansGPS = camions.filter(c => 
    c.statut === 'en_mission' && (!c.derniere_position_lat || !c.derniere_position_lng)
  );

  // Construire l'URL OpenStreetMap avec markers
  const buildMapUrl = () => {
    if (camionsEnMission.length === 0) {
      return 'https://www.openstreetmap.org/export/embed.html?bbox=1.0%2C6.0%2C1.4%2C6.3&layer=mapnik';
    }
    
    const lats = camionsEnMission.map(c => parseFloat(c.derniere_position_lat));
    const lngs = camionsEnMission.map(c => parseFloat(c.derniere_position_lng));
    
    const minLat = Math.min(...lats) - 0.05;
    const maxLat = Math.max(...lats) + 0.05;
    const minLng = Math.min(...lngs) - 0.05;
    const maxLng = Math.max(...lngs) + 0.05;
    
    const marker = camionsEnMission[0];
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${marker.derniere_position_lat}%2C${marker.derniere_position_lng}`;
  };

  return (
    <Layout title="Carte des Camions" subtitle="Suivi GPS en temps réel">
      <div className="flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-1">Camions en mission</div>
            <div className="text-2xl font-medium text-blue-700">
              {camions.filter(c => c.statut === 'en_mission').length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-1">Avec position GPS</div>
            <div className="text-2xl font-medium text-green-700">{camionsEnMission.length}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-1">Sans position GPS</div>
            <div className="text-2xl font-medium text-amber-700">{camionsEnMissionSansGPS.length}</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs text-blue-700">
            🔄 Carte actualisée automatiquement toutes les 30 secondes
          </span>
        </div>

        {/* Carte OpenStreetMap intégrée */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">🗺️ Localisation en temps réel</span>
            <span className="text-[10px] text-gray-400">{camionsEnMission.length} camion(s) géolocalisé(s)</span>
          </div>
          <div style={{ height: '500px', width: '100%' }}>
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Chargement de la carte...
              </div>
            ) : (
              <iframe
                src={buildMapUrl()}
                style={{ width: '100%', height: '100%', border: 0 }}
                title="Carte des camions"
              />
            )}
          </div>
        </div>

        {/* Cartes des camions */}
        {camionsEnMission.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {camionsEnMission.map((c) => (
              <div key={c.id} className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-base font-bold text-blue-900">🚛 {c.immatriculation}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.nom_chauffeur}</div>
                    <div className="text-[10px] text-gray-400">{c.telephone_chauffeur}</div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps?q=${c.derniere_position_lat},${c.derniere_position_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-3 bg-blue-600 text-white rounded text-[10px] font-medium hover:bg-blue-700 flex items-center"
                  >
                    📍 Voir sur Maps
                  </a>
                </div>
                
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">📦</span>
                    <span className="text-gray-700 font-medium flex-1">{c.marchandise_transportee || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">📍</span>
                    <span className="text-blue-700 font-medium flex-1">{c.position_actuelle}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">🎯</span>
                    <span className="text-gray-700 flex-1">Destination : {c.destination_actuelle || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">🌍</span>
                    <span className="text-gray-500 font-mono text-[10px] flex-1">
                      {c.derniere_position_lat}, {c.derniere_position_lng}
                    </span>
                  </div>
                  {c.dossier_num && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">📋</span>
                      <span className="text-purple-700 font-medium flex-1">{c.dossier_num} - {c.dossier_client}</span>
                    </div>
                  )}
                  {c.derniere_mise_a_jour && (
                    <div className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-2">
                      🕐 Dernière MAJ : {new Date(c.derniere_mise_a_jour).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Camions sans GPS */}
        {camionsEnMissionSansGPS.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-sm font-medium text-amber-800 mb-2">
              ⚠️ Camions en mission sans position GPS ({camionsEnMissionSansGPS.length})
            </div>
            <div className="flex flex-col gap-2">
              {camionsEnMissionSansGPS.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-white rounded p-2 border border-amber-100">
                  <div>
                    <span className="text-xs font-medium text-gray-800">{c.immatriculation}</span>
                    <span className="text-[10px] text-gray-500 ml-2">— {c.nom_chauffeur}</span>
                  </div>
                  <span className="text-[10px] text-amber-700">
                    {c.position_actuelle || 'Position non renseignée'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}