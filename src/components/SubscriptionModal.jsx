import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'full',
    name: 'Plan VIP Toda la App',
    subtitle: 'Acceso Total e Ilimitado',
    price: 50000,
    priceFormatted: '50.000',
    popular: true,
    badge: 'Más Recomendado ⭐',
    modules: ['*'],
    features: [
      'Mi Bebé en Gestación (Desarrollo fetal semana a semana, pataditas y FCF)',
      'Carnet de Salud Infantil (Bebé Nacido: Curvas OMS y 20 Vacunas PAI)',
      'Cuidados del Bebé Nacido y Guías Pediátricas',
      'Recordatorios y Alarmas sin límites',
      'Controles Médicos Prenatales y Pediátricos',
      'Calendario de Citas y Línea de Tiempo del Embarazo',
      'Álbum de Fotos, Ecografías y Documentos Clínicos',
      'Test Emocional, Diario de Notas y Módulo de Papá',
    ],
  },
  {
    id: 'salud',
    name: 'Plan Gestación y Bebé Nacido',
    subtitle: 'Seguimiento prenatal y del recién nacido',
    price: 30000,
    priceFormatted: '30.000',
    popular: false,
    badge: 'Salud y Clínica 👶',
    modules: ['gestacion', 'carnet_bebe', 'control_medico', 'recordatorios', 'calendario', 'embarazo_timeline', 'test_emocional'],
    features: [
      'Mi Bebé en Gestación (Monitoreo fetal en vientre)',
      'Carnet Infantil del Bebé Nacido y Vacunas PAI',
      'Controles médicos prenatales y pediátricos',
      'Recordatorios y Alarmas activas',
      'Calendario de Citas y Línea de Tiempo',
      'Test de bienestar emocional materno',
    ],
  },
  {
    id: 'basico',
    name: 'Plan Esencial Médico',
    subtitle: 'Gestación, Controles y Alarmas',
    price: 15000,
    priceFormatted: '15.000',
    popular: false,
    badge: 'Esencial 🩺',
    modules: ['gestacion', 'control_medico', 'recordatorios', 'calendario'],
    features: [
      'Mi Bebé en Gestación (Seguimiento prenatal)',
      'Controles médicos prenatales',
      'Recordatorios y alarmas de citas',
      'Calendario de citas médicas',
    ],
  },
];

export const MODULE_NAMES = {
  gestacion: 'Mi Bebé en Gestación',
  carnet_bebe: 'Carnet de Salud Infantil (Bebé Nacido)',
  calendario: 'Calendario de Citas y Embarazo',
  embarazo_timeline: 'Línea de Tiempo del Embarazo',
  papa: 'Módulo de Papá / Acompañante',
  album: 'Álbum de Fotos del Embarazo',
  diario: 'Diario de Emociones y Notas',
  control_medico: 'Controles Médicos Prenatales',
  recordatorios: 'Recordatorios y Alarmas',
  documentos: 'Documentos y Ecografías Clínicas',
  test_emocional: 'Test de Bienestar Emocional',
  cuenta_regresiva: 'Cuenta Regresiva al Parto',
  cuidados_mama: 'Guía de Cuidados de Mamá',
  cuidados_bebe: 'Guía de Cuidados del Bebé',
};

export default function SubscriptionModal({ isOpen, onClose, requestedModule }) {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState('full');
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];
  const moduleName = requestedModule ? MODULE_NAMES[requestedModule] || requestedModule : null;

  const copyToClipboard = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    'Hola! Deseo activar mi suscripción a la app Mi Bebé ❤️\n\n' +
    `• Plan: ${selectedPlan.name} ($${selectedPlan.priceFormatted} COP/mes)\n` +
    `• Nombre: ${user?.firstName || ''} ${user?.lastName || ''}\n` +
    `• Correo registrado: ${user?.email || 'No indicado'}\n\n` +
    'Adjunto mi comprobante de transferencia bancaria por Nequi/Daviplata para activar mi cuenta.'
  );

  const whatsappUrl = `https://wa.me/573122031777?text=${whatsappMessage}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface rounded-2xl shadow-2xl border border-primary/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-6 py-5 bg-surface-lowest border-b border-surface-container flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-primary-container/80 flex items-center justify-center text-2xl shrink-0">
              💎
            </span>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                Planes de Suscripción Mensual
              </h2>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {moduleName ? (
                  <span>
                    El módulo <strong className="text-primary font-semibold">"{moduleName}"</strong> requiere una suscripción activa.
                  </span>
                ) : (
                  'Desbloquea todas las herramientas para el cuidado de tu embarazo.'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm font-body">
          {/* Tarjetas de Planes */}
          <div>
            <p className="field-label mb-3">Elige tu plan preferido:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = plan.id === selectedPlanId;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative cursor-pointer rounded-xl p-4 transition-all flex flex-col justify-between border-2 ${
                      isSelected
                        ? 'border-primary bg-primary-container/20 shadow-md ring-1 ring-primary'
                        : 'border-surface-container bg-white hover:border-outline-variant'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary uppercase tracking-wider shadow-sm">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1 mt-1">
                        <h3 className="font-display font-bold text-base text-on-surface leading-tight">
                          {plan.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mb-3">{plan.subtitle}</p>

                      <div className="mb-3">
                        <span className="font-display text-2xl font-bold text-primary">
                          ${plan.priceFormatted}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium"> / mes</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-on-surface-variant border-t border-surface-container pt-3 mb-4">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-secondary font-bold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
                      }`}
                    >
                      {isSelected ? '✓ Seleccionado' : 'Seleccionar Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 p-3 bg-secondary-container/25 border border-secondary/30 rounded-xl flex items-center gap-2.5 text-xs text-on-surface">
              <span className="text-lg shrink-0">🎁</span>
              <span>
                <strong>Acceso Gratuito:</strong> Los módulos de <strong>Medicamentos 💊</strong>, <strong>Síntomas 📋</strong> y <strong>Guía de Desarrollo 🌱</strong> son 100% libres para todas las usuarias sin costo alguno.
              </span>
            </div>
          </div>

          {/* Información de Pago */}
          <div className="card !bg-surface-low border border-primary/15 !p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <span>💳</span>
              <span>Medios de Pago por Transferencia Bancaria (Colombia)</span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Transfiere el valor mensual del plan elegido (<strong>${selectedPlan.priceFormatted} COP</strong>) a cualquiera de las siguientes opciones:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Opción Nequi / Daviplata */}
              <div className="bg-white p-3 rounded-lg border border-surface-container flex flex-col justify-between gap-2 shadow-cloud-sm">
                <div>
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    Daviplata o Nequi
                  </span>
                  <div className="font-mono text-base font-bold text-on-surface mt-0.5">
                    3122031777
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('3122031777', 'number')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-high text-on-surface rounded-md text-xs font-semibold transition-colors w-full"
                >
                  {copiedField === 'number' ? (
                    <span className="text-secondary font-bold">✓ ¡Número copiado!</span>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copiar Número</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opción Llave Daviplata */}
              <div className="bg-white p-3 rounded-lg border border-surface-container flex flex-col justify-between gap-2 shadow-cloud-sm">
                <div>
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    Llave Daviplata
                  </span>
                  <div className="font-mono text-base font-bold text-on-surface mt-0.5">
                    @DAVI3122031777
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('@DAVI3122031777', 'key')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-high text-on-surface rounded-md text-xs font-semibold transition-colors w-full"
                >
                  {copiedField === 'key' ? (
                    <span className="text-secondary font-bold">✓ ¡Llave copiada!</span>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copiar Llave</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pasos y detalles */}
            <div className="pt-2">
              <div className="p-3 bg-secondary-container/30 border border-secondary/20 rounded-lg text-xs space-y-1 text-on-surface">
                <p className="font-semibold text-secondary flex items-center gap-1.5">
                  <span>📱</span> Pasos para activar tu cuenta de inmediato:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-on-surface-variant text-[11.5px] pl-1">
                  <li>Realiza la transferencia de <strong>${selectedPlan.priceFormatted} COP</strong> por Daviplata o Nequi.</li>
                  <li>Toma una captura del comprobante de transferencia exitosa.</li>
                  <li>Envía el comprobante por WhatsApp al número <strong>3122031777</strong> indicando tu correo registrado.</li>
                  <li>Tu cuenta será desbloqueada inmediatamente en nuestro sistema.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="px-6 py-4 bg-surface-lowest border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !py-2.5 !px-4 text-xs font-semibold !w-auto order-2 sm:order-1"
          >
            Volver a la aplicación
          </button>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-report-payment-whatsapp"
            className="btn-primary !py-3 !px-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 !w-full sm:!w-auto bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-md order-1 sm:order-2"
          >
            <span>💬</span>
            <span>Reportar Pago por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
