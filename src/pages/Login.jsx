import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="font-display text-3xl font-semibold text-primary mb-2">Hola de nuevo ❤️</h1>
        <p className="font-body text-sm text-on-surface-variant mb-8">
          Inicia sesión para seguir el camino junto a tu bebé.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Correo electrónico</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-error font-body">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center font-body text-sm text-on-surface-variant mt-6">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/crear-cuenta" className="text-primary font-semibold">
            Crear mi cuenta
          </Link>
        </p>
        <p className="text-center font-body text-sm mt-2">
          <Link to="/" className="text-outline">
            Volver
          </Link>
        </p>
      </div>
    </div>
  );
}
