import { useEffect, useState } from 'react';
import {
  DEFAULT_VACCINES,
  DEVELOPMENT_MILESTONES,
  NEWBORN_CARE_GUIDES,
  calculateGrowthMetrics,
} from '../data/postnatalData';
import { api } from '../api/client';
import { useAlarm } from '../context/AlarmContext';

export default function BornBabyCarnet({ baby, onUpdateBaby }) {
  const { refreshAlarms } = useAlarm();
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'vaccines' | 'milestones' | 'care' | 'birth'
  const [showControlModal, setShowControlModal] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCareCategory, setSelectedCareCategory] = useState('Todos');

  // Recordatorios cargados desde la API
  const [reminders, setReminders] = useState([]);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderModal, setReminderModal] = useState({
    open: false,
    title: '',
    category: 'vacuna_bebe',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    repeatRule: 'ninguna',
    notify: true,
    notes: '',
  });

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
    scheduleNext: false,
    nextDate: '',
    nextTime: '09:00',
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

  // Cargar recordatorios existentes para asociarlos a vacunas y cuidados
  const loadReminders = async () => {
    try {
      const res = await api.listReminders();
      setReminders(res?.items || []);
    } catch (_) {}
  };

  useEffect(() => {
    loadReminders();
  }, []);

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

  // Estimar fecha recomendada para cada grupo de edad de vacuna
  const getEstimatedVaccineDate = (ageGroup) => {
    const base = new Date(birthDateObj.getTime());
    let daysToAdd = 0;
    if (ageGroup === 'Recién nacido') daysToAdd = 1;
    else if (ageGroup === '2 meses') daysToAdd = 60;
    else if (ageGroup === '4 meses') daysToAdd = 120;
    else if (ageGroup === '6 meses') daysToAdd = 180;
    else if (ageGroup === '7 meses') daysToAdd = 210;
    else if (ageGroup === '12 meses') daysToAdd = 365;
    else if (ageGroup === '18 meses') daysToAdd = 545;
    base.setDate(base.getDate() + daysToAdd);
    return base.toISOString().split('T')[0];
  };

  // Abrir modal de recordatorio para una vacuna
  const openVaccineReminderModal = (vac, e) => {
    if (e) e.stopPropagation();
    const suggestedDate = getEstimatedVaccineDate(vac.ageGroup);
    setReminderModal({
      open: true,
      title: `Vacuna: ${vac.name} (${vac.ageGroup})`,
      category: 'vacuna_bebe',
      date: suggestedDate,
      time: '08:30',
      repeatRule: 'ninguna',
      notify: true,
      notes: `Vacuna del PAI contra: ${vac.disease}. Dosis: ${vac.dose}.`,
    });
  };

  // Abrir modal de recordatorio para un cuidado del recién nacido
  const openCareReminderModal = (guide) => {
    const qr = guide.quickReminder;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReminderModal({
      open: true,
      title: qr.title,
      category: qr.category,
      date: new Date().toISOString().split('T')[0],
      time: qr.suggestedTime || '09:00',
      repeatRule: qr.category === 'vitamina' ? 'diaria' : 'ninguna',
      notify: true,
      notes: qr.defaultNotes || guide.summary,
    });
  };

  // Abrir modal de recordatorio para el próximo control pediátrico
  const openNextControlReminderModal = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setReminderModal({
      open: true,
      title: 'Próximo Control Pediátrico del Bebé',
      category: 'control_pediatrico',
      date: nextMonth.toISOString().split('T')[0],
      time: '09:00',
      repeatRule: 'ninguna',
      notify: true,
      notes: 'Control periódico de crecimiento y desarrollo con el pediatra.',
    });
  };

  // Guardar recordatorio
  const handleSaveReminder = async (e) => {
    e.preventDefault();
    setSavingReminder(true);
    try {
      await api.createReminder({
        title: reminderModal.title,
        category: reminderModal.category,
        date: reminderModal.date,
        time: reminderModal.time || null,
        repeatRule: reminderModal.repeatRule,
        notify: reminderModal.notify,
        notes: reminderModal.notes,
      });
      refreshAlarms();
      await loadReminders();
      setReminderModal((m) => ({ ...m, open: false }));
      alert('¡Recordatorio y alarma programados exitosamente!');
    } catch (err) {
      alert(err.message || 'No se pudo programar el recordatorio.');
    } finally {
      setSavingReminder(false);
    }
  };

  // Buscar si una vacuna o cuidado ya tiene recordatorio activo
  const findActiveReminder = (searchTerm) => {
    if (!reminders || reminders.length === 0) return null;
    return reminders.find(
      (r) =>
        !r.completed &&
        r.title &&
        r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Guardar nuevo control pediátrico
  const handleAddControl = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newControl = {
        id: 'postnatal_' + Date.now(),
        date: controlForm.date,
        ageMonths: Number(controlForm.ageMonths),
        weightKg: Number(controlForm.weightKg),
        lengthCm: Number(controlForm.lengthCm),
        headCircCm: Number(controlForm.headCircCm),
        doctorName: controlForm.doctorName,
        place: controlForm.place,
        notes: controlForm.notes,
      };
      const updated = [newControl, ...postnatalControls];
      await onUpdateBaby({ postnatalControls: updated });

      // Si solicitó programar el próximo control con alarma
      if (controlForm.scheduleNext && controlForm.nextDate) {
        try {
          await api.createReminder({
            title: `Control Pediátrico: Dr(a). ${controlForm.doctorName || 'Pediatra'}`,
            category: 'control_pediatrico',
            date: controlForm.nextDate,
            time: controlForm.nextTime || '09:00',
            repeatRule: 'ninguna',
            notify: true,
            notes: `Control médico de seguimiento. Último peso registrado: ${controlForm.weightKg} kg.`,
          });
          refreshAlarms();
          await loadReminders();
        } catch (_) {}
      }

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
        scheduleNext: false,
        nextDate: '',
        nextTime: '09:00',
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

  // Filtrado de guías de cuidados
  const careCategories = ['Todos', ...Array.from(new Set(NEWBORN_CARE_GUIDES.map((g) => g.category)))];
  const filteredCareGuides = selectedCareCategory === 'Todos'
    ? NEWBORN_CARE_GUIDES
    : NEWBORN_CARE_GUIDES.filter((g) => g.category === selectedCareCategory);

  return (
    <div className="space-y-6">
      {/* TARJETA SUPERIOR DEL CARNET INFANTIL */}
      <section className="card bg-gradient-to-br from-white via-surface to-secondary-container/20 border-2 border-secondary/20 shadow-cloud p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
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

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowBirthModal(true)}
              className="btn-secondary !py-2.5 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-cloud-sm flex-1 sm:flex-initial"
            >
              <span>📋</span>
              <span>Ficha de Parto</span>
            </button>
            <button
              type="button"
              onClick={() => setShowControlModal(true)}
              className="btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-cloud-sm bg-secondary hover:bg-secondary/90 flex-1 sm:flex-initial"
            >
              <span>+</span>
              <span>Nuevo Control Pediátrico</span>
            </button>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS DEL CARNET */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-secondary/15">
          <div className="bg-white/85 p-3 rounded-xl border border-secondary/10 text-center shadow-cloud-sm">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
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

          <div className="bg-white/85 p-3 rounded-xl border border-secondary/10 text-center shadow-cloud-sm">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Talla Actual
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-primary">
              {Number(currentLengthCm).toFixed(1)} cm
            </span>
            <span className="text-[10px] font-bold text-primary block mt-0.5">
              {diagnosis.lengthStatus.status}
            </span>
          </div>

          <div className="bg-white/85 p-3 rounded-xl border border-secondary/10 text-center shadow-cloud-sm">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Perímetro Cefálico
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-tertiary">
              {Number(currentHeadCircCm).toFixed(1)} cm
            </span>
            <span className="text-[10px] font-bold text-tertiary block mt-0.5">
              {diagnosis.headStatus.status}
            </span>
          </div>

          <div className="bg-white/85 p-3 rounded-xl border border-secondary/10 text-center shadow-cloud-sm">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
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
      <div className="flex gap-2 border-b border-surface-container pb-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-secondary text-white shadow-cloud-sm font-bold'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>📈</span>
          <span>Curvas y Controles ({postnatalControls.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vaccines')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'vaccines'
              ? 'bg-secondary text-white shadow-cloud-sm font-bold'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>💉</span>
          <span>Vacunación PAI ({vaccinesAppliedCount}/{vaccines.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('care')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'care'
              ? 'bg-secondary text-white shadow-cloud-sm font-bold'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>🍼</span>
          <span>Cuidados del Bebé Nacido</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'milestones'
              ? 'bg-secondary text-white shadow-cloud-sm font-bold'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>🧠</span>
          <span>Hitos del Desarrollo ({milestonesCompletedCount}/{milestones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('birth')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'birth'
              ? 'bg-secondary text-white shadow-cloud-sm font-bold'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          <span>📋</span>
          <span>Ficha de Nacimiento</span>
        </button>
      </div>

      {/* CONTENIDO 1: CURVAS DE CRECIMIENTO Y CONTROLES PEDIÁTRICOS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Diagnóstico Antropométrico OMS */}
          <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                  <span>📊</span> Diagnóstico Antropométrico según la OMS
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Valores comparados con los estándares internacionales de crecimiento infantil para {baby?.sex === 'nina' ? 'niñas' : 'niños'}.
                </p>
              </div>
              <button
                type="button"
                onClick={openNextControlReminderModal}
                className="btn-secondary !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 border border-secondary/30 text-secondary bg-secondary-container/20 hover:bg-secondary-container/40 self-start sm:self-auto"
              >
                <span>⏰</span>
                <span>Recordar Próximo Control</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-surface-container/30 border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-on-surface">Peso para la Edad</span>
                  <span className={`pill-chip text-[10px] font-bold ${
                    diagnosis.weightStatus.tone === 'success' ? 'bg-secondary text-white' : 'bg-error text-white'
                  }`}>
                    {diagnosis.weightStatus.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {diagnosis.weightStatus.text}.
                </p>
                <div className="mt-3 pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant flex justify-between">
                  <span>Rango OMS esperado:</span>
                  <strong>{diagnosis.references.weight.min} - {diagnosis.references.weight.max} kg</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container/30 border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-on-surface">Talla para la Edad</span>
                  <span className="pill-chip text-[10px] font-bold bg-primary text-white">
                    {diagnosis.lengthStatus.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {diagnosis.lengthStatus.text}.
                </p>
                <div className="mt-3 pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant flex justify-between">
                  <span>Rango OMS esperado:</span>
                  <strong>{diagnosis.references.length.min} - {diagnosis.references.length.max} cm</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container/30 border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-on-surface">Perímetro Cefálico</span>
                  <span className="pill-chip text-[10px] font-bold bg-tertiary text-white">
                    {diagnosis.headStatus.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {diagnosis.headStatus.text}.
                </p>
                <div className="mt-3 pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant flex justify-between">
                  <span>Rango OMS esperado:</span>
                  <strong>{diagnosis.references.headCirc.min} - {diagnosis.references.headCirc.max} cm</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Historial de Controles Pediátricos */}
          <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                  <span>🩺</span> Bitácora de Controles Pediátricos Postnatales
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Registros médicos presenciales después del nacimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowControlModal(true)}
                className="btn-primary !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 self-start sm:self-auto"
              >
                <span>+</span> Registrar Nuevo Control
              </button>
            </div>

            {postnatalControls.length === 0 ? (
              <div className="text-center py-8 bg-surface-container/20 rounded-2xl border border-dashed border-outline-variant/40">
                <span className="text-3xl block mb-2">🩺📋</span>
                <p className="font-display font-bold text-sm text-on-surface">
                  Aún no has registrado controles pediátricos
                </p>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                  Registra la primera visita del recién nacido para dar seguimiento a su peso, talla y perímetro cefálico.
                </p>
                <button
                  type="button"
                  onClick={() => setShowControlModal(true)}
                  className="btn-primary !py-2 !px-4 text-xs font-semibold bg-secondary hover:bg-secondary/90 mt-4 inline-flex items-center gap-1.5 shadow-cloud-sm"
                >
                  <span>+</span> Registrar Primer Control
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {postnatalControls.map((ctrl, idx) => (
                  <div
                    key={ctrl.id || idx}
                    className="p-4 rounded-xl border border-surface-container bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-secondary/30 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-on-surface">
                          Control de los {ctrl.ageMonths} meses
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          ({ctrl.date})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1.5">
                        <span>⚖️ <strong>{ctrl.weightKg} kg</strong></span>
                        <span>📏 <strong>{ctrl.lengthCm} cm</strong></span>
                        <span>📐 <strong>{ctrl.headCircCm} cm</strong> (PC)</span>
                        {ctrl.doctorName && <span>👨‍⚕️ Dr(a). {ctrl.doctorName}</span>}
                      </div>
                      {ctrl.notes && (
                        <p className="mt-2 text-[11px] text-on-surface bg-surface-container/30 p-2 rounded-lg">
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
                <span>💉</span> Esquema Oficial de Vacunación Infantil (PAI Colombia)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Control de todas las vacunas obligatorias y gratuitas. Puedes programar alarmas para cada dosis.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-secondary block">
                  {vaccinesAppliedCount} de {vaccines.length} aplicadas
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {Math.round((vaccinesAppliedCount / vaccines.length) * 100)}% al día
                </span>
              </div>
              <div className="w-24 bg-surface-container rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-secondary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(vaccinesAppliedCount / vaccines.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vaccines.map((v) => {
              const activeReminder = findActiveReminder(v.name);
              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    v.applied
                      ? 'bg-secondary-container/20 border-secondary/40 shadow-sm'
                      : 'bg-white border-surface-container hover:border-secondary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={v.applied}
                        onChange={() => toggleVaccine(v.id)}
                        className="mt-1 w-4 h-4 accent-secondary rounded cursor-pointer shrink-0"
                        title="Marcar como aplicada"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm text-on-surface">{v.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                            {v.ageGroup}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                          Protege contra: {v.disease}
                        </p>
                        <p className="text-[10px] text-outline mt-0.5">
                          Dosis: {v.dose}
                        </p>
                        {v.applied && v.dateApplied && (
                          <p className="text-[11px] font-bold text-secondary mt-1 flex items-center gap-1">
                            <span>✓</span> Aplicada el {v.dateApplied}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`pill-chip !py-0.5 !px-2.5 text-[10px] shrink-0 font-bold ${
                      v.applied
                        ? 'bg-secondary text-white'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {v.applied ? 'Aplicada' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Acciones de recordatorio / alarma para la vacuna */}
                  <div className="pt-2 border-t border-surface-container/60 flex items-center justify-between gap-2">
                    {activeReminder ? (
                      <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                        <span>⏰</span>
                        <span>Alarma: {activeReminder.date} ({activeReminder.time?.slice(0, 5) || '08:30'})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-outline">
                        Sugerida: {getEstimatedVaccineDate(v.ageGroup)}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => openVaccineReminderModal(v, e)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        activeReminder
                          ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                          : 'bg-surface-container text-on-surface-variant hover:bg-secondary hover:text-white'
                      }`}
                    >
                      <span>🔔</span>
                      <span>{activeReminder ? 'Modificar Alarma' : 'Poner Alarma'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO 3: CUIDADOS DEL BEBÉ NACIDO */}
      {activeTab === 'care' && (
        <div className="space-y-6">
          <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                  <span>🍼</span> Guía de Cuidados del Bebé Nacido (0 a 12 meses)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Protocolos clínicos esenciales para el cordón umbilical, lactancia, sueño seguro, higiene y signos de alerta.
                </p>
              </div>

              {/* Botón rápido de alarma médica */}
              <button
                type="button"
                onClick={openNextControlReminderModal}
                className="btn-primary !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 self-start sm:self-auto shadow-cloud-sm"
              >
                <span>⏰</span>
                <span>Programar Alarma Médica</span>
              </button>
            </div>

            {/* Selector de Categorías de Cuidado */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
              {careCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCareCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCareCategory === cat
                      ? 'bg-secondary text-white shadow-cloud-sm font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Listado de Guías Clínicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCareGuides.map((guide) => {
                const activeCareReminder = findActiveReminder(guide.quickReminder.title);
                return (
                  <article
                    key={guide.id}
                    className="p-5 rounded-2xl bg-white border border-surface-container hover:border-secondary/30 shadow-sm transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="pill-chip bg-secondary-container/40 text-secondary text-[10px] font-bold uppercase tracking-wider">
                          {guide.category}
                        </span>
                        {activeCareReminder && (
                          <span className="text-[10px] font-bold text-secondary bg-secondary-container/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>⏰</span> Recordatorio Activo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-2xl">{guide.icon}</span>
                        <h4 className="font-display font-bold text-base text-on-surface">
                          {guide.title}
                        </h4>
                      </div>

                      <p className="font-body text-xs text-on-surface-variant mb-3 leading-relaxed">
                        {guide.summary}
                      </p>

                      <div className="space-y-1.5 mb-3 bg-surface-container/20 p-3 rounded-xl border border-surface-container/40">
                        <span className="font-bold text-[11px] text-on-surface block mb-1">
                          Puntos Clave del Pediatra:
                        </span>
                        {guide.keyPoints.map((point, pIdx) => (
                          <p key={pIdx} className="text-[11px] text-on-surface-variant flex items-start gap-1.5 leading-snug">
                            <span className="text-secondary font-bold">•</span>
                            <span>{point}</span>
                          </p>
                        ))}
                      </div>

                      {guide.warning && (
                        <div className="p-3 rounded-xl bg-error-container/15 border border-error/25 text-[11px] text-error flex items-start gap-2">
                          <span className="shrink-0 text-sm">⚠️</span>
                          <span className="leading-snug">
                            <strong>Alerta:</strong> {guide.warning}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botón de Recordatorio para este cuidado */}
                    <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2">
                      <span className="text-[11px] text-on-surface-variant">
                        Sugerido: {guide.quickReminder.suggestedTime} hrs
                      </span>
                      <button
                        type="button"
                        onClick={() => openCareReminderModal(guide)}
                        className="btn-primary !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 shadow-cloud-sm"
                      >
                        <span>🔔</span>
                        <span>{activeCareReminder ? 'Modificar Alarma' : 'Poner Alarma'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 4: HITOS DEL DESARROLLO PSICOMOTOR */}
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  m.completed
                    ? 'bg-primary-container/25 border-primary/40 shadow-sm'
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
                    <div className="flex items-center gap-2 flex-wrap">
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

                <span className={`pill-chip !py-0.5 !px-2.5 text-[10px] shrink-0 font-bold ${
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

      {/* CONTENIDO 5: FICHA DE NACIMIENTO */}
      {activeTab === 'birth' && (
        <div className="card p-5 border border-outline-variant/30 shadow-cloud-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
            <div>
              <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
                <span>📋</span> Datos Registrados del Nacimiento
              </h3>
              <p className="text-xs text-on-surface-variant">
                Información del parto y medidas iniciales tomadas por el equipo de neonatología.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBirthModal(true)}
              className="btn-secondary !py-2 !px-3.5 text-xs font-semibold self-start sm:self-auto shadow-cloud-sm"
            >
              ✏️ Editar Ficha de Parto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Fecha de Nacimiento:</span>
              <strong className="text-sm font-bold text-on-surface">
                {birthDateObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Hora de Nacimiento:</span>
              <strong className="text-sm font-bold text-on-surface">{baby?.birthTime || 'No registrada'}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Peso al Nacer:</span>
              <strong className="text-sm font-bold text-secondary">{baby?.birthWeightG ? `${baby.birthWeightG} g` : 'No registrado'}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Talla al Nacer:</span>
              <strong className="text-sm font-bold text-primary">{baby?.birthLengthCm ? `${baby.birthLengthCm} cm` : 'No registrada'}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Perímetro Cefálico:</span>
              <strong className="text-sm font-bold text-tertiary">{baby?.birthHeadCircCm ? `${baby.birthHeadCircCm} cm` : 'No registrado'}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Tipo de Parto:</span>
              <strong className="text-sm font-bold text-on-surface capitalize">{baby?.deliveryType || 'Vaginal'}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50">
              <span className="text-on-surface-variant block text-[11px]">Grupo Sanguíneo:</span>
              <strong className="text-sm font-bold text-on-surface">{baby?.bloodType || 'No registrado'}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container/30 border border-surface-container/50 sm:col-span-2">
              <span className="text-on-surface-variant block text-[11px]">Lugar / Clínica de Nacimiento:</span>
              <strong className="text-sm font-bold text-on-surface">{baby?.birthPlace || 'Clínica / Hospital'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA PROGRAMAR ALARMA / RECORDATORIO */}
      {reminderModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-secondary/20 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h3 className="font-display font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                <span>⏰</span>
                <span>Programar Recordatorio del Bebé</span>
              </h3>
              <button
                type="button"
                onClick={() => setReminderModal((m) => ({ ...m, open: false }))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="field-label">Título del recordatorio</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={reminderModal.title}
                  onChange={(e) => setReminderModal((m) => ({ ...m, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="field-label">Fecha del aviso</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={reminderModal.date}
                    onChange={(e) => setReminderModal((m) => ({ ...m, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label">Hora (Alarma audible)</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={reminderModal.time}
                    onChange={(e) => setReminderModal((m) => ({ ...m, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Frecuencia de repetición</label>
                <select
                  className="input-field"
                  value={reminderModal.repeatRule}
                  onChange={(e) => setReminderModal((m) => ({ ...m, repeatRule: e.target.value }))}
                >
                  <option value="ninguna">Solo una vez</option>
                  <option value="diaria">Todos los días (ej: vitaminas/baño)</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              <div>
                <label className="field-label">Observaciones o notas</label>
                <textarea
                  rows={2}
                  className="input-field"
                  value={reminderModal.notes}
                  onChange={(e) => setReminderModal((m) => ({ ...m, notes: e.target.value }))}
                  placeholder="Dosis, centro de salud o indicaciones pediátricas..."
                />
              </div>

              <div className="p-3 bg-secondary-container/20 rounded-xl border border-secondary/20 text-[11px] text-on-surface-variant flex items-start gap-2">
                <span>🔔</span>
                <span>
                  Esta alarma se activará incluso si estás navegando en otra pestaña o fuera de la aplicación.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReminderModal((m) => ({ ...m, open: false }))}
                  className="btn-secondary flex-1 !py-3 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingReminder}
                  className="btn-primary flex-1 !py-3 font-semibold text-xs bg-secondary hover:bg-secondary/90 shadow-cloud-sm flex items-center justify-center gap-1.5"
                >
                  <span>{savingReminder ? 'Guardando...' : '🔔 Activar Alarma'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR CONTROL PEDIÁTRICO */}
      {showControlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-secondary/20 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h3 className="font-display font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                <span>🩺</span>
                <span>Nuevo Control Pediátrico</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowControlModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddControl} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
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

              {/* Opción de programar alarma para el próximo control */}
              <div className="p-3 rounded-xl bg-secondary-container/20 border border-secondary/20 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controlForm.scheduleNext}
                    onChange={(e) => setControlForm({ ...controlForm, scheduleNext: e.target.checked })}
                    className="w-4 h-4 accent-secondary rounded"
                  />
                  <span className="font-bold text-xs text-on-surface">
                    ⏰ Programar alarma para el próximo control
                  </span>
                </label>
                {controlForm.scheduleNext && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="field-label">Fecha próxima cita</label>
                      <input
                        type="date"
                        required={controlForm.scheduleNext}
                        className="input-field"
                        value={controlForm.nextDate}
                        onChange={(e) => setControlForm({ ...controlForm, nextDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="field-label">Hora</label>
                      <input
                        type="time"
                        className="input-field"
                        value={controlForm.nextTime}
                        onChange={(e) => setControlForm({ ...controlForm, nextTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowControlModal(false)}
                  className="btn-secondary flex-1 !py-3 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 !py-3 text-xs font-semibold bg-secondary hover:bg-secondary/90 shadow-cloud-sm"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-secondary/20 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h3 className="font-display font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                <span>📋</span>
                <span>Ficha de Nacimiento del Bebé</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBirthModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBirth} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
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

              <div className="grid grid-cols-2 gap-2.5">
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

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBirthModal(false)}
                  className="btn-secondary flex-1 !py-3 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 !py-3 text-xs font-semibold bg-secondary hover:bg-secondary/90 shadow-cloud-sm"
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
