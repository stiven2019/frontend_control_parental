import { Link, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { MomCare, BabyCare } from './Content';

export default function GuestExplore() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-container/50">
      <header className="px-5 md:px-10 py-6 flex items-center justify-between max-w-[1120px] mx-auto border-b border-outline-variant/20">
        <Link to="/" className="font-display text-xl font-semibold text-primary flex items-center gap-2">
          <span className="text-2xl">❤️</span> Mi Bebé
        </Link>
        <div className="flex gap-2">
          <Link to="/iniciar-sesion" className="btn-ghost text-xs">Iniciar sesión</Link>
          <Link to="/crear-cuenta" className="btn-primary text-xs">Crear cuenta gratis</Link>
        </div>
      </header>

      <div className="max-w-[1120px] mx-auto px-5 md:px-10 pb-24">
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
  return (
    <>
      {/* Hero Section */}
      <section className="mt-12 mb-16">
        <div className="card !bg-gradient-to-br from-primary-container to-secondary-container/30 !p-8 md:!p-12 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Acompaña tu embarazo con confianza
          </h1>
          <p className="font-body text-on-surface-variant mb-8 max-w-2xl mx-auto text-lg">
            Información médica actualizada, recordatorios personalizados y un espacio seguro para documentar cada momento de tu embarazo.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/crear-cuenta" className="btn-primary">Comenzar ahora</Link>
            <Link to="cuidados-mama" className="btn-secondary">Explorar guías</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-6">¿Qué puedes hacer?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            icon="📊"
            title="Seguimiento completo"
            description="Controla médicos, medicamentos, síntomas y hitos semanales del embarazo con precisión."
          />
          <FeatureCard
            icon="💬"
            title="Recordatorios inteligentes"
            description="Recibe recordatorios personalizados para controles, medicinas y cuidados importantes."
          />
          <FeatureCard
            icon="📸"
            title="Crea memorias"
            description="Guarda fotos, ecografías y anotaciones privadas en un álbum seguro de tu embarazo."
          />
          <FeatureCard
            icon="📚"
            title="Información semana a semana"
            description="Lee sobre el desarrollo del bebé y cambios maternos en cada etapa del embarazo."
          />
          <FeatureCard
            icon="👨‍👩‍👧"
            title="Involucra a tu pareja"
            description="Comparte información y fotos con tu pareja en un perfil personalizado."
          />
          <FeatureCard
            icon="🔒"
            title="Totalmente privado"
            description="Tu información médica personal es 100% privada y segura."
          />
        </div>
      </section>

      {/* Content Preview */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-6">Explora contenido educativo</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ContentPreviewCard
            icon="🌷"
            title="Cuidados para mamá"
            description="Nutrición, ejercicio, salud mental y cambios esperados durante el embarazo."
            to="cuidados-mama"
          />
          <ContentPreviewCard
            icon="👶"
            title="Desarrollo del bebé"
            description="Aprende semana a semana cómo se desarrolla tu bebé y qué esperar en cada trimestre."
            to="cuidados-bebe"
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-6 text-center">Lo que dicen las mamás</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <TestimonialCard
            quote="Finalmente un lugar donde guardar toda mi información médica organizada y segura."
            author="María, 28 semanas"
          />
          <TestimonialCard
            quote="Me encanta poder ver el desarrollo del bebé semana a semana. Muy informativo y tranquilizador."
            author="Juanita, 15 semanas"
          />
          <TestimonialCard
            quote="Los recordatorios me ayudaron a no olvidar nunca un medicamento. Muy práctico."
            author="Sofía, posparto"
          />
        </div>
      </section>

      {/* CTA Final */}
      <section className="card !bg-gradient-to-r from-tertiary-container to-tertiary-container/50 text-center !p-12">
        <h3 className="font-display text-2xl font-bold mb-4">¿Lista para comenzar?</h3>
        <p className="font-body text-on-surface-variant mb-6">
          Crea tu cuenta en segundos y accede a todas las funciones de Mi Bebé.
        </p>
        <Link to="/crear-cuenta" className="btn-primary inline-block">
          Crear mi cuenta
        </Link>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card hover:shadow-cloud transition-shadow cursor-default">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-display font-semibold mb-2">{title}</h3>
      <p className="font-body text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}

function ContentPreviewCard({ icon, title, description, to }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link
      to={to}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`card flex flex-col gap-4 cursor-pointer transition-all transform ${
        isHovered ? 'shadow-cloud scale-[1.02]' : ''
      }`}
    >
      <div className="text-5xl">{icon}</div>
      <div>
        <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
        <p className="font-body text-sm text-on-surface-variant mb-4">{description}</p>
      </div>
      <div className="pt-4 border-t border-outline-variant">
        <span className="font-body text-sm font-semibold text-primary flex items-center gap-1">
          Explorar →
        </span>
      </div>
    </Link>
  );
}

function TestimonialCard({ quote, author }) {
  return (
    <div className="card bg-surface-container">
      <div className="mb-3 text-xl">⭐⭐⭐⭐⭐</div>
      <p className="font-body text-sm mb-4 italic text-on-surface-variant">"{quote}"</p>
      <p className="font-body text-xs font-semibold text-primary">{author}</p>
    </div>
  );
}
