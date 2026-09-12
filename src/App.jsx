import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AlarmProvider } from "./context/AlarmContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import GuestExplore from "./pages/GuestExplore";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import PregnancyTimeline from "./pages/PregnancyTimeline";
import BabyPage from "./pages/BabyPage";
import PostnatalCarnetPage from "./pages/PostnatalCarnetPage";
import PartnerPage from "./pages/PartnerPage";
import Album from "./pages/Album";
import Journal from "./pages/Journal";
import Symptoms from "./pages/Symptoms";
import MedicalControls from "./pages/MedicalControls";
import Medications from "./pages/Medications";
import Reminders from "./pages/Reminders";
import Documents from "./pages/Documents";
import Countdown from "./pages/Countdown";
import Profile from "./pages/Profile";
import { MomCarePage, BabyCarePage } from "./pages/ContentPages";
import BabyDevelopmentGuide from "./pages/BabyDevelopmentGuide";
import TermsPage from "./pages/TermsPage";
import EmotionalWellbeingPage from "./pages/EmotionalWellbeingPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlarmProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/iniciar-sesion" element={<Login />} />
            <Route path="/crear-cuenta" element={<Register />} />
            <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
            <Route path="/restablecer-contrasena" element={<ResetPassword />} />
            <Route path="/terminos-y-condiciones" element={<TermsPage />} />
            <Route path="/explorar/*" element={<GuestExplore />} />

            <Route
              path="/configuracion-inicial"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inicio"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="calendario"
                    moduleName="Calendario de Embarazo"
                  >
                    <CalendarPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mi-embarazo"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="embarazo_timeline"
                    moduleName="Línea de Tiempo del Embarazo"
                  >
                    <PregnancyTimeline />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mi-bebe"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="gestacion"
                    moduleName="Mi Bebé en Gestación"
                  >
                    <BabyPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/carnet-bebe"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="carnet_bebe"
                    moduleName="Carnet de Salud Infantil"
                  >
                    <PostnatalCarnetPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bebe-nacido"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="carnet_bebe"
                    moduleName="Carnet de Salud Infantil"
                  >
                    <PostnatalCarnetPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/papa"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="papa"
                    moduleName="Módulo de Papá y Pareja"
                  >
                    <PartnerPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />

            {/* Módulos con restricción de suscripción para nuevos usuarios */}
            <Route
              path="/album"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="album"
                    moduleName="Álbum de Fotos"
                  >
                    <Album />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/diario"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="diario"
                    moduleName="Diario de Emociones"
                  >
                    <Journal />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controles"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="control_medico"
                    moduleName="Control Médico"
                  >
                    <MedicalControls />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recordatorios"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="recordatorios"
                    moduleName="Recordatorios"
                  >
                    <Reminders />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documentos"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="documentos"
                    moduleName="Documentos y Ecografías"
                  >
                    <Documents />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bienestar-emocional"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="test_emocional"
                    moduleName="Test Emocional"
                  >
                    <EmotionalWellbeingPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-emocional"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="test_emocional"
                    moduleName="Test Emocional"
                  >
                    <EmotionalWellbeingPage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />

            {/* Módulos estándar gratuitos: Medicamentos, Síntomas y Guía de Desarrollo */}
            <Route
              path="/medicamentos"
              element={
                <ProtectedRoute>
                  <Medications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sintomas"
              element={
                <ProtectedRoute>
                  <Symptoms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guia-desarrollo"
              element={
                <ProtectedRoute>
                  <BabyDevelopmentGuide />
                </ProtectedRoute>
              }
            />

            {/* Módulos restringidos por suscripción */}
            <Route
              path="/cuenta-regresiva"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="cuenta_regresiva"
                    moduleName="Cuenta Regresiva"
                  >
                    <Countdown />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cuidados-mama"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="cuidados_mama"
                    moduleName="Cuidados de Mamá"
                  >
                    <MomCarePage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cuidados-bebe"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard
                    moduleKey="cuidados_bebe"
                    moduleName="Cuidados del Bebé"
                  >
                    <BabyCarePage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Welcome />} />
          </Routes>
        </AlarmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
