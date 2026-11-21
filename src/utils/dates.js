// Fechas "solo dia" (AAAA-MM-DD): se interpretan como dia calendario LOCAL para que no
// retrocedan un dia en zonas horarias negativas como Colombia (UTC-5).
export function localDay(value) {
  if (value instanceof Date) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!m) return new Date(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function formatDay(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return localDay(value).toLocaleDateString('es-CO', options);
}

// Fecha de HOY en hora local del dispositivo (AAAA-MM-DD). new Date().toISOString() usa UTC y
// en Colombia adelanta el dia despues de las 7:00 p. m.
export function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Hora local actual (HH:MM, 24 h)
export function nowTimeStr(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
