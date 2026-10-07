import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api } from '../api/client';
import { useAlarm } from '../context/AlarmContext';
import { evaluateMaternalHealth, evaluateFetalHealth } from '../utils/healthEvaluations';
import MaternalHealthModal from '../components/MaternalHealthModal';
import FetalHealthModal from '../components/FetalHealthModal';

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  time: '',
  doctorName: '',
  specialty: 'Obstetricia',
  place: '',
  reason: 'Control prenatal mensual',
  // Métricas de Mamá
  weightKg: '',
  bloodPressure: '',
  heartRate: '',
  uterineHeightCm: '',
  // Métricas del Bebé
  gestationalWeek: '',
  fetalHeartRate: '',
  fetalWeightG: '',
  fetalLengthCm: '',
  amnioticFluid: 'normal',
  fetalMovements: 'activo',
  fetalPresentation: 'cefalica',
  // Notas
  observations: '',
  recommendations: '',
  nextAppointment: '',
  controlType: 'mixto',
};

export default function MedicalControls() {
  const { refreshAlarms } = useAlarm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('todos'); // 'todos' | 'mama' | 'bebe'

  const [items, setItems] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Modales de Evaluación
  const [maternalModalOpen, setMaternalModalOpen] = useState(false);
  const [activeMaternalAssessment, setActiveMaternalAssessment] = useState(null);

  const [fetalModalOpen, setFetalModalOpen] = useState(false);
  const [activeFetalAssessment, setActiveFetalAssessment] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [controlsRes, dashRes] = await Promise.allSettled([
        api.listControls(),
        api.getDashboard(),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value);
        if (dashRes.value?.status?.week) {
          setForm((f) => ({ ...f, gestationalWeek: f.gestationalWeek || dashRes.value.status.week }));
        }
      }

      if (controlsRes.status === 'fulfilled') {
        setItems(controlsRes.value?.items || []);
        refreshAlarms();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const week = form.gestationalWeek || dashboardData?.status?.week || null;
      const cleanPayload = {
        ...form,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        heartRate: form.heartRate ? Number(form.heartRate) : null,
        uterineHeightCm: form.uterineHeightCm ? Number(form.uterineHeightCm) : null,
        gestationalWeek: week ? Number(week) : null,
        fetalHeartRate: form.fetalHeartRate ? Number(form.fetalHeartRate) : null,
        fetalWeightG: form.fetalWeightG ? Number(form.fetalWeightG) : null,
        fetalLengthCm: form.fetalLengthCm ? Number(form.fetalLengthCm) : null,
        nextAppointment: form.nextAppointment || null,
        time: form.time || null,
      };

      // 👩‍⚕️ Evaluar salud de Mamá
      const maternalAssessment = evaluateMaternalHealth(cleanPayload, { week });
      cleanPayload.maternalAssessment = maternalAssessment;

      // 👶 Evaluar salud y percentil del Bebé si se ingresaron datos fetales
      let fetalAssessment = null;
      if (cleanPayload.fetalHeartRate || cleanPayload.fetalWeightG) {
        fetalAssessment = evaluateFetalHealth(cleanPayload, {
          week: week || 28,
          probableDeliveryDate: dashboardData?.pregnancy?.probableDeliveryDate,
        });
        cleanPayload.fetalAssessment = fetalAssessment;
      }

      await api.createControl(cleanPayload);

      // Mostrar diagnóstico de salud materna de inmediato
      setActiveMaternalAssessment(maternalAssessment);
      if (fetalAssessment) {
        setActiveFetalAssessment(fetalAssessment);
      }
      setMaternalModalOpen(true);

      setForm({
        ...EMPTY_FORM,
        gestationalWeek: dashboardData?.status?.week || '',
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message || 'Error al guardar el control médico.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Deseas eliminar este control?')) return;
    try {
      await api.deleteControl(id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const openMaternalAssessment = (control) => {
    const assessment = control.maternalAssessment || evaluateMaternalHealth(control, {
      week: control.gestationalWeek || dashboardData?.status?.week,
    });
    setActiveMaternalAssessment(assessment);
    setMaternalModalOpen(true);
  };

  const openFetalAssessment = (control) => {
    const assessment = control.fetalAssessment || evaluateFetalHealth(control, {
      week: control.gestationalWeek || dashboardData?.status?.week,
      probableDeliveryDate: dashboardData?.pregnancy?.probableDeliveryDate,
    });
    setActiveFetalAssessment(assessment);
    setFetalModalOpen(true);
  };

  if (loading) return <AppLayout><LoadingState label="Cargando controles médicos..." /></AppLayout>;

  // Filtrado de controles
  const filteredItems = items.filter((c) => {
    if (filter === 'mama') return c.bloodPressure || c.weightKg || c.uterineHeightCm;
    if (filter === 'bebe') return c.fetalHeartRate || c.fetalWeightG || c.controlType === 'bebe';
    return true; // 'todos'
  });

  return (
    <AppLayout>
      {/* Encabezado limpio y proporcionado */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
            Controles médicos
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Historial clínico de la mamá y monitoreo del desarrollo del bebé.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-primary !w-auto !py-2.5 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-cloud shrink-0 self-start sm:self-auto rounded-full"
        >
          <span>{showForm ? '✕ Cancelar' : '+ Agregar control'}</span>
        </button>
      </header>

      {error && <p className="text-error text-sm font-body mb-4">{error}</p>}

      {/* FORMULARIO INTEGRAL DE CONTROL */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4 border-2 border-primary/20 shadow-cloud animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
              <span>🩺</span> Nuevo Control Prenatal
            </h3>
            <span className="text-[11px] font-semibold text-primary bg-primary-container/30 px-2.5 py-1 rounded-full">
              Evaluación de Mamá y Bebé
            </span>
          </div>

          {/* DATOS DE LA CONSULTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Fecha del control</label>
              <input type="date" required className="input-field" value={form.date} onChange={setField('date')} />
            </div>
            <div>
              <label className="field-label">Hora (opcional)</label>
              <input type="time" className="input-field" value={form.time} onChange={setField('time')} />
            </div>
            <div>
              <label className="field-label">Semana de gestación</label>
              <input
                type="number"
                min="1"
                max="43"
                placeholder="Ej. 26"
                className="input-field"
                value={form.gestationalWeek}
                onChange={setField('gestationalWeek')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Médico</label>
              <input className="input-field" placeholder="Dr(a). Nombre" value={form.doctorName} onChange={setField('doctorName')} />
            </div>
            <div>
              <label className="field-label">Lugar / IPS</label>
              <input className="input-field" placeholder="Clínica o consultorio" value={form.place} onChange={setField('place')} />
            </div>
          </div>

          <div>
            <label className="field-label">Motivo de consulta</label>
            <input className="input-field" placeholder="Control prenatal mensual / Ecografía" value={form.reason} onChange={setField('reason')} />
          </div>

          {/* SECCIÓN 1: SALUD DE MAMÁ */}
          <div className="p-3.5 bg-surface-container/30 rounded-xl border border-outline-variant/30 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span>👩‍🍼</span> Valores y Signos de la Mamá
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label flex items-center justify-between">
                  <span>Presión arterial</span>
                  <span className="text-[10px] text-primary">Ej: 120/80</span>
                </label>
                <input
                  className="input-field font-semibold"
                  placeholder="120/80"
                  value={form.bloodPressure}
                  onChange={setField('bloodPressure')}
                />
              </div>

              <div>
                <label className="field-label flex items-center justify-between">
                  <span>FC Mamá (lpm)</span>
                  <span className="text-[10px] text-secondary">60 - 95</span>
                </label>
                <input
                  type="number"
                  min="40"
                  max="180"
                  placeholder="78"
                  className="input-field"
                  value={form.heartRate}
                  onChange={setField('heartRate')}
                />
              </div>

              <div>
                <label className="field-label flex items-center justify-between">
                  <span>Peso (kg)</span>
                  <span className="text-[10px] text-tertiary">Ponderal</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  placeholder="62.5"
                  className="input-field"
                  value={form.weightKg}
                  onChange={setField('weightKg')}
                />
              </div>
            </div>

            <div>
              <label className="field-label flex items-center justify-between">
                <span>Altura uterina (cm)</span>
                <span className="text-[10px] text-on-surface-variant">Regla de McDonald</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="10"
                max="50"
                placeholder="26.0"
                className="input-field"
                value={form.uterineHeightCm}
                onChange={setField('uterineHeightCm')}
              />
            </div>
          </div>

          {/* SECCIÓN 2: VALORES DEL BEBÉ EN GESTACIÓN */}
          <div className="p-3.5 bg-primary-container/15 rounded-xl border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span>👶</span> Valores del Bebé en Gestación (Ecografía y FCF)
              </span>
              <span className="text-[10px] text-primary font-semibold">Predicción Fetal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label flex items-center justify-between">
                  <span>FCF (Latidos del bebé)</span>
                  <span className="text-[10px] text-rose-600 font-semibold">120-160 lpm</span>
                </label>
                <input
                  type="number"
                  min="60"
                  max="220"
                  placeholder="Ej. 142"
                  className="input-field font-semibold text-rose-700"
                  value={form.fetalHeartRate}
                  onChange={setField('fetalHeartRate')}
                />
              </div>

              <div>
                <label className="field-label flex items-center justify-between">
                  <span>Peso fetal estimado (g)</span>
                  <span className="text-[10px] text-secondary">Ecografía</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="6000"
                  placeholder="Ej. 760"
                  className="input-field font-semibold text-secondary"
                  value={form.fetalWeightG}
                  onChange={setField('fetalWeightG')}
                />
              </div>

              <div>
                <label className="field-label flex items-center justify-between">
                  <span>Longitud fetal (cm)</span>
                  <span className="text-[10px] text-tertiary">Cabeza a talón</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="60"
                  placeholder="Ej. 35.5"
                  className="input-field"
                  value={form.fetalLengthCm}
                  onChange={setField('fetalLengthCm')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label">Líquido Amniótico (ILA)</label>
                <select className="input-field" value={form.amnioticFluid} onChange={setField('amnioticFluid')}>
                  <option value="normal">Adecuado / Normal ✅</option>
                  <option value="bajo">Disminuido (Oligohidramnios) ⚠️</option>
                  <option value="aumentado">Aumentado (Polihidramnios) ⚠️</option>
                </select>
              </div>

              <div>
                <label className="field-label">Movimientos Fetales</label>
                <select className="input-field" value={form.fetalMovements} onChange={setField('fetalMovements')}>
                  <option value="activo">Activo y vigoroso 🦶</option>
                  <option value="normal">Normal y constante</option>
                  <option value="disminuido">Disminuido ⚠️</option>
                </select>
              </div>

              <div>
                <label className="field-label">Presentación Fetal</label>
                <select className="input-field" value={form.fetalPresentation} onChange={setField('fetalPresentation')}>
                  <option value="cefalica">Cefálica (Cabeza abajo) 👶</option>
                  <option value="podalica">Podálica / De nalgas</option>
                  <option value="transversa">Transversa (Atravesado)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="field-label">Observaciones y hallazgos</label>
            <textarea className="input-field" rows={2} placeholder="Comentarios del control..." value={form.observations} onChange={setField('observations')} />
          </div>

          <div>
            <label className="field-label">Recomendaciones del médico</label>
            <textarea className="input-field" rows={2} placeholder="Indicaciones médicas..." value={form.recommendations} onChange={setField('recommendations')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Próxima cita prenatal</label>
              <input type="date" className="input-field" value={form.nextAppointment} onChange={setField('nextAppointment')} />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full !py-3 font-semibold flex items-center justify-center gap-2 shadow-cloud"
              >
                <span>{saving ? 'Guardando y evaluando...' : 'Guardar control y ver salud 💖'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* BARRA DE FILTROS EMBEBIDA DENTRO DE UN CARD LIMPIO */}
      {items.length > 0 && (
        <div className="card !p-2.5 mb-4 bg-white/80 shadow-cloud-sm border border-outline-variant/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-on-surface-variant px-2 hidden sm:inline">
              Filtro:
            </span>
            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === 'todos'
                  ? 'bg-primary text-white shadow-cloud-sm'
                  : 'bg-surface-container/50 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => setFilter('mama')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                filter === 'mama'
                  ? 'bg-primary text-white shadow-cloud-sm'
                  : 'bg-surface-container/50 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span>👩‍🍼</span>
              <span>Salud de Mamá</span>
            </button>
            <button
              onClick={() => setFilter('bebe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                filter === 'bebe'
                  ? 'bg-primary text-white shadow-cloud-sm'
                  : 'bg-surface-container/50 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span>👶</span>
              <span>Datos del Bebé</span>
            </button>
          </div>

          <span className="text-[11px] text-on-surface-variant px-2 font-medium hidden md:inline">
            {filteredItems.length} controles listados
          </span>
        </div>
      )}

      {/* ESTADO VACÍO */}
      {items.length === 0 && !showForm && (
        <EmptyState
          icon="🩺"
          title="Aún no tienes controles registrados"
          description="Registra tu control prenatal para llevar el historial médico de mamá y ver cómo viene creciendo tu bebé."
          action={
            <button className="btn-primary max-w-[220px]" onClick={() => setShowForm(true)}>
              + Agregar control
            </button>
          }
        />
      )}

      {/* LISTA UNIFICADA DE CONTROLES */}
      <div className="flex flex-col gap-3">
        {filteredItems.map((c) => {
          const hasMomData = c.bloodPressure || c.weightKg || c.uterineHeightCm || c.heartRate;
          const hasBabyData = c.fetalHeartRate || c.fetalWeightG || c.fetalAssessment;

          const maternalAssessment = c.maternalAssessment || (hasMomData ? evaluateMaternalHealth(c, {
            week: c.gestationalWeek || dashboardData?.status?.week,
          }) : null);

          const fetalAssessment = c.fetalAssessment || (hasBabyData ? evaluateFetalHealth(c, {
            week: c.gestationalWeek || dashboardData?.status?.week,
            probableDeliveryDate: dashboardData?.pregnancy?.probableDeliveryDate,
          }) : null);

          // Formateo seguro de fecha
          let dateStr = c.date;
          try {
            const rawDate = typeof c.date === 'string' && c.date.includes('T') ? c.date.split('T')[0] : c.date;
            dateStr = new Date(`${rawDate}T00:00:00`).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          } catch (_) {
            dateStr = c.date;
          }

          return (
            <div key={c.id} className="card !p-5 hover:shadow-cloud transition-all border border-outline-variant/30">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-base text-on-surface">
                      Control prenatal {c.gestationalWeek ? `· Sem ${c.gestationalWeek}` : ''}
                    </span>
                    {maternalAssessment && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${maternalAssessment.badgeColor}`}>
                        {maternalAssessment.level === 'optimo' ? 'Mamá Óptima 💚' : maternalAssessment.level === 'atencion' ? 'Mamá: Monitoreo ⚠️' : 'Mamá: Alerta 🚨'}
                      </span>
                    )}
                    {fetalAssessment && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${fetalAssessment.statusBadge}`}>
                        {fetalAssessment.level === 'optimo' ? 'Bebé Saludable 🌟' : 'Bebé: Seguimiento ⚠️'}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">
                    {dateStr}
                    {c.doctorName ? ` · Dr(a). ${c.doctorName}` : ''}
                    {c.place ? ` · ${c.place}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="px-2.5 py-1 rounded-lg text-outline hover:text-error hover:bg-error-container/20 text-xs font-semibold transition-colors shrink-0"
                  title="Eliminar control"
                >
                  Eliminar
                </button>
              </div>

              {/* CHIPS DE MÉTRICAS */}
              <div className="flex flex-wrap gap-2 my-3">
                {/* Métricas de Mamá */}
                {c.bloodPressure && (
                  <span className="pill-chip bg-surface-container text-on-surface-variant font-bold">
                    PA {c.bloodPressure}
                  </span>
                )}
                {c.heartRate && (
                  <span className="pill-chip bg-surface-container text-on-surface-variant font-medium">
                    FC {c.heartRate} lpm
                  </span>
                )}
                {c.weightKg && (
                  <span className="pill-chip bg-surface-container text-on-surface-variant font-medium">
                    Peso {c.weightKg} kg
                  </span>
                )}
                {c.uterineHeightCm && (
                  <span className="pill-chip bg-surface-container text-on-surface-variant font-medium">
                    AU {c.uterineHeightCm} cm
                  </span>
                )}

                {/* Métricas del Bebé */}
                {c.fetalHeartRate && (
                  <span className="pill-chip bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                    💓 FCF Bebé: {c.fetalHeartRate} lpm
                  </span>
                )}
                {c.fetalWeightG && (
                  <span className="pill-chip bg-secondary-container/40 border border-secondary/30 text-secondary font-bold">
                    ⚖️ Peso Bebé: {c.fetalWeightG} g {fetalAssessment ? `(P${fetalAssessment.percentile})` : ''}
                  </span>
                )}
                {c.fetalLengthCm && (
                  <span className="pill-chip bg-surface-container text-on-surface-variant">
                    📏 {c.fetalLengthCm} cm
                  </span>
                )}
              </div>

              {c.observations && (
                <p className="text-xs text-on-surface-variant bg-surface-container/30 p-2.5 rounded-xl border border-surface-container mb-3 leading-relaxed">
                  {c.observations}
                </p>
              )}

              {/* BOTONES PRESENTABLES Y CONTENIDOS DENTRO DEL CARD */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-surface-container mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {hasMomData && (
                    <button
                      type="button"
                      onClick={() => openMaternalAssessment(c)}
                      className="btn-secondary !w-auto !py-1.5 !px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 border border-primary/30 text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-full shadow-cloud-sm transition-all active:scale-95"
                    >
                      <span>👩‍⚕️</span>
                      <span>Salud de Mamá</span>
                    </button>
                  )}
                  {hasBabyData && (
                    <button
                      type="button"
                      onClick={() => openFetalAssessment(c)}
                      className="btn-secondary !w-auto !py-1.5 !px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 border border-secondary/30 text-secondary bg-secondary-container/20 hover:bg-secondary-container/40 rounded-full shadow-cloud-sm transition-all active:scale-95"
                    >
                      <span>👶</span>
                      <span>Pronóstico Fetal</span>
                      <span>✨</span>
                    </button>
                  )}
                </div>

                {fetalAssessment && (
                  <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container/50 px-3 py-1 rounded-full border border-surface-container/60">
                    A término: <strong className="text-primary font-bold">~{(fetalAssessment.birthWeightPredictionG / 1000).toFixed(2)} kg</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALES DE RESULTADOS */}
      <MaternalHealthModal
        isOpen={maternalModalOpen}
        onClose={() => setMaternalModalOpen(false)}
        assessment={activeMaternalAssessment}
      />

      <FetalHealthModal
        isOpen={fetalModalOpen}
        onClose={() => setFetalModalOpen(false)}
        assessment={activeFetalAssessment}
      />
    </AppLayout>
  );
}
