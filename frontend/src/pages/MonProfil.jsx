import { useState } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

export default function MonProfil() {
  const { utilisateur } = useAuth();
  const [form, setForm] = useState({
    ancien_password: '',
    nouveau_password: '',
    confirmation: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.nouveau_password !== form.confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    const password = form.nouveau_password;
    const erreurs = [];
    if (password.length < 8) erreurs.push('Au moins 8 caractères');
    if (!/[A-Z]/.test(password)) erreurs.push('Une majuscule');
    if (!/[a-z]/.test(password)) erreurs.push('Une minuscule');
    if (!/[0-9]/.test(password)) erreurs.push('Un chiffre');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) erreurs.push('Un caractère spécial');
    
    if (erreurs.length > 0) {
      toast.error('Mot de passe non conforme:\n' + erreurs.join('\n'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/changer-mot-de-passe/', {
        ancien_password: form.ancien_password,
        nouveau_password: form.nouveau_password,
      });
      toast.success('Mot de passe changé avec succès !');
      setForm({ ancien_password: '', nouveau_password: '', confirmation: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Mon Profil" subtitle="Gérer mon compte et mon mot de passe">
      <div className="flex flex-col gap-4 max-w-2xl">

        {/* Informations utilisateur */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-800 mb-4">👤 Mes informations</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-gray-400 uppercase mb-1">Prénom</div>
              <div className="text-sm text-gray-700 font-medium">{utilisateur?.prenom}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase mb-1">Nom</div>
              <div className="text-sm text-gray-700 font-medium">{utilisateur?.nom}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase mb-1">Email</div>
              <div className="text-sm text-gray-700 font-medium">{utilisateur?.email}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase mb-1">Rôle</div>
              <div className="text-sm text-blue-700 font-medium">{utilisateur?.role}</div>
            </div>
          </div>
        </div>

        {/* Changement de mot de passe */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-800 mb-4">🔐 Changer mon mot de passe</div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase">Ancien mot de passe *</label>
              <input type="password" value={form.ancien_password}
                onChange={(e) => setForm({...form, ancien_password: e.target.value})}
                placeholder="Mot de passe actuel"
                className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase">Nouveau mot de passe *</label>
              <input type="password" value={form.nouveau_password}
                onChange={(e) => setForm({...form, nouveau_password: e.target.value})}
                placeholder="ex: Menstrans@2026"
                className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>

              {form.nouveau_password && (
                <div className="bg-gray-50 rounded-md p-2 mt-1 border border-gray-200">
                  <div className="text-[10px] text-gray-500 mb-1 font-medium">Critères de sécurité :</div>
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className={`text-[10px] flex items-center gap-1 ${form.nouveau_password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{form.nouveau_password.length >= 8 ? '✓' : '✗'}</span>
                      <span>8 caractères min</span>
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 ${/[A-Z]/.test(form.nouveau_password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{/[A-Z]/.test(form.nouveau_password) ? '✓' : '✗'}</span>
                      <span>Une majuscule</span>
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 ${/[a-z]/.test(form.nouveau_password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{/[a-z]/.test(form.nouveau_password) ? '✓' : '✗'}</span>
                      <span>Une minuscule</span>
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 ${/[0-9]/.test(form.nouveau_password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{/[0-9]/.test(form.nouveau_password) ? '✓' : '✗'}</span>
                      <span>Un chiffre</span>
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 col-span-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.nouveau_password) ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.nouveau_password) ? '✓' : '✗'}</span>
                      <span>Un caractère spécial (!@#$%...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase">Confirmer le nouveau mot de passe *</label>
              <input type="password" value={form.confirmation}
                onChange={(e) => setForm({...form, confirmation: e.target.value})}
                placeholder="Retapez le nouveau mot de passe"
                className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              {form.confirmation && form.nouveau_password !== form.confirmation && (
                <div className="text-[10px] text-red-500 mt-1">✗ Les mots de passe ne correspondent pas</div>
              )}
              {form.confirmation && form.nouveau_password === form.confirmation && (
                <div className="text-[10px] text-green-600 mt-1">✓ Les mots de passe correspondent</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading}
                className="h-9 px-5 bg-[#1F3864] text-white rounded-md text-sm font-medium hover:bg-[#2E5FA3] disabled:opacity-50">
                {loading ? 'Changement...' : '🔐 Changer le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}