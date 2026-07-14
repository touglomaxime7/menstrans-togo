import { useState, useEffect } from 'react';
import { getRecapitulatif } from '../../api/dossiers';
import { toast } from 'react-toastify';

const STATUT_COLORS = {
  nouveau:            'bg-purple-100 text-purple-700',
  transit:            'bg-blue-100 text-blue-700',
  logistique_initial: 'bg-amber-100 text-amber-700',
  passation:          'bg-pink-100 text-pink-700',
  logistique_final:   'bg-green-100 text-green-700',
  livraison:          'bg-emerald-100 text-emerald-700',
  cloture:            'bg-gray-100 text-gray-600',
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

function DureeBar({ jours, max }) {
  const pct = max > 0 ? Math.round((jours / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-16 text-right">
        {jours} jour{jours > 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default function RecapitulatifDossier({ dossierId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [onglet,  setOnglet]  = useState('durees');

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await getRecapitulatif(dossierId);
        setData(res.data);
      } catch {
        toast.error('Erreur lors du chargement du récapitulatif');
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [dossierId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!data) return null;

  const maxDuree = Math.max(...(data.duree_par_utilisateur?.map(u => u.duree_jours) || [1]));

  // Compte uniquement les vrais changements de statut pour la carte "Étapes franchies"
  const nbEtapes = data.historique?.filter(h => h.type === 'changement_statut').length || 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Récapitulatif — {data.dossier}</h2>
            <p className="text-sm text-gray-500">{data.client}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6">

          {/* Cartes résumé */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-blue-50 rounded-xl p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.duree_totale_jours}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Durée totale (jours)</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-green-600">{nbEtapes}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Étapes franchies</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-purple-600">{data.nb_fichiers}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Fichiers joints</div>
            </div>
          </div>

          {/* Statut actuel */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-gray-500">Statut actuel :</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[data.statut_actuel] || 'bg-gray-100'}`}>
              {data.statut_actuel}
            </span>
            {data.date_fin && (
              <span className="text-xs text-gray-400 ml-2">
                Clôturé le {new Date(data.date_fin).toLocaleDateString('fr-TG')}
              </span>
            )}
          </div>

          {/* Onglets */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            {[
              { key: 'durees',     label: '⏱ Durées par utilisateur' },
              { key: 'historique', label: `📋 Toute l'activité (${data.historique?.length || 0})` },
              { key: 'fichiers',   label: `📎 Fichiers (${data.nb_fichiers})` },
            ].map(o => (
              <button key={o.key} onClick={() => setOnglet(o.key)}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition ${
                  onglet === o.key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {o.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Durées ── */}
          {onglet === 'durees' && (
            <div className="space-y-3">
              {data.duree_par_utilisateur?.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">Aucun historique disponible</div>
              ) : (
                data.duree_par_utilisateur?.map((u, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1F3864] flex items-center justify-center text-white text-xs font-bold">
                          {u.utilisateur?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{u.utilisateur}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-600">
                        {u.duree_jours} jour{u.duree_jours > 1 ? 's' : ''}
                      </span>
                    </div>
                    <DureeBar jours={u.duree_jours} max={maxDuree} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Onglet Historique complet (toute activité) ── */}
          {onglet === 'historique' && (
            <div className="space-y-2">
              {data.historique?.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">Aucune activité enregistrée</div>
              ) : (
                data.historique?.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${TYPE_COLOR[h.type] || 'bg-blue-100 text-blue-600'}`}>
                        {TYPE_ICONE[h.type] || '•'}
                      </div>
                      {i < data.historique.length - 1 && (
                        <div className="w-0.5 bg-gray-200 flex-1 mt-1"/>
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {h.type === 'changement_statut' ? (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            STATUT_COLORS[h.statut_apres] || 'bg-gray-100 text-gray-600'
                          }`}>
                            {h.statut_label}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-700">
                            {h.statut_label}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{h.date_changement}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Par <strong>{h.utilisateur}</strong>
                        {h.type === 'changement_statut' && h.duree_jours > 0 && (
                          <span className="text-gray-400 ml-1">
                            · {h.duree_jours} jour{h.duree_jours > 1 ? 's' : ''} dans cet état
                          </span>
                        )}
                      </p>
                      {h.commentaire && (
                        <p className="text-[10px] text-gray-400 mt-0.5 italic">{h.commentaire}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Onglet Fichiers ── */}
          {onglet === 'fichiers' && (
            <div className="space-y-2">
              {data.fichiers?.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">Aucun fichier joint à ce dossier</div>
              ) : (
                data.fichiers?.map((f, i) => (
                  <div key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      <div>
                        <p className="text-xs font-medium text-gray-700">{f.nom}</p>
                        <p className="text-[10px] text-gray-400">{f.source} · {f.date}</p>
                      </div>
                    </div>
                    {f.fichier && (
                      <a href={f.fichier} target="_blank" rel="noreferrer"
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        Ouvrir
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}