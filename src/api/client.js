const TOKEN_KEY = 'mibebe_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function getFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
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

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // respuesta sin cuerpo
  }

  if (!res.ok) {
    const message = data?.error || 'Ocurrió un error inesperado. Intenta de nuevo.';
    const err = new Error(message);
    err.status = res.status;
    err.needsSetup = data?.needsSetup;
    throw err;
  }

  return data;
}

export async function uploadFile(file) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const url = API_BASE ? `${API_BASE}/api/upload` : '/api/upload';
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'No pudimos subir el archivo.');
  return data.url;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  updateMe: (payload) => request('/auth/me', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
  requestPasswordResetEmail: (payload) => request('/auth/forgot-password-email', { method: 'POST', body: payload, auth: false }),
  requestPasswordResetWhatsApp: (payload) => request('/auth/forgot-password-whatsapp', { method: 'POST', body: payload, auth: false }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload, auth: false }),
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),

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
};

