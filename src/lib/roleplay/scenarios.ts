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

interface ProceduralHijo {
  nombre: string;
  edad: number;
  grado: string;
}

export interface PerfilADNProcedural {
  etapa: {
    tipo: string;
    familiaDesc: string;
    hijos: ProceduralHijo[];
    dolorSugerido: string;
    dolorDetalle: string;
  };
  regimen: {
    regimen: string;
    prestaciones: string;
    habitoFiscal: string;
  };
  ingresoMensual: number;
  fijosTotal: number;
  deseosTotal: number;
  ahorroActual: number;
  metaAhorroIdealWarren: number;
  rentaHipoteca: number;
  luz: number;
  gas: number;
  agua: number;
  internet: number;
  mantenimiento: number;
  despensaSuper: number;
  transporteTotal: number;
  psicologia: {
    tipo: string;
    comportamiento: string;
    reaccionPreguntas: string;
    objecionResistencia: string | null;
  };
  entorno: {
    lugar: string;
    desc: string;
    saludos: string[];
  };
  saludoInicial: string;
}

export function generarPerfilADNProcedural(persona: any, edad: number, puesto: string, profesion: any, level: number): PerfilADNProcedural {
  // Vector 1: Etapas de Vida y Familia Dinámica
  const etapasVida = [
    {
      tipo: 'Soltero Joven Independiente',
      condicion: edad < 36,
      familiaDesc: 'Soltero/a, vive de forma independiente, sin hijos ni dependientes económicos directos.',
      hijos: [] as ProceduralHijo[],
      dolorSugerido: 'Retiro Temprano, Salud e Invalidez',
      dolorDetalle: 'Le aterra que un accidente o enfermedad le impida generar ingresos, o llegar a los 60 años sin un patrimonio estructurado. Sabe que no tiene afore sólida.'
    },
    {
      tipo: 'Recién Casados sin Hijos',
      condicion: edad >= 27 && edad <= 38,
      familiaDesc: 'Casado/a hace 2 años, planeando tener su primer bebé el próximo año y buscando comprar casa propia.',
      hijos: [] as ProceduralHijo[],
      dolorSugerido: 'Blindaje de Pareja y Fondo Patrimonial Inicial',
      dolorDetalle: 'Tienen gastos compartidos e hipoteca o renta alta; les preocupa qué pasaría con su cónyuge si uno de los dos llega a faltar o enfermar.'
    },
    {
      tipo: 'Familia Joven con Hijos Pequeños',
      condicion: edad >= 30 && edad <= 46,
      familiaDesc: 'Casado/a con hijos pequeños en edad de maternal/primaria.',
      hijos: [
        { nombre: Math.random() > 0.5 ? 'Mateo' : 'Santiago', edad: Math.floor(Math.random() * 3) + 2, grado: 'maternal/kínder' },
        { nombre: Math.random() > 0.5 ? 'Sofía' : 'Valentina', edad: Math.floor(Math.random() * 4) + 5, grado: 'primaria' }
      ],
      dolorSugerido: 'Orfandad/Invalidez y Universidad Garantizada',
      dolorDetalle: 'Si llega a faltar mañana, sus hijos y su cónyuge no tendrían sustento económico garantizado para mantener su nivel de vida ni sus estudios.'
    },
    {
      tipo: 'Familia Consolidada con Adolescentes',
      condicion: edad >= 40 && edad <= 54,
      familiaDesc: 'Casado/a con hijos adolescentes en secundaria o preparatoria; la universidad privada está muy cerca.',
      hijos: [
        { nombre: Math.random() > 0.5 ? 'Emiliano' : 'Sebastián', edad: 14, grado: 'secundaria' },
        { nombre: Math.random() > 0.5 ? 'Camila' : 'Mariana', edad: 17, grado: 'preparatoria (a 1 año de universidad)' }
      ],
      dolorSugerido: 'Universidad Inminente y Retiro en Cuenta Regresiva',
      dolorDetalle: 'Gastan mucho en colegiaturas hoy y saben que la universidad costará más de 2 millones de pesos por hijo, descuidando su propio retiro.'
    },
    {
      tipo: 'Madurez / Nido Vacío',
      condicion: edad >= 50,
      familiaDesc: 'Hijos ya mayores y económicamente independientes. Pensando en cuándo y cómo jubilarse.',
      hijos: [] as ProceduralHijo[],
      dolorSugerido: 'Retiro Digno, Gastos Médicos y Conservación Patrimonial',
      dolorDetalle: 'Le quedan entre 8 y 12 años productivos. Su Afore es mínima y le preocupa mantener su nivel de vida y salud en la vejez.'
    },
    {
      tipo: 'Padre/Madre Soltero/a Divorciado/a',
      condicion: edad >= 32 && edad <= 50,
      familiaDesc: 'Divorciado/a con custodia y manutención de sus hijos. Principal sostén del hogar.',
      hijos: [
        { nombre: Math.random() > 0.5 ? 'Diego' : 'Lucía', edad: Math.floor(Math.random() * 6) + 4, grado: 'primaria' }
      ],
      dolorSugerido: 'Blindaje Absoluto por Fallecimiento (Fideicomiso Testamentario)',
      dolorDetalle: 'Si falta mañana, le angustia qué pasaría con sus hijos y teme que su expareja malgaste los recursos que deje para ellos.'
    }
  ];

  const etapasValidas = etapasVida.filter(e => e.condicion);
  const etapa = etapasValidas.length > 0 
    ? etapasValidas[Math.floor(Math.random() * etapasValidas.length)]
    : etapasVida[2];

  // Vector 2: Régimen Laboral e Ingreso Mensual
  const tiposIngreso = [
    {
      regimen: 'Sueldo Asalariado Corporativo',
      baseIngreso: [45000, 140000],
      prestaciones: 'Tiene IMSS, fondo de ahorro, aguinaldo y SGMM de empresa (que perdería si sale de la empresa).',
      habitoFiscal: 'Retención de ISR en nómina; no deduce casi nada salvo si contrata un PPR bajo el Art. 151.'
    },
    {
      regimen: 'Empresario / Dueño de PyME',
      baseIngreso: [70000, 220000],
      prestaciones: 'Sin prestaciones de ley; su dinero está en la operación e inventarios.',
      habitoFiscal: 'Busca deducir y bajar la base gravable de su empresa y personal.'
    },
    {
      regimen: 'Honorarios / Profesionista Independiente (Médico, Notario, Consultor)',
      baseIngreso: [55000, 180000],
      prestaciones: 'Cero prestaciones, sin afore patronal. Si no da consulta o proyectos, no cobra.',
      habitoFiscal: 'Paga altas tasas de ISR por honorarios; le urge deducir gastos personales.'
    },
    {
      regimen: 'Director Comercial / Comisionista de Alto Nivel',
      baseIngreso: [50000, 160000],
      prestaciones: 'Sueldo base bajo y comisiones altas pero variables cada trimestre.',
      habitoFiscal: 'Flujo irregular: gasta mucho en meses buenos y no tiene fondo de contingencia.'
    }
  ];
  const regimen = tiposIngreso[Math.floor(Math.random() * tiposIngreso.length)];

  const [minIng, maxIng] = regimen.baseIngreso;
  const ingresoMensual = Math.round((Math.random() * (maxIng - minIng) + minIng) / 5000) * 5000;

  // Vector 3: Estructura Financiera Calculada Matemáticamente
  const pctFijos = (Math.random() * 0.14 + 0.48); // 48% a 62%
  const pctDeseos = (Math.random() * 0.12 + 0.30); // 30% a 42%
  const pctAhorro = Math.max(0.02, 1 - (pctFijos + pctDeseos)); // 2% a 8%

  const fijosTotal = Math.round((ingresoMensual * pctFijos) / 1000) * 1000;
  const deseosTotal = Math.round((ingresoMensual * pctDeseos) / 1000) * 1000;
  const ahorroActual = Math.round((ingresoMensual * pctAhorro) / 1000) * 1000;
  const metaAhorroIdealWarren = Math.round((ingresoMensual * 0.20) / 1000) * 1000;

  const rentaHipoteca = Math.round((fijosTotal * 0.60) / 1000) * 1000;
  const luz = Math.round((Math.random() * 1200 + 800) / 100) * 100;
  const gas = Math.round((Math.random() * 600 + 400) / 100) * 100;
  const agua = Math.round((Math.random() * 400 + 250) / 50) * 50;
  const internet = Math.round((Math.random() * 400 + 750) / 50) * 50;
  const mantenimiento = Math.round((Math.random() * 1800 + 1200) / 100) * 100;
  const despensaSuper = Math.round((fijosTotal * 0.25) / 1000) * 1000;
  const transporteTotal = Math.round((fijosTotal * 0.15) / 1000) * 1000;

  // Vector 4: Psicología y Apertura ante el Cuestionario
  const psicologiasApertura = [
    {
      tipo: 'El Transparente al Centavo',
      comportamiento: 'Tiene orden mental y le gusta hablar de números. Si le preguntas el desglose de luz, gas, despensa o predial, te da los montos exactos sin titubear.',
      reaccionPreguntas: `Estás 100% abierto a contestar el cuestionario a detalle. Si el asesor te pregunta por luz, gas, agua, despensa o predial, dile los montos exactos ($${luz} de luz, $${gas} de gas, $${despensaSuper.toLocaleString('es-MX')} de despensa). Cuando te explique la Regla 50-30-20, di que te parece genial y reflexiona en cómo andas tú.`,
      objecionResistencia: null
    },
    {
      tipo: 'El Resumidor Ejecutivo (Odia los Centavos)',
      comportamiento: 'Práctico y ejecutivo. Le desespera que le pregunten centavos de luz o cuentas de tienda de abarrotes. Prefiere dar cifras globales por bloque grande.',
      reaccionPreguntas: `Si el asesor empieza a preguntarte: "¿Cuánto pagas de luz? ¿Y de gas? ¿Y de teléfono?", interrúmpelo con impaciencia: "Mira, la verdad no me sé los centavos de la luz o el gas, no hagamos cuentas de abarrotes. Mejor pregúntame por bloques grandes: ¿cuánto gasto en vivienda con servicios en total? Unos $${(rentaHipoteca + luz + gas + agua + internet + mantenimiento).toLocaleString('es-MX')} al mes". SI EL ASESOR SE ADAPTA y agrupa por Vivienda, Transporte, Hobbies y Despensa, te relajas y cooperas con gusto. Si insiste en los recibos pequeños, te pones tajante.`,
      objecionResistencia: 'resistencia_centavos'
    },
    {
      tipo: 'El Escéptico Defensivo (Celoso de su Privacidad)',
      comportamiento: 'Desconfía de la gente que pregunta sobre dinero. Teme que le quieran vender algo caro o que filtren su información.',
      reaccionPreguntas: `Cuando el asesor comience a pedir tus cifras de ingresos o gastos, ponte a la defensiva: "Oye, espérame tantito... ¿por qué necesitas saber cuánto gano o en qué me gasto mi dinero? Se supone que esto era una plática de orientación, esto es información muy confidencial". SÓLO COOPERAS SI EL ASESOR: 1) Te da tranquilidad y garantiza confidencialidad, 2) Usa la analogía médica ("somos como médicos patrimoniales; no podemos recetar sin un análisis previo"), y 3) Explica que se basa en la Regla 50-30-20 de Elizabeth Warren para evaluar tu salud financiera. Si lo hace, bajas la guardia: "Bueno, visto así tiene sentido, adelante".`,
      objecionResistencia: 'resistencia_privacidad'
    },
    {
      tipo: 'El Avergonzado por Desorden y Deudas',
      comportamiento: 'Gana buen sueldo pero vive estresado porque gasta de más en salidas y compras. Le da pena admitir que tiene tarjetas de crédito saturadas.',
      reaccionPreguntas: `Te cuesta admitir tus gastos al inicio. Si te preguntan deudas, titubea un poco antes de confesar: "Pues... la verdad sí traigo como $${(Math.round(ingresoMensual * 1.8 / 10000) * 10000).toLocaleString('es-MX')} pesos entre dos tarjetas de crédito que me están quitando el sueño". Buscas que el asesor sea empático y te ayude a encontrar orden sin juzgarte.`,
      objecionResistencia: 'resistencia_deudas'
    },
    {
      tipo: 'El Confiado de los Guardaditos',
      comportamiento: 'Cree que tiene sus finanzas resueltas porque ahorra en su cuenta de débito o Cetes, pero carece de un plan estructurado a largo plazo.',
      reaccionPreguntas: `Dices con orgullo que tú sí ahorras unos $${ahorroActual.toLocaleString('es-MX')} pesos al mes. Pero si el asesor te indaga qué pasa con ese dinero al final del año, confiesas que siempre te lo terminas gastando en vacaciones o compras no planeadas. No tienes nada intocable para tu retiro ni protección de invalidez.`,
      objecionResistencia: 'falso_ahorro'
    }
  ];
  const psicologia = psicologiasApertura[Math.floor(Math.random() * psicologiasApertura.length)];

  // Vector 5: Entorno / Atmósfera y Saludos Iniciales
  const entornosReunion = [
    {
      lugar: 'Oficina privada del prospecto',
      desc: 'Estás sentado en tu sillón ejecutivo frente a tu escritorio de madera. Tienes tu laptop abierta y una taza de café recién servida.',
      saludos: [
        `Hola, ¿qué tal? Buenos días. Pasa, por favor, toma asiento. ¿Gustas un café o un vaso de agua antes de empezar?`,
        `¿Qué tal? Buenas tardes. Pasa, adelante. Listo, ya cerré mi puerta para que platiquemos con calma. Tú dime.`,
        `Hola, bienvenido. Gracias por la puntualidad. A ver, platícame bien de qué se trata esta sesión patrimonial.`
      ]
    },
    {
      lugar: 'Videollamada por Zoom / Google Meet desde Home Office',
      desc: 'Estás conectado desde el estudio de tu casa frente a la cámara web. Ambiente ejecutivo pero relajado.',
      saludos: [
        `Hola, ¿cómo estás? Ya estoy conectado. Te escucho y te veo perfecto. Tú dime por dónde empezamos.`,
        `¿Qué tal? Buenos días. Listo, ya entré a la liga de Zoom. Gracias por el tiempo, adelante.`,
        `Hola hola, buenas tardes. Perdón por la demora de un par de minutitos, estaba cerrando una llamada, pero listo, ya tengo toda mi atención contigo.`
      ]
    },
    {
      lugar: 'Cafetería ejecutiva / Restaurante',
      desc: 'Estás sentado en una mesa privada de un café ejecutivo, con tu iPad o libreta enfrente.',
      saludos: [
        `Hola, ¿qué tal? Qué bueno que llegaste bien. Ya pedí un café para mí, ¿tú ya estás cómodo? Adelante, te escucho.`,
        `¿Qué tal? Buenas tardes. Muy buen lugar para platicar con tranquilidad. Listo, tú dime cómo está la dinámica.`
      ]
    }
  ];
  const entorno = entornosReunion[Math.floor(Math.random() * entornosReunion.length)];
  const saludoInicial = entorno.saludos[Math.floor(Math.random() * entorno.saludos.length)];

  return {
    etapa,
    regimen,
    ingresoMensual,
    fijosTotal,
    deseosTotal,
    ahorroActual,
    metaAhorroIdealWarren,
    rentaHipoteca,
    luz,
    gas,
    agua,
    internet,
    mantenimiento,
    despensaSuper,
    transporteTotal,
    psicologia,
    entorno,
    saludoInicial
  };
}

export interface PerfilCierreProcedural {
  propuesta: {
    tipo: string;
    nombrePlan: string;
    aportacionMensual: number;
    sumaAsegurada: number;
    plazoAnios: number;
    enfoquePrincipal: string;
    deducible: boolean;
  };
  arquetipo: {
    nombre: string;
    descripcion: string;
    cortinaHumo: string;
    objecionReal: string;
    comportamiento: string;
    claveDesbloqueo: string;
    senalesDeCompra: string[];
  };
  entorno: {
    lugar: string;
    desc: string;
    saludos: string[];
  };
  saludoInicial: string;
}

export function generarPerfilCierreProcedural(persona: any, edad: number, puesto: string, profesion: any, level: number): PerfilCierreProcedural {
  // Vector 1: Propuestas Personalizadas Proyectadas en Pantalla
  const planes = [
    {
      tipo: 'PPR Retiro Deducible Art. 151',
      nombrePlan: 'Plan Personal de Retiro Inteligente (PPR)',
      baseAportacion: [3500, 11000],
      baseSuma: [3000000, 7500000],
      plazoAnios: Math.max(10, 65 - edad),
      enfoquePrincipal: 'Garantizar una pensión vitalicia independiente de la Afore y deducir hasta el 10% de ingresos anuales ante el SAT.',
      deducible: true
    },
    {
      tipo: 'Proyecto Educativo Universitario Garantizado',
      nombrePlan: 'Segubeca Universitaria en UDIS',
      baseAportacion: [3000, 8000],
      baseSuma: [2000000, 4500000],
      plazoAnios: 12,
      enfoquePrincipal: 'Garantizar el fondo de universidad privada para tus hijos libre de inflación, con blindaje total por fallecimiento o invalidez.',
      deducible: false
    },
    {
      tipo: 'Vida Dotal y Ahorro Patrimonial en UDIS',
      nombrePlan: 'Vida Entera con Valores Garantizados',
      baseAportacion: [4500, 14000],
      baseSuma: [3500000, 9000000],
      plazoAnios: 15,
      enfoquePrincipal: 'Blindaje patrimonial completo para tu familia con fondo de rescate en efectivo indexado al valor real de la inflación.',
      deducible: false
    },
    {
      tipo: 'Blindaje de Hombre Clave e Inembargabilidad PyME',
      nombrePlan: 'Hombre Clave / Respaldo Societario',
      baseAportacion: [8000, 22000],
      baseSuma: [5000000, 12000000],
      plazoAnios: 10,
      enfoquePrincipal: 'Gasto deducible al 100% para la empresa que garantiza liquidez y rescate de acciones si el socio o director clave falta.',
      deducible: true
    }
  ];

  const planBase = planes[Math.floor(Math.random() * planes.length)];
  const [minAp, maxAp] = planBase.baseAportacion;
  const aportacionMensual = Math.round((Math.random() * (maxAp - minAp) + minAp) / 500) * 500;
  const [minSum, maxSum] = planBase.baseSuma;
  const sumaAsegurada = Math.round((Math.random() * (maxSum - minSum) + minSum) / 500000) * 500000;

  const propuesta = {
    tipo: planBase.tipo,
    nombrePlan: planBase.nombrePlan,
    aportacionMensual,
    sumaAsegurada,
    plazoAnios: planBase.plazoAnios,
    enfoquePrincipal: planBase.enfoquePrincipal,
    deducible: planBase.deducible
  };

  // Vector 2: Arquetipos Psicológicos de Negociación y Cierre
  const arquetipos = [
    {
      nombre: 'El Postergador Crónico ("Déjame Pensarlo")',
      descripcion: 'Le parece excelente la idea pero sufre de parálisis por análisis y aversión al compromiso. Cree que puede aplazar la decisión indefinidamente.',
      cortinaHumo: 'Suena muy bien todo lo que me presentas. Déjame darle una buena pensada este fin de semana con la almohada y yo te busco el martes para decirte qué decidí.',
      objecionReal: 'Miedo al compromiso a largo plazo y falta de sentido de urgencia; asume que hoy está sano y que nada le va a pasar.',
      comportamiento: 'Si el asesor dice "Bueno, piénsalo y me avisas", sonríe aliviado, dice "Perfecto, yo te busco" y da por terminada la reunión. Pierde la venta.',
      claveDesbloqueo: 'El asesor debe: 1) Aislar ("Aparte de pensarlo, ¿hay algo del plan que no te convenza?"), 2) Usar la técnica del Costo de la Inacción ("Podemos esperar, pero la edad y la salud no se congelan; el riesgo corre desde hoy"), y 3) Cerrar de forma asumida con trámite preliminar.',
      senalesDeCompra: [
        'Pues sí, tienes razón, la verdad es que si no lo hago hoy lo voy a seguir postergando un año más.',
        '¿Y para la solicitud qué papelería necesitarías llenar ahorita?'
      ]
    },
    {
      nombre: 'El Apretado de Presupuesto ("Está Muy Caro")',
      descripcion: 'Siente que la mensualidad es un golpe fuerte a su cartera porque la percibe como un gasto nuevo en lugar de un ahorro.',
      cortinaHumo: `Me encantó la propuesta y la suma de $${sumaAsegurada.toLocaleString('es-MX')}, pero la verdad $${aportacionMensual.toLocaleString('es-MX')} pesos al mes se me hace carísimo, ando muy apretado de flujo ahorita.`,
      objecionReal: 'No ha cuantificado el impacto en gasto diario y teme asfixiarse en meses de bajas ventas.',
      comportamiento: 'Si el asesor baja la suma asegurada de inmediato sin defender el valor, siente que le estaban cobrando de más. Exige que le demuestren el valor.',
      claveDesbloqueo: `El asesor debe aplicar: 1) Reducción al Absurdo o Costo Diario ("Son $${Math.round(aportacionMensual / 30)} pesos diarios, menos que un café y propina"), o 2) Técnica del Boomerang ("Precisamente si hoy con salud $${aportacionMensual.toLocaleString('es-MX')} se siente pesado, imagina a tu familia viviendo con $0 si tú faltas mañana").`,
      senalesDeCompra: [
        `Visto así por día de $${Math.round(aportacionMensual / 30)} pesos la verdad sí hace mucho más sentido.`,
        '¿El cobro se puede hacer fraccionado o con tarjeta de crédito para generar puntos?'
      ]
    },
    {
      nombre: 'El Inversionista Autosuficiente ("CETES / Bienes Raíces")',
      descripcion: 'Se enorgullece de mover su propio dinero. Considera que los seguros dan bajo rendimiento frente a activos de renta fija o bienes raíces.',
      cortinaHumo: 'Estuve haciendo números rápidos y los rendimientos de la aseguradora no le ganan a CETES, la bolsa o un terreno en preventa. Prefiero mover yo mi capital.',
      objecionReal: 'Confunde un instrumento de inversión especulativa con una red de protección patrimonial y blindaje ante invalidez.',
      comportamiento: 'No le discutas de tasas de interés. Si peleas de matemáticas te va a ganar.',
      claveDesbloqueo: `El asesor debe separar los instrumentos: 1) Validar su talento de inversión ("CETES y bienes raíces son fabulosos para multiplicar dinero"), 2) Marcar el contraste ("Pero si mañana tienes un accidente o invalidez, CETES no te va a pagar $${(sumaAsegurada / 1000000).toFixed(1)} millones de indemnización al día siguiente"), 3) Posicionar el plan como el cinturón de seguridad que protege sus otras inversiones.`,
      senalesDeCompra: [
        'Tienes un punto válido: nunca había visto el seguro como un blindaje de mis otras inversiones.',
        '¿Y este fondo tiene alguna penalización si quiero aportar más capital en el futuro?'
      ]
    },
    {
      nombre: 'El Cónyuge Dependiente ("Debo Consultarlo con mi Pareja")',
      descripcion: 'Comparte la administración del hogar y teme tomar una decisión financiera relevante sin el aval explícito de su cónyuge.',
      cortinaHumo: 'Todo se ve muy bien estructurado, pero yo todas las decisiones de este tipo las tomo junto con mi esposa/esposo. Mándamelo por correo y lo reviso con ella este fin de semana.',
      objecionReal: 'Miedo al reclamo familiar por comprometer dinero, o falta de argumentos para explicarle el valor a su pareja.',
      comportamiento: 'Si le dices "No le digas a tu esposa", se ofende. Si aceptas "mándamelo por correo", el cónyuge verá una hoja de costo y dirá que no.',
      claveDesbloqueo: 'El asesor debe: 1) Elogiar el acuerdo de pareja, 2) Preguntar: "¿Si tu pareja supiera que este plan garantiza la tranquilidad de la familia pase lo que pase, crees que te diría que sí?", 3) Ofrecer avanzar con la emisión preliminar con garantía de cancelación sin costo o agendar una llamada breve juntos para resolver dudas.',
      senalesDeCompra: [
        'Sí, la verdad a ella lo que más le preocupa es la escuela de los niños si a mí me pasa algo.',
        '¿Podemos meter la solicitud preliminar y si ella tiene alguna duda la revisamos en la entrega?'
      ]
    },
    {
      nombre: 'El Escéptico de Inflación ("En 20 años el Peso no Vale Nada")',
      descripcion: 'Recuerda devaluaciones pasadas en México y desconfía de las monedas a largo plazo.',
      cortinaHumo: 'El problema de estos planes a 15 o 20 años es la inflación en México. Esos millones que me prometes a los 65 años van a alcanzar para comprar una despensa y nada más.',
      objecionReal: 'Desconoce la figura legal de las UDIS (Unidades de Inversión) indexadas por ley al INPC del Banco de México.',
      comportamiento: 'Es escéptico pero racional. Valora las explicaciones técnicas y regulatorias sólidas.',
      claveDesbloqueo: 'El asesor debe explicar el mecanismo de UDIS / indexación inflacionaria garantizada por Banxico: el valor de la suma asegurada y el ahorro se calculan en poder adquisitivo constante, por lo que el dinero nunca pierde valor en el tiempo.',
      senalesDeCompra: [
        'Ah, o sea que la UDI se recalcula con la inflación oficial del Banco de México...',
        '¿Y la indemnización también se paga en valor UDI al momento del evento?'
      ]
    },
    {
      nombre: 'El Empresario Celoso de su Liquidez ("En mi Negocio Gano Más")',
      descripcion: 'Dueño de negocio que reinvierte todo en inventario, nómina y operación. Odia "inmovilizar" dinero en instrumentos externos.',
      cortinaHumo: `Yo a cada peso en mi empresa le saco el 25% o 30% anual entre mercancía y rotación. Meter $${aportacionMensual.toLocaleString('es-MX')} a una aseguradora se me hace tener dinero muerto.`,
      objecionReal: 'Teme quedarse sin liquidez para emergencias del negocio y tiene todo su patrimonio personal mezclado con la empresa.',
      comportamiento: 'Trato rudo y negociador. No tolera rodeos.',
      claveDesbloqueo: 'El asesor debe explicar el Blindaje Patrimonial y la Inembargabilidad: 1) "Tu negocio es tu motor, pero si una demanda laboral o mercantil lo embarga, tu patrimonio personal también corre riesgo", 2) La ley del contrato de seguro hace estas pólizas inembargables y deducibles de impuestos (Art. 151 / 27 LISR), 3) Es sacar dinero del riesgo de la empresa hacia la seguridad de la familia.',
      senalesDeCompra: [
        'No sabía que las pólizas de retiro y vida tenían blindaje legal inembargable.',
        '¿Y cómo se factura esto para que mi contador lo deduzca al 100% en la empresa?'
      ]
    }
  ];

  const arquetipo = arquetipos[Math.floor(Math.random() * arquetipos.length)];

  // Vector 3: Entornos de Cierre
  const entornosCierre = [
    {
      lugar: 'Sesión por Zoom / Google Meet (Pantalla compartida con la propuesta)',
      desc: 'El asesor acaba de compartir la pantalla con el PDF de la cotización formal y la tabla de proyección de ahorro y suma asegurada.',
      saludos: [
        `Hola, pues ya estuve viendo con mucha atención las láminas y la gráfica de proyección que me pusiste en la pantalla... y la verdad es que está muy interesante, pero ${arquetipo.cortinaHumo}`,
        `¿Qué tal? Sí, veo los números que proyectaste en el PDF y el desglose de beneficios. Se ve bien presentado, pero siendo muy honestos, ${arquetipo.cortinaHumo}`,
        `Hola, te estaba escuchando atento durante toda la corrida financiera. Te agradezco la propuesta, pero la verdad de entrada, ${arquetipo.cortinaHumo}`
      ]
    },
    {
      lugar: 'Oficina ejecutiva del prospecto (Reunión presencial con carpeta de propuesta)',
      desc: 'El prospecto tiene la carpeta impresa con la propuesta sobre su escritorio, hojeando la página de costos y coberturas.',
      saludos: [
        `Hola, pasa, siéntate. Ya revisé la carpeta con la cotización que me dejaste... y mira, el plan se ve sólido, pero ${arquetipo.cortinaHumo}`,
        `¿Qué tal? Gracias por venir a la oficina. Estuve analizando la tabla de aportaciones y sumas que me imprimiste, pero ${arquetipo.cortinaHumo}`
      ]
    }
  ];

  const entorno = entornosCierre[Math.floor(Math.random() * entornosCierre.length)];
  const saludoInicial = entorno.saludos[Math.floor(Math.random() * entorno.saludos.length)];

  return {
    propuesta,
    arquetipo,
    entorno,
    saludoInicial
  };
}

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
  let firstMessage = saludosLista[Math.floor(Math.random() * saludosLista.length)];

  let systemPrompt = "";
  let adnBrief = "";
  let cierreBrief = "";

  if (moduleId === 'adn') {
    const adnProc = generarPerfilADNProcedural(persona, edad, puesto, profesion, currentLevel);
    firstMessage = adnProc.saludoInicial;
    adnBrief = `Cita de Diagnóstico Patrimonial confirmada en agenda con ${persona.nombre} (${puesto}, ${edad} años). Origen: ${referidor ? `Recomendado por ${referidor}` : 'Contacto profesional de networking'}. El prospecto te concedió la cita con interés inicial, pero su situación familiar, números reales, estructura de gastos y dolores patrimoniales son CONFIDENCIALES: deberás descubrirlos tú mismo guiando la metodología 50-30-20.`;

    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
ESTÁS EN UNA REUNIÓN DE CONSULTORÍA PRESENCIAL O VIDEOLLAMADA (Cita de Análisis de Necesidades / ADN) con un asesor financiero patrimonial.
TÚ YA ACEPTASTE ESTA REUNIÓN PREVIAMENTE PARA EVALUAR TU SITUACIÓN FINANCIERA. ESTÁS SENTADO FRENTE A ÉL / EN TU COMPUTADORA CON TIEMPO DEDICADO PARA ESTA SESIÓN.
NUNCA DIGAS "ESTOY OCUPADO", "MÁNDAMELO POR CORREO" NI "VOY MANEJANDO". NO ES UNA LLAMADA TELEFÓNICA EN FRÍO.

### ENTORNO DE LA SESIÓN:
- **Lugar:** ${adnProc.entorno.lugar}. ${adnProc.entorno.desc}
- **Tono general:** Natural, mexicano, educado y reflexivo. Hablas como una persona real conversando con un especialista.

### TU RADIOGRAFÍA FINANCIERA Y FAMILIAR REAL:
- **Etapa de vida y Familia:** ${adnProc.etapa.tipo}. ${adnProc.etapa.familiaDesc}
${adnProc.etapa.hijos.length > 0 ? `- **Hijos:** ${adnProc.etapa.hijos.map(h => `${h.nombre} (${h.edad} años, ${h.grado})`).join(', ')}.` : ''}
- **Régimen laboral e ingresos:** ${adnProc.regimen.regimen}. Ganas aproximadamente **$${adnProc.ingresoMensual.toLocaleString('es-MX')} MXN netos mensuales**.
- **Prestaciones y situación fiscal:** ${adnProc.regimen.prestaciones} ${adnProc.regimen.habitoFiscal}

### TUS NÚMEROS REALES ACTUALES (CÁLCULO PRIVADO):
- **Gastos Básicos y Fijos:** Gastas ~$${adnProc.fijosTotal.toLocaleString('es-MX')} MXN/mes (${Math.round((adnProc.fijosTotal / adnProc.ingresoMensual) * 100)}% de tu ingreso).
  * Vivienda (renta/hipoteca): ~$${adnProc.rentaHipoteca.toLocaleString('es-MX')} MXN
  * Servicios: Luz ~$${adnProc.luz}, Gas ~$${adnProc.gas}, Agua ~$${adnProc.agua}, Internet ~$${adnProc.internet}, Mantenimiento ~$${adnProc.mantenimiento}
  * Despensa / Supermercado: ~$${adnProc.despensaSuper.toLocaleString('es-MX')} MXN
  * Transporte y auto: ~$${adnProc.transporteTotal.toLocaleString('es-MX')} MXN
- **Gastos de Estilo de Vida / Deseos:** Gastas ~$${adnProc.deseosTotal.toLocaleString('es-MX')} MXN/mes (${Math.round((adnProc.deseosTotal / adnProc.ingresoMensual) * 100)}% de tu ingreso) en comidas fuera, viajes, plataformas y compras personales.
- **Ahorro Actual:** Solo ahorras ~$${adnProc.ahorroActual.toLocaleString('es-MX')} MXN/mes (${Math.round((adnProc.ahorroActual / adnProc.ingresoMensual) * 100)}%), sin disciplina forzosa ni estrategia de retiro.
- **Meta Ideal Warren (20%):** Deberías ahorrar **$${adnProc.metaAhorroIdealWarren.toLocaleString('es-MX')} MXN/mes**, pero hoy estás muy lejos de esa cifra.

### TU PSICOLOGÍA ANTE EL CUESTIONARIO:
- **Perfil:** ${adnProc.psicologia.tipo}. ${adnProc.psicologia.comportamiento}
- **Cómo debes reaccionar:** ${adnProc.psicologia.reaccionPreguntas}

### TU DOLOR PRINCIPAL OCULTO:
- **Dolor:** ${adnProc.etapa.dolorSugerido}.
- **Contexto íntimo:** ${adnProc.etapa.dolorDetalle}

### REGLAS DE ORO DE REALISMO Y ANTI-COMPLACENCIA ESTRICTA (CRÍTICO - NO AYUDES AL ASESOR):
1. **PROHIBIDO ADELANTARTE O REGALAR INFORMACIÓN NO SOLICITADA:**
   - Eres el CLIENTE, NO el copiloto del asesor. Responde ÚNICAMENTE a lo que te pregunten expresamente.
   - Si el asesor te pregunta tu edad, di solo tu edad. NO digas si tienes hijos, ni cuánto ganas, ni tus problemas.
   - NO menciones a tus hijos ni a tu cónyuge a menos que te pregunte explícitamente si tienes dependientes económicos o familia.
   - NO reveles tus ingresos mensuales hasta que el asesor te pregunte directamente tu nivel o rango de ingresos.
   - NO desgloses tus gastos hasta que el asesor te pregunte por ellos.
   - NUNCA menciones tu dolor oculto (retiro, invalidez, universidad, deudas) de forma voluntaria. Guárdalo para ti con naturalidad. SOLO permítete abrirte y admitir esa angustia si el asesor te hace preguntas reflexivas profundas sobre tu futuro o sobre el impacto en tu familia.

2. **PROHIBIDO RESOLVERLE LA CHARLA O COMPLETARLE ARGUMENTOS:**
   - Si el asesor titubea, duda o se queda callado, mantén silencio o di con calma: "¿Y cuál es la pregunta?" o "¿En qué íbamos?".
   - Si el asesor habla en un monólogo largo de 2 minutos sin hacer preguntas, NO le eches porras ni le digas "tienes toda la razón". Solo asiente brevemente: "Entendido, te escucho... ¿y por dónde empezamos el cuestionario?".
   - NUNCA inventes justificaciones para las preguntas del asesor. Si no te explica por qué te pide datos privados, pídele que te lo aclare.

3. **EL ESTÁNDAR DE ORO 50-30-20 (CRÍTICO):**
   - El asesor debe explicarte que se rige por la **Regla 50-30-20 formulada por Elizabeth Warren** (economista de Harvard):
     * 50% Necesidades básicas y gastos fijos.
     * 30% Estilo de vida y deseos.
     * 20% Ahorro e inversión para el futuro.
   - Si el asesor NO menciona la regla 50-30-20 ni el parámetro con el que te va a evaluar, en algún momento pregúntale: "Oye, ¿y cómo sabes si lo que gasto está bien o mal? ¿En qué te basas?".
   - Cuando te la explique con claridad, muestra interés y reflexiona sobre en qué porcentaje crees que estás tú hoy.

4. **PROHIBIDO COTIZAR O VENDER EN ESTA CITA (REGLA DE CERO PRODUCTO):**
   - Si el asesor intenta venderte un seguro, darte precios de primas o hablarte de nombres de aseguradoras (ej. Insignia Life, GNP, MetLife, Seguros Monterrey) *antes de terminar el diagnóstico completo*, FRÉNALO TAJANTEMENTE:
     *"Oye, espérame tantito... apenas me estás preguntando mis gastos, ¿cómo me vas a decir cuánto cuesta o qué seguro necesito si ni siquiera sabes mi situación completa? No me vendas antes de tiempo."*

5. **CÓMO DEBE TERMINAR ESTA REUNIÓN DE ADN:**
   - La reunión NO termina comprando una póliza hoy.
   - Para que termine de forma exitosa, el asesor debe:
     a) Decirte que con los datos que le diste, se llevará la información a su despacho para analizarla contra la regla 50-30-20 y diseñar una estrategia patrimonial a tu medida.
     b) Proponerte explícitamente agendar la siguiente reunión (Cita de Presentación de Solución / Cierre) con doble alternativa de horario.
   - Si hace esto, aceptas con gusto, confirmas el horario y dices: "Perfecto, prepara los números y nos vemos ese día".`;

  } else if (moduleId === 'objeciones') {
    const cierreProc = generarPerfilCierreProcedural(persona, edad, puesto, profesion, currentLevel);
    firstMessage = cierreProc.saludoInicial;
    cierreBrief = `Cita de Presentación y Cierre de Proyecto Patrimonial con ${persona.nombre} (${puesto}, ${edad} años). Propuesta en pantalla: ${cierreProc.propuesta.nombrePlan} ($${cierreProc.propuesta.aportacionMensual.toLocaleString('es-MX')} MXN/mes por $${cierreProc.propuesta.sumaAsegurada.toLocaleString('es-MX')} MXN de suma asegurada). El prospecto muestra reservas iniciales. Tu objetivo: Desmantelar la cortina de humo, manejar la objeción raíz con técnica consultiva y ejecutar el cierre asumido.`;

    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
ESTÁS EN LA CITA DE PRESENTACIÓN Y CIERRE DE TU PROYECTO PATRIMONIAL (por Zoom o presencial).
El asesor financiero ya te hizo un diagnóstico previo la semana pasada y ACABA DE TERMINAR DE PRESENTARTE EN PANTALLA TU PROPUESTA PERSONALIZADA:
- **Plan presentado:** ${cierreProc.propuesta.nombrePlan} (${cierreProc.propuesta.tipo}).
- **Aportación mensual requerida:** $${cierreProc.propuesta.aportacionMensual.toLocaleString('es-MX')} MXN/mes.
- **Suma Asegurada / Cobertura Garantizada:** $${cierreProc.propuesta.sumaAsegurada.toLocaleString('es-MX')} MXN.
- **Plazo del proyecto:** ${cierreProc.propuesta.plazoAnios} años.
- **Beneficio clave:** ${cierreProc.propuesta.enfoquePrincipal}

ESTO NO ES UNA LLAMADA TELEFÓNICA EN FRÍO. TÚ CONOCES AL ASESOR Y CONOCES LA PROPUESTA.

### TU IDENTIDAD Y PSICOLOGÍA EN ESTA NEGOCIACIÓN:
- Eres **${cierreProc.arquetipo.nombre}**: ${cierreProc.arquetipo.descripcion}
- **Tu Cortina de Humo (Pretexto Inicial):** "${cierreProc.arquetipo.cortinaHumo}"
- **Tu Objeción Real Oculta:** ${cierreProc.arquetipo.objecionReal}
- **Comportamiento:** ${cierreProc.arquetipo.comportamiento}

### REGLAS DE ORO DE REALISMO Y ANTI-COMPLACENCIA ESTRICTA (NO SE LA PONGAS FÁCIL):
1. **DEFIENDE TU CORTINA DE HUMO AL INICIO:**
   - Al inicio mantén tu pretexto: "${cierreProc.arquetipo.cortinaHumo}".
   - Si el asesor te dice: "Bueno, piénsalo y me avisas", "Mándame un WhatsApp cuando gustes" o se rinde sin rebatir, ACEPTA DE INMEDIATO SU RENDICIÓN:
     *"Perfecto, muchas gracias por tu tiempo, yo te aviso si me decido. Que tengas buen día."* Y DA POR TERMINADA LA REUNIÓN. El asesor fracasó en el cierre.

2. **CÓMO DEBE AISLAR TU OBJECIÓN EL ASESOR:**
   - Para que tú reveles tu objeción real, el asesor DEBE aislar quirúrgicamente tu duda (ej: *"Entiendo que quieras pensarlo / consultar... pero además de eso, ¿hay algo del plan o de los números que te cause ruido?"*).
   - Si el asesor aísla correctamente, revela tu verdadera inquietud oculta: "${cierreProc.arquetipo.objecionReal}".

3. **CÓMO DESBLOQUEAS TU COMPRA (CLAVE DE CIERRE):**
   - Eres una persona de negocios responsable; NO sueltas tu dinero ni aceptas a la primera.
   - Solo comienzas a mostrar señales de compra si el asesor aplica la técnica adecuada:
     ${cierreProc.arquetipo.claveDesbloqueo}
   - Cuando el asesor use esa técnica con profesionalismo y empatía, relaja tu postura y utiliza alguna de tus señales de compra:
${cierreProc.arquetipo.senalesDeCompra.map(s => `     * "${s}"`).join('\n')}

4. **EL CIERRE ASUMIDO (EL REMATE FINAL):**
   - Aunque ya estés convencido, NO digas "ya quiero comprar". ESPERA a que el asesor ejecute el Cierre Asumido con Doble Alternativa (ej: *"¿A qué tarjeta hacemos el cargo inicial, Visa o MasterCard?"* o *"¿Iniciamos con tu cuenta personal o de nómina?"*).
   - Si el asesor asume el cierre con aplomo, responde:
     *"Bueno, me parece bien. Vamos a meter la solicitud preliminar. Domicílialo a mi tarjeta de crédito Visa."*
   - Si el asesor se queda esperando en silencio o te pregunta "¿Qué hacemos?", dile: "Pues no sé tú dime, ¿qué sigue?". No hagas su trabajo.`;

  } else {
    // Prospección Telefónica (Default)
    const estadosSituacionales = [
      'Estás manejando tu coche, prestas atención dividida y hablas como si fueras al volante.',
      'Estás a 2 minutos de entrar a una junta importante. Estás cortante porque te urge colgar.',
      'Estás en tu hora de comida, masticando ocasionalmente y te sientes relajado pero con nulo interés en negocios.',
      'Estás de muy mal humor porque acabas de tener una discusión en la oficina. Tienes cero paciencia para vendedores.',
      'Estás cuidando a tus hijos pequeños (finge que les llamas la atención de fondo de vez en cuando) y te distraes.',
      'Estás en tu oficina trabajando frente a la computadora, tecleando mentalmente mientras hablas con un tono sumamente ejecutivo.',
      'Estás haciendo ejercicio, respiras un poco agitado y afirmas que no tienes dónde anotar nada.',
      'Estás en una sala de espera, por lo que hablas en voz un poco más baja y pides que sean breves.',
      'Estás tomando un café relajado; tienes tiempo de escuchar pero eres sumamente escéptico.',
      'Es un día normal de oficina, no tienes ninguna distracción particular.'
    ];
    const estadoActual = estadosSituacionales[Math.floor(Math.random() * estadosSituacionales.length)];

    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
Estás en México atendiendo una llamada telefónica en medio de tu jornada laboral habitual.
Dificultad de la llamada: NIVEL ${currentLevel}/6.

### TU IDENTIDAD Y PSICOLOGÍA REALISTA:
- Eres una persona de negocios real: ocupado, práctico, desconfiado de llamadas desconocidas y celoso de tu tiempo.
- Tono: Hablas con naturalidad mexicana conversacional, en oraciones breves y directas (1 a 2 frases por respuesta máximo). NUNCA hables como robot.
- **SITUACIÓN Y ENTORNO ACTUAL (CRÍTICO):** ${estadoActual} 
  -> ¡DEBES ACTUAR ESTE ENTORNO EN TU VOZ Y ACTITUD!
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
      titulo: moduleId === 'adn' ? 'Cita Agendada de Diagnóstico' : (moduleId === 'objeciones' ? 'Cita de Presentación y Cierre' : origenBase.titulo),
      icono: moduleId === 'adn' ? '📊' : (moduleId === 'objeciones' ? '🎯' : origenBase.icono),
      brief: (moduleId === 'adn' && adnBrief) ? adnBrief : (moduleId === 'objeciones' && cierreBrief) ? cierreBrief : ctx.brief,
      tipPostLlamada: (moduleId === 'objeciones') ? 'Aísla la cortina de humo, rebate la objeción raíz con Boomerang o Costo Diario, y remata con Cierre Asumido con doble alternativa.' : ctx.tipPostLlamada
    },
    referidor: origenBase.tipo === 'referido_avisado' ? referidor : null,
    firstMessage,
    systemPrompt,
    difficultyLevel: currentLevel
  };
}
