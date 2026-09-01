import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const STEPS = ['Mamá', 'Bebé', 'Papá', 'Embarazo'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [babyName, setBabyName] = useState('');
  const [babySex, setBabySex] = useState('desconocido');
  const [partnerName, setPartnerName] = useState('');
  const [lmp, setLmp] = useState('');
  const [conception, setConception] = useState('');

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    setError('');
    if (!lmp) {
      setError('La fecha de última menstruación es necesaria para calcular tu semana de embarazo.');
      return;
    }
    setLoading(true);
    try {
      await api.setupPregnancy({
        lastMenstrualPeriod: lmp,
        estimatedConceptionDate: conception || null,
        baby: { provisionalName: babyName || null, sex: babySex },
        partner: { name: partnerName || null },
      });
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-10">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-highest'}`} />
          ))}
        </div>

        {step === 0 && (
          <StepBlock title="Cuéntanos un poco sobre mamá" emoji="🤰">
            <p className="font-body text-sm text-on-surface-variant">
              Ya tenemos tus datos básicos de tu registro. En el siguiente paso conozcamos al pequeño protagonista.
            </p>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock title="Ahora conozcamos al pequeño protagonista" emoji="👶">
            <div className="flex flex-col gap-4">
              <div>
                <label className="field-label">Nombre provisional del bebé (opcional)</label>
                <input className="input-field" value={babyName} onChange={(e) => setBabyName(e.target.value)} placeholder="Ej. Frijolito" />
              </div>
              <div>
                <label className="field-label">Sexo (si ya se conoce)</label>
                <select className="input-field" value={babySex} onChange={(e) => setBabySex(e.target.value)}>
                  <option value="desconocido">Aún no lo sabemos</option>
                  <option value="nina">Niña</option>
                  <option value="nino">Niño</option>
                  <option value="sorpresa">¡Será sorpresa!</option>
                </select>
              </div>
            </div>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock title="También queremos conocer a papá" emoji="🧑">
            <label className="field-label">Nombre del papá (opcional)</label>
            <input className="input-field" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Nombre" />
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock title="Cuéntanos sobre tu embarazo" emoji="📅">
            <div className="flex flex-col gap-4">
              <div>
                <label className="field-label">Fecha de última menstruación (FUM)</label>
                <input type="date" required className="input-field" value={lmp} onChange={(e) => setLmp(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Fecha estimada de concepción (opcional)</label>
                <input type="date" className="input-field" value={conception} onChange={(e) => setConception(e.target.value)} />
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Con esta información calcularemos tu semana actual, trimestre y fecha probable de parto.
              </p>
            </div>
          </StepBlock>
        )}

        {error && <p className="text-sm text-error font-body mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button className="btn-secondary" onClick={back}>
              Atrás
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={next}>
              Continuar
            </button>
          ) : (
            <button className="btn-primary" disabled={loading} onClick={finish}>
              {loading ? 'Guardando...' : 'Comenzar mi seguimiento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBlock({ title, emoji, children }) {
  return (
    <div className="flex-1">
      <span className="text-4xl">{emoji}</span>
      <h2 className="font-display text-2xl font-semibold mt-4 mb-6">{title}</h2>
      {children}
    </div>
  );
}
