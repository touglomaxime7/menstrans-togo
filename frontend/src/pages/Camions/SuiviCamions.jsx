import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const BADGE_STATUT = {
  disponible:     'bg-green-100 text-green-700',
  en_mission:     'bg-blue-100 text-blue-700',
  en_maintenance: 'bg-amber-100 text-amber-700',
  indisponible:   'bg-red-100 text-red-700',
};

export default function SuiviCamions() {
  const [camions,    setCamions]    = useState([]);
  const [dossiers,   setDossiers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAffectModal, setShowAffectModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [positions, setPositions] = useState([]);

  const [affectForm, setAffectForm] = useState({
    dossier_id: '', marchandise: '', destination: ''
  });
  const [positionForm, setPositionForm] = useState({
    position: '', latitude: '', longitude: '', vitesse: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [camRes, dosRes] = await Promise.all([
        api.get('/camions/'),
        api.get('/dossiers/'),
      ]);
      setCamions(camRes.data.results || camRes.data);
      setDossiers(dosRes.data.results || dosRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAffecter = async (e) => {
    e.preventDefault();
    if (!affectForm.dossier_id || !affectForm.marchandise || !affectForm.destination) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    try {
      await api.post(`/camions/${selectedCamion.id}/affecter_mission/`, affectForm);
      toast.success('Camion affecté à la mission !');
      setShowAffectModal(false);
      setAffectForm({ dossier_id: '', marchandise: '', destination: '' });
      fetchData();
    } catch {
      toast.error('Erreur lors de l\'affectation');
    }
  };

  const handleMettreAJourPosition = async (e) => {
    e.preventDefault();
    if (!positionForm.position) {
      toast.error('Veuillez saisir la position');
      return;
    }
    try {
      await api.post(`/camions/${selectedCamion.id}/mettre_a_jour_position/`, positionForm);
      toast.success('Position mise à jour !');
      setShowPositionModal(false);
      setPositionForm({ position: '', latitude: '', longitude: '', vitesse: '' });
      fetchData();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleTerminerMission = async (camion) => {
    if (!window.confirm(`Terminer la mission du camion ${camion.immatriculation} ?`)) return;
    try {
      await api.post(`/camions/${camion.id}/terminer_mission/`);
      toast.success('Mission terminée !');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleVoirHistorique = async (camion) => {
    try {
      const res = await api.get(`/camions/${camion.id}/positions/`);
      setPositions(res.data);
      setSelectedCamion(camion);
      setShowHistoriqueModal(true);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  const openAffectModal = (camion) => {
    setSelectedCamion(camion);
    setShowAffectModal(true);
  };

  const openPositionModal = (camion) => {
    setSelectedCamion(camion);
    setShowPositionModal(true);
  };

  const dossiersEnLivraison = dossiers.filter(d =>
    ['logistique', 'livraison'].includes(d.statut)
  );

  return (
    <Layout title="Suivi des Camions" subtitle="Position et mission en temps réel">
      <div className="flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',          value: camions.length, bg: 'bg-gray-50', color: 'text-gray-700' },
            { label: 'En mission',     value: camions.filter(c => c.statut === 'en_mission').length, bg: 'bg-blue-50', color: 'text-blue-700' },
            { label: 'Disponibles',    value: camions.filter(c => c.statut === 'disponible').length, bg: 'bg-green-50', color: 'text-green-700' },
            { label: 'En maintenance', value: camions.filter(c => c.statut === 'en_maintenance').length, bg: 'bg-amber-50', color: 'text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 border border-gray-200`}>
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Info auto-refresh */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs text-blue-700">
            🔄 Actualisation automatique toutes les 30 secondes
          </span>
        </div>

        {/* Camions en mission */}
        {camions.filter(c => c.statut === 'en_mission').length > 0 && (
          <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <span className="text-sm font-medium text-blue-800">🚛 Camions en mission</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3">
              {camions.filter(c => c.statut === 'en_mission').map((c) => (
                <div key={c.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-blue-900">{c.immatriculation}</div>
                      <div className="text-[10px] text-blue-600">{c.nom_chauffeur} • {c.telephone_chauffeur}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_STATUT[c.statut]}`}>
                      {c.statut_label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📦</span>
                      <span className="text-gray-700 font-medium">{c.marchandise_transportee || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📍</span>
                      <span className="text-blue-700 font-medium">{c.position_actuelle || 'Position inconnue'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🎯</span>
                      <span className="text-gray-700">Destination : {c.destination_actuelle || 'N/A'}</span>
                    </div>
                    {c.dossier_num && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📋</span>
                        <span className="text-purple-700 font-medium">{c.dossier_num} - {c.dossier_client}</span>
                      </div>
                    )}
                    {c.derniere_mise_a_jour && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        Dernière MAJ : {new Date(c.derniere_mise_a_jour).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 mt-3">
                    <button onClick={() => openPositionModal(c)}
                      className="flex-1 h-7 bg-blue-600 text-white rounded text-[10px] font-medium hover:bg-blue-700">
                      📍 MAJ Position
                    </button>
                    <button onClick={() => handleVoirHistorique(c)}
                      className="flex-1 h-7 bg-gray-100 text-gray-700 rounded text-[10px] font-medium hover:bg-gray-200">
                      📜 Historique
                    </button>
                    <button onClick={() => handleTerminerMission(c)}
                      className="flex-1 h-7 bg-green-600 text-white rounded text-[10px] font-medium hover:bg-green-700">
                      ✓ Terminer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tous les camions */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Tous les camions</span>
            <span className="text-[10px] text-gray-400">{camions.length} camion(s)</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : camions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun camion</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Immat.</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Chauffeur</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Mission</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Position</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {camions.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-blue-600">{c.immatriculation}</td>
                    <td className="px-3 py-2 text-gray-700">{c.nom_chauffeur || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_STATUT[c.statut]}`}>
                        {c.statut_label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {c.dossier_num ? `${c.dossier_num} - ${c.marchandise_transportee}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-blue-700 font-medium">{c.position_actuelle || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {c.statut === 'disponible' && (
                          <button onClick={() => openAffectModal(c)}
                            className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                            🚛 Affecter
                          </button>
                        )}
                        <button onClick={() => handleVoirHistorique(c)}
                          className="h-6 px-2 bg-gray-50 text-gray-700 rounded text-[10px] border border-gray-200 hover:bg-gray-100">
                          📜 Historique
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Affecter */}
      {showAffectModal && selectedCamion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                Affecter le camion {selectedCamion.immatriculation}
              </span>
              <button onClick={() => setShowAffectModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAffecter} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier *</label>
                <select value={affectForm.dossier_id} onChange={(e) => setAffectForm({...affectForm, dossier_id: e.target.value})}
                  className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                  <option value="">Sélectionner...</option>
                  {dossiersEnLivraison.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero_dossier} — {d.client_nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Marchandise transportée *</label>
                <textarea value={affectForm.marchandise} onChange={(e) => setAffectForm({...affectForm, marchandise: e.target.value})}
                  placeholder="ex: 50 cartons de matériel électronique"
                  className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-400 h-16 resize-none"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Destination *</label>
                <input value={affectForm.destination} onChange={(e) => setAffectForm({...affectForm, destination: e.target.value})}
                  placeholder="ex: Entrepôt Lomé Zone Industrielle"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAffectModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Affecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Position */}
      {showPositionModal && selectedCamion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                Mettre à jour la position - {selectedCamion.immatriculation}
              </span>
              <button onClick={() => setShowPositionModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleMettreAJourPosition} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Position actuelle *</label>
                <input value={positionForm.position} onChange={(e) => setPositionForm({...positionForm, position: e.target.value})}
                  placeholder="ex: Sur la route nationale 1, près d'Aného"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Latitude</label>
                  <input type="number" step="0.0000001" value={positionForm.latitude}
                    onChange={(e) => setPositionForm({...positionForm, latitude: e.target.value})}
                    placeholder="ex: 6.1375"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Longitude</label>
                  <input type="number" step="0.0000001" value={positionForm.longitude}
                    onChange={(e) => setPositionForm({...positionForm, longitude: e.target.value})}
                    placeholder="ex: 1.2120"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Vitesse (km/h)</label>
                <input type="number" step="0.01" value={positionForm.vitesse}
                  onChange={(e) => setPositionForm({...positionForm, vitesse: e.target.value})}
                  placeholder="ex: 65"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPositionModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showHistoriqueModal && selectedCamion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[600px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                Historique - {selectedCamion.immatriculation}
              </span>
              <button onClick={() => setShowHistoriqueModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 max-h-[500px] overflow-y-auto">
              {positions.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">Aucune position enregistrée</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {positions.map((p, idx) => (
                    <div key={p.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? 'bg-green-500' : 'bg-blue-400'}`} />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-800">📍 {p.position_text}</div>
                        {p.latitude && p.longitude && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            🌍 {p.latitude}, {p.longitude}
                          </div>
                        )}
                        {p.vitesse && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            🚀 Vitesse : {p.vitesse} km/h
                          </div>
                        )}
                        {p.dossier_num && (
                          <div className="text-[10px] text-purple-600 mt-0.5">
                            📋 {p.dossier_num}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(p.date_position).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}