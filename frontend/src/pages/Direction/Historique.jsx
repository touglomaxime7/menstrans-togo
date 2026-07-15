import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getDossiers, getRecapitulatif } from '../../api/dossiers';
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

const TYPE_ICONE = {
  changement_statut:       '🔄',
  document_ajoute:         '📄',
  document_contrat_ajoute: '📎',
  contrat_cree:            '📝',
  contrat_signe_dg:        '✍️',
  contrat_signe_client:    '✍️',
  paiement:                '💰',
};

const TYPE_COLOR = {
  changement_statut:       'bg-blue-100 text-blue-600',
  document_ajoute:         'bg-indigo-100 text-indigo-600',
  document_contrat_ajoute: 'bg-indigo-100 text-indigo-600',
  contrat_cree:            'bg-purple-100 text-purple-600',
  contrat_signe_dg:        'bg-green-100 text-green-600',
  contrat_signe_client:    'bg-green-100 text-green-600',
  paiement:                'bg-emerald-100 text-emerald-600',
};

export default function Historique() {
  const navigate = useNavigate();
  const [dossiers,   setDossiers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filtre,     setFiltre]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [recap,      setRecap]      = useState(null);
  const [loadRecap,  setLoadRecap]  = useState(false);

  useEffect(() => {
    const charger = async () => {
      setLoading(true);
      try {
        const res = await getDossiers();
        setDossiers(res.data.results || res.data);
      } catch {
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  const voirHistorique = async (dossier) => {
    setSelected(dossier);
    setRecap(null);
    setLoadRecap(true);
    try {
      const res = await getRecapitulatif(dossier.id);
      setRecap(res.data);
    } catch {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoadRecap(false);
    }
  };

  const filtered = dossiers.filter(d => {
    const matchSearch = !search ||
      d.numero_dossier.toLowerCase().includes(search.toLowerCase()) ||
      d.client_nom.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = !filtre || d.statut === filtre;
    return matchSearch && matchFiltre;
  });

  return (
    <Layout title="Historique des dossiers" subtitle="Vue directeur — Suivi complet">
      <div className="flex gap-4 h-full">

        {/* Colonne gauche — Liste des dossiers */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">

          {/* Recherche */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un dossier..."
              className="w-full h-8 pl-7 pr-3 border border-gray-200 rounded-md text-xs outline-none focus:border-blue-400"/>
          </div>

          {/* Filtre statut */}
          <select value={filtre} onChange={e => setFiltre(e.target.value)}
            className="h-8 border border-gray-200 rounded-md text-xs px-2 outline-none">
            <option value="">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="transit">Transit</option>
            <option value="logistique_initial">Logistique initiale</option>
            <option value="passation">Passation</option>
            <option value="logistique_final">Logistique finale</option>
            <option value="livraison">Livraison</option>
            <option value="cloture">Clôturé</option>
          </select>

          {/* Liste */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-220px)]">
            {loading ? (
              <div className="text-center text-gray-400 text-xs py-8">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-8">Aucun dossier</div>
            ) : (
              filtered.map(d => (
                <div key={d.id}
                  onClick={() => voirHistorique(d)}
                  className={`bg-white border rounded-lg px-3 py-2.5 cursor-pointer transition hover:shadow-sm ${
                    selected?.id === d.id ? 'border-blue-400 shadow-sm' : 'border-gray-200 hover:border-blue-200'
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-700">{d.numero_dossier}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${BADGE[d.statut] || 'bg-gray-100'}`}>
                      {d.statut_label || d.statut}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500">{d.client_nom}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{d.date_debut}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne droite — Historique du dossier sélectionné */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <span className="text-4xl">📋</span>
              <p className="text-sm">Sélectionnez un dossier pour voir son historique</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">{selected.numero_dossier}</h2>
                    <p className="text-xs text-gray-500">{selected.client_nom} · {selected.type_transport}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE[selected.statut] || 'bg-gray-100'}`}>
                      {selected.statut_label || selected.statut}
                    </span>
                    <button onClick={() => navigate(`/dossiers/${selected.id}`)}
                      className="h-7 px-3 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200 hover:bg-blue-100">
                      Voir le dossier →
                    </button>
                  </div>
                </div>

                {/* Stats rapides */}
                {recap && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                      <div className="text-lg font-bold text-blue-600">{recap.duree_totale_jours}</div>
                      <div className="text-[10px] text-gray-400">Jours total</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {recap.historique?.filter(h => h.type === 'changement_statut').length || 0}
                      </div>
                      <div className="text-[10px] text-gray-400">Étapes</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                      <div className="text-lg font-bold text-purple-600">{recap.nb_fichiers}</div>
                      <div className="text-[10px] text-gray-400">Fichiers</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Corps — Timeline */}
              <div className="flex-1 overflow-y-auto p-5">
                {loadRecap ? (
                  <div className="text-center text-gray-400 text-sm py-8">Chargement de l'historique...</div>
                ) : !recap ? null : recap.historique?.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    Aucune activité enregistrée pour ce dossier
                  </div>
                ) : (
                  <div>
                    {/* Durées par utilisateur */}
                    {recap.duree_par_utilisateur?.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                          ⏱ Durée par utilisateur
                        </h3>
                        <div className="space-y-2">
                          {recap.duree_par_utilisateur.map((u, i) => {
                            const max = Math.max(...recap.duree_par_utilisateur.map(x => x.duree_jours));
                            const pct = max > 0 ? Math.round((u.duree_jours / max) * 100) : 0;
                            return (
                              <div key={i} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-medium text-gray-700">{u.utilisateur}</span>
                                  <span className="text-xs font-bold text-blue-600">{u.duree_jours}j</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }}/>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Timeline complète */}
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      📋 Toute l'activité
                    </h3>
                    <div className="space-y-1">
                      {recap.historique.map((h, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${TYPE_COLOR[h.type] || 'bg-blue-100 text-blue-600'}`}>
                              {TYPE_ICONE[h.type] || '•'}
                            </div>
                            {i < recap.historique.length - 1 && (
                              <div className="w-0.5 bg-gray-200 flex-1 mt-1"/>
                            )}
                          </div>
                          <div className="pb-3 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-gray-700">{h.statut_label}</span>
                              <span className="text-[10px] text-gray-400">{h.date_changement}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Par <strong>{h.utilisateur}</strong>
                              {h.type === 'changement_statut' && h.duree_jours > 0 && (
                                <span className="text-gray-400 ml-1">· {h.duree_jours}j dans cet état</span>
                              )}
                            </p>
                            {h.commentaire && (
                              <p className="text-[10px] text-gray-400 mt-0.5 italic">{h.commentaire}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fichiers */}
                    {recap.fichiers?.length > 0 && (
                      <div className="mt-5">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                          📎 Fichiers joints ({recap.nb_fichiers})
                        </h3>
                        <div className="space-y-2">
                          {recap.fichiers.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <div className="flex items-center gap-2">
                                <span>📄</span>
                                <div>
                                  <p className="text-xs font-medium text-gray-700">{f.nom}</p>
                                  <p className="text-[10px] text-gray-400">{f.source} · {f.date}</p>
                                </div>
                              </div>
                              {f.fichier && (
                                <a href={f.fichier} target="_blank" rel="noreferrer"
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                  Ouvrir
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}