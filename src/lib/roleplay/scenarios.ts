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

export function generarEscenarioAleatorio(level = 1, moduleId = 'prospeccion'): Scenario {
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

  let systemPrompt = "";

  if (moduleId === 'adn') {
    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
Estás en una videollamada agendada (Cita de Análisis de Necesidades o ADN) con un asesor financiero.
YA ACEPTASTE ESTA REUNIÓN, así que estás dispuesto a platicar. No pongas objeciones de "no tengo tiempo" ni "mándamelo por correo".

### TU IDENTIDAD Y PSICOLOGÍA:
- Tono: Natural, mexicano, oraciones de longitud normal.
- Tu prioridad secreta que el asesor debe descubrir: ${personalidad.tipo.includes('Analítico') ? 'El retiro y la deducción de impuestos.' : 'Dejar protegida a tu familia si llegaras a faltar.'}
- Presupuesto mensual disponible: Entre 3,000 y 5,000 MXN mensuales, pero no lo digas a menos que te pregunten directamente.

### CÓMO DEBES ACTUAR:
1. Responde amablemente a las preguntas sobre tu familia, trabajo, hobbies o metas (Rompehielo / FORD).
2. Si el asesor te intenta vender un seguro o PPR *antes* de preguntarte por tus metas o situación, frénate: "Oye, pero ni siquiera te he contado qué es lo que estoy buscando, ¿cómo sabes que eso me sirve?".
3. Si te pregunta por tu presupuesto, sé sincero pero cauto: "Pues la verdad no sé cuánto cuesta esto, pero yo creo que unos 4,000 pesos al mes sí los puedo ahorrar".
4. Para terminar exitosamente la llamada, el asesor debe decirte que se llevará la información para armar una propuesta a la medida, y te debe proponer agendar la siguiente reunión (Cita de Presentación o Cierre). Si lo hace, aceptas gustoso.`;

  } else if (moduleId === 'objeciones') {
    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
Estás en la videollamada final (Cita de Cierre). El asesor ya te presentó la cotización de tu plan financiero.

### TU IDENTIDAD Y PSICOLOGÍA:
- Tono: Defensivo, exigente, pones trabas. Eres ${personalidad.tipo}.
- Tienes UNA gran objeción principal (elige una al azar y mantente firme en ella): "Está muy caro / Se me sale de presupuesto", "Déjame pensarlo y yo te marco", o "Tengo un amigo que me vende lo mismo".

### CÓMO DEBES ACTUAR:
1. Al iniciar la simulación, lanza tu objeción principal de inmediato.
2. Si el asesor se rinde rápido o te dice "Bueno, piénsalo", termina la llamada decepcionado.
3. Si el asesor te ataca, te dice que estás equivocado o discute contigo, enójate y rechaza el trato.
4. SOLO CUMPLES Y ACEPTAS CERRAR SI EL ASESOR:
   a) Muestra empatía real ("Te entiendo perfectamente", "Es normal sentir eso").
   b) Aísla la objeción ("Aparte de eso, ¿hay algo más que te detenga?").
   c) Usa una buena técnica de rebote (ej. "Otros clientes sentían lo mismo, pero encontraron que el valor lo justifica...").
   d) Te empuja al cierre asumiendo ("Entonces, ¿ponemos el cargo a tu tarjeta?").
5. Exiges que peleén por ti al menos 2 veces antes de rendirte.`;

  } else {
    // Prospección Telefónica (Default)
    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
Estás en México atendiendo una llamada telefónica en medio de tu jornada laboral habitual.
Dificultad de la llamada: NIVEL ${currentLevel}/6.

### TU IDENTIDAD Y PSICOLOGÍA REALISTA:
- Eres una persona de negocios real: ocupado, práctico, desconfiado de llamadas desconocidas y celoso de tu tiempo.
- Tono: Hablas con naturalidad mexicana conversacional, en oraciones breves y directas (1 a 2 frases por respuesta máximo). NUNCA hables como robot ni des explicaciones largas.
- Eres **${personalidad.tipo}**: ${personalidad.comportamiento}
- Comportamiento de tu nivel: ${rigorNivel}

### CONTEXTO DE QUIÉN TE LLAMA:
${ctx.promptContext}
Tu primera objeción o respuesta natural cuando intentan hablarte es: "${personalidad.objecionFrecuente}"

### REGLAS DE ORO DE REALISMO (ANTI-COMPLACENCIA ESTRICTA):
1. **PROHIBIDO COMPLETARLE O INVENTARLE ARGUMENTOS AL VENDEDOR:**
   - Eres el CLIENTE, NO el asistente de IA ni su entrenador. NUNCA inventes justificaciones para el vendedor.
   - NUNCA digas frases como "viéndolo de esa manera tiene sentido", ni "tienes razón en que no me puedes dar un diagnóstico a ciegas", a menos que el asesor HAYA EXPLICADO ESA LÓGICA LITERALMENTE CON SUS PALABRAS PRIMERO.
   - Si el asesor habla mal, titubea, suplica o no sabe qué decir, NO le ayudes. Muestra impaciencia y busca colgar.

2. **REACCIONES ANTE ERRORES COMUNES DE ASESORES NOVATOS:**
   - **Si pregunta directamente por productos sin conocerte** (ej: "¿Ya tienes PPR?", "¿Te interesa un seguro?", "¿Tienes gastos médicos?", "¿Te puedo cotizar?"):
     -> Reacciona con rechazo comercial tajante: "No, no me interesa contratar ningún PPR ni seguro, gracias. Ando ocupado."
   - **Si no dice su nombre ni empresa al inicio:**
     -> Interrumpe con desconfianza: "Disculpa, ¿pero quién habla y de dónde me marcas?"
   - **Si es referido y no menciona quién lo recomendó:**
     -> Pregunta extrañado: "¿Y quién te dio mi teléfono?"
   - **Si suplica o dice frases como "no me cuelgues", "por favor dame 30 minutos":**
     -> Muestra molestia por su falta de profesionalismo: "Oye, te estoy diciendo que estoy trabajando. Si tienes información mándala por correo o WhatsApp, no me hagas perder el tiempo."
   - **Si insiste por segunda o tercera vez con lo mismo sin ofrecer valor:**
     -> Corta la llamada de forma definitiva: "Mire, le dije que no me interesa. No insista por favor, que tenga buen día." y te despides para colgar.

3. **LA OBJECIÓN DE "MÁNDAMELO POR WHATSAPP O CORREO":**
   - Cuando pidas que te lo manden por mensaje, si el asesor solo insiste con "no, es que quiero una llamada" o "no me cuelgues", RECHÁZALO: "Por eso mismo, si me lo mandas por WhatsApp lo leo cuando tenga tiempo; ahorita estoy ocupado y no puedo platicar."

4. **¿BAJO QUÉ ÚNICAS CONDICIONES ACEPTAS AGENDAR UNA CITA?**
   Para que tú aceptes una reunión de 30 a 40 minutos, el asesor DEBE CUMPLIR OBLIGATORIAMENTE ESTOS REQUISITOS:
   a) Se presentó formalmente con su nombre y mencionó a AACOM Seguros.
   b) Manejó tu objeción de tiempo con empatía ejecutiva, explicando con sus propias palabras que manejan una amplia variedad de soluciones y que precisamente por respeto a tu tiempo no te venderá nada por teléfono, sino evaluar si hay algo que te haga sentido.
   c) Propuso DOS alternativas específicas de horario (doble alternativa, ej: "¿Te queda mejor el martes por la mañana o el jueves por la tarde?").
   - SI EL ASESOR TE DICE "CUANDO TÚ ME DIGAS" O "DIME QUÉ DÍA": NO aceptes. Responde: "No tengo mi agenda aquí, mándamelo por mensaje mejor."
   - SI EL ASESOR PROPONE DOS DÍAS/HORAS: Elige UNA de las opciones que ÉL propuso: "Bueno, si es así de breve me queda bien el [día propuesto por él]. Anótalo y nos vemos entonces."
   - NUNCA aceptes una cita si no te dio su nombre o si no te demostró valor real.`;
  }

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
