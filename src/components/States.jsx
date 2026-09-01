export function LoadingState({ label = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
      <div className="w-10 h-10 rounded-full border-4 border-primary-container border-t-primary animate-spin mb-4" />
      <p className="font-body text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = '🌸', title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 card">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      {description && <p className="font-body text-sm text-on-surface-variant max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Algo no salió como esperábamos.', onRetry }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 card">
      <span className="text-3xl mb-4">🌧️</span>
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
    warning: 'bg-error-container text-on-error-container',
    success: 'bg-secondary-container text-on-secondary-container',
  };
  return <div className={`rounded-md px-4 py-3 text-sm font-body ${tones[tone]}`}>{children}</div>;
}
