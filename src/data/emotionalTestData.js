/**
 * Datos y contenidos clínicos para el Test de Bienestar Emocional Materno y Tips Asertivos
 * Basado en la Escala de Depresión Perinatal de Edimburgo (EPDS) y lineamientos de
 * Salud Mental Perinatal del Ministerio de Salud y Protección Social de Colombia (Res. 3280 de 2018).
 */

export const EMOTIONAL_QUESTIONS = [
  {
    id: 1,
    dimension: 'Disfrute y capacidad de reír',
    question: 'En los últimos 7 días, ¿has sido capaz de reírte y ver el lado divertido de las cosas?',
    options: [
      { text: 'Tanto como siempre o con facilidad', points: 0, icon: '😊' },
      { text: 'Un poco menos de lo habitual', points: 1, icon: '🙂' },
      { text: 'Definitivamente mucho menos ahora', points: 2, icon: '😐' },
      { text: 'Para nada, me cuesta mucho conectar con el buen humor', points: 3, icon: '😔' },
    ],
  },
  {
    id: 2,
    dimension: 'Optimismo e ilusión hacia el futuro',
    question: '¿Has mirado hacia el futuro con ilusión y anticipación positiva?',
    options: [
      { text: 'Tanto como siempre me ha gustado hacerlo', points: 0, icon: '✨' },
      { text: 'Algo menos de lo que solía ilusionarme', points: 1, icon: '🌤️' },
      { text: 'Definitivamente mucho menos de lo normal', points: 2, icon: '🌥️' },
      { text: 'Casi nunca o me gana la incertidumbre', points: 3, icon: '🌧️' },
    ],
  },
  {
    id: 3,
    dimension: 'Sentimiento de culpa y autoexigencia',
    question: '¿Te has culpado a ti misma sin necesidad cuando las cosas no salen como esperabas?',
    options: [
      { text: 'No, casi nunca me castigo por eso', points: 0, icon: '🌱' },
      { text: 'Rara vez, intento ser comprensiva conmigo', points: 1, icon: '🌿' },
      { text: 'Sí, a veces me culpo y me siento insuficiente', points: 2, icon: '🍂' },
      { text: 'Sí, muy a menudo siento que todo es mi culpa', points: 3, icon: '🥀' },
    ],
  },
  {
    id: 4,
    dimension: 'Ansiedad y preocupación constante',
    question: '¿Has sentido ansiedad, inquietud o preocupación excesiva sin un motivo claro?',
    options: [
      { text: 'No, para nada o solo preocupaciones lógicas del momento', points: 0, icon: '🕊️' },
      { text: 'Casi nada, logro calmarme con facilidad', points: 1, icon: '🍃' },
      { text: 'Sí, a veces mi mente se llena de escenarios negativos', points: 2, icon: '⚡' },
      { text: 'Sí, muy a menudo me siento intranquila y no puedo parar', points: 3, icon: '🌪️' },
    ],
  },
  {
    id: 5,
    dimension: 'Miedo o sensación de pánico',
    question: '¿Has sentido miedo, agobio repentino o sensación de que algo malo va a ocurrir?',
    options: [
      { text: 'No, no me ha ocurrido', points: 0, icon: '🛡️' },
      { text: 'Muy poco, solo momentos pasajeros', points: 1, icon: '☁️' },
      { text: 'Sí, en algunos momentos me ha dado bastante angustia', points: 2, icon: '⚠️' },
      { text: 'Sí, con bastante frecuencia siento ese nudo en el pecho', points: 3, icon: '🚨' },
    ],
  },
  {
    id: 6,
    dimension: 'Sensación de sobrecarga y desborde',
    question: '¿Sientes que las exigencias del día a día o del embarazo te están superando?',
    options: [
      { text: 'He podido manejar las cosas como de costumbre', points: 0, icon: '💪' },
      { text: 'La mayor parte del tiempo lo llevo bien con algunas pausas', points: 1, icon: '🧘' },
      { text: 'Sí, a veces no he podido sobrellevarlo todo como quisiera', points: 2, icon: '🎒' },
      { text: 'Sí, la mayor parte del tiempo siento que no puedo con todo', points: 3, icon: '🌋' },
    ],
  },
  {
    id: 7,
    dimension: 'Calidad del descanso mental',
    question: '¿Has tenido dificultad para dormir o descansar debido a la preocupación o rumiación mental?',
    options: [
      { text: 'No, duermo y descanso bien dentro de lo físico del embarazo', points: 0, icon: '🌙' },
      { text: 'Solo ocasionalmente me quedo pensando', points: 1, icon: '🌌' },
      { text: 'Sí, varias noches me cuesta apagar los pensamientos', points: 2, icon: '🕯️' },
      { text: 'Sí, la mayor parte del tiempo no logro descansar por angustia', points: 3, icon: '🌑' },
    ],
  },
  {
    id: 8,
    dimension: 'Tristeza o ganas de llorar',
    question: '¿Te has sentido triste, decaída o con llanto frecuente?',
    options: [
      { text: 'No, me he sentido en un ánimo estable y contenta', points: 0, icon: '☀️' },
      { text: 'Solo de vez en cuando (por cambios hormonales típicos)', points: 1, icon: '⛅' },
      { text: 'Sí, con bastante frecuencia me siento triste o sensible', points: 2, icon: '💧' },
      { text: 'Sí, la mayor parte del tiempo tengo profunda tristeza', points: 3, icon: '🌧️' },
    ],
  },
  {
    id: 9,
    dimension: 'Apoyo y acompañamiento',
    question: '¿Sientes que cuentas con personas con las que puedes hablar con honestidad de lo que sientes?',
    options: [
      { text: 'Sí, me siento muy acompañada y escuchada por mi red o pareja', points: 0, icon: '🤝' },
      { text: 'Tengo a alguien de confianza, aunque a veces me guardo cosas', points: 1, icon: '💬' },
      { text: 'Siento que casi nadie comprende lo que realmente estoy viviendo', points: 2, icon: '🪟' },
      { text: 'Me siento completamente sola e incomprendida en este proceso', points: 3, icon: '🚪' },
    ],
  },
  {
    id: 10,
    dimension: 'Conexión y amor hacia una misma y el bebé',
    question: '¿Cómo sientes tu diálogo interno hacia ti misma en esta etapa?',
    options: [
      { text: 'Amoroso y comprensivo, reconozco mi esfuerzo y valor', points: 0, icon: '💖' },
      { text: 'Mayormente bueno, con alguna duda normal', points: 1, icon: '🌸' },
      { text: 'Muy crítico, me exijo demasiado para ser la madre perfecta', points: 2, icon: '⚡' },
      { text: 'Muy duro y desesperanzador, siento que no seré capaz', points: 3, icon: '💔' },
    ],
  },
];

export const EMOTIONAL_RANGES = [
  {
    min: 0,
    max: 8,
    level: 'optimo',
    title: 'Bienestar Emocional en Equilibrio',
    badge: '🟢 Estado Favorable y Tranquilo',
    color: 'border-secondary bg-secondary-container/20 text-on-surface',
    badgeColor: 'bg-secondary-container text-on-secondary-container',
    summary: 'Estás transitando tu embarazo con buena estabilidad anímica, recursos de afrontamiento sanos y conexión positiva con tu proceso.',
    detail: 'Es perfectamente normal que existan días con más cansancio físico o momentos de duda, pero en general conservas la capacidad de disfrutar, descansar y confiar en tu cuerpo. Mantén tus espacios de desconexión y sigue cuidándote con amor.',
    primaryRecommendation: 'Continúa fortaleciendo tus rituales de calma, descanso y vínculo diario con tu bebé.',
  },
  {
    min: 9,
    max: 14,
    level: 'moderado',
    title: 'Sobrecarga Emocional y Estrés Gestacional Leve a Moderado',
    badge: '🟡 Necesitas Pausa y Contención',
    color: 'border-tertiary bg-tertiary-container/25 text-on-surface',
    badgeColor: 'bg-tertiary-container text-on-tertiary-container',
    summary: 'Tu mente y tu cuerpo están dando señales claras de cansancio acumulado, autoexigencia o preocupaciones que te están pesando.',
    detail: 'En el embarazo es muy frecuente sentir que las expectativas ajenas y propias son abrumadoras. No tienes que poder con todo ni ser una súper-mamá. Es momento de bajar la velocidad, delegar tareas cotidianas, establecer límites claros y hablar abiertamente con tu pareja o red de apoyo.',
    primaryRecommendation: 'Practica técnicas de respiración consciente, di "no" a compromisos innecesarios y permítete descansar sin culpa.',
  },
  {
    min: 15,
    max: 30,
    level: 'vulnerable',
    title: 'Vulnerabilidad Emocional Alta / Señal de Alerta Perinatal',
    badge: '🔴 Tu Salud Mental Requiere Acompañamiento Prioritario',
    color: 'border-error bg-error-container/20 text-on-surface',
    badgeColor: 'bg-error-container text-on-error-container',
    summary: 'Tus respuestas reflejan un nivel significativo de angustia, tristeza profunda o ansiedad que excede lo que debes sobrellevar sola.',
    detail: 'Querida mamá: lo que sientes NO es falta de amor por tu bebé, NO es debilidad y NO significa que seas una mala madre. La depresión y la ansiedad perinatal son condiciones médicas reales, frecuentes (afectan a 1 de cada 5 gestantes) y con excelente tratamiento cuando se atienden a tiempo. Mereces sentirte bien y recibir contención profesional sin juicios.',
    primaryRecommendation: 'Te recomendamos compartir esto en tu próximo control prenatal o consultar con un profesional de psicología/psiquiatría perinatal. También puedes comunicarte de inmediato con las líneas de apoyo gratuitas en Colombia.',
    showHelpline: true,
  },
];

export const ASRT_TIPS_CATEGORIES = [
  { id: 'todos', name: 'Todos los Tips' },
  { id: 'calma', name: 'Mente en Calma 🧘' },
  { id: 'culpa', name: 'Soltar la Culpa 💖' },
  { id: 'asertividad', name: 'Límites Asertivos 🛡️' },
  { id: 'pareja', name: 'Pareja y Red de Apoyo 🤝' },
  { id: 'bebe', name: 'Conexión con el Bebé 👶' },
];

export const ASSERTIVE_TIPS = [
  {
    id: 'respiracion-446',
    category: 'calma',
    icon: '🌬️',
    title: 'Técnica de Respiración Diafragmática (4-4-6)',
    subtitle: 'Activa el nervio vago y calma la taquicardia en 2 minutos',
    evidence: 'Basado en neurofisiología del sistema nervioso parasimpático.',
    body: `Cuando sientas el pecho apretado o pensamientos rumiantes, haz esto:
1. Inhala por la nariz inflando el abdomen durante 4 segundos.
2. Sostén el aire suavemente durante 4 segundos.
3. Exhala muy despacio por la boca con los labios semicerrados durante 6 segundos.
4. Repite este ciclo 4 o 5 veces.

*Efecto comprobado:* La exhalación prolongada envía una señal química inmediata a tu corazón para reducir la adrenalina y oxigena óptimamente la placenta.`,
    hasInteractiveAction: 'breathing',
  },
  {
    id: 'desmitificar-madre-perfecta',
    category: 'culpa',
    icon: '🌸',
    title: 'Desactivar el Mito de la "Madre Perfecta"',
    subtitle: 'La maternidad real incluye cansancio, dudas y días grises',
    evidence: 'Psicología Perinatal — Concepto de la "Madre Suficientemente Buena" (D. Winnicott).',
    body: `A menudo las redes sociales o comentarios familiares hacen creer que una mujer embarazada debe estar radiante las 24 horas del día. 

**La verdad médica y humana:**
- Es 100% normal sentir miedo al parto, extrañar tu rutina previa o sentirte sobrepasada por los cambios físicos.
- Tener un mal día o llorar no le hace daño irreparable a tu bebé. Lo que protege a tu bebé es que tú seas amable contigo misma.
- Tu bebé no necesita una madre perfecta e inagotable; necesita una mamá real que sepa escucharse y cuidarse.`,
  },
  {
    id: 'limites-comentarios-cuerpo',
    category: 'asertividad',
    icon: '🛡️',
    title: 'Límites Asertivos para Comentarios sobre tu Cuerpo o Barriga',
    subtitle: 'Respuestas firmes, educadas y sin desgastarte',
    evidence: 'Entrenamiento en Asertividad y Protección del Espacio Personal.',
    body: `Durante el embarazo abundan frases como: *"¿Estás segura de que no son gemelos?"*, *"Se te ve la cara hinchada"*, o gente tocando tu barriga sin permiso.

**Fórmulas asertivas listas para usar:**
- *Si tocan tu pancita sin consultar:* Da un paso atrás con una sonrisa tranquila y di: *"Prefiero que no me toques la barriga, me pongo sensible con el contacto físico en esta etapa."*
- *Si opinan sobre tu peso o tamaño:* *"Mi médico y yo estamos muy tranquilos con mi evolución; gracias por preocuparte."*
- *Si te llenan de historias de partos traumáticos:* *"Prefiero no escuchar experiencias difíciles ahora; estoy concentrada en cultivar paz para el nacimiento de mi bebé."*`,
  },
  {
    id: 'comunicacion-no-violenta-pareja',
    category: 'pareja',
    icon: '💬',
    title: 'Cómo Pedir Ayuda Concreta sin Caer en el Reclamo',
    subtitle: 'Fórmula Hecho + Emoción + Petición Específica',
    evidence: 'Modelo de Comunicación No Violenta (Marshall Rosenberg).',
    body: `Cuando estamos agotadas, es fácil explotar con generalizaciones: *"¡Nunca me ayudas en nada!"*. Esto suele provocar que la otra persona se ponga a la defensiva.

**Aplica esta estructura asertiva de 3 pasos:**
1. **El hecho objetivo (sin juzgar):** *"Hoy he tenido mucho dolor pélvico y pesadez en las piernas."*
2. **Cómo te sientes:** *"Me siento agotada física y mentalmente."*
3. **La petición concreta:** *"¿Podrías encargarte tú de preparar la cena y dejar la cocina lista hoy? Eso me permitiría acostarme a descansar media hora antes."*

Las peticiones concretas tienen un 80% más de probabilidad de éxito y construyen complicidad en lugar de distancia.`,
  },
  {
    id: 'caja-de-preocupaciones',
    category: 'calma',
    icon: '📦',
    title: 'La Técnica de la "Caja de Preocupaciones"',
    subtitle: 'Ponle hora a la ansiedad y libera el resto del día',
    evidence: 'Terapia Cognitivo-Conductual Perinatal (TCC).',
    body: `Si tu mente insiste en pensar en: "¿y si el parto se complica?", "¿y si no produzco suficiente leche?", haz este ejercicio:

1. Toma un cuaderno o tu diario en la app y escribe exactamente la preocupación que te ronda.
2. Ciérralo y di mentalmente: *"Ya está anotado. Le dedicaré 15 minutos a las 5:00 p.m. Ahora elijo enfocarme en lo que tengo enfrente."*
3. Cuando llegue la hora pactada, léelo y clasifícalo:
   - **¿Está bajo mi control hoy?** (ej. empacar la maleta de la clínica, preguntar al obstetra). Haz un plan simple.
   - **¿Es una fantasía catastrófica fuera de mi control?** Respira hondo y déjalo ir: *"Hoy elijo confiar en el equipo médico y en mi cuerpo."*`,
  },
  {
    id: 'ritual-cinco-minutos',
    category: 'bebe',
    icon: '🤰',
    title: 'El Ritual de los 5 Minutos: Conexión Prenatal',
    subtitle: 'Sincroniza tu ritmo cardíaco con el de tu bebé',
    evidence: 'Psicología Fetal y Vínculo de Apego Seguro Temprano.',
    body: `A partir del segundo trimestre, el sistema auditivo y táctil de tu bebé está activo. Siente tus cambios posturales y reconoce el tono grave de tu voz.

**Tu pausa diaria de conexión:**
- Siéntate cómoda y coloca ambas manos suavemente sobre tu vientre.
- Cierra los ojos y haz 3 respiraciones profundas.
- Habla en voz baja o mentalmente con tu bebé: *"Aquí estoy contigo, estamos aprendiendo juntos, eres muy bienvenido/a."*
- Nota el calor de tus manos transmitiéndose hacia tu útero. Este sencillo momento reduce los niveles de cortisol materno en sangre.`,
  },
  {
    id: 'visitas-postparto-limites',
    category: 'asertividad',
    icon: '🚪',
    title: 'Poner Reglas Claras para las Visitas del Parto y Postparto',
    subtitle: 'El nacimiento no es un evento social; es un momento íntimo de adaptación',
    evidence: 'Protocolos de Humanización del Parto y Cuidado Puerperal.',
    body: `Muchas mamás se sienten angustiadas pensando en tener la sala llena de visitas en la clínica o en casa cuando están con puntos, dolor de pechos o aprendiendo a amamantar.

**Mensaje asertivo para enviar por WhatsApp antes del parto:**
*"Familia y amigos queridos: estamos muy emocionados por la llegada de nuestro bebé. Los primeros días en casa nos enfocaremos exclusivamente en la recuperación de mamá y la adaptación del bebé. Les estaremos avisando con mucho cariño cuando estemos listos para recibir visitas cortas. ¡Agradecemos profundamente su comprensión y amor!"*`,
  },
];

export const COLOMBIA_HELPLINES = [
  {
    name: 'Línea 106 (Escucha Activa y Salud Mental)',
    description: 'Atención psicológica gratuita, confidencial y continua las 24 horas del día en Colombia.',
    phone: '106',
    callAction: 'tel:106',
    icon: '📞',
    type: 'Nacional Gratuita',
  },
  {
    name: 'Línea Púrpura Distrital (Mujeres)',
    description: 'Atención especializada para mujeres por profesionales en psicología, trabajo social y salud.',
    phone: '018000 112 137 / WhatsApp: 300 755 1846',
    callAction: 'tel:018000112137',
    icon: '💜',
    type: 'Especializada Mujeres',
  },
  {
    name: 'Línea 192 (Ministerio de Salud de Colombia)',
    description: 'Opción 4: Asesoría profesional en salud mental y apoyo emocional materno-perinatal.',
    phone: '192',
    callAction: 'tel:192',
    icon: '🏛️',
    type: 'MinSalud Oficial',
  },
  {
    name: 'Línea de Emergencias 123',
    description: 'Para situaciones de crisis inmediata o urgencia médica obstétrica en todo el país.',
    phone: '123',
    callAction: 'tel:123',
    icon: '🚨',
    type: 'Emergencias 24/7',
  },
];
