import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getDossier } from '../../api/dossiers';
import RecapitulatifDossier from './RecapitulatifDossier';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

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

const BADGE_DOC = {
  en_attente:    'bg-amber-100 text-amber-800',
  en_traitement: 'bg-blue-100 text-blue-800',
  valide:        'bg-green-100 text-green-800',
  rejete:        'bg-red-100 text-red-800',
  archive:       'bg-gray-100 text-gray-600',
};

const ETAPES = [
  { label: 'Ouverture',     value: 'nouveau' },
  { label: 'Transit',       value: 'transit' },
  { label: 'Log. initiale', value: 'logistique_initial' },
  { label: 'Passation',     value: 'passation' },
  { label: 'Log. finale',   value: 'logistique_final' },
  { label: 'Livraison',     value: 'livraison' },
  { label: 'Clôture',       value: 'cloture' },
];

const ORDRE = ['nouveau', 'transit', 'logistique_initial', 'passation',
               'logistique_final', 'livraison', 'cloture'];

const WORKFLOW = {
  nouveau:            { next: 'transit',            roles: ['admin', 'direction', 'assistant_directeur'], next_label: 'Transit' },
  transit:            { next: 'logistique_initial', roles: ['admin', 'direction', 'transit'],              next_label: 'Logistique' },
  logistique_initial: { next: 'passation',          roles: ['admin', 'direction', 'logistique'],           next_label: 'Passation' },
  passation:          { next: 'logistique_final',   roles: ['admin', 'direction', 'passation'],            next_label: 'Logistique (phase finale)' },
  logistique_final:   { next: 'livraison',          roles: ['admin', 'direction', 'logistique'],           next_label: 'Livraison' },
  livraison:          { next: 'cloture',            roles: ['admin', 'direction', 'logistique'],           next_label: 'Clôture' },
  cloture:            { next: null,                 roles: [],                                              next_label: '' },
};

const WORKFLOW_INFIRMER = {
  logistique_initial: { precedent: 'transit',            roles: ['admin', 'direction', 'logistique'], precedent_label: 'Transit' },
  passation:          { precedent: 'logistique_initial', roles: ['admin', 'direction', 'passation'],  precedent_label: 'Logistique (phase initiale)' },
  logistique_final:   { precedent: 'passation',          roles: ['admin', 'direction', 'logistique'], precedent_label: 'Passation' },
  livraison:          { precedent: 'logistique_final',   roles: ['admin', 'direction', 'logistique'], precedent_label: 'Logistique (phase finale)' },
};

export default function DetailDossier() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { utilisateur } = useAuth();
  const [dossier,   setDossier]   = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showRecap, setShowRecap] = useState(false);

  const fetchDossier = async () => {
    try {
      const resDossier = await getDossier(id);
      setDossier(resDossier.data);
      try {
        const resDocs = await api.get('/documents/');
        const allDocs = resDocs.data.results || resDocs.data;
        setDocuments(allDocs.filter(d => d.dossier == id));
      } catch { setDocuments([]); }
    } catch {
      toast.error('Erreur lors du chargement du dossier');
      navigate('/dossiers');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDossier(); }, [id]);

const handleEnvoyerEtapeSuivante = async () => {
    const workflow = WORKFLOW[dossier?.statut];
    if (!workflow?.next) { toast.error('Dernière étape atteinte'); return; }
    if (!window.confirm(`Envoyer ce dossier au service ${workflow.next_label} ?`)) return;
    try {
      await api.post(`/dossiers/${id}/changer_statut/`, {
        statut:      workflow.next,
        commentaire: `Envoyé au service ${workflow.next_label}`,
      });
      toast.success(`Dossier envoyé au service ${workflow.next_label} !`);
      fetchDossier();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === 'contrat_non_valide') {
        toast.error(
          `⚠️ Contrat non validé ! Le contrat ${data.contrat_numero} doit être validé avant d'envoyer au Transit.`,
          { autoClose: 6000 }
        );
        if (window.confirm(`Le contrat ${data.contrat_numero} n'est pas encore validé.\n\nVoulez-vous aller sur la page Contrats pour le valider ?`)) {
          navigate('/contrats');
        }
      } else if (data?.code === 'contrat_absent') {
        toast.error(
          "⚠️ Aucun contrat ! Vous devez créer et valider un contrat avant d'envoyer au Transit.",
          { autoClose: 6000 }
        );
        if (window.confirm("Aucun contrat n'existe pour ce dossier.\n\nVoulez-vous aller sur la page Contrats pour en créer un ?")) {
          navigate('/contrats');
        }
      } else {
        toast.error(data?.error || "Erreur lors de l'envoi");
      }
    }
  };   


  const handleAnnuler = async () => {
    const workflow = WORKFLOW_ANNULER[dossier?.statut];
    if (!workflow) { toast.error("Impossible d'annuler"); return; }
    const motif = prompt("Motif de l'annulation :");
    if (!motif) return;
    if (!window.confirm(`Renvoyer au service ${workflow.precedent_label} ?\nMotif: ${motif}`)) return;
    try {
      const dateNow = new Date().toLocaleString('fr-FR');
      await api.post(`/dossiers/${id}/changer_statut/`, {
        statut: workflow.precedent,
        commentaire: `[INFIRMÉ par ${utilisateur?.prenom} ${utilisateur?.nom} le ${dateNow}] ${motif}`,
      });
      toast.success(`Annulation — Dossier renvoyé au service ${workflow.precedent_label}`);
      fetchDossier();
    } catch { toast.error("Erreur lors de l'infirmation"); }
  };

  const handleTelechargerDocument = async (doc) => {
    try {
      const res  = await api.get(`/documents/${doc.id}/telecharger/`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', doc.nom_fichier);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Téléchargement démarré');
    } catch { toast.error('Erreur lors du téléchargement'); }
  };

  const handleExportPDF = async () => {
    try {
      toast.info('Génération du PDF...');
      const res  = await api.get(`/dossiers/${dossier.id}/export_pdf/`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `Dossier_${dossier.numero_dossier}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF téléchargé !');
    } catch { toast.error("Erreur lors de l'export PDF"); }
  };

  const peutEnvoyer  = () => dossier && utilisateur &&
    WORKFLOW[dossier.statut]?.next &&
    WORKFLOW[dossier.statut].roles.includes(utilisateur.role);
  const peutInfirmer = () => dossier && utilisateur &&
    WORKFLOW_INFIRMER[dossier.statut] &&
    WORKFLOW_INFIRMER[dossier.statut].roles.includes(utilisateur.role);

  if (loading) return (
    <Layout title="Chargement...">
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement...</div>
    </Layout>
  );
  if (!dossier) return null;

  const statutIndex = ORDRE.indexOf(dossier.statut);
  const conteneur   = dossier.conteneur;

  return (
    <Layout title={`Dossier ${dossier.numero_dossier}`}
      subtitle={`${dossier.client_nom} · ${dossier.type_transport}`}>
      <div className="flex flex-col gap-4">

        {showRecap && (
          <RecapitulatifDossier dossierId={dossier.id} onClose={() => setShowRecap(false)}/>
        )}

        {/* Boutons */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dossiers')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            ← Retour aux dossiers
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowRecap(true)}
              className="h-9 px-4 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-sm font-medium hover:bg-indigo-100">
              ⏱ Récapitulatif
            </button>
            {peutInfirmer() && (
              <button onClick={handleInfirmer}
                className="h-9 px-4 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
                ↩ Infirmer (→ {WORKFLOW_INFIRMER[dossier.statut]?.precedent_label})
              </button>
            )}
            {peutEnvoyer() && (
              <button onClick={handleEnvoyerEtapeSuivante}
                className="h-9 px-5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">
                ➤ Envoyer au service {WORKFLOW[dossier.statut]?.next_label}
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-lg font-medium text-gray-800">{dossier.numero_dossier}</div>
              <div className="text-sm text-gray-400 mt-1">
                {dossier.client_nom} · {dossier.type_transport}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE[dossier.statut] || 'bg-gray-100'}`}>
                {ETAPES.find(x => x.value === dossier.statut)?.label || dossier.statut}
              </span>
              <button onClick={() => window.print()}
                className="h-8 px-3 border border-gray-200 rounded-md text-xs text-gray-500 hover:bg-gray-50">
                🖨️ Imprimer
              </button>
              <button onClick={handleExportPDF}
                className="h-8 px-3 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                📄 Exporter PDF
              </button>
            </div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Date ouverture',   value: dossier.date_debut },
              { label: 'Date clôture',     value: dossier.date_fin || '—' },
              { label: 'Type transport',   value: dossier.type_transport },
              { label: 'Classification',   value: dossier.classification || '—' },
              { label: 'Mode sortie',      value: dossier.mode_sortie || '—' },
            ].map((info) => (
              <div key={info.label} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{info.label}</div>
                <div className="text-xs font-medium text-gray-700 capitalize">{info.value}</div>
              </div>
            ))}
          </div>

          {/* Barre progression */}
          <div className="flex items-center">
            {ETAPES.map((etape, index) => {
              const isDone   = ORDRE.indexOf(etape.value) < statutIndex;
              const isActive = etape.value === dossier.statut;
              const isWait   = ORDRE.indexOf(etape.value) > statutIndex;
              return (
                <div key={etape.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                      ${isDone   ? 'bg-green-500 text-white' : ''}
                      ${isActive ? 'bg-[#1F3864] text-white ring-2 ring-blue-200' : ''}
                      ${isWait   ? 'bg-gray-100 text-gray-400' : ''}
                    `}>
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div className={`text-[9px] mt-1 font-medium whitespace-nowrap
                      ${isDone   ? 'text-green-600'  : ''}
                      ${isActive ? 'text-[#1F3864]'  : ''}
                      ${isWait   ? 'text-gray-400'   : ''}
                    `}>{etape.label}</div>
                  </div>
                  {index < ETAPES.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4
                      ${ORDRE.indexOf(etape.value) < statutIndex ? 'bg-green-400' : 'bg-gray-200'}
                    `}/>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Carte Conteneur (maritime uniquement) ── */}
        {dossier.type_transport === 'maritime' && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-blue-200 flex items-center gap-2">
              <span className="text-blue-600">🚢</span>
              <span className="text-xs font-semibold text-blue-800">Détails du conteneur</span>
            </div>
            {conteneur ? (
              <div className="p-4 grid grid-cols-4 gap-3">
                {[
                  { label: 'Type',              value: conteneur.type_conteneur_label || '—' },
                  { label: 'Nombre',            value: conteneur.nombre_conteneurs || '—' },
                  { label: 'Marchandise',       value: conteneur.type_marchandise || '—' },
                  { label: 'N° B/L',            value: conteneur.numero_bl || '—' },
                  { label: 'Compagnie',         value: conteneur.compagnie_maritime || '—' },
                  { label: 'Port chargement',   value: conteneur.port_chargement || '—' },
                  { label: 'Port déchargement', value: conteneur.port_dechargement || '—' },
                  { label: 'Poids (kg)',        value: conteneur.poids_total_kg ? `${conteneur.poids_total_kg} kg` : '—' },
                ].map((info) => (
                  <div key={info.label} className="bg-white rounded-md p-2.5 border border-blue-100">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{info.label}</div>
                    <div className="text-xs font-medium text-gray-700">{info.value}</div>
                  </div>
                ))}
                {conteneur.observations && (
                  <div className="col-span-4 bg-white rounded-md p-2.5 border border-blue-100">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Observations</div>
                    <div className="text-xs text-gray-600">{conteneur.observations}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-blue-400 text-xs">
                Aucun détail conteneur enregistré pour ce dossier
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">📄 Documents du dossier</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {documents.length} document{documents.length > 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={() => navigate(`/documents?dossier=${dossier.id}`)}
              className="h-7 px-3 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
              + Scanner un document
            </button>
          </div>
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun document associé à ce dossier</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Code</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Nom fichier</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Taille</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Assigné à</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-blue-600 font-medium">{d.code_document}</td>
                    <td className="px-3 py-2 text-gray-500">{d.type_label}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{d.nom_fichier}</td>
                    <td className="px-3 py-2 text-gray-400">{d.taille_fichier_mb} MB</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_DOC[d.statut] || 'bg-gray-100'}`}>
                        {d.statut_label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{d.assigne_a_nom || '—'}</td>
                    <td className="px-3 py-2 text-gray-400">
                      {new Date(d.date_scan).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleTelechargerDocument(d)}
                        className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                        ⬇️ Télécharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Grille infos */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-800">Informations client</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {[
                { label: 'Nom',            value: dossier.client_nom },
                { label: 'N° Dossier',     value: dossier.numero_dossier },
                { label: 'Transport',      value: dossier.type_transport },
                { label: 'Classification', value: dossier.classification },
                { label: 'Mode sortie',    value: dossier.mode_sortie || '—' },
                { label: 'Créé par',       value: dossier.cree_par_nom },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-1 border-b border-gray-50 text-xs">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-700 capitalize">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-800">Observations</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
                {dossier.observations || 'Aucune observation'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-800">Actions rapides</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button onClick={() => setShowRecap(true)}
                className="w-full h-8 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium hover:bg-indigo-100 border border-indigo-200">
                ⏱ Voir le récapitulatif
              </button>
              <button onClick={() => navigate(`/transit?dossier=${dossier.id}`)}
                className="w-full h-8 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 border border-blue-200">
                📋 Voir la déclaration
              </button>
              <button onClick={() => navigate(`/logistique?dossier=${dossier.id}`)}
                className="w-full h-8 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 border border-green-200">
                🚛 Voir la logistique
              </button>
              <button onClick={() => navigate(`/passation?dossier=${dossier.id}`)}
                className="w-full h-8 bg-pink-50 text-pink-700 rounded-md text-xs font-medium hover:bg-pink-100 border border-pink-200">
                ✅ Voir la passation
              </button>
              <button onClick={() => navigate(`/finance?dossier=${dossier.id}`)}
                className="w-full h-8 bg-purple-50 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-100 border border-purple-200">
                💰 Voir les montants
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}