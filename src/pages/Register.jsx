import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TermsModal from '../components/TermsModal';
import { TERMS_SECTIONS } from '../data/termsContent';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', motherBirthDate: '',
    currentPregnancyNumber: 1, numberOfChildren: 0, consentAccepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showInlineTerms, setShowInlineTerms] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'consentAccepted' && value) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación de coincidencia de contraseñas
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    // Validación estricta de Términos y Condiciones bajo la ley colombiana
    if (!form.consentAccepted) {
      setError('Debes leer y aceptar los Términos y Condiciones y la Política de Tratamiento de Datos Personales (Leyes 1581 de 2012 y 1480 de 2011) para poder crear tu cuenta.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/configuracion-inicial');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="font-display text-3xl font-semibold text-primary mb-2">Comencemos juntas</h1>
        <p className="font-body text-sm text-on-surface-variant mb-8">
          Crea tu cuenta para guardar cada momento de tu embarazo.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Nombre</label>
              <input required className="input-field" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <label className="field-label">Apellidos</label>
              <input required className="input-field" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>

          <div>
            <label className="field-label">Correo electrónico</label>
            <input type="email" required className="input-field" value={form.email} onChange={set('email')} />
          </div>

          <div>
            <label className="field-label">Número de teléfono</label>
            <input className="input-field" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Contraseña</label>
              <input type="password" required className="input-field" value={form.password} onChange={set('password')} />
            </div>
            <div>
              <label className="field-label">Confirmar</label>
              <input type="password" required className="input-field" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          </div>

          <div>
            <label className="field-label">Fecha de nacimiento (mamá)</label>
            <input type="date" className="input-field" value={form.motherBirthDate} onChange={set('motherBirthDate')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Número de embarazo</label>
              <input type="number" min={1} className="input-field" value={form.currentPregnancyNumber} onChange={set('currentPregnancyNumber')} />
            </div>
            <div>
              <label className="field-label">Número de hijos</label>
              <input type="number" min={0} className="input-field" value={form.numberOfChildren} onChange={set('numberOfChildren')} />
            </div>
          </div>

          {/* Bloque Destacado de Términos y Condiciones */}
          <div className={`p-4 rounded-xl border transition-all ${
            form.consentAccepted
              ? 'bg-secondary-container/25 border-secondary/40'
              : 'bg-surface-container/70 border-surface-container'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="consentAcceptedCheckbox"
                checked={form.consentAccepted}
                onChange={set('consentAccepted')}
                className="mt-1 w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
              />
              <span className="font-body text-xs text-on-surface leading-relaxed">
                He leído y acepto los{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                  className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
                >
                  Términos y Condiciones y la Política de Protección de Datos
                </button>{' '}
                (Ley 1581 de 2012 y Res. 3280 de 2018 de Colombia).
              </span>
            </label>

            <div className="mt-3 pl-7 flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 bg-white/80 px-2 py-1 rounded border border-primary/20"
                >
                  <span>🔍</span> Abrir en ventana emergente
                </button>
                <button
                  type="button"
                  onClick={() => setShowInlineTerms(!showInlineTerms)}
                  className="text-on-surface-variant hover:text-primary font-medium underline flex items-center gap-1"
                >
                  <span>{showInlineTerms ? '▲ Ocultar lectura' : '▼ Leer aquí mismo (7 Artículos)'}</span>
                </button>
              </div>

              {form.consentAccepted && (
                <span className="pill-chip !py-0.5 !px-2 bg-secondary-container text-on-secondary-container font-semibold">
                  ✓ Aceptado
                </span>
              )}
            </div>

            {/* Visor integrado desplegable dentro del mismo formulario */}
            {showInlineTerms && (
              <div className="mt-3.5 pt-3 border-t border-outline-variant/30 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-semibold text-xs text-on-surface flex items-center gap-1.5">
                    <span>📜</span>
                    <span>Documento Completo de Términos (Colombia)</span>
                  </span>
                  <span className="text-[10px] text-on-surface-variant bg-white px-2 py-0.5 rounded border border-outline-variant/20">
                    7 Artículos Normativos
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto p-3 rounded-lg bg-white border border-surface-container space-y-4 text-xs font-body text-on-surface leading-relaxed">
                  {TERMS_SECTIONS.map((sec) => (
                    <div
                      key={sec.id}
                      className={`p-2.5 rounded-lg border ${
                        sec.highlight ? 'bg-error-container/10 border-error/30' : 'bg-surface-container/30 border-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          sec.highlight ? 'bg-error' : 'bg-primary'
                        }`}>
                          {sec.number}
                        </span>
                        <h4 className={`font-display font-bold text-xs ${sec.highlight ? 'text-error' : 'text-on-surface'}`}>
                          {sec.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-on-surface-variant whitespace-pre-line leading-relaxed space-y-1">
                        {sec.content.split('\n\n').map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="p-2.5 rounded-lg bg-surface-container/50 border border-outline-variant/20 text-[11px] text-on-surface-variant">
                    <p className="font-semibold text-on-surface">🏛️ Autoridad de Vigilancia:</p>
                    <p>Superintendencia de Industria y Comercio (SIC) — Delegatura de Protección de Datos. www.sic.gov.co</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-on-surface-variant">
                    {form.consentAccepted ? '✓ Has aceptado los términos' : 'Marca la casilla para confirmar tu aceptación'}
                  </p>
                  {!form.consentAccepted && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, consentAccepted: true }));
                        setError('');
                      }}
                      className="btn-primary !py-1.5 !px-3 text-xs font-semibold !w-auto"
                    >
                      Aceptar términos leídos
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container/30 border border-error/20 flex items-start gap-2">
              <span className="text-error text-sm shrink-0 mt-0.5">⚠️</span>
              <p className="text-xs text-error font-body leading-relaxed">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Creando cuenta...' : 'Comenzar mi seguimiento'}
          </button>
        </form>

        <p className="text-center font-body text-sm text-on-surface-variant mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/iniciar-sesion" className="text-primary font-semibold">
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center font-body text-xs text-on-surface-variant mt-3">
          <Link to="/terminos-y-condiciones" className="text-outline hover:text-primary hover:underline">
            Consultar Términos y Condiciones completos
          </Link>
        </p>
      </div>

      {/* Modal Popup Interactivo de Términos y Condiciones */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onConfirm={() => {
          setForm((f) => ({ ...f, consentAccepted: true }));
          setError('');
        }}
        initiallyAccepted={form.consentAccepted}
      />
    </div>
  );
}
