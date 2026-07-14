import api from './axios';

export const getDossiers = (params = {}) =>
  api.get('/dossiers/', { params });

export const getDossier = (id) =>
  api.get(`/dossiers/${id}/`);

export const createDossier = (data) =>
  api.post('/dossiers/', data);

export const updateDossier = (id, data) =>
  api.patch(`/dossiers/${id}/`, data);

export const changerStatut = (id, statut, commentaire = '') =>
  api.post(`/dossiers/${id}/changer_statut/`, { statut, commentaire });

export const getRecapitulatif = (id) =>
  api.get(`/dossiers/${id}/recapitulatif/`);

export const getStats = () =>
  api.get('/dossiers/stats/');

export const getDossiersAujourdhui = () =>
  api.get('/dossiers/aujourd_hui/');

export const getClients = (params = {}) =>
  api.get('/clients/', { params });

export const getClient = (id) =>
  api.get(`/clients/${id}/`);

export const createClient = (data) =>
  api.post('/clients/', data);

export const getDossiersClient = (clientId) =>
  api.get(`/clients/${clientId}/dossiers/`);

export const getHistoriqueClient = (clientId) =>
  api.get(`/clients/${clientId}/historique/`);

// ── Options pour les champs ───────────────────────────────────────────────────

export const CLASSIFICATIONS = [
  { value: 'standard',    label: 'Standard' },
  { value: 'urgent',      label: 'Urgent' },
  { value: 'vip',         label: 'VIP' },
  { value: 'contentieux', label: 'Contentieux' },
];

export const MODES_SORTIE = [
  { value: 'camion',        label: 'Camion' },
  { value: 'depotage',      label: 'Dépotage' },
  { value: 'terminal_pia',  label: 'Terminal PIA' },
  { value: 'terminal_togo', label: 'Terminal Togo' },
  { value: 'terminal_bmh',  label: 'Terminal BMH' },
  { value: 'autre',         label: 'Autre terminal' },
];

export const STATUTS = [
  { value: 'nouveau',            label: 'Nouveau' },
  { value: 'transit',            label: 'Transit' },
  { value: 'logistique_initial', label: 'Logistique initiale' },
  { value: 'passation',          label: 'Passation' },
  { value: 'logistique_final',   label: 'Logistique finale' },
  { value: 'livraison',          label: 'Livraison' },
  { value: 'cloture',            label: 'Clôture' },
];