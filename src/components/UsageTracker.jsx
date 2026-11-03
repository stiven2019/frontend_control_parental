import useUsageHeartbeat from '../hooks/useUsageHeartbeat';

// Componente sin interfaz: activa la medicion de tiempo de uso dentro del Router.
export default function UsageTracker() {
  useUsageHeartbeat();
  return null;
}
