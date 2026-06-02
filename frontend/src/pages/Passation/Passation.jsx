import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const BADGE = {
  en_attente: 'bg-amber-100 text-amber-800',
  confirme:   'bg-green-100 text-green-800',
  infirme:    'bg-red-100 text-red-800',
};

export default function Passation() {
  const [passations, setPassations] = useState([]);
  const [dossiers,   setDossiers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [form, setForm] = useState({
    dossier: '', statut_douane: 'en_attente',
    date_debut: new Date().toISOString().split('T')[0],
    observations: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [pasRes, dosRes] = await Promise.all([
        api.get('/passation/', { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/dossiers/',  { params: { statut: 'passation' } }),
      ]);
      setPassations(pasRes.data.results || pasRes.data);
      setDossiers(dosRes.data.results   || dosRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Validation : Dossier et Date obligatoires (Observations facultatives)
  const validerFormulaire = () => {
    const erreurs = [];
    if (!form.dossier)    erreurs.push('Le dossier');
    if (!form.date_debut) erreurs.push('La date de passage');

    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validerFormulaire()) return;
    try {
      await api.post('/passation/', form);
      toast.success('Passation créée !');
      setShowModal(false);
      setForm({ dossier: '', statut_douane: 'en_attente', date_debut: new Date().toISOString().split('T')[0], observations: '' });
      fetchData();
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleConfirmer = async (id) => {
    try {
      const res = await api.post(`/passation/${id}/confirmer/`);
      toast.success(res.data.message || 'Passation confirmée — dossier renvoyé au Logistique');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  const handleInfirmer = async (id) => {
    try {
      const res = await api.post(`/passation/${id}/infirmer/`);
      toast.success(res.data.message || 'Passation infirmée — dossier renvoyé au Logistique');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  return (
    <Layout title="Service Passation" subtitle="Validation physique et montage des dossiers">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
            + Nouvelle passation
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Liste des passations</span>
            <span className="text-[10px] text-gray-400">{passations.length} passation(s)</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : passations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucune passation</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut douane</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Conforme</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date début</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date fin</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Traité par</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {passations.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-blue-600">{p.dossier_numero}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE[p.statut_douane] || 'bg-gray-100'}`}>
                        {p.statut_label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.dossier_conforme
                        ? <span className="text-green-600 font-medium">✓ Oui</span>
                        : <span className="text-red-500">✗ Non</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{p.date_debut || '—'}</td>
                    <td className="px-3 py-2 text-gray-400">{p.date_fin   || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{p.traite_par_nom}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {p.statut_douane === 'en_attente' && (
                          <>
                            <button onClick={() => handleConfirmer(p.id)}
                              title="Valider et renvoyer au Logistique pour la phase finale"
                              className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                              Confirmer → Logistique
                            </button>
                            <button onClick={() => handleInfirmer(p.id)}
                              title="Renvoyer au Logistique pour complément"
                              className="h-6 px-2 bg-red-50 text-red-700 rounded text-[10px] border border-red-200 hover:bg-red-100">
                              Infirmer → Logistique
                            </button>
                          </>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[440px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouvelle passation</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 pt-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[10px] text-blue-700">
                ℹ️ Tous les champs marqués d'une étoile <span className="text-red-500">*</span> sont obligatoires.
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-3">
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
                <label className="text-[10px] font-medium text-gray-500 uppercase">Date de passage <span className="text-red-500">*</span></label>
                <input type="date" value={form.date_debut}
                  onChange={(e) => setForm({...form, date_debut: e.target.value})}
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Observations</label>
                <textarea value={form.observations}
                  onChange={(e) => setForm({...form, observations: e.target.value})}
                  className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none resize-none h-16 focus:border-blue-400"/>
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
    </Layout>
  );
}