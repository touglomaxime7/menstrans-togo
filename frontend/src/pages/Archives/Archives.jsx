import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function Archives() {
  const { t } = useLanguage();
  const [archives,  setArchives]  = useState([]);
  const [dossiers,  setDossiers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    dossier: '', reference_physique: '',
    emplacement_numerique: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [arcRes, dosRes] = await Promise.all([
        api.get('/archives/'),
        api.get('/dossiers/', { params: { statut: 'cloture' } }),
      ]);
      setArchives(arcRes.data.results || arcRes.data);
      setDossiers(dosRes.data.results || dosRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/archives/', form);
      toast.success('Dossier archivé !');
      setShowModal(false);
      setForm({ dossier: '', reference_physique: '', emplacement_numerique: '' });
      fetchData();
    } catch {
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const filtered = archives.filter(a =>
    !search ||
    a.dossier_numero?.toLowerCase().includes(search.toLowerCase()) ||
    a.reference_physique?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title={t('archives_titre')} subtitle={`${archives.length} ${t('dossiers_archives_suffix')}`}>
      <div className="flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total archivés',  value: archives.length,                                    bg: 'bg-gray-50' },
            { label: 'Ce mois',         value: archives.filter(a => {
                const d = new Date(a.date_debut);
                const n = new Date();
                return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
              }).length,                                                                              bg: 'bg-blue-50' },
            { label: 'À archiver',      value: dossiers.length,                                    bg: 'bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 border border-gray-200`}>
              <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
              <div className="text-2xl font-medium text-gray-700">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('rechercher_archive')}
              className="h-8 pl-7 pr-3 border border-gray-200 rounded-md text-xs outline-none w-64 focus:border-blue-400"/>
          </div>
          <button onClick={() => setShowModal(true)}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3] btn-hover shadow-sm">
            + Archiver un dossier
          </button>
        </div>

        {/* Tableau */}
        <div className="elegant-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Dossiers archivés</span>
            <span className="text-[10px] text-gray-400">{filtered.length} dossier(s)</span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-ink-400 text-sm">{t('chargement')}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-ink-400 text-sm">{t('aucun_dossier_archive')}</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="elegant-th">{t('numero_dossier')}</th>
                  <th className="elegant-th">{t('date_archivage')}</th>
                  <th className="elegant-th">{t('ref_physique')}</th>
                  <th className="elegant-th">{t('emplacement_numerique')}</th>
                  <th className="elegant-th">{t('archive_par')}</th>
                  <th className="elegant-th">{t('actions_label')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-blue-600">{a.dossier}</td>
                    <td className="px-3 py-2 text-gray-400">{a.date_debut}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{a.reference_physique || '—'}</td>
                    <td className="px-3 py-2 text-gray-400 text-[10px]">{a.emplacement_numerique || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{a.archive_par}</td>
                    <td className="px-3 py-2">
                      <button className="h-6 px-2 bg-gray-50 text-gray-600 rounded text-[10px] border border-gray-200 hover:bg-gray-100">
                        👁 Consulter
                      </button>
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
          <div className="bg-white rounded-xl w-[440px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Archiver un dossier clôturé</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier clôturé *</label>
                <select value={form.dossier} onChange={(e) => setForm({...form, dossier: e.target.value})}
                  className="h-9 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-blue-400">
                  <option value="">Sélectionner...</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero_dossier} — {d.client_nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Référence physique</label>
                <input value={form.reference_physique}
                  onChange={(e) => setForm({...form, reference_physique: e.target.value})}
                  placeholder={t('ref_placeholder')}
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Emplacement numérique</label>
                <input value={form.emplacement_numerique}
                  onChange={(e) => setForm({...form, emplacement_numerique: e.target.value})}
                  placeholder={t('emplacement_placeholder')}
                  className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-ink-200 rounded-md text-xs text-ink-500 hover:bg-ink-50 transition-colors">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3] btn-hover shadow-sm">
                  Archiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}