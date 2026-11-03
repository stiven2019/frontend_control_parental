import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const { user } = useAuth();

  const choose = (id) => {
    if (id === theme) return;
    setTheme(id);
    if (user) {
      // Registro opcional para el panel de actividad; nunca bloquea el cambio de tema
      api.sendClientEvent({ type: 'tema_cambiado', theme: id }).catch(() => {});
    }
  };

  return (
    <div className="card">
      <h3 className="font-display text-lg font-semibold mb-1">Color de la app</h3>
      <p className="font-body text-sm text-on-surface-variant mb-4">
        Elige la paleta que mas te guste: cada una tiene su propio contraste revisado para leer comodo. Se guarda en este dispositivo.
      </p>
      <div role="radiogroup" aria-label="Tema de color" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {themes.map((t) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(t.id)}
              className={`text-left rounded-2xl p-2.5 border-2 transition-all active:scale-[0.98] ${
                active ? 'border-primary bg-surface-low shadow-cloud-sm' : 'border-outline-variant/50 bg-white hover:border-primary/50'
              }`}
            >
              {/* Vista previa en miniatura de la app con esa paleta */}
              <div className="rounded-xl overflow-hidden border border-black/10 mb-2.5" style={{ backgroundColor: t.surface }} aria-hidden="true">
                <div className="h-5 flex items-center gap-1 px-2" style={{ backgroundColor: t.container }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.primary }} />
                  <span className="h-1 w-8 rounded-full" style={{ backgroundColor: t.primary, opacity: 0.55 }} />
                </div>
                <div className="p-2 space-y-1.5">
                  <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: t.primary, opacity: 0.8 }} />
                  <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: t.primary, opacity: 0.25 }} />
                  <div className="flex gap-1.5 pt-0.5">
                    <span className="h-4 flex-1 rounded-md" style={{ backgroundColor: t.accent }} />
                    <span className="h-4 w-9 rounded-md" style={{ backgroundColor: t.primary }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="font-body text-sm font-semibold text-on-surface">{t.label}</span>
                {active && (
                  <span className="text-primary" title="Tema activo">
                    <CheckIcon />
                  </span>
                )}
              </div>
              <p className="font-body text-[11px] text-on-surface-variant mt-0.5 px-0.5">{t.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
