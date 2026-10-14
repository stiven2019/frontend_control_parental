import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ErrorBoundary Global y Modular para Mi Bebé
 * Evita por completo las pantallas blancas cuando ocurre un error imprevisto
 * en la renderización de React o fallos de red.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('🛡️ [ErrorBoundary Mi Bebé] Error interceptado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = () => {
    const errorText = `Error en Mi Bebé App:\nFecha: ${new Date().toISOString()}\nRuta: ${window.location.pathname}\nMensaje: ${this.state.error?.message || 'Desconocido'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      const isCarnet = window.location.pathname.includes('carnet') || window.location.pathname.includes('bebe-nacido');

      return (
        <div className="min-h-screen bg-surface flex flex-col justify-between p-4 sm:p-8 font-body text-on-surface">
          {/* Header Superior */}
          <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-outline-variant/30">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">🌸</span>
              <div>
                <span className="font-display font-bold text-lg text-primary tracking-tight">Mi Bebé</span>
                <span className="text-[10px] ml-2 font-mono uppercase bg-primary-container text-primary font-semibold px-2 py-0.5 rounded-full">
                  Protección de Pantalla
                </span>
              </div>
            </div>

            <button
              onClick={this.handleReload}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>🔄</span>
              <span>Recargar Aplicación</span>
            </button>
          </header>

          {/* Tarjeta Principal de Error */}
          <main className="max-w-2xl w-full mx-auto my-auto py-8">
            <div className="card text-center p-6 sm:p-10 shadow-cloud bg-white rounded-3xl border border-outline-variant/40 animate-fade-in relative overflow-hidden">
              {/* Resplandor decorativo */}
              <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-20 h-20 mx-auto rounded-3xl bg-error-container/40 text-error flex items-center justify-center text-4xl mb-5 shadow-cloud-sm border border-error/20">
                🌧️
              </div>

              <div className="inline-block bg-primary-container/40 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                {this.props.moduleName ? `Módulo: ${this.props.moduleName}` : 'Inconveniente Detectado'}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3 tracking-tight">
                Algo no salió como esperábamos en esta pantalla
              </h1>

              <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed mb-6">
                No te preocupes: <strong>tus datos clínicos, ecografías y registros están a salvo</strong> en el servidor. Ocurrió un error temporal al desplegar esta sección y la hemos protegido para evitar pantallas blancas.
              </p>

              {/* Caja de diagnóstico amigable */}
              <div className="bg-surface-container/40 p-4 rounded-2xl border border-outline-variant/30 text-left mb-6">
                <div className="flex items-start gap-2.5">
                  <span className="text-base text-amber-600 shrink-0">💡</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-on-surface">
                      Diagnóstico del Sistema:
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 font-mono break-words">
                      {this.state.error?.message || 'Error de procesamiento en la vista.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción principales */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="btn-primary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-cloud rounded-full active:scale-95"
                >
                  <span>🔄</span>
                  <span>Reintentar Pantalla</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReload}
                  className="btn-secondary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-full active:scale-95 border border-outline-variant/30"
                >
                  <span>🔁</span>
                  <span>Recargar Página</span>
                </button>

                <a
                  href="/inicio"
                  className="btn-secondary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-full active:scale-95 bg-secondary-container/40 text-secondary border border-secondary/20"
                >
                  <span>🏠</span>
                  <span>Ir al Inicio</span>
                </a>

                {isCarnet && (
                  <a
                    href="/mi-bebe"
                    className="btn-secondary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-full active:scale-95 bg-primary-container/40 text-primary border border-primary/20"
                  >
                    <span>🤰</span>
                    <span>Ir a Mi Bebé Gestación</span>
                  </a>
                )}
              </div>

              {/* Botón para ver y copiar detalles técnicos */}
              <div className="pt-4 border-t border-outline-variant/20 flex flex-col items-center">
                <div className="flex items-center gap-4 text-[11px]">
                  <button
                    type="button"
                    onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                    className="text-on-surface-variant hover:text-on-surface underline font-medium"
                  >
                    {this.state.showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos del error'}
                  </button>

                  <button
                    type="button"
                    onClick={this.handleCopyError}
                    className="text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>📋</span>
                    <span>{this.state.copied ? '¡Copiado!' : 'Copiar reporte técnico'}</span>
                  </button>
                </div>

                {this.state.showDetails && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono text-left w-full max-h-48 overflow-auto shadow-inner leading-relaxed">
                    <div className="text-amber-400 font-bold mb-1">
                      {this.state.error?.toString()}
                    </div>
                    <pre className="text-slate-400 whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack || this.state.error?.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="max-w-3xl w-full mx-auto text-center pt-6 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <p>
              Mi Bebé • Sistema de protección y recuperación de errores activa
            </p>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
