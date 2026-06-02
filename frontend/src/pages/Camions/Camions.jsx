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

export default function Camions() {
  const [camions,    setCamions]    = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [form, setForm] = useState({
    immatriculation: '', marque: '', modele: '',
    type_camion: 'porteur', capacite_tonnes: '',
    chauffeur: '',                       // ID du compte chauffeur
    nom_chauffeur: '', telephone_chauffeur: '',
    statut: 'disponible', notes: '',
  });

  const fetchCamions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/camions/');
      setCamions(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des camions');
    } finally {
      setLoading(false);
    }
  };

  const fetchChauffeurs = async () => {
    try {
      const res = await api.get('/auth/utilisateurs/');
      const tous = res.data.results || res.data || [];
      // On ne garde que les utilisateurs avec le rôle "chauffeur" et actifs
      setChauffeurs(tous.filter(u => u.role === 'chauffeur' && u.actif));
    } catch {
      // Pas grave si on ne récupère pas la liste — on prévient seulement
      console.warn('Impossible de charger la liste des chauffeurs');
    }
  };

  useEffect(() => {
    fetchCamions();
    fetchChauffeurs();
  }, []);

  // Quand on sélectionne un chauffeur dans le menu déroulant,
  // on pré-remplit automatiquement le nom et le téléphone (s'ils sont vides).
  const handleChauffeurChange = (chauffeurId) => {
    if (!chauffeurId) {
      setForm({ ...form, chauffeur: '' });
      return;
    }
    const u = chauffeurs.find(c => String(c.id) === String(chauffeurId));
    setForm({
      ...form,
      chauffeur: chauffeurId,
      nom_chauffeur: u ? `${u.prenom} ${u.nom}` : form.nom_chauffeur,
      telephone_chauffeur: u && u.telephone ? u.telephone : form.telephone_chauffeur,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // On envoie chauffeur=null si rien n'est sélectionné
      const payload = { ...form, chauffeur: form.chauffeur || null };
      if (selected) {
        await api.patch(`/camions/${selected.id}/`, payload);
        toast.success('Camion mis à jour !');
      } else {
        await api.post('/camions/', payload);
        toast.success('Camion ajouté !');
      }
      setShowModal(false);
      setSelected(null);
      setForm({ immatriculation: '', marque: '', modele: '', type_camion: 'porteur',
        capacite_tonnes: '', chauffeur: '', nom_chauffeur: '', telephone_chauffeur: '',
        statut: 'disponible', notes: '' });
      fetchCamions();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (camion) => {
    setSelected(camion);
    setForm({
      immatriculation:     camion.immatriculation,
      marque:              camion.marque,
      modele:              camion.modele,
      type_camion:         camion.type_camion,
      capacite_tonnes:     camion.capacite_tonnes || '',
      chauffeur:           camion.chauffeur || '',
      nom_chauffeur:       camion.nom_chauffeur,
      telephone_chauffeur: camion.telephone_chauffeur,
      statut:              camion.statut,
      notes:               camion.notes,
    });
    setShowModal(true);
  };

  const handleChangerStatut = async (id, statut) => {
    try {
      await api.post(`/camions/${id}/changer_statut/`, { statut });
      toast.success('Statut mis à jour !');
      fetchCamions();
    } catch { toast.error('Erreur'); }
  };

  const stats = {
    total:          camions.length,
    disponibles:    camions.filter(c => c.statut === 'disponible').length,
    en_mission:     camions.filter(c => c.statut === 'en_mission').length,
    en_maintenance: camions.filter(c => c.statut === 'en_maintenance').length,
  };

  return (
    <Layout title="Gestion des Camions" subtitle={`${stats.total} camions dans le parc`}>
      <div className="flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',          value: stats.total,          bg: 'bg-gray-50',   color: 'text-gray-700' },
            { label: 'Disponibles',    value: stats.disponibles,    bg: 'bg-green-50',  color: 'text-green-700' },
            { label: 'En mission',     value: stats.en_mission,     bg: 'bg-blue-50',   color: 'text-blue-700' },
            { label: 'En maintenance', value: stats.en_maintenance, bg: 'bg-amber-50',  color: 'text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 border border-gray-200`}>
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex justify-end">
          <button onClick={() => { setSelected(null); setShowModal(true); }}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
            + Ajouter un camion
          </button>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Parc de camions</span>
            <span className="text-[10px] text-gray-400">{camions.length} camion(s)</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : camions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun camion enregistré</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Immatriculation</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Marque / Modèle</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Capacité</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Chauffeur attitré</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Téléphone</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {camions.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-blue-600">{c.immatriculation}</td>
                    <td className="px-3 py-2 text-gray-700">{c.marque} {c.modele}</td>
                    <td className="px-3 py-2 text-gray-500">{c.type_label}</td>
                    <td className="px-3 py-2 text-gray-500">{c.capacite_tonnes ? `${c.capacite_tonnes} T` : '—'}</td>
                    <td className="px-3 py-2">
                      {c.chauffeur_nom ? (
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">{c.chauffeur_nom}</span>
                          <span className="text-[9px] text-green-600">✓ Compte lié</span>
                        </div>
                      ) : c.nom_chauffeur ? (
                        <div className="flex flex-col">
                          <span className="text-gray-700">{c.nom_chauffeur}</span>
                          <span className="text-[9px] text-gray-400">Sans compte</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{c.telephone_chauffeur || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_STATUT[c.statut] || 'bg-gray-100'}`}>
                        {c.statut_label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(c)}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 text-[10px]">
                          ✏️
                        </button>
                        {c.statut === 'disponible' && (
                          <button onClick={() => handleChangerStatut(c.id, 'en_maintenance')}
                            className="h-6 px-2 bg-amber-50 text-amber-700 rounded text-[10px] border border-amber-200 hover:bg-amber-100">
                            Maintenance
                          </button>
                        )}
                        {c.statut === 'en_maintenance' && (
                          <button onClick={() => handleChangerStatut(c.id, 'disponible')}
                            className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                            Disponible
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[520px] border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">
                {selected ? 'Modifier le camion' : 'Ajouter un camion'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-3">

              {/* Section 1 : Identité du camion */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Immatriculation *</label>
                  <input value={form.immatriculation}
                    onChange={(e) => setForm({...form, immatriculation: e.target.value})}
                    placeholder="ex: TG 4892 LM"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Type</label>
                  <select value={form.type_camion}
                    onChange={(e) => setForm({...form, type_camion: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="porteur">Porteur</option>
                    <option value="semi_remorque">Semi-remorque</option>
                    <option value="plateau">Plateau</option>
                    <option value="frigorifique">Frigorifique</option>
                    <option value="citerne">Citerne</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Marque</label>
                  <input value={form.marque}
                    onChange={(e) => setForm({...form, marque: e.target.value})}
                    placeholder="ex: Mercedes"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Modèle</label>
                  <input value={form.modele}
                    onChange={(e) => setForm({...form, modele: e.target.value})}
                    placeholder="ex: Actros 2545"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Capacité (tonnes)</label>
                  <input type="number" value={form.capacite_tonnes}
                    onChange={(e) => setForm({...form, capacite_tonnes: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Statut</label>
                  <select value={form.statut}
                    onChange={(e) => setForm({...form, statut: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="disponible">Disponible</option>
                    <option value="en_mission">En mission</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="indisponible">Indisponible</option>
                  </select>
                </div>
              </div>

              {/* Section 2 : Affectation du chauffeur */}
              <div className="border-t border-gray-100 pt-3 mt-1">
                <div className="text-[11px] font-medium text-gray-700 mb-2">👤 Chauffeur attitré</div>

                <div className="flex flex-col gap-1 mb-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">
                    Sélectionner un compte chauffeur
                  </label>
                  <select value={form.chauffeur || ''}
                    onChange={(e) => handleChauffeurChange(e.target.value)}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    <option value="">— Aucun compte chauffeur lié —</option>
                    {chauffeurs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom} ({c.email})
                      </option>
                    ))}
                  </select>
                  {chauffeurs.length === 0 && (
                    <span className="text-[10px] text-amber-600 mt-1">
                      ⚠️ Aucun compte chauffeur n'est encore créé. Vous pouvez en créer dans le menu Utilisateurs.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">Nom (affichage)</label>
                    <input value={form.nom_chauffeur}
                      onChange={(e) => setForm({...form, nom_chauffeur: e.target.value})}
                      placeholder="Pré-rempli si compte sélectionné"
                      className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">Téléphone</label>
                    <input value={form.telephone_chauffeur}
                      onChange={(e) => setForm({...form, telephone_chauffeur: e.target.value})}
                      placeholder="+228 XX XX XX XX"
                      className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Notes</label>
                <textarea value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none resize-none h-14 focus:border-blue-400"/>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  {selected ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}