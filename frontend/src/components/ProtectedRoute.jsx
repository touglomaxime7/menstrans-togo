import { Navigate } from 'react-router-dom';
import { useAuth }   from '../hooks/useAuth';

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, aAcces, estAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !estAdmin() && !aAcces(roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}