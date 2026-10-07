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
  const [confirmingBirth, setConfirmingBirth] = useState(false);

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
  const status = data?.status;
  const currentWeek = status?.week ? Number(status.week) : 0;
  const isCarnetUnlocked = Boolean(baby?.isBorn || currentWeek >= 40);

  const handleConfirmBirth = async () => {
    if (
      !window.confirm(
        '¿Confirmas que tu bebé ya nació? Al confirmar, se habilitará de inmediato el Carnet de Salud Infantil con las curvas de la OMS, esquema oficial de vacunas del PAI y controles pediátricos.'
      )
    ) {
      return;
    }
    setConfirmingBirth(true);
    try {
      await api.updateBaby({ isBorn: true });
      await loadData();
    } catch (err) {
      alert(err.message || 'No se pudo activar el carnet infantil.');
    } finally {
      setConfirmingBirth(false);
    }
  };

  // Si no ha nacido y la semana es menor a 40, mostrar pantalla de bloqueo explicativa
  if (!isCarnetUnlocked) {
    const weeksRemaining = Math.max(0, 40 - currentWeek);
    const progressPercent = Math.min(100, Math.max(5, Math.round((currentWeek / 40) * 100)));

    return (
      <AppLayout>
        {/* Banner superior de navegación */}
        <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="text-base">⏳</span>
            <span>
              <strong>Módulo en espera:</strong> Este carnet pediátrico se activará automáticamente al alcanzar la <strong>Semana 40</strong> o cuando confirmes el nacimiento.
            </span>
          </div>
          <Link
            to="/mi-bebe"
            className="text-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
          >
            <span>🤰 Ir a Mi Bebé en Gestación</span>
            <span>→</span>
          </Link>
        </div>

        {/* TARJETA PRINCIPAL DE BLOQUEO POR ETAPA GESTACIONAL */}
        <div className="max-w-2xl mx-auto my-6 animate-fade-in">
          <div className="card text-center p-6 sm:p-8 border-2 border-primary/20 shadow-cloud bg-gradient-to-b from-white via-surface-container/15 to-primary-container/20 rounded-3xl">
            <div className="relative inline-flex items-center justify-center mb-4">
              <span className="w-20 h-20 rounded-full bg-secondary-container/40 flex items-center justify-center text-4xl shadow-cloud-sm border border-secondary/20">
                🍼
              </span>
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-md font-bold">
                🔒
              </span>
            </div>

            <span className="pill-chip bg-primary-container text-primary font-bold text-xs uppercase tracking-wider mb-2">
              Módulo Bloqueado · Etapa Gestacional
            </span>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-2">
              Carnet de Salud Infantil (Bebé Nacido)
            </h2>

            <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed mb-6">
              Este carnet está diseñado exclusivamente para el seguimiento médico, percentiles de crecimiento de la OMS (peso, talla y perímetro cefálico), esquema oficial de vacunas del PAI y citas de pediatría del <strong>bebé ya nacido</strong>.
            </p>

            {/* Tarjeta de Progreso Gestacional */}
            <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-outline-variant/30 shadow-cloud-sm text-left mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span>🤰</span> Estado Gestacional Actual
                </span>
                <span className="pill-chip bg-secondary-container/50 text-secondary font-bold text-xs">
                  Semana {currentWeek} de 40
                </span>
              </div>

              {/* Barra de progreso hacia la semana 40 */}
              <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden my-2.5">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1">
                <span>Inicio gestacional</span>
                <span className="font-semibold text-primary">
                  {weeksRemaining > 0 ? `Faltan ${weeksRemaining} semanas para término (Semana 40)` : '¡Semana 40 alcanzada!'}
                </span>
                <span>Semana 40 🎯</span>
              </div>
            </div>

            {/* Opción para activar si el bebé nació antes de tiempo */}
            <div className="bg-gradient-to-r from-secondary-container/30 to-surface-container/50 p-4 sm:p-5 rounded-2xl border border-secondary/30 mb-6 text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-cloud-sm">
              <div className="flex-1">
                <h4 className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <span>✨</span> ¿Tu bebé nació antes de la semana 40?
                </h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Si tu parto o cesárea ya ocurrió, puedes activar el carnet ahora mismo indicando que tu bebé ya nació.
                </p>
              </div>
              <button
                type="button"
                onClick={handleConfirmBirth}
                disabled={confirmingBirth}
                className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 text-xs font-semibold whitespace-nowrap bg-secondary hover:bg-secondary/90 text-white shrink-0 shadow-cloud flex items-center justify-center gap-2 rounded-full active:scale-95 transition-transform"
              >
                <span>{confirmingBirth ? 'Activando...' : '🎉 ¡Mi bebé ya nació! Activar carnet'}</span>
              </button>
            </div>

            {/* Botones de acción complementarios */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/mi-bebe"
                className="btn-primary !w-full sm:!w-auto !py-2.5 !px-6 text-xs font-semibold rounded-full shadow-cloud-sm flex items-center justify-center gap-2"
              >
                <span>🤰</span>
                <span>Ir a Mi Bebé en Gestación</span>
              </Link>
              <Link
                to="/inicio"
                className="btn-secondary !w-auto !py-2.5 !px-5 text-xs font-semibold rounded-full border border-surface-container"
              >
                <span>🏠 Volver al Inicio</span>
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Si está desbloqueado (semana >= 40 o ya nació), mostrar el Carnet Infantil completo
  return (
    <AppLayout>
      {/* Aviso informativo de separación clara entre gestación y bebé nacido */}
      <div className="mb-5 p-3 rounded-2xl bg-secondary-container/20 border border-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="text-base">👶</span>
          <span>
            <strong>Módulo Postnatal Activo:</strong> Exclusivo para el bebé ya nacido (curvas OMS, vacunas PAI y pediatría).
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
            className="btn-secondary !w-auto !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm rounded-full"
          >
            <span>⏰</span>
            <span>Recordatorios</span>
          </Link>
          <Link
            to="/album"
            className="btn-secondary !w-auto !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm rounded-full"
          >
            <span>📸</span>
            <span>Fotos</span>
          </Link>
          <Link
            to="/inicio"
            className="btn-secondary !w-auto !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm rounded-full"
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
