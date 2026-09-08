import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useAlarm } from '../context/AlarmContext';
import { api, uploadFile } from '../api/client';


export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [section, setSection] = useState('perfil');

  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(() => setDashboard(false));
  }, []);

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const avatarUrl = await uploadFile(file);
    await api.updateMe({ avatarUrl });
    refreshUser();
  };

  if (!user) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Mi perfil</h1>
      </header>

      <section className="card flex flex-col items-center text-center mb-6">
        <label className="relative w-24 h-24 rounded-full overflow-hidden bg-primary-container flex items-center justify-center mb-4 cursor-pointer border-4 border-white shadow-cloud">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🤰</span>}
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleAvatar} />
        </label>
        <h2 className="font-display text-xl font-semibold">{user.firstName} {user.lastName}</h2>
        <p className="font-body text-sm text-on-surface-variant">{user.email}</p>

        {dashboard && (
          <div className="flex gap-4 mt-5 w-full">
            <div className="flex-1 bg-primary-container/50 rounded-md py-3">
              <p className="text-xs text-on-primary-container">Semana actual</p>
              <p className="font-semibold text-on-primary-container">{dashboard.status.week}</p>
            </div>
            <div className="flex-1 bg-secondary-container/50 rounded-md py-3">
              <p className="text-xs text-on-secondary-container">Papá</p>
              <p className="font-semibold text-on-secondary-container">{dashboard.partner?.name || '—'}</p>
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setSection('perfil')} className={`pill-chip text-xs font-semibold ${section === 'perfil' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>Editar información</button>
        <button onClick={() => setSection('alarmas')} className={`pill-chip text-xs font-semibold ${section === 'alarmas' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>🔔 Alarmas y Sonido</button>
        <button onClick={() => setSection('privacidad')} className={`pill-chip text-xs font-semibold ${section === 'privacidad' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>Privacidad y seguridad</button>
      </div>

      {section === 'perfil' && <EditProfileForm user={user} refreshUser={refreshUser} />}
      {section === 'alarmas' && <AlarmSettingsSection />}
      {section === 'privacidad' && <PrivacySection logout={logout} navigate={navigate} />}

      <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost mt-6 text-error">
        Cerrar sesión
      </button>
    </AppLayout>
  );
}


function EditProfileForm({ user, refreshUser }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMe({ firstName, lastName, phone });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="field-label">Nombre</label><input className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
        <div><label className="field-label">Apellidos</label><input className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
      </div>
      <div><label className="field-label">Teléfono</label><input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}</button>
    </form>
  );
}

function PrivacySection({ logout, navigate }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.changePassword({ currentPassword, newPassword });
      setMsg('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={changePassword} className="card flex flex-col gap-4">
        <h3 className="font-display text-lg font-semibold">Cambiar contraseña</h3>
        <div><label className="field-label">Contraseña actual</label><input type="password" required className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
        <div><label className="field-label">Nueva contraseña</label><input type="password" required className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
        {msg && <p className="font-body text-sm text-on-surface-variant">{msg}</p>}
        <button type="submit" className="btn-secondary">Actualizar contraseña</button>
      </form>

      <div className="card">
        <h3 className="font-display text-lg font-semibold mb-2">Exportar información</h3>
        <p className="font-body text-sm text-on-surface-variant mb-4">Próximamente podrás exportar toda tu información en un archivo.</p>
        <button disabled className="btn-secondary opacity-50">Exportar mis datos</button>
      </div>

      <div className="card">
        <h3 className="font-display text-lg font-semibold mb-2">Términos y Tratamiento de Datos</h3>
        <p className="font-body text-sm text-on-surface-variant mb-4">
          Consulta las políticas de protección de datos personales (Ley 1581 de 2012), Habeas Data y condiciones de uso de Mi Bebé en Colombia.
        </p>
        <Link to="/terminos-y-condiciones" className="btn-secondary text-center block text-sm font-semibold !py-3">
          Ver Términos y Condiciones
        </Link>
      </div>

      <div className="card border border-error-container">
        <h3 className="font-display text-lg font-semibold mb-2 text-error">Eliminar cuenta</h3>
        <p className="font-body text-sm text-on-surface-variant mb-4">
          Esta acción es permanente y eliminará toda tu información: controles, medicamentos, álbum, diario y más.
        </p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-error">Eliminar mi cuenta</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={deleteAccount} className="btn-primary bg-error">Sí, eliminar todo</button>
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AlarmSettingsSection() {
  const {
    prefs,
    updatePrefs,
    tones,
    testSound,
    testAlarm,
    hasNotificationPermission,
    requestNotificationPermission,
  } = useAlarm();

  return (
    <div className="flex flex-col gap-4">
      {/* Tarjeta de Prueba Rápida */}
      <div className="card bg-primary-container/30 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-on-surface flex items-center gap-2">
            <span>🔊</span> Alarmas Sonoras Activas
          </h3>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Tus recordatorios, tomas de medicamentos y citas médicas sonarán con audio cuando se cumplan o estén por cumplirse.
          </p>
        </div>
        <button
          onClick={testAlarm}
          className="btn-primary shrink-0 !w-auto !py-2.5 !px-6 text-sm flex items-center gap-2"
        >
          <span>🔔</span> Probar Alarma Ahora
        </button>
      </div>

      {/* Tarjeta de Configuración de Sonido */}
      <div className="card flex flex-col gap-5">
        <h3 className="font-display text-lg font-semibold">Configuración de Audio y Notificaciones</h3>

        <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container cursor-pointer">
          <div>
            <span className="font-body font-semibold text-base text-on-surface block">Reproducir Alarma Sonora</span>
            <span className="font-body text-xs text-on-surface-variant">
              Emitir sonido continuo con melodía cuando se cumpla un evento o recordatorio
            </span>
          </div>
          <input
            type="checkbox"
            checked={prefs.soundEnabled}
            onChange={(e) => updatePrefs({ soundEnabled: e.target.checked })}
            className="w-6 h-6 accent-primary cursor-pointer"
          />
        </label>

        {/* Selección de Melodía */}
        <div>
          <label className="field-label">Tono de Alarma</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {tones.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  updatePrefs({ selectedTone: t.id });
                  testSound(t.id);
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                  prefs.selectedTone === t.id
                    ? 'border-primary bg-primary-container/30 ring-2 ring-primary/40'
                    : 'border-surface-container bg-surface-low hover:bg-surface-container'
                }`}
              >
                <div>
                  <p className="font-body font-semibold text-sm text-on-surface">{t.name}</p>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">{t.description}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    testSound(t.id);
                  }}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-xs hover:bg-primary hover:text-white transition-colors"
                  title="Escuchar tono"
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Volumen */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="field-label !mb-0">Volumen del Sonido</label>
            <span className="font-body text-sm font-semibold text-primary">{Math.round(prefs.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={prefs.volume}
            onChange={(e) => updatePrefs({ volume: parseFloat(e.target.value) })}
            className="w-full accent-primary cursor-pointer h-2 bg-surface-container rounded-lg"
          />
        </div>

        {/* Anticipación */}
        <div>
          <label className="field-label">Aviso Previo</label>
          <select
            value={prefs.advanceNoticeMinutes}
            onChange={(e) => updatePrefs({ advanceNoticeMinutes: parseInt(e.target.value, 10) })}
            className="input-field mt-1"
          >
            <option value={0}>Solo al momento exacto</option>
            <option value={5}>5 minutos antes del evento</option>
            <option value={15}>15 minutos antes del evento (Recomendado)</option>
            <option value={30}>30 minutos antes del evento</option>
          </select>
        </div>

        {/* Notificaciones del Navegador */}
        <div className="p-4 rounded-xl bg-surface-low border border-surface-container flex items-center justify-between gap-4">
          <div>
            <p className="font-body font-semibold text-sm text-on-surface">Notificaciones del Sistema / Navegador</p>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Recibe avisos visuales incluso si estás en otra pestaña o minimizaste la aplicación.
            </p>
          </div>
          {!hasNotificationPermission ? (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="btn-secondary !w-auto !py-2 !px-4 text-xs font-semibold shrink-0"
            >
              Permitir Notificaciones
            </button>
          ) : (
            <span className="pill-chip bg-secondary-container text-on-secondary-container text-xs shrink-0">
              ✓ Activadas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

