import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getDossiers, getClients, createDossier, createClient } from '../../api/dossiers';
import { toast } from 'react-toastify';

const BADGE = {
  nouveau:            'bg-purple-100 text-purple-800',
  transit:            'bg-blue-100 text-blue-800',
  logistique_initial: 'bg-amber-100 text-amber-800',
  passation:          'bg-pink-100 text-pink-800',
  logistique_final:   'bg-green-100 text-green-800',
  livraison:          'bg-emerald-100 text-emerald-800',
  cloture:            'bg-gray-100 text-gray-600',
  archive:            'bg-gray-200 text-gray-700',
};

// Onglets : on a une seule entrée "Logistique" qui regroupe les deux phases,
// pour ne pas surcharger l'interface
const TABS = [
  { label: 'Tous',        value: '' },
  { label: 'Nouveaux',    value: 'nouveau' },
  { label: 'Transit',     value: 'transit' },
  { label: 'Logistique',  value: 'logistique' }, // valeur spéciale : regroupe initial + final
  { label: 'Passation',   value: 'passation' },
  { label: 'Livraison',   value: 'livraison' },
  { label: 'Clôturés',    value: 'cloture' },
];

export default function ListeDossiers() {
  const navigate = useNavigate();
  const [dossiers,   setDossiers]   = useState([]);
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statut,     setStatut]     = useState('');
  const [transport,  setTransport]  = useState('');
  const [dateDebut,  setDateDebut]  = useState('');
  const [dateFin,    setDateFin]    = useState('');
  const [activeTab,  setActiveTab]  = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Formulaire nouveau dossier
  const [form, setForm] = useState({
    client: '', type_transport: '', observations: ''
  });
  const [clientSearch, setClientSearch] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);

  // Formulaire nouveau client
  const [clientForm, setClientForm] = useState({
    nom: '', telephone: '', email: '',
    adresse: '', ville: 'Lomé', pays: 'Togo'
  });

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)    params.search         = search;
      // Cas spécial : "logistique" en onglet → on ne filtre pas côté serveur,
      // on filtrera côté client pour récupérer les deux phases
      if (statut && statut !== 'logistique') params.statut = statut;
      if (transport) params.type_transport = transport;
      if (dateDebut) params.date_debut     = dateDebut;
      if (dateFin)   params.date_fin       = dateFin;

      const res = await getDossiers(params);
      setDossiers(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDossiers(); }, [statut, transport, dateDebut, dateFin]);

  useEffect(() => {
    const fetchClients = async () => {
      const res = await getClients();
      setClients(res.data.results || res.data);
    };
    fetchClients();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDossiers();
  };

  const handleTabChange = (val) => {
    setActiveTab(val);
    setStatut(val);
  };

  const handleClientSearch = (val) => {
    setClientSearch(val);
    if (val.length > 0) {
      const suggestions = clients.filter(c =>
        c.nom.toLowerCase().includes(val.toLowerCase())
      );
      setClientSuggestions(suggestions.slice(0, 5));
    } else {
      setClientSuggestions([]);
    }
  };

  const handleCreateDossier = async (e) => {
    e.preventDefault();
    if (!form.client || !form.type_transport) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      await createDossier({
        client: parseInt(form.client),
        type_transport: form.type_transport,
        observations: form.observations,
      });
      toast.success('Dossier créé avec succès !');
      setShowModal(false);
      setForm({ client: '', type_transport: '', observations: '' });
      setClientSearch('');
      fetchDossiers();
    } catch {
      toast.error('Erreur lors de la création du dossier');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientForm.nom) {
      toast.error('Le nom du client est obligatoire');
      return;
    }
    try {
      const res = await createClient(clientForm);
      toast.success('Client créé avec succès !');
      setShowClientModal(false);
      setClients([...clients, res.data]);
      setForm({ ...form, client: res.data.id });
      setClientSearch(res.data.nom);
      setClientForm({ nom: '', telephone: '', email: '', adresse: '', ville: 'Lomé', pays: 'Togo' });
    } catch {
      toast.error('Erreur lors de la création du client');
    }
  };

  // Filtrage côté client
  let filtered = dossiers.filter(d =>
    d.numero_dossier.toLowerCase().includes(search.toLowerCase()) ||
    d.client_nom.toLowerCase().includes(search.toLowerCase())
  );

  // Cas spécial onglet "Logistique" : on garde les deux phases
  if (activeTab === 'logistique') {
    filtered = filtered.filter(d =>
      d.statut === 'logistique_initial' || d.statut === 'logistique_final'
    );
  }

  return (
    <Layout title="Gestion des Dossiers"
      subtitle={`${dossiers.length} dossiers au total`}>
      <div className="flex flex-col gap-3">

        {/* Barre d'outils */}
        <div className="flex items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un dossier, client..."
                className="h-8 pl-7 pr-3 border border-gray-200 rounded-md text-xs outline-none w-52 focus:border-blue-400"
              />
            </div>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none"
            >
              <option value="">Tous les types</option>
              <option value="maritime">Maritime</option>
              <option value="aerien">Aérien</option>
              <option value="terrestre">Terrestre</option>
            </select>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none"
            />
            <button type="submit"
              className="h-8 px-3 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
              Rechercher
            </button>
            <button type="button"
              onClick={() => { setSearch(''); setTransport(''); setDateDebut(''); setDateFin(''); setStatut(''); setActiveTab(''); }}
              className="h-8 px-3 border border-gray-200 rounded-md text-xs text-gray-500 hover:bg-gray-50">
              Effacer
            </button>
          </form>
          <button
            onClick={() => setShowModal(true)}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3] flex items-center gap-1">
            + Nouveau dossier
          </button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? 'bg-[#1F3864] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Liste des dossiers</span>
            <span className="text-[10px] text-gray-400">{filtered.length} dossier{filtered.length > 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun dossier trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">N° Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Client</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date début</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date fin</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`/dossiers/${d.id}`)}>
                        {d.numero_dossier}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{d.client_nom}</td>
                      <td className="px-3 py-2 text-gray-500 capitalize">{d.type_transport}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE[d.statut] || 'bg-gray-100'}`}>
                          {d.statut_label || d.statut}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{d.date_debut}</td>
                      <td className="px-3 py-2 text-gray-400">{d.date_fin || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/dossiers/${d.id}`)}
                            className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 text-[10px]">
                            👁
                          </button>
                          <button className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 text-[10px]">
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal nouveau dossier */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">
                Nouveau dossier
                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">N° automatique</span>
              </span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateDossier} className="p-5 flex flex-col gap-4">

              {/* Client */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-[10px] text-blue-600 hover:underline font-medium"
                  >
                    + Nouveau client
                  </button>
                </div>
                <div className="relative">
                  <input
                    value={clientSearch}
                    onChange={(e) => handleClientSearch(e.target.value)}
                    placeholder="Tapez pour rechercher un client..."
                    className="w-full h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                    autoComplete="off"
                  />
                  {clientSuggestions.length > 0 && (
                    <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-md z-10 shadow-md max-h-40 overflow-y-auto">
                      {clientSuggestions.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setForm({ ...form, client: c.id });
                            setClientSearch(c.nom);
                            setClientSuggestions([]);
                          }}
                          className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 text-gray-700"
                        >
                          {c.nom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type transport */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Type de transport <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type_transport}
                  onChange={(e) => setForm({ ...form, type_transport: e.target.value })}
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                >
                  <option value="">Sélectionner...</option>
                  <option value="maritime">Maritime</option>
                  <option value="aerien">Aérien</option>
                  <option value="terrestre">Terrestre</option>
                </select>
              </div>

              {/* Observations */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Observations
                </label>
                <textarea
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="Notes ou informations complémentaires..."
                  className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-400 resize-none h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Créer le dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nouveau client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">Nouveau client</span>
              <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="p-5 flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Nom du client <span className="text-red-500">*</span>
                </label>
                <input
                  value={clientForm.nom}
                  onChange={(e) => setClientForm({...clientForm, nom: e.target.value})}
                  placeholder="ex: SAZOF SA"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Téléphone
                </label>
                <input
                  value={clientForm.telephone}
                  onChange={(e) => setClientForm({...clientForm, telephone: e.target.value})}
                  placeholder="+228 XX XX XX XX"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                  placeholder="contact@client.tg"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Adresse
                </label>
                <input
                  value={clientForm.adresse}
                  onChange={(e) => setClientForm({...clientForm, adresse: e.target.value})}
                  placeholder="Adresse complète"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Ville
                </label>
                <input
                  value={clientForm.ville}
                  onChange={(e) => setClientForm({...clientForm, ville: e.target.value})}
                  placeholder="Lomé"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Pays
                </label>
                <input
                  value={clientForm.pays}
                  onChange={(e) => setClientForm({...clientForm, pays: e.target.value})}
                  placeholder="Togo"
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowClientModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Créer le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}