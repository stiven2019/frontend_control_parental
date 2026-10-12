import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/States';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'earnings', 'users', 'payments', 'emails'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  // Notificaciones flotantes
  const [toast, setToast] = useState(null);

  // Filtros de usuarios
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Filtros de pagos
  const [paymentSearch, setPaymentSearch] = useState('');

  // Modales
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);

  // Usuario seleccionado para acción
  const [selectedUser, setSelectedUser] = useState(null);

  // Formulario Comprobante de Pago
  const [paymentForm, setPaymentForm] = useState({
    transactionNumber: '',
    paymentDate: new Date().toISOString().slice(0, 16),
    phone: '',
    userId: '',
    amount: 50000,
    plan: 'full',
    paymentMethod: 'Nequi',
    notes: '',
    autoActivate: true,
    durationDays: 30,
  });

  // Formulario de Correo
  const [emailForm, setEmailForm] = useState({
    targetType: 'single',
    userId: '',
    toEmail: '',
    recipientName: '',
    groupFilter: 'expiring_soon',
    subject: 'Aviso importante sobre tu cuenta en Mi Bebé',
    message: '',
    buttonText: 'Ir a Mi Bebé',
    buttonUrl: 'https://mibebe.app',
  });

  // Formulario Bloqueo
  const [blockReason, setBlockReason] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Cargar métricas y datos
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [metricsRes, usersRes, paymentsRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers({ limit: 300 }),
        api.getAdminPayments({ limit: 150 }),
      ]);

      setMetrics(metricsRes.metrics);
      setUsers(usersRes.users || []);
      setPayments(paymentsRes.payments || []);
    } catch (err) {
      showToast(err.message || 'Error al sincronizar datos del panel.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Usuarios filtrados
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        u.id.includes(q);

      if (!matchSearch) return false;

      if (userStatusFilter === 'all') return !u.isDeleted;
      if (userStatusFilter === 'active') return u.subscriptionStatus === 'active' || u.subscriptionStatus === 'vip';
      if (userStatusFilter === 'expiring_soon') return u.subscriptionStatus === 'expiring_soon';
      if (userStatusFilter === 'expired') return u.subscriptionStatus === 'expired';
      if (userStatusFilter === 'free') return u.subscriptionStatus === 'free';
      if (userStatusFilter === 'blocked') return u.isBlocked;
      if (userStatusFilter === 'deleted') return u.isDeleted;

      return true;
    });
  }, [users, userSearch, userStatusFilter]);

  // Pagos filtrados
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = paymentSearch.toLowerCase().trim();
      if (!q) return true;
      const tx = (p.transactionNumber || '').toLowerCase();
      const ph = (p.phone || '').toLowerCase();
      const userName = p.user ? `${p.user.firstName} ${p.user.lastName}`.toLowerCase() : '';
      const email = p.user ? p.user.email.toLowerCase() : '';
      return tx.includes(q) || ph.includes(q) || userName.includes(q) || email.includes(q);
    });
  }, [payments, paymentSearch]);

  // Acciones de Gestión de Cuenta
  const handleOpenBlockModal = (u) => {
    setSelectedUser(u);
    setBlockReason(u.blockedReason || 'Incumplimiento de términos o solicitud de seguridad');
    setBlockModalOpen(true);
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    try {
      const nextBlocked = !selectedUser.isBlocked;
      await api.toggleBlockAdminUser(selectedUser.id, {
        isBlocked: nextBlocked,
        reason: nextBlocked ? blockReason : null,
      });
      showToast(nextBlocked ? `Cuenta de ${selectedUser.firstName} bloqueada.` : `Cuenta desbloqueada con éxito.`);
      setBlockModalOpen(false);
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenDeleteModal = (u) => {
    setSelectedUser(u);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async (permanent = false) => {
    if (!selectedUser) return;
    try {
      await api.deleteAdminUser(selectedUser.id, permanent);
      showToast(permanent ? 'Cuenta eliminada definitivamente.' : 'Cuenta marcada como eliminada.');
      setDeleteModalOpen(false);
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRestoreUser = async (u) => {
    try {
      await api.restoreAdminUser(u.id);
      showToast(`Cuenta de ${u.firstName} restaurada exitosamente.`);
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenSubModal = (u) => {
    setSelectedUser(u);
    setSubModalOpen(true);
  };

  const handleUpdateSubscription = async (plan, durationDays, isVip = false) => {
    if (!selectedUser) return;
    try {
      await api.updateAdminUserSubscription(selectedUser.id, {
        plan,
        durationDays,
        isVip,
      });
      showToast(`Suscripción de ${selectedUser.firstName} actualizada a ${plan.toUpperCase()} (${durationDays} días).`);
      setSubModalOpen(false);
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Abrir modal de correo prellenado
  const handleOpenEmailModal = (u = null, template = null) => {
    if (u) {
      setEmailForm({
        targetType: 'single',
        userId: u.id,
        toEmail: u.email,
        recipientName: `${u.firstName} ${u.lastName}`.trim(),
        groupFilter: 'expiring_soon',
        subject: template?.subject || `Información de tu suscripción en Mi Bebé`,
        message: template?.message || `Hola ${u.firstName},\n\nQueremos recordarte que estamos aquí para acompañarte en cada etapa de tu embarazo y cuidado infantil.\n\nSi necesitas asistencia o deseas renovar tu plan, responde a este correo.`,
        buttonText: template?.buttonText || 'Abrir Mi Bebé',
        buttonUrl: template?.buttonUrl || 'https://mibebe.app',
      });
    } else {
      setEmailForm({
        targetType: 'group',
        userId: '',
        toEmail: '',
        recipientName: '',
        groupFilter: 'expiring_soon',
        subject: 'Aviso de vencimiento de tu suscripción en Mi Bebé',
        message: 'Queremos informarte que tu suscripción a Mi Bebé está próxima a finalizar. Puedes renovar transfiriendo por Nequi o Daviplata al 3122031777 para continuar disfrutando del seguimiento médico y álbum de recuerdos.',
        buttonText: 'Renovar por WhatsApp',
        buttonUrl: 'https://wa.me/573122031777',
      });
    }
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      showToast('Por favor completa el asunto y el mensaje.', 'error');
      return;
    }

    try {
      const res = await api.sendAdminEmail(emailForm);
      showToast(res.message || 'Correo procesado exitosamente.');
      setEmailModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Error al enviar el correo.', 'error');
    }
  };

  // Registrar Comprobante de Pago
  const handleOpenPaymentModal = (u = null) => {
    setPaymentForm({
      transactionNumber: '',
      paymentDate: new Date().toISOString().slice(0, 16),
      phone: u?.phone || '',
      userId: u?.id || '',
      amount: 50000,
      plan: 'full',
      paymentMethod: 'Nequi',
      notes: '',
      autoActivate: true,
      durationDays: 30,
    });
    setPaymentModalOpen(true);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.transactionNumber.trim() || !paymentForm.paymentDate || !paymentForm.phone.trim()) {
      showToast('Por favor diligencia el número de transacción, fecha/hora y teléfono de quien transfirió.', 'error');
      return;
    }

    try {
      const res = await api.createAdminPayment(paymentForm);
      showToast(res.message || 'Comprobante guardado con éxito.');
      setPaymentModalOpen(false);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Error al guardar comprobante.', 'error');
    }
  };

  const handleDeletePayment = async (pId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este comprobante de pago? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteAdminPayment(pId);
      showToast('Comprobante eliminado.');
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingState label="Cargando Panel Administrativo..." />
      </div>
    );
  }

  const uMetrics = metrics?.users || {};
  const eMetrics = metrics?.earnings || {};

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body text-on-surface">
      {/* Toast Alert Flotante */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all transform animate-bounce ${
            toast.type === 'error'
              ? 'bg-error text-white'
              : 'bg-emerald-700 text-white'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Administrativo */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-outline-variant/40 px-5 md:px-10 py-3.5 shadow-cloud-sm">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/inicio"
              className="p-2 rounded-full hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
              title="Volver a la app principal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-xl md:text-2xl text-on-surface tracking-tight">
                    Panel Administrativo
                  </h1>
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Control Maestro
                  </span>
                </div>
                <p className="text-xs text-outline hidden sm:block">
                  Gestión integral de suscriptores, recaudación contable y comunicaciones
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenPaymentModal()}
              className="bg-primary text-on-primary hover:opacity-95 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-cloud-sm flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span>+</span>
              <span>Guardar Comprobante</span>
            </button>

            <button
              onClick={() => handleOpenEmailModal()}
              className="bg-surface-container hover:bg-surface-high text-on-surface font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full border border-outline-variant/50 flex items-center gap-1.5 transition-colors"
            >
              <span>✉️</span>
              <span className="hidden sm:inline">Enviar Mensaje</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-full hover:bg-surface-container text-outline transition-colors"
              title="Actualizar datos"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login', { replace: true });
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs md:text-sm px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              title="Cerrar sesión de administrador"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <div className="bg-white border-b border-outline-variant/30 px-5 md:px-10">
        <div className="max-w-[1400px] mx-auto flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'metrics'
                ? 'bg-primary text-white shadow-cloud-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>📊</span>
            <span>Dashboard de Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'earnings'
                ? 'bg-primary text-white shadow-cloud-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>💰</span>
            <span>Tablero de Ganancias</span>
            <span className="bg-emerald-600/20 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
              COP
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-primary text-white shadow-cloud-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>👥</span>
            <span>Administrar Cuentas</span>
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {uMetrics.totalUsers || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'payments'
                ? 'bg-primary text-white shadow-cloud-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>🧾</span>
            <span>Comprobantes de Pago</span>
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'emails'
                ? 'bg-primary text-white shadow-cloud-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>✉️</span>
            <span>Centro de Mensajería</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-[1400px] w-full mx-auto px-5 md:px-10 py-8 flex-1">
        {/* ============================================================== */}
        {/* TAB 1: DASHBOARD DE MÉTRICAS */}
        {/* ============================================================== */}
        {activeTab === 'metrics' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Banner de Bienvenida */}
            <div className="bg-gradient-to-r from-primary to-[#966f80] rounded-3xl p-6 md:p-8 text-white shadow-cloud flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full">
                  Resumen Operativo en Tiempo Real
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">
                  Estado Global de Cuentas y Suscriptores
                </h2>
                <p className="text-white/90 text-sm mt-1 max-w-xl">
                  Supervisa la salud de la plataforma, tasas de vencimiento de planes y toma acción preventiva antes de la caducidad de servicios.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setUserStatusFilter('expiring_soon');
                    setActiveTab('users');
                  }}
                  className="bg-white text-primary hover:bg-surface font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>⚠️</span>
                  <span>Ver Cuentas Por Vencer ({uMetrics.expiringSoon || 0})</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenEmailModal(null, {
                      subject: 'Recordatorio Preventivo de Renovación - Mi Bebé',
                      message: 'Hola! Notamos que tu plan en Mi Bebé está por finalizar. Transfiere por Nequi o Daviplata al 3122031777 para que tu carnet pediátrico y monitoreo fetal no se interrumpan.',
                    });
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full backdrop-blur-sm transition-all flex items-center gap-1.5"
                >
                  <span>✉️</span>
                  <span>Avisar Masivo por Correo</span>
                </button>
              </div>
            </div>

            {/* Tarjetas KPI de Usuarios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Cuentas Activas */}
              <div
                onClick={() => {
                  setUserStatusFilter('active');
                  setActiveTab('users');
                }}
                className="bg-white rounded-3xl p-6 shadow-cloud border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Cuentas Activas
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                    🟢
                  </div>
                </div>
                <div className="font-display font-bold text-3xl md:text-4xl text-on-surface mt-3">
                  {uMetrics.activeSubscribers || 0}
                </div>
                <p className="text-xs text-outline mt-2 flex items-center gap-1">
                  <span>Acceso vigente a módulos restringidos</span>
                </p>
              </div>

              {/* Por Vencer (<= 7 días) */}
              <div
                onClick={() => {
                  setUserStatusFilter('expiring_soon');
                  setActiveTab('users');
                }}
                className="bg-white rounded-3xl p-6 shadow-cloud border border-amber-100 hover:border-amber-300 transition-all cursor-pointer group hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Por Vencer (≤ 7 días)
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                    🟡
                  </div>
                </div>
                <div className="font-display font-bold text-3xl md:text-4xl text-on-surface mt-3">
                  {uMetrics.expiringSoon || 0}
                </div>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Requieren alerta preventiva de pago
                </p>
              </div>

              {/* Vencidas */}
              <div
                onClick={() => {
                  setUserStatusFilter('expired');
                  setActiveTab('users');
                }}
                className="bg-white rounded-3xl p-6 shadow-cloud border border-rose-100 hover:border-rose-300 transition-all cursor-pointer group hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-rose-700">
                    Cuentas Vencidas
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
                    🔴
                  </div>
                </div>
                <div className="font-display font-bold text-3xl md:text-4xl text-on-surface mt-3">
                  {uMetrics.expiredSubscribers || 0}
                </div>
                <p className="text-xs text-rose-600 mt-2 font-medium">
                  Planes caducados sin renovación
                </p>
              </div>

              {/* Total Registradas */}
              <div
                onClick={() => {
                  setUserStatusFilter('all');
                  setActiveTab('users');
                }}
                className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40 hover:border-primary/40 transition-all cursor-pointer group hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary">
                    Total Usuarios
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-primary-container/40 text-primary flex items-center justify-center text-lg">
                    👥
                  </div>
                </div>
                <div className="font-display font-bold text-3xl md:text-4xl text-on-surface mt-3">
                  {uMetrics.totalUsers || 0}
                </div>
                <p className="text-xs text-outline mt-2">
                  Cuentas activas en la base de datos
                </p>
              </div>
            </div>

            {/* Métricas Secundarias: Bloqueadas, Eliminadas y Gratuitas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-outline uppercase tracking-wider">
                    Cuentas Gratuitas (Free)
                  </span>
                  <div className="font-display text-2xl font-bold text-on-surface mt-1">
                    {uMetrics.freeUsers || 0}
                  </div>
                  <p className="text-xs text-outline mt-1">Sin suscripción activa aún</p>
                </div>
                <div className="text-3xl">🌱</div>
              </div>

              <div
                onClick={() => {
                  setUserStatusFilter('blocked');
                  setActiveTab('users');
                }}
                className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:border-error/40 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-error uppercase tracking-wider">
                    Cuentas Bloqueadas
                  </span>
                  <div className="font-display text-2xl font-bold text-on-surface mt-1">
                    {uMetrics.blockedUsers || 0}
                  </div>
                  <p className="text-xs text-outline mt-1">Acceso revocado temporalmente</p>
                </div>
                <div className="text-3xl">🚫</div>
              </div>

              <div
                onClick={() => {
                  setUserStatusFilter('deleted');
                  setActiveTab('users');
                }}
                className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:border-outline transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-outline-variant uppercase tracking-wider">
                    Cuentas Eliminadas
                  </span>
                  <div className="font-display text-2xl font-bold text-on-surface mt-1">
                    {uMetrics.deletedUsers || 0}
                  </div>
                  <p className="text-xs text-outline mt-1">Dadas de baja con soft delete</p>
                </div>
                <div className="text-3xl">🗑️</div>
              </div>
            </div>

            {/* Vista Rápida Financiera dentro del Dashboard */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-cloud border border-outline-variant/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">
                    Resumen Financiero del Mes
                  </h3>
                  <p className="text-xs text-outline">
                    Comprobantes Nequi y Daviplata registrados y confirmados
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className="text-primary hover:underline font-semibold text-xs md:text-sm flex items-center gap-1"
                >
                  <span>Ver Tablero Completo de Ganancias</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container/60">
                  <div className="text-xs font-semibold text-outline">Total Recaudado Histórico</div>
                  <div className="text-xl md:text-2xl font-bold text-primary mt-1">
                    ${(eMetrics.totalRevenue || 0).toLocaleString('es-CO')} <span className="text-xs font-normal text-outline">COP</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container/60">
                  <div className="text-xs font-semibold text-outline">Recaudado Este Mes</div>
                  <div className="text-xl md:text-2xl font-bold text-emerald-700 mt-1">
                    ${(eMetrics.thisMonthRevenue || 0).toLocaleString('es-CO')} <span className="text-xs font-normal text-outline">COP</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container/60">
                  <div className="text-xs font-semibold text-outline">Esta Semana</div>
                  <div className="text-xl md:text-2xl font-bold text-tertiary mt-1">
                    ${(eMetrics.thisWeekRevenue || 0).toLocaleString('es-CO')} <span className="text-xs font-normal text-outline">COP</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container/60">
                  <div className="text-xs font-semibold text-outline">Transacciones Aprobadas</div>
                  <div className="text-xl md:text-2xl font-bold text-on-surface mt-1">
                    {eMetrics.totalTransactions || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TABLERO DE GANANCIAS */}
        {/* ============================================================== */}
        {activeTab === 'earnings' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                  Tablero Financiero y Ganancias
                </h2>
                <p className="text-sm text-outline">
                  Seguimiento detallado de flujos de dinero, métodos de pago y planes suscritos en Colombia
                </p>
              </div>

              <button
                onClick={() => handleOpenPaymentModal()}
                className="bg-primary text-on-primary font-semibold text-sm px-5 py-3 rounded-full shadow-cloud-sm flex items-center gap-2 hover:opacity-95 transition-transform active:scale-95 self-start md:self-auto"
              >
                <span>💳</span>
                <span>Registrar Comprobante de Pago</span>
              </button>
            </div>

            {/* Tarjetas Principales de Ingresos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-3xl p-6 shadow-cloud">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                  Total Histórico Recaudado
                </span>
                <div className="font-display font-bold text-3xl md:text-4xl mt-3">
                  ${(eMetrics.totalRevenue || 0).toLocaleString('es-CO')}
                </div>
                <p className="text-xs text-emerald-200/90 mt-2">
                  Acumulado de todos los pagos verificados
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
                <span className="text-xs uppercase font-bold tracking-wider text-outline">
                  Recaudado Este Mes
                </span>
                <div className="font-display font-bold text-3xl md:text-4xl text-emerald-700 mt-3">
                  ${(eMetrics.thisMonthRevenue || 0).toLocaleString('es-CO')}
                </div>
                <p className="text-xs text-outline mt-2">
                  Mes en curso ({new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })})
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
                <span className="text-xs uppercase font-bold tracking-wider text-outline">
                  Recaudado Esta Semana
                </span>
                <div className="font-display font-bold text-3xl md:text-4xl text-primary mt-3">
                  ${(eMetrics.thisWeekRevenue || 0).toLocaleString('es-CO')}
                </div>
                <p className="text-xs text-outline mt-2">
                  Últimos 7 días móviles
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
                <span className="text-xs uppercase font-bold tracking-wider text-outline">
                  Ticket Promedio
                </span>
                <div className="font-display font-bold text-3xl md:text-4xl text-on-surface mt-3">
                  ${(eMetrics.averageTicket || 0).toLocaleString('es-CO')}
                </div>
                <p className="text-xs text-outline mt-2">
                  Valor medio por suscripción cancelada
                </p>
              </div>
            </div>

            {/* Gráficos de Recaudación y Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico Mensual */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-cloud border border-outline-variant/40">
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Historial de Ingresos Mensuales
                </h3>
                <p className="text-xs text-outline mb-6">
                  Comportamiento de recaudación en los últimos meses
                </p>

                {(!eMetrics.monthlyRevenueChart || eMetrics.monthlyRevenueChart.length === 0) ? (
                  <div className="py-12 text-center text-outline text-sm">
                    No hay datos de recaudación registrados en los últimos meses.
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-3 h-56 pt-6 px-2 border-b border-outline-variant/30">
                    {(() => {
                      const maxVal = Math.max(...eMetrics.monthlyRevenueChart.map((m) => m.total), 1);
                      return eMetrics.monthlyRevenueChart.map((m) => {
                        const heightPct = Math.round((m.total / maxVal) * 100);
                        return (
                          <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-2 group">
                            <span className="text-[11px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                              ${m.total.toLocaleString('es-CO')}
                            </span>
                            <div
                              style={{ height: `${Math.max(heightPct, 6)}%` }}
                              className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-primary to-primary-container transition-all group-hover:opacity-90 relative"
                            />
                            <span className="text-[11px] text-outline font-medium capitalize mt-1">
                              {m.monthName}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Desglose por Medio de Pago y Planes */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
                  <h3 className="font-display text-base font-bold text-on-surface mb-3">
                    Ingresos por Medio de Pago
                  </h3>
                  <div className="space-y-3">
                    {(eMetrics.revenueByMethod || []).map((method) => (
                      <div key={method.method} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <span className="font-semibold text-on-surface">{method.method}</span>
                          <span className="text-xs text-outline">({method.count} pagos)</span>
                        </div>
                        <span className="font-bold text-primary">
                          ${method.totalAmount.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    ))}
                    {(!eMetrics.revenueByMethod || eMetrics.revenueByMethod.length === 0) && (
                      <p className="text-xs text-outline py-2">Sin métodos registrados aún.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
                  <h3 className="font-display text-base font-bold text-on-surface mb-3">
                    Ingresos por Tipo de Plan
                  </h3>
                  <div className="space-y-3">
                    {(eMetrics.revenueByPlan || []).map((plan) => (
                      <div key={plan.plan} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          <span className="font-semibold capitalize text-on-surface">Plan {plan.plan}</span>
                          <span className="text-xs text-outline">({plan.count})</span>
                        </div>
                        <span className="font-bold text-emerald-700">
                          ${plan.totalAmount.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    ))}
                    {(!eMetrics.revenueByPlan || eMetrics.revenueByPlan.length === 0) && (
                      <p className="text-xs text-outline py-2">Sin planes registrados aún.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Últimos Comprobantes de Pago Registrados */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-cloud border border-outline-variant/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Últimos Pagos Confirmados
                </h3>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-primary hover:underline text-xs font-semibold"
                >
                  Ver todos los comprobantes →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-outline text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">N° Transacción</th>
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Teléfono Transferente</th>
                      <th className="py-3 px-4">Usuaria Asociada</th>
                      <th className="py-3 px-4">Medio</th>
                      <th className="py-3 px-4 text-right">Monto Pagado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {(eMetrics.recentPayments || []).map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          {p.transactionNumber}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant text-xs">
                          {new Date(p.paymentDate).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-on-surface">
                          {p.phone}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface">
                          {p.user ? (
                            <div>
                              <div className="font-semibold">{p.user.firstName} {p.user.lastName}</div>
                              <div className="text-xs text-outline">{p.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-outline text-xs italic">Sin usuaria vinculada</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {p.paymentMethod || 'Nequi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                          ${(p.amount || 0).toLocaleString('es-CO')} COP
                        </td>
                      </tr>
                    ))}
                    {(!eMetrics.recentPayments || eMetrics.recentPayments.length === 0) && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-outline">
                          No hay comprobantes de pago registrados aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ADMINISTRAR CUENTAS (SUSCRIPTORES) */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                  Administración de Cuentas y Suscriptores
                </h2>
                <p className="text-sm text-outline">
                  Control de accesos, bloqueo/desbloqueo, eliminación de cuentas y renovación de suscripciones
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEmailModal()}
                  className="bg-surface-container hover:bg-surface-high text-on-surface font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full border border-outline-variant/50 flex items-center gap-1.5"
                >
                  <span>✉️</span>
                  <span>Mensaje a Grupo</span>
                </button>
                <button
                  onClick={() => handleOpenPaymentModal()}
                  className="bg-primary text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-cloud-sm flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Registrar Pago</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-cloud border border-outline-variant/40 space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">🔍</span>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nombre, correo, teléfono o ID..."
                    className="w-full pl-11 pr-4 py-3 bg-surface-container/60 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-outline hover:text-on-surface"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-outline font-semibold self-end md:self-auto">
                  <span>Mostrando:</span>
                  <strong className="text-primary">{filteredUsers.length}</strong>
                  <span>de {users.length} cuentas</span>
                </div>
              </div>

              {/* Filtro por Estado (Píldoras) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: 'all', label: 'Todas las Cuentas', count: users.filter(u => !u.isDeleted).length },
                  { key: 'active', label: 'Activas', count: uMetrics.activeSubscribers || 0, badge: '🟢' },
                  { key: 'expiring_soon', label: 'Por Vencer (≤7d)', count: uMetrics.expiringSoon || 0, badge: '🟡' },
                  { key: 'expired', label: 'Vencidas', count: uMetrics.expiredSubscribers || 0, badge: '🔴' },
                  { key: 'free', label: 'Gratuitas', count: uMetrics.freeUsers || 0, badge: '🌱' },
                  { key: 'blocked', label: 'Bloqueadas', count: uMetrics.blockedUsers || 0, badge: '🚫' },
                  { key: 'deleted', label: 'Eliminadas', count: uMetrics.deletedUsers || 0, badge: '🗑️' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setUserStatusFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      userStatusFilter === f.key
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container/70 text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {f.badge && <span>{f.badge}</span>}
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-80">({f.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="bg-white rounded-3xl shadow-cloud border border-outline-variant/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-surface-low border-b border-outline-variant/30 text-outline text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Usuaria</th>
                      <th className="py-3.5 px-4">Estado Suscripción</th>
                      <th className="py-3.5 px-4">Plan Actual</th>
                      <th className="py-3.5 px-4">Vigencia / Vence</th>
                      <th className="py-3.5 px-4">Comprobantes</th>
                      <th className="py-3.5 px-4">Estado Cuenta</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-surface-container/20 transition-colors ${
                            u.isBlocked ? 'bg-rose-50/40' : u.isDeleted ? 'bg-gray-50 opacity-60' : ''
                          }`}
                        >
                          {/* Datos Personales */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-container/60 text-primary font-bold flex items-center justify-center shrink-0">
                                {u.firstName ? u.firstName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-on-surface flex items-center gap-1.5">
                                  <span>{u.firstName} {u.lastName}</span>
                                  {u.role === 'admin' && (
                                    <span className="text-[10px] bg-primary text-white px-1.5 py-0.2 rounded-full font-bold">
                                      ADMIN
                                    </span>
                                  )}
                                  {isSelf && (
                                    <span className="text-[10px] bg-tertiary-container text-tertiary px-1.5 py-0.2 rounded-full">
                                      TÚ
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-outline">{u.email}</div>
                                {u.phone && (
                                  <div className="text-[11px] text-tertiary font-medium">📞 {u.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Estado de Suscripción */}
                          <td className="py-3.5 px-4">
                            {u.isVip ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ⭐ VIP TOTAL
                              </span>
                            ) : u.subscriptionStatus === 'active' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                🟢 Activa
                              </span>
                            ) : u.subscriptionStatus === 'expiring_soon' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                🟡 Vence en {u.daysRemaining}d
                              </span>
                            ) : u.subscriptionStatus === 'expired' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                🔴 Vencida
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Gratuita
                              </span>
                            )}
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-4">
                            <span className="capitalize font-semibold text-on-surface text-xs">
                              {u.plan || 'free'}
                            </span>
                          </td>

                          {/* Vigencia */}
                          <td className="py-3.5 px-4 text-xs">
                            {u.subscriptionExpiresAt ? (
                              <div>
                                <div className="font-semibold text-on-surface">
                                  {new Date(u.subscriptionExpiresAt).toLocaleDateString('es-CO')}
                                </div>
                                <div className="text-outline text-[11px]">
                                  {u.daysRemaining > 0
                                    ? `${u.daysRemaining} días restantes`
                                    : `Venció hace ${Math.abs(u.daysRemaining)} días`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-outline italic">Sin fecha de corte</span>
                            )}
                          </td>

                          {/* Comprobantes Asociados */}
                          <td className="py-3.5 px-4 text-xs">
                            {u.totalPaymentsCount > 0 ? (
                              <div>
                                <span className="font-bold text-emerald-700">
                                  {u.totalPaymentsCount} comprobante(s)
                                </span>
                                <div className="text-outline text-[11px]">
                                  ${(u.totalPaidAmount || 0).toLocaleString('es-CO')} COP
                                </div>
                              </div>
                            ) : (
                              <span className="text-outline italic">0 pagos</span>
                            )}
                          </td>

                          {/* Estado de la cuenta (Bloqueada / Eliminada) */}
                          <td className="py-3.5 px-4 text-xs">
                            {u.isDeleted ? (
                              <span className="px-2 py-0.5 rounded-full font-bold bg-gray-200 text-gray-700">
                                🗑️ Eliminada
                              </span>
                            ) : u.isBlocked ? (
                              <div>
                                <span className="px-2 py-0.5 rounded-full font-bold bg-error-container text-on-error-container">
                                  🚫 Bloqueada
                                </span>
                                {u.blockedReason && (
                                  <div className="text-[10px] text-error mt-0.5 max-w-[120px] truncate" title={u.blockedReason}>
                                    {u.blockedReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-xs">
                                ✓ Habilitada
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Enviar Correo */}
                              <button
                                onClick={() => handleOpenEmailModal(u)}
                                className="p-2 rounded-full hover:bg-surface-container text-tertiary transition-colors"
                                title="Enviar mensaje al correo"
                              >
                                ✉️
                              </button>

                              {/* Registrar Pago */}
                              <button
                                onClick={() => handleOpenPaymentModal(u)}
                                className="p-2 rounded-full hover:bg-surface-container text-emerald-700 transition-colors"
                                title="Registrar comprobante y asociar"
                              >
                                💳
                              </button>

                              {/* Gestionar Suscripción */}
                              <button
                                onClick={() => handleOpenSubModal(u)}
                                className="p-2 rounded-full hover:bg-surface-container text-primary transition-colors"
                                title="Activar o cambiar suscripción"
                              >
                                ⚙️
                              </button>

                              {/* Bloquear / Desbloquear */}
                              {!isSelf && !u.isDeleted && (
                                <button
                                  onClick={() => handleOpenBlockModal(u)}
                                  className={`p-2 rounded-full hover:bg-surface-container transition-colors ${
                                    u.isBlocked ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                  title={u.isBlocked ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
                                >
                                  {u.isBlocked ? '🔓' : '🚫'}
                                </button>
                              )}

                              {/* Eliminar o Restaurar */}
                              {!isSelf && (
                                u.isDeleted ? (
                                  <button
                                    onClick={() => handleRestoreUser(u)}
                                    className="p-2 rounded-full hover:bg-surface-container text-emerald-700 transition-colors"
                                    title="Restaurar cuenta eliminada"
                                  >
                                    ♻️
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenDeleteModal(u)}
                                    className="p-2 rounded-full hover:bg-surface-container text-error transition-colors"
                                    title="Eliminar cuenta"
                                  >
                                    🗑️
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-outline">
                          No se encontraron cuentas que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: COMPROBANTES DE PAGO */}
        {/* ============================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                  Registro y Archivo de Comprobantes de Pago
                </h2>
                <p className="text-sm text-outline">
                  Conserva el número de transacción, fecha, hora y teléfono de quien transfirió, asociándolo a la cuenta
                </p>
              </div>

              <button
                onClick={() => handleOpenPaymentModal()}
                className="bg-primary text-on-primary font-semibold text-sm px-5 py-3 rounded-full shadow-cloud-sm flex items-center gap-2 hover:opacity-95 transition-transform active:scale-95"
              >
                <span>+</span>
                <span>Guardar Nuevo Comprobante</span>
              </button>
            </div>

            {/* Buscador de Comprobantes */}
            <div className="bg-white rounded-3xl p-4 shadow-cloud border border-outline-variant/40 flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">🔍</span>
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  placeholder="Buscar por número de transacción, teléfono o usuaria..."
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-container/60 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30"
                />
              </div>
              <div className="text-xs text-outline font-semibold pr-2">
                Total comprobantes: <strong className="text-primary">{filteredPayments.length}</strong>
              </div>
            </div>

            {/* Tabla de Comprobantes */}
            <div className="bg-white rounded-3xl shadow-cloud border border-outline-variant/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-surface-low border-b border-outline-variant/30 text-outline text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">N° Transacción</th>
                      <th className="py-3.5 px-4">Fecha y Hora</th>
                      <th className="py-3.5 px-4">Teléfono Transferente</th>
                      <th className="py-3.5 px-4">Cuenta Asociada</th>
                      <th className="py-3.5 px-4">Plan / Método</th>
                      <th className="py-3.5 px-4">Monto ($ COP)</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          {p.transactionNumber}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-on-surface">
                          {new Date(p.paymentDate).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-on-surface">
                          📞 {p.phone}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.user ? (
                            <div>
                              <div className="font-semibold text-on-surface">
                                {p.user.firstName} {p.user.lastName}
                              </div>
                              <div className="text-xs text-outline">{p.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-outline italic">Cuenta desvinculada / sin asignar</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-bold capitalize text-primary mr-1">
                            {p.plan || 'full'}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                            {p.paymentMethod || 'Nequi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          ${(p.amount || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 rounded-full hover:bg-error-container text-error transition-colors"
                            title="Eliminar comprobante"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-outline">
                          No hay comprobantes de pago que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: CENTRO DE MENSAJERÍA / CORREO */}
        {/* ============================================================== */}
        {activeTab === 'emails' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                Centro de Comunicaciones y Mensajería
              </h2>
              <p className="text-sm text-outline">
                Envía avisos de cobro, recordatorios de vencimiento y notificaciones oficiales con la identidad de marca de Mi Bebé
              </p>
            </div>

            {/* Plantillas Rápidas */}
            <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Plantillas Rápidas de Mensajes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmailForm({
                      targetType: 'group',
                      groupFilter: 'expiring_soon',
                      userId: '',
                      toEmail: '',
                      recipientName: '',
                      subject: '⏰ Tu suscripción a Mi Bebé vence en los próximos días',
                      message: 'Hola!\n\nQueremos recordarte con anticipación que tu suscripción a Mi Bebé está próxima a finalizar.\n\nPuedes renovar tu acceso transfiriendo por Nequi o Daviplata al 3122031777 para que tu carnet de salud, controles y fotos sigan disponibles.',
                      buttonText: 'Renovar por WhatsApp',
                      buttonUrl: 'https://wa.me/573122031777',
                    });
                  }}
                  className="p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-high border border-outline-variant/30 text-left transition-colors"
                >
                  <div className="text-sm font-bold text-on-surface">⚠️ Aviso Por Vencer</div>
                  <div className="text-xs text-outline mt-1">Dirigido a cuentas que caducan en ≤7 días</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailForm({
                      targetType: 'group',
                      groupFilter: 'expired',
                      userId: '',
                      toEmail: '',
                      recipientName: '',
                      subject: '❤️ Tu cuenta te espera en Mi Bebé - Renueva tu plan',
                      message: 'Hola!\n\nTu suscripción ha finalizado, pero todos tus recuerdos, ecografías y registros clínicos siguen protegidos.\n\nRenueva hoy tu plan desde $15.000 COP transfiriendo al 3122031777 (Nequi/Daviplata) y reactiva tus módulos inmediatamente.',
                      buttonText: 'Escribir a Soporte',
                      buttonUrl: 'https://wa.me/573122031777',
                    });
                  }}
                  className="p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-high border border-outline-variant/30 text-left transition-colors"
                >
                  <div className="text-sm font-bold text-on-surface">🔴 Aviso Cuentas Vencidas</div>
                  <div className="text-xs text-outline mt-1">Invitación de renovación a cuentas expiradas</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailForm({
                      targetType: 'single',
                      userId: '',
                      toEmail: '',
                      recipientName: '',
                      groupFilter: 'active',
                      subject: '✅ Confirmación de Activación de Suscripción - Mi Bebé',
                      message: '¡Excelente noticia!\n\nHemos verificado tu comprobante de pago exitosamente y tu suscripción ha sido activada/extendida en la plataforma.\n\nYa puedes disfrutar de todos tus módulos clínicos y carnet de salud infantil sin interrupciones.',
                      buttonText: 'Abrir Mi Bebé',
                      buttonUrl: 'https://mibebe.app/inicio',
                    });
                  }}
                  className="p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-high border border-outline-variant/30 text-left transition-colors"
                >
                  <div className="text-sm font-bold text-on-surface">✅ Confirmación de Pago</div>
                  <div className="text-xs text-outline mt-1">Agradecimiento tras registrar comprobante</div>
                </button>
              </div>
            </div>

            {/* Formulario de Redacción */}
            <form onSubmit={handleSendEmail} className="bg-white rounded-3xl p-6 md:p-8 shadow-cloud border border-outline-variant/40 space-y-5">
              {/* Tipo de Destinatario */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={emailForm.targetType === 'single'}
                    onChange={() => setEmailForm({ ...emailForm, targetType: 'single' })}
                  />
                  <span>Enviar a una sola cuenta</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={emailForm.targetType === 'group'}
                    onChange={() => setEmailForm({ ...emailForm, targetType: 'group' })}
                  />
                  <span>Enviar a un grupo de usuarias</span>
                </label>
              </div>

              {emailForm.targetType === 'single' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Seleccionar Usuaria Registrada</label>
                    <select
                      value={emailForm.userId}
                      onChange={(e) => {
                        const sel = users.find(u => u.id === e.target.value);
                        if (sel) {
                          setEmailForm({
                            ...emailForm,
                            userId: sel.id,
                            toEmail: sel.email,
                            recipientName: `${sel.firstName} ${sel.lastName}`,
                          });
                        } else {
                          setEmailForm({ ...emailForm, userId: e.target.value });
                        }
                      }}
                      className="input-field text-sm"
                    >
                      <option value="">-- Seleccionar de la lista --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label">O Correo Electrónico Destino</label>
                    <input
                      type="email"
                      value={emailForm.toEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="field-label">Grupo Objetivo de Envío</label>
                  <select
                    value={emailForm.groupFilter}
                    onChange={(e) => setEmailForm({ ...emailForm, groupFilter: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="expiring_soon">Cuentas Por Vencer (en los próximos 7 días) [{uMetrics.expiringSoon || 0}]</option>
                    <option value="expired">Cuentas Ya Vencidas [{uMetrics.expiredSubscribers || 0}]</option>
                    <option value="active">Todas las Cuentas Activas [{uMetrics.activeSubscribers || 0}]</option>
                  </select>
                </div>
              )}

              {/* Asunto */}
              <div>
                <label className="field-label">Asunto del Correo</label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Asunto formal y claro..."
                  className="input-field text-sm font-semibold"
                />
              </div>

              {/* Cuerpo del Mensaje */}
              <div>
                <label className="field-label">Mensaje</label>
                <textarea
                  required
                  rows="6"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Escribe el contenido del correo..."
                  className="input-field text-sm resize-none"
                />
              </div>

              {/* Botón de Acción Opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Texto del Botón (Opcional)</label>
                  <input
                    type="text"
                    value={emailForm.buttonText}
                    onChange={(e) => setEmailForm({ ...emailForm, buttonText: e.target.value })}
                    placeholder="Ej: Renovar por WhatsApp"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="field-label">Enlace URL del Botón</label>
                  <input
                    type="text"
                    value={emailForm.buttonUrl}
                    onChange={(e) => setEmailForm({ ...emailForm, buttonUrl: e.target.value })}
                    placeholder="https://wa.me/573122031777"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary !w-auto !px-8 !py-3 !text-sm flex items-center gap-2"
                >
                  <span>✉️</span>
                  <span>Despachar Correo Ahora</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR COMPROBANTE DE PAGO */}
      {/* ============================================================== */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-outline-variant/40 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🧾</span>
                <h3 className="font-display font-bold text-xl text-on-surface">
                  Guardar Comprobante de Pago
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-outline hover:text-on-surface text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4 pt-4">
              <div className="p-3 rounded-2xl bg-surface-container/60 text-xs text-on-surface-variant leading-relaxed">
                ℹ️ Según requerimiento contable, se almacena de forma segura el <strong>número de transacción</strong>, <strong>fecha y hora</strong> y el <strong>teléfono</strong> de quien transfirió, asociándolo a la cuenta.
              </div>

              {/* Número de Transacción */}
              <div>
                <label className="field-label">Número de Transacción / Comprobante *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.transactionNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionNumber: e.target.value })}
                  placeholder="Ej: M1234567, NQ-98765432, D109283..."
                  className="input-field text-sm font-mono font-bold"
                />
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Fecha y Hora de la Transferencia *</label>
                  <input
                    type="datetime-local"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="field-label">Teléfono de quien Transfirió *</label>
                  <input
                    type="tel"
                    required
                    value={paymentForm.phone}
                    onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                    placeholder="Ej: 3122031777"
                    className="input-field text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Cuenta Asociada */}
              <div>
                <label className="field-label">Asociar a la Cuenta de Usuario</label>
                <select
                  value={paymentForm.userId}
                  onChange={(e) => {
                    const sel = users.find(u => u.id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      userId: e.target.value,
                      phone: paymentForm.phone || (sel?.phone || ''),
                    });
                  }}
                  className="input-field text-sm"
                >
                  <option value="">-- Seleccionar usuaria que hizo la transferencia --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email}) - {u.phone || 'Sin tel'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto y Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="field-label">Monto ($ COP)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value, 10) || 0 })}
                    className="input-field text-sm font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="field-label">Plan Adquirido</label>
                  <select
                    value={paymentForm.plan}
                    onChange={(e) => {
                      const newPlan = e.target.value;
                      let defaultAmount = 50000;
                      if (newPlan === 'basico') defaultAmount = 15000;
                      if (newPlan === 'salud') defaultAmount = 30000;
                      if (newPlan === 'full' || newPlan === 'vip') defaultAmount = 50000;
                      setPaymentForm({ ...paymentForm, plan: newPlan, amount: defaultAmount });
                    }}
                    className="input-field text-sm font-semibold"
                  >
                    <option value="full">Libre Toda la App ($50.000)</option>
                    <option value="salud">Salud y Test ($30.000)</option>
                    <option value="basico">Esencial Médico ($15.000)</option>
                    <option value="vip">Acceso VIP Total ($50.000)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Medio de Pago</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Casilla de Auto-Activación */}
              <div className="p-3 rounded-2xl bg-primary-container/30 border border-primary/20 space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-bold text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.autoActivate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, autoActivate: e.target.checked })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>Activar o renovar la suscripción automáticamente en 1 paso</span>
                </label>
                {paymentForm.autoActivate && (
                  <div className="flex items-center gap-2 pl-6 text-xs text-on-surface">
                    <span>Duración de renovación:</span>
                    <select
                      value={paymentForm.durationDays}
                      onChange={(e) => setPaymentForm({ ...paymentForm, durationDays: parseInt(e.target.value, 10) })}
                      className="bg-white border border-outline-variant/40 rounded-lg px-2 py-1 font-semibold text-xs"
                    >
                      <option value="30">30 días (1 Mes)</option>
                      <option value="60">60 días (2 Meses)</option>
                      <option value="90">90 días (3 Meses)</option>
                      <option value="180">180 días (6 Meses)</option>
                      <option value="365">365 días (1 Año)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="field-label">Notas Adicionales (Opcional)</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Detalles sobre el titular o verificación..."
                  className="input-field text-sm"
                />
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="btn-ghost !w-auto !px-5 !py-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary !w-auto !px-7 !py-2.5 text-sm"
                >
                  Guardar Comprobante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BLOQUEAR / DESBLOQUEAR CUENTA */}
      {/* ============================================================== */}
      {blockModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 animate-scaleUp">
            <div className="text-3xl mb-3">{selectedUser.isBlocked ? '🔓' : '🚫'}</div>
            <h3 className="font-display font-bold text-xl text-on-surface">
              {selectedUser.isBlocked ? 'Desbloquear Cuenta' : 'Bloquear Cuenta de Usuario'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              {selectedUser.isBlocked
                ? `La usuaria ${selectedUser.firstName} ${selectedUser.lastName} podrá volver a ingresar y utilizar sus módulos normalmente.`
                : `Al bloquear la cuenta de ${selectedUser.firstName} ${selectedUser.lastName}, se le impedirá el inicio de sesión y todas sus peticiones serán rechazadas con código 403.`}
            </p>

            {!selectedUser.isBlocked && (
              <div className="mt-4">
                <label className="field-label">Motivo del Bloqueo (Visible para la usuaria)</label>
                <textarea
                  rows="3"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Explica la razón de la suspensión..."
                  className="input-field text-xs resize-none"
                />
              </div>
            )}

            <div className="pt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="btn-ghost !w-auto !px-5 !py-2.5 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleBlock}
                className={`!w-auto !px-6 !py-2.5 rounded-full font-semibold text-xs text-white shadow-sm transition-transform active:scale-95 ${
                  selectedUser.isBlocked ? 'bg-emerald-700' : 'bg-error'
                }`}
              >
                {selectedUser.isBlocked ? 'Confirmar Desbloqueo' : 'Confirmar Bloqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ELIMINAR CUENTA (CON CONFIRMACIÓN DE SEGURIDAD) */}
      {/* ============================================================== */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-error/20 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center text-2xl mb-3">
              🗑️
            </div>
            <h3 className="font-display font-bold text-xl text-on-surface">
              ¿Eliminar cuenta de {selectedUser.firstName}?
            </h3>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Por defecto, se aplicará <strong>Baja Lógica (Soft Delete)</strong> para preservar los registros de auditoría y ganancias contables. La cuenta quedará inhabilitada.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="btn-ghost !w-auto !px-4 !py-2.5 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(false)}
                className="bg-error hover:bg-error/90 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-cloud-sm transition-transform active:scale-95"
              >
                Inhabilitar Cuenta (Seguro)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GESTIONAR SUSCRIPCIÓN RÁPIDA */}
      {/* ============================================================== */}
      {subModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/40 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-display font-bold text-lg text-on-surface">
                Gestionar Plan de {selectedUser.firstName}
              </h3>
              <button onClick={() => setSubModalOpen(false)} className="text-outline text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="text-xs text-outline">
                Plan actual: <strong className="text-primary uppercase">{selectedUser.plan || 'free'}</strong>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => handleUpdateSubscription('full', 30, false)}
                  className="p-3 rounded-2xl bg-surface-container hover:bg-primary-container text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-on-surface">Plan Libre Toda la App (30 días)</div>
                    <div className="text-[11px] text-outline">Acceso a todos los módulos médicos y álbum</div>
                  </div>
                  <span className="text-xs font-bold text-primary">$50.000 COP</span>
                </button>

                <button
                  onClick={() => handleUpdateSubscription('salud', 30, false)}
                  className="p-3 rounded-2xl bg-surface-container hover:bg-secondary-container text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-on-surface">Plan Salud y Test (30 días)</div>
                    <div className="text-[11px] text-outline">Control médico, test emocional y recordatorios</div>
                  </div>
                  <span className="text-xs font-bold text-secondary">$30.000 COP</span>
                </button>

                <button
                  onClick={() => handleUpdateSubscription('basico', 30, false)}
                  className="p-3 rounded-2xl bg-surface-container hover:bg-tertiary-container text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-on-surface">Plan Esencial Médico (30 días)</div>
                    <div className="text-[11px] text-outline">Controles y recordatorios de vacunas/citas</div>
                  </div>
                  <span className="text-xs font-bold text-tertiary">$15.000 COP</span>
                </button>

                <button
                  onClick={() => handleUpdateSubscription('full', 365, true)}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-amber-900">⭐ Activar Acceso VIP Vitalicio (1 Año)</div>
                    <div className="text-[11px] text-amber-800">Desbloqueo permanente sin vencimiento</div>
                  </div>
                  <span className="text-xs font-bold text-amber-900">VIP</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSubModalOpen(false)} className="btn-ghost !w-auto !px-5 !py-2 text-xs">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
