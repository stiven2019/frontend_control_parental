import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api } from '../api/client';
import { evaluateFetalHealth } from '../utils/healthEvaluations';
import FetalHealthModal from '../components/FetalHealthModal';

const EMPTY_BABY_FORM = {
  date: new Date().toISOString().split('T')[0],
  time: '',
  doctorName: '',
  specialty: 'Obstetricia / Ecografía',
  place: '',
  reason: 'Ecografía y Control del Bebé',
  controlType: 'bebe',
  gestationalWeek: '',
  fetalHeartRate: '',
  fetalWeightG: '',
  fetalLengthCm: '',
  biparietalDiameterMm: '',
  femurLengthMm: '',
  abdominalCircumferenceMm: '',
  amnioticFluid: 'normal',
  fetalMovements: 'activo',
  fetalPresentation: 'cefalica',
  placentaMaturity: 'grado_1',
  observations: '',
  recommendations: '',
  nextAppointment: '',
};

export default function BabyGestationalControls() {
  const navigate = useNavigate();
  const [controls, setControls] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_BABY_FORM);

  // Modal de diagnóstico fetal
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [controlsRes, dashRes] = await Promise.allSettled([
        api.listControls(),
        api.getDashboard(),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value);
        if (dashRes.value?.status?.week && !form.gestationalWeek) {
          setForm((f) => ({ ...f, gestationalWeek: dashRes.value.status.week }));
        }
      }

      if (controlsRes.status === 'fulfilled') {
        const all = controlsRes.value?.items || [];
        // Filtrar controles que son del bebé o tienen métricas fetales
        const babyControls = all.filter(
          (c) => c.controlType === 'bebe' || c.fetalHeartRate || c.fetalWeightG || c.fetalAssessment
        );
        setControls(babyControls);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const currentWeek = form.gestationalWeek || dashboardData?.status?.week || 28;
      const cleanPayload = {
        ...form,
        controlType: 'bebe',
        gestationalWeek: currentWeek ? Number(currentWeek) : null,
        fetalHeartRate: form.fetalHeartRate ? Number(form.fetalHeartRate) : null,
        fetalWeightG: form.fetalWeightG ? Number(form.fetalWeightG) : null,
        fetalLengthCm: form.fetalLengthCm ? Number(form.fetalLengthCm) : null,
        biparietalDiameterMm: form.biparietalDiameterMm ? Number(form.biparietalDiameterMm) : null,
        femurLengthMm: form.femurLengthMm ? Number(form.femurLengthMm) : null,
        abdominalCircumferenceMm: form.abdominalCircumferenceMm ? Number(form.abdominalCircumferenceMm) : null,
        nextAppointment: form.nextAppointment || null,
        time: form.time || null,
      };

      // Calcular evaluación y predicción médica de salud fetal
      const assessment = evaluateFetalHealth(cleanPayload, {
        week: currentWeek,
        probableDeliveryDate: dashboardData?.pregnancy?.probableDeliveryDate,
      });

      cleanPayload.fetalAssessment = assessment;

      await api.createControl(cleanPayload);

      // Abrir modal de diagnóstico de inmediato
      setActiveAssessment(assessment);
      setModalOpen(true);

      setShowForm(false);
      setForm({
        ...EMPTY_BABY_FORM,
        gestationalWeek: currentWeek,
      });

      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el control del bebé.');
    } finally {
      setSaving(false);
    }
  };

  const removeControl = async (id) => {
    if (!window.confirm('¿Deseas eliminar este registro fetal?')) return;
    try {
      await api.deleteControl(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const openExistingAssessment = (ctrl) => {
    const assessment = ctrl.fetalAssessment || evaluateFetalHealth(ctrl, {
      week: ctrl.gestationalWeek || dashboardData?.status?.week,
      probableDeliveryDate: dashboardData?.pregnancy?.probableDeliveryDate,
    });
    setActiveAssessment(assessment);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState label="Cargando controles gestacionales del bebé..." />
      </AppLayout>
    );
  }

  const latestControl = controls.length > 0
    ? [...controls].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const latestAssessment = latestControl?.fetalAssessment || (latestControl ? evaluateFetalHealth(latestControl, {
    week: latestControl.gestationalWeek || dashboardData?.status?.week,
  }) : null);

  return (
    <AppLayout>
      {/* Header y Navegación de pestañas */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👶</span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
              Control Gestacional del Bebé
            </h1>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
            Métricas biométricas, ecografías, FCF, percentiles Hadlock y predicción de salud fetal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/controles"
            className="btn-secondary !w-auto !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm border border-secondary/30 text-secondary bg-secondary-container/20 hover:bg-secondary-container/40 rounded-full"
            title="Ir a Controles de Mamá"
          >
            <span>👩‍🍼</span>
            <span>Controles de Mamá</span>
          </Link>
          <Link
            to="/mi-bebe"
            className="btn-secondary !w-auto !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm rounded-full"
            title="Ir a Mi Bebé en Gestación"
          >
            <span>🤰</span>
            <span>Gestación</span>
          </Link>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="btn-primary !w-auto !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm rounded-full"
          >
            <span>{showForm ? '✕ Cancelar' : '+ Control Bebé'}</span>
          </button>
        </div>
      </header>

      {/* Selector de Pestañas entre Controles de Mamá y del Bebé */}
      <div className="flex gap-2 p-1.5 bg-surface-container/40 rounded-2xl mb-6 max-w-md border border-outline-variant/30">
        <Link
          to="/controles"
          className="flex-1 py-2 text-center text-xs font-semibold rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/60 transition-all flex items-center justify-center gap-1.5"
        >
          <span>👩‍🍼</span>
          <span>Salud de Mamá</span>
        </Link>
        <button
          className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-primary text-white shadow-cloud-sm flex items-center justify-center gap-1.5"
        >
          <span>👶</span>
          <span>Salud del Bebé</span>
        </button>
      </div>

      {/* TARJETA RESUMEN DEL ESTADO ACTUAL Y PREDICCIÓN FETAL */}
      {latestAssessment && (
        <section className="card mb-6 bg-gradient-to-br from-white via-surface-container/10 to-primary-container/20 border border-primary/20 shadow-cloud">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  Último Dictamen de Salud Fetal
                </span>
                <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                  {latestAssessment.predictionTitle}
                </h2>
              </div>
            </div>
            <button
              onClick={() => openExistingAssessment(latestControl)}
              className="btn-primary !w-auto !py-1.5 !px-3.5 text-xs font-semibold shrink-0 self-start sm:self-auto rounded-full"
            >
              Ver Informe Completo 📊
            </button>
          </div>

          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-3 leading-relaxed">
            {latestAssessment.predictionSummary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-surface-container/60">
            <div className="p-2.5 rounded-xl bg-white border border-outline-variant/20 text-center shadow-cloud-sm">
              <span className="text-lg">💓</span>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">FCF (Latidos)</p>
              <p className="font-display font-bold text-sm sm:text-base text-rose-600">
                {latestControl?.fetalHeartRate ? `${latestControl.fetalHeartRate} lpm` : 'No reg.'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-outline-variant/20 text-center shadow-cloud-sm">
              <span className="text-lg">⚖️</span>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Peso Estimado</p>
              <p className="font-display font-bold text-sm sm:text-base text-secondary">
                {latestControl?.fetalWeightG ? `${latestControl.fetalWeightG} g` : 'No reg.'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-outline-variant/20 text-center shadow-cloud-sm">
              <span className="text-lg">📊</span>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Percentil Hadlock</p>
              <p className="font-display font-bold text-sm sm:text-base text-primary">
                P{latestAssessment.percentile || 50}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-outline-variant/20 text-center shadow-cloud-sm">
              <span className="text-lg">👶</span>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Predicción al Nacer</p>
              <p className="font-display font-bold text-sm sm:text-base text-tertiary">
                ~{(latestAssessment.birthWeightPredictionG / 1000).toFixed(2)} kg
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FORMULARIO DE REGISTRO DE CONTROL DEL BEBÉ */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4 border-2 border-primary/30 shadow-cloud animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="text-xl">🩺</span>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Registrar Control Gestacional del Bebé
              </h3>
            </div>
            <span className="text-xs text-primary font-semibold bg-primary-container/30 px-2.5 py-1 rounded-full">
              Ecografía y Monitoreo Fetal
            </span>
          </div>

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
                min="10"
                max="43"
                required
                className="input-field"
                placeholder="Ej. 28"
                value={form.gestationalWeek}
                onChange={setField('gestationalWeek')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Médico / Especialista</label>
              <input className="input-field" placeholder="Dr(a). Nombre" value={form.doctorName} onChange={setField('doctorName')} />
            </div>
            <div>
              <label className="field-label">Lugar / Centro Médico</label>
              <input className="input-field" placeholder="Clínica / Centro de Ecografía" value={form.place} onChange={setField('place')} />
            </div>
          </div>

          {/* MEDICIONES FETALES PRINCIPALES */}
          <div className="p-3.5 bg-primary-container/15 rounded-xl border border-primary/20 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>💓</span> Valores Cardiovasculares y Crecimiento Fetal
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label flex items-center justify-between">
                  <span>FCF (Latidos por minuto)</span>
                  <span className="text-[10px] text-primary">Normal: 120-160</span>
                </label>
                <input
                  type="number"
                  min="60"
                  max="220"
                  required
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
                  placeholder="Ej. 1250"
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
                  placeholder="Ej. 37.5"
                  className="input-field font-semibold text-tertiary"
                  value={form.fetalLengthCm}
                  onChange={setField('fetalLengthCm')}
                />
              </div>
            </div>
          </div>

          {/* ENTORNO INTRAUTERINO Y ACTIVIDAD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Líquido Amniótico (ILA)</label>
              <select className="input-field" value={form.amnioticFluid} onChange={setField('amnioticFluid')}>
                <option value="normal">Adecuado / Normal (ILA 5-24 cm) ✅</option>
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

          {/* BIOMETRÍA ECOGRÁFICA COMPLEMENTARIA (OPCIONAL) */}
          <details className="bg-surface-container/30 p-3 rounded-xl border border-surface-container text-xs">
            <summary className="font-semibold text-on-surface cursor-pointer flex items-center justify-between">
              <span>📐 Medidas biométricas ecográficas detalladas (DBP, LF, CA - Opcionales)</span>
              <span className="text-primary text-xs">Desplegar</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-2 border-t border-surface-container">
              <div>
                <label className="field-label">DBP (Diámetro Biparietal mm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 72.5"
                  className="input-field"
                  value={form.biparietalDiameterMm}
                  onChange={setField('biparietalDiameterMm')}
                />
              </div>
              <div>
                <label className="field-label">LF (Longitud Femur mm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 53.0"
                  className="input-field"
                  value={form.femurLengthMm}
                  onChange={setField('femurLengthMm')}
                />
              </div>
              <div>
                <label className="field-label">CA (Circunf. Abdominal mm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 240.0"
                  className="input-field"
                  value={form.abdominalCircumferenceMm}
                  onChange={setField('abdominalCircumferenceMm')}
                />
              </div>
            </div>
          </details>

          <div>
            <label className="field-label">Observaciones y hallazgos ecográficos</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Ej. Perfil biofísico 8/8, anatomía fetal normal..."
              value={form.observations}
              onChange={setField('observations')}
            />
          </div>

          <div>
            <label className="field-label">Recomendaciones del especialista</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Ej. Continuar vitaminas, próxima ecografía en semana 32..."
              value={form.recommendations}
              onChange={setField('recommendations')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Próxima cita / ecografía</label>
              <input type="date" className="input-field" value={form.nextAppointment} onChange={setField('nextAppointment')} />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full !py-3 font-semibold flex items-center justify-center gap-2"
              >
                <span>{saving ? 'Guardando y Evaluando...' : 'Guardar y Predecir Salud del Bebé ✨'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <p className="text-error text-sm font-body mb-4">{error}</p>}

      {/* ESTADO VACÍO SI NO HAY CONTROLES */}
      {controls.length === 0 && !showForm && (
        <EmptyState
          icon="👶"
          title="Aún no tienes controles registrados del bebé"
          description="Registra la FCF, peso fetal ecográfico y medidas de tu bebé para que nuestro sistema prediga su percentil, peso al nacer y estado de salud."
          action={
            <button className="btn-primary max-w-[260px]" onClick={() => setShowForm(true)}>
              + Registrar primer control fetal
            </button>
          }
        />
      )}

      {/* LISTA HISTÓRICA DE CONTROLES DEL BEBÉ */}
      {controls.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-base text-on-surface flex items-center gap-1.5">
              <span>📋</span> Historial de Controles y Ecografías Fetal ({controls.length})
            </h3>
          </div>

          {controls.map((c) => {
            const assessment = c.fetalAssessment || evaluateFetalHealth(c, {
              week: c.gestationalWeek || dashboardData?.status?.week,
            });
            const formattedDate = new Date(`${c.date}T00:00:00`).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div key={c.id} className="card !p-5 hover:shadow-cloud transition-all border border-outline-variant/30">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-on-surface">
                        Control del Bebé · Semana {c.gestationalWeek || 'N/R'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${assessment.statusBadge}`}>
                        {assessment.predictionTitle?.includes('Excelente') ? 'Óptimo 🌟' : 'Seguimiento ⚠️'}
                      </span>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {formattedDate} {c.doctorName ? `· Dr(a). ${c.doctorName}` : ''} {c.place ? `· ${c.place}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeControl(c.id)} className="px-2.5 py-1 rounded-full text-outline hover:text-error hover:bg-error-container/20 text-xs font-semibold transition-colors shrink-0">
                    Eliminar
                  </button>
                </div>

                {/* Métricas destacadas */}
                <div className="flex flex-wrap gap-2 my-3">
                  {c.fetalHeartRate && (
                    <span className="pill-chip bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                      💓 FCF: {c.fetalHeartRate} lpm
                    </span>
                  )}
                  {c.fetalWeightG && (
                    <span className="pill-chip bg-secondary-container/30 border border-secondary/30 text-secondary font-bold">
                      ⚖️ Peso: {c.fetalWeightG} g
                    </span>
                  )}
                  {c.fetalLengthCm && (
                    <span className="pill-chip bg-surface-container text-on-surface-variant font-medium">
                      📏 Longitud: {c.fetalLengthCm} cm
                    </span>
                  )}
                  <span className="pill-chip bg-primary-container/30 text-primary font-bold">
                    📊 P{assessment.percentile || 50} (Hadlock)
                  </span>
                  <span className="pill-chip bg-surface-container text-on-surface-variant">
                    Líquido: {c.amnioticFluid === 'normal' ? 'Normal' : c.amnioticFluid}
                  </span>
                </div>

                {c.observations && (
                  <p className="text-xs text-on-surface-variant bg-surface-container/30 p-2.5 rounded-xl border border-surface-container mb-3 leading-relaxed">
                    <strong>Hallazgos:</strong> {c.observations}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-surface-container text-xs">
                  <span className="text-on-surface-variant bg-surface-container/50 px-3 py-1 rounded-full border border-surface-container/60">
                    Predicción a término: <strong className="text-primary font-bold">~{(assessment.birthWeightPredictionG / 1000).toFixed(2)} kg</strong>
                  </span>
                  <button
                    onClick={() => openExistingAssessment(c)}
                    className="btn-secondary !w-auto !py-1.5 !px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 border border-primary/30 text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-full shadow-cloud-sm transition-all active:scale-95"
                  >
                    <span>👶</span>
                    <span>Dictamen y Predicción ✨</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Dictamen y Pronóstico Fetal */}
      <FetalHealthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        assessment={activeAssessment}
      />
    </AppLayout>
  );
}
