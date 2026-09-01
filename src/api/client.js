const TOKEN_KEY = 'mibebe_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
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
  const res = await fetch('/api/upload', {
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
  deleteJournal: (id) => request(`/diario/${id}`, { method: 'DELETE' }),

  // Síntomas
  listSymptoms: () => request('/sintomas'),
  createSymptom: (payload) => request('/sintomas', { method: 'POST', body: payload }),

  // Calendario
  getCalendarEvents: () => request('/calendario/eventos'),

  // Contenido educativo público
  getMomCare: () => request('/contenido/cuidados-mama', { auth: false }),
  getBabyCare: () => request('/contenido/cuidados-bebe', { auth: false }),
};
