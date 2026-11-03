export const MODULE_LABELS = {
  cuenta: 'Cuenta',
  embarazo: 'Embarazo',
  control_medico: 'Control medico',
  medicamentos: 'Medicamentos',
  recordatorios: 'Recordatorios',
  documentos: 'Documentos',
  album: 'Album de fotos',
  diario: 'Diario',
  sintomas: 'Sintomas',
  calendario: 'Calendario',
  archivos: 'Archivos',
  notificaciones: 'Notificaciones',
  familia: 'Papa y familia',
  admin: 'Administracion',
  actividad: 'Actividad',
  ejercicios: 'Ejercicios',
  recuerdo: 'Libro de recuerdos',
  cuentos: 'Cuentos',
  perfil: 'Perfil y tema',
  inicio: 'Inicio',
  gestacion: 'Gestacion',
  carnet_bebe: 'Carnet del bebe',
  bienestar_emocional: 'Bienestar emocional',
  cuenta_regresiva: 'Cuenta regresiva',
  guia_desarrollo: 'Guia de desarrollo',
  cuidados: 'Cuidados',
  otro: 'Otros',
};

export const ACTOR_LABELS = { owner: 'Mama', papa: 'Papa', familia: 'Familiar', admin: 'Administrador', anonimo: 'Visitante', sistema: 'Sistema' };

export function labelModule(key) {
  return MODULE_LABELS[key] || key || '-';
}

export function labelActor(key) {
  return ACTOR_LABELS[key] || key || '-';
}

export function humanizeAction(action) {
  if (!action) return '-';
  const text = String(action).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
