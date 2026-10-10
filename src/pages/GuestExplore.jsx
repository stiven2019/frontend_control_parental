import { Link, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { MomCare, BabyCare } from "./Content";

const MODULES_INFO = [
  {
    id: "gestacion",
    category: "gestacion",
    icon: "🤰",
    title: "Mi Bebé en Gestación (Semana a Semana)",
    badge: "Etapa Gestacional",
    badgeColor: "bg-primary-container text-primary",
    planRequired: "Plan Esencial o Superior",
    description:
      "Calcula tus semanas y días exactos de gestación, fecha probable de parto (FPP) y tamaño del bebé comparado con frutas y verduras. Visualiza el desarrollo anatómico de sus órganos y sigue el contador regresivo hacia el nacimiento.",
    highlights: [
      "Cálculo FUM y FPP",
      "Comparativa con frutas/verduras",
      "Desarrollo anatómico",
      "Contador regresivo",
    ],
  },
  {
    id: "postnatal",
    category: "medico",
    icon: "👶",
    title: "Carnet de Salud Infantil (Postnatal)",
    badge: "Bebé Nacido",
    badgeColor: "bg-secondary-container text-secondary",
    planRequired: "Plan Gestación / VIP",
    description:
      "Exclusivo para el seguimiento del bebé ya nacido. Gráficos interactivos con percentiles y curvas oficiales de la OMS (peso para la edad, talla y perímetro cefálico), control de vacunas oficiales del esquema PAI (0 a 5 años) y citas de pediatría.",
    highlights: [
      "Curvas de crecimiento OMS",
      "Esquema de vacunas PAI",
      "Percentiles oficiales",
      "Control pediátrico",
    ],
  },
  {
    id: "controles_medicos",
    category: "medico",
    icon: "🩺",
    title: "Controles Médicos Prenatales",
    badge: "Rigor Clínico",
    badgeColor: "bg-blue-100 text-blue-800",
    planRequired: "Plan Esencial o Superior",
    description:
      "Registra y organiza cada cita con tu ginecólogo u obstetra. Guarda presión arterial, peso materno, altura uterina, frecuencia cardíaca fetal (FCF), diagnósticos médicos y las recomendaciones del especialista.",
    highlights: [
      "Presión y peso materno",
      "Altura uterina y FCF",
      "Diagnósticos e historial",
      "Próximas citas",
    ],
  },
  {
    id: "documentos",
    category: "medico",
    icon: "📁",
    title: "Expediente de Documentos y Ecografías",
    badge: "Nube Segura MinIO",
    badgeColor: "bg-emerald-100 text-emerald-800",
    planRequired: "Plan VIP",
    description:
      "Almacena en la nube tus ecografías, fórmulas médicas, órdenes y resultados de laboratorio. Cuenta con un visor interactivo integrado para leer PDFs y visualizar imágenes en alta resolución al instante o descargarlas.",
    highlights: [
      "Visor interactivo de PDFs",
      "Fotos de ecografías",
      "Almacenamiento MinIO",
      "Descarga y búsqueda rápida",
    ],
  },
  {
    id: "medicamentos",
    category: "medico",
    icon: "💊",
    title: "Control de Medicamentos y Vitaminas",
    badge: "100% Gratuito ⭐",
    badgeColor: "bg-emerald-100 text-emerald-800 font-bold",
    planRequired: "Gratis para Todas",
    description:
      "Organiza tus suplementos prenatales (ácido fólico, hierro, calcio, multivitaminas) y medicamentos prescritos. Configura dosis, horarios exactos y confirma con un clic cada toma para asegurar la adherencia médica.",
    highlights: [
      "Horarios y dosis",
      'Botón "Tomado hoy"',
      "Historial de tomas",
      "Suplementos prenatales",
    ],
  },
  {
    id: "sintomas",
    category: "bienestar",
    icon: "📋",
    title: "Registro Diario de Síntomas",
    badge: "100% Gratuito ⭐",
    badgeColor: "bg-emerald-100 text-emerald-800 font-bold",
    planRequired: "Gratis para Todas",
    description:
      "Monitorea síntomas físicos diarios (náuseas, cansancio, contracciones, movimientos fetales) para mostrárselos a tu médico. Módulo abierto y sin restricciones para todas las gestantes.",
    highlights: [
      "Seguimiento de malestares",
      "Movimientos fetales",
      "Frecuencia e intensidad",
      "Historial para el médico",
    ],
  },
  {
    id: "alarmas",
    category: "gestacion",
    icon: "⏰",
    title: "Alarmas Sonoras y Recordatorios Inteligentes",
    badge: "Notificaciones Push",
    badgeColor: "bg-rose-100 text-rose-800",
    planRequired: "Plan Esencial o Superior",
    description:
      "Alarmas sonoras programables que suenan en tu dispositivo y notificaciones Web Push en segundo plano (incluso con la aplicación cerrada o pantalla bloqueada) para no olvidar medicamentos, exámenes o citas.",
    highlights: [
      "Tono sonoro audible",
      "Notificaciones Web Push",
      "Funciona en segundo plano",
      "Citas y medicamentos",
    ],
  },
  {
    id: "album",
    category: "familia",
    icon: "📸",
    title: "Álbum Fotográfico y Recuerdos",
    badge: "Memorias Familiares",
    badgeColor: "bg-pink-100 text-pink-800",
    planRequired: "Plan VIP",
    description:
      "Crea una galería fotográfica del crecimiento de tu pancita semana a semana. Guarda fotos de ecografías, momentos especiales con papá y la familia, acompañadas de notas y fechas significativas.",
    highlights: [
      "Fotos semana a semana",
      "Recuerdos con papá y familia",
      "Visor de pantalla completa",
      "Notas emotivas",
    ],
  },
  {
    id: "diario",
    category: "bienestar",
    icon: "📔",
    title: "Diario Íntimo de Emociones",
    badge: "Autocuidado",
    badgeColor: "bg-purple-100 text-purple-800",
    planRequired: "Plan VIP",
    description:
      "Escribe reflexiones, pensamientos y cartas íntimas para tu bebé. Espacio confidencial y seguro para plasmar la evolución emocional de tu maternidad.",
    highlights: [
      "Diario emocional privado",
      "Cartas para el bebé",
      "Reflexiones semanales",
      "Seguridad confidencial",
    ],
  },
  {
    id: "bienestar_emocional",
    category: "bienestar",
    icon: "💖",
    title: "Test de Bienestar Emocional Perinatal",
    badge: "Salud Mental",
    badgeColor: "bg-red-100 text-red-800",
    planRequired: "Plan Gestación / VIP",
    description:
      "Tamizaje preventivo basado en la escala clínica EPDS (Escala de Edimburgo) para monitorear tu bienestar emocional durante el embarazo y posparto. Incluye semáforo orientativo y recursos de apoyo.",
    highlights: [
      "Escala clínica EPDS",
      "Evaluación preventiva",
      "Semáforo emocional",
      "Consejos de salud mental",
    ],
  },
  {
    id: "calendario",
    category: "gestacion",
    icon: "📅",
    title: "Calendario Perinatal Interactivo",
    badge: "Planificación",
    badgeColor: "bg-indigo-100 text-indigo-800",
    planRequired: "Plan Esencial o Superior",
    description:
      "Vista integrada mensual y semanal donde se sincronizan automáticamente tus citas médicas, controles prenatales, exámenes programados, fechas de ecografías y recordatorios de salud.",
    highlights: [
      "Vista mensual y semanal",
      "Sincronización automática",
      "Eventos y citas",
      "Fechas clave",
    ],
  },
  {
    id: "pareja",
    category: "familia",
    icon: "🧑‍🍼",
    title: "Papá y Lazos Familiares (QR 15 min)",
    badge: "1 Papá + Familia",
    badgeColor: "bg-teal-100 text-teal-800",
    planRequired: "Plan VIP",
    description:
      "Conexión segura por código QR con vigencia de 15 minutos (refresco automático cada 15 min si no se conecta). Permite un único papá vinculado con acceso a álbum y diario, y familiares con nombres diferenciados de solo lectura.",
    highlights: [
      "Solo 1 papá vinculado",
      "QR y link con caducidad 15 min",
      "Auto-refresco cada 15 min",
      "Sin nombres duplicados",
    ],
  },
  {
    id: "guias_educativas",
    category: "familia",
    icon: "🌱",
    title: "Guía de Desarrollo Fetal y Biblioteca Médica",
    badge: "100% Gratuito ⭐",
    badgeColor: "bg-emerald-100 text-emerald-800 font-bold",
    planRequired: "Gratis para Todas",
    description:
      "Artículos verificados sobre nutrición materna, ejercicios recomendados, signos de alarma obstétrica (cuándo acudir a urgencias), cuidados del recién nacido, lactancia y desarrollo semana a semana.",
    highlights: [
      "Desarrollo semana a semana",
      "Nutrición y alimentación",
      "Signos de alarma de urgencias",
      "Lactancia y recién nacido",
    ],
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "Todos los módulos", icon: "✨" },
  { id: "medico", label: "Control Clínico y Salud", icon: "🩺" },
  { id: "gestacion", label: "Gestación y Alarmas", icon: "🤰" },
  { id: "bienestar", label: "Bienestar y Emociones", icon: "💖" },
  { id: "familia", label: "Familia y Recuerdos", icon: "👨‍👩‍👧" },
];

const EXPLORE_PLANS = [
  {
    id: "full",
    name: "Plan VIP Toda la App",
    badge: "Acceso Total ⭐",
    priceFormatted: "50.000",
    period: "mes",
    popular: true,
    description: "Acceso completo a los 14 módulos clínicos, pediátricos, familiares y de almacenamiento.",
    features: [
      "Mi Bebé en Gestación (Semana a semana, pataditas y FCF)",
      "Carnet de Salud Infantil (Curvas OMS y 20 Vacunas PAI)",
      "Cuidados del Bebé Nacido y guías clínicas",
      "Alarmas sonoras y Recordatorios Web Push en segundo plano",
      "Controles Médicos Prenatales y Pediátricos con diagnósticos",
      "Expediente de Documentos y Ecografías (Visor de PDF/fotos)",
      "Álbum de Fotos del Embarazo y del Bebé",
      "Test Emocional Perinatal (Escala EPDS) y Diario Íntimo",
      "Módulo de Papá (1 solo papá) y Lazos Familiares (QR 15 min)",
      "Alerta preventiva por correo 1 semana antes de vencer",
    ],
  },
  {
    id: "salud",
    name: "Plan Gestación y Bebé Nacido",
    badge: "Clínico y Pediátrico 👶",
    priceFormatted: "30.000",
    period: "mes",
    popular: false,
    description: "Ideal para el seguimiento médico del embarazo y los primeros meses del bebé.",
    features: [
      "Mi Bebé en Gestación (Desarrollo y métricas fetales)",
      "Carnet de Salud Infantil (Curvas OMS de peso/talla)",
      "Esquema completo de 20 Vacunas PAI de Colombia",
      "Controles médicos prenatales y pediátricos",
      "Alarmas sonoras y Recordatorios activos",
      "Calendario Perinatal de Citas Médicas",
      "Test de Bienestar Emocional Materno",
      "Alerta preventiva por correo 1 semana antes de vencer",
    ],
  },
  {
    id: "basico",
    name: "Plan Esencial Médico",
    badge: "Esencial 🩺",
    priceFormatted: "15.000",
    period: "mes",
    popular: false,
    description: "Acompañamiento prenatal obstétrico básico para tus consultas y citas médicas.",
    features: [
      "Mi Bebé en Gestación (Seguimiento prenatal)",
      "Registro de Controles Médicos Prenatales",
      "Alarmas de citas médicas y tomas de salud",
      "Calendario Perinatal sincronizado",
      "Acceso permanente a módulos gratuitos",
      "Alerta preventiva por correo 1 semana antes de vencer",
    ],
  },
];

export default function GuestExplore() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-surface-container/20 to-surface">
      {/* Header Fijo */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-4 sm:px-8 py-3.5 sm:py-4 transition-all">
        <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 group"
          >
            <span className="text-2xl transition-transform group-hover:scale-110">
              ❤️
            </span>
            <span className="tracking-tight">Mi Bebé</span>
          </Link>

          {/* Enlaces de Navegación Rápida Desktop */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-on-surface-variant">
            <a href="#modulos" className="hover:text-primary transition-colors">
              Módulos
            </a>
            <a href="#planes" className="hover:text-primary transition-colors text-primary font-bold">
              Planes y Precios 💎
            </a>
            <a href="#familia" className="hover:text-primary transition-colors">
              Papá y Familia 🧑‍🍼
            </a>
            <a href="#guias" className="hover:text-primary transition-colors">
              Guías Médicas
            </a>
          </nav>

          {/* Botones de Inicio de Sesión y Registro */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/iniciar-sesion"
              className="inline-flex items-center justify-center text-center font-body text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-primary/40 text-primary hover:bg-primary-container/30 transition-all whitespace-nowrap active:scale-95"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/crear-cuenta"
              className="inline-flex items-center justify-center text-center font-body text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-primary text-white shadow-cloud-sm hover:bg-primary/90 transition-all whitespace-nowrap active:scale-95"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal de Exploración */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-8 pb-24 pt-4 sm:pt-6">
        <Routes>
          <Route index element={<GuestHome />} />
          <Route path="cuidados-mama" element={<MomCare />} />
          <Route path="cuidados-bebe" element={<BabyCare />} />
        </Routes>
      </div>
    </div>
  );
}

function GuestHome() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredModules = MODULES_INFO.filter(
    (m) => activeCategory === "all" || m.category === activeCategory,
  );

  const whatsappMessage = encodeURIComponent(
    "¡Hola! Vengo desde la página de Explorar de Mi Bebé ❤️ y deseo conocer más sobre la activación de los planes de suscripción por Nequi/Daviplata."
  );
  const whatsappUrl = `https://wa.me/573122031777?text=${whatsappMessage}`;

  return (
    <>
      {/* Hero Principal Explicativo con Botones Activos */}
      <section className="my-6 sm:my-10 animate-fade-in">
        <div className="card !bg-gradient-to-br from-primary-container/70 via-white to-secondary-container/30 !p-6 sm:!p-12 text-center rounded-3xl border-2 border-primary/20 shadow-cloud">
         
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-on-surface mb-4 leading-tight max-w-3xl mx-auto">
            Todo lo que puedes hacer dentro de{" "}
            <span className="text-primary">Mi Bebé</span>
          </h1>

          <p className="font-body text-on-surface-variant mb-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
           Un acompañamiento clínico y familiar completo: desde tu primera semana de gestación hasta el carnet oficial de crecimiento del bebé nacido. Conoce cada una de las herramientas diseñadas para darte tranquilidad.
          </p>

          
          {/* Highlights en Píldoras */}
          <div className="pt-6 border-t border-outline-variant/30 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-on-surface-variant">
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>🩺</span> 14 Módulos Integrados
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>📊</span> Curvas OMS y 20 Vacunas PAI
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>🧑‍🍼</span> Solo 1 Papá + QR 15 min
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>🔔</span> Alerta al correo 1 semana antes
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>⏰</span> Alarmas con sonido y Web Push
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>📁</span> Visor de PDFs y Ecografías
            </span>
          </div>
        </div>
      </section>

      {/* Flujo de las 3 Grandes Etapas */}
      <section className="mb-14">
        <div className="text-center mb-8">
          <span className="pill-chip bg-secondary-container text-secondary font-bold text-xs uppercase tracking-wider mb-2">
            Acompañamiento Continuo
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
            ¿Cómo te apoya la plataforma en cada etapa?
          </h2>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto mt-2">
            La plataforma evoluciona contigo: te brinda herramientas obstétricas durante el embarazo y se transforma en un carnet pediátrico cuando nace tu bebé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card !p-5 border border-outline-variant/30 rounded-2xl bg-white hover:shadow-cloud transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center text-2xl mb-3 shadow-cloud-sm">
              🤰
            </div>
            <span className="pill-chip bg-primary-container/40 text-primary text-[10px] font-bold mb-2">
              Etapa 1 · Semanas 1 a 40
            </span>
            <h3 className="font-display text-lg font-bold text-on-surface mb-2">
              Gestación y Embarazo
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-3">
              Monitoreo del crecimiento fetal semana a semana, controles médicos, registro de presión arterial, altura uterina, síntomas físicos y tomas de vitaminas prenatales.
            </p>
            <ul className="text-[11px] text-on-surface space-y-1 font-medium">
              <li className="flex items-center gap-1 text-primary">
                ✓ Desarrollo fetal anatómico comparativo
              </li>
              <li className="flex items-center gap-1 text-primary">
                ✓ Alarmas de suplementos y citas
              </li>
              <li className="flex items-center gap-1 text-primary">
                ✓ Visor de ecografías en alta calidad
              </li>
            </ul>
          </div>

          <div className="card !p-5 border border-outline-variant/30 rounded-2xl bg-white hover:shadow-cloud transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mb-3 shadow-cloud-sm">
              🏥
            </div>
            <span className="pill-chip bg-amber-100 text-amber-800 text-[10px] font-bold mb-2">
              Etapa 2 · Parto y Llegada
            </span>
            <h3 className="font-display text-lg font-bold text-on-surface mb-2">
              Nacimiento del Bebé
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-3">
              Preparación para el parto, guías sobre la maleta de maternidad, signos de alarma obstétrica y botón de confirmación de nacimiento para activar el módulo infantil.
            </p>
            <ul className="text-[11px] text-on-surface space-y-1 font-medium">
              <li className="flex items-center gap-1 text-amber-700">
                ✓ Señales de parto y signos de alarma
              </li>
              <li className="flex items-center gap-1 text-amber-700">
                ✓ Acompañamiento de papá en el parto
              </li>
              <li className="flex items-center gap-1 text-amber-700">
                ✓ Activación instantánea del carnet infantil
              </li>
            </ul>
          </div>

          <div className="card !p-5 border border-outline-variant/30 rounded-2xl bg-white hover:shadow-cloud transition-all">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center text-2xl mb-3 shadow-cloud-sm">
              🍼
            </div>
            <span className="pill-chip bg-secondary-container text-secondary text-[10px] font-bold mb-2">
              Etapa 3 · 0 a 24 Meses
            </span>
            <h3 className="font-display text-lg font-bold text-on-surface mb-2">
              Carnet de Salud Infantil
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-3">
              Curvas oficiales de crecimiento OMS (peso, talla y perímetro cefálico), esquema oficial de vacunación PAI de Colombia con recordatorios y bitácora pediátrica.
            </p>
            <ul className="text-[11px] text-on-surface space-y-1 font-medium">
              <li className="flex items-center gap-1 text-secondary">
                ✓ Percentiles y gráficas oficiales OMS
              </li>
              <li className="flex items-center gap-1 text-secondary">
                ✓ Esquema oficial de 20 vacunas PAI
              </li>
              <li className="flex items-center gap-1 text-secondary">
                ✓ Bitácora pediátrica continua
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECCIÓN DESTACADA: Planes y Suscripción Mi Bebé */}
      <section id="planes" className="mb-14 scroll-mt-24">
        <div className="card !bg-gradient-to-br from-white via-primary-container/15 to-secondary-container/15 !p-6 sm:!p-10 rounded-3xl border-2 border-primary/25 shadow-cloud">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="pill-chip bg-primary text-white font-bold text-xs uppercase tracking-wider mb-2 shadow-2xs">
              💎 Información de Suscripción
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              Planes Mensuales Claros y Transparentes
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Sin cobros automáticos ocultos a tarjetas. Eliges tu plan preferido, transfieres por Nequi o Daviplata y disfrutas de acceso continuo durante 30 días con respaldo total de tu historial.
            </p>
          </div>

          {/* Grilla de los 3 Planes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {EXPLORE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 flex flex-col justify-between border-2 transition-all ${
                  plan.popular
                    ? "border-primary shadow-cloud ring-2 ring-primary/20 scale-[1.02]"
                    : "border-outline-variant/30 hover:border-primary/40 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-lg font-bold text-on-surface">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="font-body text-xs text-on-surface-variant mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mb-5 pb-4 border-b border-outline-variant/20">
                    <span className="font-display text-3xl font-bold text-primary">
                      ${plan.priceFormatted}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {" "}COP / {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs font-body text-on-surface mb-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-secondary font-bold shrink-0">✓</span>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center ${
                      plan.popular
                        ? "bg-primary text-white hover:bg-primary/90 shadow-cloud-sm"
                        : "bg-surface-container text-on-surface hover:bg-primary-container/40"
                    }`}
                  >
                    <span>Activar por WhatsApp</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Garantías y Políticas de la Suscripción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-outline-variant/20 text-xs font-body">
            <div className="p-3.5 bg-white rounded-xl border border-outline-variant/20 flex flex-col gap-1 shadow-2xs">
              <span className="text-xl">📧</span>
              <strong className="text-on-surface">Alerta 1 Semana Antes</strong>
              <p className="text-on-surface-variant text-[11px] leading-tight">
                Te enviamos un correo electrónico preventivo exactamente 7 días antes del vencimiento para que renueves sin interrupción.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-outline-variant/20 flex flex-col gap-1 shadow-2xs">
              <span className="text-xl">🛡️</span>
              <strong className="text-on-surface">Datos Siempre Seguros</strong>
              <p className="text-on-surface-variant text-[11px] leading-tight">
                Tus ecografías, registros de salud y fotos permanecen respaldados y encriptados incluso si tu suscripción llega a vencer.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-outline-variant/20 flex flex-col gap-1 shadow-2xs">
              <span className="text-xl">🎁</span>
              <strong className="text-on-surface">Módulos 100% Gratis</strong>
              <p className="text-on-surface-variant text-[11px] leading-tight">
                Medicamentos, Registro de Síntomas y Guía de Desarrollo Fetal son 100% libres sin ningún costo para todas las mamás.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-outline-variant/20 flex flex-col gap-1 shadow-2xs">
              <span className="text-xl">💳</span>
              <strong className="text-on-surface">Daviplata o Nequi</strong>
              <p className="text-on-surface-variant text-[11px] leading-tight">
                Transfiere al <strong>3122031777</strong> (Llave: <strong>@DAVI3122031777</strong>) y activa al instante por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Lazos Familiares y Papá (QR Seguro con Caducidad de 15 min) */}
      <section id="familia" className="mb-14 scroll-mt-24">
        <div className="card !bg-white border border-outline-variant/30 !p-6 sm:!p-10 rounded-3xl shadow-cloud">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="pill-chip bg-teal-100 text-teal-800 font-bold text-xs uppercase tracking-wider mb-2">
                🧑‍🍼 Vinculación Segura Familiar
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
                Papá y Lazos Familiares con Códigos QR
              </h2>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-4">
                Diseñado para involucrar con total seguridad a tu pareja y familia, manteniendo la privacidad obstétrica bajo el control exclusivo de mamá:
              </p>

              <div className="space-y-2.5 text-xs font-body text-on-surface-variant">
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">🧑</span>
                  <p>
                    <strong>Vinculación de papá:</strong> No se permiten múltiples cuentas de papá en el mismo embarazo. Papá tiene acceso especial para ver y subir fotos al álbum, redactar en el diario íntimo y seguir el desarrollo del feto.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏱️</span>
                  <p>
                    <strong>Caducidad estricta de 15 minutos:</strong> Cada código QR y enlace vence a los 15 minutos exactos si no se ha conectado. Si mantienes abierta la pantalla, se refresca automáticamente cada 15 min para garantizar máxima seguridad.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">👨‍👩‍👧</span>
                  <p>
                    <strong>Familiares con nombres diferenciados:</strong> Abuelos y tíos se conectan con permisos de solo lectura. El sistema no permite dos familiares con el mismo nombre para evitar confusiones.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-surface-container/40 rounded-2xl border border-outline-variant/20 flex flex-col items-center text-center max-w-xs shrink-0 self-center">
              <span className="text-4xl mb-2">📱</span>
              <h4 className="font-display text-sm font-bold text-on-surface mb-1">
                Vinculación en 1 Toque
              </h4>
              <p className="font-body text-[11px] text-on-surface-variant leading-relaxed mb-3">
                Mamá genera el código QR desde su app y el familiar apunta la cámara de su teléfono para quedar conectado de inmediato.
              </p>
              <Link
                to="/crear-cuenta"
                className="btn-primary !py-2 !px-4 text-xs font-semibold w-full"
              >
                Probar en la app
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Explorador de Módulos con Pestañas Interactivas */}
      <section id="modulos" className="mb-14 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="pill-chip bg-primary-container text-primary font-bold text-xs uppercase tracking-wider mb-2">
              Explorador de Funciones
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              Módulos Disponibles en la Plataforma
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
              Explora en detalle las herramientas integradas en tu expediente prenatal y carnet postnatal.
            </p>
          </div>

          <span className="text-xs font-semibold text-primary bg-primary-container/30 px-3 py-1 rounded-full border border-primary/20 shrink-0">
            {filteredModules.length} módulos disponibles
          </span>
        </div>

        {/* Pestañas de Filtrado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`pill-chip transition-all text-xs font-semibold whitespace-nowrap cursor-pointer flex items-center gap-1.5 py-2 px-3.5 border ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-cloud-sm scale-[1.02]"
                    : "bg-white text-on-surface-variant border-outline-variant/30 hover:bg-surface-container"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grilla de Módulos Detallados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((item) => (
            <div
              key={item.id}
              className="card !p-5 border border-outline-variant/30 hover:border-primary/40 rounded-2xl bg-white hover:shadow-cloud transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-3xl p-2 rounded-xl bg-surface-container/60 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`pill-chip text-[10px] font-bold py-0.5 px-2.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-medium text-on-surface-variant">
                      {item.planRequired}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-base font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap gap-1.5">
                  {item.highlights.map((h, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-surface-container/70 text-on-surface-variant px-2 py-0.5 rounded-md font-medium"
                    >
                      • {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Guías Educativas con Acceso Libre */}
      <section id="guias" className="mb-14 scroll-mt-24">
        <div className="card !bg-gradient-to-r from-tertiary-container/30 via-white to-primary-container/20 !p-6 sm:!p-8 rounded-3xl border border-tertiary-container/40">
          <div className="max-w-2xl">
            <span className="pill-chip bg-tertiary-container text-tertiary font-bold text-xs uppercase tracking-wider mb-2">
              Contenido de Acceso Inmediato
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface mb-2">
              Explora nuestras Guías Médicas Gratuitas
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Puedes comenzar a leer nuestras recomendaciones clínicas ahora mismo sin necesidad de iniciar sesión ni crear una cuenta:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="cuidados-mama"
              className="card !p-5 bg-white border border-outline-variant/30 hover:border-primary/40 rounded-2xl hover:shadow-cloud transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl p-2.5 rounded-xl bg-pink-50 text-pink-700">
                  🌷
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Cuidados y Bienestar de Mamá
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Nutrición, ejercicios y signos de alarma en gestación.
                  </p>
                </div>
              </div>
              <span className="text-primary font-bold text-lg group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>

            <Link
              to="cuidados-bebe"
              className="card !p-5 bg-white border border-outline-variant/30 hover:border-primary/40 rounded-2xl hover:shadow-cloud transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  👶
                </span>
                <div>
                  <h4 className="font-display text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Desarrollo y Cuidados del Bebé
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Hitos por trimestre, lactancia y primeros cuidados.
                  </p>
                </div>
              </div>
              <span className="text-primary font-bold text-lg group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final con Botones */}
      <section className="card !bg-gradient-to-b from-white via-primary-container/20 to-primary-container/30 text-center !p-8 sm:!p-12 rounded-3xl border-2 border-primary/20 shadow-cloud">
        <span className="text-4xl block mb-3">❤️</span>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
          ¿Lista para comenzar tu viaje con Mi Bebé?
        </h3>
        <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-6 max-w-lg mx-auto leading-relaxed">
          Crea tu cuenta gratuita en segundos para guardar tus ecografías, recibir alarmas sonoras, registrar tus controles médicos y seguir de cerca cada momento del embarazo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Link
            to="/crear-cuenta"
            className="btn-primary !w-full sm:!w-auto !py-3.5 !px-8 text-sm sm:text-base font-bold rounded-full shadow-cloud flex items-center justify-center text-center active:scale-95 transition-all"
          >
            Crear mi cuenta gratis
          </Link>
          <Link
            to="/iniciar-sesion"
            className="inline-flex items-center justify-center text-center font-body text-sm font-semibold px-7 py-3.5 rounded-full border border-primary/40 text-primary bg-white hover:bg-primary-container/20 transition-all whitespace-nowrap active:scale-95 w-full sm:w-auto shadow-2xs"
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="text-[11px] text-on-surface-variant mt-4">
          Cumple con la normativa colombiana de protección de datos de salud (Ley 1581 de 2012).
        </p>
      </section>
    </>
  );
}
