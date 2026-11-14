import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState, Banner } from '../components/States';
import { api } from '../api/client';
import ModuleIcon from '../components/ModuleIcons';
import { PageHeader } from '../components/PageParts';

const SYMPTOMS = [
  { field: 'nausea', label: 'Náuseas' },
  { field: 'headache', label: 'Dolor de cabeza' },
  { field: 'fatigue', label: 'Cansancio' },
  { field: 'backPain', label: 'Dolor de espalda' },
  { field: 'dizziness', label: 'Mareos' },
  { field: 'swelling', label: 'Hinchazón' },
  { field: 'moodChanges', label: 'Cambios de humor' },
];

// Intensidades guardadas en la base: 0 nada, 1 leve, 2 moderado, 3 fuerte
const LEVELS = [
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderado' },
  { value: 3, label: 'Fuerte' },
];
const LEVEL_NAME = ['Nada', 'Leve', 'Moderado', 'Fuerte'];
const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const todayStr = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const EMPTY_FORM = () => ({
  date: todayStr(),
  nausea: 0, headache: 0, fatigue: 0, backPain: 0, dizziness: 0, swelling: 0, moodChanges: 0,
  appetite: 'normal', sleepQuality: 'buena', otherSymptoms: '', notes: '',
});

const dayKey = (value) => String(value || '').split('T')[0];
const logScore = (log) => SYMPTOMS.reduce((acc, s) => acc + (Number(log[s.field]) || 0), 0);

function buildStats(items) {
  const today = new Date(`${todayStr()}T00:00:00`);
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    days.push({ key, letter: DAY_LETTERS[d.getDay()], score: 0, has: false, isToday: i === 0 });
  }
  const index = new Map(days.map((d) => [d.key, d]));
  for (const log of items) {
    const slot = index.get(dayKey(log.date));
    if (slot) {
      slot.has = true;
      slot.score = Math.max(slot.score, logScore(log));
    }
  }

  // Frecuencia de cada síntoma en los últimos 30 días
  const limit = new Date(today);
  limit.setDate(today.getDate() - 29);
  const recent = items.filter((l) => new Date(`${dayKey(l.date)}T00:00:00`) >= limit);
  const freq = SYMPTOMS.map((s) => {
    const hits = recent.filter((l) => Number(l[s.field]) > 0);
    const avg = hits.length ? hits.reduce((a, l) => a + Number(l[s.field]), 0) / hits.length : 0;
    return { ...s, count: hits.length, avg };
  }).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

  const weekLogged = days.filter((d) => d.has).length;
  const weekAvg = weekLogged ? days.reduce((a, d) => a + d.score, 0) / weekLogged : 0;
  return { days, freq, recentCount: recent.length, weekLogged, weekAvg };
}

export default function Symptoms() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [okMsg, setOkMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.listSymptoms();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      console.error('Error cargando síntomas:', err);
      setItems([]);
      setError('No pudimos cargar tu historial de síntomas.');
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => buildStats(items || []), [items]);

  const selected = SYMPTOMS.filter((s) => form[s.field] > 0);
  const toggleSymptom = (field) => setForm((f) => ({ ...f, [field]: f[field] > 0 ? 0 : 1 }));
  const setLevel = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setWarning(null);
    setError('');
    setOkMsg('');
    try {
      const res = await api.createSymptom(form);
      if (res?.warning) setWarning(res.warning);
      setForm(EMPTY_FORM());
      setShowMore(false);
      setOkMsg('Registro guardado.');
      await load();
    } catch (err) {
      setError(err?.message || 'No pudimos guardar tu registro.');
    } finally {
      setSaving(false);
    }
  };

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  const maxBar = Math.max(6, ...stats.days.map((d) => d.score));

  return (
    <AppLayout>
      <PageHeader title="Síntomas" subtitle="Registra lo que sientes, a tu ritmo." />

      <form onSubmit={handleSubmit} className="rounded-[30px] bg-white p-5 shadow-cloud flex flex-col gap-4">
        <h2 className="font-display text-xl font-medium leading-tight">¿Qué sientes hoy?</h2>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Síntomas de hoy">
          {SYMPTOMS.map((s) => {
            const on = form[s.field] > 0;
            return (
              <button
                key={s.field}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSymptom(s.field)}
                className={`px-4 py-2.5 rounded-[20px] text-[13px] font-bold font-body transition-colors active:scale-95 ${
                  on
                    ? 'bg-secondary-container text-on-secondary-container border-2 border-on-secondary-container'
                    : 'bg-surface text-on-surface-variant border-2 border-transparent'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {selected.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="font-body text-[13px] font-bold text-on-surface-variant">Intensidad</p>
            {selected.map((s) => (
              <div key={s.field}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-body text-sm font-semibold">{s.label}</span>
                  <span className="font-body text-xs font-bold text-primary">{LEVEL_NAME[form[s.field]]}</span>
                </div>
                <div className="flex gap-1.5" role="radiogroup" aria-label={`Intensidad de ${s.label}`}>
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      role="radio"
                      aria-checked={form[s.field] === lvl.value}
                      aria-label={lvl.label}
                      onClick={() => setLevel(s.field, lvl.value)}
                      className="flex-1 h-9 flex items-center"
                    >
                      <span className={`block w-full h-2.5 rounded-[5px] transition-colors ${form[s.field] >= lvl.value ? 'bg-primary' : 'bg-outline-variant/60'}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-xs text-on-surface-variant">
            Toca lo que sientes. Si hoy te sientes bien, puedes guardar el registro sin marcar nada.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="self-start font-body text-xs font-bold text-primary underline underline-offset-4"
        >
          {showMore ? 'Ocultar detalles' : 'Agregar fecha, apetito, sueño y notas'}
        </button>

        {showMore && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="field-label" htmlFor="sym-date">Fecha</label>
              <input id="sym-date" type="date" required className="input-field" value={form.date} max={todayStr()} onChange={set('date')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="sym-app">Apetito</label>
                <select id="sym-app" className="input-field" value={form.appetite} onChange={set('appetite')}>
                  <option value="bajo">Bajo</option>
                  <option value="normal">Normal</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="sym-sleep">Sueño</label>
                <select id="sym-sleep" className="input-field" value={form.sleepQuality} onChange={set('sleepQuality')}>
                  <option value="mala">Mala</option>
                  <option value="regular">Regular</option>
                  <option value="buena">Buena</option>
                </select>
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="sym-other">Otros síntomas</label>
              <input id="sym-other" className="input-field" maxLength={200} value={form.otherSymptoms} onChange={set('otherSymptoms')} />
            </div>
            <div>
              <label className="field-label" htmlFor="sym-notes">Observaciones</label>
              <textarea id="sym-notes" className="input-field" rows={2} maxLength={1000} value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        )}

        {error && <p role="alert" className="font-body text-sm text-error">{error}</p>}
        {okMsg && <p role="status" className="font-body text-sm font-semibold text-secondary">{okMsg}</p>}

        <button type="submit" disabled={saving} className="btn-primary !py-3.5">
          {saving ? 'Guardando...' : 'Registrar síntomas'}
        </button>
      </form>

      {warning && (
        <div className="mt-4">
          <Banner tone="warning">{warning}</Banner>
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-primary-container text-on-primary-container px-4 py-3.5 flex gap-3 items-start">
        <ModuleIcon name="info" className="w-6 h-6 shrink-0 mt-0.5" />
        <p className="font-body text-[13px] leading-snug font-semibold">
          Si tienes sangrado, dolor fuerte o menos movimientos del bebé, llama a tu médico o acude a urgencias. Esta herramienta solo sirve para llevar un registro y no sustituye una valoración médica.
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      <section className="mt-6" aria-labelledby="sym-week-title">
        <h2 id="sym-week-title" className="font-display text-[19px] font-semibold mb-3">Esta semana</h2>
        <div className="rounded-3xl bg-white p-4 shadow-cloud-sm">
          <div className="flex items-end gap-2 h-28" role="img" aria-label={`Intensidad de síntomas de los últimos 7 días. ${stats.weekLogged} días con registro.`}>
            {stats.days.map((d) => {
              const pct = d.has ? Math.max(8, Math.round((d.score / maxBar) * 100)) : 6;
              return (
                <div key={d.key} className="flex-1 h-full flex items-end">
                  <div
                    title={d.has ? `${d.key}: puntaje ${d.score}` : `${d.key}: sin registro`}
                    className={`w-full rounded-lg transition-all ${
                      !d.has ? 'bg-outline-variant/40' : d.isToday ? 'bg-primary' : 'bg-secondary-container'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2" aria-hidden="true">
            {stats.days.map((d) => (
              <span key={d.key} className={`flex-1 text-center font-body text-[11px] font-bold ${d.isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{d.letter}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-2xl bg-surface px-2 py-2.5 text-center">
              <p className="font-display text-xl font-semibold text-primary">{stats.weekLogged}</p>
              <p className="font-body text-[11px] text-on-surface-variant">días con registro</p>
            </div>
            <div className="rounded-2xl bg-surface px-2 py-2.5 text-center">
              <p className="font-display text-xl font-semibold text-primary">{stats.weekLogged ? stats.weekAvg.toFixed(1) : '0'}</p>
              <p className="font-body text-[11px] text-on-surface-variant">puntaje medio</p>
            </div>
            <div className="rounded-2xl bg-surface px-2 py-2.5 text-center">
              <p className="font-display text-xl font-semibold text-primary">{stats.recentCount}</p>
              <p className="font-body text-[11px] text-on-surface-variant">registros en 30 días</p>
            </div>
          </div>
        </div>

        {stats.freq.length > 0 && (
          <div className="rounded-3xl bg-white p-4 shadow-cloud-sm mt-3">
            <h3 className="font-display text-base font-semibold mb-3">Lo que más se repite (30 días)</h3>
            <ul className="flex flex-col gap-3">
              {stats.freq.slice(0, 5).map((s) => {
                const width = Math.round((s.count / Math.max(1, stats.recentCount)) * 100);
                return (
                  <li key={s.field}>
                    <div className="flex justify-between font-body text-xs mb-1">
                      <span className="font-semibold">{s.label}</span>
                      <span className="text-on-surface-variant">{s.count} {s.count === 1 ? 'día' : 'días'} · {LEVEL_NAME[Math.round(s.avg)]}</span>
                    </div>
                    <div className="h-2.5 rounded-[5px] bg-outline-variant/40 overflow-hidden">
                      <div className="h-full rounded-[5px] bg-primary" style={{ width: `${width}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {items.length === 0 && (
        <div className="mt-6">
          <EmptyState icon="pulse" title="Sin registros aún" description="Lleva un registro diario de cómo te sientes durante el embarazo." />
        </div>
      )}

      {items.length > 0 && (
        <section className="mt-6" aria-labelledby="sym-hist-title">
          <h2 id="sym-hist-title" className="font-display text-[19px] font-semibold mb-3">Historial</h2>
          <div className="flex flex-col gap-3">
            {items.map((log) => (
              <div key={log.id} className="rounded-3xl bg-white p-4 shadow-cloud-sm">
                <p className="font-body text-sm font-bold mb-2">
                  {new Date(`${dayKey(log.date)}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.filter((s) => log[s.field] > 0).map((s) => (
                    <span key={s.field} className="pill-chip bg-primary-container text-on-primary-container">
                      {s.label} · {LEVEL_NAME[log[s.field]] || ''}
                    </span>
                  ))}
                  {SYMPTOMS.every((s) => !(log[s.field] > 0)) && (
                    <span className="pill-chip bg-secondary-container text-on-secondary-container">
                      <ModuleIcon name="check" className="w-3.5 h-3.5" strokeWidth={2.4} />Sin síntomas notables
                    </span>
                  )}
                </div>
                {log.otherSymptoms && <p className="font-body text-xs text-on-surface-variant mt-2">Otros: {log.otherSymptoms}</p>}
                {log.notes && <p className="font-body text-xs text-on-surface-variant mt-1">{log.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </AppLayout>
  );
}
