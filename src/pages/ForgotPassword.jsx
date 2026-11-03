import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

function MailIcon({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7.5 8 5.5 8-5.5" />
    </svg>
  );
}

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // La respuesta es siempre generica: nunca revela si la cuenta existe ni entrega el enlace
      await api.requestPasswordResetEmail({ email: identifier.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message || "No se pudo procesar la solicitud de recuperacion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen bg-surface flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-container/60 text-primary mx-auto flex items-center justify-center mb-3 shadow-cloud-sm">
            <MailIcon />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
            Recuperar contrasena
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
            Te enviaremos un enlace seguro a tu correo, valido por 15 minutos y de un solo uso.
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="card flex flex-col gap-4 shadow-cloud">
            <div>
              <label className="field-label" htmlFor="identifier">
                Correo o telefono registrado
              </label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                className="input-field"
                placeholder="tu@correo.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                maxLength={254}
              />
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-error-container/30 border border-error/20">
                <p className="text-xs text-error font-body leading-relaxed">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !identifier.trim()} className="btn-primary mt-1">
              {loading ? "Enviando solicitud..." : "Enviar enlace a mi correo"}
            </button>
          </form>
        ) : (
          <div className="card flex flex-col gap-4 shadow-cloud border border-primary/20 text-center" role="status">
            <span className="w-14 h-14 rounded-full bg-secondary-container text-secondary flex items-center justify-center mx-auto">
              <MailIcon className="w-7 h-7" />
            </span>
            <h2 className="font-display font-bold text-lg text-on-surface">Revisa tu correo</h2>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Si existe una cuenta con esos datos, te enviamos las instrucciones para crear una nueva contrasena.
              Si no lo ves en unos minutos, revisa la carpeta de spam o correo no deseado.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setIdentifier(""); }}
              className="btn-secondary !py-2.5 text-xs"
            >
              Usar otro correo
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/iniciar-sesion" className="font-body text-xs sm:text-sm text-primary font-semibold hover:underline">
            Volver a iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
