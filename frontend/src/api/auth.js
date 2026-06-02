import api from './axios';

export const login = async (email, password) => {
  const res = await api.post('/auth/login/', { email, password });
  localStorage.setItem('access_token',  res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  localStorage.setItem('utilisateur',   JSON.stringify(res.data.utilisateur));
  return res.data;
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

export const getUtilisateur = () => {
  const u = localStorage.getItem('utilisateur');
  return u ? JSON.parse(u) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};