import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { api } from '../api/client';
import BornBabyCarnet from '../components/BornBabyCarnet';

export default function PostnatalCarnetPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Error al cargar los datos del bebé.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateBaby = async (payload) => {
    try {
      await api.updateBaby(payload);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error al actualizar el carnet infantil.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState label="Cargando carnet de salud y crecimiento del bebé nacido..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState message={error} onRetry={loadData} />
      </AppLayout>
    );
  }

  const baby = data?.baby;

  return (
    <AppLayout>
      {/* Aviso informativo de separación clara entre gestación y bebé nacido */}
      <div className="mb-5 p-3 rounded-2xl bg-secondary-container/20 border border-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="text-base">👶</span>
          <span>
            <strong>Módulo Postnatal:</strong> Exclusivo para el bebé ya nacido (curvas OMS, vacunas PAI y pediatría).
          </span>
        </div>
        <Link
          to="/mi-bebe"
          className="text-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
        >
          <span>🤰 Ver Mi Bebé en Gestación (Embarazo)</span>
          <span>→</span>
        </Link>
      </div>

      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
              Carnet de Salud Infantil
            </h1>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
            Crecimiento y desarrollo para el bebé ya nacido: percentiles OMS, vacunas oficiales y controles pediátricos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            to="/recordatorios"
            className="btn-secondary !py-2.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm"
          >
            <span>⏰</span>
            <span>Recordatorios</span>
          </Link>
          <Link
            to="/album"
            className="btn-secondary !py-2.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm"
          >
            <span>📸</span>
            <span>Fotos</span>
          </Link>
          <Link
            to="/inicio"
            className="btn-secondary !py-2.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm"
          >
            <span>🏠</span>
            <span>Inicio</span>
          </Link>
        </div>
      </header>

      {/* Componente del Carnet Infantil Postnatal */}
      <BornBabyCarnet baby={baby} onUpdateBaby={handleUpdateBaby} />
    </AppLayout>
  );
}
