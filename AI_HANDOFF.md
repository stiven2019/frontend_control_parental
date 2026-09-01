# 🤖 AI Handoff & Technical Project Summary — Mi Bebé (Control Prenatal)

> **Documento para Desarrolladores e Inteligencias Artificiales.**
> Resume el estado actual del proyecto, la arquitectura técnica, las convenciones de código y los puntos de extensión para continuar el desarrollo sin fricción.

---

## 📌 Resumen Ejecutivo del Proyecto

**Mi Bebé** es una plataforma integral de control prenatal que acompaña a las madres gestantes y sus familias durante las 40 semanas de embarazo y el posparto temprano. 

El repositorio frontend (`frontend_control_prenatal`) se comunica con una API REST backend (`backend_control_prenatal`, corriendo por defecto en `http://localhost:4000`, proxy configurado en `vite.config.js`).

---

## 🏛️ Arquitectura Técnica y Flujo de Datos

### 1. Autenticación y Sesión (`src/context/AuthContext.jsx` & `src/api/client.js`)
- El token JWT se almacena en `localStorage` bajo la clave `mibebe_token`.
- `client.js` inyecta automáticamente el encabezado `Authorization: Bearer <token>` en las peticiones que requieren autenticación.
- Si una petición devuelve `needsSetup: true` (la usuaria no ha completado el onboarding con FUR o fecha de ecografía), la aplicación redirige a `/configuracion-inicial`.
- `ProtectedRoute.jsx` valida la presencia del usuario autenticado; si no existe, redirige a `/iniciar-sesion`.

### 2. Sistema de Alarmas y Notificaciones Sonoras (`src/context/AlarmContext.jsx` & `src/utils/soundAlarm.js`)
- **Web Audio API (`soundAlarm.js`)**:
  - Sintetiza 4 melodías sin archivos de audio externos: `chime_suave` (Campanilla Suave), `melodia_bebe` (Melodía de Cuna), `arpa_serena` (Arpa Serena), `alarma_amable` (Alarma Amable).
  - Funciones exportadas: `startAlarmLoop(tone, volume)`, `stopAlarmLoop()`, `testAlarmSound(tone, volume)`, `unlockAudio()`.
  - Desbloqueo del `AudioContext` en la primera interacción o cambio de visibilidad de pestaña.
- **AlarmContext (`AlarmContext.jsx`)**:
  - Polling cada 20 segundos y al retornar el foco (`visibilitychange`).
  - Consulta `api.listReminders()`, `api.listMedications()`, `api.listControls()`.
  - Compara la hora del evento con la hora local actual.
  - Alerta en el momento exacto o con anticipación previa configurada (`prefs.advanceNoticeMinutes`: 0, 5, 15 o 30 min).
  - Evita repeticiones no deseadas almacenando firmas en `localStorage` (`mibebe_alarm_acknowledged`).
  - Soporta posponer 5 minutos (`snoozeAlarm`), silenciar (`dismissAlarm`) y marcar como completado/tomado directamente (`completeAlarmAction`).
  - Dispara `Notification API` del navegador para alertar en segundo plano.

### 3. Motor de Formateo de Contenido Médico (`src/components/FormattedContent.jsx`)
- Convierte texto no estructurado o con Markdown del backend en componentes React estilizados:
  - **Tablas Markdown** (`| Col 1 | Col 2 |`) $\rightarrow$ Elementos `<table>` responsivos con scroll horizontal, cabeceras contrastadas y estilos cebra.
  - **Encabezados destacados** (`**Título:**`) $\rightarrow$ Tarjetas con bordes temáticos (Rojo para alertas/evitar, Verde para seguro/recomendado, Morado para informativo).
  - **Viñetas semánticas**:
    - `V ` o `✅` $\rightarrow$ Ítem con check verde.
    - `? ` o `❌` $\rightarrow$ Ítem con cruz roja.
    - `?? ` o `🚨` $\rightarrow$ Alerta con fondo y llamada de atención.
    - `Clave: Valor` $\rightarrow$ Negrita + texto regular alineado.

### 4. Layout y Navegación (`src/components/AppLayout.jsx` & `src/components/AppNav.jsx`)
- **Desktop**: Barra lateral fija a la izquierda con enlaces principales.
- **Mobile**: Barra inferior flotante con efecto *glassmorphism* (`backdrop-blur-xl`).
- **Barra Superior**: Contiene el logo en móviles y la campana interactiva `NotificationBell` con contador en vivo y menú de ajustes de audio.
- **Modal Global**: `ActiveAlarmModal` se monta en el layout y reacciona automáticamente cuando `activeAlarm` no es nulo.

---

## 🗺️ Mapa Completo de Rutas y Páginas

| Ruta | Componente | Descripción | Protegida |
|---|---|---|---|
| `/` | `Welcome.jsx` | Pantalla de bienvenida / Landing | No |
| `/iniciar-sesion` | `Login.jsx` | Inicio de sesión con correo y contraseña | No |
| `/crear-cuenta` | `Register.jsx` | Registro de nueva mamá/familia | No |
| `/explorar/*` | `GuestExplore.jsx` | Portal público de exploración para visitantes | No |
| `/configuracion-inicial` | `Onboarding.jsx` | Configuración de FUR / ecografía y datos de embarazo | Sí |
| `/inicio` | `Dashboard.jsx` | Dashboard principal con anillo gestacional y alertas | Sí |
| `/calendario` | `CalendarPage.jsx` | Calendario mensual interactivo con eventos consolidados | Sí |
| `/mi-embarazo` | `PregnancyTimeline.jsx` | Línea de tiempo semana 1 a 40 | Sí |
| `/mi-bebe` | `BabyPage.jsx` | Nombre, sexo, pataditas y notas del bebé | Sí |
| `/papa` | `PartnerPage.jsx` | Perfil del padre/pareja y tips colaborativos | Sí |
| `/album` | `Album.jsx` | Álbum de fotos del vientre y ecografías | Sí |
| `/diario` | `Journal.jsx` | Diario íntimo de reflexiones durante el embarazo | Sí |
| `/sintomas` | `Symptoms.jsx` | Registro de síntomas diarios y estado anímico | Sí |
| `/controles` | `MedicalControls.jsx` | Historial obstétrico, peso, PA, FC y citas | Sí |
| `/medicamentos` | `Medications.jsx` | Medicamentos/vitaminas con botón "Marcar como tomado" | Sí |
| `/recordatorios` | `Reminders.jsx` | Recordatorios categorizados con repetición y alarmas | Sí |
| `/documentos` | `Documents.jsx` | Gestor de exámenes y órdenes médicas | Sí |
| `/cuenta-regresiva` | `Countdown.jsx` | Contador regresivo a la fecha de parto | Sí |
| `/cuidados-mama` | `MomCarePage` (`Content.jsx`) | Guías de nutrición, ejercicio y salud mental con filtros | Sí |
| `/cuidados-bebe` | `BabyCarePage` (`Content.jsx`) | Cuidados del recién nacido con buscador y categorías | Sí |
| `/guia-desarrollo` | `BabyDevelopmentGuide.jsx` | Guía semana a semana con tablas comparativas y alertas | Sí |
| `/perfil` | `Profile.jsx` | Edición de perfil, configuración de sonido/alarmas y seguridad | Sí |

---

## 🎨 Convenciones de Diseño y Estilo

- **Paleta de Colores (Tailwind v4 en `src/styles/index.css`)**:
  - `primary`: `#745662` (Rosa pardo suave)
  - `primary-container`: `#fad2e1` (Rosa algodón)
  - `secondary`: `#4f635b` (Verde salvia)
  - `secondary-container`: `#d1e7dd` (Verde menta suave)
  - `tertiary`: `#516070` (Azul sereno)
  - `tertiary-container`: `#cfdef2` (Azul pastel)
  - `surface`: `#fff8f8` (Blanco cálido maternal)
  - `error`: `#ba1a1a` (Rojo alerta médica)
- **Tipografías**:
  - Títulos y encabezados: `"Literata", serif` (`font-display`)
  - Cuerpo y controles: `"Plus Jakarta Sans", sans-serif` (`font-body`)

---

## 🚀 Cómo Continuar el Desarrollo desde Este Punto

1. **Para agregar nuevas notificaciones o tipos de eventos**:
   - En `src/context/AlarmContext.jsx`, dentro de la función `checkAlarms`, agrega la lógica de lectura y comparación de fecha/hora de la nueva entidad.
   - Llama a `refreshAlarms()` desde la página donde se cree o edite dicha entidad.

2. **Para agregar nuevos tonos de alarma**:
   - En `src/utils/soundAlarm.js`, añade la definición en el arreglo `TONES` y crea su secuencia de frecuencias en `playMelody`.

3. **Para añadir nuevos contenidos educativos formateados**:
   - Pasa el texto Markdown (incluyendo tablas `| a | b |` y viñetas `V`, `?`, `🚨`) a través de `<FormattedContent text={tuTexto} />`.
