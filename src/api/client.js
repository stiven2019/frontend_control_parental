const TOKEN_KEY = 'mibebe_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

import { compressImageIfPossible } from '../utils/imageOptimizer';

export function getDirectMinioUrl(path) {
  if (!path) return '';
  const mediaIdx = path.indexOf('/mibebe-media/');
  const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
  if (mediaIdx !== -1) {
    const relativeMediaPath = path.substring(mediaIdx);
    return `http://${host}:9000${relativeMediaPath}`;
  }
  if (path.includes(':9000/')) {
    return path.replace(/localhost:9000|127\.0\.0\.1:9000/, `${host}:9000`);
  }
  return path;
}

export function getFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  // Si la URL apunta a MinIO (contiene el bucket /mibebe-media/)
  const mediaIdx = path.indexOf('/mibebe-media/');
  if (mediaIdx !== -1) {
    const relativeMediaPath = path.substring(mediaIdx); // /mibebe-media/...

    // Si API_BASE está configurado explícitamente y es un servidor remoto fuera de localhost
    if (API_BASE && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')) {
      return `${API_BASE}${relativeMediaPath}`;
    }

    // Devolver ruta relativa para que pase directamente por el proxy de Vite (/mibebe-media -> 9000)
    // o Nginx, evitando que en móviles 'localhost:9000' falle o sea bloqueado por CORS
    return relativeMediaPath;
  }

  // Si la URL apunta a localhost:9000 y se accede desde un móvil u otra IP de red
  if (path.includes(':9000/')) {
    if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return path.replace(/localhost:9000|127\.0\.0\.1:9000/, `${window.location.hostname}:9000`);
    }
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${cleanPath}` : cleanPath;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const url = API_BASE ? `${API_BASE}/api${endpoint}` : `/api${endpoint}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    throw new Error('Error de conexión con el servidor. Revisa tu acceso a internet.');
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      // respuesta sin cuerpo JSON válido
    }
  } else {
    // Si la respuesta fue HTML o texto (error de proxy, nginx o express)
    await res.text().catch(() => '');
  }

  if (!res.ok) {
    let message = data?.error;
    if (!message) {
      if (res.status === 413) {
        message = 'El contenido enviado es demasiado grande para el servidor.';
      } else if (res.status === 401) {
        message = 'Tu sesión ha expirado o no tienes autorización.';
      } else if (res.status === 404) {
        message = 'El recurso solicitado no fue encontrado.';
      } else if (res.status >= 500) {
        message = 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.';
      } else {
        message = 'Ocurrió un error inesperado. Intenta de nuevo.';
      }
    }
    const err = new Error(message);
    err.status = res.status;
    err.needsSetup = data?.needsSetup;
    err.expired = data?.expired;
    err.limitReached = data?.limitReached;
    throw err;
  }

  return data;
}

export async function uploadFile(file, module = 'general') {
  if (!file) throw new Error('No se seleccionó ningún archivo para subir.');

  const token = getToken();

  // Optimizar y comprimir imágenes de alta resolución en móvil automáticamente
  let fileToUpload = file;
  try {
    fileToUpload = await compressImageIfPossible(file);
  } catch (compressErr) {
    console.warn('No se pudo comprimir la imagen en el cliente, subiendo archivo original:', compressErr);
  }

  const form = new FormData();
  form.append('file', fileToUpload, fileToUpload.name || file.name || 'foto.jpg');
  if (module) form.append('module', module);

  const baseUrl = API_BASE ? `${API_BASE}/api/upload` : '/api/upload';
  const url = module ? `${baseUrl}?module=${encodeURIComponent(module)}` : baseUrl;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch (netErr) {
    throw new Error('Error de conexión al subir la imagen. Revisa tu internet.');
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      // fallo al parsear JSON
    }
  } else {
    // Leer texto plano o HTML sin lanzar SyntaxError
    await res.text().catch(() => '');
  }

  if (!res.ok) {
    let message = data?.error;
    if (!message) {
      if (res.status === 413) {
        message = 'El servidor rechazó el archivo por tamaño (413 Request Entity Too Large). El Nginx del servidor requiere configurar "client_max_body_size 50M;".';
      } else {
        message = `Error al subir el archivo (Código ${res.status}). Intenta de nuevo.`;
      }
    }
    throw new Error(message);
  }

  if (!data?.url || data.url.startsWith('data:')) {
    throw new Error('El servidor no devolvió una URL válida de MinIO para el archivo.');
  }

  return data.url;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  updateMe: (payload) => request('/auth/me', { method: 'PATCH', body: payload }),
  changePassword: async (payload) => {
    const data = await request('/auth/change-password', { method: 'POST', body: payload });
    // El servidor invalida las sesiones anteriores y entrega un token nuevo
    if (data?.token) setToken(data.token);
    return data;
  },
  requestPasswordResetEmail: (payload) => request('/auth/forgot-password-email', { method: 'POST', body: payload, auth: false }),
  requestPasswordResetWhatsApp: (payload) => request('/auth/forgot-password-whatsapp', { method: 'POST', body: payload, auth: false }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload, auth: false }),
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),

  // Recuerdo, actividad y ejercicios
  getMemoryBook: (tz) => request(`/recuerdo/resumen${tz ? `?tz=${encodeURIComponent(tz)}` : ''}`),
  sendHeartbeat: (payload) => request('/actividad/latido', { method: 'POST', body: payload }),
  sendClientEvent: (payload) => request('/actividad/evento', { method: 'POST', body: payload }),
  listStories: () => request('/cuentos'),
  previewStories: () => request('/explorar/cuentos', { auth: false }),
  getStory: (slug) => request(`/cuentos/${encodeURIComponent(slug)}`),
  listExercises: (audience) => request(`/ejercicios${audience ? `?audience=${encodeURIComponent(audience)}` : ''}`),

  // Embarazo
  setupPregnancy: (payload) => request('/embarazo/setup', { method: 'POST', body: payload }),
  getDashboard: () => request('/embarazo/dashboard'),
  getTimeline: () => request('/embarazo/timeline'),
  getCountdown: () => request('/embarazo/countdown'),
  updateBaby: (payload) => request('/embarazo/baby', { method: 'PATCH', body: payload }),
  updatePartner: (payload) => request('/embarazo/partner', { method: 'PATCH', body: payload }),

  // Controles médicos
  listControls: () => request('/controles'),
  createControl: (payload) => request('/controles', { method: 'POST', body: payload }),
  updateControl: (id, payload) => request(`/controles/${id}`, { method: 'PUT', body: payload }),
  deleteControl: (id) => request(`/controles/${id}`, { method: 'DELETE' }),

  // Medicamentos
  listMedications: () => request('/medicamentos'),
  createMedication: (payload) => request('/medicamentos', { method: 'POST', body: payload }),
  updateMedication: (id, payload) => request(`/medicamentos/${id}`, { method: 'PUT', body: payload }),
  deleteMedication: (id) => request(`/medicamentos/${id}`, { method: 'DELETE' }),
  markMedicationTaken: (id) => request(`/medicamentos/${id}/tomar`, { method: 'POST' }),
  getMedicationLogs: (id) => request(`/medicamentos/${id}/historial`),

  // Recordatorios
  listReminders: () => request('/recordatorios'),
  createReminder: (payload) => request('/recordatorios', { method: 'POST', body: payload }),
  updateReminder: (id, payload) => request(`/recordatorios/${id}`, { method: 'PUT', body: payload }),
  deleteReminder: (id) => request(`/recordatorios/${id}`, { method: 'DELETE' }),
  completeReminder: (id) => request(`/recordatorios/${id}/completar`, { method: 'POST' }),

  // Documentos
  listDocuments: () => request('/documentos'),
  createDocument: (payload) => request('/documentos', { method: 'POST', body: payload }),
  deleteDocument: (id) => request(`/documentos/${id}`, { method: 'DELETE' }),

  // Fotos / álbum
  listPhotos: () => request('/fotos'),
  createPhoto: (payload) => request('/fotos', { method: 'POST', body: payload }),
  updatePhoto: (id, payload) => request(`/fotos/${id}`, { method: 'PUT', body: payload }),
  deletePhoto: (id) => request(`/fotos/${id}`, { method: 'DELETE' }),

  // Diario
  listJournal: () => request('/diario'),
  createJournal: (payload) => request('/diario', { method: 'POST', body: payload }),
  updateJournal: (id, payload) => request(`/diario/${id}`, { method: 'PUT', body: payload }),
  deleteJournal: (id) => request(`/diario/${id}`, { method: 'DELETE' }),

  // Síntomas
  listSymptoms: () => request('/sintomas'),
  createSymptom: (payload) => request('/sintomas', { method: 'POST', body: payload }),

  // Calendario
  getCalendarEvents: () => request('/calendario/eventos'),

  // Contenido educativo público
  getMomCare: () => request('/contenido/cuidados-mama', { auth: false }),
  getBabyCare: () => request('/contenido/cuidados-bebe', { auth: false }),

  // Notificaciones Push (segundo plano / fuera de la app)
  getVapidPublicKey: () => request('/push/vapid-public-key', { auth: false }),
  subscribePush: (payload) => request('/push/subscribe', { method: 'POST', body: payload }),
  unsubscribePush: (payload) => request('/push/unsubscribe', { method: 'POST', body: payload }),
  testPush: (payload = {}) => request('/push/test', { method: 'POST', body: payload }),

  // Vínculos Familiares y Papá (QR)
  generateFamilyQr: (payload) => request('/familia/generar-qr', { method: 'POST', body: payload }),
  refreshFamilyLink: (id) => request(`/familia/refrescar/${id}`, { method: 'POST' }),
  getFamilyInviteInfo: (code) => request(`/familia/info-invitacion?code=${encodeURIComponent(code)}`, { auth: false }),
  redeemFamilyQr: (payload) => request('/familia/canjear-qr', { method: 'POST', body: payload, auth: false }),
  listFamilyLinks: () => request('/familia/vinculos'),
  revokeFamilyLink: (id) => request(`/familia/vinculos/${id}`, { method: 'DELETE' }),

  // Alerta preventiva de suscripción por correo
  testSubscriptionAlert: () => request('/auth/test-subscription-alert', { method: 'POST' }),

  // Panel Administrativo & Control Maestro
  getAdminSetupStatus: () => request('/admin/setup-status', { auth: false }),
  adminRegister: (payload) => request('/admin/register', { method: 'POST', body: payload, auth: false }),
  adminLogin: (payload) => request('/admin/login', { method: 'POST', body: payload, auth: false }),
  getAdminMetrics: () => request('/admin/metrics'),
  getAdminEarnings: () => request('/admin/earnings'),
  getAdminUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/users${q ? `?${q}` : ''}`);
  },
  toggleBlockAdminUser: (id, payload) => request(`/admin/users/${id}/block`, { method: 'POST', body: payload }),
  deleteAdminUser: (id, permanent = false) => request(`/admin/users/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' }),
  restoreAdminUser: (id) => request(`/admin/users/${id}/restore`, { method: 'POST' }),
  updateAdminUserSubscription: (id, payload) => request(`/admin/users/${id}/subscription`, { method: 'PATCH', body: payload }),
  toggleAdminBabyCarnet: (id, payload = {}) => request(`/admin/users/${id}/toggle-baby-carnet`, { method: 'POST', body: payload }),
  sendAdminEmail: (payload) => request('/admin/send-email', { method: 'POST', body: payload }),
  getAdminPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/payments${q ? `?${q}` : ''}`);
  },
  createAdminPayment: (payload) => request('/admin/payments', { method: 'POST', body: payload }),
  deleteAdminPayment: (id) => request(`/admin/payments/${id}`, { method: 'DELETE' }),

  // Actividad dentro de la app (auditoria) y videos de ejercicios
  getAdminActivity: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    const q = new URLSearchParams(clean).toString();
    return request(`/admin/actividad${q ? `?${q}` : ''}`);
  },
  getAdminActivitySummary: (days = 30) => request(`/admin/actividad/resumen?days=${encodeURIComponent(days)}`),
  listAdminExercises: () => request('/admin/ejercicios'),
  createAdminExercise: (payload) => request('/admin/ejercicios', { method: 'POST', body: payload }),
  updateAdminExercise: (id, payload) => request(`/admin/ejercicios/${id}`, { method: 'PUT', body: payload }),
  deleteAdminExercise: (id) => request(`/admin/ejercicios/${id}`, { method: 'DELETE' }),
};

async function authorizedFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = API_BASE ? `${API_BASE}/api${path}` : `/api${path}`;
  try {
    return await fetch(url, { ...options, headers });
  } catch {
    throw new Error('Error de conexion con el servidor. Revisa tu acceso a internet.');
  }
}

async function readError(res, fallback) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Descarga el album completo como ZIP (con el token en cabecera, sin exponerlo en la URL).
 * Devuelve { blob, fileName }.
 */
export async function downloadAlbumZip() {
  const res = await authorizedFetch('/fotos/exportar');
  if (!res.ok) {
    const err = new Error(await readError(res, 'No se pudo preparar el ZIP del album.'));
    err.status = res.status;
    throw err;
  }
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return { blob: await res.blob(), fileName: match?.[1] || 'album-mi-bebe.zip' };
}

/** Sube un video de ejercicio (solo administrador). */
export async function uploadExerciseVideo(id, file) {
  const form = new FormData();
  form.append('file', file, file.name || 'video.mp4');
  const res = await authorizedFetch(`/admin/ejercicios/${id}/video`, { method: 'POST', body: form });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) throw new Error(data?.error || `No se pudo subir el video (codigo ${res.status}).`);
  return data;
}


