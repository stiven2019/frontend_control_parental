import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { api, uploadFile } from '../api/client';
import { testAlarmSound, stopAlarmLoop } from '../utils/soundAlarm';

const SEX_LABELS = {
  nino: 'Niño 👦',
  nina: 'Niña 👧',
  sorpresa: '¡Será sorpresa! 🎁',
  desconocido: 'Aún no lo sabemos 🤔',
};

export default function BabyPage() {
  const [data, setData] = useState(null);
  const [controls, setControls] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [babyCareContent, setBabyCareContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edición del perfil del bebé
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [sex, setSex] = useState('desconocido');
  const [saving, setSaving] = useState(false);

  // Contador de pataditas del día
  const todayKey = new Date().toISOString().split('T')[0];
  const [kicks, setKicks] = useState(() => {
    try {
      const saved = localStorage.getItem(`mibebe_kicks_${todayKey}`);
      return saved ? JSON.parse(saved) : { count: 0, lastKick: null };
    } catch {
      return { count: 0, lastKick: null };
    }
  });

  // Estado de reproducción de melodía prenatal
  const [isPlayingLullaby, setIsPlayingLullaby] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, controlsRes, photosRes, careRes] = await Promise.allSettled([
        api.getDashboard(),
        api.listControls(),
        api.listPhotos(),
        api.getBabyCare(),
      ]);

      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value);
        setName(dashRes.value.baby?.provisionalName || '');
        setSex(dashRes.value.baby?.sex || 'desconocido');
      } else {
        throw new Error(dashRes.reason?.message || 'Error al cargar datos del bebé.');
      }

      if (controlsRes.status === 'fulfilled') {
        setControls(controlsRes.value?.items || []);
      }
      if (photosRes.status === 'fulfilled') {
        setPhotos(photosRes.value?.items || []);
      }
      if (careRes.status === 'fulfilled') {
        setBabyCareContent(careRes.value);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    return () => {
      stopAlarmLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photoUrl = await uploadFile(file);
      await api.updateBaby({ photoUrl });
      await loadAllData();
    } catch (err) {
      alert(err.message || 'No se pudo subir la foto.');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updateBaby({ provisionalName: name, sex });
      setEditing(false);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  // Manejo de pataditas
  const addKick = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const updated = {
      count: kicks.count + 1,
      lastKick: timeStr,
    };
    setKicks(updated);
    localStorage.setItem(`mibebe_kicks_${todayKey}`, JSON.stringify(updated));

    // Vibración suave de confirmación
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(60); } catch (_) {}
    }
  };

  const resetKicks = () => {
    if (window.confirm('¿Deseas reiniciar el conteo de pataditas de hoy?')) {
      const reset = { count: 0, lastKick: null };
      setKicks(reset);
      localStorage.setItem(`mibebe_kicks_${todayKey}`, JSON.stringify(reset));
    }
  };

  // Melodía prenatal
  const toggleLullaby = () => {
    if (isPlayingLullaby) {
      stopAlarmLoop();
      setIsPlayingLullaby(false);
    } else {
      testAlarmSound('melodia_bebe', 0.6);
      setIsPlayingLullaby(true);
      setTimeout(() => {
        setIsPlayingLullaby(false);
      }, 7000);
    }
  };

  if (loading) return <AppLayout><LoadingState label="Cargando la información de tu bebé..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={loadAllData} /></AppLayout>;
  if (!data) return null;

  const { status, weeklyDevelopment, baby, pregnancy } = data;

  // Filtrar ecografías registradas en el álbum
  const ultrasounds = photos.filter(
    (p) => p.category === 'ecografia' || p.category === 'barriga'
  );

  // Extraer información clínica del último control
  const latestControl = controls.length > 0
    ? [...controls].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  // Formatear FPP
  const fppFormatted = pregnancy?.probableDeliveryDate
    ? new Date(pregnancy.probableDeliveryDate).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'No registrada';

  // Buscar hitos de la semana en la guía médica
  const currentWeekGuide = babyCareContent?.content?.find(
    (w) => Number(w.week) === Number(status.week)
  );

  return (
    <AppLayout>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤰</span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
              Mi Bebé en Gestación
            </h1>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
            Seguimiento prenatal exclusivo: desarrollo fetal intrauterino, pataditas en el vientre, FCF y ecografías.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/carnet-bebe"
            className="btn-secondary !py-2 !px-3 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm border border-secondary/30 text-secondary"
            title="Ir al carnet del bebé nacido"
          >
            <span>👶</span>
            <span>Bebé Nacido (Carnet)</span>
          </Link>
          <Link
            to="/album"
            className="btn-secondary !py-2 !px-3 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm"
          >
            <span>📸</span>
            <span>Álbum</span>
          </Link>
          <Link
            to="/controles"
            className="btn-secondary !py-2 !px-3 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm"
          >
            <span>🩺</span>
            <span>Controles</span>
          </Link>
        </div>
      </header>

      {/* TARJETA DE IDENTIDAD DEL BEBÉ EN GESTACIÓN */}
      <section className="card flex flex-col items-center text-center mb-6 shadow-cloud bg-gradient-to-b from-white to-surface-container/20">
        <label className="relative w-28 h-28 rounded-full overflow-hidden bg-primary-container flex items-center justify-center mb-4 cursor-pointer border-4 border-white shadow-cloud hover:opacity-90 transition-opacity group">
          {baby?.photoUrl ? (
            <img src={baby.photoUrl} alt="Bebé" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">👶</span>
          )}
          <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold">
            Cambiar foto
          </span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhoto} />
        </label>

        {editing ? (
          <div className="w-full max-w-xs flex flex-col gap-3">
            <div>
              <label className="field-label text-left">Nombre del bebé</label>
              <input
                className="input-field text-center"
                placeholder="Nombre provisional o definitivo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label text-left">Sexo</label>
              <select className="input-field" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="desconocido">Aún no lo sabemos</option>
                <option value="nina">Niña 👧</option>
                <option value="nino">Niño 👦</option>
                <option value="sorpresa">¡Será sorpresa! 🎁</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 justify-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                {baby?.provisionalName || 'Tu bebé en camino'}
              </h2>
              <button
                onClick={() => setEditing(true)}
                className="text-primary hover:text-primary/80 text-xs font-semibold p-1 hover:bg-surface-container rounded-full"
                title="Editar datos del bebé"
              >
                ✏️
              </button>
            </div>
            <p className="font-body text-xs sm:text-sm font-semibold text-primary mt-1">
              {SEX_LABELS[baby?.sex] || SEX_LABELS.desconocido}
            </p>

            {/* Badges de gestación */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-surface-container w-full max-w-md text-xs">
              <span className="pill-chip bg-primary-container text-on-primary-container font-semibold">
                Semana {status.week} (+{status.dayOfWeek} días)
              </span>
              <span className="pill-chip bg-secondary-container text-on-secondary-container font-semibold">
                {status.trimesterLabel}
              </span>
              <span className="pill-chip bg-tertiary-container text-on-tertiary-container font-semibold">
                {status.progressPercent}% del camino
              </span>
            </div>
          </>
        )}
      </section>

      {/* RESUMEN DE TIEMPO Y FECHA PROBABLE DE PARTO */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card !p-3 text-center bg-white shadow-cloud-sm">
          <span className="text-xl">⏳</span>
          <p className="text-[11px] text-on-surface-variant font-medium mt-1">Días restantes</p>
          <p className="font-display font-bold text-base sm:text-lg text-primary">{status.daysRemaining} días</p>
        </div>
        <div className="card !p-3 text-center bg-white shadow-cloud-sm">
          <span className="text-xl">📅</span>
          <p className="text-[11px] text-on-surface-variant font-medium mt-1">FPP estimada</p>
          <p className="font-display font-bold text-xs sm:text-sm text-on-surface truncate">{fppFormatted}</p>
        </div>
        <div className="card !p-3 text-center bg-white shadow-cloud-sm">
          <span className="text-xl">📏</span>
          <p className="text-[11px] text-on-surface-variant font-medium mt-1">Longitud fetal</p>
          <p className="font-display font-bold text-base sm:text-lg text-secondary">{weeklyDevelopment.lengthCm} cm</p>
        </div>
        <div className="card !p-3 text-center bg-white shadow-cloud-sm">
          <span className="text-xl">⚖️</span>
          <p className="text-[11px] text-on-surface-variant font-medium mt-1">Peso fetal aprox.</p>
          <p className="font-display font-bold text-base sm:text-lg text-tertiary">{weeklyDevelopment.weightG} g</p>
        </div>
      </section>

      {/* CRECIMIENTO Y TAMAÑO COMPARATIVO DE LA SEMANA */}
      <section className="card mb-6 bg-tertiary-container/25 border border-tertiary/20">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-body text-xs font-bold uppercase tracking-wider text-on-tertiary-container flex items-center gap-1.5">
            <span>🌱</span> Tamaño y Desarrollo esta Semana
          </span>
          <Link to="/mi-embarazo" className="text-xs text-primary hover:underline font-semibold">
            Ver semana a semana →
          </Link>
        </div>

        <div className="bg-white/80 p-4 rounded-xl border border-tertiary/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mb-3 shadow-cloud-sm">
          <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center text-3xl shrink-0">
            🍉
          </div>
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-on-surface">
              Tu bebé tiene el tamaño aproximado de: <span className="text-primary capitalize font-bold">{weeklyDevelopment.size}</span>
            </h3>
            <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">
              {weeklyDevelopment.note}
            </p>
          </div>
        </div>

        {currentWeekGuide && (
          <div className="p-3 bg-white/70 rounded-xl border border-tertiary/10 text-xs text-on-surface-variant space-y-1">
            <p className="font-semibold text-on-surface flex items-center gap-1">
              <span>✨</span> {currentWeekGuide.title}
            </p>
            <p className="leading-relaxed">{currentWeekGuide.description}</p>
          </div>
        )}
      </section>

      {/* REGISTROS CLÍNICOS DEL BEBÉ EN CONTROLES MÉDICOS */}
      <section className="card mb-6">
        <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <div>
              <h3 className="font-display font-bold text-base text-on-surface">
                Mediciones Clínicas del Bebé
              </h3>
              <p className="font-body text-xs text-on-surface-variant">
                Datos extraídos de los controles obstétricos registrados en la aplicación.
              </p>
            </div>
          </div>
          <Link to="/controles" className="text-xs text-primary font-semibold hover:underline shrink-0">
            + Nuevo Control
          </Link>
        </div>

        {controls.length === 0 ? (
          <div className="text-center py-6 bg-surface-container/30 rounded-xl border border-surface-container">
            <span className="text-3xl block mb-2">📋</span>
            <p className="font-body text-xs text-on-surface-variant mb-3">
              Aún no has registrado controles médicos obstétricos con frecuencia cardíaca o altura uterina.
            </p>
            <Link to="/controles" className="btn-primary !py-2 !px-4 text-xs font-semibold !w-auto inline-block">
              Registrar primer control obstétrico
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Frecuencia Cardíaca Fetal */}
              <div className="p-3.5 rounded-xl bg-surface-container/50 border border-outline-variant/30 flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-error-container/40 text-error flex items-center justify-center text-lg shrink-0">
                  💓
                </span>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Frecuencia Cardíaca Fetal (FCF)
                  </span>
                  <p className="font-display font-bold text-lg text-on-surface mt-0.5">
                    {latestControl?.heartRate ? `${latestControl.heartRate} lpm` : 'No registrada'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    Rango normal de referencia: 120 - 160 latidos por minuto.
                  </p>
                </div>
              </div>

              {/* Altura Uterina */}
              <div className="p-3.5 rounded-xl bg-surface-container/50 border border-outline-variant/30 flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center text-lg shrink-0">
                  📐
                </span>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Altura Uterina (Crecimiento)
                  </span>
                  <p className="font-display font-bold text-lg text-on-surface mt-0.5">
                    {latestControl?.uterineHeightCm ? `${latestControl.uterineHeightCm} cm` : 'No registrada'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    Correlaciona con las semanas de gestación (+/- 2 cm).
                  </p>
                </div>
              </div>
            </div>

            {/* Último y próximo control */}
            <div className="p-3 rounded-xl bg-white border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-on-surface-variant">Último control registrado:</span>{' '}
                <strong className="text-on-surface">
                  {latestControl?.date
                    ? new Date(latestControl.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Sin controles'}
                </strong>{' '}
                {latestControl?.doctorName && `con Dr(a). ${latestControl.doctorName}`}
              </div>
              <div>
                <span className="text-on-surface-variant">Total controles:</span>{' '}
                <span className="font-bold text-primary">{controls.length} visitas</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* GALERÍA DE ECOGRAFÍAS REGISTRADAS */}
      <section className="card mb-6">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <div>
              <h3 className="font-display font-bold text-base text-on-surface">
                Ecografías y Fotos del Bebé ({ultrasounds.length})
              </h3>
              <p className="font-body text-xs text-on-surface-variant">
                Imágenes guardadas en el álbum en categorías de ecografía y vientre.
              </p>
            </div>
          </div>
          <Link to="/album" className="text-xs text-primary font-semibold hover:underline">
            Ver Álbum Completo →
          </Link>
        </div>

        {ultrasounds.length === 0 ? (
          <div className="text-center py-6 bg-surface-container/20 rounded-xl border border-dashed border-surface-container">
            <span className="text-3xl block mb-1">👶📸</span>
            <p className="font-body text-xs text-on-surface-variant mb-3">
              Aún no tienes ecografías subidas en tu Álbum.
            </p>
            <Link to="/album" className="btn-secondary !py-2 !px-4 text-xs font-semibold !w-auto inline-block">
              Subir primera ecografía
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ultrasounds.slice(0, 4).map((photo) => (
              <div key={photo.id} className="group relative rounded-xl overflow-hidden bg-black/5 aspect-square border border-surface-container shadow-cloud-sm">
                <img
                  src={photo.imageUrl}
                  alt={photo.description || 'Ecografía del bebé'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                  {photo.weekNumber && (
                    <span className="text-[10px] font-bold bg-primary px-1.5 py-0.5 rounded">
                      Semana {photo.weekNumber}
                    </span>
                  )}
                  {photo.description && (
                    <p className="text-[11px] truncate mt-0.5 font-medium">{photo.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CONTADOR INTERACTIVO DE PATADITAS Y ESTIMULACIÓN */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Contador de Pataditas */}
        <div className="card flex flex-col justify-between bg-primary-container/20 border border-primary/20 shadow-cloud-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span>🦶</span> Contador de Pataditas de Hoy
              </span>
              {kicks.count > 0 && (
                <button
                  type="button"
                  onClick={resetKicks}
                  className="text-[11px] text-on-surface-variant hover:text-error transition-colors"
                >
                  Reiniciar
                </button>
              )}
            </div>

            <p className="font-body text-xs text-on-surface-variant mb-4">
              Monitorear los movimientos activos del bebé brinda tranquilidad sobre su bienestar fetal diario.
            </p>

            <div className="flex items-center justify-around py-3 bg-white rounded-xl border border-primary/15 shadow-cloud-sm mb-4">
              <div className="text-center">
                <span className="font-display font-bold text-3xl sm:text-4xl text-primary block">
                  {kicks.count}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">Movimientos hoy</span>
              </div>
              <div className="text-center border-l border-surface-container pl-4">
                <span className="font-mono font-semibold text-sm text-on-surface block">
                  {kicks.lastKick || 'Aún no registrada'}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">Última patadita</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={addKick}
            className="btn-primary w-full !py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-md active:scale-95 transition-transform"
          >
            <span className="text-lg">🦶</span>
            <span className="font-semibold text-sm">+ Registrar Patadita Sentida</span>
          </button>
        </div>

        {/* Estimulación Prenatal Sonora */}
        <div className="card flex flex-col justify-between bg-secondary-container/25 border border-secondary/25 shadow-cloud-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <span>🎵</span> Estimulación Prenatal Sonora
              </span>
              <span className="text-[11px] font-semibold text-secondary">
                Oído desarrollado
              </span>
            </div>

            <p className="font-body text-xs text-on-surface-variant mb-4 leading-relaxed">
              Tu bebé ya puede percibir vibraciones y sonidos suaves desde el vientre. Escuchar melodías armónicas fomenta la relajación mutua.
            </p>

            <div className="p-4 bg-white rounded-xl border border-secondary/20 shadow-cloud-sm flex items-center gap-3 mb-4">
              <span className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-2xl shrink-0">
                🎼
              </span>
              <div>
                <h4 className="font-display font-semibold text-sm text-on-surface">Melodía de Cuna Dulce</h4>
                <p className="text-xs text-on-surface-variant">Sintetizador suave y armónico para acercar al vientre.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleLullaby}
            className={`w-full py-3 px-4 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              isPlayingLullaby
                ? 'bg-error text-white animate-pulse'
                : 'bg-secondary hover:bg-secondary/90 text-white'
            }`}
          >
            <span>{isPlayingLullaby ? '⏹️ Detener Melodía' : '▶️ Reproducir Melodía de Cuna'}</span>
          </button>
        </div>
      </section>

      {/* Tarjeta de enlace al módulo independiente del Bebé Nacido */}
      <section className="card mb-6 bg-gradient-to-r from-secondary-container/30 to-surface-container border border-secondary/25 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 shadow-cloud-sm">
        <div className="flex items-start gap-3.5 text-center sm:text-left">
          <span className="w-12 h-12 rounded-2xl bg-white shadow-cloud-sm flex items-center justify-center text-2xl shrink-0">
            👶
          </span>
          <div>
            <span className="pill-chip bg-secondary text-white text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
              Módulo Independiente
            </span>
            <h4 className="font-display font-bold text-base text-on-surface">
              ¿Tu bebé ya nació?
            </h4>
            <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-relaxed max-w-xl">
              Accede al <strong>Carnet de Salud Infantil</strong> para registrar sus medidas de nacimiento, monitorear el esquema de vacunas oficiales del PAI, las curvas antropométricas de la OMS y los controles pediátricos.
            </p>
          </div>
        </div>
        <Link
          to="/carnet-bebe"
          className="btn-primary !py-2.5 !px-5 text-xs font-semibold whitespace-nowrap bg-secondary hover:bg-secondary/90 text-white shrink-0 shadow-cloud flex items-center gap-2"
        >
          <span>Abrir Carnet Infantil</span>
          <span>→</span>
        </Link>
      </section>

      <p className="font-body text-xs text-outline text-center mb-6">
        Información educativa y de bitácora basada en tus registros. No sustituye una consulta médica obstétrica presencial.
      </p>
    </AppLayout>
  );
}
