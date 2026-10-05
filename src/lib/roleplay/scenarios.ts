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
  { puestoM: 'Dueño de Empresa de Logística', puestoF: 'Dueña de Empresa de Logística', contexto: 'maneja una flotilla de 25 camiones y vive saturado de llamadas de clientes' },
  { puestoM: 'Médico Cirujano Pediatra', puestoF: 'Médica Cirujana Pediatra', contexto: 'trabaja entre dos hospitales privados y casi no tiene tiempo para llamadas' },
  { puestoM: 'Director de Agencia de Marketing Digital', puestoF: 'Directora de Agencia de Marketing Digital', contexto: 'siempre anda coordinando campañas y es muy directa al grano' },
  { puestoM: 'Dueño de Cadena de Restaurantes', puestoF: 'Dueña de Cadena de Restaurantes', contexto: 'preocupado por flujo de efectivo e impuestos, cuida mucho su dinero' },
  { puestoM: 'Notario Público Titular', puestoF: 'Notaria Pública Titular', contexto: 'muy analítico, formal, educado y fijado en los detalles legales' },
  { puestoM: 'Arquitecto Independiente', puestoF: 'Arquitecta Independiente', contexto: 'hace proyectos residenciales de lujo, ingresos variables mes a mes' },
  { puestoM: 'Director de Planta Industrial', puestoF: 'Directora de Planta Industrial', contexto: 'enfocado en procesos, productividad de 120 obreros y números concretos' },
  { puestoM: 'Contador y Asesor Fiscal', puestoF: 'Contadora y Asesora Fiscal', contexto: 'conoce muy bien las deducciones de impuestos pero es escéptico de seguros' },
  { puestoM: 'Dueño de Laboratorio Clínico', puestoF: 'Dueña de Laboratorio Clínico', contexto: 'busca estabilidad financiera y protección patrimonial para su familia' },
  { puestoM: 'Empresario del Ramo Metalmecánico', puestoF: 'Empresaria del Ramo Metalmecánico', contexto: 'empresa familiar con 40 empleados, busca proteger el patrimonio de sucesión' },
  { puestoM: 'Dentista con Clínica Propia', puestoF: 'Dentista con Clínica Propia', contexto: 'atiende pacientes todo el día, solo contesta entre citas' },
  { puestoM: 'Broker Inmobiliario', puestoF: 'Broker Inmobiliaria', contexto: 'acostumbrado a negociar comisiones y ventas, detecta de inmediato guiones de venta' },
  { puestoM: 'Director de TI / Ciberseguridad', puestoF: 'Directora de TI / Ciberseguridad', contexto: 'mente lógica, analítica, quiere saber el por qué y el retorno de inversión' },
  { puestoM: 'Distribuidor Mayorista de Abarrotes', puestoF: 'Distribuidora Mayorista de Abarrotes', contexto: 'persona práctica, de trato directo, no le gustan los rodeos' },
  { puestoM: 'Veterinario y Dueño de Hospital Animal', puestoF: 'Veterinaria y Dueña de Hospital Animal', contexto: 'enfocado en bienestar y familia pero muy ocupado con cirugías' },
  { puestoM: 'Director Financiero (CFO) Corporativo', puestoF: 'Directora Financiera (CFO) Corporativa', contexto: 'acostumbrado a evaluar balances, tasas y rendimiento financiero' },
  { puestoM: 'Dueño de Comercializadora de Acero', puestoF: 'Dueña de Comercializadora de Acero', contexto: 'negocio de alto volumen, muy sensible a la volatilidad económica' },
  { puestoM: 'Abogado Corporativo y Litigante', puestoF: 'Abogada Corporativa y Litigante', contexto: 'muy observador del lenguaje, objeta cualquier suposición sin evidencia' },
  { puestoM: 'Dermatólogo con Consultorio Privado', puestoF: 'Dermatóloga con Consultorio Privado', contexto: 'agenda llena de pacientes, muy cotizado y cuida su tiempo' },
  { puestoM: 'Director Comercial de Grupo Automotriz', puestoF: 'Directora Comercial de Grupo Automotriz', contexto: 'experto en técnicas comerciales, exigente con la postura profesional' },
  { puestoM: 'Constructor de Naves Industriales', puestoF: 'Constructora de Naves Industriales', contexto: 'maneja contratos de alto calibre y tiempos de entrega estrictos' },
  { puestoM: 'Productor Agropecuario y Ganadero', puestoF: 'Productora Agropecuaria y Ganadera', contexto: 'hombre de campo con gran patrimonio en tierras y ganado, desconfía de bancos' },
  { puestoM: 'Dueño de Empresa de Empaques y Cartón', puestoF: 'Dueña de Empresa de Empaques y Cartón', contexto: 'proveedor de la industria maquiladora, vive al día con órdenes de compra' },
  { puestoM: 'Oftalmólogo y Cirujano Ocular', puestoF: 'Oftalmóloga y Cirujana Ocular', contexto: 'agenda saturada de procedimientos, prefiere llamadas de menos de un minuto' },
  { puestoM: 'Dueño de Consultoría de Recursos Humanos', puestoF: 'Dueña de Consultoría de Recursos Humanos', contexto: 'sabe leer intenciones de personas de inmediato, odia discursos ensayados' },
  { puestoM: 'Diseñador de Interiores de Alto Nivel', puestoF: 'Diseñadora de Interiores de Alto Nivel', contexto: 'trabaja con clientes VIP, busca soluciones exclusivas y a la medida' },
  { puestoM: 'Director de Cadena de Farmacias', puestoF: 'Directora de Cadena de Farmacias', contexto: 'gestiona 15 sucursales, enfocado en rentabilidad y optimización fiscal' },
  { puestoM: 'Especialista en Energía Solar y Renovables', puestoF: 'Especialista en Energía Solar y Renovables', contexto: 'ingeniero con visión de futuro, interesado en planes a largo plazo' },
  { puestoM: 'Dueño de Empresa de Banquetes y Eventos', puestoF: 'Dueña de Empresa de Banquetes y Eventos', contexto: 'fines de semana saturados, entre semana atiende citas de proveedores' },
  { puestoM: 'Fabricante de Muebles de Exportación', puestoF: 'Fabricante de Muebles de Exportación', contexto: 'exporta a EE.UU., enfocado en cobertura cambiaria y protección de socios' }
];

const VOCES_HOMBRES = [
  'TNuNcwk4LzbPpi1XEANc', // Adriel (Mexicano profesional equilibrado)
  'htFfPSZGJwjBv1CL0aMD', // Antonio (Mexicano corporativo maduro)
  '6DsgX00trsI64jl83WWS', // Alex (Mexicano dinámico y asertivo)
  'onwK4e9ZLuTAKqWW03F9', // Daniel (Mexicano conversacional formal)
  'cjVigY5qzO86Huf0OWal'  // Eric (Latino directo y ejecutivo)
];

const VOCES_MUJERES = [
  'cAvMBIZ0VNTU8XdsUpEq', // Susana Elizabeth (Mexicana ejecutiva clara)
  'ewn5JTa3lNPY8QVuZJi6', // Ana Sofía (Mexicana joven profesional)
  'EsHsbdAoFNIyDFJ5UnZx', // Cristina (Mexicana cordial y firme)
  'FIhWHKTvfI9sX1beLEJ8', // Diana Sanchez (Mexicana formal y segura)
  '9Godp7dNohUvXk6qp0gS', // Regina (Mexicana profesionista analítica)
  'EXAVITQu4vr4xnSDxMaL', // Bella (Conversacional natural y expresiva)
  'FGY2WhTYpPnrIDTdsKH5'  // Laura (Ejecutiva de negocios directa)
];

const PROSPECTOS_PERSONAS: { nombre: string; genero: 'M' | 'F' }[] = [
  // Hombres (30 Perfiles)
  { nombre: 'Mauricio Cantú', genero: 'M' },
  { nombre: 'Roberto Méndez', genero: 'M' },
  { nombre: 'Fernando Garza', genero: 'M' },
  { nombre: 'Carlos Eduardo Sada', genero: 'M' },
  { nombre: 'Alejandro Treviño', genero: 'M' },
  { nombre: 'Héctor De la Garza', genero: 'M' },
  { nombre: 'Marcelo Elizondo', genero: 'M' },
  { nombre: 'Diego Andrés Zambrano', genero: 'M' },
  { nombre: 'Lic. Rodrigo Benavides', genero: 'M' },
  { nombre: 'Gabriel Villarreal', genero: 'M' },
  { nombre: 'Ing. Javier Canales', genero: 'M' },
  { nombre: 'Andrés Morales', genero: 'M' },
  { nombre: 'Bernardo Coindreau', genero: 'M' },
  { nombre: 'Dr. Gerardo Clariond', genero: 'M' },
  { nombre: 'Daniel Chapa', genero: 'M' },
  { nombre: 'Patricio Kalifa', genero: 'M' },
  { nombre: 'Luis Felipe Garza', genero: 'M' },
  { nombre: 'Jorge González', genero: 'M' },
  { nombre: 'Adrián Sepúlveda', genero: 'M' },
  { nombre: 'Tomás Barragán', genero: 'M' },
  { nombre: 'Mateo Garza', genero: 'M' },
  { nombre: 'Emiliano Santos', genero: 'M' },
  { nombre: 'Guillermo Lozano', genero: 'M' },
  { nombre: 'Arturo Salinas', genero: 'M' },
  { nombre: 'David Maldonado', genero: 'M' },
  { nombre: 'Juan Pablo Farías', genero: 'M' },
  { nombre: 'Ricardo Odriozola', genero: 'M' },
  { nombre: 'Esteban Martínez', genero: 'M' },
  { nombre: 'Alfonso Junco', genero: 'M' },
  { nombre: 'Rodrigo Montemayor', genero: 'M' },

  // Mujeres (30 Perfiles)
  { nombre: 'Claudia Ramos', genero: 'F' },
  { nombre: 'Sofía Morales', genero: 'F' },
  { nombre: 'Mariana Elizondo', genero: 'F' },
  { nombre: 'Patricia Villarreal', genero: 'F' },
  { nombre: 'Gabriela Lozano', genero: 'F' },
  { nombre: 'Lorena Salinas', genero: 'F' },
  { nombre: 'Paulina Santos', genero: 'F' },
  { nombre: 'Andrea Garza', genero: 'F' },
  { nombre: 'Valeria Sada', genero: 'F' },
  { nombre: 'Natalia Benavides', genero: 'F' },
  { nombre: 'Dra. Camila Montemayor', genero: 'F' },
  { nombre: 'Lic. Daniela Chapa', genero: 'F' },
  { nombre: 'Cecilia Zambrano', genero: 'F' },
  { nombre: 'Eugenia Coindreau', genero: 'F' },
  { nombre: 'Bárbara Clariond', genero: 'F' },
  { nombre: 'Lucía Canales', genero: 'F' },
  { nombre: 'Jimena Kalifa', genero: 'F' },
  { nombre: 'Renata Villarreal', genero: 'F' },
  { nombre: 'Cristina Odriozola', genero: 'F' },
  { nombre: 'Ana Sofía Farías', genero: 'F' },
  { nombre: 'Karla Elizondo', genero: 'F' },
  { nombre: 'Rebeca Treviño', genero: 'F' },
  { nombre: 'Mónica De la Garza', genero: 'F' },
  { nombre: 'Mariana Junco', genero: 'F' },
  { nombre: 'Estefanía Barragán', genero: 'F' },
  { nombre: 'Elisa Maldonado', genero: 'F' },
  { nombre: 'Adriana Lozano', genero: 'F' },
  { nombre: 'Paola Martínez', genero: 'F' },
  { nombre: 'Carolina Sepúlveda', genero: 'F' },
  { nombre: 'Fernanda Salinas', genero: 'F' }
];

const PERSONALIDADES = [
  {
    tipo: 'Acelerado y con prisa',
    comportamiento: 'Habla rápido, dice que tiene 30 segundos porque entra a una llamada o reunión.',
    objecionFrecuente: 'Platíqueme rápido por favor que voy entrando a una junta.',
    dificultad: 'baja'
  },
  {
    tipo: 'Amable pero evasivo de WhatsApp',
    comportamiento: 'Muy cordial, educado, pero su estrategia es mandar todo por WhatsApp para no comprometerse.',
    objecionFrecuente: 'Suena muy bien, mándamelo por WhatsApp con calma y yo lo reviso el fin de semana.',
    dificultad: 'baja'
  },
  {
    tipo: 'El Ocupado que pide que le marquen después',
    comportamiento: 'Dice que lo agarraron en momento inoportuno y pide que le marquen en unos días.',
    objecionFrecuente: 'Me agarras en pésimo momento, márcame el viernes de la próxima semana a ver si tengo tiempo.',
    dificultad: 'baja'
  },
  {
    tipo: 'El Pragmático Ocupado',
    comportamiento: 'Valora la honestidad y el respeto a su tiempo por encima de todo. Si percibe profesionalismo accede rápido, si percibe rollo cuelga.',
    objecionFrecuente: 'Tengo 20 segundos antes de subirme al coche, dígame qué necesita.',
    dificultad: 'baja'
  },
  {
    tipo: 'Analítico numérico',
    comportamiento: 'Quiere saber números, costos y porcentajes antes de aceptar cualquier cita.',
    objecionFrecuente: 'Pero dígame los números primero, ¿de cuánto estamos hablando al mes y qué tasa da?',
    dificultad: 'media'
  },
  {
    tipo: 'Satisfecho (Ya tiene seguros)',
    comportamiento: 'Afirma que ya está cubierto por su banco o por la empresa y no necesita nada más.',
    objecionFrecuente: 'Gracias, pero ya tengo seguro con otra compañía y con mi banco, estoy cubierto.',
    dificultad: 'media'
  },
  {
    tipo: 'Mala experiencia previa',
    comportamiento: 'Tuvo una mala experiencia con una aseguradora o banco en el pasado y siente desconfianza general.',
    objecionFrecuente: 'Mire, la verdad no creo en los seguros, tuve una mala experiencia donde no quisieron pagar y no me interesa.',
    dificultad: 'media'
  },
  {
    tipo: 'El Escéptico de "¿De dónde sacaste mi número?"',
    comportamiento: 'Le incomoda recibir llamadas no programadas y cuestiona el origen de los datos.',
    objecionFrecuente: 'A ver, espérame tantito, ¿quién te dio mi celular y de dónde me marcas?',
    dificultad: 'media'
  },
  {
    tipo: 'El Inversionista Autosuficiente',
    comportamiento: 'Cree que los seguros o planes de ahorro no convienen porque él invierte en bienes raíces o bolsa.',
    objecionFrecuente: 'Yo no creo en seguros, prefiero mover mi propio dinero en bienes raíces, da mucho más rendimiento.',
    dificultad: 'media'
  },
  {
    tipo: 'El Defensivo de Flujo de Efectivo',
    comportamiento: 'Siente que cualquier asesor financiero viene a sacarle dinero y pone la excusa de liquidez.',
    objecionFrecuente: 'Ando bien apretado de flujo de efectivo con la empresa ahorita, no estoy para gastos nuevos.',
    dificultad: 'media'
  },
  {
    tipo: 'Empresario cortante y sin rodeos',
    comportamiento: 'Trato seco y ejecutivo. Exige que le digan de qué se trata en 10 segundos o cuelga.',
    objecionFrecuente: 'A ver, dígame al grano de qué se trata y cuánto cuesta o tengo que colgar.',
    dificultad: 'alta'
  },
  {
    tipo: 'Escéptico y desconfiado',
    comportamiento: 'Desconfía de llamadas de ventas, pregunta directo de dónde sacaron su número y qué aseguradora es.',
    objecionFrecuente: 'Mire, la verdad no creo en los seguros, todos prometen y nunca pagan.',
    dificultad: 'alta'
  },
  {
    tipo: 'El Escéptico Anti-Trampas (Extremo)',
    comportamiento: 'Desconfía profundamente de cualquier promesa exagerada o rendimiento irreal. Si el asesor promete demasiado o miente, cuelga o rechaza tajantemente.',
    objecionFrecuente: 'He visto de todo en la industria, así que ahórrate los cuentos. ¿Exactamente qué ofreces?',
    dificultad: 'alta'
  },
  {
    tipo: 'El Enemigo de los Robots (Extremo)',
    comportamiento: 'Odia a la gente que lee guiones. Si siente que el asesor repite frases de memoria o no lo escucha, lo corta de inmediato.',
    objecionFrecuente: '¿Estás leyendo un guion? Háblame como persona normal, no tengo tiempo para grabadoras.',
    dificultad: 'alta'
  },
  {
    tipo: 'El Muralla Inhackeable (Extremo)',
    comportamiento: 'Inmune a técnicas baratas, ruego o lástima. Mantiene una frialdad absoluta en la negociación.',
    objecionFrecuente: 'Mejor ve directo al grano, mis decisiones se basan 100% en números, no en sentimientos.',
    dificultad: 'alta'
  },
  {
    tipo: 'El Ejecutivo Ofendido (Extremo)',
    comportamiento: 'Tiene muy poca tolerancia. Si el asesor es grosero, asume cosas de su dinero o le dice qué hacer, estalla de ira y cuelga.',
    objecionFrecuente: '¿De qué te ríes o por qué asumes cosas? Vamos aclarando el tono si quieres que te dedique un minuto.',
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
    tipo: 'referido_tibio',
    titulo: 'REFERIDO SIN AVISAR',
    icono: '📞',
    dificultad: 'media',
    generar: (referidor: string) => ({
      brief: `Tu cliente "${referidor}" te dio sus datos de contacto porque pensó en él, pero NO le alcanzó a avisar.`,
      tipPostLlamada: `Como no le avisaron, menciona a ${referidor} con calidez ("Me dio su número porque le brindamos una asesoría...") para evitar que piense que compraste su base de datos.`,
      promptContext: `Conoces bien a "${referidor}", pero NO te avisó que te iban a llamar. Al principio te extraña la llamada y preguntas por qué te llaman o de dónde conocen a tu contacto.`
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
    tipo: 'networking_evento',
    titulo: 'CONTACTO DE NETWORKING',
    icono: '👔',
    dificultad: 'media',
    generar: (_?: string) => ({
      brief: `Intercambiaron teléfonos brevemente en un desayuno de negocios / networking la semana pasada.`,
      tipPostLlamada: `Haz referencia inmediata al evento donde coincidieron para reavivar la conexión antes de proponer la fecha.`,
      promptContext: `Coincidieron en un desayuno de negocios la semana pasada e intercambiaron tarjetas. Recuerdas el evento, pero quieres ver si realmente tiene algo de valor que ofrecer o solo quiere venderte.`
    })
  },
  {
    tipo: 'ex_contacto_reactivacion',
    titulo: 'RE-ACTIVACIÓN DE PROSPECTO',
    icono: '🔄',
    dificultad: 'media',
    generar: (_?: string) => ({
      brief: `Habían tenido un primer contacto hace 6 meses pero se pospuso por temas de trabajo del prospecto.`,
      tipPostLlamada: `Reconoce el tiempo transcurrido y retoma la conversación preguntando por cómo avanzaron sus proyectos este año.`,
      promptContext: `Habías platicado brevemente hace meses con alguien de la promotoría pero estabas ocupado. Te sorprende que den seguimiento, pero valoras la persistencia profesional si van al grano.`
    })
  },
  {
    tipo: 'frio_total',
    titulo: 'LLAMADA EN FRÍO TOTAL',
    icono: '❄️',
    dificultad: 'alta',
    generar: (_?: string) => ({
      brief: `Contacto nuevo en frío obtenido de directorio empresarial. El prospecto NO TIENE IDEA de quién eres.`,
      tipPostLlamada: `En frío no hay confianza previa: tienes solo 15 segundos para dar un gancho de curiosidad o dolor profesional antes de que te corte.`,
      promptContext: `No conoces a la persona que te llama ni a AACOM Seguros. Es un número no registrado. Eres cortante al inicio y preguntas con quién hablas y de dónde obtuvieron tus datos.`
    })
  }
];

const REFERIDORES = [
  'Juan Carlos Treviño', 'María Elena Garza', 'Dr. Ricardo Lozano', 'Lic. Andrés Morales',
  'Sofía Villarreal', 'Ing. Roberto Sada', 'Mauricio Benavides', 'Dra. Marcela Canales',
  'Lic. Guillermo Elizondo', 'Arq. David Zambrano', 'Karla De la Torre', 'Ing. Esteban Quijano',
  'Lic. Patricio Clariond', 'Dra. Valeria Montemayor', 'Ing. Carlos Kalifa', 'Lic. Bernardo Santos',
  'Lic. Mónica Odriozola', 'Dr. Alfonso Junco', 'Ing. Rodrigo Barragán', 'Lic. Carolina Farías'
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
    if (prob < 0.35) origenBase = ORIGENES[0]; // referido_avisado
    else if (prob < 0.65) origenBase = ORIGENES[2]; // inbound_solicitado
    else if (prob < 0.85) origenBase = ORIGENES[1]; // referido_tibio
    else origenBase = ORIGENES[3]; // networking_evento

    const personalidadesBajas = PERSONALIDADES.filter(p => p.dificultad === 'baja' || p.dificultad === 'media');
    personalidad = personalidadesBajas[Math.floor(Math.random() * personalidadesBajas.length)];
    rigorNivel = 'Eres relativamente accesible. Si el asesor menciona al referidor o la solicitud y ofrece dos horarios de 30-40 min, aceptas con amabilidad sin hacer demasiadas trabas.';
  } else if (currentLevel <= 4) {
    const prob = Math.random();
    if (prob < 0.25) origenBase = ORIGENES[0]; // referido_avisado
    else if (prob < 0.50) origenBase = ORIGENES[1]; // referido_tibio
    else if (prob < 0.70) origenBase = ORIGENES[3]; // networking_evento
    else if (prob < 0.85) origenBase = ORIGENES[4]; // ex_contacto_reactivacion
    else origenBase = ORIGENES[5]; // frio_total

    const personalidadesMedias = PERSONALIDADES.filter(p => p.dificultad === 'media' || p.dificultad === 'baja');
    personalidad = personalidadesMedias[Math.floor(Math.random() * personalidadesMedias.length)] || PERSONALIDADES[0];
    rigorNivel = 'Exiges respeto a tu tiempo. Si no te explican claro de qué se trata o intentan darte un rollo largo, insistes con "¿de qué números estamos hablando?" o "mándemelo por correo". Solo aceptas si usan firmemente el argumento de diagnóstico antes de recetar y la doble alternativa.';
  } else {
    const prob = Math.random();
    if (prob < 0.45) origenBase = ORIGENES[5]; // frio_total
    else if (prob < 0.70) origenBase = ORIGENES[1]; // referido_tibio
    else if (prob < 0.85) origenBase = ORIGENES[4]; // ex_contacto_reactivacion
    else origenBase = ORIGENES[3]; // networking_evento

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
    referido_tibio: [
      `¿Bueno? Sí, ¿quién habla?`,
      `¿Bueno? Con ${primerNombre}, ¿de parte de quién?`,
      `¿Bueno? Sí, dígame, a sus órdenes.`
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
    ],
    networking_evento: [
      `¿Bueno? Sí, con ${primerNombre}, dígame.`,
      `¿Bueno? Hola, ¿quién habla?`,
      `¿Bueno? A sus órdenes, dígame.`
    ],
    ex_contacto_reactivacion: [
      `¿Bueno? Sí, dígame.`,
      `¿Bueno? Con ${primerNombre}, ¿de dónde me marcas?`,
      `¿Bueno? Habla ${primerNombre}, a sus órdenes.`
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
   - **Si el asesor asume demasiada confianza ("¿Qué onda Mariana?") o te dice "¿Qué quieres?":**
     -> ¡No le toleres faltas de respeto! Si te contesta "¿Qué quieres?", enfurece inmediatamente y cuelga: "A mí no me hables así, no sé ni quién eres. Adiós." No intentes salvarle la llamada.
   - **EL SECRETO DEL REFERIDO (REGLA CRÍTICA):**
     -> Si esta llamada es porque te recomendó alguien, **TÚ NUNCA DEBES DECIR EL NOMBRE DE ESA PERSONA HASTA QUE EL ASESOR LO MENCIONE PRIMERO**.
     -> Si el asesor no menciona a tu referido ("ej. te hablo de parte de Ricardo"), trata la llamada como frío total.
     -> NUNCA asumas de parte de quién llama si no se presenta. Si te dice "¿Qué quieres?", NO respondas "Yo te marco porque me dio tu número Ricardo". ¡ESO ESTÁ PROHIBIDO! Si no se presenta, cuélgale.
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
