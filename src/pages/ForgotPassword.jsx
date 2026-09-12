import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [channel, setChannel] = useState("email"); // 'email' | 'whatsapp'
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  // Temporizador regresivo de 15 minutos
  useEffect(() => {
    if (!result?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((result.expiresAt - Date.now()) / 1000),
      );
      setSecondsLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (channel === "email") {
        const res = await api.requestPasswordResetEmail({ email });
        const resetUrl = `${window.location.origin}/restablecer-contrasena?token=${encodeURIComponent(res.token)}`;
        setResult({
          type: "email",
          email,
          maskedEmail: res.maskedEmail || email,
          resetUrl,
          expiresAt: res.expiresAt || Date.now() + 15 * 60 * 1000,
          message: res.message,
        });
      } else {
        const res = await api.requestPasswordResetWhatsApp({
          identifier: phone,
        });
        const resetUrl = `${window.location.origin}/restablecer-contrasena?token=${encodeURIComponent(res.token)}`;
        const cleanPhone = (res.phone || phone).replace(/\D/g, "");
        const message = `Hola${res.userFirstName ? " " + res.userFirstName : ""}! Aquí tienes tu enlace seguro para restablecer tu contraseña en Mi Bebé:\n\n${resetUrl}\n\n⏱️ Ten en cuenta que este enlace tiene una caducidad de 15 minutos.`;
        const waUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

        setResult({
          type: "whatsapp",
          phone,
          resetUrl,
          waUrl,
          expiresAt: res.expiresAt || Date.now() + 15 * 60 * 1000,
          message: res.message,
        });
      }
      setSecondsLeft(15 * 60);
    } catch (err) {
      setError(
        err.message || "No se pudo procesar la solicitud de recuperación.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-container/60 mx-auto flex items-center justify-center text-3xl mb-3 shadow-cloud-sm">
            🔐
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
            Recuperar Contraseña
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
            Te enviaremos un enlace seguro con vigencia estricta de{" "}
            <strong>15 minutos</strong> a tu correo electrónico para que crees
            tu nueva clave.
          </p>
        </div>

        {!result ? (
          <div className="card flex flex-col gap-4 shadow-cloud">
            {/* Pestañas de Método: Correo (Principal/Recomendado) vs WhatsApp */}
            <div className="flex p-1 bg-surface-container rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setChannel("email");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  channel === "email"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span>✉️</span>
                <span>Por Correo (Gmail)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannel("whatsapp");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  channel === "whatsapp"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span>💬</span>
                <span>Por WhatsApp</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {channel === "email" ? (
                <div>
                  <label className="field-label flex items-center justify-between">
                    <span>Correo electrónico registrado</span>
                    <span className="text-[11px] text-primary font-semibold">
                      Gmail / Correo
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    Te enviaremos el enlace mediante nuestro servidor SMTP Gmail
                    seguro.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="field-label flex items-center justify-between">
                    <span>Número de teléfono / WhatsApp</span>
                    <span className="text-[11px] text-[#25D366] font-semibold">
                      WhatsApp
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    placeholder="Ej: 3101234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    Generaremos el enlace para enviar y abrir directamente en tu
                    chat de WhatsApp.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-error-container/30 border border-error/20 flex items-start gap-2">
                  <span className="text-error text-sm shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs text-error font-body leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  (channel === "email" ? !email.trim() : !phone.trim())
                }
                className="btn-primary flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-primary to-primary/90"
              >
                {loading ? (
                  "Enviando solicitud..."
                ) : channel === "email" ? (
                  <>
                    <span>✉️</span>
                    <span>Enviar Enlace a Mi Correo</span>
                  </>
                ) : (
                  <>
                    <span>💬</span>
                    <span>Generar Enlace para WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="card flex flex-col gap-4 shadow-cloud border border-primary/20 animate-fadeIn">
            {/* Indicador de vigencia estricta de 15 minutos */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                secondsLeft > 0
                  ? "bg-secondary-container/30 border-secondary/30"
                  : "bg-error-container/25 border-error/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl animate-pulse">⏱️</span>
                <div>
                  <p className="font-body font-semibold text-xs text-on-surface">
                    {secondsLeft > 0
                      ? "Enlace activo (Caducidad 15 min)"
                      : "Enlace Caducado"}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {secondsLeft > 0
                      ? `Tiempo restante para usarlo: ${formatTime(secondsLeft)}`
                      : "El enlace ha superado los 15 minutos permitidos."}
                  </p>
                </div>
              </div>
              <span
                className={`font-mono text-sm font-bold px-2.5 py-1 rounded-md ${
                  secondsLeft > 0
                    ? "bg-secondary text-white"
                    : "bg-error text-white"
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>

            {secondsLeft > 0 ? (
              result.type === "email" ? (
                <>
                  <div className="text-center py-2">
                    <span className="w-14 h-14 rounded-full bg-secondary-container text-secondary flex items-center justify-center text-3xl mx-auto mb-3 shadow-cloud-sm">
                      ✉️
                    </span>
                    <h3 className="font-display font-bold text-lg text-on-surface">
                      ¡Correo enviado con éxito!
                    </h3>
                    <p className="font-body text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      Hemos enviado las instrucciones de recuperación a: <br />
                      <strong className="text-primary font-semibold">
                        {result.maskedEmail}
                      </strong>
                    </p>
                  </div>

                  <div className="p-3 bg-surface-container/60 rounded-xl text-xs text-on-surface-variant space-y-1.5 border border-outline-variant/30">
                    <p className="font-semibold text-on-surface flex items-center gap-1">
                      <span>💡</span> Pasos a seguir:
                    </p>
                    <p>
                      1. Abre tu bandeja de entrada en Gmail (o revisa la
                      carpeta de Spam / Correo no deseado si no lo ves de
                      inmediato).
                    </p>
                    <p>
                      2. Pulsa el botón{" "}
                      <strong>"Restablecer Mi Contraseña"</strong> en el correo.
                    </p>
                    <p>
                      3. Recuerda que tienes <strong>15 minutos</strong> antes
                      de que expire el enlace.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <a
                      href="https://mail.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-center flex items-center justify-center gap-2 !py-3 font-semibold text-xs shadow-cloud-sm"
                    >
                      <span>📧</span>
                      <span>Abrir Gmail en el Navegador</span>
                    </a>

                    {/* {result.resetUrl && (
                      <Link
                        to={result.resetUrl.replace(window.location.origin, "")}
                        className="btn-secondary w-full text-center flex items-center justify-center gap-2 !py-2.5 text-xs font-semibold"
                      >
                        <span>🔗</span>
                        <span>Abrir enlace de restablecimiento directamente</span>
                      </Link>
                    )} */}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body text-xs text-on-surface leading-relaxed">
                    ¡Listo! Tu enlace de recuperación está generado para
                    WhatsApp. Pulsa el botón para continuar:
                  </p>
                  <div className="flex flex-col gap-2.5 pt-1">
                    <a
                      href={result.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-body font-semibold text-xs flex items-center justify-center gap-2 shadow-cloud-sm transition-all"
                    >
                      <span>💬</span>
                      <span>Abrir en WhatsApp</span>
                    </a>
                    {result.resetUrl && (
                      <Link
                        to={result.resetUrl.replace(window.location.origin, "")}
                        className="btn-secondary w-full text-center flex items-center justify-center gap-2 !py-2.5 text-xs font-semibold"
                      >
                        <span>🔗</span>
                        <span>Abrir enlace directamente</span>
                      </Link>
                    )}
                  </div>
                </>
              )
            ) : (
              <div className="text-center py-3">
                <p className="font-body text-xs text-error font-medium mb-3">
                  Por seguridad médica y confidencialidad, los enlaces vencen a
                  los 15 minutos.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                  }}
                  className="btn-primary !py-2.5 text-xs w-full"
                >
                  Solicitar un nuevo enlace
                </button>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/iniciar-sesion"
            className="font-body text-xs sm:text-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1"
          >
            <span>←</span>
            <span>Volver a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
