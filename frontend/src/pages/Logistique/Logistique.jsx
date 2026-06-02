import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ZONES = {
  lome:      'Lomé',
  hors_lome: 'Hors Lomé',
  hors_togo: 'Hors Togo',
};

const BADGE_PHASE = {
  logistique_initial: { label: 'Phase initiale', cls: 'bg-amber-100 text-amber-800' },
  passation:          { label: 'Chez Passation', cls: 'bg-purple-100 text-purple-800' },
  logistique_final:   { label: 'Phase finale',   cls: 'bg-blue-100 text-blue-800' },
  livraison:          { label: 'En livraison',   cls: 'bg-green-100 text-green-800' },
  cloture:            { label: 'Clôturé',        cls: 'bg-gray-200 text-gray-700' },
};

export default function Logistique() {
  const [missions,   setMissions]   = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [camions,    setCamions]    = useState([]);
  const [dossiers,   setDossiers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('missions');
  const [showModal,  setShowModal]  = useState(false);
  const [showLivModal, setShowLivModal] = useState(false);
  const [form, setForm] = useState({
    dossier: '', terminal: '', montant_dfu: 0,
    type_bon: '', camion: '',
    date_debut: new Date().toISOString().split('T')[0],
  });
  const [livForm, setLivForm] = useState({
    logistique: '', zone_livraison: 'lome',
    magasin_destination: '', localite: '', ville: '', pays: '',
    date_debut: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      // On récupère les dossiers des deux phases logistiques pour la création de missions
      const [misRes, livRes, camRes, dosInitRes, dosFinRes] = await Promise.all([
        api.get('/logistique/missions/',   { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/logistique/livraisons/', { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/camions/disponibles/'),
        api.get('/dossiers/', { params: { statut: 'logistique_initial' } }),
        api.get('/dossiers/', { params: { statut: 'logistique_final' } }),
      ]);
      setMissions(misRes.data.results   || misRes.data);
      setLivraisons(livRes.data.results || livRes.data);
      setCamions(camRes.data.results    || camRes.data);
      const dosInit = dosInitRes.data.results || dosInitRes.data;
      const dosFin  = dosFinRes.data.results  || dosFinRes.data;
      setDossiers([...dosInit, ...dosFin]);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const validerMission = () => {
    const erreurs = [];
    if (!form.dossier)              erreurs.push('Le dossier');
    if (!form.terminal)             erreurs.push('Le terminal');
    if (form.montant_dfu === '' || form.montant_dfu === null) erreurs.push('Le montant DFU');
    if (!form.type_bon)             erreurs.push('Le type de bon');
    if (!form.camion)               erreurs.push('Le camion');
    if (!form.date_debut)           erreurs.push('La date de début');
    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    return true;
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();
    if (!validerMission()) return;
    try {
      await api.post('/logistique/missions/', {
        ...form,
        camion: form.camion || null,
        montant_dfu: parseFloat(form.montant_dfu),
      });
      toast.success('Mission logistique créée !');
      setShowModal(false);
      fetchData();
    } catch { toast.error('Erreur lors de la création'); }
  };

  const validerLivraison = () => {
    const erreurs = [];
    if (!livForm.logistique)         erreurs.push('La mission');
    if (!livForm.zone_livraison)     erreurs.push('La zone');
    if (!livForm.date_debut)         erreurs.push('La date de départ');
    if (livForm.zone_livraison === 'lome' && !livForm.magasin_destination.trim())
      erreurs.push('Le magasin');
    if (livForm.zone_livraison === 'hors_lome' && !livForm.localite)
      erreurs.push('La localité');
    if (livForm.zone_livraison === 'hors_togo') {
      if (!livForm.pays)         erreurs.push('Le pays');
      if (!livForm.ville.trim()) erreurs.push('La ville');
    }
    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    return true;
  };

  const handleCreateLivraison = async (e) => {
    e.preventDefault();
    if (!validerLivraison()) return;
    try {
      await api.post('/logistique/livraisons/', livForm);
      toast.success('Livraison enregistrée !');
      setShowLivModal(false);
      fetchData();
    } catch { toast.error('Erreur lors de la création'); }
  };

  const handlePayerDFU = async (id) => {
    try {
      await api.post(`/logistique/missions/${id}/payer_dfu/`);
      toast.success('DFU payé !');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  // Nouvelle action : envoie le dossier à la Passation
  const handleEnvoyerPassation = async (id) => {
    try {
      const res = await api.post(`/logistique/missions/${id}/envoyer_passation/`);
      toast.success(res.data.message || 'Dossier envoyé à la Passation');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur');
    }
  };

  const handleCloturer = async (id) => {
    try {
      const res = await api.post(`/logistique/missions/${id}/cloturer/`);
      toast.success(res.data.message || 'Logistique clôturée !');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur');
    }
  };

  const handleConfirmerLivraison = async (id) => {
    try {
      await api.post(`/logistique/livraisons/${id}/confirmer_livraison/`);
      toast.success('Livraison confirmée — dossier clôturé !');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  return (
    <Layout title="Service Logistique" subtitle="Gestion des missions et livraisons">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button onClick={() => setActiveTab('missions')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium ${activeTab === 'missions' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              Missions
            </button>
            <button onClick={() => setActiveTab('livraisons')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium ${activeTab === 'livraisons' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              Livraisons
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowLivModal(true)}
              className="h-8 px-3 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50">
              + Nouvelle livraison
            </button>
            <button onClick={() => setShowModal(true)}
              className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
              + Nouvelle mission
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : activeTab === 'missions' ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-800">Missions logistiques</span>
              <span className="text-[10px] text-gray-400">{missions.length} mission(s)</span>
            </div>
            {missions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune mission</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Client</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Phase</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Terminal</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">DFU</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">DFU Payé</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Camion</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m) => {
                    const phase = BADGE_PHASE[m.dossier_statut] || { label: m.dossier_statut, cls: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-blue-600">{m.dossier_numero}</td>
                        <td className="px-3 py-2 text-gray-700">{m.client_nom}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${phase.cls}`}>
                            {phase.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{m.terminal || '—'}</td>
                        <td className="px-3 py-2 font-medium">{parseFloat(m.montant_dfu).toLocaleString('fr-FR')} F</td>
                        <td className="px-3 py-2">
                          {m.dfu_paye
                            ? <span className="text-green-600 font-medium">✓ Payé</span>
                            : <span className="text-red-500">✗ Non payé</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{m.camion_detail?.immatriculation || '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {!m.dfu_paye && (
                              <button onClick={() => handlePayerDFU(m.id)}
                                className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                                Payer DFU
                              </button>
                            )}
                            {m.dossier_statut === 'logistique_initial' && (
                              <button onClick={() => handleEnvoyerPassation(m.id)}
                                className="h-6 px-2 bg-purple-50 text-purple-700 rounded text-[10px] border border-purple-200 hover:bg-purple-100">
                                Envoyer à Passation →
                              </button>
                            )}
                            {m.dossier_statut === 'logistique_final' && !m.date_fin && (
                              <button onClick={() => handleCloturer(m.id)}
                                className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                                Clôturer →
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-800">Livraisons</span>
              <span className="text-[10px] text-gray-400">{livraisons.length} livraison(s)</span>
            </div>
            {livraisons.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune livraison</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Zone</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Destination</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date départ</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date livraison</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {livraisons.map((l) => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600">{l.logistique}</td>
                      <td className="px-3 py-2 text-gray-500">{ZONES[l.zone_livraison]}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {l.magasin_destination || l.localite || l.ville || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{l.date_debut || '—'}</td>
                      <td className="px-3 py-2 text-gray-400">{l.date_fin   || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          l.statut === 'livre' ? 'bg-green-100 text-green-700' :
                          l.statut === 'echoue' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {l.statut_label}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {l.statut === 'en_cours' && (
                          <button onClick={() => handleConfirmerLivraison(l.id)}
                            className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                            Confirmer →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal mission */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouvelle mission logistique</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 pt-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[10px] text-blue-700">
                ℹ️ Tous les champs marqués d'une étoile <span className="text-red-500">*</span> sont obligatoires.
              </div>
            </div>
            <form onSubmit={handleCreateMission} className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier <span className="text-red-500">*</span></label>
                  <select value={form.dossier} onChange={(e) => setForm({...form, dossier: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="">Sélectionner...</option>
                    {dossiers.map((d) => (
                      <option key={d.id} value={d.id}>{d.numero_dossier} — {d.client_nom}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Terminal <span className="text-red-500">*</span></label>
                  <select value={form.terminal} onChange={(e) => setForm({...form, terminal: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="">Sélectionner...</option>
                    <option value="T.TL">Port 1 — T.TL</option>
                    <option value="LCT">Port 2 — LCT</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Montant DFU (FCFA) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.montant_dfu}
                    onChange={(e) => setForm({...form, montant_dfu: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Type de bon <span className="text-red-500">*</span></label>
                  <select value={form.type_bon} onChange={(e) => setForm({...form, type_bon: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="">Sélectionner...</option>
                    <option value="BAD">BAD</option>
                    <option value="BAD_manutention">BAD Manutention</option>
                    <option value="appointement_LCT">Appointement LCT</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Camion <span className="text-red-500">*</span></label>
                  <select value={form.camion} onChange={(e) => setForm({...form, camion: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="">Sélectionner...</option>
                    {camions.map((c) => (
                      <option key={c.id} value={c.id}>{c.immatriculation} — {c.nom_chauffeur}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Date début <span className="text-red-500">*</span></label>
                  <input type="date" value={form.date_debut}
                    onChange={(e) => setForm({...form, date_debut: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal livraison */}
      {showLivModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouvelle livraison</span>
              <button onClick={() => setShowLivModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 pt-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[10px] text-blue-700">
                ℹ️ Tous les champs marqués d'une étoile <span className="text-red-500">*</span> sont obligatoires.
              </div>
            </div>
            <form onSubmit={handleCreateLivraison} className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Mission <span className="text-red-500">*</span></label>
                  <select value={livForm.logistique} onChange={(e) => setLivForm({...livForm, logistique: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="">Sélectionner...</option>
                    {missions.map((m) => (
                      <option key={m.id} value={m.id}>{m.dossier_numero}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Zone de livraison <span className="text-red-500">*</span></label>
                  <select value={livForm.zone_livraison} onChange={(e) => setLivForm({...livForm, zone_livraison: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="lome">Lomé</option>
                    <option value="hors_lome">Hors Lomé (Togo)</option>
                    <option value="hors_togo">Hors Togo</option>
                  </select>
                </div>
                {livForm.zone_livraison === 'lome' && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">Magasin / Entrepôt <span className="text-red-500">*</span></label>
                    <input value={livForm.magasin_destination}
                      onChange={(e) => setLivForm({...livForm, magasin_destination: e.target.value})}
                      placeholder="ex: Entrepôt Zone Industrielle"
                      className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                  </div>
                )}
                {livForm.zone_livraison === 'hors_lome' && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">Localité <span className="text-red-500">*</span></label>
                    <select value={livForm.localite} onChange={(e) => setLivForm({...livForm, localite: e.target.value})}
                      className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                      <option value="">Sélectionner...</option>
                      {['Aného', 'Bassar', 'Kara', 'Dapaong', 'Atakpamé', 'Sokodé', 'Autre'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                )}
                {livForm.zone_livraison === 'hors_togo' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Pays <span className="text-red-500">*</span></label>
                      <select value={livForm.pays} onChange={(e) => setLivForm({...livForm, pays: e.target.value})}
                        className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                        <option value="">Sélectionner...</option>
                        {['Ghana', 'Bénin', 'Burkina Faso', 'Niger', 'Mali', 'Nigeria'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Ville <span className="text-red-500">*</span></label>
                      <input value={livForm.ville} onChange={(e) => setLivForm({...livForm, ville: e.target.value})}
                        placeholder="Ville de livraison"
                        className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Date départ <span className="text-red-500">*</span></label>
                  <input type="date" value={livForm.date_debut}
                    onChange={(e) => setLivForm({...livForm, date_debut: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLivModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}