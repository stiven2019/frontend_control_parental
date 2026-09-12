import { useState } from 'react';
import {
  DEFAULT_VACCINES,
  DEVELOPMENT_MILESTONES,
  calculateGrowthMetrics,
} from '../data/postnatalData';

export default function BornBabyCarnet({ baby, onUpdateBaby }) {
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'vaccines' | 'milestones' | 'birth'
  const [showControlModal, setShowControlModal] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulario de control pediátrico
  const [controlForm, setControlForm] = useState({
    date: new Date().toISOString().split('T')[0],
    ageMonths: 1,
    weightKg: '',
    lengthCm: '',
    headCircCm: '',
    doctorName: '',
    place: '',
    notes: '',
  });

  // Formulario de datos de nacimiento
  const [birthForm, setBirthForm] = useState({
    birthDate: baby?.birthDate || new Date().toISOString().split('T')[0],
    birthTime: baby?.birthTime || '12:00',
    birthWeightG: baby?.birthWeightG || 3200,
    birthLengthCm: baby?.birthLengthCm || 50.0,
    birthHeadCircCm: baby?.birthHeadCircCm || 34.5,
    deliveryType: baby?.deliveryType || 'vaginal',
    bloodType: baby?.bloodType || 'O+',
    birthPlace: baby?.birthPlace || '',
  });

  // Vacunas y controles guardados o por defecto
  const vaccines = (baby?.vaccines && baby.vaccines.length > 0)
    ? baby.vaccines
    : DEFAULT_VACCINES;

  const milestones = (baby?.developmentalMilestones && baby.developmentalMilestones.length > 0)
    ? baby.developmentalMilestones
    : DEVELOPMENT_MILESTONES;

  const postnatalControls = baby?.postnatalControls || [];

  // Calcular edad actual en meses y días
  const birthDateObj = baby?.birthDate ? new Date(baby.birthDate) : new Date();
  const todayObj = new Date();
  const diffTime = Math.max(0, todayObj - birthDateObj);
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const ageMonthsExact = Number((totalDays / 30.44).toFixed(1));
  const ageMonthsInt = Math.floor(totalDays / 30.44);
  const remainingDays = Math.floor(totalDays % 30.44);

  // Último control registrado o datos de nacimiento
  const latestControl = postnatalControls.length > 0
    ? [...postnatalControls].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const currentWeightKg = latestControl?.weightKg || (baby?.birthWeightG ? baby.birthWeightG / 1000 : 3.3);
  const currentLengthCm = latestControl?.lengthCm || baby?.birthLengthCm || 50.0;
  const currentHeadCircCm = latestControl?.headCircCm || baby?.birthHeadCircCm || 34.5;

  // Diagnóstico OMS
  const diagnosis = calculateGrowthMetrics({
    ageMonths: Math.min(24, Math.round(ageMonthsExact)),
    weightKg: Number(currentWeightKg),
    lengthCm: Number(currentLengthCm),
    headCircCm: Number(currentHeadCircCm),
    sex: baby?.sex || 'desconocido',
  });

  // Guardar nuevo control pediátrico
  const handleAddControl = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newControl = {
        id: 'postnatal_' + Date.now(),
        ...controlForm,
        weightKg: Number(controlForm.weightKg),
        lengthCm: Number(controlForm.lengthCm),
        headCircCm: Number(controlForm.headCircCm),
      };
      const updated = [newControl, ...postnatalControls];
      await onUpdateBaby({ postnatalControls: updated });
      setShowControlModal(false);
      setControlForm({
        date: new Date().toISOString().split('T')[0],
        ageMonths: Math.round(ageMonthsExact),
        weightKg: '',
        lengthCm: '',
        headCircCm: '',
        doctorName: '',
        place: '',
        notes: '',
      });
    } finally {
      setSaving(false);
    }
  };

  // Guardar datos de nacimiento
  const handleSaveBirth = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateBaby({
        ...birthForm,
        isBorn: true,
        birthWeightG: Number(birthForm.birthWeightG),
        birthLengthCm: Number(birthForm.birthLengthCm),
        birthHeadCircCm: Number(birthForm.birthHeadCircCm),
      });
      setShowBirthModal(false);
    } finally {
      setSaving(false);
    }
  };

  // Alternar estado de vacuna
  const toggleVaccine = async (vacId) => {
    const updated = vaccines.map((v) => {
      if (v.id === vacId) {
        const nextState = !v.applied;
        return {
          ...v,
          applied: nextState,
          dateApplied: nextState ? new Date().toISOString().split('T')[0] : null,
        };
      }
      return v;
    });
    await onUpdateBaby({ vaccines: updated });
  };

  // Alternar estado de hito de desarrollo
  const toggleMilestone = async (mId) => {
    const updated = milestones.map((m) => {
      if (m.id === mId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });
    await onUpdateBaby({ developmentalMilestones: updated });
  };

  // Contadores de progreso
  const vaccinesAppliedCount = vaccines.filter((v) => v.applied).length;
  const milestonesCompletedCount = milestones.filter((m) => m.completed).length;

  return (
    <div className="space-y-6">
      {/* TARJETA SUPERIOR DEL CARNET INFANTIL */}
      <section className="card bg-gradient-to-br from-white via-surface to-secondary-container/20 border-2 border-secondary/20 shadow-cloud p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center text-4xl shadow-cloud-sm shrink-0 overflow-hidden border-2 border-white">
              {baby?.photoUrl ? (
                <img src={baby.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                '👶'
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary text-white uppercase tracking-wider mb-1">
                <span>✓</span> Carnet de Salud Infantil y Crecimiento
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-on-surface">
                {baby?.provisionalName || 'Mi Bebé'}
              </h2>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                Nacido el {birthDateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                <strong className="text-secondary font-semibold">
                  {ageMonthsInt > 0 ? `${ageMonthsInt} meses y ${remainingDays} días` : `${totalDays} días de vida`}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBirthModal(true)}
              className="btn-secondary !py-2 !px-3 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm"
            >
              <span>📋</span> Ficha de Nacimiento
            </button>
            <button
              type="button"
              onClick={() => setShowControlModal(true)}
              className="btn-primary !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-cloud-sm bg-secondary hover:bg-secondary/90"
            >
              <span>+</span> Nuevo Control Pediátrico
            </button>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS DEL CARNET */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-secondary/15">
          <div className="bg-white/80 p-3 rounded-xl border border-secondary/10 text-center">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Peso Actual
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-secondary">
              {Number(currentWeightKg).toFixed(2)} kg
            </span>
            <span className={`text-[10px] font-bold block mt-0.5 ${
              diagnosis.weightStatus.tone === 'success' ? 'text-secondary' : 'text-error'
            }`}>
              {diagnosis.weightStatus.status}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-secondary/10 text-center">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Talla Actual
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-primary">
              {Number(currentLengthCm).toFixed(1)} cm
            </span>
            <span className="text-[10px] font-bold text-primary block mt-0.5">
              {diagnosis.lengthStatus.status}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-secondary/10 text-center">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Perímetro Cefálico
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-tertiary">
              {Number(currentHeadCircCm).toFixed(1)} cm
            </span>
            <span className="text-[10px] font-bold text-tertiary block mt-0.5">
              {diagnosis.headStatus.status}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-secondary/10 text-center">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Vacunas al Día
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-on-surface">
              {vaccinesAppliedCount} / {vaccines.length}
            </span>
            <span className="text-[10px] font-bold text-secondary block mt-0.5">
              {Math.round((vaccinesAppliedCount / vaccines.length) * 100)}% Completado
            </span>
          </div>
        </div>
      </section>

      {/* SELECTOR DE PESTAÑAS DEL CARNET */}
      <div className="flex gap-2 border-b border-surface-container pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>📈</span> Curvas y Controles Pediátricos ({postnatalControls.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vaccines')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'vaccines'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>💉</span> Carnet de Vacunación PAI ({vaccinesAppliedCount}/{vaccines.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'milestones'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>🧠</span> Hitos del Neurodesarrollo ({milestonesCompletedCount}/{milestones.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('birth')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'birth'
              ? 'bg-secondary text-white shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>👶</span> Datos del Nacimiento
        </button>
      </div>

      {/* CONTENIDO 1: CURVAS Y CONTROLES PEDIÁTRICOS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Tarjeta de Diagnóstico Nutricional según OMS */}
          <div className="card p-5 border border-outline-variant/30 bg-white shadow-cloud-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                <span>🩺</span> Diagnóstico Antropométrico Oficial (OMS)
              </span>
              <span className="text-[11px] font-semibold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full">
                Edad: {ageMonthsExact} meses
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-container/50 border border-surface-container">
                <span className="font-semibold text-on-surface block mb-1">Peso / Edad:</span>
                <p className="text-secondary font-bold text-sm">{diagnosis.weightStatus.status}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{diagnosis.weightStatus.text}</p>
                <div className="mt-2 text-[10px] text-on-surface-variant border-t border-outline-variant/20 pt-1">
                  Rango OMS normal: {diagnosis.references.weight.min} - {diagnosis.references.weight.max} kg (Mediana: {diagnosis.references.weight.median} kg)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container/50 border border-surface-container">
                <span className="font-semibold text-on-surface block mb-1">Talla / Edad:</span>
                <p className="text-primary font-bold text-sm">{diagnosis.lengthStatus.status}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{diagnosis.lengthStatus.text}</p>
                <div className="mt-2 text-[10px] text-on-surface-variant border-t border-outline-variant/20 pt-1">
                  Rango OMS normal: {diagnosis.references.length.min} - {diagnosis.references.length.max} cm (Mediana: {diagnosis.references.length.median} cm)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container/50 border border-surface-container">
                <span className="font-semibold text-on-surface block mb-1">Perímetro Cefálico:</span>
                <p className="text-tertiary font-bold text-sm">{diagnosis.headStatus.status}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{diagnosis.headStatus.text}</p>
                <div className="mt-2 text-[10px] text-on-surface-variant border-t border-outline-variant/20 pt-1">
                  Rango OMS normal: {diagnosis.references.headCirc.min} - {diagnosis.references.headCirc.max} cm (Mediana: {diagnosis.references.headCirc.median} cm)
                </div>
              </div>
            </div>
          </div>

          {/* Historial de Controles Registrados */}
          <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Historial de Visitas de Crecimiento y Desarrollo ({postnatalControls.length})
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Monitoreo periódico según la Resolución 3280 de 2018 (Control del recién nacido y lactante).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowControlModal(true)}
                className="btn-primary !py-1.5 !px-3 text-xs font-semibold !w-auto bg-secondary"
              >
                + Agregar Visita
              </button>
            </div>

            {postnatalControls.length === 0 ? (
              <div className="text-center py-8 bg-surface-container/20 rounded-xl border border-dashed border-surface-container">
                <span className="text-3xl block mb-1">📋</span>
                <p className="font-body text-xs text-on-surface-variant mb-3">
                  Aún no has registrado visitas pediátricas de crecimiento y desarrollo.
                </p>
                <button
                  type="button"
                  onClick={() => setShowControlModal(true)}
                  className="btn-primary !py-2 !px-4 text-xs font-semibold !w-auto inline-block bg-secondary"
                >
                  Registrar primer control pediátrico
                </button>
              </div>
            ) : (
              <div className="divide-y divide-surface-container">
                {postnatalControls.map((ctrl, idx) => (
                  <div key={ctrl.id || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-on-surface">
                          Control de los {ctrl.ageMonths} meses
                        </span>
                        <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          {new Date(ctrl.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-on-surface-variant">
                        <span>⚖️ <strong>{ctrl.weightKg} kg</strong></span>
                        <span>📏 <strong>{ctrl.lengthCm} cm</strong></span>
                        <span>📐 <strong>{ctrl.headCircCm} cm</strong> (PC)</span>
                        {ctrl.doctorName && <span>👨‍⚕️ Dr(a). {ctrl.doctorName}</span>}
                      </div>
                      {ctrl.notes && (
                        <p className="mt-1 text-[11px] text-on-surface bg-surface-container/40 p-1.5 rounded">
                          📝 {ctrl.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO 2: CARNET DE VACUNACIÓN PAI */}
      {activeTab === 'vaccines' && (
        <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
            <div>
              <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                <span>💉</span> Esquema de Vacunación Infantil (PAI Colombia)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Lleva el control de todas las vacunas obligatorias y gratuitas desde el nacimiento.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-secondary">
                {vaccinesAppliedCount} de {vaccines.length} aplicadas
              </span>
              <div className="w-24 bg-surface-container rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-secondary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(vaccinesAppliedCount / vaccines.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vaccines.map((v) => (
              <div
                key={v.id}
                onClick={() => toggleVaccine(v.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  v.applied
                    ? 'bg-secondary-container/25 border-secondary/40 shadow-sm'
                    : 'bg-white border-surface-container hover:border-secondary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={v.applied}
                    onChange={() => {}} // Manejado por onClick del contenedor
                    className="mt-1 w-4 h-4 accent-secondary rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-on-surface">{v.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        {v.ageGroup}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Protege contra: {v.disease}
                    </p>
                    {v.applied && v.dateApplied && (
                      <p className="text-[10px] font-bold text-secondary mt-1">
                        ✓ Aplicada el {v.dateApplied}
                      </p>
                    )}
                  </div>
                </div>

                <span className={`pill-chip !py-0.5 !px-2 text-[10px] shrink-0 font-bold ${
                  v.applied
                    ? 'bg-secondary text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {v.applied ? 'Aplicada' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO 3: HITOS DEL DESARROLLO PSICOMOTOR */}
      {activeTab === 'milestones' && (
        <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
            <div>
              <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                <span>🧠</span> Escala Abreviada de Desarrollo Psicomotor (EAD)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Marca los logros evolutivos de tu pequeño en motricidad, lenguaje y socialización.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary">
                {milestonesCompletedCount} de {milestones.length} alcanzados
              </span>
              <div className="w-24 bg-surface-container rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(milestonesCompletedCount / milestones.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {milestones.map((m) => (
              <div
                key={m.id}
                onClick={() => toggleMilestone(m.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  m.completed
                    ? 'bg-primary-container/30 border-primary/40 shadow-sm'
                    : 'bg-white border-surface-container hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-on-surface">{m.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">
                        {m.ageRange}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      {m.description}
                    </p>
                    <span className="text-[10px] text-primary font-bold mt-1 inline-block">
                      Área: {m.area}
                    </span>
                  </div>
                </div>

                <span className={`pill-chip !py-0.5 !px-2 text-[10px] shrink-0 font-bold ${
                  m.completed
                    ? 'bg-primary text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {m.completed ? 'Logrado ✓' : 'En progreso'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO 4: DATOS DE NACIMIENTO */}
      {activeTab === 'birth' && (
        <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div>
              <h3 className="font-display font-bold text-base text-on-surface">
                Ficha Técnica de Nacimiento y Parto
              </h3>
              <p className="text-xs text-on-surface-variant">Datos perinatales de ingreso al carnet infantil.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBirthModal(true)}
              className="btn-secondary !py-1.5 !px-3 text-xs font-semibold !w-auto"
            >
              Editar Datos
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container">
              <span className="text-on-surface-variant block text-[11px]">Fecha y Hora:</span>
              <strong className="text-sm font-bold text-on-surface">{baby?.birthDate || 'No registrada'}</strong>
              <p className="text-[10px] text-on-surface-variant">{baby?.birthTime || '--:--'}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container">
              <span className="text-on-surface-variant block text-[11px]">Peso al Nacer:</span>
              <strong className="text-sm font-bold text-secondary">{baby?.birthWeightG ? `${baby.birthWeightG} g` : 'No registrado'}</strong>
              <p className="text-[10px] text-on-surface-variant">({(Number(baby?.birthWeightG || 0) / 1000).toFixed(2)} kg)</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container">
              <span className="text-on-surface-variant block text-[11px]">Talla al Nacer:</span>
              <strong className="text-sm font-bold text-primary">{baby?.birthLengthCm ? `${baby.birthLengthCm} cm` : 'No registrada'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container">
              <span className="text-on-surface-variant block text-[11px]">Perímetro Cefálico:</span>
              <strong className="text-sm font-bold text-tertiary">{baby?.birthHeadCircCm ? `${baby.birthHeadCircCm} cm` : 'No registrado'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container">
              <span className="text-on-surface-variant block text-[11px]">Tipo de Parto:</span>
              <strong className="text-sm font-bold text-on-surface capitalize">{baby?.deliveryType || 'Vaginal'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container">
              <span className="text-on-surface-variant block text-[11px]">Grupo Sanguíneo:</span>
              <strong className="text-sm font-bold text-on-surface">{baby?.bloodType || 'No registrado'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-surface-container sm:col-span-2">
              <span className="text-on-surface-variant block text-[11px]">Lugar / Clínica de Nacimiento:</span>
              <strong className="text-sm font-bold text-on-surface">{baby?.birthPlace || 'Clínica / Hospital'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR CONTROL PEDIÁTRICO */}
      {showControlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-secondary/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span>🩺</span> Nuevo Control Pediátrico
              </h3>
              <button
                type="button"
                onClick={() => setShowControlModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddControl} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Fecha del control</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={controlForm.date}
                    onChange={(e) => setControlForm({ ...controlForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Edad (en meses)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    className="input-field"
                    value={controlForm.ageMonths}
                    onChange={(e) => setControlForm({ ...controlForm, ageMonths: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="field-label">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="30"
                    required
                    placeholder="Ej: 4.5"
                    className="input-field"
                    value={controlForm.weightKg}
                    onChange={(e) => setControlForm({ ...controlForm, weightKg: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Talla (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="130"
                    required
                    placeholder="Ej: 56.5"
                    className="input-field"
                    value={controlForm.lengthCm}
                    onChange={(e) => setControlForm({ ...controlForm, lengthCm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">PC (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="25"
                    max="60"
                    required
                    placeholder="Ej: 38.0"
                    className="input-field"
                    value={controlForm.headCircCm}
                    onChange={(e) => setControlForm({ ...controlForm, headCircCm: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Médico o Pediatra</label>
                <input
                  type="text"
                  placeholder="Dr(a). Nombre"
                  className="input-field"
                  value={controlForm.doctorName}
                  onChange={(e) => setControlForm({ ...controlForm, doctorName: e.target.value })}
                />
              </div>

              <div>
                <label className="field-label">Notas u observaciones médicas</label>
                <textarea
                  rows="2"
                  placeholder="Recomendaciones de lactancia, vacunas, etc."
                  className="input-field"
                  value={controlForm.notes}
                  onChange={(e) => setControlForm({ ...controlForm, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowControlModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 bg-secondary hover:bg-secondary/90"
                >
                  {saving ? 'Guardando...' : 'Guardar Control'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CONFIGURAR O EDITAR DATOS DE NACIMIENTO */}
      {showBirthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-secondary/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                <span>📋</span> Ficha de Nacimiento del Bebé
              </h3>
              <button
                type="button"
                onClick={() => setShowBirthModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBirth} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={birthForm.birthDate}
                    onChange={(e) => setBirthForm({ ...birthForm, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Hora de Nacimiento</label>
                  <input
                    type="time"
                    className="input-field"
                    value={birthForm.birthTime}
                    onChange={(e) => setBirthForm({ ...birthForm, birthTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="field-label">Peso al nacer (g)</label>
                  <input
                    type="number"
                    min="500"
                    max="7000"
                    required
                    placeholder="3200"
                    className="input-field"
                    value={birthForm.birthWeightG}
                    onChange={(e) => setBirthForm({ ...birthForm, birthWeightG: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Talla (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="25"
                    max="65"
                    required
                    placeholder="50"
                    className="input-field"
                    value={birthForm.birthLengthCm}
                    onChange={(e) => setBirthForm({ ...birthForm, birthLengthCm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">PC (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="20"
                    max="45"
                    required
                    placeholder="34.5"
                    className="input-field"
                    value={birthForm.birthHeadCircCm}
                    onChange={(e) => setBirthForm({ ...birthForm, birthHeadCircCm: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Tipo de Parto</label>
                  <select
                    className="input-field"
                    value={birthForm.deliveryType}
                    onChange={(e) => setBirthForm({ ...birthForm, deliveryType: e.target.value })}
                  >
                    <option value="vaginal">Parto Vaginal / Natural</option>
                    <option value="cesarea">Cesárea</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Grupo Sanguíneo</label>
                  <select
                    className="input-field"
                    value={birthForm.bloodType}
                    onChange={(e) => setBirthForm({ ...birthForm, bloodType: e.target.value })}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Clínica / Lugar de Nacimiento</label>
                <input
                  type="text"
                  placeholder="Ej: Clínica Materno Infantil"
                  className="input-field"
                  value={birthForm.birthPlace}
                  onChange={(e) => setBirthForm({ ...birthForm, birthPlace: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBirthModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 bg-secondary hover:bg-secondary/90"
                >
                  {saving ? 'Guardando...' : 'Guardar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
