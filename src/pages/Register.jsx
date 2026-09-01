import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

          <label className="flex items-start gap-3 mt-2 cursor-pointer">
            <input type="checkbox" required checked={form.consentAccepted} onChange={set('consentAccepted')} className="mt-1 w-4 h-4 accent-primary" />
            <span className="font-body text-xs text-on-surface-variant">
              Doy mi consentimiento para el manejo de mi información personal y médica dentro de esta aplicación.
            </span>
          </label>

          {error && <p className="text-sm text-error font-body">{error}</p>}

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
      </div>
    </div>
  );
}
