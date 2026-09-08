import { useState, useEffect } from 'react';

export default function BreathingExerciseModal({ isOpen, onClose }) {
  const [phase, setPhase] = useState('inhale'); // 'inhale' (4s), 'hold' (4s), 'exhale' (6s)
  const [counter, setCounter] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setPhase('inhale');
      setCounter(4);
      setCyclesCompleted(0);
      setIsRunning(true);
      return;
    }

    if (!isRunning) return;

    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev > 1) return prev - 1;

        // Transición de fases
        if (phase === 'inhale') {
          setPhase('hold');
          return 4;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return 6;
        } else {
          setPhase('inhale');
          setCyclesCompleted((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isRunning, phase]);

  if (!isOpen) return null;

  const phaseConfig = {
    inhale: {
      label: 'Inhala suavemente',
      sub: 'Llena tu abdomen por la nariz',
      color: 'bg-primary-container text-on-primary-container border-primary/30',
      scale: 'scale-125',
      instruction: 'Siente cómo se expande tu vientre con aire puro para ti y tu bebé...',
      icon: '🌸',
    },
    hold: {
      label: 'Sostén con calma',
      sub: 'Mantén la quietud interior',
      color: 'bg-secondary-container text-on-secondary-container border-secondary/30',
      scale: 'scale-110',
      instruction: 'Disfruta este instante de quietud y serenidad...',
      icon: '✨',
    },
    exhale: {
      label: 'Exhala muy despacio',
      sub: 'Suelta el aire por la boca',
      color: 'bg-tertiary-container text-on-tertiary-container border-tertiary/30',
      scale: 'scale-90',
      instruction: 'Libera toda la tensión de tus hombros y tu mente...',
      icon: '🍃',
    },
  };

  const current = phaseConfig[phase];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
    >
      <div
        className="relative w-full max-w-md bg-surface rounded-3xl p-6 sm:p-8 shadow-2xl border border-primary/20 flex flex-col items-center text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors"
          aria-label="Cerrar ejercicio"
        >
          ✕
        </button>

        <span className="pill-chip bg-primary-container text-on-primary-container text-xs mb-3">
          Respiración Materna 4-4-6
        </span>

        <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface mb-1">
          Momento de Calma y Conexión
        </h2>
        <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-8 max-w-xs">
          Regula tu ritmo cardíaco y oxigena profundamente a tu bebé en cada ciclo.
        </p>

        {/* Círculo de Respiración Animado */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          {/* Ondas exteriores */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed border-primary/20 transition-transform duration-1000 ${
              phase === 'inhale' ? 'scale-110 opacity-70' : 'scale-95 opacity-30'
            }`}
          />

          {/* Esfera central que respira */}
          <div
            className={`w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 shadow-cloud transition-all ease-in-out duration-1000 ${current.color} ${current.scale}`}
          >
            <span className="text-3xl mb-1">{current.icon}</span>
            <span className="font-display text-4xl font-bold">{counter}</span>
            <span className="font-body text-xs font-semibold tracking-wide uppercase mt-1">
              {current.label}
            </span>
          </div>
        </div>

        {/* Instrucción de la fase */}
        <div className="min-h-[52px] flex items-center justify-center mt-4 mb-6">
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-xs italic leading-relaxed">
            "{current.instruction}"
          </p>
        </div>

        {/* Contador de ciclos y controles */}
        <div className="flex items-center justify-between w-full pt-4 border-t border-surface-container text-xs text-on-surface-variant">
          <span>Ciclos completados: <strong className="text-primary">{cyclesCompleted}</strong></span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="btn-ghost !w-auto !py-1.5 !px-3 font-semibold text-xs"
            >
              {isRunning ? 'Pausar ⏸' : 'Reanudar ▶'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary !w-auto !py-1.5 !px-4 text-xs font-semibold"
            >
              Terminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
