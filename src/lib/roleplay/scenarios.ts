// MOTOR PROCEDURAL CON VOCES 100% VERIFICADAS EN ELEVENLABS Y CALIBRACIÓN DE DIFICULTAD

export interface Prospecto {
  nombre: string;
  edad: number;
  puesto: string;
  contexto: string;
  avatar: string;
  voiceId: string;
  genero: 'M' | 'F';
}

export interface Personalidad {
  tipo: string;
  objecionFrecuente: string;
}

export interface Origen {
  tipo: string;
  titulo: string;
  icono: string;
  brief: string;
  tipPostLlamada: string;
}

export interface Scenario {
  prospecto: Prospecto;
  personalidad: Personalidad;
  origen: Origen;
  referidor: string | null;
  firstMessage: string;
  systemPrompt: string;
  difficultyLevel: number;
}

const PROFESIONES = [
  { puestoM: 'Dueño de Empresa de Logística', puestoF: 'Dueña de Empresa de Logística', contexto: 'maneja una flotilla de 20 camiones y vive saturado de llamadas de clientes' },
  { puestoM: 'Médico Cirujano Pediatra', puestoF: 'Médico Cirujana Pediatra', contexto: 'trabaja entre dos hospitales privados y casi no tiene tiempo para llamadas' },
  { puestoM: 'Director de Agencia de Marketing', puestoF: 'Directora de Agencia de Marketing', contexto: 'siempre anda coordinando campañas y es muy directa al grano' },
  { puestoM: 'Dueño de Cadena de Restaurantes', puestoF: 'Dueña de Cadena de Restaurantes', contexto: 'preocupado por flujo de efectivo e impuestos, cuida mucho su dinero' },
  { puestoM: 'Notario Público', puestoF: 'Notaria Pública', contexto: 'muy analítico, formal, educado y fijado en los detalles legales' },
  { puestoM: 'Arquitecto Independiente', puestoF: 'Arquitecta Independiente', contexto: 'hace proyectos residenciales, ingresos variables mes a mes' },
  { puestoM: 'Director de Planta Industrial', puestoF: 'Directora de Planta Industrial', contexto: 'enfocado en procesos, productividad y números concretos' },
  { puestoM: 'Contador y Asesor Fiscal', puestoF: 'Contadora y Asesora Fiscal', contexto: 'conoce muy bien las deducciones de impuestos pero es escéptico de seguros' },
  { puestoM: 'Dueño de Laboratorio Clínico', puestoF: 'Dueña de Laboratorio Clínico', contexto: 'busca estabilidad financiera y protección para su familia' },
  { puestoM: 'Empresario del Ramo Metalmecánico', puestoF: 'Empresaria del Ramo Metalmecánico', contexto: 'empresa familiar con 30 empleados, busca proteger el patrimonio' },
  { puestoM: 'Dentista con Clínica Propia', puestoF: 'Dentista con Clínica Propia', contexto: 'atiende pacientes todo el día, solo contesta entre citas' },
  { puestoM: 'Broker Inmobiliario', puestoF: 'Broker Inmobiliaria', contexto: 'acostumbrado a negociar comisiones y ventas, detecta de inmediato guiones de venta' },
  { puestoM: 'Director de TI / Software', puestoF: 'Directora de TI / Software', contexto: 'mente lógica, analítica, quiere saber el por qué de todo' },
  { puestoM: 'Distribuidor Mayorista de Abarrotes', puestoF: 'Distribuidora Mayorista de Abarrotes', contexto: 'persona práctica, de trato directo, no le gustan los rodeos' },
  { puestoM: 'Veterinario y Dueño de Hospital Animal', puestoF: 'Veterinaria y Dueña de Hospital Animal', contexto: 'enfocado en bienestar y familia pero muy ocupado' }
];

const VOCES_HOMBRES = [
  'TNuNcwk4LzbPpi1XEANc', // Adriel
  'htFfPSZGJwjBv1CL0aMD', // Antonio
  '6DsgX00trsI64jl83WWS'  // Alex
];

const VOCES_MUJERES = [
  'cAvMBIZ0VNTU8XdsUpEq', // Susana Elizabeth
  'ewn5JTa3lNPY8QVuZJi6', // Ana Sofía
  'EsHsbdAoFNIyDFJ5UnZx', // Cristina
  'FIhWHKTvfI9sX1beLEJ8', // Diana Sanchez
  '9Godp7dNohUvXk6qp0gS'  // Regina
];

const PROSPECTOS_PERSONAS: { nombre: string; genero: 'M' | 'F' }[] = [
  { nombre: 'Roberto Méndez', genero: 'M' },
  { nombre: 'Claudia Ramos', genero: 'F' },
  { nombre: 'Fernando Garza', genero: 'M' },
  { nombre: 'Sofía Morales', genero: 'F' },
  { nombre: 'Carlos Eduardo Sada', genero: 'M' },
  { nombre: 'Mariana Elizondo', genero: 'F' },
  { nombre: 'Alejandro Treviño', genero: 'M' },
  { nombre: 'Patricia Villarreal', genero: 'F' },
  { nombre: 'Mauricio Cantú', genero: 'M' },
  { nombre: 'Gabriela Lozano', genero: 'F' },
  { nombre: 'Héctor De la Garza', genero: 'M' },
  { nombre: 'Lorena Salinas', genero: 'F' }
];

const PERSONALIDADES = [
  {
    tipo: 'Acelerado y con prisa',
    comportamiento: 'Habla rápido, dice que tiene 30 segundos porque entra a una llamada o reunión.',
    objecionFrecuente: 'Platíqueme rápido por favor que voy entrando a una junta.',
    dificultad: 'baja'
  },
  {
    tipo: 'Escéptico y desconfiado',
    comportamiento: 'Desconfía de llamadas de ventas, pregunta directo de dónde sacaron su número y qué aseguradora es.',
    objecionFrecuente: 'Mire, la verdad no creo en los seguros, todos prometen y nunca pagan.',
    dificultad: 'alta'
  },
  {
    tipo: 'Amable pero evasivo',
    comportamiento: 'Muy cordial, educado, pero su estrategia es mandar todo por WhatsApp para no comprometerse.',
    objecionFrecuente: 'Suena muy bien, mándamelo por WhatsApp con calma y yo lo reviso el fin de semana.',
    dificultad: 'baja'
  },
  {
    tipo: 'Analítico numérico',
    comportamiento: 'Quiere saber números, costos y porcentajes antes de aceptar cualquier cita.',
    objecionFrecuente: 'Pero dígame los números primero, ¿de cuánto estamos hablando al mes?',
    dificultad: 'media'
  },
  {
    tipo: 'Satisfecho (Ya tiene seguros)',
    comportamiento: 'Afirma que ya está cubierto por su banco o por la empresa y no necesita nada más.',
    objecionFrecuente: 'Gracias, pero ya tengo seguro con otra compañía y estoy cubierto.',
    dificultad: 'media'
  },
  {
    tipo: 'Mala experiencia previa',
    comportamiento: 'Tuvo una mala experiencia con una aseguradora o banco en el pasado y siente desconfianza general.',
    objecionFrecuente: 'Mire, la verdad no creo en los seguros, tuve una mala experiencia donde no quisieron pagar y no me interesa.',
    dificultad: 'alta'
  },
  {
    tipo: 'Empresario cortante y sin rodeos',
    comportamiento: 'Trato seco y ejecutivo. Exige que le digan de qué se trata en 10 segundos o cuelga.',
    objecionFrecuente: 'A ver, dígame al grano de qué se trata y cuánto cuesta o tengo que colgar.',
    dificultad: 'alta'
  }
];

const ORIGENES = [
  {
    tipo: 'referido_avisado',
    titulo: 'REFERIDO AVISADO',
    icono: '🤝',
    dificultad: 'baja',
    generar: (referidor: string) => ({
      brief: `Tu cliente "${referidor}" le recomendó tu servicio y le avisó que le ibas a llamar hoy.`,
      tipPostLlamada: `En prospectos referidos avisados, menciona el nombre de ${referidor} en los primeros 5 segundos para que te ubique inmediatamente y baje la guardia.`,
      promptContext: `Fuiste referido por tu amigo/socio "${referidor}", quien te comentó que un asesor de AACOM Seguros te marcaría. Sí recuerdas la recomendación, pero quieres saber de qué se trata exactamente antes de dar tu tiempo.`
    })
  },
  {
    tipo: 'inbound_solicitado',
    titulo: 'PIDIÓ INFORMES (INBOUND)',
    icono: '🔥',
    dificultad: 'baja',
    generar: (_?: string) => ({
      brief: `El prospecto dejó sus datos en una publicación de internet de AACOM Seguros hace unos días.`,
      tipPostLlamada: `Recuérdale que él mismo solicitó la asesoría en la página web, pero no asumas que tiene 1 hora para hablar hoy; enfócate en agendar la reunión formal.`,
      promptContext: `Llenaste un formulario en internet de AACOM Seguros hace unos días por curiosidad sobre ahorro o protección. Recuerdas haberlo hecho, pero andas ocupado en tu trabajo y no quieres que te den un discurso largo por teléfono.`
    })
  },
  {
    tipo: 'frio_total',
    titulo: 'LLAMADA EN FRÍO TOTAL',
    icono: '❄️',
    dificultad: 'alta',
    generar: (_?: string) => ({
      brief: `Contacto nuevo en frío. El prospecto NO TIENE IDEA de quién eres ni espera tu llamada.`,
      tipPostLlamada: `En frío no hay confianza previa: tienes solo 15 segundos para dar un gancho de curiosidad o dolor profesional antes de que te corte.`,
      promptContext: `No conoces a la persona que te llama ni a AACOM Seguros. Es un número no registrado. Eres cortante al inicio y preguntas con quién hablas y de dónde obtuvieron tus datos.`
    })
  }
];

const REFERIDORES = [
  'Juan Carlos Treviño', 'María Elena Garza', 'Dr. Ricardo Lozano', 'Lic. Andrés Morales',
  'Sofía Villarreal', 'Ing. Roberto Sada', 'Mauricio Benavides', 'Dra. Marcela Canales',
  'Lic. Guillermo Elizondo', 'Arq. David Zambrano', 'Karla De la Torre', 'Ing. Esteban Quijano'
];

export function generarEscenarioAleatorio(level = 1): Scenario {
  const currentLevel = Math.max(1, Math.min(6, Math.floor(level) || 1));
  const persona = PROSPECTOS_PERSONAS[Math.floor(Math.random() * PROSPECTOS_PERSONAS.length)];
  const profesion = PROFESIONES[Math.floor(Math.random() * PROFESIONES.length)];
  const referidor = REFERIDORES[Math.floor(Math.random() * REFERIDORES.length)];

  let origenBase = ORIGENES[0];
  let personalidad = PERSONALIDADES[0];
  let rigorNivel = '';

  if (currentLevel <= 2) {
    const prob = Math.random();
    origenBase = prob < 0.70 ? ORIGENES[0] : ORIGENES[1];
    const personalidadesBajas = PERSONALIDADES.filter(p => p.dificultad === 'baja' || p.dificultad === 'media');
    personalidad = personalidadesBajas[Math.floor(Math.random() * personalidadesBajas.length)];
    rigorNivel = 'Eres relativamente accesible. Si el asesor menciona al referidor o la solicitud y ofrece dos horarios de 30-40 min, aceptas con amabilidad sin hacer demasiadas trabas.';
  } else if (currentLevel <= 4) {
    const prob = Math.random();
    if (prob < 0.40) origenBase = ORIGENES[0];
    else if (prob < 0.75) origenBase = ORIGENES[2];
    else origenBase = ORIGENES[1];

    const personalidadesMedias = PERSONALIDADES.filter(p => p.dificultad === 'media' || p.tipo.includes('Acelerado') || p.tipo.includes('Analítico'));
    personalidad = personalidadesMedias[Math.floor(Math.random() * personalidadesMedias.length)] || PERSONALIDADES[0];
    rigorNivel = 'Exiges respeto a tu tiempo. Si no te explican claro de qué se trata o intentan darte un rollo largo, insistes con "¿de qué números estamos hablando?" o "mándemelo por correo". Solo aceptas si usan firmemente el argumento de diagnóstico antes de recetar y la doble alternativa.';
  } else {
    const prob = Math.random();
    if (prob < 0.65) origenBase = ORIGENES[2];
    else if (prob < 0.90) origenBase = ORIGENES[0];
    else origenBase = ORIGENES[1];

    const personalidadesAltas = PERSONALIDADES.filter(p => p.dificultad === 'alta');
    personalidad = personalidadesAltas[Math.floor(Math.random() * personalidadesAltas.length)] || PERSONALIDADES[1];
    rigorNivel = 'Eres un prospecto difícil, exigente y de alto nivel. Si el asesor titubea, habla como novato, o intenta soltar cotizaciones o pólizas por teléfono, le dices tajantemente: "Mire, no me interesa, que tenga buen día" y buscas colgar. SOLO si demuestra una postura ejecutiva impecable, empatía con tu tiempo, explica con maestría que manejan un abanico tan amplio que es irresponsable recomendar sin diagnosticar primero, y clava la doble alternativa de 30-40 minutos, te dejas convencer y le concedes la reunión.';
  }

  const edad = 35 + Math.floor(Math.random() * 20);
  const puesto = persona.genero === 'F' ? profesion.puestoF : profesion.puestoM;
  const ctx = origenBase.generar(referidor);

  const pLower = puesto.toLowerCase();
  let avatarUrl = '/avatars/roberto.jpg';
  if (persona.genero === 'F') {
    if (pLower.includes('médic') || pLower.includes('pediatra') || pLower.includes('dentista') || pLower.includes('laboratorio')) {
      avatarUrl = '/avatars/claudia.jpg';
    } else {
      avatarUrl = '/avatars/exec_female.jpg';
    }
  } else {
    if (pLower.includes('industrial') || pLower.includes('planta') || pLower.includes('metalmecánico')) {
      avatarUrl = '/avatars/fernando.jpg';
    } else {
      avatarUrl = '/avatars/roberto.jpg';
    }
  }

  const voiceId = persona.genero === 'M'
    ? VOCES_HOMBRES[Math.floor(Math.random() * VOCES_HOMBRES.length)]
    : VOCES_MUJERES[Math.floor(Math.random() * VOCES_MUJERES.length)];

  const primerNombre = persona.nombre.split(' ')[0];
  const primerosSaludos: Record<string, string[]> = {
    referido_avisado: [
      `¿Bueno? Sí, dígame, ¿quién habla?`,
      `¿Bueno? Sí, con ${primerNombre}, dígame.`,
      `¿Bueno? Habla ${primerNombre}, a sus órdenes.`
    ],
    frio_total: [
      `¿Bueno? Sí, ¿de parte de quién?`,
      `¿Bueno? Con ${persona.nombre}, ¿quién habla?`,
      `¿Bueno? Sí, dígame rápido que ando ocupado.`
    ],
    inbound_solicitado: [
      `¿Bueno? Sí, dígame.`,
      `¿Bueno? Sí, con ${primerNombre}.`,
      `¿Bueno? Hola, dígame.`
    ]
  };

  const saludosLista = primerosSaludos[origenBase.tipo] || primerosSaludos.frio_total;
  const firstMessage = saludosLista[Math.floor(Math.random() * saludosLista.length)];

  const systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
Estás en México y recibes una llamada de un asesor de **AACOM Seguros**.
Nivel de dificultad del reto: **NIVEL ${currentLevel}**.

### SITUACIÓN DEL CONTACTO:
${ctx.promptContext}

### TU PERSONALIDAD EN ESTA LLAMADA:
- Eres: **${personalidad.tipo}**.
- Actitud: ${personalidad.comportamiento}
- Comportamiento según nivel: ${rigorNivel}
- Tu objeción típica que soltarás cuando intenten hablarte: "${personalidad.objecionFrecuente}"
- Hablas en frases cortas de 1 a 2 oraciones, tono natural mexicano de llamada telefónica.

### LA REGLA DE ORO DE LA LLAMADA (CRUCIAL):
1. **SI EL ASESOR INTENTA VENDERTE O EXPLICARTE COBERTURAS POR TELÉFONO:**
   - Si empieza a hablarte de pólizas específicas, sumas aseguradas, deducibles, seguros de auto o primas mensuales:
   - Te da pereza o desconfianza y dices: "Mire, la verdad no estoy buscando eso ahorita. Mándeme la información al correo y yo le aviso si me interesa. Gracias." y buscas colgar.

2. **SI EL ASESOR USA LA TÉCNICA CORRECTA (ASESORÍA + DIAGNÓSTICO ANTES DE RECETAR):**
   - Si te explica que en **AACOM Seguros** brindan una **asesoría financiera personalizada**, y aclara que **manejan tantas soluciones y opciones que sería imposible o irresponsable recomendarte la más adecuada sin antes conocer tu situación particular y platicar unos 30 o 40 minutos**:
   - Tu actitud cambia favorablemente: "Bueno... viéndolo de esa manera tiene sentido, tiene razón en que no me puede dar un diagnóstico a ciegas sin conocerme."
   - Preguntas: "¿Y cuánto tiempo dice que le tomaría esa reunión?"

3. **CÓMO Y CUÁNDO ACEPTAS LA CITA:**
   - Solo aceptas si te pide una reunión de **30 a 40 minutos** (en tu oficina o un café) y te ofrece dos opciones de horario con la técnica de doble alternativa (ej: "¿Le queda mejor el martes a las 11:00 am o el jueves a las 4:00 pm?").
   - Al escuchar eso respondes convencido: "Me parece bien. El jueves a las 4 me queda bien en mi oficina. Déjeme anotarlo. ¿Con quién tengo el gusto nuevamente?" y das por cerrada la cita con éxito.`;

  return {
    prospecto: {
      nombre: persona.nombre,
      edad,
      puesto,
      contexto: profesion.contexto,
      avatar: avatarUrl,
      voiceId,
      genero: persona.genero
    },
    personalidad: {
      tipo: personalidad.tipo,
      objecionFrecuente: personalidad.objecionFrecuente
    },
    origen: {
      tipo: origenBase.tipo,
      titulo: origenBase.titulo,
      icono: origenBase.icono,
      brief: ctx.brief,
      tipPostLlamada: ctx.tipPostLlamada
    },
    referidor: origenBase.tipo === 'referido_avisado' ? referidor : null,
    firstMessage,
    systemPrompt,
    difficultyLevel: currentLevel
  };
}
