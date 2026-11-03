import ModuleIcon from './ModuleIcons';

// Los llamadores historicos pasan emojis; se traducen a iconos de linea.
const EMOJI_TO_ICON = {
  '💊': 'pill',
  '🌡️': 'pulse',
  '📷': 'camera',
  '📸': 'camera',
  '🗓️': 'calendar',
  '📖': 'book',
  '📁': 'folder',
  '⏰': 'bell',
  '🩺': 'steth',
  '🌸': 'heart',
};

export function LoadingState({ label = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant" role="status">
      <div className="w-10 h-10 rounded-full border-4 border-primary-container border-t-primary animate-spin mb-4" />
      <p className="font-body text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = 'heart', title, description, action }) {
  const name = EMOJI_TO_ICON[icon] || (/^[a-z]+$/.test(icon) ? icon : 'heart');
  return (
    <div className="flex flex-col items-center text-center py-14 px-6 card">
      <span className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4">
        <ModuleIcon name={name} className="w-8 h-8" />
      </span>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      {description && <p className="font-body text-sm text-on-surface-variant max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Algo no salió como esperábamos.', onRetry }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6 card" role="alert">
      <span className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-4">
        <ModuleIcon name="cloud" className="w-8 h-8" />
      </span>
      <p className="font-body text-sm text-on-surface-variant max-w-xs mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary max-w-[200px]">
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'bg-tertiary-container text-on-tertiary-container',
    warning: 'bg-primary-container text-on-primary-container',
    success: 'bg-secondary-container text-on-secondary-container',
  };
  return (
    <div className={`rounded-3xl px-4 py-3.5 text-sm font-body font-semibold flex gap-3 items-start ${tones[tone]}`} role={tone === 'warning' ? 'alert' : undefined}>
      <ModuleIcon name={tone === 'success' ? 'check' : tone === 'warning' ? 'alert' : 'info'} className="w-5 h-5 shrink-0 mt-px" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
