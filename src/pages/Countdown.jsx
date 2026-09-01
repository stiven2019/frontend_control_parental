import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ProgressRing from '../components/ProgressRing';
import { LoadingState } from '../components/States';
import { api } from '../api/client';

export default function Countdown() {
  const [data, setData] = useState(null);

  useEffect(() => { api.getCountdown().then(setData); }, []);

  if (!data) return <AppLayout><LoadingState /></AppLayout>;

  const fpp = new Date(data.probableDeliveryDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      <header className="mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Cuenta regresiva para conocer a tu bebé ❤️</h1>
      </header>

      <section className="card flex flex-col items-center text-center">
        <ProgressRing percent={data.progressPercent} size={220}>
          <div className="flex flex-col items-center">
            <span className="font-display text-5xl font-semibold text-primary">{data.daysRemaining}</span>
            <span className="font-body text-xs font-semibold uppercase tracking-wide text-on-surface-variant">días</span>
          </div>
        </ProgressRing>

        <p className="font-body text-sm text-on-surface-variant mt-6">Fecha probable de parto</p>
        <p className="font-display text-xl font-semibold">{fpp}</p>

        <div className="flex gap-4 mt-6 w-full">
          <div className="flex-1 bg-secondary-container/60 rounded-md py-4">
            <p className="text-xs text-on-secondary-container">Semana</p>
            <p className="font-semibold text-on-secondary-container">{data.week}</p>
          </div>
          <div className="flex-1 bg-tertiary-container/60 rounded-md py-4">
            <p className="text-xs text-on-tertiary-container">{data.trimesterLabel}</p>
            <p className="font-semibold text-on-tertiary-container">{data.progressPercent}% del camino</p>
          </div>
        </div>
      </section>

      <p className="font-body text-xs text-outline text-center mt-6 max-w-xs mx-auto">
        Esta es una fecha probable de parto, no una fecha exacta garantizada.
      </p>
    </AppLayout>
  );
}
