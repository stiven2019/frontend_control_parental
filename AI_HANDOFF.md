# 🤖 AI Handoff & Technical Project Summary — Mi Bebé (Control Prenatal y Salud Infantil)

> **Documento Oficial para Inteligencias Artificiales y Desarrolladores.**  
> Resume el estado actual del proyecto, arquitectura técnica, convenciones de código, gestión de suscripciones, panel administrativo y puntos de extensión.

---

## ⚡ ⚠️ PROTOCOLO OBLIGATORIO PARA TODA IA (LEER Y ACTUALIZAR)

Cualquier modelo de Inteligencia Artificial que trabaje en este repositorio **DEBE CUMPLIR ESTRICTAMENTE** las siguientes dos reglas:

### 1. 📖 Lectura Previa Obligatoria (Antes de Modificar Código)
Antes de realizar cualquier ajuste, refactorización, corrección de bug, adición de endpoints o nueva interfaz:
- **Consulta este archivo (`AI_HANDOFF.md`) y `AGENTS.md`**: Verifica cómo interactúan los módulos, las rutas registradas, el sistema de suscripciones (`SubscriptionGuard`), el panel administrativo (`AdminGuard`), la persistencia de autenticación y las convenciones de diseño (Tailwind v4 y paleta de colores).
- **Evita reinventar o duplicar lógica existente**: Todos los endpoints deben centralizarse en [`src/api/client.js`](file:///c:/Users/jhers/Documents/LogicaDeProgramacion/mibebe/frontend_control_prenatal/src/api/client.js).

### 2. 📝 Actualización Posterior Obligatoria (Al Concluir Ajustes)
Cada vez que realices cambios o ajustes en el proyecto (nuevas rutas, nuevos endpoints, componentes clave, cambios en base de datos, módulos de suscripción o lógica de negocio):
- **Actualiza inmediatamente este archivo (`AI_HANDOFF.md`)**: Registra la nueva funcionalidad, añade las nuevas rutas al mapa de navegación, documenta cualquier nueva migración o endpoint y mantén al día la sección de cambios recientes.
- **Garantiza la continuidad del proyecto**: De este modo, la próxima sesión de la IA o el próximo desarrollador tendrá acceso inmediato al estado real y actualizado del software.

---

## 📌 Resumen Ejecutivo del Proyecto

**Mi Bebé** es una plataforma integral que acompaña a las madres gestantes, sus parejas y familias durante las 40 semanas de embarazo y la etapa postnatal del recién nacido (0 a 24 meses).

El proyecto está compuesto por:
- **Frontend SPA (`frontend_control_prenatal`)**: React 19, Vite, Tailwind CSS v4, Web Audio API, Web Workers para alarmas en segundo plano, Service Worker con Web Push VAPID, y React Router DOM v7.
- **Backend API REST (`backend_control_prenatal`)**: Node.js, Express, PostgreSQL con Sequelize, autenticación JWT, Nodemailer configurado con Gmail SMTP, Web Push nativo y crons automatizados de alertas y recordatorios.

---

## 🏛️ Arquitectura Técnica y Flujo de Datos

### 1. Autenticación, Seguridad y Recuperación (`src/context/AuthContext.jsx` & `src/api/client.js`)
- **Persistencia Permanente de Sesión**:
  - El JWT se almacena en `localStorage` bajo `mibebe_token` con vigencia prolongada (`JWT_EXPIRES_IN=365d`).
  - El perfil del usuario se respalda en `localStorage` (`mibebe_user`) para renderizado instantáneo sin parpadeo de carga.
  - La sesión **se mantiene abierta indefinidamente** mientras la usuaria no presione voluntariamente *"Cerrar sesión"*. Si ocurren fallos temporales de red, caídas de señal o reinicios del servidor, la app mantiene la sesión local activa sin cerrar la cuenta. Solo una respuesta explícita `401 Unauthorized` o la acción voluntaria de logout elimina el token.
- **Inyección Automática**: `client.js` inyecta `Authorization: Bearer <token>` en todas las peticiones autenticadas.
- **Onboarding Obligatorio**: Si la API retorna `{ needsSetup: true }`, la aplicación redirige de inmediato a `/configuracion-inicial`.
- **Recuperación de Contraseña con Caducidad (15 min)**:
  - Endpoints: `POST /api/auth/forgot-password-email` y `POST /api/auth/forgot-password-whatsapp`.
  - Tokens JWT estrictos con vigencia de 15 minutos (`expiresIn: '15m'`).
  - Frontend (`ForgotPassword.jsx` & `ResetPassword.jsx`) con temporizador regresivo dinámico en vivo.
  - Envío automático de correo con **Gmail SMTP** sanitizado en backend (`pass.replace(/\s+/g, '')`).

---

### 2. Panel Administrativo y Control Maestro (`AdminGuard.jsx`, `AdminPanel.jsx`, `AdminLogin.jsx`, `AdminRegister.jsx`)
Sistema integral para la supervisión global de la plataforma:
- **Rutas**: `/admin/login`, `/admin/registro` (setup único), `/admin/setup`, `/admin` y `/panel-administrativo`.
- **Registro Único del Administrador Maestro (`AdminRegister.jsx`)**:
  - Endpoints públicos: `GET /api/admin/setup-status` y `POST /api/admin/register`.
  - **Regla Estricta de 1 Solo Administrador**: Si no existe ningún administrador en la base de datos (`totalAdmins === 0`), se habilita el formulario de configuración inicial.
  - Una vez registrado el primer administrador maestro, el formulario desaparece permanentemente de la UI; la ruta `/admin/registro` queda bloqueada con pantalla de seguridad y la API responde `403 Forbidden` (`ADMIN_ALREADY_EXISTS`) a cualquier intento subsiguiente.
  - En `/admin/login`, el aviso/banner de configuración inicial solo aparece si `adminExists === false`; en caso contrario, no existe ningún enlace de registro.
- **Estructura y Navegación**:
  - Menú lateral vertical a la izquierda (`<aside>`) responsivo y colapsable en móviles, con insignia de estado de conexión al servidor y categorización temática:
    - *Operaciones*: Resumen General (`metrics`), Directorio de Usuarios (`users`), Comprobantes de Pago (`payments`).
    - *Inteligencia y Finanzas*: Métricas Avanzadas (`advanced_metrics`), Ingresos y Reportes (`earnings`).
    - *Comunicación*: Centro de Mensajería y Correo (`emails`).
    - *Ajustes y Seguridad*: Apartado de Configurar Cuenta (`account`) para ver/editar datos personales del administrador y cambio de contraseña seguro.
    - *Pie*: Sincronización en vivo y Cierre de Sesión Seguro.
- **Protección de Acceso (`AdminGuard.jsx`)**:
  - Valida el rol `user.role === 'admin'`.
  - Si el usuario en caché local no tiene rol de admin, consulta en vivo al backend (`refreshUser()`) para evitar falsos bloqueos.
  - Redirige a `/admin/login` si no está autenticado o muestra pantalla de acceso restringido con enlace de inicio de sesión administrativo si no cuenta con privilegios.
- **Capacidades del Panel Administrativo**:
  - 📊 **Métricas Globales y Avanzadas**:
    - *Clínica Gestacional*: Conteo por Trimestres (T1: semanas 1-12, T2: semanas 13-26, T3: semanas 27-40+), distribución porcentual y total de bebés nacidos.
    - *Auditoría de Carnets*: Detección en vivo de activaciones prematuras del carnet postnatal (< 40 semanas) y recuento de carnets bloqueados por el admin.
    - *Crecimiento y Cohortes*: Tasas de conversión de usuarios gratuitos a VIP/Planes, Churn Rate (% bajas/expirados), nuevos usuarios en 7 y 30 días.
    - *Financieras SaaS*: MRR proyectado mensual, ARPU (ingreso promedio por usuario activo) e ingresos en riesgo de vencimiento en los próximos 7 días.
  - 💰 **Reporte de Ingresos (`earnings`)**: Control de facturación por planes, historial de cobros y gráficos de rendimiento financiero.
  - 👥 **Gestión Total de Usuarios y Carnets de Bebé**:
    - Listado paginado con búsqueda por nombre/email y filtros por estado de cuenta, plan o activación prematura de carnet.
    - **Bloqueo y Reversión de Carnet de Bebé (`toggleAdminBabyCarnet`)**: Permite al administrador re-bloquear el carnet de salud infantil para cuentas que lo activaron por error antes de la semana 40, restaurando la cuenta a seguimiento gestacional prenatal (`is_born = false`, `carnet_locked_by_admin = true`).
    - Bloqueo y desbloqueo temporal de cuentas (`toggleBlockAdminUser`).
    - Eliminación suave (*soft-delete*) y eliminación permanente (`deleteAdminUser`).
    - Restauración de usuarios borrados (`restoreAdminUser`).
    - Asignación manual de planes y módulos desbloqueados en caliente (`updateAdminUserSubscription`).
  - 📧 **Mensajería Directa y Masiva**: Envío de correos por Gmail SMTP directamente desde el panel a un usuario específico o a toda la base de datos (`sendAdminEmail`).
  - 💳 **Gestión y Auditoría de Pagos**: Registro manual de pagos recibidos por transferencias (Nequi, Daviplata, Bancolombia) y borrado de comprobantes erróneos.

---

### 3. Vínculos Familiares y Papá con QR Dinámico (`FamilyQrModal.jsx`, `FamilyLinkPage.jsx`, `/vincular`)
Permite a la mamá gestante compartir el seguimiento de su embarazo con su pareja y familiares cercanos:
- **Generación de QR y Enlace Seguro (`generateFamilyQr`)**:
  - Rol configurable: `papa` (exclusivo, solo 1 activo) o `familia` (múltiples parientes).
  - Enlace con código único y caducidad automática de **15 minutos**.
  - Temporizador visual regresivo en tiempo real con refresco automático si expira sin ser canjeado.
- **Canje de Invitación (`redeemFamilyQr`)**:
  - Acceso mediante la ruta `/vincular?code=...` o escaneo directo con cámara móvil.
  - Permite al familiar crear cuenta o vincularse directamente a la ficha del bebé.
- **Administración de Vínculos**:
  - Lista de familiares activos en `/papa` y `/perfil`.
  - Posibilidad de revocar o eliminar cualquier vínculo familiar en cualquier momento (`revokeFamilyLink`).

---

### 4. Sistema de Suscripción, Módulos y Alertas Preventivas
Control de acceso por suscripción a nivel de ruta y navegación.

#### A. Módulos 100% Gratuitos (Sin Suscripción Requerida)
- 💊 **Medicamentos** (`/medicamentos`)
- 📋 **Síntomas** (`/sintomas`)
- 🌱 **Guía de Desarrollo Fetal** (`/guia-desarrollo`)
- 🏠 **Inicio / Dashboard** (`/inicio`)
- 👤 **Perfil de Usuario** (`/perfil`)

#### B. Módulos Restringidos bajo Suscripción (`SubscriptionGuard.jsx`)
- `gestacion`: Mi Bebé en Gestación (`/mi-bebe`)
- `carnet_bebe`: Carnet de Salud Infantil del Bebé Nacido (`/carnet-bebe`, `/bebe-nacido`)
- `control_medico`: Controles Médicos Prenatales y Pediátricos (`/controles`, `/controles-bebe`)
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

#### C. Alertas de Vencimiento de Suscripción por Correo y Límites
- El backend monitorea las fechas de vigencia y envía correos preventivos automáticos antes del vencimiento del plan.
- Endpoint de prueba para verificar plantilla y despacho de correo: `POST /api/auth/test-subscription-alert`.
- En el cliente (`client.js`), los errores de servidor identifican flags especiales: `err.expired = true` y `err.limitReached = true` para desplegar interfaces contextuales al usuario.

---

### 5. Separación Clínica de Etapas: Gestación vs. Bebé Nacido
Para evitar cualquier ambigüedad clínica, la aplicación separa con estrictez el embarazo del recién nacido:

1. **Mi Bebé en Gestación (`/mi-bebe` - `BabyPage.jsx`)**:
   - Solo métricas prenatales: desarrollo fetal intrauterino semana a semana, tamaño comparativo, FCF (Frecuencia Cardíaca Fetal en lpm), altura uterina del control prenatal, contador de pataditas en el vientre materno y estimulación auditiva con melodía relajante.
2. **Carnet de Salud Infantil (`/carnet-bebe` - `PostnatalCarnetPage.jsx` & `BornBabyCarnet.jsx`)**:
   - **Condición de Desbloqueo Clínico**: Se activa si el bebé ya nació (`baby.isBorn`) o si la gestación supera la semana 40 (`currentWeek >= 40`), **siempre y cuando no esté bloqueado por el administrador** (`!baby.carnetLockedByAdmin`).
   - **Mecanismo Anti-Activación Prematura**: Si una gestante activa el carnet por error antes de la semana 40, tanto el usuario (`handleRevertBirth` en `PostnatalCarnetPage.jsx`) como el administrador (`toggleAdminBabyCarnet` en `AdminPanel.jsx`) pueden bloquear/revertir el carnet, retornando inmediatamente al modo gestacional (`/mi-bebe` y dashboard prenatal) y reseteando `baby.isBorn = false`.
   - Solo métricas postparto del recién nacido: fecha y hora de parto, peso, talla y perímetro cefálico al nacer, tipo de parto y grupo sanguíneo.
   - **Curvas de Crecimiento OMS (0 a 24 meses)**: Diagnósticos de peso/edad, talla/edad, perímetro cefálico e IMC infantil comparados con tablas OMS para niñas y niños.
   - **Carnet de Vacunación PAI (Colombia)**: 20 dosis programadas con checklist, fecha de aplicación y botón directo de alarma/recordatorio para cada vacuna.
   - **Hitos de Neurodesarrollo (EAD)**: Motricidad gruesa, fina, audición/lenguaje y personal social.
   - **Controles Pediátricos**: Bitácora de visitas con peso, talla, perímetro cefálico y recomendaciones del pediatra.
   - **Cuidados del Bebé Nacido**: 9 guías clínicas con recomendaciones de la AAP y MinSalud (cordón umbilical, lactancia materna, sueño seguro SMSL, higiene, dermatitis del pañal, cólicos/gases, vitamina D 400 UI, tummy time y signos de alarma neonatal).

---

### 6. Sistema de Alarmas y Recordatorios en Segundo Plano (`AlarmContext.jsx`, Service Worker y Web Push)
- **Notificaciones Push Fuera del Navegador**:
  - **Service Worker (`public/sw.js`)**: Escucha eventos `push` y despliega alertas a través de `self.registration.showNotification(...)` con sonido, vibración y retención (`requireInteraction: true`). Al pulsar la alerta, enfoca o navega a la ruta respectiva.
  - **Web Push API + VAPID**: Llaves VAPID configuradas en cliente y servidor.
  - **Servicio Cron en Backend (`reminderCron.js`)**: Monitorea de manera autónoma cada 45 segundos recordatorios, medicamentos y citas médicas del día.
- **Web Worker Anti-Throttling (Pestaña minimizada)**: Evita que el navegador congele o ralentice los temporizadores cuando la ventana no está visible.
- **Web Audio API**: Melodías sintetizadas armónicamente (cuna, campana, alerta médica).

---

### 7. Optimización y Compresión de Archivos Multimedia
- **Compresión de Imágenes en Cliente (`compressImageIfPossible`)**: Integrada directamente en `uploadFile` en `src/api/client.js` para reducir el tamaño de fotos de cámaras modernas antes de viajar al servidor.
- **Visores de Imágenes Enriquecidos**: Integrados en Álbum (`Album.jsx`), Documentos y Ecografías con soporte para ampliación modal, inspección nítida y descarga.

---

## 🗺️ Mapa Completo de Rutas y Páginas

| Ruta | Componente | Acceso | Módulo Key | Descripción |
|---|---|---|---|---|
| `/` | `Welcome.jsx` | Público | — | Landing de bienvenida principal |
| `/iniciar-sesion` | `Login.jsx` | Público | — | Inicio de sesión |
| `/crear-cuenta` | `Register.jsx` | Público | — | Registro de nuevos usuarios |
| `/recuperar-contrasena` | `ForgotPassword.jsx` | Público | — | Recuperación de clave por Gmail / WhatsApp (15 min) |
| `/restablecer-contrasena`| `ResetPassword.jsx` | Público | — | Cambio de contraseña con token de un solo uso |
| `/vincular` | `FamilyLinkPage.jsx` | Público | — | Canje de invitación familiar / papá con QR o código |
| `/terminos-y-condiciones`| `TermsPage.jsx` | Público | — | Términos y descargos legales de salud |
| `/explorar/*` | `GuestExplore.jsx` | Público | — | Modo demostración e interactivo para invitados |
| `/admin/login` | `AdminLogin.jsx` | Público | — | Inicio de sesión exclusivo para administradores |
| `/admin/registro` | `AdminRegister.jsx`| Público (Setup) | — | Registro del Administrador Maestro (desaparece si ya existe) |
| `/admin/setup` | `AdminRegister.jsx`| Público (Setup) | — | Alias de configuración inicial del Administrador Maestro |
| `/admin` | `AdminPanel.jsx` | Administrador | — | Panel maestro de métricas, finanzas y usuarios |
| `/panel-administrativo`| `AdminPanel.jsx` | Administrador | — | Alias del panel administrativo |
| `/configuracion-inicial`| `Onboarding.jsx` | Autenticado | — | Configuración inicial FUR / ecografía |
| `/inicio` | `Dashboard.jsx` | **Gratuito** | — | Panel principal con resumen y accesos directos |
| `/medicamentos` | `Medications.jsx` | **Gratuito** | `medicamentos` | Dosis, tomas y horarios de medicamentos |
| `/sintomas` | `Symptoms.jsx` | **Gratuito** | `sintomas` | Registro de síntomas y malestares de salud |
| `/guia-desarrollo` | `BabyDevelopmentGuide.jsx` | **Gratuito** | `guia_desarrollo`| Guía anatómica fetal semana a semana |
| `/perfil` | `Profile.jsx` | **Gratuito** | — | Ajustes de cuenta, vínculos, sonido y suscripción |
| `/mi-bebe` | `BabyPage.jsx` | Suscripción | `gestacion` | Feto en gestación, pataditas y FCF |
| `/carnet-bebe` | `PostnatalCarnetPage.jsx` | Suscripción | `carnet_bebe` | Carnet de salud infantil OMS y vacunas PAI |
| `/bebe-nacido` | `PostnatalCarnetPage.jsx` | Suscripción | `carnet_bebe` | Alias directo al carnet del recién nacido |
| `/calendario` | `CalendarPage.jsx` | Suscripción | `calendario` | Calendario mensual interactivo de citas |
| `/mi-embarazo` | `PregnancyTimeline.jsx` | Suscripción | `embarazo_timeline`| Línea de tiempo de 40 semanas de gestación |
| `/papa` | `PartnerPage.jsx` | Suscripción | `papa` | Acompañamiento del padre/pareja y vínculos |
| `/album` | `Album.jsx` | Suscripción | `album` | Álbum fotográfico y visor de ecografías |
| `/diario` | `Journal.jsx` | Suscripción | `diario` | Diario íntimo de emociones maternales |
| `/controles` | `MedicalControls.jsx` | Suscripción | `control_medico` | Consultas médicas prenatales y diagnósticos |
| `/controles-bebe` | `BabyGestationalControls.jsx` | Suscripción | `control_medico` | Biometría gestacional, percentiles y curvas fetales |
| `/recordatorios` | `Reminders.jsx` | Suscripción | `recordatorios` | Alarmas y recordatorios programados |
| `/documentos` | `Documents.jsx` | Suscripción | `documentos` | Órdenes médicas, ecografías y visor de archivos |
| `/bienestar-emocional` | `EmotionalWellbeingPage.jsx`| Suscripción | `test_emocional` | Test psicológico y de bienestar materno |
| `/test-emocional` | `EmotionalWellbeingPage.jsx`| Suscripción | `test_emocional` | Alias del test de bienestar emocional |
| `/cuenta-regresiva` | `Countdown.jsx` | Suscripción | `cuenta_regresiva`| Contador regresivo a la FPP |
| `/cuidados-mama` | `MomCarePage` | Suscripción | `cuidados_mama` | Guía clínica de nutrición y ejercicio prenatal |
| `/cuidados-bebe` | `BabyCarePage` | Suscripción | `cuidados_bebe` | Cuidados y desarrollo prenatal |
| `*` (Ruta no encontrada) | `NotFound.jsx` | Universal | — | Pantalla 404 y módulo no encontrado (anti-pantalla blanca) |

---

## 🎨 Convenciones de Diseño y UI Responsiva

- **Alineación de Botones**: Todos los grupos de botones usan `flex-wrap`, `gap-2`, padding consistente (`!py-2.5 !px-3.5` o `!py-3 !px-4`), `w-full sm:w-auto` y escala táctil interactiva (`active:scale-95`).
- **Paleta de Colores Oficial (Tailwind v4 en `src/styles/index.css`)**:
  - `primary`: `#745662` (Rosa pardo maternal cálido)
  - `secondary`: `#4f635b` (Verde salvia clínico)
  - `tertiary`: `#516070` (Azul sereno pediátrico)
  - `surface`: `#fff8f8` (Blanco cálido suave)
  - `error`: `#ba1a1a` (Rojo alerta médica)
- **Tipografías**:
  - Títulos y encabezados: `"Literata", serif` (`font-display`)
  - Cuerpo, controles y tablas: `"Plus Jakarta Sans", sans-serif` (`font-body`)

---

## 🚀 Guía Rápida para Continuar el Desarrollo y Despliegue en Servidores

### 1. Despliegue en Servidor (VPS / Docker / Producción)
- **Migraciones Automáticas de Base de Datos**:
  `backend_control_prenatal/src/server.js` ejecuta de forma preventiva `ALTER TABLE babies ADD COLUMN IF NOT EXISTS ...` y `ALTER TABLE users ...` al iniciar.
- **Variables de Entorno Clave (`.env`)**:
  ```env
  VITE_API_URL=http://localhost:4000 # O la IP/dominio de producción
  ```

### 2. Comandos Útiles de Administración:
- Para promover un usuario a Administrador en PostgreSQL:
  ```sql
  UPDATE users SET role = 'admin', is_vip = true, plan = 'full', custom_unlocked_modules = '["*"]'::jsonb WHERE email = 'tu_correo@gmail.com';
  ```

---

## 📝 Historial de Cambios Recientes (Changelog de Evolución)
- **Corrección de Bug en Carnet del Bebé Nacido y Protección Integral Anti-Pantallas Blancas (`ErrorBoundary.jsx`, `NotFound.jsx`, `PostnatalCarnetPage.jsx`)**:
  - *Bug Solucionado en Carnet*: Se corrigió la violación de reglas de hooks de React en `PostnatalCarnetPage.jsx` donde `useState(revertingBirth)` se invocaba condicionalmente después de los retornos tempranos de `loading` y `error`. Esto provocaba la excepción `Rendered more hooks than during the previous render`, causando que la pantalla se desmontara y quedara totalmente en blanco al presionar el carnet.
  - *Sanitización en Cálculos Postnatales*: En `BornBabyCarnet.jsx`, se blindó el cálculo de edad y fechas estimadas de vacunación contra fechas inválidas y `RangeError: Invalid time value` en `toISOString()`.
  - *Componente Global `ErrorBoundary.jsx`*: Implementación de barrera de errores React envolviendo las rutas de la aplicación y módulos clave. En caso de fallas imprevistas, no se presenta pantalla blanca; se despliega una interfaz estética y tranquilizadora confirmando que los datos están a salvo, con opciones para reintentar la pantalla, recargar la app, volver al inicio o inspeccionar detalles técnicos.
  - *Página 404 de Módulo No Encontrado (`NotFound.jsx`)*: Reemplazo del catch-all genérico por una pantalla 404 interactiva con accesos directos al panel principal, gestación, carnet o medicamentos, orientando tanto a usuarios autenticados como a visitantes.
- **Formulario de Registro Único y Configuración Inicial del Administrador Maestro (`AdminRegister.jsx`)**:
  - Creación de la página y formulario `/admin/registro` (con alias `/admin/setup`) para el registro exclusivo del primer administrador del sistema.
  - Endpoints backend en `adminRoutes.js` y `adminController.js`:
    - `GET /api/admin/setup-status`: Determina si existe algún administrador registrado (`adminExists`, `canRegister`).
    - `POST /api/admin/register`: Registro estricto del Administrador Maestro con rol `admin`, membresía `isVip: true`, plan `full` y módulos `['*']`.
  - **Mecanismo de Desaparición y Bloqueo Definitivo**:
    - Si ya existe un administrador en el sistema (`totalAdmins > 0`), el formulario de registro desaparece por completo:
      - En `/admin/login` no se muestra ningún botón, enlace o aviso para crear cuenta de administrador.
      - Al ingresar directamente a `/admin/registro`, la interfaz bloquea el acceso mostrando un escudo de seguridad con el mensaje *"Administrador Maestro Configurado • Registro Deshabilitado"* y redirige al login administrativo.
      - En el backend, cualquier petición a `POST /api/admin/register` es rechazada con código `403 Forbidden` (`ADMIN_ALREADY_EXISTS`), garantizando la existencia de **un solo administrador** en la aplicación.
- **Apartado de Configuración de Cuenta de Administrador & Limpieza de Menú**:
  - Eliminación de los accesos redundantes del menú lateral (`Volver a Mi Bebé App`, ficha superior con botones `Registrar Comprobante` y `Mensaje a Usuarias`).
  - Nuevo acceso directo interactivo en la cabecera del menú lateral y pestaña de navegación `Cuenta & Seguridad` -> `Configurar Cuenta` (`account`).
  - Vista completa con:
    - *Datos Registrados*: Visualización y edición en tiempo real de Nombre, Apellido, Teléfono de contacto, Email maestro (protegido), rol y estado de cuenta con persistencia vía `api.updateMe`.
    - *Cambio de Contraseña*: Formulario de cambio de clave criptográfica con contraseña actual, nueva contraseña (mínimo 8 caracteres), confirmación y botones de alternancia de visibilidad mediante `api.changePassword`.
- **Panel Administrativo Rediseñado (Menú Lateral Vertical)**:
  - Navegación lateral fija izquierda con categorías (`Operaciones`, `Inteligencia y Finanzas`, `Comunicación`, `Cuenta`), drawer móvil responsivo y estado de conectividad en vivo.
- **Métricas Avanzadas Clínicas, de Crecimiento y Financieras**:
  - Pestaña `advanced_metrics` con desglose trimestral (Trimestre 1, 2, 3), barra de distribución gestacional, cohortes de crecimiento (conversión, churn, nuevos usuarios 7d/30d), indicadores SaaS (MRR proyectado, ARPU, ingresos en riesgo) y auditoría de carnets prematuros.
- **Auditoría y Bloqueo Administrativo del Carnet de Bebé**:
  - Campo `carnet_locked_by_admin` en modelo `Baby` y migración automática en backend.
  - Endpoint `POST /admin/users/:id/toggle-baby-carnet` para que el administrador pueda bloquear/desbloquear el carnet de salud infantil y revertir cuentas que lo activaron prematuramente antes de la semana 40.
  - Soporte de reversión voluntaria en `PostnatalCarnetPage.jsx` para usuarias que marcaron nacimiento por error.
- **Panel Administrativo Base**: Creación de `/admin`, `/admin/login`, `/panel-administrativo`, `AdminGuard.jsx`, métricas en vivo, finanzas, gestión de usuarios (bloquear, restaurar, borrar, editar suscripción), envío masivo de emails y auditoría de pagos.
- **Vínculos Familiares y Papá (QR Dinámico)**: Temporizador regresivo de 15 minutos, auto-refresco, validación de un único papá activo, página de canje en `/vincular` y revocación en tiempo real.
- **Alertas de Suscripción por Correo**: Despacho automático de notificaciones por email al aproximarse o cumplirse el tiempo de suscripción, con gestión de flags `err.expired` y `err.limitReached`.
- **Visor de Imágenes y Compresión en Cliente**: Compresión automática en `uploadFile` y modales de inspección fotográfica para ecografías y álbum.
- **Guía Exploratoria Mejorada**: Optimización de la experiencia de usuario en modo invitado (`GuestExplore.jsx`).
