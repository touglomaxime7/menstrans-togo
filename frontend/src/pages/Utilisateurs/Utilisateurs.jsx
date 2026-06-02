import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const BADGE_ROLE = {
  admin:               'bg-purple-100 text-purple-700',
  direction:           'bg-blue-100 text-blue-700',
  assistant_directeur: 'bg-purple-100 text-purple-700',
  transit:             'bg-green-100 text-green-700',
  passation:           'bg-amber-100 text-amber-700',
  logistique:          'bg-emerald-100 text-emerald-700',
  caisse:              'bg-red-100 text-red-700',
  comptabilite:        'bg-indigo-100 text-indigo-700',
  chauffeur:           'bg-orange-100 text-orange-700',
};

const ROLES = [
  { value: 'direction',           label: 'Direction Générale' },
  { value: 'assistant_directeur', label: 'Assistant Directeur' },
  { value: 'transit',             label: 'Service Transit' },
  { value: 'passation',           label: 'Service Passation' },
  { value: 'logistique',          label: 'Service Logistique' },
  { value: 'caisse',              label: 'Service Caisse' },
  { value: 'comptabilite',        label: 'Comptabilité' },
  { value: 'chauffeur',           label: 'Chauffeur' },
];

export default function Utilisateurs() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '',
    role: 'transit', password: '', actif: true,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/utilisateurs/');
      setUsers(res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validation du mot de passe (uniquement pour nouveau compte)
    if (!selected) {
      if (!form.password) {
        toast.error('Le mot de passe est obligatoire');
        return;
      }
      
      const password = form.password;
      const erreurs = [];
      
      if (password.length < 8) {
        erreurs.push('Au moins 8 caractères');
      }
      if (!/[A-Z]/.test(password)) {
        erreurs.push('Au moins une majuscule (A-Z)');
      }
      if (!/[a-z]/.test(password)) {
        erreurs.push('Au moins une minuscule (a-z)');
      }
      if (!/[0-9]/.test(password)) {
        erreurs.push('Au moins un chiffre (0-9)');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        erreurs.push('Au moins un caractère spécial (!@#$%^&*...)');
      }
      
      if (erreurs.length > 0) {
        toast.error('Mot de passe non conforme:\n' + erreurs.join('\n'));
        return;
      }
    }
    
    try {
      if (selected) {
        await api.patch(`/auth/utilisateurs/${selected.id}/`, {
          nom: form.nom, prenom: form.prenom,
          role: form.role, actif: form.actif,
        });
        toast.success('Utilisateur mis à jour !');
      } else {
        await api.post('/auth/register/', form);
        toast.success('Compte créé !');
      }
      setShowModal(false);
      setSelected(null);
      setForm({ nom: '', prenom: '', email: '', role: 'transit', password: '', actif: true });
      fetchUsers();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (user) => {
    setSelected(user);
    setForm({
      nom: user.nom, prenom: user.prenom,
      email: user.email, role: user.role,
      password: '', actif: user.actif,
    });
    setShowModal(true);
  };

  const handleToggleActif = async (user) => {
    try {
      await api.patch(`/auth/utilisateurs/${user.id}/`, { actif: !user.actif });
      toast.success(user.actif ? 'Compte désactivé' : 'Compte activé');
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const initiales = (u) => `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();

  return (
    <Layout title="Gestion des Utilisateurs" subtitle={`${users.length} comptes`}>
      <div className="flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex justify-end">
          <button onClick={() => { setSelected(null); setForm({ nom: '', prenom: '', email: '', role: 'transit', password: '', actif: true }); setShowModal(true); }}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
            + Nouveau compte
          </button>
        </div>

        {/* Grille utilisateurs */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                      {initiales(u)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{u.prenom} {u.nom}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{u.email}</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1 ${u.actif ? 'bg-green-500' : 'bg-red-400'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_ROLE[u.role] || 'bg-gray-100'}`}>
                    {u.role}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(u)}
                      className="h-6 px-2 border border-gray-200 rounded text-[10px] text-gray-500 hover:bg-gray-50">
                      ✏️ Modifier
                    </button>
                    <button onClick={() => handleToggleActif(u)}
                      className={`h-6 px-2 rounded text-[10px] border ${
                        u.actif
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      }`}>
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-400">
                  Depuis le {u.date_debut}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[480px] max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">
                {selected ? 'Modifier le compte' : 'Nouveau compte'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Prénom *</label>
                  <input value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})}
                    placeholder="Prénom"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Nom *</label>
                  <input value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})}
                    placeholder="Nom de famille"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Email *</label>
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="prenom.nom@menstrans.tg"
                    disabled={!!selected}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400 disabled:bg-gray-50"/>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Rôle *</label>
                  <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {!selected && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">Mot de passe *</label>
                    <input type="password" value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      placeholder="ex: Menstrans@2026"
                      className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                    
                    {/* Indicateurs de validation */}
                    {form.password && (
                      <div className="bg-gray-50 rounded-md p-2 mt-1 border border-gray-200">
                        <div className="text-[10px] text-gray-500 mb-1 font-medium">Le mot de passe doit contenir :</div>
                        <div className="flex flex-col gap-0.5">
                          <div className={`text-[10px] flex items-center gap-1 ${form.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{form.password.length >= 8 ? '✓' : '✗'}</span>
                            <span>Au moins 8 caractères</span>
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${/[A-Z]/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{/[A-Z]/.test(form.password) ? '✓' : '✗'}</span>
                            <span>Une majuscule (A-Z)</span>
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${/[a-z]/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{/[a-z]/.test(form.password) ? '✓' : '✗'}</span>
                            <span>Une minuscule (a-z)</span>
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${/[0-9]/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{/[0-9]/.test(form.password) ? '✓' : '✗'}</span>
                            <span>Un chiffre (0-9)</span>
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? '✓' : '✗'}</span>
                            <span>Un caractère spécial (!@#$%^&*...)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  {selected ? 'Mettre à jour' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}