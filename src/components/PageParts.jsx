import ModuleIcon from './ModuleIcons';

// Encabezado de pagina con accion opcional a la derecha
export function PageHeader({ title, subtitle, action }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="font-body text-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

// Boton flotante (agregar / cerrar formulario)
export function Fab({ open, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Cerrar formulario' : label}
      className="fixed right-5 bottom-28 md:bottom-10 md:right-10 z-30 w-[60px] h-[60px] rounded-full bg-primary text-on-primary flex items-center justify-center shadow-float active:scale-95 transition-transform"
    >
      <ModuleIcon name={open ? 'close' : 'plus'} className="w-7 h-7" strokeWidth={2.2} />
    </button>
  );
}
