import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { MODULE_LABELS, ACTOR_LABELS, labelModule, labelActor, humanizeAction, formatDuration, formatDateTime } from './adminLabels';

const PAGE_SIZE = 25;
const EMPTY_FILTERS = { search: '', module: '', actorType: '', from: '', to: '' };

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-cloud-sm border border-outline-variant/30">
      <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="font-display text-2xl font-bold text-primary mt-1">{value}</p>
      {hint && <p className="font-body text-[11px] text-outline mt-0.5">{hint}</p>}
    </div>
  );
}

function BarList({ title, rows, valueKey = 'count', labelOf, formatValue = (v) => v }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return (
    <div className="bg-white rounded-2xl p-4 shadow-cloud-sm border border-outline-variant/30">
      <h4 className="font-display text-sm font-semibold mb-3">{title}</h4>
      {rows.length === 0 ? (
        <p className="font-body text-xs text-outline">Sin datos en este periodo.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.slice(0, 8).map((r, i) => (
            <li key={i}>
              <div className="flex justify-between font-body text-xs mb-1">
                <span className="font-semibold text-on-surface">{labelOf(r)}</span>
                <span className="text-on-surface-variant">{formatValue(r[valueKey])}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.round((r[valueKey] / max) * 100))}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminActivityTab() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [userFilter, setUserFilter] = useState(null); // { id, name }
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryError('');
    try {
      setSummary(await api.getAdminActivitySummary(days));
    } catch (err) {
      setSummaryError(err.message || 'No se pudo cargar el resumen.');
    }
  }, [days]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const res = await api.getAdminActivity({
        ...applied,
        userId: userFilter?.id || '',
        page,
        limit: PAGE_SIZE,
      });
      setData(res);
    } catch (err) {
      setListError(err.message || 'No se pudo cargar la bitacora.');
    } finally {
      setLoading(false);
    }
  }, [applied, userFilter, page]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadList(); }, [loadList]);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setUserFilter(null);
    setPage(1);
  };

  const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));
  const usage = summary?.usage;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-sm text-on-surface-variant max-w-xl">
          Registro de lo que ocurre dentro de la app: acciones de mamas, papas y familiares, accesos y tiempo de uso. No se guarda el contenido medico, solo la accion realizada.
        </p>
        <label className="flex items-center gap-2 font-body text-xs font-semibold text-on-surface-variant">
          Periodo
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field !w-auto !py-2 !text-xs">
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
            <option value={180}>180 dias</option>
          </select>
        </label>
      </div>

      {summaryError && <p role="alert" className="text-xs text-error">{summaryError}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Acciones registradas" value={summary.events} hint={`Ultimos ${summary.days} dias`} />
            <StatCard label="Cuentas activas" value={summary.activeUsers} />
            <StatCard label="Tiempo de uso total" value={formatDuration(usage?.totalSeconds)} hint={`${usage?.sessions || 0} visitas`} />
            <StatCard label="Accesos fallidos" value={summary.failedLogins} hint={summary.failedLogins > 20 ? 'Revisa posibles intentos de intrusion' : 'Dentro de lo normal'} />
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <BarList title="Modulos con mas acciones" rows={summary.byModule} labelOf={(r) => labelModule(r.module)} />
            <BarList title="Tiempo de uso por modulo" rows={usage?.byModule || []} valueKey="seconds" labelOf={(r) => labelModule(r.module)} formatValue={formatDuration} />
            <BarList title="Quien usa la app" rows={summary.byActor} labelOf={(r) => labelActor(r.actorType)} />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-cloud-sm border border-outline-variant/30">
            <h4 className="font-display text-sm font-semibold mb-3">Cuentas con mas tiempo en la app</h4>
            {(usage?.topUsers || []).length === 0 ? (
              <p className="font-body text-xs text-outline">Aun no hay tiempo de uso registrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs">
                  <thead>
                    <tr className="text-on-surface-variant">
                      <th className="py-2 pr-3 font-semibold">Cuenta</th>
                      <th className="py-2 pr-3 font-semibold">Tiempo</th>
                      <th className="py-2 pr-3 font-semibold">Visitas</th>
                      <th className="py-2 font-semibold">Ultima vez</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.topUsers.map((u) => (
                      <tr key={u.userId} className="border-t border-outline-variant/30">
                        <td className="py-2 pr-3">
                          <button type="button" className="text-left text-primary font-semibold hover:underline" onClick={() => { setUserFilter({ id: u.userId, name: u.name }); setPage(1); }}>
                            {u.name}
                          </button>
                          {u.email && <span className="block text-[11px] text-outline">{u.email}</span>}
                        </td>
                        <td className="py-2 pr-3">{formatDuration(u.seconds)}</td>
                        <td className="py-2 pr-3">{u.sessions}</td>
                        <td className="py-2">{formatDateTime(u.lastSeenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <form onSubmit={applyFilters} className="bg-white rounded-2xl p-4 shadow-cloud-sm border border-outline-variant/30 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="field-label" htmlFor="act-search">Buscar cuenta</label>
          <input id="act-search" className="input-field !py-2.5 !text-sm" placeholder="Nombre o correo" value={filters.search} onChange={set('search')} maxLength={100} />
        </div>
        <div>
          <label className="field-label" htmlFor="act-module">Modulo</label>
          <select id="act-module" className="input-field !py-2.5 !text-sm" value={filters.module} onChange={set('module')}>
            <option value="">Todos</option>
            {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="act-actor">Quien</label>
          <select id="act-actor" className="input-field !py-2.5 !text-sm" value={filters.actorType} onChange={set('actorType')}>
            <option value="">Todos</option>
            {Object.entries(ACTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="act-from">Desde</label>
          <input id="act-from" type="date" className="input-field !py-2.5 !text-sm" value={filters.from} onChange={set('from')} />
        </div>
        <div>
          <label className="field-label" htmlFor="act-to">Hasta</label>
          <input id="act-to" type="date" className="input-field !py-2.5 !text-sm" value={filters.to} onChange={set('to')} />
        </div>
        <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center gap-2">
          <button type="submit" className="pill-chip bg-primary text-on-primary text-xs font-semibold">Aplicar filtros</button>
          <button type="button" onClick={clearFilters} className="pill-chip bg-surface-container text-on-surface-variant text-xs font-semibold">Limpiar</button>
          {userFilter && (
            <span className="pill-chip bg-secondary-container text-on-secondary-container text-xs font-semibold">
              Cuenta: {userFilter.name}
              <button type="button" aria-label="Quitar filtro de cuenta" className="ml-1" onClick={() => { setUserFilter(null); setPage(1); }}>&times;</button>
            </span>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-cloud-sm border border-outline-variant/30 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-outline-variant/30">
          <h4 className="font-display text-sm font-semibold">Bitacora de acciones</h4>
          <span className="font-body text-xs text-on-surface-variant">{data ? `${data.total} registros` : ''}</span>
        </div>
        {listError && <p role="alert" className="p-4 text-xs text-error">{listError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-xs">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Fecha</th>
                <th className="py-2.5 px-3 font-semibold">Cuenta</th>
                <th className="py-2.5 px-3 font-semibold">Quien</th>
                <th className="py-2.5 px-3 font-semibold">Accion</th>
                <th className="py-2.5 px-3 font-semibold">Modulo</th>
                <th className="py-2.5 px-3 font-semibold">Estado</th>
                <th className="py-2.5 px-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((r) => {
                const failed = r.statusCode >= 400 || /fallido/.test(r.action);
                return (
                  <tr key={r.id} className="border-t border-outline-variant/30 align-top">
                    <td className="py-2.5 px-4 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                    <td className="py-2.5 px-3">
                      {r.user ? (
                        <button type="button" className="text-left text-primary font-semibold hover:underline" onClick={() => { setUserFilter({ id: r.user.id, name: r.user.name }); setPage(1); }}>
                          {r.user.name}
                        </button>
                      ) : <span className="text-outline">-</span>}
                    </td>
                    <td className="py-2.5 px-3">{r.actorLabel ? `${labelActor(r.actorType)} (${r.actorLabel})` : labelActor(r.actorType)}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-on-surface">{humanizeAction(r.action)}</span>
                      {r.entity && <span className="block text-[11px] text-outline">{r.entity}</span>}
                    </td>
                    <td className="py-2.5 px-3">{labelModule(r.module)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`pill-chip !py-0.5 ${failed ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {failed ? 'Con error' : 'Correcto'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-outline">{r.ip || '-'}</td>
                  </tr>
                );
              })}
              {data && data.items.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-outline">No hay acciones con estos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {loading && !data && <p className="p-4 text-xs text-on-surface-variant">Cargando...</p>}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-outline-variant/30">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="pill-chip bg-surface-container text-on-surface-variant text-xs font-semibold disabled:opacity-40">Anterior</button>
            <span className="font-body text-xs text-on-surface-variant">Pagina {data.page} de {data.totalPages}</span>
            <button type="button" disabled={page >= data.totalPages || loading} onClick={() => setPage((p) => p + 1)} className="pill-chip bg-surface-container text-on-surface-variant text-xs font-semibold disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
