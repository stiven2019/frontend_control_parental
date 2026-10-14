import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/States';

export default function AdminPanel() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'advanced_metrics', 'earnings', 'users', 'payments', 'emails', 'account'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  // Control de menú vertical móvil
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const [carnetModalOpen, setCarnetModalOpen] = useState(false);

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

  // Formulario Perfil Administrador (Configurar Cuenta)
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Formulario Cambio de Contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

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
      if (userStatusFilter === 'carnet_premature') return Boolean(u.babyStatus?.isPrematurelyActivated);
      if (userStatusFilter === 'carnet_born') return Boolean(u.babyStatus?.isBorn);
      if (userStatusFilter === 'gestating') return Boolean(!u.babyStatus?.isBorn && u.babyStatus?.hasBaby);
      if (userStatusFilter === 'carnet_blocked') return Boolean(u.babyStatus?.carnetLockedByAdmin);
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

  // Gestión de Carnet de Bebé Nacido (Bloqueo / Desbloqueo)
  const handleOpenCarnetModal = (u) => {
    setSelectedUser(u);
    setCarnetModalOpen(true);
  };

  const handleToggleBabyCarnet = async (lock) => {
    if (!selectedUser) return;
    try {
      const res = await api.toggleAdminBabyCarnet(selectedUser.id, { lock });
      showToast(res.message || (lock ? 'Carnet de bebé bloqueado y vuelto a gestación.' : 'Carnet de bebé habilitado.'));
      setCarnetModalOpen(false);
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

  // Acciones de Configurar Cuenta de Administrador
  const handleUpdateProfile = async (e) => {
    e?.preventDefault();
    if (!profileForm.firstName.trim()) {
      showToast('El nombre del administrador es obligatorio.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await api.updateMe({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
      });
      await refreshUser?.();
      showToast('Datos de perfil actualizados con éxito.');
    } catch (err) {
      showToast(err.message || 'Error al actualizar los datos.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast('Por favor ingresa tu contraseña actual.', 'error');
      return;
    }
    if (!passwordForm.newPassword) {
      showToast('Por favor ingresa tu nueva contraseña.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('La nueva contraseña debe tener mínimo 8 caracteres.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Las nuevas contraseñas no coinciden.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast(res?.message || 'Contraseña actualizada con éxito.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      showToast(err.message || 'Error al actualizar la contraseña.', 'error');
    } finally {
      setChangingPassword(false);
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
  const advMetrics = metrics?.advanced || {};
  const advGestation = advMetrics?.gestation || {};
  const advGrowth = advMetrics?.growth || {};

  // Contadores dinámicos calculados en caliente
  const prematureCount = users.filter((u) => !u.isDeleted && u.babyStatus?.isPrematurelyActivated).length;
  const bornCount = users.filter((u) => !u.isDeleted && u.babyStatus?.isBorn).length;
  const gestatingCount = users.filter((u) => !u.isDeleted && !u.babyStatus?.isBorn && u.babyStatus?.hasBaby).length;
  const carnetLockedCount = users.filter((u) => !u.isDeleted && u.babyStatus?.carnetLockedByAdmin).length;

  return (
    <div className="min-h-screen bg-surface flex font-body text-on-surface antialiased">
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

      {/* Backdrop para móvil */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-fadeIn"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ============================================================== */}
      {/* MENU VERTICAL AL LADO IZQUIERDO (SIDEBAR ADMINISTRATIVO) */}
      {/* ============================================================== */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 md:w-64 lg:w-72 bg-white border-r border-outline-variant/30 flex flex-col shrink-0 shadow-cloud-sm transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Cabecera del Menú Lateral */}
        <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-2xl bg-primary/10">🛡️</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg text-on-surface tracking-tight">
                  Mi Bebé
                </span>
                <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-outline font-medium">Control Maestro Central</p>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-full hover:bg-surface-container text-outline"
            title="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Apartado Configurar Cuenta (Acceso Directo en Menú Lateral) */}
        <div className="p-3.5 mx-3 my-3 rounded-2xl bg-surface-container/50 border border-outline-variant/30">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-on-surface truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-outline truncate font-mono">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('account');
              setMobileSidebarOpen(false);
            }}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'account'
                ? 'bg-primary text-white shadow-cloud-sm font-bold'
                : 'bg-white hover:bg-surface-high text-on-surface border border-outline-variant/40 shadow-xs'
            }`}
          >
            <span>⚙️</span>
            <span>Configurar Cuenta</span>
          </button>
        </div>

        {/* Lista de Navegación Vertical */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-none">
          {/* Grupo 1: Supervisión Clínica y Métricas */}
          <div>
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-outline mb-1.5">
              Supervisión & Métricas
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('metrics');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'metrics'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📊</span>
                  <span>Dashboard General</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('advanced_metrics');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'advanced_metrics'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📈</span>
                  <span>Métricas Avanzadas</span>
                </div>
                {prematureCount > 0 ? (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                    ⚠️ {prematureCount}
                  </span>
                ) : (
                  <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    PRO
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('earnings');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'earnings'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💰</span>
                  <span>Tablero de Ganancias</span>
                </div>
                <span className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  COP
                </span>
              </button>
            </div>
          </div>

          {/* Grupo 2: Gestión de Usuarias y Carnet */}
          <div>
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-outline mb-1.5">
              Gestión de Usuarias
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('users');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'users'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👥</span>
                  <span>Administrar Cuentas</span>
                </div>
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {users.length}
                </span>
              </button>

              {/* Acceso directo a filtro de Carnet Prematuro */}
              {prematureCount > 0 && (
                <button
                  onClick={() => {
                    setUserStatusFilter('carnet_premature');
                    setActiveTab('users');
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <span className="text-[11px]">Carnet Prematuro</span>
                  </div>
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {prematureCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Grupo 3: Operaciones Contables & Envíos */}
          <div>
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-outline mb-1.5">
              Finanzas & Correo
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('payments');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'payments'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🧾</span>
                  <span>Comprobantes de Pago</span>
                </div>
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {payments.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('emails');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'emails'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✉️</span>
                  <span>Centro de Mensajería</span>
                </div>
              </button>
            </div>
          </div>

          {/* Grupo 4: Cuenta & Seguridad */}
          <div>
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-outline mb-1.5">
              Cuenta & Seguridad
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('account');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeTab === 'account'
                    ? 'bg-primary text-white shadow-cloud-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚙️</span>
                  <span>Configurar Cuenta</span>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Pie del Menú Lateral */}
        <div className="p-3 border-t border-outline-variant/30 space-y-1">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${refreshing ? 'animate-spin text-primary' : ''}`}>🔄</span>
              <span>Sincronizar Datos</span>
            </div>
            {refreshing && <span className="text-[10px] text-primary">Cargando...</span>}
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/admin/login', { replace: true });
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
          >
            <span>🚪</span>
            <span>Cerrar Sesión Admin</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      {/* ============================================================== */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Barra Superior */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-outline-variant/40 px-4 md:px-8 py-3.5 shadow-cloud-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-surface-container hover:bg-surface-high text-on-surface"
              title="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg md:text-xl text-on-surface tracking-tight">
                  {activeTab === 'metrics' && 'Dashboard de Métricas Operativas'}
                  {activeTab === 'advanced_metrics' && 'Inteligencia Clínica & Métricas Avanzadas'}
                  {activeTab === 'earnings' && 'Tablero Contable y Ganancias'}
                  {activeTab === 'users' && 'Administración de Cuentas y Carnet'}
                  {activeTab === 'payments' && 'Archivo de Comprobantes de Pago'}
                  {activeTab === 'emails' && 'Centro de Mensajería y Alertas'}
                  {activeTab === 'account' && 'Configuración de Cuenta & Seguridad'}
                </h1>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">
                  Panel Maestro
                </span>
              </div>
              <p className="text-xs text-outline hidden md:block">
                Plataforma integral de acompañamiento gestacional y salud neonatal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {prematureCount > 0 && (
              <button
                onClick={() => {
                  setUserStatusFilter('carnet_premature');
                  setActiveTab('users');
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
                title="Cuentas con carnet activado prematuramente"
              >
                <span>⚠️</span>
                <span>{prematureCount} Carnet Prematuro</span>
              </button>
            )}

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-surface-container text-outline transition-colors"
              title="Actualizar datos"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6 flex-1">
          {/* ============================================================== */}
          {/* TAB 1: DASHBOARD DE MÉTRICAS GENERALES */}
          {/* ============================================================== */}
          {activeTab === 'metrics' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Banner de Bienvenida */}
              <div className="bg-gradient-to-r from-primary to-[#966f80] rounded-3xl p-6 md:p-8 text-white shadow-cloud flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full">
                    Resumen Operativo en Vivo
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
                    onClick={() => setActiveTab('advanced_metrics')}
                    className="bg-white text-primary hover:bg-surface font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>📈</span>
                    <span>Ver Métricas Avanzadas</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserStatusFilter('expiring_soon');
                      setActiveTab('users');
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full backdrop-blur-sm transition-all flex items-center gap-1.5"
                  >
                    <span>⚠️</span>
                    <span>Cuentas Por Vencer ({uMetrics.expiringSoon || 0})</span>
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
                    <span>Acceso vigente a módulos clínicos</span>
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
                    Cuentas activas en base de datos
                  </p>
                </div>
              </div>

              {/* Métricas Clínicas de Gestación & Salud Infantil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div
                  onClick={() => {
                    setUserStatusFilter('gestating');
                    setActiveTab('users');
                  }}
                  className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30 hover:border-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-outline uppercase tracking-wider">
                      Mamás en Gestación
                    </span>
                    <span className="text-2xl">🤰</span>
                  </div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-primary mt-2">
                    {advGestation.pregnantMothers || gestatingCount}
                  </div>
                  <p className="text-xs text-outline mt-1">Semanas 1 a 40 con control prenatal activo</p>
                </div>

                <div
                  onClick={() => {
                    setUserStatusFilter('carnet_born');
                    setActiveTab('users');
                  }}
                  className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30 hover:border-secondary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-outline uppercase tracking-wider">
                      Bebés Nacidos (Postnatal)
                    </span>
                    <span className="text-2xl">👶</span>
                  </div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-secondary mt-2">
                    {advGestation.bornBabies || bornCount}
                  </div>
                  <p className="text-xs text-outline mt-1">Carnet activo: percentiles OMS y vacunas PAI</p>
                </div>

                <div
                  onClick={() => {
                    setUserStatusFilter('carnet_premature');
                    setActiveTab('users');
                  }}
                  className={`bg-white rounded-3xl p-6 shadow-cloud transition-all cursor-pointer ${
                    prematureCount > 0
                      ? 'border-2 border-amber-300 bg-amber-50/30 hover:bg-amber-50'
                      : 'border border-outline-variant/30 hover:border-outline'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Carnets Prematuros
                    </span>
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-amber-800 mt-2">
                    {advGestation.prematureCarnetActivations || prematureCount}
                  </div>
                  <p className="text-xs text-amber-800 mt-1">Activados antes de la semana 40 (Bloqueables)</p>
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
                    <p className="text-xs text-outline mt-1">Acceso suspendido temporalmente</p>
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
          {/* TAB 2: MÉTRICAS AVANZADAS (CLÍNICAS, RETENCIÓN & FINANCIERAS) */}
          {/* ============================================================== */}
          {activeTab === 'advanced_metrics' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Encabezado */}
              <div className="bg-gradient-to-r from-secondary to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-cloud flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-teal-200 bg-white/10 px-3 py-1 rounded-full">
                    Inteligencia Clínica & Métricas Avanzadas
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">
                    Salud Gestacional, Retención y Conversión SaaS
                  </h2>
                  <p className="text-white/90 text-sm mt-1 max-w-xl">
                    Diagnóstico en tiempo real del ciclo reproductivo, uso del carnet postnatal, monetización recurrente y auditoría médica.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      setUserStatusFilter('carnet_premature');
                      setActiveTab('users');
                    }}
                    className="bg-white text-secondary hover:bg-surface font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-sm flex items-center gap-1.5"
                  >
                    <span>⚠️</span>
                    <span>Auditar Carnets Prematuros ({prematureCount})</span>
                  </button>
                </div>
              </div>

              {/* Alerta de Activaciones Prematuras si existen */}
              {prematureCount > 0 && (
                <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-cloud-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <h4 className="font-bold text-sm text-amber-950">
                        Atención: Se detectaron {prematureCount} cuentas con Carnet Infantil activado prematuramente
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        Estas usuarias se encuentran en semanas inferiores a la 40 pero activaron el carnet por error. Puedes bloquearles el carnet con un solo clic para regresarlas al control prenatal normal de embarazo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserStatusFilter('carnet_premature');
                      setActiveTab('users');
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shrink-0 shadow-sm transition-transform active:scale-95"
                  >
                    Revisar y Bloquear Cuentas →
                  </button>
                </div>
              )}

              {/* Grid 1: Métricas de Crecimiento y Monetización */}
              <div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span>📊</span> Indicadores Clave de Plataforma (SaaS)
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* Tasa de Conversión */}
                  <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30">
                    <span className="text-xs uppercase font-bold tracking-wider text-outline">
                      Tasa de Conversión a Pago
                    </span>
                    <div className="font-display font-bold text-3xl md:text-4xl text-primary mt-3">
                      {advGrowth.conversionRate ?? (uMetrics.totalUsers ? Math.round(((uMetrics.activeSubscribers || 0) / uMetrics.totalUsers) * 100) : 0)}%
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${advGrowth.conversionRate || 15}%` }}
                      />
                    </div>
                    <p className="text-xs text-outline mt-2">Suscriptoras de pago vs total cuentas</p>
                  </div>

                  {/* MRR Proyectado */}
                  <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30">
                    <span className="text-xs uppercase font-bold tracking-wider text-outline">
                      MRR Proyectado (Mensual)
                    </span>
                    <div className="font-display font-bold text-2xl lg:text-3xl text-emerald-700 mt-3 truncate">
                      ${((uMetrics.activeSubscribers || 0) * (eMetrics.averageTicket || 50000)).toLocaleString('es-CO')}
                    </div>
                    <p className="text-xs text-outline mt-3">
                      Ingreso recurrente estimado de cuentas activas
                    </p>
                  </div>

                  {/* ARPU */}
                  <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/30">
                    <span className="text-xs uppercase font-bold tracking-wider text-outline">
                      ARPU (Ingreso Medio)
                    </span>
                    <div className="font-display font-bold text-2xl lg:text-3xl text-on-surface mt-3">
                      ${(uMetrics.totalUsers ? Math.round((eMetrics.totalRevenue || 0) / Math.max(uMetrics.totalUsers, 1)) : 0).toLocaleString('es-CO')}
                    </div>
                    <p className="text-xs text-outline mt-3">
                      Valor medio generado por usuaria registrada
                    </p>
                  </div>

                  {/* Capital en Riesgo (Vencimiento en 7 días) */}
                  <div className="bg-white rounded-3xl p-6 shadow-cloud border border-amber-200 bg-amber-50/20">
                    <span className="text-xs uppercase font-bold tracking-wider text-amber-800">
                      Capital por Vencer (≤ 7d)
                    </span>
                    <div className="font-display font-bold text-2xl lg:text-3xl text-amber-900 mt-3">
                      ${((uMetrics.expiringSoon || 0) * (eMetrics.averageTicket || 50000)).toLocaleString('es-CO')}
                    </div>
                    <p className="text-xs text-amber-700 mt-3">
                      {uMetrics.expiringSoon || 0} cuentas en alerta preventiva
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid 2: Distribución Gestacional por Trimestres */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-cloud border border-outline-variant/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                      <span>🤰</span> Distribución de Etapas Clínicas (Gestación vs Postnatal)
                    </h3>
                    <p className="text-xs text-outline">
                      Segmentación anatómica y médica de las usuarias en la plataforma
                    </p>
                  </div>
                  <div className="text-xs text-outline font-semibold">
                    Total usuarias analizadas: <strong className="text-primary">{users.length}</strong>
                  </div>
                </div>

                {/* Barra segmentada de progreso proporcional */}
                {(() => {
                  const totalG = Math.max(
                    (advGestation.trimester1Count || 0) +
                    (advGestation.trimester2Count || 0) +
                    (advGestation.trimester3Count || 0) +
                    (advGestation.bornBabies || bornCount || 1),
                    1
                  );
                  const p1 = Math.round(((advGestation.trimester1Count || 1) / totalG) * 100);
                  const p2 = Math.round(((advGestation.trimester2Count || 1) / totalG) * 100);
                  const p3 = Math.round(((advGestation.trimester3Count || 1) / totalG) * 100);
                  const pBorn = Math.round(((advGestation.bornBabies || bornCount || 1) / totalG) * 100);

                  return (
                    <div className="space-y-4">
                      <div className="w-full h-5 rounded-full bg-surface-container flex overflow-hidden shadow-inner">
                        <div style={{ width: `${Math.max(p1, 10)}%` }} className="bg-emerald-500 transition-all" title="1er Trimestre" />
                        <div style={{ width: `${Math.max(p2, 10)}%` }} className="bg-sky-500 transition-all" title="2do Trimestre" />
                        <div style={{ width: `${Math.max(p3, 10)}%` }} className="bg-amber-500 transition-all" title="3er Trimestre" />
                        <div style={{ width: `${Math.max(pBorn, 10)}%` }} className="bg-primary transition-all" title="Bebés Nacidos" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-emerald-900">1er Trimestre</span>
                          </div>
                          <div className="font-display font-bold text-xl text-emerald-800 mt-2">
                            {advGestation.trimester1Count || 0} mamás
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-1">Semanas 1 a 13 · Órganogénesis</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-sky-500" />
                            <span className="text-xs font-bold text-sky-900">2do Trimestre</span>
                          </div>
                          <div className="font-display font-bold text-xl text-sky-800 mt-2">
                            {advGestation.trimester2Count || 0} mamás
                          </div>
                          <p className="text-[11px] text-sky-700 mt-1">Semanas 14 a 27 · Crecimiento rápido</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-xs font-bold text-amber-900">3er Trimestre</span>
                          </div>
                          <div className="font-display font-bold text-xl text-amber-800 mt-2">
                            {advGestation.trimester3Count || 0} mamás
                          </div>
                          <p className="text-[11px] text-amber-700 mt-1">Semanas 28 a 40 · Maduración fetal</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-xs font-bold text-primary">Postnatal (Nacidos)</span>
                          </div>
                          <div className="font-display font-bold text-xl text-primary mt-2">
                            {advGestation.bornBabies || bornCount} bebés
                          </div>
                          <p className="text-[11px] text-primary/80 mt-1">Curvas OMS y Vacunas PAI</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Grid 3: Registros Recientes y Canales de Monetización */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nuevos Registros */}
                <div className="bg-white rounded-3xl p-6 md:p-7 shadow-cloud border border-outline-variant/40">
                  <h3 className="font-display text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span>🌱</span> Adquisición de Cuentas Recientes
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-surface-container/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-on-surface">Nuevos registros en los últimos 7 días</div>
                        <div className="text-[11px] text-outline mt-0.5">Última semana móvil</div>
                      </div>
                      <span className="font-display font-bold text-2xl text-primary">
                        +{advGrowth.newUsersLast7Days || users.filter(u => new Date(u.createdAt) >= new Date(Date.now() - 7*86400000)).length}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-surface-container/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-on-surface">Nuevos registros en los últimos 30 días</div>
                        <div className="text-[11px] text-outline mt-0.5">Mes en curso</div>
                      </div>
                      <span className="font-display font-bold text-2xl text-secondary">
                        +{advGrowth.newUsersLast30Days || users.filter(u => new Date(u.createdAt) >= new Date(Date.now() - 30*86400000)).length}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-surface-container/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-on-surface">Tasa de abandono (Churn Rate)</div>
                        <div className="text-[11px] text-outline mt-0.5">Cuentas que caducaron sin renovación</div>
                      </div>
                      <span className="font-display font-bold text-2xl text-rose-700">
                        {uMetrics.totalUsers ? Math.round(((uMetrics.expiredSubscribers || 0) / uMetrics.totalUsers) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen de Canales de Cobro */}
                <div className="bg-white rounded-3xl p-6 md:p-7 shadow-cloud border border-outline-variant/40">
                  <h3 className="font-display text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span>💳</span> Desglose de Recaudación por Medio de Pago
                  </h3>

                  <div className="space-y-3">
                    {(eMetrics.revenueByMethod || []).map((method) => {
                      const totalM = eMetrics.totalRevenue || 1;
                      const pct = Math.round((method.totalAmount / totalM) * 100);
                      return (
                        <div key={method.method} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{method.method}</span>
                            <span className="font-mono font-bold text-emerald-800">
                              ${method.totalAmount.toLocaleString('es-CO')} COP ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!eMetrics.revenueByMethod || eMetrics.revenueByMethod.length === 0) && (
                      <p className="text-xs text-outline py-4 text-center">Sin recaudación registrada aún.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: TABLERO DE GANANCIAS */}
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
                          <span className="text-outline font-medium">{method.method}</span>
                          <span className="font-bold text-on-surface">
                            ${method.totalAmount.toLocaleString('es-CO')} ({method.count})
                          </span>
                        </div>
                      ))}
                      {(!eMetrics.revenueByMethod || eMetrics.revenueByMethod.length === 0) && (
                        <p className="text-xs text-outline py-2">Sin pagos registrados aún.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40">
                    <h3 className="font-display text-base font-bold text-on-surface mb-3">
                      Distribución por Plan
                    </h3>
                    <div className="space-y-3">
                      {(eMetrics.revenueByPlan || []).map((plan) => (
                        <div key={plan.plan} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-outline font-medium">{plan.plan}</span>
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
          {/* TAB 4: ADMINISTRAR CUENTAS (USUARIOS & CONTROL DE CARNET) */}
          {/* ============================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                    Administración de Cuentas y Carnet Infantil
                  </h2>
                  <p className="text-sm text-outline">
                    Control de accesos, bloqueo/desbloqueo de cuentas, reversión del carnet infantil prematuro y renovación de planes
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

                {/* Filtro por Estado (Píldoras) con Filtros Clínicos de Carnet */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: 'all', label: 'Todas las Cuentas', count: users.filter(u => !u.isDeleted).length },
                    { key: 'active', label: 'Activas', count: uMetrics.activeSubscribers || 0, badge: '🟢' },
                    { key: 'expiring_soon', label: 'Por Vencer (≤7d)', count: uMetrics.expiringSoon || 0, badge: '🟡' },
                    { key: 'expired', label: 'Vencidas', count: uMetrics.expiredSubscribers || 0, badge: '🔴' },
                    { key: 'free', label: 'Gratuitas', count: uMetrics.freeUsers || 0, badge: '🌱' },
                    { key: 'carnet_premature', label: '⚠️ Carnet Prematuro', count: prematureCount, badge: '⚠️', highlight: prematureCount > 0 },
                    { key: 'carnet_born', label: '👶 Bebé Nacido', count: bornCount, badge: '👶' },
                    { key: 'gestating', label: '🤰 En Gestación', count: gestatingCount, badge: '🤰' },
                    { key: 'carnet_blocked', label: '🔒 Carnet Bloqueado', count: carnetLockedCount, badge: '🔒' },
                    { key: 'blocked', label: 'Bloqueadas', count: uMetrics.blockedUsers || 0, badge: '🚫' },
                    { key: 'deleted', label: 'Eliminadas', count: uMetrics.deletedUsers || 0, badge: '🗑️' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setUserStatusFilter(f.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        userStatusFilter === f.key
                          ? 'bg-primary text-white shadow-sm'
                          : f.highlight
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
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
                        <th className="py-3.5 px-4">Etapa / Carnet</th>
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

                            {/* Etapa Gestacional / Estado del Carnet Infantil */}
                            <td className="py-3.5 px-4 text-xs">
                              {u.babyStatus?.isPrematurelyActivated ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>Carnet Prematuro (Sem {u.babyStatus.gestationalWeek})</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenCarnetModal(u)}
                                    className="text-[10px] text-amber-800 hover:underline font-bold flex items-center gap-0.5"
                                  >
                                    <span>🔒 Bloquear / Volver a Gestación</span>
                                  </button>
                                </div>
                              ) : u.babyStatus?.carnetLockedByAdmin ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                                    <span>🔒</span>
                                    <span>Carnet Bloqueado (Sem {u.babyStatus?.gestationalWeek ?? '?'})</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenCarnetModal(u)}
                                    className="text-[10px] text-primary hover:underline font-bold"
                                  >
                                    <span>🔓 Habilitar Carnet</span>
                                  </button>
                                </div>
                              ) : u.babyStatus?.isBorn ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    👶 Bebé Nacido (Carnet Activo)
                                  </span>
                                </div>
                              ) : u.babyStatus?.hasBaby ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
                                  🤰 Gestación (Sem {u.babyStatus.gestationalWeek ?? '?'})
                                </span>
                              ) : (
                                <span className="text-outline text-xs italic">Sin ficha activa</span>
                              )}
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
                                {/* Bloquear / Desbloquear Carnet de Bebé */}
                                {!isSelf && !u.isDeleted && u.babyStatus?.hasBaby && (
                                  <button
                                    onClick={() => handleOpenCarnetModal(u)}
                                    className={`p-2 rounded-full transition-colors ${
                                      u.babyStatus?.isPrematurelyActivated || u.babyStatus?.isBorn
                                        ? 'text-amber-800 bg-amber-100 hover:bg-amber-200'
                                        : u.babyStatus?.carnetLockedByAdmin
                                        ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                        : 'text-outline hover:bg-surface-container'
                                    }`}
                                    title={
                                      u.babyStatus?.isBorn
                                        ? 'Bloquear carnet de bebé para esta cuenta (Volver a gestación)'
                                        : u.babyStatus?.carnetLockedByAdmin
                                        ? 'Desbloquear carnet de salud infantil'
                                        : 'Gestionar carnet de salud del bebé'
                                    }
                                  >
                                    {u.babyStatus?.carnetLockedByAdmin ? '🔓' : '🔒'}
                                  </button>
                                )}

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

                                {/* Bloquear / Desbloquear Cuenta */}
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
                          <td colSpan="8" className="py-12 text-center text-outline">
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
          {/* TAB 5: COMPROBANTES DE PAGO */}
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
                                <div className="font-semibold text-xs text-on-surface">
                                  {p.user.firstName} {p.user.lastName}
                                </div>
                                <div className="text-[11px] text-outline">{p.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-outline italic">Sin asociar a usuaria</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {p.paymentMethod || 'Nequi'}
                              </span>
                              <span className="text-[11px] uppercase font-bold text-outline">
                                {p.plan}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            ${(p.amount || 0).toLocaleString('es-CO')} COP
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="p-1.5 rounded-full hover:bg-error-container/30 text-error transition-colors"
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
                            No se encontraron comprobantes registrados.
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
          {/* TAB 6: CENTRO DE MENSAJERÍA DIRECTA Y MASIVA */}
          {/* ============================================================== */}
          {activeTab === 'emails' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
                    Centro de Mensajería y Correo Masivo
                  </h2>
                  <p className="text-sm text-outline">
                    Comunícate con tus usuarias a través de Gmail SMTP para renovaciones, bienvenida y soporte
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEmailModal()}
                  className="bg-primary text-white font-semibold text-sm px-5 py-3 rounded-full shadow-cloud-sm flex items-center gap-2 hover:opacity-95 transition-transform active:scale-95"
                >
                  <span>✉️</span>
                  <span>Redactar Nuevo Mensaje</span>
                </button>
              </div>

              {/* Plantillas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40 flex flex-col justify-between">
                  <div>
                    <span className="text-xl">🟡</span>
                    <h4 className="font-display font-bold text-base text-on-surface mt-2">
                      Recordatorio de Vencimiento
                    </h4>
                    <p className="text-xs text-outline mt-1 leading-relaxed">
                      Envía un correo preventivo a las usuarias que vencen en los próximos 7 días invitándolas a transferir por Nequi/Daviplata.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEmailForm({
                        targetType: 'group',
                        userId: '',
                        toEmail: '',
                        recipientName: '',
                        groupFilter: 'expiring_soon',
                        subject: 'Tu suscripción a Mi Bebé está por finalizar',
                        message: 'Hola! Notamos que tu plan en Mi Bebé está por finalizar. Para continuar disfrutando de tu carnet pediátrico, controles y fotos, transfiere por Nequi o Daviplata al 3122031777.',
                        buttonText: 'Renovar por WhatsApp',
                        buttonUrl: 'https://wa.me/573122031777',
                      });
                      setEmailModalOpen(true);
                    }}
                    className="mt-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold py-2 px-4 rounded-full transition-colors self-start"
                  >
                    Usar Plantilla de Vencimiento
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40 flex flex-col justify-between">
                  <div>
                    <span className="text-xl">✅</span>
                    <h4 className="font-display font-bold text-base text-on-surface mt-2">
                      Confirmación de Activación
                    </h4>
                    <p className="text-xs text-outline mt-1 leading-relaxed">
                      Avisa a una usuaria que su comprobante de pago fue revisado y sus módulos han sido habilitados con éxito.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEmailForm({
                        targetType: 'group',
                        userId: '',
                        toEmail: '',
                        recipientName: '',
                        groupFilter: 'active',
                        subject: '¡Tu suscripción ha sido confirmada en Mi Bebé!',
                        message: '¡Excelente noticia! Hemos verificado tu comprobante exitosamente y tu suscripción a Mi Bebé está activa. Ya puedes disfrutar de todos tus módulos clínicos y carnet sin límites.',
                        buttonText: 'Abrir Mi Bebé',
                        buttonUrl: 'https://mibebe.app/inicio',
                      });
                      setEmailModalOpen(true);
                    }}
                    className="mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold py-2 px-4 rounded-full transition-colors self-start"
                  >
                    Usar Plantilla de Activación
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40 flex flex-col justify-between">
                  <div>
                    <span className="text-xl">💌</span>
                    <h4 className="font-display font-bold text-base text-on-surface mt-2">
                      Mensaje de Acompañamiento
                    </h4>
                    <p className="text-xs text-outline mt-1 leading-relaxed">
                      Dedica unas palabras de ánimo y seguimiento a todas tus usuarias en gestación o con bebés nacidos.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEmailForm({
                        targetType: 'group',
                        userId: '',
                        toEmail: '',
                        recipientName: '',
                        groupFilter: 'active',
                        subject: 'Un saludo especial del equipo de Mi Bebé',
                        message: 'Esperamos que tú y tu bebé se encuentren muy bien. Recuerda registrar tus controles prenatales, consultar las curvas de crecimiento y tomar nota de cada momento especial.',
                        buttonText: 'Ir a mi Control',
                        buttonUrl: 'https://mibebe.app/inicio',
                      });
                      setEmailModalOpen(true);
                    }}
                    className="mt-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold py-2 px-4 rounded-full transition-colors self-start"
                  >
                    Usar Plantilla de Saludo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: CONFIGURACIÓN DE CUENTA DE ADMINISTRADOR */}
          {/* ============================================================== */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-fadeIn max-w-5xl">
              {/* Encabezado del Apartado */}
              <div className="bg-gradient-to-r from-primary to-[#8c6776] rounded-3xl p-6 md:p-8 text-white shadow-cloud flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full">
                      Perfil de Administrador
                    </span>
                    <span className="text-xs font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                      Acceso Maestro
                    </span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">
                    Configuración de Cuenta & Seguridad
                  </h2>
                  <p className="text-white/90 text-sm mt-1 max-w-xl leading-relaxed">
                    Gestiona tus datos de contacto registrados, actualiza tu nombre y cambia tu contraseña de acceso administrativo con máxima seguridad.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[200px]">
                  <div className="w-14 h-14 mx-auto rounded-full bg-white text-primary font-bold text-2xl flex items-center justify-center shadow-md mb-2">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="font-bold text-sm text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[11px] text-white/80 font-mono truncate">
                    {user?.email}
                  </div>
                  <span className="inline-block mt-2 text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Rol: {user?.role || 'admin'}
                  </span>
                </div>
              </div>

              {/* Contenedor de 2 Columnas: Datos Registrados + Cambio de Contraseña */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* -------------------------------------------------------- */}
                {/* BLOQUE 1: DATOS REGISTRADOS DEL ADMINISTRADOR */}
                {/* -------------------------------------------------------- */}
                <div className="bg-white rounded-3xl p-6 md:p-7 shadow-cloud border border-outline-variant/40 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-on-surface">
                        Datos Registrados
                      </h3>
                      <p className="text-xs text-outline">
                        Información personal asociada a tu perfil en el sistema
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1.5">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          placeholder="Tu nombre"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1.5">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          placeholder="Tu apellido"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Teléfono / Celular de Contacto
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-outline">
                          📞
                        </span>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="Ej: 312 000 0000"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-on-surface">
                          Correo Electrónico (Login)
                        </label>
                        <span className="text-[10px] text-outline font-medium">
                          No modificable por seguridad
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-outline">
                          ✉️
                        </span>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container/80 text-xs font-mono font-medium text-outline cursor-not-allowed select-all"
                        />
                      </div>
                      <p className="text-[11px] text-outline mt-1.5 leading-relaxed">
                        Este correo es tu identificador maestro de sesión y recuperación del panel administrativo.
                      </p>
                    </div>

                    {/* Resumen de Estado de la Cuenta */}
                    <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-outline">Rol en el Sistema:</span>
                        <span className="font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full text-[10px]">
                          {user?.role || 'admin'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-outline">Estado de Cuenta:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                          Verificada & Activa
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-outline">ID de Administrador:</span>
                        <span className="font-mono text-[10px] text-outline truncate max-w-[180px]">
                          {user?.id || '—'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full bg-primary hover:opacity-95 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-cloud-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    >
                      <span>{savingProfile ? '⏳' : '💾'}</span>
                      <span>{savingProfile ? 'Guardando Cambios...' : 'Guardar Cambios de Perfil'}</span>
                    </button>
                  </form>
                </div>

                {/* -------------------------------------------------------- */}
                {/* BLOQUE 2: CAMBIO DE CONTRASEÑA */}
                {/* -------------------------------------------------------- */}
                <div className="bg-white rounded-3xl p-6 md:p-7 shadow-cloud border border-outline-variant/40 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-xl">
                      🔒
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-on-surface">
                        Cambio de Contraseña
                      </h3>
                      <p className="text-xs text-outline">
                        Actualiza tu clave de acceso con validación criptográfica segura
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Contraseña Actual *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="Tu contraseña actual"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-sm"
                          title={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showCurrentPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Nueva Contraseña * (Mínimo 8 caracteres)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Nueva contraseña segura"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-sm"
                          title={showNewPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showNewPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Confirmar Nueva Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Repite la nueva contraseña"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-sm"
                          title={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {/* Guía de Requisitos */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <span>🛡️</span>
                        <span>Recomendaciones de Seguridad:</span>
                      </div>
                      <ul className="text-[11px] text-amber-800/90 space-y-1 list-disc list-inside">
                        <li>Longitud mínima de 8 caracteres.</li>
                        <li>Combina letras mayúsculas, minúsculas, números y símbolos.</li>
                        <li>Nunca compartas tus credenciales maestras con terceros.</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-cloud-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    >
                      <span>{changingPassword ? '⏳' : '🔒'}</span>
                      <span>{changingPassword ? 'Actualizando Contraseña...' : 'Actualizar Contraseña'}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Tarjeta de Seguridad y Sesión Activa */}
              <div className="bg-white rounded-3xl p-6 shadow-cloud border border-outline-variant/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                    🛡️
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-sm text-on-surface">
                      Sesión de Administrador Segura
                    </h4>
                    <p className="text-xs text-outline">
                      Conexión encriptada mediante JWT de alta vigencia y protección de rutas con AdminGuard.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/admin/login', { replace: true });
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors shrink-0"
                >
                  Cerrar Sesión Segura
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR COMPROBANTE DE PAGO */}
      {/* ============================================================== */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-outline-variant/40 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-display font-bold text-xl text-on-surface">
                Guardar Comprobante de Pago
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-outline text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4 pt-4">
              <div>
                <label className="field-label">Número de Transacción / Referencia *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.transactionNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionNumber: e.target.value })}
                  placeholder="Ej: M12345678 o 987654321"
                  className="input-field font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Fecha y Hora de la Transferencia *</label>
                  <input
                    type="datetime-local"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="field-label">Teléfono de quien Transfirió *</label>
                  <input
                    type="tel"
                    required
                    value={paymentForm.phone}
                    onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                    placeholder="312 000 0000"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Cuenta de Usuario Asociada (Opcional)</label>
                <select
                  value={paymentForm.userId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, userId: e.target.value })}
                  className="input-field text-xs"
                >
                  <option value="">-- Sin asociar / Seleccionar luego --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email}) - {u.phone || 'Sin tel'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="field-label">Monto ($ COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value, 10) || 0 })}
                    className="input-field text-sm font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="field-label">Plan a Asignar</label>
                  <select
                    value={paymentForm.plan}
                    onChange={(e) => setPaymentForm({ ...paymentForm, plan: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="full">Plan Libre (Total)</option>
                    <option value="salud">Plan Salud</option>
                    <option value="basico">Plan Básico</option>
                    <option value="vip">Acceso VIP</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Medio de Pago</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="input-field text-xs"
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
      {/* MODAL: BLOQUEAR / RESTABLECER CARNET DE SALUD INFANTIL */}
      {/* ============================================================== */}
      {carnetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-outline-variant/40 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 rounded-2xl bg-amber-100">🔒</span>
                <div>
                  <h3 className="font-display font-bold text-lg text-on-surface">
                    Control de Carnet de Bebé Nacido
                  </h3>
                  <p className="text-xs text-outline truncate max-w-[280px]">
                    Cuenta: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setCarnetModalOpen(false)} className="text-outline text-lg font-bold p-1">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-on-surface">
              {/* Diagnóstico clínico actual de la cuenta */}
              <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-outline font-semibold">Estado de gestación actual:</span>
                  <span className="font-bold text-primary">
                    Semana {selectedUser.babyStatus?.gestationalWeek ?? 'Desconocida'} de 40
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-outline font-semibold">Carnet de salud infantil:</span>
                  <span className={`font-bold ${selectedUser.babyStatus?.isBorn ? 'text-amber-800' : 'text-on-surface'}`}>
                    {selectedUser.babyStatus?.isBorn ? '⚠️ ACTIVADO (Marcado como nacido)' : 'En espera / Gestación'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-outline font-semibold">Bloqueo administrativo:</span>
                  <span className={`font-bold ${selectedUser.babyStatus?.carnetLockedByAdmin ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {selectedUser.babyStatus?.carnetLockedByAdmin ? 'SÍ (Actualmente bloqueado)' : 'NO'}
                  </span>
                </div>
              </div>

              {/* Explicación médica y operativa */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-on-surface leading-relaxed">
                <p className="font-semibold text-amber-900 mb-1">
                  ¿Por qué bloquear este carnet?
                </p>
                <p className="text-amber-900/90 text-[11px]">
                  Muchas usuarias activan por curiosidad o error el botón <em>"¡Mi bebé ya nació!"</em> cuando aún están en el 1er, 2do o 3er trimestre de embarazo. Al bloquear el carnet:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px] text-amber-900/90">
                  <li>Se desactiva la condición de nacido (<code>isBorn: false</code>).</li>
                  <li>La cuenta vuelve de inmediato al <strong>seguimiento prenatal de gestación</strong> (pataditas, FCF y ecografías).</li>
                  <li>El carnet pediátrico OMS y vacunas PAI quedará en espera hasta que realmente ocurra el parto.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setCarnetModalOpen(false)}
                className="btn-ghost !w-auto !px-4 !py-2.5 text-xs"
              >
                Cancelar
              </button>

              {selectedUser.babyStatus?.isBorn || !selectedUser.babyStatus?.carnetLockedByAdmin ? (
                <button
                  type="button"
                  onClick={() => handleToggleBabyCarnet(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-cloud-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🔒</span>
                  <span>Bloquear Carnet (Volver a Gestación)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleBabyCarnet(false)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-cloud-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🔓</span>
                  <span>Desbloquear / Habilitar Carnet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ENVIAR CORREO ELECTRÓNICO */}
      {/* ============================================================== */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-outline-variant/40 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-display font-bold text-xl text-on-surface">
                Enviar Correo Electrónico
              </h3>
              <button onClick={() => setEmailModalOpen(false)} className="text-outline text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4 pt-4">
              <div>
                <label className="field-label">Destinatario</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={emailForm.targetType === 'single'}
                      onChange={() => setEmailForm({ ...emailForm, targetType: 'single' })}
                    />
                    <span>Usuaria Individual</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={emailForm.targetType === 'group'}
                      onChange={() => setEmailForm({ ...emailForm, targetType: 'group' })}
                    />
                    <span>Envío Masivo por Grupo</span>
                  </label>
                </div>

                {emailForm.targetType === 'single' ? (
                  <input
                    type="email"
                    required
                    value={emailForm.toEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="input-field text-sm"
                  />
                ) : (
                  <select
                    value={emailForm.groupFilter}
                    onChange={(e) => setEmailForm({ ...emailForm, groupFilter: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="expiring_soon">Usuarias con suscripción por vencer (≤ 7 días)</option>
                    <option value="expired">Usuarias con suscripción vencida</option>
                    <option value="active">Todas las usuarias activas / VIP</option>
                  </select>
                )}
              </div>

              <div>
                <label className="field-label">Asunto del Correo *</label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Asunto llamativo y claro..."
                  className="input-field text-sm font-semibold"
                />
              </div>

              <div>
                <label className="field-label">Mensaje *</label>
                <textarea
                  rows="5"
                  required
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Escribe el cuerpo del correo..."
                  className="input-field text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Texto del Botón</label>
                  <input
                    type="text"
                    value={emailForm.buttonText}
                    onChange={(e) => setEmailForm({ ...emailForm, buttonText: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="field-label">URL del Botón</label>
                  <input
                    type="url"
                    value={emailForm.buttonUrl}
                    onChange={(e) => setEmailForm({ ...emailForm, buttonUrl: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="btn-ghost !w-auto !px-5 !py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary !w-auto !px-7 !py-2.5 text-xs"
                >
                  Enviar Mensaje
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
