import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getClient, getDossiersClient, getHistoriqueClient } from '../../api/dossiers';
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

const TYPE_EVENEMENT_COLOR = {
  dossier_cree:          'bg-blue-100 text-blue-700',
  changement_statut:     'bg-amber-100 text-amber-700',
  contrat_cree:          'bg-purple-100 text-purple-700',
  contrat_signe_dg:      'bg-green-100 text-green-700',
  contrat_signe_client:  'bg-green-100 text-green-700',
  paiement:              'bg-emerald-100 text-emerald-700',
};

export default function ProfilClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client,     setClient]     = useState(null);
  const [dossiers,   setDossiers]   = useState([]);
  const [historique, setHistorique] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [onglet,     setOnglet]     = useState('dossiers');

  const charger = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        getClient(id), getDossiersClient(id), getHistoriqueClient(id)
      ]);
      setClient(r1.data);
      setDossiers(r2.data);
      setHistorique(r3.data);
    } catch {
      toast.error('Erreur lors du chargement du profil client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [id]);

  if (loading) {
    return (
      <Layout title="Profil client" subtitle="Chargement...">
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout title="Profil client" subtitle="Introuvable">
        <div className="text-center text-gray-400 py-16">Client introuvable</div>
      </Layout>
    );
  }

  const dossiersEnCours  = dossiers.filter(d => d.statut !== 'cloture' && d.statut !== 'archive');
  const dossiersClotures = dossiers.filter(d => d.statut === 'cloture' || d.statut === 'archive');

  return (
    <Layout title={client.nom} subtitle="Profil client">
      <div className="flex flex-col gap-4">

        {/* Bouton retour */}
        <button onClick={() => navigate('/clients')}
          className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 w-fit">
          ← Retour à la liste des clients
        </button>

        {/* Carte profil */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1F3864] flex items-center justify-center text-white text-xl font-bold">
                {client.nom?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{client.nom}</h2>
                <p className="text-sm text-gray-500">{client.ville}, {client.pays}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{dossiers.length}</div>
              <div className="text-xs text-gray-400">dossier{dossiers.length > 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Téléphone</div>
              <div className="text-sm text-gray-700">{client.telephone || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Email</div>
              <div className="text-sm text-gray-700">{client.email || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Adresse</div>
              <div className="text-sm text-gray-700">{client.adresse || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Client depuis</div>
              <div className="text-sm text-gray-700">{client.date_debut}</div>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-1">Dossiers en cours</div>
            <div className="text-2xl font-medium text-blue-700">{dossiersEnCours.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-1">Dossiers clôturés</div>
            <div className="text-2xl font-medium text-green-700">{dossiersClotures.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-1">VIP / Urgent</div>
            <div className="text-2xl font-medium text-yellow-700">
              {dossiers.filter(d => d.classification === 'vip' || d.classification === 'urgent').length}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200 w-fit">
          <button onClick={() => setOnglet('dossiers')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              onglet === 'dossiers' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            📁 Dossiers ({dossiers.length})
          </button>
          <button onClick={() => setOnglet('historique')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              onglet === 'historique' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            🕐 Historique ({historique?.nb_evenements || 0})
          </button>
        </div>

        {/* ── Onglet Dossiers ── */}
        {onglet === 'dossiers' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-800">Dossiers du client</span>
            </div>
            {dossiers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucun dossier pour ce client</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">N° Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Classification</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Mode sortie</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date début</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`/dossiers/${d.id}`)}>
                        {d.numero_dossier}
                      </td>
                      <td className="px-3 py-2 text-gray-500 capitalize">{d.type_transport}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CLASSIF_BADGE[d.classification] || 'bg-gray-100'}`}>
                          {CLASSIF_LABEL[d.classification] || d.classification}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 capitalize">
                        {d.mode_sortie === 'camion' ? '🚚 Camion' : d.mode_sortie === 'depotage' ? '📦 Dépotage' : d.mode_sortie ? d.mode_sortie.replace('_',' ') : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE[d.statut] || 'bg-gray-100'}`}>
                          {d.statut_label || d.statut}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{d.date_debut}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => navigate(`/dossiers/${d.id}`)}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 text-[10px]">
                          👁
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Onglet Historique ── */}
        {onglet === 'historique' && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            {!historique || historique.evenements.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                Aucune activité enregistrée pour ce client
              </div>
            ) : (
              <div className="space-y-1">
                {historique.evenements.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${TYPE_EVENEMENT_COLOR[e.type] || 'bg-gray-100 text-gray-500'}`}>
                        {e.icone}
                      </div>
                      {i < historique.evenements.length - 1 && (
                        <div className="w-0.5 bg-gray-200 flex-1 mt-1 mb-1"/>
                      )}
                    </div>
                    {/* Contenu */}
                    <div className="pb-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">{e.titre}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{e.date}</span>
                      </div>
                      {e.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{e.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => navigate(`/dossiers/${e.dossier_id}`)}
                          className="text-[10px] text-blue-600 hover:underline font-medium">
                          {e.dossier}
                        </button>
                        {e.utilisateur && e.utilisateur !== '—' && (
                          <span className="text-[10px] text-gray-400">· par {e.utilisateur}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}