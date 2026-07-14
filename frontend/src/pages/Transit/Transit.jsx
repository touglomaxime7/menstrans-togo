import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import TableauBordSection from '../../components/TableauBordSection';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const BADGE_STATUT = {
  en_cours: 'bg-amber-100 text-amber-800',
  soumise:  'bg-blue-100 text-blue-800',
  validee:  'bg-green-100 text-green-800',
  rejetee:  'bg-red-100 text-red-800',
};

export default function Transit() {
  const [declarations, setDeclarations] = useState([]);
  const [etudes,       setEtudes]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('declarations');
  const [showModal,    setShowModal]    = useState(false);
  const [dossiers,     setDossiers]     = useState([]);
  const [form, setForm] = useState({
    dossier: '', nom_navire: '', port_arrivee: 'Port de Lomé',
    date_debut: '', dtd_montant: 0, autres_frais: 0,
  });
  const [showEtudeModal, setShowEtudeModal] = useState(false);
  // Le Service Transit ne saisit QUE le DTD. Les autres frais sont confidentiels,
  // ils seront complétés ultérieurement par la Direction.
  const [etudeForm, setEtudeForm] = useState({
    dossier: '', droit_taxe_douane: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [decRes, etRes, dosRes] = await Promise.all([
        api.get('/transit/declarations/', { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/transit/etudes/',       { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/dossiers/',             { params: { statut: 'transit' } }),
      ]);
      setDeclarations(decRes.data.results || decRes.data);
      setEtudes(etRes.data.results       || etRes.data);
      setDossiers(dosRes.data.results    || dosRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Validation déclaration : tous les champs obligatoires
  const validerDeclaration = () => {
    const erreurs = [];
    if (!form.dossier)                    erreurs.push('Le dossier');
    if (!form.nom_navire.trim())          erreurs.push('Le nom du navire');
    if (!form.date_debut)                 erreurs.push('La date d\'arrivée');
    if (!form.port_arrivee.trim())        erreurs.push('Le port d\'arrivée');
    if (form.dtd_montant === '' || form.dtd_montant === null)     erreurs.push('Le montant DTD');
    if (form.autres_frais === '' || form.autres_frais === null)   erreurs.push('Les autres frais');

    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    return true;
  };

  const handleCreateDeclaration = async (e) => {
    e.preventDefault();
    if (!validerDeclaration()) return;
    try {
      await api.post('/transit/declarations/', form);
      toast.success('Déclaration créée !');
      setShowModal(false);
      setForm({ dossier: '', nom_navire: '', port_arrivee: 'Port de Lomé', date_debut: '', dtd_montant: 0, autres_frais: 0 });
      fetchData();
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  // Validation étude : seul le DTD est obligatoire côté Transit
  const validerEtude = () => {
    const erreurs = [];
    if (!etudeForm.dossier)                                                           erreurs.push('Le dossier');
    if (etudeForm.droit_taxe_douane === '' || etudeForm.droit_taxe_douane === null)   erreurs.push('Le DTD');

    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    return true;
  };

  const handleCreateEtude = async (e) => {
    e.preventDefault();
    if (!validerEtude()) return;
    try {
      // On envoie uniquement le DTD ; le backend force les autres frais à 0
      await api.post('/transit/etudes/', etudeForm);
      toast.success('Étude créée — en attente du complément de la Direction');
      setShowEtudeModal(false);
      setEtudeForm({ dossier: '', droit_taxe_douane: 0 });
      fetchData();
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleSoumettre = async (id) => {
    try {
      await api.post(`/transit/declarations/${id}/soumettre/`);
      toast.success('Déclaration soumise !');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleValider = async (id) => {
    try {
      await api.post(`/transit/declarations/${id}/valider/`);
      toast.success('Déclaration validée — dossier transmis au Logistique !');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleApprouver = async (id) => {
    try {
      await api.post(`/transit/etudes/${id}/approuver/`);
      toast.success('Étude de valeur approuvée !');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <Layout title="Service Transit" subtitle="Déclarations douanières et études de valeur">
      <div className="flex flex-col gap-4">
          {/* Tableau de bord */}
        <TableauBordSection statuts={['transit']} titre="Transit" />

        {/* Tabs + boutons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button onClick={() => setActiveTab('declarations')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'declarations' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              Déclarations
            </button>
            <button onClick={() => setActiveTab('etudes')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'etudes' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              Études de valeur
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEtudeModal(true)}
              className="h-8 px-3 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50">
              + Nouvelle étude
            </button>
            <button onClick={() => setShowModal(true)}
              className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
              + Nouvelle déclaration
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Chargement...
          </div>
        ) : activeTab === 'declarations' ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-800">Liste des déclarations</span>
              <span className="text-[10px] text-gray-400">{declarations.length} déclaration(s)</span>
            </div>
            {declarations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune déclaration</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">N° Déclaration</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Navire</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date arrivée</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">DTD</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Total</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {declarations.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600">{d.numero_declaration || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{d.dossier_numero}</td>
                      <td className="px-3 py-2 text-gray-500">{d.nom_navire || '—'}</td>
                      <td className="px-3 py-2 text-gray-400">{d.date_debut || '—'}</td>
                      <td className="px-3 py-2 font-medium">{parseFloat(d.dtd_montant).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2 font-medium text-blue-700">{parseFloat(d.total_valeur).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_STATUT[d.statut] || 'bg-gray-100'}`}>
                          {d.statut}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {d.statut === 'en_cours' && (
                            <button onClick={() => handleSoumettre(d.id)}
                              className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                              Soumettre
                            </button>
                          )}
                          {d.statut === 'soumise' && (
                            <button onClick={() => handleValider(d.id)}
                              className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                              Valider →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-800">Études de valeur</span>
              <span className="text-[10px] text-gray-400">{etudes.length} étude(s)</span>
            </div>
            {etudes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune étude de valeur</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">DTD</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Complément Direction</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Approuvé client</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {etudes.map((e) => {
                    // L'étude est "complétée" si la Direction a déjà saisi au moins un des frais
                    const complete = (parseFloat(e.frais_transit || 0) +
                                      parseFloat(e.frais_manutention || 0) +
                                      parseFloat(e.frais_portuaires || 0) +
                                      parseFloat(e.autres_frais || 0)) > 0;
                    return (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-blue-600">{e.dossier_numero || e.dossier}</td>
                        <td className="px-3 py-2 font-medium">{parseFloat(e.droit_taxe_douane).toLocaleString('fr-FR')} F</td>
                        <td className="px-3 py-2">
                          {complete
                            ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">✓ Complété</span>
                            : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">⏳ En attente</span>
                          }
                        </td>
                        <td className="px-3 py-2">
                          {e.approuve_client
                            ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Oui</span>
                            : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">Non</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-gray-400">{e.date_debut || '—'}</td>
                        <td className="px-3 py-2">
                          {complete && !e.approuve_client && (
                            <button onClick={() => handleApprouver(e.id)}
                              className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                              Approuver
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal nouvelle déclaration (inchangé) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouvelle déclaration douanière</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 pt-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[10px] text-blue-700">
                ℹ️ Tous les champs marqués d'une étoile <span className="text-red-500">*</span> sont obligatoires.
              </div>
            </div>
            <form onSubmit={handleCreateDeclaration} className="p-5 flex flex-col gap-3">
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
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Nom du navire <span className="text-red-500">*</span></label>
                  <input value={form.nom_navire} onChange={(e) => setForm({...form, nom_navire: e.target.value})}
                    placeholder="ex: MSC TOGO" className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Date d'arrivée <span className="text-red-500">*</span></label>
                  <input type="date" value={form.date_debut} onChange={(e) => setForm({...form, date_debut: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Port d'arrivée <span className="text-red-500">*</span></label>
                  <input value={form.port_arrivee} onChange={(e) => setForm({...form, port_arrivee: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Montant DTD (FCFA) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.dtd_montant} onChange={(e) => setForm({...form, dtd_montant: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Autres frais (FCFA) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.autres_frais} onChange={(e) => setForm({...form, autres_frais: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Créer la déclaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nouvelle étude — version simplifiée : DTD uniquement */}
      {showEtudeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[440px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouvelle étude de valeur</span>
              <button onClick={() => setShowEtudeModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 pt-3">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-[11px] text-amber-800 leading-relaxed">
                🔒 <strong>Information confidentielle :</strong> seul le DTD (Droit de Taxe Douane) est saisi à ce niveau. Les autres frais (transit, manutention, portuaires, divers) seront <strong>complétés ultérieurement par la Direction</strong>.
              </div>
            </div>
            <form onSubmit={handleCreateEtude} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier <span className="text-red-500">*</span></label>
                <select value={etudeForm.dossier} onChange={(e) => setEtudeForm({...etudeForm, dossier: e.target.value})}
                  className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                  <option value="">Sélectionner...</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero_dossier} — {d.client_nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Montant DTD (FCFA) <span className="text-red-500">*</span></label>
                <input type="number" value={etudeForm.droit_taxe_douane}
                  onChange={(e) => setEtudeForm({...etudeForm, droit_taxe_douane: e.target.value})}
                  placeholder="Droit de Taxe Douane"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEtudeModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Enregistrer le DTD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}