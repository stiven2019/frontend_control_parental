import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscriptionModal from './SubscriptionModal';
import AppLayout from './AppLayout';
import ModuleIcon from './ModuleIcons';

export const FREE_MODULES = [
  'medicamentos',
  'sintomas',
  'guia_desarrollo',
  'guia-desarrollo',
  'papa',
];

export function hasModuleAccess(user, moduleKey) {
  // Módulos 100% gratuitos para cualquier usuario sin suscripción
  if (FREE_MODULES.includes(moduleKey)) return true;

  if (!user) return false;

  // Sesion vinculada por QR (papa/familia): solo lo que el servidor desbloquea para su rol
  if (user.isFamilyLink) {
    return Array.isArray(user.unlockedModules) && user.unlockedModules.includes(moduleKey);
  }

  if (user.isVip) return true;

  // Si la suscripción venció y no es VIP, no tiene acceso a módulos de pago
  if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < Date.now()) {
    return false;
  }

  if (user.plan === 'full' || user.plan === 'libre' || user.plan === 'premium' || user.plan === 'vip') return true;

  if (Array.isArray(user.unlockedModules)) {
    if (user.unlockedModules.includes('*') || user.unlockedModules.includes(moduleKey)) {
      return true;
    }
  }

  // Fallback por código de plan si unlockedModules no estuviera presente
  const plan = user.plan || 'free';
  if (plan === 'salud' || plan === 'etapas') {
    return [
      'gestacion',
      'carnet_bebe',
      'control_medico',
      'recordatorios',
      'calendario',
      'embarazo_timeline',
      'test_emocional',
    ].includes(moduleKey);
  }
  if (plan === 'crianza') {
    return ['ejercicios', 'cuentos', 'recuerdo'].includes(moduleKey);
  }
  if (plan === 'basico') {
    return [
      'gestacion',
      'control_medico',
      'recordatorios',
      'calendario',
    ].includes(moduleKey);
  }

  return false;
}

export default function SubscriptionGuard({ children, moduleKey, moduleName }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(true);

  const allowed = hasModuleAccess(user, moduleKey);

  if (allowed) {
    return children;
  }

  const handleClose = () => {
    setModalOpen(false);
    navigate('/inicio');
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 card max-w-md mx-auto my-8">
        <span className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4">
          <ModuleIcon name="lock" className="w-8 h-8" />
        </span>
        <h2 className="font-display text-2xl font-bold text-on-surface mb-2">
          Módulo Bloqueado
        </h2>
        <p className="font-body text-sm text-on-surface-variant mb-6 leading-relaxed">
          El acceso a <strong className="text-primary">{moduleName || moduleKey}</strong> requiere una suscripción mensual activa.
        </p>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary !py-3 mb-3"
        >
          Ver planes de suscripción
        </button>

        <button
          type="button"
          onClick={() => navigate('/inicio')}
          className="btn-ghost !py-2"
        >
          Regresar al Inicio
        </button>
      </div>

      <SubscriptionModal
        isOpen={modalOpen}
        onClose={handleClose}
        requestedModule={moduleKey}
      />
    </AppLayout>
  );
}
