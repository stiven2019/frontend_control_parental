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
    badge: "Tratamientos",
    badgeColor: "bg-amber-100 text-amber-800",
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
    id: "alarmas",
    category: "gestacion",
    icon: "⏰",
    title: "Alarmas Sonoras y Recordatorios Inteligentes",
    badge: "Notificaciones Push",
    badgeColor: "bg-rose-100 text-rose-800",
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
    id: "diario_sintomas",
    category: "bienestar",
    icon: "📔",
    title: "Diario Personal y Registro de Síntomas",
    badge: "Autocuidado",
    badgeColor: "bg-purple-100 text-purple-800",
    description:
      "Monitorea síntomas físicos diarios (náuseas, cansancio, contracciones, movimientos fetales) para mostrárselos a tu médico. Escribe reflexiones, pensamientos y cartas íntimas para tu bebé.",
    highlights: [
      "Seguimiento de síntomas",
      "Movimientos fetales",
      "Diario emocional",
      "Cartas para el bebé",
    ],
  },
  {
    id: "bienestar_emocional",
    category: "bienestar",
    icon: "💖",
    title: "Test de Bienestar Emocional Perinatal",
    badge: "Salud Mental",
    badgeColor: "bg-red-100 text-red-800",
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
    icon: "👨‍👩‍👧",
    title: "Espacio para la Pareja y Acompañante",
    badge: "En Familia",
    badgeColor: "bg-teal-100 text-teal-800",
    description:
      "Involucra activamente a tu pareja o red de apoyo en el embarazo. Perfil personalizado con consejos para el acompañante, preparación conjunta para el parto y participación en las memorias del bebé.",
    highlights: [
      "Perfil del acompañante",
      "Preparación para el parto",
      "Notas compartidas",
      "Apoyo integral",
    ],
  },
  {
    id: "guias_educativas",
    category: "familia",
    icon: "📚",
    title: "Biblioteca Médica y Guías Educativas",
    badge: "Educación Validada",
    badgeColor: "bg-cyan-100 text-cyan-800",
    description:
      "Artículos verificados sobre nutrición materna, ejercicios recomendados, signos de alarma obstétrica (cuándo acudir a urgencias), cuidados del recién nacido, lactancia y primeros auxilios.",
    highlights: [
      "Nutrición y alimentación",
      "Signos de alarma de urgencias",
      "Cuidados del recién nacido",
      "Lactancia materna",
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

export default function GuestExplore() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-surface-container/20 to-surface">
      {/* Header Fijo con Letras de Botones Perfectamente Centradas */}
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

          {/* Botones de Inicio de Sesión y Crear Cuenta con Letras Centradas */}
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

  return (
    <>
      {/* Hero Principal Explicativo */}
      <section className="my-6 sm:my-10 animate-fade-in">
        <div className="card !bg-gradient-to-br from-primary-container/70 via-white to-secondary-container/30 !p-6 sm:!p-12 text-center rounded-3xl border-2 border-primary/20 shadow-cloud">
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-on-surface mb-4 leading-tight max-w-3xl mx-auto">
            Todo lo que puedes hacer dentro de{" "}
            <span className="text-primary">Mi Bebé</span>
          </h1>

          <p className="font-body text-on-surface-variant mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Un acompañamiento clínico y familiar completo: desde tu primera
            semana de gestación hasta el carnet oficial de crecimiento del bebé
            nacido. Conoce cada una de las herramientas diseñadas para darte
            tranquilidad.
          </p>

          {/* Botones de Acción con Textos Centrados */}
          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              to="/crear-cuenta"
              className="btn-primary !w-full sm:!w-auto !py-3 !px-7 font-bold text-sm sm:text-base rounded-full shadow-cloud flex items-center justify-center text-center active:scale-95 transition-all"
            >
              <span>✨</span>
              <span className="mx-1">Crear mi cuenta gratis</span>
            </Link>
            <Link
              to="/iniciar-sesion"
              className="btn-secondary !w-full sm:!w-auto !py-3 !px-7 font-bold text-sm sm:text-base rounded-full border border-primary/30 flex items-center justify-center text-center active:scale-95 transition-all"
            >
              <span>🔑</span>
              <span className="mx-1">Iniciar sesión</span>
            </Link>
          </div> */}

          {/* Highlights en Píldoras */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-on-surface-variant">
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>🩺</span> 12 Módulos clínicos
            </span>
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>📊</span> Curvas OMS y Vacunas PAI
            </span>
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>📁</span> Visor de PDFs y Ecografías
            </span>
            <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-2xs">
              <span>⏰</span> Alarmas con sonido y Web Push
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
            ¿Cómo te apoya la aplicación en cada etapa?
          </h2>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto mt-2">
            La plataforma evoluciona contigo: te brinda herramientas obstétricas
            durante el embarazo y se transforma en un carnet pediátrico cuando
            nace tu bebé.
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
              Monitoreo del crecimiento del feto semana a semana, controles
              médicos, registro de presión arterial, altura uterina, síntomas
              físicos y tomas de vitaminas prenatales.
            </p>
            <ul className="text-[11px] text-on-surface space-y-1 font-medium">
              <li className="flex items-center gap-1 text-primary">
                ✓ Desarrollo fetal anatómico
              </li>
              <li className="flex items-center gap-1 text-primary">
                ✓ Alarmas de suplementos
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
              Preparación para el parto, guías sobre la maleta de maternidad,
              signos de alarma obstétrica y botón de confirmación de nacimiento
              para activar el módulo infantil.
            </p>
            <ul className="text-[11px] text-on-surface space-y-1 font-medium">
              <li className="flex items-center gap-1 text-amber-700">
                ✓ Señales de parto y urgencias
              </li>
              <li className="flex items-center gap-1 text-amber-700">
                ✓ Involucramiento de la pareja
              </li>
              <li className="flex items-center gap-1 text-amber-700">
                ✓ Activación inmediata del carnet
              </li>
            </ul>
          </div>

          <div className="card !p-5 border border-outline-variant/30 rounded-2xl bg-white hover:shadow-cloud transition-all">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center text-2xl mb-3 shadow-cloud-sm">
              🍼
            </div>
            <span className="pill-chip bg-secondary-container text-secondary text-[10px] font-bold mb-2">
              Etapa 3 · 0 a 5 Años
            </span>
            <h3 className="font-display text-lg font-bold text-on-surface mb-2">
              Carnet de Salud Infantil
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-3">
              Curvas de crecimiento de la OMS (peso, talla y perímetro
              cefálico), esquema oficial de vacunación PAI con alertas y
              registro de visitas al pediatra.
            </p>
            <ul className="text-[11px] text-on-surface space-y-1 font-medium">
              <li className="flex items-center gap-1 text-secondary">
                ✓ Percentiles oficiales OMS
              </li>
              <li className="flex items-center gap-1 text-secondary">
                ✓ Esquema oficial de vacunas PAI
              </li>
              <li className="flex items-center gap-1 text-secondary">
                ✓ Seguimiento pediátrico continuo
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Explorador de Módulos con Pestañas Interactivas */}
      <section className="mb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="pill-chip bg-primary-container text-primary font-bold text-xs uppercase tracking-wider mb-2">
              Módulos Disponibles
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              ¿Qué puedes hacer dentro de la plataforma?
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
              Explora las funciones reales integradas en tu expediente prenatal
              y postnatal.
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
                  <span
                    className={`pill-chip text-[10px] font-bold py-0.5 px-2.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
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
      <section className="mb-14">
        <div className="card !bg-gradient-to-r from-tertiary-container/30 via-white to-primary-container/20 !p-6 sm:!p-8 rounded-3xl border border-tertiary-container/40">
          <div className="max-w-2xl">
            <span className="pill-chip bg-tertiary-container text-tertiary font-bold text-xs uppercase tracking-wider mb-2">
              Contenido de Acceso Inmediato
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface mb-2">
              Explora nuestras Guías Médicas Gratuitas
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Puedes comenzar a leer nuestras recomendaciones clínicas ahora
              mismo sin necesidad de iniciar sesión ni crear una cuenta:
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

      {/* CTA Final con Botones de Inicio de Sesión y Registro con Letras Centradas */}
      <section className="card !bg-gradient-to-b from-white via-primary-container/20 to-primary-container/30 text-center !p-8 sm:!p-12 rounded-3xl border-2 border-primary/20 shadow-cloud">
        <span className="text-4xl block mb-3">❤️</span>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
          ¿Lista para comenzar tu viaje con Mi Bebé?
        </h3>
        <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-6 max-w-lg mx-auto leading-relaxed">
          Crea tu cuenta gratuita en segundos para guardar tus ecografías,
          recibir alarmas sonoras, registrar tus controles médicos y seguir de
          cerca cada momento del embarazo.
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
          Cumple con la normativa colombiana de protección de datos de salud
          (Ley 1581 de 2012).
        </p>
      </section>
    </>
  );
}
