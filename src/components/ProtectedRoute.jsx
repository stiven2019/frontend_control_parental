import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './States';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingState label="Cargando..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/iniciar-sesion" replace />;

  return children;
}
