import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  getContrats, createContrat, validerPiece, validerContrat,
  signerDG, signerClient, uploadDocumentContrat, supprimerDocumentContrat
} from '../../api/contrats';
import { getDossiers } from '../../api/dossiers';
import ComboBox from '../../components/ComboBox';

const PIECES_LABELS = {
  certificat_origine:  "Certificat d'origine",
  facture_commerciale: 'Facture commerciale',
  bordereau:           'Bordereau',
  connaissement:       'Connaissement / Bill of Lading',
  assurance_maritime:  "Ordre d'assurance maritime",
};

const TYPE_DOC_OPTIONS = [
  { value: 'contrat_signe', label: 'Contrat signé' },
  { value: 'annexe',        label: 'Annexe' },
  { value: 'procuration',   label: 'Procuration' },
  { value: 'autre',         label: 'Autre document' },
];

// Correspondance entre type de doc uploadé et code_piece du contrat
const DOC_VERS_PIECE = {
  "Certificat d'origine":          'certificat_origine',
  'certificat_origine':            'certificat_origine',
  'Facture commerciale':           'facture_commerciale',
  'facture_commerciale':           'facture_commerciale',
  'Bordereau':                     'bordereau',
  'bordereau':                     'bordereau',
  'Connaissement / Bill of Lading':'connaissement',
  'connaissement':                 'connaissement',
  "Ordre d'assurance maritime":    'assurance_maritime',
  'assurance_maritime':            'assurance_maritime',
};

// Types de documents correspondant aux pièces requises
const TYPES_PIECES = [
  "Certificat d'origine",
  'Facture commerciale',
  'Bordereau',
  'Connaissement / Bill of Lading',
  "Ordre d'assurance maritime",
  'Contrat signé',
  'Annexe',
  'Autre document',
];

// ── Composant canvas signature ─────────────────────────────────────────────────
function SignatureCanvas({ onSave, onCancel, label }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1F3864';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => { drawing.current = false; };
  const effacer  = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };
  const sauvegarder = () => onSave(canvasRef.current.toDataURL('image/png'));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        <canvas ref={canvasRef} width={460} height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
      </div>
      <div className="flex gap-2">
        <button onClick={effacer} className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50">Effacer</button>
        <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50">Annuler</button>
        <button onClick={sauvegarder} className="flex-1 bg-[#1F3864] text-white text-xs py-1.5 rounded-lg hover:bg-[#2E5FA3]">Valider la signature</button>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function GestionContrats() {
  const [contrats, setContrats]     = useState([]);
  const [dossiers, setDossiers]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [search,   setSearch]       = useState('');
  const [onglet,   setOnglet]       = useState('pieces');
  const [form,     setForm]         = useState({
    dossier: '', dossier_label: '', objet: '', conditions: '', date_signature: '',
  });

  const [signatureMode, setSignatureMode] = useState(null);
  const [uploadForm,    setUploadForm]    = useState({ nom: '', type_doc: '' });
  const [uploadFichier, setUploadFichier] = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  const charger = async () => {
    try {
      const [r1, r2] = await Promise.all([getContrats({ search }), getDossiers()]);
      setContrats(r1.data.results || r1.data);
      setDossiers(r2.data.results || r2.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [search]);

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.dossier) { toast.error('Veuillez sélectionner un dossier'); return; }
    try {
      await createContrat({
        dossier:        form.dossier,
        objet:          form.objet,
        conditions:     form.conditions,
        date_signature: form.date_signature,
      });
      toast.success('Contrat créé avec succès');
      setShowForm(false);
      setForm({ dossier: '', dossier_label: '', objet: '', conditions: '', date_signature: '' });
      charger();
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const togglePiece = async (contratId, codePiece, estValide) => {
    try {
      const res = await validerPiece(contratId, codePiece, !estValide);
      toast.success(!estValide ? 'Pièce validée ✓' : 'Pièce invalidée');
      setSelected(prev => ({
        ...prev,
        avancement_pieces:     res.data.avancement,
        toutes_pieces_valides: res.data.toutes_valides,
        pieces: prev.pieces.map(p =>
          p.code_piece === codePiece ? { ...p, valide: !estValide } : p
        ),
      }));
      charger();
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const confirmerContrat = async (contratId) => {
    try {
      await validerContrat(contratId);
      toast.success('Contrat validé !');
      charger();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de valider');
    }
  };

  const handleSignature = async (base64, type) => {
    try {
      if (type === 'dg') {
        await signerDG(selected.id, base64);
        toast.success('Signature DG enregistrée ✓');
      } else {
        await signerClient(selected.id, base64);
        toast.success('Signature client enregistrée ✓');
      }
      setSignatureMode(null);
      const res     = await getContrats({ search });
      const updated = (res.data.results || res.data).find(c => c.id === selected.id);
      if (updated) setSelected(updated);
      charger();
    } catch {
      toast.error('Erreur lors de la signature');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFichier) { toast.error('Sélectionne un fichier'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('fichier',  uploadFichier);
      fd.append('nom',      uploadForm.nom || uploadFichier.name);
      fd.append('type_doc', 'autre');
      await uploadDocumentContrat(selected.id, fd);

      // Valider automatiquement la pièce correspondante si elle existe
      const codePiece = DOC_VERS_PIECE[uploadForm.nom] || DOC_VERS_PIECE[uploadForm.type_doc];
      if (codePiece) {
        const pieceExistante = selected.pieces?.find(p => p.code_piece === codePiece);
        if (pieceExistante && !pieceExistante.valide) {
          await validerPiece(selected.id, codePiece, true);
          toast.success(`Document joint et pièce "${PIECES_LABELS[codePiece]}" validée automatiquement ✓`);
        } else {
          toast.success('Document uploadé ✓');
        }
      } else {
        toast.success('Document uploadé ✓');
      }

      setUploadFichier(null);
      setUploadForm({ nom: '', type_doc: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Rafraîchir le contrat sélectionné
      const res     = await getContrats({ search });
      const updated = (res.data.results || res.data).find(c => c.id === selected.id);
      if (updated) setSelected(updated);
      charger();
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSupprimerDoc = async (docId) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await supprimerDocumentContrat(selected.id, docId);
      toast.success('Document supprimé');
      setSelected(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== docId) }));
      charger();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const statutBadge = (statut) => {
    const map    = { brouillon: 'bg-gray-100 text-gray-700', en_attente: 'bg-yellow-100 text-yellow-700', valide: 'bg-green-100 text-green-700', resilie: 'bg-red-100 text-red-700' };
    const labels = { brouillon: 'Brouillon', en_attente: 'En attente', valide: 'Validé', resilie: 'Résilié' };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[statut] || 'bg-gray-100'}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  const dossierOptions = dossiers.map(d => `${d.numero_dossier} — ${d.client_nom}`);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contrats</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des contrats client-direction</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Nouveau contrat
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <input type="text" placeholder="Rechercher par n° contrat, dossier ou client..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>

      {/* Modal création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Nouveau contrat</h2>
            <form onSubmit={soumettre} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dossier *</label>
                <ComboBox
                  value={form.dossier_label}
                  onChange={(val) => {
                    const found = dossiers.find(d =>
                      `${d.numero_dossier} — ${d.client_nom}`.toLowerCase().includes(val.toLowerCase())
                    );
                    setForm({ ...form, dossier: found ? String(found.id) : '', dossier_label: val });
                  }}
                  options={dossierOptions}
                  placeholder="Rechercher un dossier ou un client..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objet du contrat</label>
                <textarea value={form.objet} onChange={e => setForm({ ...form, objet: e.target.value })}
                  rows={3} placeholder="Décrivez l'objet du contrat..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions particulières</label>
                <textarea value={form.conditions} onChange={e => setForm({ ...form, conditions: e.target.value })}
                  rows={2} placeholder="Conditions spéciales..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de signature prévue</label>
                <input type="date" value={form.date_signature}
                  onChange={e => setForm({ ...form, date_signature: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Créer le contrat
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal détail contrat */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selected.numero_contrat}</h2>
                <p className="text-sm text-gray-500">{selected.dossier_numero} · {selected.client_nom}</p>
              </div>
              <div className="flex items-center gap-2">
                {statutBadge(selected.statut)}
                <button onClick={() => { setSelected(null); setSignatureMode(null); }}
                  className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
              {[
                { key: 'pieces',     label: '📋 Pièces' },
                { key: 'signatures', label: '✍️ Signatures' },
                { key: 'documents',  label: `📎 Documents (${selected.documents?.length || 0})` },
              ].map(o => (
                <button key={o.key} onClick={() => setOnglet(o.key)}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition ${
                    onglet === o.key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>

            {/* ── Onglet Pièces ── */}
            {onglet === 'pieces' && (
              <div>
                {/* Barre avancement */}
                {(() => {
                  const [val, tot] = (selected.avancement_pieces || '0/5').split('/').map(Number);
                  const pct = Math.round((val / tot) * 100);
                  return (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Documents validés</span><span>{val}/{tot}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-blue-700">
                  💡 Allez dans l'onglet <strong>📎 Documents</strong> pour joindre un fichier — il sera validé automatiquement !
                </div>

                <div className="space-y-2 mb-4">
                  {selected.pieces?.map(piece => (
                    <div key={piece.code_piece}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          piece.valide ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {piece.valide ? '✓' : '○'}
                        </span>
                        <span className="text-sm text-gray-700">
                          {PIECES_LABELS[piece.code_piece] || piece.code_piece}
                        </span>
                      </div>
                      {selected.statut !== 'valide' && (
                        <button onClick={() => togglePiece(selected.id, piece.code_piece, piece.valide)}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition ${
                            piece.valide ? 'text-red-600 hover:bg-red-50' : 'text-blue-600 hover:bg-blue-50'
                          }`}>
                          {piece.valide ? 'Invalider' : 'Valider manuellement'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {selected.statut !== 'valide' && (
                  <button onClick={() => confirmerContrat(selected.id)}
                    disabled={!selected.toutes_pieces_valides}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                      selected.toutes_pieces_valides
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>
                    {selected.toutes_pieces_valides
                      ? '✓ Valider le contrat'
                      : `Compléter les documents (${selected.avancement_pieces})`}
                  </button>
                )}
                {selected.statut === 'valide' && (
                  <div className="text-center text-green-600 font-semibold text-sm bg-green-50 py-2.5 rounded-lg">
                    ✓ Contrat validé
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet Signatures ── */}
            {onglet === 'signatures' && (
              <div className="space-y-4">
                {/* Signature DG */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Signature du Directeur Général</p>
                      {selected.signe_par_dg_le && (
                        <p className="text-xs text-green-600 mt-0.5">
                          ✓ Signé le {new Date(selected.signe_par_dg_le).toLocaleDateString('fr-TG')}
                        </p>
                      )}
                    </div>
                    {selected.signature_dg
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Signé</span>
                      : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">En attente</span>}
                  </div>
                  {selected.signature_dg ? (
                    <img src={selected.signature_dg} alt="Signature DG"
                      className="border border-gray-200 rounded-lg bg-white p-2 max-h-24 w-full object-contain"/>
                  ) : signatureMode === 'dg' ? (
                    <SignatureCanvas label="Dessinez la signature du DG ci-dessous"
                      onSave={(b64) => handleSignature(b64, 'dg')}
                      onCancel={() => setSignatureMode(null)}/>
                  ) : (
                    <button onClick={() => setSignatureMode('dg')}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                      ✍️ Cliquer pour signer
                    </button>
                  )}
                </div>

                {/* Signature Client */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Signature du Client</p>
                      {selected.signe_par_client_le && (
                        <p className="text-xs text-green-600 mt-0.5">
                          ✓ Signé le {new Date(selected.signe_par_client_le).toLocaleDateString('fr-TG')}
                        </p>
                      )}
                    </div>
                    {selected.signature_client
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Signé</span>
                      : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">En attente</span>}
                  </div>
                  {selected.signature_client ? (
                    <img src={selected.signature_client} alt="Signature Client"
                      className="border border-gray-200 rounded-lg bg-white p-2 max-h-24 w-full object-contain"/>
                  ) : signatureMode === 'client' ? (
                    <SignatureCanvas label="Dessinez la signature du client ci-dessous"
                      onSave={(b64) => handleSignature(b64, 'client')}
                      onCancel={() => setSignatureMode(null)}/>
                  ) : (
                    <button onClick={() => setSignatureMode('client')}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                      ✍️ Cliquer pour signer
                    </button>
                  )}
                </div>

                <div className={`text-center text-sm font-medium py-2.5 rounded-lg ${
                  selected.est_signe ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {selected.est_signe ? '✓ Contrat signé par les deux parties' : '⏳ En attente des deux signatures'}
                </div>
              </div>
            )}

            {/* ── Onglet Documents ── */}
            {onglet === 'documents' && (
              <div className="space-y-4">
                {/* Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                  ✅ Quand vous joignez un document correspondant à une pièce requise, celle-ci est <strong>validée automatiquement</strong>.
                </div>

                {/* Formulaire upload */}
                <form onSubmit={handleUpload}
                  className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Joindre un document</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase mb-1 block">
                        Nom / Type du document
                      </label>
                      <ComboBox
                        value={uploadForm.nom}
                        onChange={(val) => setUploadForm({ ...uploadForm, nom: val, type_doc: DOC_VERS_PIECE[val] || 'autre' })}
                        options={TYPES_PIECES}
                        placeholder="Ex: Bordereau, Facture commerciale..."
                      />
                      {DOC_VERS_PIECE[uploadForm.nom] && (
                        <p className="text-[10px] text-green-600 mt-1">
                          ✓ Ce document validera automatiquement : <strong>{PIECES_LABELS[DOC_VERS_PIECE[uploadForm.nom]]}</strong>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase mb-1 block">Fichier</label>
                      <input ref={fileInputRef} type="file"
                        onChange={e => setUploadFichier(e.target.files[0])}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"/>
                    </div>
                  </div>
                  <button type="submit" disabled={uploading}
                    className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {uploading ? 'Upload en cours...' : '📎 Joindre le document'}
                  </button>
                </form>

                {/* Liste documents */}
                {!selected.documents || selected.documents.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-6">Aucun document joint pour ce contrat</div>
                ) : (
                  <div className="space-y-2">
                    {selected.documents.map(doc => (
                      <div key={doc.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📄</span>
                          <div>
                            <p className="text-xs font-medium text-gray-700">{doc.nom}</p>
                            <p className="text-[10px] text-gray-400">
                              {doc.taille_kb} Ko · {doc.uploade_par_nom}
                              {DOC_VERS_PIECE[doc.nom] && (
                                <span className="text-green-600 ml-1">· ✓ Pièce validée</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {doc.fichier_url && (
                            <a href={doc.fichier_url} target="_blank" rel="noreferrer"
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                              Ouvrir
                            </a>
                          )}
                          <button onClick={() => handleSupprimerDoc(doc.id)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des contrats */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Chargement...</div>
      ) : contrats.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Aucun contrat trouvé</div>
      ) : (
        <div className="space-y-3">
          {contrats.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setOnglet('pieces'); }}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-blue-300 hover:shadow-sm cursor-pointer transition">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{c.numero_contrat}</span>
                  {statutBadge(c.statut)}
                  {c.est_signe && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✍️ Signé</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {c.dossier_numero} · {c.client_nom}
                  {c.redige_par_nom && <> · Rédigé par {c.redige_par_nom}</>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">{c.avancement_pieces}</div>
                <div className="text-xs text-gray-400">
                  {c.documents?.length || 0} doc{(c.documents?.length || 0) > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}