import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Intercepteur de requête : ajouter le token JWT ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Gestion du refresh token (évite les appels parallèles) ───────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Intercepteur de réponse : rafraîchir le token si expiré ──────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si 401 et qu'on n'a pas déjà tenté de rafraîchir
    if (error.response?.status === 401 && !original._retry) {
      // Si pas de refresh token, déconnexion immédiate
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Si un refresh est déjà en cours, on attend
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Important : utiliser axios brut, pas l'instance "api"
        // (sinon on entre dans une boucle infinie d'intercepteurs)
        const res = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh,
        });

        // 🔥 CORRECTION 1 : sauvegarder access ET refresh
        const newAccess = res.data.access;
        const newRefresh = res.data.refresh; // car ROTATE_REFRESH_TOKENS=True

        localStorage.setItem('access_token', newAccess);
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh);
        }

        // 🔥 CORRECTION 2 : mettre le nouveau token dans la requête originale
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        original.headers.Authorization = `Bearer ${newAccess}`;

        // Rejouer les requêtes en attente
        processQueue(null, newAccess);

        return api(original);
      } catch (refreshError) {
        // Le refresh a échoué → déconnexion
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;