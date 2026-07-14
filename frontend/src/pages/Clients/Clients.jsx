import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getClients, createClient } from '../../api/dossiers';
import { PAYS_DATA, getPaysParNom } from '../../data/paysData';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function Clients() {
  const navigate = useNavigate();
  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form, setForm] = useState({
    nom: '', telephone: '', email: '',
    adresse: '', ville: '', pays: 'Togo',
    contact_principal: '', fonction_contact: '',
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await getClients();
      setClients(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  // Quand on change le pays → pré-remplir l'indicatif téléphonique
  const handlePaysChange = (nomPays) => {
    const pays = getPaysParNom(nomPays);
    setForm(prev => {
      // Si le champ téléphone est vide ou contient juste un indicatif précédent
      const ancienPays = getPaysParNom(prev.pays);
      const ancienIndicatif = ancienPays?.indicatif || '';
      const telActuel = prev.telephone.trim();

      // Remplace l'indicatif automatiquement si le tel est vide ou commence par l'ancien indicatif
      let nouveauTel = telActuel;
      if (!telActuel || telActuel === ancienIndicatif || telActuel.startsWith(ancienIndicatif + ' ')) {
        nouveauTel = pays?.indicatif ? pays.indicatif + ' ' : '';
      }

      return { ...prev, pays: nomPays, telephone: nouveauTel };
    });
  };

  const validerFormulaire = () => {
    const erreurs = [];
    if (!form.nom.trim())       erreurs.push('Le nom');
    if (!form.email.trim())     erreurs.push("L'email");
    if (!form.telephone.trim()) erreurs.push('Le téléphone');
    if (!form.adresse.trim())   erreurs.push("L'adresse");
    if (!form.ville.trim())     erreurs.push('La ville');
    if (!form.pays.trim())      erreurs.push('Le pays');

    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("L'adresse email n'est pas valide");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validerFormulaire()) return;
    try {
      if (selected) {
        await api.patch(`/clients/${selected.id}/`, form);
        toast.success('Client mis à jour !');
      } else {
        await createClient(form);
        toast.success('Client créé avec succès !');
      }
      setShowModal(false);
      setSelected(null);
      setForm({ nom: '', telephone: '', email: '', adresse: '', ville: '', pays: 'Togo', contact_principal: '', fonction_contact: '' });
      fetchClients();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (client) => {
    setSelected(client);
    setForm({
      nom:               client.nom || '',
      telephone:         client.telephone || '',
      email:             client.email || '',
      adresse:           client.adresse || '',
      ville:             client.ville || '',
      pays:              client.pays || 'Togo',
      contact_principal: client.contact_principal || '',
      fonction_contact:  client.fonction_contact || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (client) => {
    if (!window.confirm(`Supprimer le client ${client.nom} ?\n\nATTENTION : Cette action est irréversible !`)) return;
    try {
      await api.delete(`/clients/${client.id}/`);
      toast.success('Client supprimé');
      fetchClients();
    } catch {
      toast.error('Erreur : impossible de supprimer ce client');
    }
  };

  const ouvrirNouveau = () => {
    setSelected(null);
    const paysDefaut = getPaysParNom('Togo');
    setForm({
      nom: '', telephone: paysDefaut?.indicatif + ' ' || '',
      email: '', adresse: '', ville: '', pays: 'Togo',
      contact_principal: '', fonction_contact: '',
    });
    setShowModal(true);
  };

  const filtered = clients.filter(c =>
    !search ||
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone?.toLowerCase().includes(search.toLowerCase()) ||
    c.ville?.toLowerCase().includes(search.toLowerCase())
  );

  const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  return (
    <Layout title="Gestion des Clients" subtitle={`${clients.length} clients enregistrés`}>
      <div className="flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total clients', value: clients.length,                                           bg: 'bg-blue-50',   color: 'text-blue-700' },
            { label: 'Lomé',          value: clients.filter(c => c.ville === 'Lomé').length,           bg: 'bg-green-50',  color: 'text-green-700' },
            { label: 'Hors Lomé',     value: clients.filter(c => c.ville && c.ville !== 'Lomé').length,bg: 'bg-amber-50',  color: 'text-amber-700' },
            { label: 'Actifs',        value: clients.filter(c => c.actif !== false).length,            bg: 'bg-purple-50', color: 'text-purple-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 border border-gray-200`}>
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone ou ville..."
              className="h-8 pl-7 pr-3 border border-gray-200 rounded-md text-xs outline-none w-96 focus:border-blue-400"/>
          </div>
          <button onClick={ouvrirNouveau}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
            + Nouveau client
          </button>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Liste des clients</span>
            <span className="text-[10px] text-gray-400">{filtered.length} client(s)</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun client trouvé</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Nom</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Téléphone</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Email</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Ville</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Pays</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const paysInfo = getPaysParNom(c.pays);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`/clients/${c.id}`)}>
                        {c.nom}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{c.telephone || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{c.email || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{c.ville || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {paysInfo && paysInfo.iso !== '—' && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono font-bold">
                              {paysInfo.iso}
                            </span>
                          )}
                          <span className="text-gray-600">{c.pays || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/clients/${c.id}`)}
                            className="h-6 px-2 bg-gray-50 text-gray-700 rounded text-[10px] border border-gray-200 hover:bg-gray-100">
                            👁 Profil
                          </button>
                          <button onClick={() => handleEdit(c)}
                            className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                            ✏️ Modifier
                          </button>
                          <button onClick={() => handleDelete(c)}
                            className="h-6 px-2 bg-red-50 text-red-700 rounded text-[10px] border border-red-200 hover:bg-red-100">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[550px] max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">
                {selected ? 'Modifier le client' : 'Nouveau client'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-5 pt-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[10px] text-blue-700">
                ℹ️ Les champs marqués <span className="text-red-500">*</span> sont obligatoires.
                L'indicatif téléphonique se pré-remplit automatiquement selon le pays choisi.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">

                {/* Nom */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Nom du client <span className="text-red-500">*</span>
                  </label>
                  <input value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})}
                    placeholder="ex: SAZOF SA"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Pays — en premier pour que l'indicatif s'auto-remplisse avant le tel */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <select value={form.pays} onChange={(e) => handlePaysChange(e.target.value)}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    {PAYS_DATA.map((p) => (
                      <option key={p.nom} value={p.nom}>
                        {p.iso !== '—' ? `${p.iso} · ` : ''}{p.nom} {p.indicatif ? `(${p.indicatif})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Téléphone avec indicatif auto */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {getPaysParNom(form.pays)?.indicatif && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                        {getPaysParNom(form.pays)?.indicatif}
                      </span>
                    )}
                    <input value={form.telephone}
                      onChange={(e) => setForm({...form, telephone: e.target.value})}
                      placeholder={`${getPaysParNom(form.pays)?.indicatif || ''} XX XX XX XX`}
                      className="h-9 border border-gray-200 rounded-md px-3 pl-14 text-xs outline-none focus:border-blue-400 w-full"/>
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="contact@client.tg"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                  {form.email && !emailValide && (
                    <span className="text-[10px] text-red-500">✗ Format d'email invalide</span>
                  )}
                </div>

                {/* Adresse */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Adresse <span className="text-red-500">*</span>
                  </label>
                  <input value={form.adresse} onChange={(e) => setForm({...form, adresse: e.target.value})}
                    placeholder="Adresse complète"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Ville */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input value={form.ville} onChange={(e) => setForm({...form, ville: e.target.value})}
                    placeholder="ex: Lomé"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Contact principal */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Contact principal</label>
                  <input value={form.contact_principal}
                    onChange={(e) => setForm({...form, contact_principal: e.target.value})}
                    placeholder="Nom du contact"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Fonction */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Fonction</label>
                  <input value={form.fonction_contact}
                    onChange={(e) => setForm({...form, fonction_contact: e.target.value})}
                    placeholder="ex: Directeur Commercial"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  {selected ? 'Mettre à jour' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}