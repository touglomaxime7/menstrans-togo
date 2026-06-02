import api from './axios';

export const getDossiers = (params = {}) =>
  api.get('/dossiers/', { params });

export const getDossier = (id) =>
  api.get(`/dossiers/${id}/`);

export const createDossier = (data) =>
  api.post('/dossiers/', data);

export const updateDossier = (id, data) =>
  api.patch(`/dossiers/${id}/`, data);

export const getStats = () =>
  api.get('/dossiers/stats/');

export const getDossiersAujourdhui = () =>
  api.get('/dossiers/aujourd_hui/');

export const getClients = (params = {}) =>
  api.get('/clients/', { params });

export const createClient = (data) =>
  api.post('/clients/', data);