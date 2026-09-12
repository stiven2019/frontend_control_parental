# 🤖 AI Handoff & Technical Project Summary — Mi Bebé (Control Prenatal y Salud Infantil)

> **Documento para Desarrolladores e Inteligencias Artificiales.**
> Resume el estado actual del proyecto, la arquitectura técnica, las convenciones de código, la gestión de suscripciones y los puntos de extensión para continuar el desarrollo sin fricción.

---

## 📌 Resumen Ejecutivo del Proyecto

**Mi Bebé** es una plataforma integral que acompaña a las madres gestantes, sus parejas y familias durante las 40 semanas de embarazo y la etapa postnatal del recién nacido (0 a 24 meses).

El proyecto está compuesto por:
- **Frontend SPA (`frontend_control_prenatal`)**: React 19, Vite, Tailwind CSS v4, Web Audio API, Web Workers para alarmas en segundo plano y React Router DOM v7.
- **Backend API REST (`backend_control_prenatal`)**: Node.js, Express, PostgreSQL con Sequelize, autenticación JWT y Nodemailer configurado con Gmail SMTP.

---

## 🏛️ Arquitectura Técnica y Flujo de Datos

### 1. Autenticación, Seguridad y Recuperación (`src/context/AuthContext.jsx` & `src/api/client.js`)
- **Almacenamiento de Token**: El JWT se almacena en `localStorage` bajo `mibebe_token`.
- **Inyección Automática**: `client.js` inyecta `Authorization: Bearer <token>` en todas las peticiones autenticadas.
- **Onboarding Obligatorio**: Si la API retorna `{ needsSetup: true }`, la aplicación redirige de inmediato a `/configuracion-inicial`.
- **Recuperación de Contraseña con Caducidad (15 min)**:
  - Endpoints: `POST /api/auth/forgot-password-email` y `POST /api/auth/forgot-password-whatsapp`.
  - Tokens JWT estrictos con vigencia de 15 minutos (`expiresIn: '15m'`).
  - Frontend (`ForgotPassword.jsx` & `ResetPassword.jsx`) con temporizador regresivo dinámico en vivo.
  - Envío automático de correo con **Gmail SMTP** sanitizado en backend (`pass.replace(/\s+/g, '')`).

### 2. Sistema de Suscripción y Módulos (`SubscriptionGuard.jsx` & `SubscriptionModal.jsx`)
La aplicación cuenta con control de acceso por suscripción a nivel de ruta y navegación.

#### A. Módulos 100% Gratuitos (Sin Suscripción Requerida)
- 💊 **Medicamentos** (`/medicamentos`)
- 📋 **Síntomas** (`/sintomas`)
- 🌱 **Guía de Desarrollo Fetal** (`/guia-desarrollo`)
- 🏠 **Inicio / Dashboard** (`/inicio`)
- 👤 **Perfil de Usuario** (`/perfil`)

#### B. Módulos Restringidos bajo Suscripción
Todos los demás módulos están protegidos mediante `<SubscriptionGuard moduleKey="..." moduleName="...">`:
- `gestacion`: Mi Bebé en Gestación (`/mi-bebe`)
- `carnet_bebe`: Carnet de Salud Infantil del Bebé Nacido (`/carnet-bebe`, `/bebe-nacido`)
- `control_medico`: Controles Médicos Prenatales y Pediátricos (`/controles`)
- `recordatorios`: Recordatorios y Alarmas (`/recordatorios`)
- `calendario`: Calendario de Citas y Embarazo (`/calendario`)
- `embarazo_timeline`: Línea de Tiempo del Embarazo (`/mi-embarazo`)
- `album`: Álbum de Fotos del Embarazo y del Bebé (`/album`)
- `documentos`: Documentos Clínicos y Ecografías (`/documentos`)
- `test_emocional`: Test de Bienestar Emocional Materno (`/bienestar-emocional`, `/test-emocional`)
- `diario`: Diario de Emociones y Notas (`/diario`)
- `papa`: Módulo de Papá / Pareja (`/papa`)
- `cuenta_regresiva`: Cuenta Regresiva al Parto (`/cuenta-regresiva`)
- `cuidados_mama`: Guía de Cuidados de Mamá (`/cuidados-mama`)
- `cuidados_bebe`: Guía de Cuidados del Bebé (`/cuidados-bebe`)

#### C. Array de Configuración de Módulos (Base de Datos y Frontend)
```javascript
// Array de todos los módulos bloqueables
export const ALL_LOCKABLE_MODULES = [
  'gestacion', 'carnet_bebe', 'control_medico', 'recordatorios',
  'calendario', 'embarazo_timeline', 'album', 'documentos',
  'test_emocional', 'diario', 'papa', 'cuenta_regresiva',
  'cuidados_mama', 'cuidados_bebe'
];

// Comodín para acceso VIP / Total
user.unlockedModules = ['*']; // o user.plan = 'full'
```

#### D. Planes de Suscripción Equivalentes
- **Plan VIP Toda la App ($50.000 COP/mes)**: Acceso total (`['*']`).
- **Plan Gestación y Bebé Nacido ($30.000 COP/mes)**: Clínico (`gestacion`, `carnet_bebe`, `control_medico`, `recordatorios`, `calendario`, `embarazo_timeline`, `test_emocional`).
- **Plan Esencial Médico ($15.000 COP/mes)**: Básico (`gestacion`, `control_medico`, `recordatorios`, `calendario`).

---

### 3. Separación de Etapas: Gestación vs. Bebé Nacido

Para evitar cualquier ambigüedad clínica, la aplicación separa con estrictez el embarazo del recién nacido:

1. **Mi Bebé en Gestación (`/mi-bebe` - `BabyPage.jsx`)**:
   - Solo métricas prenatales: desarrollo fetal intrauterino semana a semana, tamaño comparativo, FCF (Frecuencia Cardíaca Fetal en lpm), altura uterina del control prenatal, contador de pataditas en el vientre materno y estimulación auditiva con melodía relajante.
2. **Carnet de Salud Infantil (`/carnet-bebe` - `PostnatalCarnetPage.jsx` & `BornBabyCarnet.jsx`)**:
   - Solo métricas postparto del recién nacido: fecha y hora de parto, peso, talla y perímetro cefálico al nacer, tipo de parto y grupo sanguíneo.
   - **Curvas de Crecimiento OMS (0 a 24 meses)**: Diagnósticos de peso/edad, talla/edad, perímetro cefálico e IMC infantil comparados con tablas OMS para niñas y niños.
   - **Carnet de Vacunación PAI (Colombia)**: 20 dosis programadas con checklist, fecha de aplicación y botón directo de alarma/recordatorio para cada vacuna.
   - **Hitos de Neurodesarrollo (EAD)**: Motricidad gruesa, fina, audición/lenguaje y personal social.
   - **Controles Pediátricos**: Bitácora de visitas con peso, talla, perímetro cefálico y recomendaciones del pediatra.
   - **Cuidados del Bebé Nacido**: 9 guías clínicas con recomendaciones de la AAP y MinSalud (cordón umbilical, lactancia materna, sueño seguro SMSL, higiene, dermatitis del pañal, cólicos/gases, vitamina D 400 UI, tummy time y signos de alarma neonatal).

---

### 4. Sistema de Alarmas y Recordatorios en Segundo Plano (`AlarmContext.jsx`, Web Workers y `soundAlarm.js`)

- **Web Worker Anti-Throttling**: Ejecuta un temporizador continuo en segundo plano independiente para evitar que el navegador reduzca la frecuencia de los temporizadores cuando la pestaña está minimizada o inactiva.
- **Web Audio API + Melodías PCM**: Generación de tonos armónicos mediante osciladores sintetizados y buffer WAV para alertar con el sonido de cuna o campana seleccionada.
- **Notificaciones Nativas**: Utiliza la `Notification API` con opción `requireInteraction: true` y parpadeo del título de la ventana.
- **Categorías de Alarmas Soportadas**:
  - `vacuna_bebe` (💉), `control_pediatrico` (🩺), `cuidado_bebe` (👶), `vitamina_bebe` (🥄), `medicamento` (💊), `control_medico` (🩺), `ecografia` (📷), `cita` (📅).

---

## 🗺️ Mapa Completo de Rutas y Páginas

| Ruta | Componente | Acceso | Módulo Key | Descripción |
|---|---|---|---|---|
| `/` | `Welcome.jsx` | Público | — | Landing de bienvenida |
| `/iniciar-sesion` | `Login.jsx` | Público | — | Inicio de sesión |
| `/crear-cuenta` | `Register.jsx` | Público | — | Registro |
| `/recuperar-contrasena` | `ForgotPassword.jsx` | Público | — | Recuperación Gmail / WhatsApp (15m) |
| `/restablecer-contrasena`| `ResetPassword.jsx` | Público | — | Cambio de contraseña con token |
| `/terminos-y-condiciones`| `TermsPage.jsx` | Público | — | Términos legales de salud |
| `/explorar/*` | `GuestExplore.jsx` | Público | — | Modo invitado |
| `/configuracion-inicial`| `Onboarding.jsx` | Autenticado | — | Configuración inicial FUR / ecografía |
| `/inicio` | `Dashboard.jsx` | **Gratuito** | — | Panel principal con resumen y accesos |
| `/medicamentos` | `Medications.jsx` | **Gratuito** | `medicamentos` | Dosis y tomas de medicamentos |
| `/sintomas` | `Symptoms.jsx` | **Gratuito** | `sintomas` | Registro de síntomas y malestares |
| `/guia-desarrollo` | `BabyDevelopmentGuide.jsx` | **Gratuito** | `guia_desarrollo`| Guía fetal semana a semana |
| `/perfil` | `Profile.jsx` | **Gratuito** | — | Ajustes de cuenta y sonido de alarmas |
| `/mi-bebe` | `BabyPage.jsx` | Suscripción | `gestacion` | Feto en gestación, pataditas y FCF |
| `/carnet-bebe` | `PostnatalCarnetPage.jsx` | Suscripción | `carnet_bebe` | Carnet de salud infantil y vacunas |
| `/calendario` | `CalendarPage.jsx` | Suscripción | `calendario` | Calendario mensual de citas |
| `/mi-embarazo` | `PregnancyTimeline.jsx` | Suscripción | `embarazo_timeline`| Línea de tiempo de 40 semanas |
| `/papa` | `PartnerPage.jsx` | Suscripción | `papa` | Acompañamiento del padre/pareja |
| `/album` | `Album.jsx` | Suscripción | `album` | Álbum fotográfico y ecografías |
| `/diario` | `Journal.jsx` | Suscripción | `diario` | Diario íntimo de emociones |
| `/controles` | `MedicalControls.jsx` | Suscripción | `control_medico` | Consultas médicas prenatales |
| `/recordatorios` | `Reminders.jsx` | Suscripción | `recordatorios` | Alarmas y recordatorios programados |
| `/documentos` | `Documents.jsx` | Suscripción | `documentos` | Órdenes médicas y ecografías |
| `/bienestar-emocional` | `EmotionalWellbeingPage.jsx`| Suscripción | `test_emocional` | Test psicológico y bienestar |
| `/cuenta-regresiva` | `Countdown.jsx` | Suscripción | `cuenta_regresiva`| Contador regresivo a FPP |
| `/cuidados-mama` | `MomCarePage` | Suscripción | `cuidados_mama` | Guía clínica de nutrición y ejercicio |
| `/cuidados-bebe` | `BabyCarePage` | Suscripción | `cuidados_bebe` | Cuidados y desarrollo prenatal |

---

## 🎨 Convenciones de Diseño y UI Responsiva

- **Alineación de Botones**: Todos los grupos de botones usan `flex-wrap`, `gap-2`, padding consistente (`!py-2.5 !px-3.5` o `!py-3 !px-4`), `w-full sm:w-auto` y escala táctil interactiva (`active:scale-95`).
- **Paleta de Colores (Tailwind v4 en `src/styles/index.css`)**:
  - `primary`: `#745662` (Rosa pardo maternal)
  - `secondary`: `#4f635b` (Verde salvia clínico)
  - `tertiary`: `#516070` (Azul sereno pediátrico)
  - `surface`: `#fff8f8` (Blanco cálido suave)
  - `error`: `#ba1a1a` (Rojo alerta médica)
- **Tipografías**:
  - Títulos y encabezados: `"Literata", serif` (`font-display`)
  - Cuerpo, controles y tablas: `"Plus Jakarta Sans", sans-serif` (`font-body`)

---

## 🚀 Guía Rápida para Continuar el Desarrollo

1. **Para desbloquear todos los módulos en desarrollo**:
   - En la base de datos: `UPDATE users SET plan = 'full', unlocked_modules = '["*"]'::jsonb WHERE email = 'tu_correo@gmail.com';`
   - O activa `is_vip = true` en el usuario.
2. **Para probar alarmas audibles fuera de la app**:
   - Entra a `/perfil` o `/recordatorios` y pulsa el botón *"Probar fuera (5s)"*. Cambia de pestaña o minimiza el navegador; a los 5 segundos sonará el timbre continuo y se activará la notificación del sistema.
3. **Para registrar una nueva vacuna o control pediátrico**:
   - En `/carnet-bebe`, usa el botón *"+ Nuevo Control Pediátrico"* o pulsa *`🔔 Poner Alarma`* en cualquiera de las 20 vacunas del PAI.
