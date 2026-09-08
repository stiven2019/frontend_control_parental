import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import BreathingExerciseModal from '../components/BreathingExerciseModal';
import {
  EMOTIONAL_QUESTIONS,
  EMOTIONAL_RANGES,
  ASRT_TIPS_CATEGORIES,
  ASSERTIVE_TIPS,
  COLOMBIA_HELPLINES,
} from '../data/emotionalTestData';
import { api } from '../api/client';

const STORAGE_KEY = 'mibebe_emotional_history';

export default function EmotionalWellbeingPage() {
  const [activeTab, setActiveTab] = useState('test'); // 'test' | 'tips' | 'helpline' | 'historial'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchTip, setSearchTip] = useState('');
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cargar datos de embarazo e historial local
  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(() => {});
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSelectOption = (questionId, option) => {
    const nextAnswers = { ...answers, [questionId]: option };
    setAnswers(nextAnswers);

    // Avanzar automáticamente a la siguiente pregunta con suave retraso
    if (currentStep < EMOTIONAL_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 250);
    }
  };

  const calculateResults = () => {
    let totalScore = 0;
    EMOTIONAL_QUESTIONS.forEach((q) => {
      const selected = answers[q.id];
      if (selected) {
        totalScore += selected.points;
      }
    });

    const range =
      EMOTIONAL_RANGES.find((r) => totalScore >= r.min && totalScore <= r.max) ||
      EMOTIONAL_RANGES[EMOTIONAL_RANGES.length - 1];

    const resultObj = {
      score: totalScore,
      maxScore: 30,
      range,
      date: new Date().toISOString().split('T')[0],
      displayDate: new Date().toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      week: dashboard?.status?.week || null,
      answersSummary: answers,
    };

    setTestResult(resultObj);

    // Guardar automáticamente en historial local
    try {
      const updatedHistory = [resultObj, ...history.filter((h) => h.date !== resultObj.date || h.week !== resultObj.week)].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const resetTest = () => {
    setAnswers({});
    setCurrentStep(0);
    setTestResult(null);
  };

  const totalAnswered = Object.keys(answers).length;
  const progressPercent = Math.round((totalAnswered / EMOTIONAL_QUESTIONS.length) * 100);

  // Filtrado de Tips
  const filteredTips = ASSERTIVE_TIPS.filter((t) => {
    const matchCat = selectedCategory === 'todos' || t.category === selectedCategory;
    const matchSearch =
      !searchTip ||
      t.title.toLowerCase().includes(searchTip.toLowerCase()) ||
      t.body.toLowerCase().includes(searchTip.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchTip.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AppLayout>
      {/* Cabecera Principal */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-chip bg-primary-container text-on-primary-container text-xs font-semibold">
              Salud Mental Perinatal
            </span>
            {dashboard?.status?.week && (
              <span className="pill-chip bg-surface-container text-on-surface-variant text-xs">
                Semana {dashboard.status.week} de gestación
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-2">
            <span>🌸</span>
            <span>Bienestar Emocional de Mamá</span>
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl leading-relaxed">
            Tu salud emocional es tan valiosa como tus controles físicos. Evalúa cómo te sientes hoy y accede a pautas y herramientas asertivas para cuidar tu mente.
          </p>
        </div>

        {/* Botón rápido de respiración */}
        <button
          onClick={() => setShowBreathingModal(true)}
          className="btn-secondary !w-auto !py-2.5 !px-5 text-xs font-semibold flex items-center gap-2 shrink-0 self-start md:self-auto shadow-cloud-sm hover:scale-[1.02] transition-transform"
        >
          <span>🌬️</span>
          <span>Pausa de Respiración (2 min)</span>
        </button>
      </header>

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
        <button
          onClick={() => setActiveTab('test')}
          className={`pill-chip px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'test'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          📝 Test Emocional {totalAnswered > 0 && !testResult ? `(${totalAnswered}/10)` : ''}
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`pill-chip px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'tips'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          💡 Tips Asertivos y Consejos
        </button>

        <button
          onClick={() => setActiveTab('helpline')}
          className={`pill-chip px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'helpline'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
          }`}
        >
          🇨🇴 Líneas de Apoyo Gratuitas
        </button>

        {history.length > 0 && (
          <button
            onClick={() => setActiveTab('historial')}
            className={`pill-chip px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'historial'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
            }`}
          >
            📈 Mi Historial ({history.length})
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* PESTAÑA 1: TEST EMOCIONAL                                     */}
      {/* ============================================================ */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          {!testResult ? (
            <div className="card max-w-2xl mx-auto flex flex-col gap-6">
              {/* Barra de Progreso */}
              <div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant mb-2 font-body font-medium">
                  <span>Pregunta {currentStep + 1} de {EMOTIONAL_QUESTIONS.length}</span>
                  <span className="font-semibold text-primary">{progressPercent}% completado</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Pregunta Activa */}
              {(() => {
                const q = EMOTIONAL_QUESTIONS[currentStep];
                const selected = answers[q.id];

                return (
                  <div key={q.id} className="space-y-5 animate-fadeIn">
                    <div>
                      <span className="pill-chip bg-primary-container/60 text-on-primary-container text-[11px] mb-2 font-semibold">
                        {q.dimension}
                      </span>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface mt-1 leading-snug">
                        {q.question}
                      </h2>
                      <p className="font-body text-xs text-on-surface-variant mt-1">
                        Elige la opción que mejor describa cómo te has sentido en los últimos 7 días:
                      </p>
                    </div>

                    {/* Opciones de respuesta */}
                    <div className="flex flex-col gap-2.5">
                      {q.options.map((opt, idx) => {
                        const isChosen = selected?.points === opt.points;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                              isChosen
                                ? 'bg-primary-container/40 border-primary shadow-cloud-sm scale-[1.01]'
                                : 'bg-surface-low border-surface-container hover:border-outline-variant/60 hover:bg-surface-container'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl shrink-0">{opt.icon}</span>
                              <span className="font-body text-sm text-on-surface font-medium leading-snug">
                                {opt.text}
                              </span>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isChosen
                                  ? 'border-primary bg-primary text-on-primary text-xs'
                                  : 'border-outline-variant'
                              }`}
                            >
                              {isChosen && '✓'}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navegación del Test */}
                    <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                        disabled={currentStep === 0}
                        className="btn-ghost !w-auto !py-2 !px-4 text-xs font-semibold disabled:opacity-30"
                      >
                        ← Anterior
                      </button>

                      {currentStep < EMOTIONAL_QUESTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentStep((s) => Math.min(EMOTIONAL_QUESTIONS.length - 1, s + 1))}
                          disabled={!selected}
                          className="btn-secondary !w-auto !py-2 !px-5 text-xs font-semibold disabled:opacity-40"
                        >
                          Siguiente →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={calculateResults}
                          disabled={totalAnswered < EMOTIONAL_QUESTIONS.length}
                          className="btn-primary !w-auto !py-2.5 !px-6 text-xs sm:text-sm font-semibold disabled:opacity-40 shadow-cloud-sm"
                        >
                          Ver Mis Resultados 🌸
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Pantalla de Resultados */
            <div className="card max-w-2xl mx-auto space-y-6 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-surface-container pb-4">
                <div>
                  <span className="font-body text-xs text-on-surface-variant">Resultado de tu evaluación</span>
                  <p className="font-body text-xs text-outline">{testResult.displayDate} {testResult.week ? `· Semana ${testResult.week}` : ''}</p>
                </div>
                <span className={`pill-chip ${testResult.range.badgeColor} text-xs font-bold`}>
                  {testResult.range.badge}
                </span>
              </div>

              {/* Medidor de Puntaje */}
              <div className="bg-surface-low rounded-2xl p-5 border border-surface-container flex flex-col items-center text-center">
                <span className="text-4xl mb-2">
                  {testResult.range.level === 'optimo' ? '🌿' : testResult.range.level === 'moderado' ? '🌤️' : '💜'}
                </span>
                <span className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Puntaje de Bienestar Emocional
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-display text-4xl font-bold text-primary">{testResult.score}</span>
                  <span className="font-body text-sm text-outline">/ 30 puntos</span>
                </div>

                {/* Barra segmentada */}
                <div className="w-full max-w-xs mt-3">
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden flex">
                    <div className="w-1/3 bg-secondary/80" title="0-8 Favorable" />
                    <div className="w-1/3 bg-tertiary/70" title="9-14 Moderado" />
                    <div className="w-1/3 bg-error/70" title="15-30 Vulnerable" />
                  </div>
                  <div className="flex justify-between text-[10px] text-outline mt-1 font-body">
                    <span>Equilibrio (0-8)</span>
                    <span>Cansancio (9-14)</span>
                    <span>Alerta (15+)</span>
                  </div>
                </div>
              </div>

              {/* Diagnóstico Empático y Resumen */}
              <div className={`p-5 rounded-2xl border-2 ${testResult.range.color} space-y-3`}>
                <h3 className="font-display text-lg font-bold">
                  {testResult.range.title}
                </h3>
                <p className="font-body text-sm font-medium leading-relaxed">
                  {testResult.range.summary}
                </p>
                <p className="font-body text-xs leading-relaxed text-on-surface-variant">
                  {testResult.range.detail}
                </p>

                <div className="pt-2 border-t border-current/10">
                  <span className="font-body text-xs font-bold uppercase tracking-wider block mb-1">
                    Paso Recomendado:
                  </span>
                  <p className="font-body text-xs leading-relaxed">
                    {testResult.range.primaryRecommendation}
                  </p>
                </div>
              </div>

              {/* Mensaje especial si requiere apoyo profesional o líneas de ayuda */}
              {testResult.range.showHelpline && (
                <div className="p-4 rounded-xl bg-error-container/30 border border-error/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-body font-bold text-sm text-error flex items-center gap-1.5">
                      <span>💜</span> Canales Gratuitos de Escucha en Colombia
                    </p>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      Puedes marcar gratis desde tu celular a la Línea 106 o Línea Púrpura (018000 112 137).
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('helpline')}
                    className="btn-primary bg-error text-on-error !w-auto !py-2 !px-4 text-xs shrink-0"
                  >
                    Ver Líneas Directas
                  </button>
                </div>
              )}

              {/* Acciones del Resultado */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('tips')}
                  className="btn-primary flex-1 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>💡</span>
                  <span>Explorar Tips para Sentirte Mejor</span>
                </button>
                <button
                  onClick={resetTest}
                  className="btn-secondary flex-1 text-sm font-semibold"
                >
                  Rehacer el Test
                </button>
              </div>

              {savedSuccess && (
                <p className="text-center font-body text-xs text-secondary font-semibold animate-fadeIn">
                  ✓ Tu evaluación ha sido guardada en tu bitácora personal.
                </p>
              )}

              <p className="font-body text-[11px] text-outline text-center">
                * Este test es una herramienta de orientación y tamizaje de bienestar perinatal. No constituye un diagnóstico clínico formal. Ante cualquier duda, consulta con tu médico u obstetra.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 2: TIPS ASERTIVOS Y GUÍAS DE AUTOCUIDADO               */}
      {/* ============================================================ */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          {/* Barra de Filtros y Búsqueda */}
          <div className="card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {ASRT_TIPS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`pill-chip text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Buscador */}
            <div className="w-full md:w-56 shrink-0">
              <input
                type="text"
                placeholder="Buscar consejo o tema..."
                value={searchTip}
                onChange={(e) => setSearchTip(e.target.value)}
                className="input-field !py-2 !px-3 text-xs"
              />
            </div>
          </div>

          {/* Lista de Tips Asertivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTips.map((tip) => (
              <div
                key={tip.id}
                className="card flex flex-col justify-between border border-surface-container hover:shadow-cloud transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="w-10 h-10 rounded-full bg-primary-container/70 flex items-center justify-center text-xl shrink-0">
                      {tip.icon}
                    </span>
                    <span className="pill-chip bg-surface-container text-on-surface-variant text-[10px] uppercase font-semibold">
                      {ASRT_TIPS_CATEGORIES.find((c) => c.id === tip.category)?.name.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-on-surface mb-1">
                    {tip.title}
                  </h3>
                  <p className="font-body text-xs font-semibold text-primary mb-3">
                    {tip.subtitle}
                  </p>

                  <div className="space-y-2 text-xs text-on-surface-variant font-body whitespace-pre-line leading-relaxed">
                    {tip.body.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((chunk, cIdx) => {
                          if (chunk.startsWith('**') && chunk.endsWith('**')) {
                            return <strong key={cIdx} className="text-on-surface font-semibold">{chunk.slice(2, -2)}</strong>;
                          }
                          if (chunk.startsWith('*') && chunk.endsWith('*')) {
                            return <em key={cIdx} className="text-primary font-medium">{chunk.slice(1, -1)}</em>;
                          }
                          return chunk;
                        })}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between gap-2">
                  <span className="font-body text-[10px] text-outline truncate max-w-[200px]" title={tip.evidence}>
                    📚 {tip.evidence}
                  </span>

                  {tip.hasInteractiveAction === 'breathing' && (
                    <button
                      onClick={() => setShowBreathingModal(true)}
                      className="btn-secondary !w-auto !py-1.5 !px-3 text-xs font-semibold shrink-0"
                    >
                      Probar Ejercicio
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTips.length === 0 && (
            <div className="card text-center py-12 text-on-surface-variant">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="font-body text-sm font-semibold">No se encontraron tips con ese criterio</p>
              <button
                onClick={() => { setSelectedCategory('todos'); setSearchTip(''); }}
                className="btn-ghost !w-auto !py-2 !px-4 text-xs font-semibold mt-2"
              >
                Restablecer filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 3: LÍNEAS DE APOYO PSICOSOCIAL (COLOMBIA)             */}
      {/* ============================================================ */}
      {activeTab === 'helpline' && (
        <div className="space-y-6">
          <div className="card bg-primary-container/20 border border-primary/20">
            <h2 className="font-display text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
              <span>🇨🇴</span>
              <span>Canales Oficiales y Gratuitos de Salud Mental en Colombia</span>
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              En Colombia cuentas con líneas gratuitas y confidenciales atendidas por psicólogos y profesionales de la salud. Si te sientes abrumada, triste o necesitas desahogarte sin ser juzgada, no dudes en llamar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOMBIA_HELPLINES.map((line, idx) => (
              <div key={idx} className="card flex flex-col justify-between gap-4 border border-surface-container">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-2xl">{line.icon}</span>
                    <span className="pill-chip bg-surface-container text-on-surface-variant text-[11px] font-semibold">
                      {line.type}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-on-surface">
                    {line.name}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                    {line.description}
                  </p>
                  <p className="font-body text-sm font-bold text-primary mt-2">
                    {line.phone}
                  </p>
                </div>

                <a
                  href={line.callAction}
                  className="btn-primary !py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-2"
                >
                  <span>📞</span>
                  <span>Llamar ahora</span>
                </a>
              </div>
            ))}
          </div>

          <div className="card !p-4 bg-surface-container/60 border border-outline-variant/30 text-xs text-on-surface-variant space-y-1">
            <p className="font-semibold text-on-surface">ℹ️ Derecho a la atención en salud mental materna:</p>
            <p>
              Bajo la Resolución 3280 de 2018 del Ministerio de Salud de Colombia, todas las EPS e IPS del país tienen la obligación de brindar valoración y tamizaje de salud mental durante el embarazo y postparto como parte de la Ruta de Atención Materno Perinatal.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 4: HISTORIAL DE EVALUACIONES                           */}
      {/* ============================================================ */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-on-surface">
              Evolución de tu Estado de Ánimo
            </h2>
            <button
              onClick={() => {
                if (window.confirm('¿Deseas reiniciar tu historial de pruebas emocionales?')) {
                  localStorage.removeItem(STORAGE_KEY);
                  setHistory([]);
                }
              }}
              className="text-xs text-outline hover:text-error transition-colors"
            >
              Borrar historial
            </button>
          </div>

          <div className="space-y-3">
            {history.map((item, idx) => (
              <div key={idx} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-surface-container">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">
                    {item.range.level === 'optimo' ? '🟢' : item.range.level === 'moderado' ? '🟡' : '🔴'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body text-sm font-bold text-on-surface">
                        {item.range.title}
                      </span>
                      {item.week && (
                        <span className="pill-chip bg-surface-container text-on-surface-variant text-[11px]">
                          Semana {item.week}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      Puntaje: <strong>{item.score} / 30</strong> · Realizado el {item.displayDate || item.date}
                    </p>
                    <p className="font-body text-xs text-outline mt-1 line-clamp-1">
                      {item.range.summary}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTestResult(item);
                    setActiveTab('test');
                  }}
                  className="btn-ghost !w-auto !py-1.5 !px-3 text-xs font-semibold shrink-0"
                >
                  Ver Detalle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Interactivo de Respiración */}
      <BreathingExerciseModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
    </AppLayout>
  );
}
