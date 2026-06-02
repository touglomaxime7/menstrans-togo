import { useSelector, useDispatch } from 'react-redux';
import { setAuth, clearAuth } from '../store/authSlice';
import { login, logout } from '../api/auth';

export const useAuth = () => {
  const dispatch      = useDispatch();
  const utilisateur   = useSelector((state) => state.auth.utilisateur);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleLogin = async (email, password) => {
    const data = await login(email, password);
    dispatch(setAuth({ utilisateur: data.utilisateur }));
    return data;
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    logout();
  };

  const estAdmin = () =>
  utilisateur?.role === 'admin' || utilisateur?.role === 'direction';

const peutCreerDossier = () =>
  estAdmin() || utilisateur?.role === 'assistant_directeur';

  const aAcces = (roles = []) =>
    estAdmin() || roles.includes(utilisateur?.role);

  return {
    utilisateur,
    isAuthenticated,
    handleLogin,
    handleLogout,
    estAdmin,
    aAcces,
  };
};