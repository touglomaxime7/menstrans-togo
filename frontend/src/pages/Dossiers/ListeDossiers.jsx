import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getDossiers, getClients, createDossier, createClient } from '../../api/dossiers';
import { createConteneur } from '../../api/contrats';
import ComboBox from '../../components/ComboBox';
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

const CLASSIF_BADGE = {
  standard:    'bg-gray-100 text-gray-600',
  urgent:      'bg-orange-100 text-orange-700',
  vip:         'bg-yellow-100 text-yellow-800',
  contentieux: 'bg-red-100 text-red-700',
};

const CLASSIF_LABEL = {
  standard: 'Standard', urgent: 'Urgent', vip: 'VIP', contentieux: 'Contentieux',
};

const TABS = [
  { label: 'Tous',       value: '' },
  { label: 'Nouveaux',   value: 'nouveau' },
  { label: 'Transit',    value: 'transit' },
  { label: 'Logistique', value: 'logistique' },
  { label: 'Passation',  value: 'passation' },
  { label: 'Livraison',  value: 'livraison' },
  { label: 'Clôturés',   value: 'cloture' },
];

const TYPE_CONTENEUR_OPTIONS = [
  "20' Standard", "40' Standard", "40' High Cube",
  "20' Frigorifique", "40' Frigorifique", 'Open Top', 'Flat Rack',
];

const COMPAGNIES_MARITIMES = [
  'MSC', 'CMA-CGM', 'Maersk', 'Hapag-Lloyd', 'Evergreen',
  'COSCO', 'ONE', 'Yang Ming', 'HMM', 'ZIM',
];

const PAYS_PORTS = [
  'Lomé (Togo)', "Abidjan (Côte d'Ivoire)", 'Tema (Ghana)',
  'Cotonou (Bénin)', 'Dakar (Sénégal)', 'Lagos (Nigeria)',
  'Douala (Cameroun)', 'Pointe-Noire (Congo)', 'Marseille (France)',
  'Rotterdam (Pays-Bas)', 'Hambourg (Allemagne)', 'Shanghai (Chine)',
  'Singapour', 'Dubai (EAU)', 'Anvers (Belgique)', 'Autre',
];

const MODES_SORTIE = [
  'Camion', 'Dépotage', 'Terminal PIA', 'Terminal Togo', 'Terminal BMH', 'Autre terminal',
];

const CLASSIFICATIONS = ['Standard', 'Urgent', 'VIP', 'Contentieux'];

export default function ListeDossiers() {
  const navigate = useNavigate();
  const [dossiers,        setDossiers]        = useState([]);
  const [clients,         setClients]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [statut,          setStatut]          = useState('');
  const [transport,       setTransport]       = useState('');
  const [classification,  setClassification]  = useState('');
  const [dateDebut,       setDateDebut]       = useState('');
  const [dateFin,         setDateFin]         = useState('');
  const [activeTab,       setActiveTab]       = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  const [form, setForm] = useState({
    client: '', type_transport: '', observations: '',
    classification: 'standard', mode_sortie: '',
  });
  const [clientSearch,      setClientSearch]      = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);

  const [conteneurForm, setConteneurForm] = useState({
    type_conteneur:    "20' Standard",
    nombre_conteneurs: 1,
    type_marchandise:  '',
    numero_bl:         '',
    port_chargement:   '',
    port_dechargement: 'Lomé (Togo)',
    compagnie_maritime:'',
    poids_total_kg:    '',
    observations:      '',
  });

  const [clientForm, setClientForm] = useState({
    nom: '', telephone: '', email: '', adresse: '', ville: 'Lomé', pays: 'Togo',
  });

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)         params.search         = search;
      if (statut && statut !== 'logistique') params.statut = statut;
      if (transport)      params.type_transport = transport;
      if (classification) params.classification = classification;
      if (dateDebut)      params.date_debut     = dateDebut;
      if (dateFin)        params.date_fin       = dateFin;
      const res = await getDossiers(params);
      setDossiers(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDossiers(); }, [statut, transport, classification, dateDebut, dateFin]);

  useEffect(() => {
    const fetchClients = async () => {
      const res = await getClients();
      setClients(res.data.results || res.data);
    };
    fetchClients();
  }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchDossiers(); };
  const handleTabChange = (val) => { setActiveTab(val); setStatut(val); };

  const handleClientSearch = (val) => {
    setClientSearch(val);
    if (val.length > 0) {
      setClientSuggestions(
        clients.filter(c => c.nom.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      );
    } else {
      setClientSuggestions([]);
    }
  };

  const resetModal = () => {
    setForm({ client: '', type_transport: '', observations: '', classification: 'standard', mode_sortie: '' });
    setConteneurForm({
      type_conteneur: "20' Standard", nombre_conteneurs: 1, type_marchandise: '',
      numero_bl: '', port_chargement: '', port_dechargement: 'Lomé (Togo)',
      compagnie_maritime: '', poids_total_kg: '', observations: '',
    });
    setClientSearch('');
    setClientSuggestions([]);
  };

 const handleCreateDossier = async (e) => {
    e.preventDefault();
    if (!form.client || !form.type_transport) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    // Convertir les labels en valeurs backend
    const typeTransportMap = {
      'maritime': 'maritime', 'Maritime': 'maritime', '🚢 Maritime': 'maritime',
      'aerien': 'aerien', 'Aérien': 'aerien', '✈️ Aérien': 'aerien',
      'terrestre': 'terrestre', 'Terrestre': 'terrestre', '🚛 Terrestre': 'terrestre',
    };
    const classifMap = {
      'standard': 'standard', 'Standard': 'standard',
      'urgent': 'urgent', 'Urgent': 'urgent',
      'vip': 'vip', 'VIP': 'vip',
      'contentieux': 'contentieux', 'Contentieux': 'contentieux',
    };
    const modeSortieMap = {
      'Camion': 'camion', 'camion': 'camion',
      'Dépotage': 'depotage', 'depotage': 'depotage',
      'Terminal PIA': 'terminal_pia', 'terminal_pia': 'terminal_pia',
      'Terminal Togo': 'terminal_togo', 'terminal_togo': 'terminal_togo',
      'Terminal BMH': 'terminal_bmh', 'terminal_bmh': 'terminal_bmh',
      'Autre terminal': 'autre', 'autre': 'autre',
    };

    const typeTransport = typeTransportMap[form.type_transport] || form.type_transport.toLowerCase();
    const classif       = classifMap[form.classification]       || form.classification.toLowerCase();
    const modeSortie    = modeSortieMap[form.mode_sortie]       || form.mode_sortie || null;

    try {
      const res = await createDossier({
        client:         parseInt(form.client),
        type_transport: typeTransport,
        observations:   form.observations,
        classification: classif,
        mode_sortie:    modeSortie,
      });

      if (typeTransport === 'maritime') {
        try {
          await createConteneur({
            dossier:           res.data.id,
            type_conteneur:    conteneurForm.type_conteneur,
            nombre_conteneurs: parseInt(conteneurForm.nombre_conteneurs) || 1,
            type_marchandise:  conteneurForm.type_marchandise,
            numero_bl:         conteneurForm.numero_bl,
            port_chargement:   conteneurForm.port_chargement,
            port_dechargement: conteneurForm.port_dechargement,
            compagnie_maritime:conteneurForm.compagnie_maritime,
            poids_total_kg:    conteneurForm.poids_total_kg || null,
            observations:      conteneurForm.observations,
          });
        } catch {
          toast.warning('Dossier créé mais erreur sur les détails conteneur');
        }
      }

      toast.success('Dossier créé avec succès !');
      setShowModal(false);
      resetModal();
      fetchDossiers();
    } catch (err) {
      console.log('Erreur création dossier:', err.response?.data);
      toast.error('Erreur lors de la création du dossier');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientForm.nom) { toast.error('Le nom du client est obligatoire'); return; }
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

  let filtered = dossiers.filter(d =>
    d.numero_dossier.toLowerCase().includes(search.toLowerCase()) ||
    d.client_nom.toLowerCase().includes(search.toLowerCase())
  );
  if (activeTab === 'logistique') {
    filtered = filtered.filter(d =>
      d.statut === 'logistique_initial' || d.statut === 'logistique_final'
    );
  }

  return (
    <Layout title="Gestion des Dossiers" subtitle={`${dossiers.length} dossiers au total`}>
      <div className="flex flex-col gap-3">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un dossier, client..."
                className="h-8 pl-7 pr-3 border border-gray-200 rounded-md text-xs outline-none w-52 focus:border-blue-400"/>
            </div>
            <select value={transport} onChange={(e) => setTransport(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none">
              <option value="">Tous les types</option>
              <option value="maritime">Maritime</option>
              <option value="aerien">Aérien</option>
              <option value="terrestre">Terrestre</option>
            </select>
            <select value={classification} onChange={(e) => setClassification(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none">
              <option value="">Toutes classifications</option>
              <option value="standard">Standard</option>
              <option value="urgent">Urgent</option>
              <option value="vip">VIP</option>
              <option value="contentieux">Contentieux</option>
            </select>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none"/>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
              className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none"/>
            <button type="submit"
              className="h-8 px-3 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
              Rechercher
            </button>
            <button type="button"
              onClick={() => { setSearch(''); setTransport(''); setClassification(''); setDateDebut(''); setDateFin(''); setStatut(''); setActiveTab(''); }}
              className="h-8 px-3 border border-gray-200 rounded-md text-xs text-gray-500 hover:bg-gray-50">
              Effacer
            </button>
          </form>
          <button onClick={() => { resetModal(); setShowModal(true); }}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
            + Nouveau dossier
          </button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200 w-fit">
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => handleTabChange(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.value ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
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
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Conteneur</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Classification</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Mode sortie</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date début</th>
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
                      <td className="px-3 py-2 text-gray-500">
                        {d.conteneur ? (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {d.conteneur.nombre_conteneurs}x {d.conteneur.type_conteneur_label}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CLASSIF_BADGE[d.classification] || 'bg-gray-100'}`}>
                          {CLASSIF_LABEL[d.classification] || d.classification}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 capitalize">
                        {d.mode_sortie ? d.mode_sortie.replace(/_/g, ' ') : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE[d.statut] || 'bg-gray-100'}`}>
                          {d.statut_label || d.statut}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{d.date_debut}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => navigate(`/dossiers/${d.id}`)}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 text-[10px]">
                          👁
                        </button>
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
          <div className="bg-white rounded-xl w-[560px] max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">Nouveau dossier</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateDossier} className="p-5 flex flex-col gap-4">

              {/* Client */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <button type="button" onClick={() => setShowClientModal(true)}
                    className="text-[10px] text-blue-600 hover:underline font-medium">
                    + Nouveau client
                  </button>
                </div>
                <div className="relative">
                  <input value={clientSearch} onChange={(e) => handleClientSearch(e.target.value)}
                    placeholder="Tapez pour rechercher un client..."
                    className="w-full h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"
                    autoComplete="off"/>
                  {clientSuggestions.length > 0 && (
                    <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-md z-10 shadow-md max-h-40 overflow-y-auto">
                      {clientSuggestions.map((c) => (
                        <div key={c.id}
                          onClick={() => { setForm({ ...form, client: c.id }); setClientSearch(c.nom); setClientSuggestions([]); }}
                          className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 text-gray-700">
                          {c.nom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type transport */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">
                  Type de transport <span className="text-red-500">*</span>
                </label>
                <ComboBox
                  value={form.type_transport}
                  onChange={(val) => setForm({ ...form, type_transport: val.toLowerCase() })}
                  options={['Maritime', 'Aérien', 'Terrestre']}
                  placeholder="Sélectionner ou saisir..."
                />
              </div>

              {/* Sous-formulaire conteneur (maritime) */}
              {form.type_transport === 'maritime' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-600">🚢</span>
                    <span className="text-xs font-semibold text-blue-800">Détails du conteneur</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Type de conteneur</label>
                      <ComboBox
                        value={conteneurForm.type_conteneur}
                        onChange={(val) => setConteneurForm({ ...conteneurForm, type_conteneur: val })}
                        options={TYPE_CONTENEUR_OPTIONS}
                        placeholder="Type de conteneur..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Nombre</label>
                      <input type="number" min="1" max="99"
                        value={conteneurForm.nombre_conteneurs}
                        onChange={(e) => setConteneurForm({ ...conteneurForm, nombre_conteneurs: e.target.value })}
                        className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none bg-white focus:border-blue-400"/>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Type de marchandise</label>
                      <input type="text"
                        value={conteneurForm.type_marchandise}
                        onChange={(e) => setConteneurForm({ ...conteneurForm, type_marchandise: e.target.value })}
                        placeholder="ex: Produits alimentaires, Électronique..."
                        className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none bg-white focus:border-blue-400"/>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">N° B/L</label>
                      <input type="text"
                        value={conteneurForm.numero_bl}
                        onChange={(e) => setConteneurForm({ ...conteneurForm, numero_bl: e.target.value })}
                        placeholder="ex: MSCU1234567"
                        className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none bg-white focus:border-blue-400"/>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Compagnie maritime</label>
                      <ComboBox
                        value={conteneurForm.compagnie_maritime}
                        onChange={(val) => setConteneurForm({ ...conteneurForm, compagnie_maritime: val })}
                        options={COMPAGNIES_MARITIMES}
                        placeholder="ex: MSC, CMA-CGM..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Port de chargement</label>
                      <ComboBox
                        value={conteneurForm.port_chargement}
                        onChange={(val) => setConteneurForm({ ...conteneurForm, port_chargement: val })}
                        options={PAYS_PORTS}
                        placeholder="Port de chargement..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Port de déchargement</label>
                      <ComboBox
                        value={conteneurForm.port_dechargement}
                        onChange={(val) => setConteneurForm({ ...conteneurForm, port_dechargement: val })}
                        options={PAYS_PORTS}
                        placeholder="Port de déchargement..."
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Poids total (kg)</label>
                      <input type="number" min="0"
                        value={conteneurForm.poids_total_kg}
                        onChange={(e) => setConteneurForm({ ...conteneurForm, poids_total_kg: e.target.value })}
                        placeholder="ex: 15000"
                        className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none bg-white focus:border-blue-400"/>
                    </div>
                  </div>
                </div>
              )}

              {/* Classification */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Classification</label>
                <ComboBox
                  value={form.classification}
                  onChange={(val) => setForm({ ...form, classification: val.toLowerCase() })}
                  options={CLASSIFICATIONS}
                  placeholder="Standard, Urgent, VIP..."
                />
              </div>

              {/* Mode sortie */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Mode de sortie</label>
                <ComboBox
                  value={form.mode_sortie}
                  onChange={(val) => setForm({ ...form, mode_sortie: val })}
                  options={MODES_SORTIE}
                  placeholder="À déterminer plus tard..."
                />
              </div>

              {/* Observations */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Observations</label>
                <textarea value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="Notes ou informations complémentaires..."
                  className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-400 resize-none h-16"/>
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
          <div className="bg-white rounded-xl w-[420px] max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">Nouveau client</span>
              <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="p-5 flex flex-col gap-3">
              {[
                { key: 'nom',       label: 'Nom *',     placeholder: 'ex: SAZOF SA' },
                { key: 'telephone', label: 'Téléphone', placeholder: '+228 XX XX XX XX' },
                { key: 'email',     label: 'Email',     placeholder: 'contact@client.tg' },
                { key: 'adresse',   label: 'Adresse',   placeholder: 'Adresse complète' },
                { key: 'ville',     label: 'Ville',     placeholder: 'Lomé' },
                { key: 'pays',      label: 'Pays',      placeholder: 'Togo' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">{f.label}</label>
                  <input value={clientForm[f.key]}
                    onChange={(e) => setClientForm({ ...clientForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowClientModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
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