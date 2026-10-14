import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './States';

export default function AdminGuard({ children }) {
  const { user, loading, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);

  // Si el usuario está cargado pero en caché local no tiene role === 'admin',
  // consultamos en vivo al backend para refrescar su rol antes de bloquearlo
  useEffect(() => {
    let isMounted = true;
    if (user && user.role !== 'admin' && refreshUser) {
      setChecking(true);
      refreshUser()
        .catch(() => {})
        .finally(() => {
          if (isMounted) setChecking(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingState label="Verificando permisos de administración..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-cloud border border-outline-variant/40 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-container/60 text-error flex items-center justify-center text-3xl mb-4">
            🛡️
          </div>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-2">
            Acceso Restringido
          </h2>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
            Esta sección es exclusiva para el equipo de administración de <strong className="text-primary">Mi Bebé</strong>. Tu sesión actual (<span className="font-semibold text-on-surface">{user.email}</span>) no posee privilegios de administrador.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/admin/login"
              className="btn-primary !py-3 !text-sm flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              <span>Iniciar Sesión en el Portal Administrativo</span>
            </Link>
            <Link
              to="/inicio"
              className="btn-ghost !py-2.5 !text-xs"
            >
              Volver a la App Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
