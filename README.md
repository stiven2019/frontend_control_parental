# 🍼 Mi Bebé — Frontend de Control Prenatal

Aplicación web moderna, interactiva y sensible para el **seguimiento integral del embarazo, control prenatal y cuidados materno-fetales**.

Construida con **React 19**, **Vite**, **Tailwind CSS v4** y una arquitectura modular orientada al bienestar de la madre y su familia.

---

## 🚀 Características Principales

### 1. 📊 Panel de Control y Estado Gestacional (`/inicio`)

- **Anillo de progreso gestacional SVG interactivo**: Calcula semanas, días adicionales (+X días), trimestre actual y porcentaje de avance.
- **Cuenta regresiva**: Días restantes exactos hasta la Fecha Probable de Parto (FPP).
- **Desarrollo semanal inteligente**: Tamaño comparativo (frutas/objetos), longitud estimada (cm), peso estimado (g) y notas clínicas.
- **Próximos eventos y citas**: Alertas inmediatas para controles médicos y recordatorios pendientes.

### 2. 🔔 Sistema de Notificaciones y Alarmas Sonoras (Tiempo Real)

- **Motor de Audio con Web Audio API (`src/utils/soundAlarm.js`)**:
  - Sintetizador nativo sin librerías pesadas externas.
  - 4 tonos y melodías relajantes: _Campanilla Suave_, _Melodía de Cuna_, _Arpa Serena_, _Alarma Amable_.
  - Bucle de sonido continuo, control de volumen y soporte de vibración en móviles.
- **Monitor en Tiempo Real (`src/context/AlarmContext.jsx`)**:
  - Revisa automáticamente cada 20 segundos recordatorios, tomas de medicamentos, controles médicos y eventos del calendario.
  - Alerta en el minuto exacto del evento o con aviso previo configurable (5, 15 o 30 minutos antes).
  - Integrado con la API de Notificaciones del Navegador (`Notification API`) para alertar aun con la pestaña en segundo plano.
- **Ventana de Alarma Activa (`src/components/ActiveAlarmModal.jsx`)**:
  - Animación con ondas de sonido pulsantes.
  - Opciones rápidas: _Posponer 5 minutos_, _Silenciar y Entendido_, _Marcar como tomado/completado_.
- **Campana de Notificaciones (`src/components/NotificationBell.jsx`)**:
  - Contador en tiempo real en la barra superior.
  - Panel desplegable con agenda del día, selector de tonos, barra de volumen y botón para **probar sonido en 1 clic**.

### 3. 📚 Guías de Salud con Formateo Inteligente (`FormattedContent.jsx`)

- **Renderizado estructurado de textos médicos**:
  - **Tablas interactivas**: Detección y renderizado automático de tablas Markdown (ej. comparativas de _Braxton-Hicks vs Trabajo de Parto Real_) con diseño responsivo.
  - **Viñetas semánticas**:
    - ✅ Recomendaciones seguras y aprobadas.
    - ❌ Alimentos y factores a evitar.
    - 🚨 Señales de emergencia y parada inmediata.
    - **Dosis y nutrientes destacados**: negrita y alineación limpia.
  - **Buscador y filtros por categoría**: En Cuidados de Mamá (`/cuidados-mama`), Cuidados del Bebé (`/cuidados-bebe`) y Guía de Desarrollo Semana a Semana (`/guia-desarrollo`).

### 4. 📅 Calendario y Agenda Médica (`/calendario`)

- Visualización mensual interactiva con puntos indicadores de eventos.
- Filtrado por día y consolidación automática de controles, medicamentos y recordatorios.

### 5. 💊 Medicamentos y Vitaminas (`/medicamentos`)

- Registro de posología, frecuencia, hora de toma y rango de fechas.
- Botón de acción rápida **"Marcar como tomado"** con confirmación visual y sincronización de alarmas.

### 6. 🩺 Controles Médicos Prenatales (`/controles`)

- Historial completo de consultas obstétricas: médico, lugar, motivo, peso materno (kg), presión arterial (PA), frecuencia cardíaca (FC), altura uterina (cm), observaciones y fecha de próxima cita.

### 7. ⏰ Recordatorios Personalizados (`/recordatorios`)

- Categorías con iconos temáticos (medicamentos, vitaminas, ecografías, exámenes, citas, preparación para el parto).
- Reglas de repetición (diaria, semanal, mensual) y switches de notificación con alarma sonora.

### 8. 📸 Álbum, Diario y Síntomas

- **Álbum (`/album`)**: Subida y clasificación de fotos del vientre, ecografías y momentos especiales.
- **Diario (`/diario`)**: Espacio íntimo para registrar pensamientos y emociones.
- **Síntomas (`/sintomas`)**: Registro de malestares con nivel de intensidad y estado de ánimo.
- **Papá (`/papa`)**: Espacio para involucrar a la pareja con consejos y notas conjuntas.
- **Documentos (`/documentos`)**: Almacenamiento seguro de órdenes médicas, recetas y resultados.

---

## 🛠️ Tecnologías y Dependencias

- **React 19**: Interfaz declarativa, hooks avanzados y contextos globales.
- **Vite 8**: Servidor de desarrollo ultrarrápido y empaquetado optimizado.
- **Tailwind CSS v4**: Sistema de diseño HSL con tokens de color temáticos maternos y animaciones fluidas.
- **React Router DOM v7**: Enrutamiento protegido y navegación SPA.
- **Web Audio API**: Síntesis nativa de audio para alarmas y melodías.
- **Browser Notifications API**: Notificaciones nativas de escritorio y móvil.

---

## 📂 Estructura del Proyecto

```
frontend_control_prenatal/
├── src/
│   ├── api/
│   │   └── client.js              # Cliente HTTP con JWT y endpoints del backend
│   ├── components/
│   │   ├── ActiveAlarmModal.jsx   # Modal de alarma sonora activa con animación
│   │   ├── AppLayout.jsx          # Shell principal con barra superior y navegación
│   │   ├── AppNav.jsx             # Barra de navegación (sidebar en desktop, bottom en móvil)
│   │   ├── FormattedContent.jsx   # Formateador de tablas, viñetas y texto médico
│   │   ├── NotificationBell.jsx   # Campana de avisos, panel de eventos y ajustes de sonido
│   │   ├── ProgressRing.jsx       # Componente SVG circular de avance gestacional
│   │   ├── ProtectedRoute.jsx     # Guardia de rutas autenticadas
│   │   └── States.jsx             # Estados visuales (Loading, Empty, Error, Banner)
│   ├── context/
│   │   ├── AuthContext.jsx        # Estado global de usuario, login y sesión
│   │   └── AlarmContext.jsx       # Monitor de alarmas en tiempo real y preferencias
│   ├── pages/
│   │   ├── Album.jsx              # Galería de fotos y ecografías
│   │   ├── BabyDevelopmentGuide.jsx # Guía semana a semana con filtros y tablas
│   │   ├── BabyPage.jsx           # Perfil del bebé y contador de pataditas
│   │   ├── CalendarPage.jsx       # Calendario mensual interactivo
│   │   ├── Content.jsx            # Componente base de contenidos y cuidados
│   │   ├── ContentPages.jsx       # Páginas públicas/privadas de cuidados
│   │   ├── Countdown.jsx          # Cuenta regresiva al parto
│   │   ├── Dashboard.jsx          # Pantalla principal con resumen general
│   │   ├── Documents.jsx          # Gestor de documentos médicos
│   │   ├── GuestExplore.jsx       # Portal público para usuarios invitados
│   │   ├── Journal.jsx            # Diario personal de embarazo
│   │   ├── Login.jsx              # Inicio de sesión
│   │   ├── MedicalControls.jsx    # Registro de controles prenatales
│   │   ├── Medications.jsx        # Gestión de medicamentos y tomas
│   │   ├── Onboarding.jsx         # Configuración inicial del embarazo
│   │   ├── PartnerPage.jsx        # Página de papá / pareja
│   │   ├── PregnancyTimeline.jsx  # Línea de tiempo semana 1 a 40
│   │   ├── Profile.jsx            # Perfil y ajustes de alarmas y sonido
│   │   ├── Register.jsx           # Registro de cuenta
│   │   ├── Reminders.jsx          # Lista y creación de recordatorios
│   │   ├── Symptoms.jsx           # Registro de síntomas y estado anímico
│   │   └── Welcome.jsx            # Bienvenida y landing page
│   ├── styles/
│   │   └── index.css              # Tokens de color Tailwind v4 y estilos base
│   ├── utils/
│   │   └── soundAlarm.js          # Síntesis Web Audio API (4 tonos y bucle de alarma)
│   ├── App.jsx                    # Enrutador principal envuelto en Auth y Alarm Providers
│   └── main.jsx                   # Punto de entrada de React
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚡ Instalación y Ejecución Local

### Prerrequisitos

- Node.js >= 18
- pnpm o (npm / yarn)
- Backend de Control Prenatal corriendo en el puerto `4000`

### Pasos

1. **Instalar dependencias**:

   ```bash
   pnpm install
   ```

2. **Iniciar servidor de desarrollo**:

   ```bash
   pnpm run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`.

3. **Construir para producción**:
   ```bash
   pnpm run build
   ```

---

## 🐳 Despliegue con Docker y Docker Compose

### 1. Variables de Entorno (Opcional)

Copia el archivo de ejemplo para configurar el puerto o la URL del backend si es necesario:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `FRONTEND_PORT` | Puerto público del frontend | `80` |
| `BACKEND_URL` | URL del backend para proxy inverso (`/api` y `/uploads`) | `http://backend:4000` |

> [!TIP]
> Si el backend corre fuera de Docker en tu máquina local, establece `BACKEND_URL=http://host.docker.internal:4000`.

### 2. Despliegue con Docker Compose (Recomendado)

Construye y levanta el contenedor en segundo plano:

```bash
docker compose up -d --build
```

Para ver los logs en tiempo real:

```bash
docker compose logs -f
```

Para detener el servicio:

```bash
docker compose down
```

### 3. Construcción Manual con Dockerfile

```bash
# Construir imagen
docker build -t mibebe-frontend:latest .

# Ejecutar contenedor
docker run -d -p 80:80 \
  -e BACKEND_URL=http://host.docker.internal:4000 \
  --name mibebe-frontend \
  mibebe-frontend:latest
```

---

## 💡 Guía de Pruebas Rápidas

- **Probar Alarma Sonora**: Haz clic en el icono de la campana 🔔 en la barra superior y presiona **"🔊 Probar"**, o dirígete a **Mi Perfil > Alarmas y Sonido** y haz clic en **"🔔 Probar Alarma Ahora"**.
- **Probar Formato de Tablas**: Visita la **Guía de Desarrollo** y navega a las **Semanas 35-37** para observar la tabla comparativa de _Braxton-Hicks vs Trabajo de Parto_.
- **Probar Recordatorio con Alarma**: Crea un recordatorio con la fecha de hoy y hora a +1 minuto para verificar el sonido automático y la notificación.

