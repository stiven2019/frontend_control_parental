# 🍼 Mi Bebé — Plataforma de Control Prenatal y Salud Infantil

Aplicación web moderna, interactiva y sensible para el **seguimiento integral del embarazo, control prenatal, cuidados del recién nacido y carnet de salud infantil**.

Construida con **React 19**, **Vite**, **Tailwind CSS v4**, **Web Audio API**, **Web Workers** y una arquitectura modular orientada al bienestar de la madre, el bebé y su familia.

---

## 🚀 Características Principales

### 1. 📊 Panel de Control Gestacional (`/inicio`)
- **Anillo de progreso gestacional SVG interactivo**: Semanas, días adicionales (+X días), trimestre actual y porcentaje del camino.
- **Cuenta regresiva inteligente**: Días restantes exactos hasta la Fecha Probable de Parto (FPP).
- **Desarrollo fetal semanal**: Tamaño comparativo (fruta/objeto), longitud aproximada (cm), peso estimado (g) y notas clínicas.
- **Accesos Rápidos y Próximos Eventos**: Alertas de citas prenatales, tomas de medicamentos y recordatorios activos.

---

### 2. 🤰 Mi Bebé en Gestación (Módulo Prenatal - `/mi-bebe`)
- **Desarrollo Fetal en Útero**: Hitos anatómicos semana a semana.
- **Métricas Clínicas Obstétricas**: FPP, FUM, Frecuencia Cardíaca Fetal (FCF en latidos por minuto) y Altura Uterina.
- **Contador Interactivo de Pataditas**: Registro diario de movimientos fetales con registro horario y reseteo.
- **Estimulación Auditiva Prenatal**: Melodía armónica sintetizada para acercar al vientre materno.
- **Álbum de Ecografías y Barriguita**: Acceso directo a ultrasonidos guardados.

---

### 3. 👶 Carnet de Salud Infantil (Bebé Nacido - `/carnet-bebe`)
Módulo independiente para el seguimiento del recién nacido hasta los 24 meses:
- **Ficha de Nacimiento**: Registro de fecha, hora, peso al nacer (g), talla neonatal (cm), perímetro cefálico (cm), grupo sanguíneo y tipo de parto.
- **Curvas de Crecimiento OMS**: Diagnóstico antropométrico automático de **Peso para la Edad**, **Talla para la Edad** y **Perímetro Cefálico** comparado con los patrones de la OMS (niñas y niños).
- **Carnet de Vacunación Oficial PAI (Colombia)**: Las 20 dosis reglamentarias desde el nacimiento hasta los 18 meses con checklist, fecha de aplicación y **botón para programar alarma con fecha sugerida**.
- **Hitos del Neurodesarrollo (EAD)**: Motricidad gruesa, motricidad fina, audición/lenguaje y personal social.
- **Bitácora de Controles Pediátricos**: Registro de consultas postnatales con médico tratante y recomendaciones.
- **🍼 Cuidados del Bebé Nacido**: 9 guías clínicas pediátricas (cordón umbilical, lactancia y agarre, sueño seguro SMSL, baño e higiene, pañalitis, cólicos/gases, vitamina D 400 UI, tummy time y signos de alarma de urgencias).

---

### 4. 🔔 Alarmas y Recordatorios en Segundo Plano (Sonido fuera de la app)
- **Web Worker Anti-Throttling**: Temporizador en segundo plano que no se detiene cuando la pestaña está minimizada o inactiva.
- **Web Audio API**: Síntesis nativa de tonos de cuna, campanillas y arpa armónica.
- **Notificaciones Nativas**: Notificaciones del sistema operativo con parpadeo del título de la ventana y timbre continuo.
- **Categorías Pediátricas y Maternas**:
  - `vacuna_bebe` (💉), `control_pediatrico` (🩺), `cuidado_bebe` (👶), `vitamina_bebe` (🥄), `medicamento` (💊), `control_medico` (🩺), `cita` (📅).
- **Aviso previo configurable**: 0, 5, 15 o 30 minutos antes de la hora del evento.

---

### 5. 💎 Sistema de Suscripciones y Módulos Protegidos vs. Gratuitos

#### Módulos 100% Gratuitos y Libres (Sin suscripción):
- 💊 **Medicamentos** (`/medicamentos`): Registro de dosis y horarios.
- 📋 **Síntomas** (`/sintomas`): Bitácora de molestias y estado anímico.
- 🌱 **Guía de Desarrollo** (`/guia-desarrollo`): Crecimiento fetal semana a semana.
- 🏠 **Inicio** y **Perfil**: Gestión de cuenta y configuración.

#### Módulos Restringidos por Suscripción (`SubscriptionGuard.jsx`):
- `gestacion` (Mi Bebé en Gestación)
- `carnet_bebe` (Carnet Infantil Bebé Nacido)
- `control_medico` (Controles Prenatales y Pediátricos)
- `recordatorios` (Recordatorios y Alarmas)
- `calendario` (Calendario de Citas)
- `embarazo_timeline` (Línea de Tiempo)
- `album` (Álbum de Fotos)
- `documentos` (Documentos y Ecografías)
- `test_emocional` (Test Emocional)
- `diario` (Diario de Emociones)
- `papa` (Módulo de Papá y Pareja)
- `cuenta_regresiva` (Cuenta Regresiva)
- `cuidados_mama` (Guía de Cuidados de Mamá)
- `cuidados_bebe` (Guía de Cuidados del Bebé)

#### Planes de Suscripción Disponibles:
1. **Plan VIP Toda la App ($50.000 COP/mes)**: Acceso total e ilimitado (`unlockedModules: ['*']`).
2. **Plan Gestación y Bebé Nacido ($30.000 COP/mes)**: Acceso clínico (`gestacion`, `carnet_bebe`, `control_medico`, `recordatorios`, `calendario`, `embarazo_timeline`, `test_emocional`).
3. **Plan Esencial Médico ($15.000 COP/mes)**: Acceso básico (`gestacion`, `control_medico`, `recordatorios`, `calendario`).

---

### 6. 🔐 Recuperación Segura de Contraseña (15 Minutos)
- Enlace enviado por **Gmail SMTP** o generado para **WhatsApp**.
- Token JWT criptográfico con vigencia estricta de **15 minutos**.
- Contador regresivo en tiempo real en la pantalla de recuperación.

---

## 🛠️ Tecnologías Utilizadas

- **React 19**: Biblioteca UI para componentes declarativos, hooks y contextos.
- **Vite 8**: Servidor de desarrollo ultrarrápido y compilador de producción.
- **Tailwind CSS v4**: Tokens de diseño HSL y estilos modernos maternales.
- **React Router DOM v7**: Enrutamiento protegido y gestión de historial.
- **Web Audio API & Web Workers**: Generación de alarmas sonoras activas fuera del navegador.
- **Browser Notifications API**: Alertas en segundo plano del sistema operativo.

---

## 📂 Estructura del Proyecto

```
frontend_control_prenatal/
├── src/
│   ├── api/
│   │   └── client.js              # Cliente HTTP con JWT y endpoints del backend
│   ├── components/
│   │   ├── ActiveAlarmModal.jsx   # Modal de alarma sonora activa con animación
│   │   ├── AppLayout.jsx          # Layout principal con navegación y encabezado
│   │   ├── AppNav.jsx             # Barra de navegación (sidebar en desktop, inferior en móvil)
│   │   ├── BornBabyCarnet.jsx     # Carnet de salud infantil, curvas OMS y vacunas
│   │   ├── FormattedContent.jsx   # Formateador de tablas y texto médico
│   │   ├── NotificationBell.jsx   # Campana interactiva y ajustes de sonido
│   │   ├── ProgressRing.jsx       # Anillo circular SVG de semanas de gestación
│   │   ├── ProtectedRoute.jsx     # Guardia de rutas autenticadas
│   │   ├── SubscriptionGuard.jsx  # Guardia de módulos por suscripción
│   │   ├── SubscriptionModal.jsx  # Modal interactivo de planes de suscripción
│   │   └── TermsModal.jsx         # Modal de términos y condiciones de salud
│   ├── context/
│   │   ├── AlarmContext.jsx       # Monitor de alarmas con Web Worker y Web Audio
│   │   └── AuthContext.jsx        # Estado global de autenticación, perfil y plan
│   ├── data/
│   │   └── postnatalData.js       # Curvas OMS, 20 vacunas PAI y 9 guías de cuidados
│   ├── pages/
│   │   ├── Album.jsx              # Álbum de fotos del embarazo y recién nacido
│   │   ├── BabyDevelopmentGuide.jsx # Guía de desarrollo fetal (Gratuito)
│   │   ├── BabyPage.jsx           # Mi Bebé en Gestación (desarrollo fetal intrauterino)
│   │   ├── CalendarPage.jsx       # Calendario mensual consolidado
│   │   ├── Countdown.jsx          # Cuenta regresiva al parto
│   │   ├── Dashboard.jsx          # Panel de inicio con anillo gestacional y accesos
│   │   ├── Documents.jsx          # Gestor de órdenes médicas y ecografías
│   │   ├── EmotionalWellbeingPage.jsx # Test de bienestar emocional materno
│   │   ├── ForgotPassword.jsx     # Recuperación de clave Gmail/WhatsApp (15 min)
│   │   ├── Journal.jsx            # Diario personal de notas y emociones
│   │   ├── Login.jsx              # Inicio de sesión
│   │   ├── MedicalControls.jsx    # Controles médicos prenatales
│   │   ├── Medications.jsx        # Medicamentos y tomas diarias (Gratuito)
│   │   ├── Onboarding.jsx         # Configuración inicial del embarazo
│   │   ├── PartnerPage.jsx        # Módulo de papá y pareja
│   │   ├── PostnatalCarnetPage.jsx# Página del Carnet de Salud Infantil (Bebé Nacido)
│   │   ├── PregnancyTimeline.jsx  # Línea de tiempo de 40 semanas
│   │   ├── Profile.jsx            # Perfil de usuario y pruebas de audio
│   │   ├── Register.jsx           # Registro de usuarias
│   │   ├── Reminders.jsx          # Alarmas y recordatorios categorizados
│   │   ├── ResetPassword.jsx      # Formulario de nueva contraseña con token
│   │   ├── Symptoms.jsx           # Registro diario de síntomas (Gratuito)
│   │   ├── TermsPage.jsx          # Términos y condiciones
│   │   └── Welcome.jsx            # Pantalla de bienvenida
│   ├── styles/
│   │   └── index.css              # Tokens de diseño y variables CSS
│   ├── utils/
│   │   └── soundAlarm.js          # Síntesis Web Audio API y melodías PCM
│   ├── App.jsx                    # Enrutador principal con SubscriptionGuard
│   └── main.jsx                   # Punto de entrada de React
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚡ Instalación y Ejecución Local

### Prerrequisitos
- Node.js >= 18
- pnpm (o npm / yarn)
- Backend corriendo en el puerto `4000`

### Pasos

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   pnpm run dev
   ```
   La aplicación se abrirá en `http://localhost:5173`.

3. **Compilar para producción**:
   ```bash
   pnpm run build
   ```

---

## 🛠️ Despliegue en Servidor y Solución de Errores de Base de Datos

### Error: `{ error: "column \"is_born\" does not exist" }`
Si al acceder a la API (por ejemplo `http://38.242.149.219:3011/api/embarazo/dashboard`) la base de datos responde con este error, significa que la tabla `babies` en PostgreSQL se creó con el esquema anterior y le faltan las columnas del recién nacido y el carnet postnatal.

#### Opción 1: Ejecutar migración directa en el contenedor de PostgreSQL (Recomendada)
En la consola del servidor VPS ejecuta este comando en una sola línea:
```bash
docker exec -i mibebe-postgres psql -U postgres -d mi_bebe -c "
ALTER TABLE babies ADD COLUMN IF NOT EXISTS is_born BOOLEAN DEFAULT false;
ALTER TABLE babies ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE babies ADD COLUMN IF NOT EXISTS birth_time VARCHAR(10);
ALTER TABLE babies ADD COLUMN IF NOT EXISTS birth_weight_g INTEGER;
ALTER TABLE babies ADD COLUMN IF NOT EXISTS birth_length_cm NUMERIC(5,2);
ALTER TABLE babies ADD COLUMN IF NOT EXISTS birth_head_circ_cm NUMERIC(5,2);
ALTER TABLE babies ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50);
ALTER TABLE babies ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE babies ADD COLUMN IF NOT EXISTS birth_place VARCHAR(150);
ALTER TABLE babies ADD COLUMN IF NOT EXISTS postnatal_controls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE babies ADD COLUMN IF NOT EXISTS vaccines JSONB DEFAULT '[]'::jsonb;
ALTER TABLE babies ADD COLUMN IF NOT EXISTS developmental_milestones JSONB DEFAULT '[]'::jsonb;
"
```

#### Opción 2: Actualizar el backend y reiniciar
El archivo `backend_control_prenatal/src/server.js` ahora incluye la auto-migración `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en su función `start()`.
1. Haz un `git pull` en la carpeta del backend en el servidor.
2. Reinicia el contenedor del backend:
   ```bash
   docker compose restart backend
   ```

---


## 📄 Licencia y Aviso Médico

Este software está diseñado como bitácora y guía de apoyo maternal. No sustituye el diagnóstico, tratamiento o control médico presencial por parte de un ginecólogo, obstetra o pediatra profesional.
