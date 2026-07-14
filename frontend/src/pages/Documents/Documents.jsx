import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import ComboBox from '../../components/ComboBox';

const BADGE_STATUT = {
  en_attente:    'bg-amber-100 text-amber-800',
  en_traitement: 'bg-blue-100 text-blue-800',
  valide:        'bg-green-100 text-green-800',
  rejete:        'bg-red-100 text-red-800',
  archive:       'bg-gray-100 text-gray-600',
};

const TYPES_DOCUMENTS = [
  { value: 'bordereau',            label: 'Bordereau' },
  { value: 'manifeste',            label: 'Manifeste' },
  { value: 'facture_commerciale',  label: 'Facture commerciale' },
  { value: 'certificat_origine',   label: "Certificat d'origine" },
  { value: 'liste_colisage',       label: 'Liste de colisage' },
  { value: 'bon_livraison',        label: 'Bon de livraison' },
  { value: 'besc',                 label: 'BESC (Bordereau Électronique de Suivi des Cargaisons)' },
  { value: 'connaissement',        label: 'Connaissement / Bill of Lading (OBL)' },
  { value: 'awb_lta',              label: 'AWB / LTA (Lettre de Transport Aérien)' },
  { value: 'cmr',                  label: 'CMR / Lettre de voiture' },
  { value: 'declaration_export',   label: "Déclaration d'exportation" },
  { value: 'autorisation_import',  label: "Autorisation d'importation" },
  { value: 'assurance_maritime',   label: 'Ordre d\'assurance maritime' },
  { value: 'booking',              label: 'Booking (export)' },
  { value: 'certificat_sanitaire', label: 'Certificat sanitaire' },
  { value: 'facture',              label: 'Facture' },
  { value: 'bae',                  label: 'BAE (Bon À Enlever)' },
  { value: 'bad',                  label: 'BAD (Bon À Délivrer)' },
  { value: 'dfu',                  label: 'DFU (Droit de Fret Unique)' },
  { value: 'autre',                label: 'Autre' },
];

const TYPES_LABELS = TYPES_DOCUMENTS.map(t => t.label);

const WORKFLOW = {
  assistant_directeur: { next_role: 'transit',    next_label: 'Service Transit' },
  transit:             { next_role: 'passation',  next_label: 'Service Passation' },
  passation:           { next_role: 'logistique', next_label: 'Service Logistique' },
  logistique:          { next_role: 'caisse',     next_label: 'Service Caisse' },
  admin:               { next_role: 'transit',    next_label: 'Service Transit' },
  direction:           { next_role: 'transit',    next_label: 'Service Transit' },
};

export default function Documents() {
  const { utilisateur } = useAuth();
  const [documents,      setDocuments]      = useState([]);
  const [dossiers,       setDossiers]       = useState([]);
  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [showModal,      setShowModal]      = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [selectedDoc,    setSelectedDoc]    = useState(null);
  const [historique,     setHistorique]     = useState([]);
  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [form, setForm] = useState({
    dossier:       '',
    dossier_label: '',
    type_document: '',
    observations:  '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview,  setFilePreview]  = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents/');
      setDocuments(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, dossRes, usersRes] = await Promise.all([
          api.get('/documents/'),
          api.get('/dossiers/'),
          api.get('/auth/utilisateurs/'),
        ]);
        setDocuments(docsRes.data.results || docsRes.data);
        setDossiers(dossRes.data.results  || dossRes.data);
        setUsers(usersRes.data || []);
      } catch {
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validerFichier = (file) => {
    const typesAcceptes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!typesAcceptes.includes(file.type)) {
      toast.error('Seuls les fichiers PDF, JPG, PNG sont acceptés');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 MB');
      return false;
    }
    return true;
  };

  const appliquerFichier = (file) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validerFichier(file)) {
      appliquerFichier(file);
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Impossible d'accéder à la caméra.");
    }
  };

  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      appliquerFichier(file);
      stopCamera();
      toast.success('Photo capturée !');
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const fermerModal = () => {
    stopCamera();
    setShowModal(false);
    setForm({ dossier: '', dossier_label: '', type_document: '', observations: '' });
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Trouver la valeur du type_document à partir du label
  const getTypeValue = (label) => {
    const found = TYPES_DOCUMENTS.find(t => t.label === label);
    return found ? found.value : label.toLowerCase().replace(/\s+/g, '_');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.dossier || !form.type_document || !selectedFile) {
      toast.error('Veuillez remplir tous les champs et fournir un fichier ou une photo');
      return;
    }

    const formData = new FormData();
    formData.append('fichier',        selectedFile);
    formData.append('dossier',        form.dossier);
    formData.append('type_document',  getTypeValue(form.type_document));
    formData.append('observations',   form.observations);

    try {
      await api.post('/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document enregistré avec succès !');
      fermerModal();
      fetchDocuments();
    } catch {
      toast.error("Erreur lors de l'upload du document");
    }
  };

  const handleEnvoyerService = async (doc) => {
    if (!utilisateur) return;
    const workflow = WORKFLOW[utilisateur.role];
    if (!workflow) {
      toast.error("Vous n'avez pas le droit d'envoyer des documents");
      return;
    }
    const utilisateurCible = users.find(u => u.role === workflow.next_role && u.actif);
    if (!utilisateurCible) {
      toast.error(`Aucun utilisateur trouvé pour le ${workflow.next_label}`);
      return;
    }
    if (!window.confirm(`Envoyer ce document au ${workflow.next_label} ?`)) return;
    try {
      await api.post(`/documents/${doc.id}/assigner/`, { utilisateur_id: utilisateurCible.id });
      toast.success(`Document envoyé au ${workflow.next_label} !`);
      fetchDocuments();
    } catch {
      toast.error("Erreur lors de l'envoi");
    }
  };

  const handleValider = async (doc) => {
    try {
      await api.post(`/documents/${doc.id}/valider/`);
      toast.success('Document validé !');
      fetchDocuments();
    } catch { toast.error('Erreur'); }
  };

  const handleRejeter = async (doc) => {
    const motif = prompt('Motif du rejet :');
    if (!motif) return;
    try {
      await api.post(`/documents/${doc.id}/rejeter/`, { motif });
      toast.success('Document rejeté');
      fetchDocuments();
    } catch { toast.error('Erreur'); }
  };

  const handleTelecharger = async (doc) => {
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

  const handleVoirHistorique = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/historique/`);
      setHistorique(res.data);
      setSelectedDoc(doc);
      setShowHistorique(true);
    } catch { toast.error("Erreur lors du chargement de l'historique"); }
  };

  const peutEnvoyer     = () => utilisateur && WORKFLOW[utilisateur.role] !== undefined;
  const getProchainService = () => utilisateur ? WORKFLOW[utilisateur.role]?.next_label || '' : '';

  const filtered = documents.filter(d =>
    !search ||
    d.code_document?.toLowerCase().includes(search.toLowerCase()) ||
    d.nom_fichier?.toLowerCase().includes(search.toLowerCase()) ||
    d.dossier_numero?.toLowerCase().includes(search.toLowerCase())
  );

  // Labels dossiers pour ComboBox
  const dossierOptions = dossiers.map(d => `${d.numero_dossier} — ${d.client_nom}`);

  return (
    <Layout title="Gestion Documentaire" subtitle={`${documents.length} documents`}>
      <div className="flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total',         value: documents.length,                                           bg: 'bg-gray-50' },
            { label: 'En attente',    value: documents.filter(d => d.statut === 'en_attente').length,    bg: 'bg-amber-50' },
            { label: 'En traitement', value: documents.filter(d => d.statut === 'en_traitement').length, bg: 'bg-blue-50' },
            { label: 'Validés',       value: documents.filter(d => d.statut === 'valide').length,        bg: 'bg-green-50' },
            { label: 'Rejetés',       value: documents.filter(d => d.statut === 'rejete').length,        bg: 'bg-red-50' },
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
              placeholder="Rechercher par code, nom fichier ou dossier..."
              className="h-8 pl-7 pr-3 border border-gray-200 rounded-md text-xs outline-none w-80 focus:border-blue-400"/>
          </div>
          <button onClick={() => setShowModal(true)}
            className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3] flex items-center gap-1">
            📄 Scanner un document
          </button>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Liste des documents</span>
            <span className="text-[10px] text-gray-400">{filtered.length} document(s)</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun document</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Code</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Client</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Nom fichier</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Taille</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Assigné à</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date scan</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-blue-600 font-medium">{d.code_document}</td>
                    <td className="px-3 py-2 text-gray-700">{d.dossier_numero}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{d.client_nom || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{d.type_label}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{d.nom_fichier}</td>
                    <td className="px-3 py-2 text-gray-400">{d.taille_fichier_mb} MB</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_STATUT[d.statut] || 'bg-gray-100'}`}>
                        {d.statut_label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{d.assigne_a_nom || '—'}</td>
                    <td className="px-3 py-2 text-gray-400">{new Date(d.date_scan).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => handleTelecharger(d)}
                          className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100"
                          title="Télécharger">⬇️</button>
                        <button onClick={() => handleVoirHistorique(d)}
                          className="h-6 px-2 bg-gray-50 text-gray-700 rounded text-[10px] border border-gray-200 hover:bg-gray-100"
                          title="Historique">📋</button>
                        {peutEnvoyer() && (
                          <button onClick={() => handleEnvoyerService(d)}
                            className="h-6 px-2 bg-purple-50 text-purple-700 rounded text-[10px] border border-purple-200 hover:bg-purple-100"
                            title={`Envoyer au ${getProchainService()}`}>
                            ➤ {getProchainService()}
                          </button>
                        )}
                        {d.statut === 'en_traitement' && (
                          <>
                            <button onClick={() => handleValider(d)}
                              className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                              ✓ Valider
                            </button>
                            <button onClick={() => handleRejeter(d)}
                              className="h-6 px-2 bg-red-50 text-red-700 rounded text-[10px] border border-red-200 hover:bg-red-100">
                              ✗ Rejeter
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

      {/* Modal scan */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[520px] border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-gray-800">Scanner un document</span>
              <button onClick={fermerModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleUpload} className="p-5 flex flex-col gap-4">

              {/* Sélection dossier — ComboBox */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier *</label>
                <ComboBox
                  value={form.dossier_label}
                  onChange={(val) => {
                    const found = dossiers.find(d =>
                      `${d.numero_dossier} — ${d.client_nom}`.toLowerCase().includes(val.toLowerCase())
                    );
                    setForm({
                      ...form,
                      dossier:       found ? String(found.id) : '',
                      dossier_label: val,
                    });
                  }}
                  options={dossierOptions}
                  placeholder="Rechercher un dossier ou un client..."
                />
              </div>

              {/* Type de document — ComboBox */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Type de document *</label>
                <ComboBox
                  value={form.type_document}
                  onChange={(val) => setForm({ ...form, type_document: val })}
                  options={TYPES_LABELS}
                  placeholder="Rechercher ou saisir un type..."
                />
              </div>

              {/* Zone source */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-gray-500 uppercase">
                  Source du document * <span className="text-gray-400 normal-case">(PDF, JPG, PNG — max 10 MB)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="h-9 border border-gray-200 rounded-md text-[11px] text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                    📁 Fichier
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()}
                    className="h-9 border border-gray-200 rounded-md text-[11px] text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                    📷 Photo
                  </button>
                  <button type="button" onClick={cameraActive ? stopCamera : startCamera}
                    className={`h-9 rounded-md text-[11px] flex items-center justify-center gap-1 border ${
                      cameraActive
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}>
                    {cameraActive ? '✕ Fermer caméra' : '🎥 Caméra'}
                  </button>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange}
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"/>
                <input type="file" ref={cameraInputRef} onChange={handleFileChange}
                  accept="image/*" capture="environment"
                  className="hidden"/>

                {cameraActive && (
                  <div className="mt-1 border border-blue-200 rounded-md p-2 bg-blue-50">
                    <video ref={videoRef} className="w-full rounded-md bg-black" playsInline muted />
                    <button type="button" onClick={capturePhoto}
                      className="w-full mt-2 h-9 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                      📸 Prendre la photo
                    </button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />

                {selectedFile && !cameraActive && (
                  <div className="text-[10px] text-green-600 mt-1">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}

                {filePreview && !cameraActive && (
                  <div className="mt-1 border border-gray-200 rounded-md p-2">
                    <div className="text-[10px] text-gray-500 mb-1">Aperçu :</div>
                    <img src={filePreview} alt="Aperçu" className="max-h-40 rounded border mx-auto" />
                    <button type="button"
                      onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                      className="w-full mt-2 h-7 border border-gray-200 rounded-md text-[10px] text-gray-500 hover:bg-gray-50">
                      Retirer / reprendre
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">Observations</label>
                <textarea value={form.observations} onChange={(e) => setForm({...form, observations: e.target.value})}
                  className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none resize-none h-16 focus:border-blue-400"/>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={fermerModal}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal historique */}
      {showHistorique && selectedDoc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[600px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                Historique — {selectedDoc.code_document}
              </span>
              <button onClick={() => setShowHistorique(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 max-h-[500px] overflow-y-auto">
              {historique.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">Aucun historique</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {historique.map((h) => (
                    <div key={h.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-800">{h.action}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{h.details}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{h.utilisateur_nom}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(h.date_action).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}