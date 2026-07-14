import api from './axios';

// ── CONTRATS ──────────────────────────────────────────────────────────────────

export const getContrats = (params = {}) =>
  api.get('/contrats/', { params });

export const getContrat = (id) =>
  api.get(`/contrats/${id}/`);

export const createContrat = (data) =>
  api.post('/contrats/', data);

export const updateContrat = (id, data) =>
  api.patch(`/contrats/${id}/`, data);

export const validerPiece = (contratId, codePiece, valide = true, observations = '') =>
  api.post(`/contrats/${contratId}/valider_piece/`, { code_piece: codePiece, valide, observations });

export const validerContrat = (contratId) =>
  api.post(`/contrats/${contratId}/valider_contrat/`);

export const signerDG = (contratId, signature) =>
  api.post(`/contrats/${contratId}/signer_dg/`, { signature });

export const signerClient = (contratId, signature) =>
  api.post(`/contrats/${contratId}/signer_client/`, { signature });

export const uploadDocumentContrat = (contratId, formData) =>
  api.post(`/contrats/${contratId}/upload_document/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const supprimerDocumentContrat = (contratId, docId) =>
  api.delete(`/contrats/${contratId}/supprimer_document/${docId}/`);

// ── CONTENEURS ────────────────────────────────────────────────────────────────

export const createConteneur = (data) =>
  api.post('/conteneurs/', data);

export const updateConteneur = (id, data) =>
  api.patch(`/conteneurs/${id}/`, data);

// ── RECETTES JOURNALIÈRES ─────────────────────────────────────────────────────

export const getRecettesJournalieres = (date = null) =>
  api.get('/finance/montants/recettes_journalieres/', { params: date ? { date } : {} });