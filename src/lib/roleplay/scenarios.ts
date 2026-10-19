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
    comportamiento: 'Habla ágil porque tiene una junta próxima, pero si el asesor va al grano y le propone dos opciones de horario para una reunión breve, agenda con gusto.',
    objecionFrecuente: 'Platíqueme rápido por favor que estoy por entrar a una junta.',
    dificultad: 'baja'
  },
  {
    tipo: 'Cordial y práctico',
    comportamiento: 'Muy educado. Si el asesor le explica desde el inicio que la cita es para conocer sus necesidades y hacer un traje a la medida con dos horarios, acepta de inmediato.',
    objecionFrecuente: 'Suena interesante, ¿de qué trataría exactamente la reunión?',
    dificultad: 'baja'
  },
  {
    tipo: 'El Ocupado con agenda llena',
    comportamiento: 'Anda con pendientes del día, pero valora el orden. Si le proponen dos opciones claras de día y hora para platicar con calma, elige una.',
    objecionFrecuente: 'Ahorita me agarras con varios pendientes en la oficina, ¿cuánto tiempo nos tomaría la reunión?',
    dificultad: 'baja'
  },
  {
    tipo: 'El Pragmático Ejecutivo',
    comportamiento: 'Valora la honestidad y el respeto a su tiempo por encima de todo. Si percibe estructura profesional y doble alternativa, accede rápido.',
    objecionFrecuente: 'Tengo un par de minutos antes de salir, dígame cómo funciona su asesoría.',
    dificultad: 'baja'
  },
  {
    tipo: 'Analítico numérico',
    comportamiento: 'Pregunta inicialmente de qué montos o rendimientos hablan, pero en cuanto el asesor le explica que todo plan es personalizado previo diagnóstico de sus objetivos, entiende perfectamente la lógica y acepta agendar. (Si el asesor comete el error de darle montos o tasas por teléfono, pierde interés y rechaza la cita).',
    objecionFrecuente: 'Oye, antes de agendar, ¿más o menos de qué montos o rendimientos estamos hablando?',
    dificultad: 'media'
  },
  {
    tipo: 'Satisfecho (Ya tiene seguros)',
    comportamiento: 'Comenta que ya cuenta con pólizas, pero si el asesor le explica que la reunión es para un diagnóstico integral y optimizar lo que ya tiene sin compromiso, accede a la cita.',
    objecionFrecuente: 'Fíjate que ya tengo algunas pólizas contratadas, ¿en qué me ayudaría reunirme contigo?',
    dificultad: 'media'
  },
  {
    tipo: 'Cauteloso por experiencia previa',
    comportamiento: 'Tuvo un asesor antes que nunca le dio seguimiento, pero si nota que el asesor actual quiere escuchar sus necesidades primero en una sesión personalizada, acepta reunirse.',
    objecionFrecuente: 'La verdad antes tuve un agente que solo me vendió y nunca volvió a aparecer, ¿ustedes cómo trabajan?',
    dificultad: 'media'
  },
  {
    tipo: 'Curioso del origen de la llamada',
    comportamiento: 'Pregunta amablemente de dónde tienen su contacto si el asesor no lo mencionó claro, y al aclararlo y recibir dos opciones de horario, acepta la reunión.',
    objecionFrecuente: 'Disculpa, recuérdame cómo obtuviste mi contacto y qué es lo que manejan.',
    dificultad: 'media'
  },
  {
    tipo: 'El Inversionista Patrimonial',
    comportamiento: 'Suele invertir en su negocio o bienes raíces. Si el asesor le explica que la cita es para conocer su estrategia actual y diseñar un blindaje personalizado a su medida, acepta escuchar en una cita.',
    objecionFrecuente: 'Yo normalmente muevo mi capital en mi propio negocio, ¿qué vemos exactamente en esa sesión?',
    dificultad: 'media'
  },
  {
    tipo: 'Cuidadoso con su flujo',
    comportamiento: 'No quiere comprometerse a ciegas en la llamada, pero cuando el asesor le aclara que la primera cita es 100% de diagnóstico para conocer sus objetivos sin compromiso, acepta uno de los horarios.',
    objecionFrecuente: 'Mira, ahorita cuido mucho el flujo de la empresa, ¿la reunión nos compromete a contratar algo hoy?',
    dificultad: 'media'
  },
  {
    tipo: 'Empresario directo y al grano',
    comportamiento: 'Trato ejecutivo. Pone a prueba al asesor con una primera pregunta directa, pero si el asesor responde con seguridad que primero hace un diagnóstico personalizado y le da dos horarios concretos, acepta la cita de inmediato.',
    objecionFrecuente: 'Vayamos al grano: ¿por qué nos reuniríamos en persona en lugar de que me mandes un folleto?',
    dificultad: 'alta'
  },
  {
    tipo: 'Ejecutivo exigente de postura',
    comportamiento: 'Evalúa la seguridad del asesor. Si el asesor no regala números por teléfono, defiende el valor del diagnóstico previo y cierra con doble alternativa, le concede la cita.',
    objecionFrecuente: 'Recibo varias llamadas a la semana de asesores; dime en 20 segundos qué hace diferente tu diagnóstico.',
    dificultad: 'alta'
  }
];

const ORIGENES = [
  {
    tipo: 'referido_avisado',
    titulo: 'REFERIDO AVISADO',
    icono: '🤝',
    dificultad: 'baja',
    generar: (referidor: string, agencyName = 'AACOM Seguros') => ({
      brief: `Tu cliente "${referidor}" le recomendó tu servicio y le avisó que le ibas a llamar hoy.`,
      tipPostLlamada: `En prospectos referidos avisados, menciona el nombre de ${referidor} en los primeros 5 segundos para que te ubique inmediatamente y baje la guardia.`,
      promptContext: `Fuiste referido por tu amigo/socio "${referidor}", quien te comentó que un asesor de ${agencyName} te marcaría. Sí recuerdas la recomendación, pero quieres saber de qué se trata exactamente antes de dar tu tiempo.`
    })
  },
  {
    tipo: 'referido_tibio',
    titulo: 'REFERIDO SIN AVISAR',
    icono: '📞',
    dificultad: 'media',
    generar: (referidor: string, _agencyName = 'AACOM Seguros') => ({
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
    generar: (_?: string, agencyName = 'AACOM Seguros') => ({
      brief: `El prospecto dejó sus datos en una publicación de internet de ${agencyName} hace unos días.`,
      tipPostLlamada: `Recuérdale que él mismo solicitó la asesoría en la página web, pero no asumas que tiene 1 hora para hablar hoy; enfócate en agendar la reunión formal.`,
      promptContext: `Llenaste un formulario en internet de ${agencyName} hace unos días por curiosidad sobre ahorro o protección. Recuerdas haberlo hecho, pero andas ocupado en tu trabajo y no quieres que te den un discurso largo por teléfono.`
    })
  },
  {
    tipo: 'networking_evento',
    titulo: 'CONTACTO DE NETWORKING',
    icono: '👔',
    dificultad: 'media',
    generar: (_?: string, _agencyName = 'AACOM Seguros') => ({
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
    generar: (_?: string, _agencyName = 'AACOM Seguros') => ({
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
    generar: (_?: string, agencyName = 'AACOM Seguros') => ({
      brief: `Contacto nuevo en frío obtenido de directorio empresarial. El prospecto NO TIENE IDEA de quién eres.`,
      tipPostLlamada: `En frío no hay confianza previa: tienes solo 15 segundos para dar un gancho de curiosidad o dolor profesional antes de que te corte.`,
      promptContext: `No conoces a la persona que te llama ni a ${agencyName}. Es un número no registrado. Eres cortante al inicio y preguntas con quién hablas y de dónde obtuvieron tus datos.`
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

  // Vector 4: Psicología y Apertura ante el Diagnóstico Patrimonial
  const psicologiasApertura = [
    {
      tipo: 'El Ejecutivo Reservado y Formal',
      comportamiento: 'Profesional y ocupado. Celoso de su información financiera; requiere respeto y formalidad.',
      reaccionPreguntas: 'Eres muy reservado con tu dinero. En el saludo eres educado y formal, pero si el asesor te pide datos bancarios o gastos íntimos de golpe sin antes generar confianza ni garantizar confidencialidad, muestras una ligera reserva: "Disculpa, ¿estos números son estrictamente confidenciales verdad?". Si te brinda confianza, cooperas con sobriedad.',
      objecionResistencia: 'resistencia_privacidad'
    },
    {
      tipo: 'El Padre / Madre de Familia Protector',
      comportamiento: 'Su prioridad absoluta es el bienestar y educación de su familia. Es receptivo cuando indagan con respeto en sus seres queridos.',
      reaccionPreguntas: 'Te abres con sincero orgullo si te preguntan por tu familia o tus hijos. Pero no lo cuentas todo de golpe: respondes únicamente lo que te preguntan, con calidez y naturalidad.',
      objecionResistencia: null
    },
    {
      tipo: 'El Emprendedor con Múltiples Metas',
      comportamiento: 'Tiene varios proyectos en marcha y muchas inquietudes patrimoniales en la cabeza.',
      reaccionPreguntas: 'Mencionas que tienes varios frentes abiertos si te preguntan por tus planes futuros. Si el asesor te pide jerarquizar y elegir cuál es tu prioridad número uno en este momento de tu vida, te tomas unos segundos, reflexionas y le dices claramente cuál es tu meta primordial.',
      objecionResistencia: 'prioridades_multiples'
    },
    {
      tipo: 'El Escéptico Anti-Ventas Enlatadas',
      comportamiento: 'Le molesta que asesores o bancos le quieran encajar pólizas sin conocer su situación personal.',
      reaccionPreguntas: 'Si el asesor aclara desde el principio que esta reunión es para un diagnóstico de su situación actual para diseñar una propuesta a la medida (y que hoy no viene a vender productos), bajas la guardia con alivio y dices: "Me parece perfecto, qué bueno que no vienes a recetarme a ciegas".',
      objecionResistencia: 'cero_productos'
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
    barrerasRequeridas: number;
    dificultad: string;
  };
  entorno: {
    lugar: string;
    desc: string;
    saludos: string[];
  };
  saludoInicial: string;
}

export function generarPerfilCierreProcedural(persona: any, edad: number, puesto: string, profesion: any, level: number, agencyName = 'AACOM Seguros'): PerfilCierreProcedural {
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

  // Vector 2: Arquetipos Psicológicos de Negociación y Cierre (12 Arquetipos con Multi-Barreras)
  const arquetiposCatalogo = [
    // DIFICULTAD BAJA (Niveles 1-2)
    {
      nombre: 'El Postergador Crónico ("Déjame Pensarlo")',
      dificultad: 'baja',
      descripcion: 'Le parece excelente la idea pero sufre de parálisis por análisis y aversión al compromiso. Cree que puede aplazar la decisión indefinidamente.',
      cortinasHumo: [
        'Suena muy bien todo lo que me presentas. Déjame darle una buena pensada este fin de semana con la almohada y yo te busco el martes para decirte qué decidí.',
        'Me gusta mucho el plan, pero prefiero no tomar decisiones en caliente. Mándamelo por correo y lo reviso con calma el próximo mes.',
        'Está excelente, pero ahorita ando cerrando cosas de trabajo. Búscame a principios del próximo trimestre cuando esté más desahogado.'
      ],
      objecionReal: 'Miedo al compromiso a largo plazo y falta de sentido de urgencia; asume que hoy está sano y que nada le va a pasar.',
      comportamiento: 'Si el asesor dice "Bueno, piénsalo y me avisas", sonríe aliviado, dice "Perfecto, yo te busco" y da por terminada la reunión. Pierde la venta.',
      claveDesbloqueo: 'El asesor debe: 1) Aislar ("Aparte de pensarlo, ¿hay algo del plan que no te convenza?"), 2) Usar la técnica del Costo de la Inacción ("Podemos esperar, pero la edad y la salud no se congelan; el riesgo corre desde hoy"), y 3) Cerrar de forma asumida con trámite preliminar.',
      senalesDeCompra: [
        'Pues sí, tienes razón, la verdad es que si no lo hago hoy lo voy a seguir postergando un año más.',
        '¿Y para la solicitud preliminar qué papelería necesitarías llenar ahorita?',
        '¿El cargo a la tarjeta se hace hoy o hasta que emitan la póliza formal?'
      ]
    },
    {
      nombre: 'El Apretado de Presupuesto ("Está Muy Caro")',
      dificultad: 'baja',
      descripcion: 'Siente que la mensualidad es un golpe fuerte a su cartera porque la percibe como un gasto nuevo en lugar de un ahorro.',
      cortinasHumo: [
        `Me encantó la propuesta y la suma de $${sumaAsegurada.toLocaleString('es-MX')}, pero la verdad $${aportacionMensual.toLocaleString('es-MX')} pesos al mes se me hace carísimo, ando muy apretado de flujo ahorita.`,
        `Ahorita tengo muchos compromisos de gastos en la casa y escuelas. No tengo margen para una mensualidad de $${aportacionMensual.toLocaleString('es-MX')} pesos.`,
        `La prima está bastante más alta de lo que tenía contemplado destinar a un plan de protección.`
      ],
      objecionReal: 'No ha cuantificado el impacto en gasto diario y teme asfixiarse en meses de bajas ventas.',
      comportamiento: 'Si el asesor baja la suma asegurada de inmediato sin defender el valor, siente que le estaban cobrando de más. Exige que le demuestren el valor.',
      claveDesbloqueo: `El asesor debe aplicar: 1) Reducción al Absurdo o Costo Diario ("Son $${Math.round(aportacionMensual / 30)} pesos diarios, menos que un café y propina"), o 2) Técnica del Boomerang ("Precisamente si hoy con salud $${aportacionMensual.toLocaleString('es-MX')} se siente pesado, imagina a tu familia viviendo con $0 si tú faltas mañana").`,
      senalesDeCompra: [
        `Visto así por día de $${Math.round(aportacionMensual / 30)} pesos la verdad sí hace mucho más sentido.`,
        '¿El cobro se puede hacer fraccionado o con tarjeta de crédito para generar puntos?',
        '¿En meses difíciles tengo algún periodo de gracia para no perder la póliza?'
      ]
    },
    {
      nombre: 'El Cónyuge Dependiente ("Debo Consultarlo con mi Pareja")',
      dificultad: 'baja',
      descripcion: 'Comparte la administración del hogar y teme tomar una decisión financiera relevante sin el aval explícito de su cónyuge.',
      cortinasHumo: [
        'Todo se ve muy bien estructurado, pero yo todas las decisiones de este tipo las tomo junto con mi esposa/esposo. Mándamelo por correo y lo reviso con ella este fin de semana.',
        'Necesito que mi pareja vea la tabla y me dé el visto bueno antes de autorizar cualquier cargo.',
        'Déjame platicarlo con mi señora hoy en la cena; si a ella le hace sentido te aviso el lunes.'
      ],
      objecionReal: 'Miedo al reclamo familiar por comprometer dinero, o falta de argumentos para explicarle el valor a su pareja.',
      comportamiento: 'Si le dices "No le digas a tu esposa", se ofende. Si aceptas "mándamelo por correo", el cónyuge verá una hoja de costo y dirá que no.',
      claveDesbloqueo: 'El asesor debe: 1) Elogiar el acuerdo de pareja, 2) Preguntar: "¿Si tu pareja supiera que este plan garantiza la tranquilidad de la familia pase lo que pase, crees que te diría que sí?", 3) Ofrecer avanzar con la emisión preliminar con garantía de cancelación sin costo o agendar una llamada breve juntos para resolver dudas.',
      senalesDeCompra: [
        'Sí, la verdad a ella lo que más le preocupa es la escuela de los niños si a mí me pasa algo.',
        '¿Podemos meter la solicitud preliminar y si ella tiene alguna duda la revisamos en la entrega?',
        '¿La puedo poner a ella como beneficiaria irrevocable del 100%?'
      ]
    },
    {
      nombre: 'El Escéptico de Domiciliación ("No me Gusta Domiciliar")',
      dificultad: 'baja',
      descripcion: 'Ha tenido malas experiencias bancarias con cobros indebidos y se resiste a programar cargos automáticos recurrentes.',
      cortinasHumo: [
        'No me gusta dar datos de tarjeta ni que me domicilien cargos automáticos, luego es un dolor de cabeza cancelarlos con los bancos.',
        'Prefiero que me mandes una ficha de pago referenciada para pagar en ventanilla cada mes cuando yo me acuerde.',
        'A mí no me gusta amarrarme con tarjetas de crédito para servicios a largo plazo.'
      ],
      objecionReal: 'Miedo a perder el control de su dinero o a trámites engorrosos de cancelación.',
      comportamiento: 'Si el asesor insiste en pedir la tarjeta sin explicar las garantías de seguridad, se cierra.',
      claveDesbloqueo: 'El asesor debe explicar: 1) El riesgo del periodo de gracia (pagar en ventanilla pone en riesgo la cobertura si se olvida la fecha), 2) La protección legal de la domiciliación y que la póliza se cancela formalmente con un simple correo, 3) Los beneficios de puntos y meses sin intereses en la tarjeta.',
      senalesDeCompra: [
        'Ah, o sea que si cambio de tarjeta en cualquier momento puedo actualizarla en el portal...',
        '¿El estado de cuenta me llega cada mes a mi correo para conciliar el cargo?',
        'Bueno, si genera puntos de recompensas en mi tarjeta Visa, me parece bien.'
      ]
    },

    // DIFICULTAD MEDIA (Niveles 3-4)
    {
      nombre: 'El Inversionista Autosuficiente ("CETES / Bienes Raíces")',
      dificultad: 'media',
      descripcion: 'Se enorgullece de mover su propio dinero. Considera que los seguros dan bajo rendimiento frente a activos de renta fija o bienes raíces.',
      cortinasHumo: [
        'Estuve haciendo números rápidos y los rendimientos de la aseguradora no le ganan a CETES, la bolsa o un terreno en preventa. Prefiero mover yo mi capital.',
        'Yo no creo en seguros con ahorro, los rendimientos son muy bajos comparados con lo que gano en mis inversiones privadas.',
        'Prefiero comprar ladrillos; las rentas de bienes raíces son mi verdadero plan de retiro, dan mucho más flujo.'
      ],
      objecionReal: 'Confunde un instrumento de inversión especulativa con una red de protección patrimonial y blindaje ante invalidez.',
      comportamiento: 'No le discutas de tasas de interés. Si peleas de matemáticas te va a ganar. Muestra carácter y separa los objetivos.',
      claveDesbloqueo: `El asesor debe separar los instrumentos: 1) Validar su talento de inversión ("CETES y bienes raíces son fabulosos para multiplicar dinero"), 2) Marcar el contraste ("Pero si mañana tienes un accidente o invalidez, CETES no te va a pagar $${(sumaAsegurada / 1000000).toFixed(1)} millones de indemnización al día siguiente"), 3) Posicionar el plan como el cinturón de seguridad que protege sus otras inversiones.`,
      senalesDeCompra: [
        'Tienes un punto válido: nunca había visto el seguro como un blindaje de mis otras inversiones.',
        '¿Y este fondo tiene alguna penalización si quiero aportar más capital en el futuro?',
        '¿La suma asegurada por fallecimiento está exenta de impuestos ante el SAT?'
      ]
    },
    {
      nombre: 'El Amparado por el Trabajo ("Ya Tengo Seguro en mi Empresa")',
      dificultad: 'media',
      descripcion: 'Gana buen sueldo corporativo y cree que el paquete de prestaciones de su empresa lo blinda de por vida.',
      cortinasHumo: [
        'En la empresa donde trabajo me dan una póliza de vida corporativa por 36 meses de sueldo y gastos médicos mayores, estoy totalmente cubierto.',
        'El corporativo ya me cubre con un paquete de prestaciones muy robusto, no necesito pagar uno particular de mi bolsa.',
        'Tengo seguro de grupo en mi trabajo que me cubre bastante bien, sería duplicar coberturas.'
      ],
      objecionReal: 'Falsa sensación de pertenencia; asume que siempre trabajará en esa empresa o que podrá asegurarse igual en su vejez.',
      comportamiento: 'Es educado pero autosuficiente. Cree que no tiene ninguna vulnerabilidad.',
      claveDesbloqueo: 'El asesor debe evidenciar la trampa de la póliza de grupo: "Ese seguro es de la empresa, no tuyo. Si mañana renuncias, te despiden o te jubilas a los 55 años, esa póliza se extingue en 24 horas y a esa edad contratar una individual te costará 4 veces más o ya no serás asegurable por salud."',
      senalesDeCompra: [
        'Es cierto... mi compadre salió de la empresa el año pasado y se quedó sin seguro de un día para otro.',
        '¿Y este plan individual me pertenece a mí sin importar en qué empresa trabaje?',
        '¿Puedo deducir esta póliza en mi declaración anual independiente de mi nómina?'
      ]
    },
    {
      nombre: 'El Asustado por el Plazo ("¿Y si Pierdo mi Empleo en 5 años?")',
      dificultad: 'media',
      descripcion: 'Ha visto despidos o crisis en su sector y le aterra comprometerse a un plan de 10, 15 o 20 años.',
      cortinasHumo: [
        'Comprometerme a pagar esto por 15 o 20 años me da pavor. ¿Qué pasa si en 3 años me quedo sin trabajo o tengo una crisis y no puedo pagar?',
        'Los seguros son muy rígidos; si dejas de pagar te quitan todo tu dinero y pierdes tus ahorros.',
        'El plazo es demasiado largo para la incertidumbre que hay en el mercado laboral hoy.'
      ],
      objecionReal: 'Aversión al riesgo de iliquidez futura y desconocimiento de las cláusulas de flexibilidad de las aseguradoras.',
      comportamiento: 'Duda mucho. Si el asesor minimiza su preocupación diciendo "no te va a pasar nada", desconfía.',
      claveDesbloqueo: 'El asesor debe explicar las válvulas de escape del contrato: Periodo de gracia de 30-60 días, Préstamo automático sobre valores garantizados, Seguro Saldado (congelar el plan con cobertura reducida sin meter más dinero) y Rescate de fondos acumulados.',
      senalesDeCompra: [
        'No sabía que existía la opción de seguro saldado si no puedo seguir aportando.',
        '¿A partir de qué año empieza a generar valores en efectivo de rescate?',
        'O sea que el dinero no se pierde como en un seguro de auto...'
      ]
    },
    {
      nombre: 'El Fiel al Compadre ("Mi Amigo Vende en GNP / Monterrey")',
      dificultad: 'media',
      descripcion: 'Tiene un conocido o familiar en el sector y siente culpa moral de no comprarle a él.',
      cortinasHumo: [
        'La propuesta está excelente, pero la verdad mi primo/compadre trabaja en GNP/Seguros Monterrey y le prometí que si compraba algo lo vería con él.',
        'Tengo un amigo de toda la vida que es agente de seguros; le voy a pasar tu cotización para que me haga una similar.',
        'Prefiero darle el negocio a alguien de mi círculo cercano por lealtad.'
      ],
      objecionReal: 'Compromiso social incómodo; en el fondo le da pena revelar sus finanzas íntimas a un amigo o teme que su amigo no sea profesional.',
      comportamiento: 'Usa a su amigo como escudo para no cerrar hoy.',
      claveDesbloqueo: `El asesor debe posicionar el valor fiduciario independiente: "Tu amigo es muy valioso, pero en finanzas familiares a veces da pena hablar de deudas, testamentos y salud íntima con un compadre. Además, ${agencyName} es una promotoría multimarca independiente que no te encasilla en una sola opción, sino que defiende tus intereses ante cualquier compañía."`,
      senalesDeCompra: [
        'Tienes razón en algo: a mi compadre la verdad no le tengo tanta confianza para que sepa mis ingresos exactos.',
        '¿Y ustedes dan seguimiento directo a los trámites o todo es por conmutador?',
        '¿Qué aseguradora respaldaría este proyecto en particular?'
      ]
    },

    // DIFICULTAD ALTA / EXTREMA (Niveles 5-6)
    {
      nombre: 'El Escéptico de Inflación ("En 20 años el Peso no Vale Nada")',
      dificultad: 'alta',
      descripcion: 'Recuerda devaluaciones pasadas en México y desconfía de las monedas a largo plazo. Es numérico y analítico.',
      cortinasHumo: [
        'El problema de estos planes a 15 o 20 años es la inflación en México. Esos millones que me prometes a los 65 años van a alcanzar para comprar una despensa y nada más.',
        'Con el historial de devaluaciones en México, meter dinero a 20 años en moneda nacional es un error financiero garrafal.',
        'El peso pierde poder adquisitivo cada año, los seguros nunca le ganan a la inflación real.'
      ],
      objecionReal: 'Desconoce la figura legal de las UDIS (Unidades de Inversión) indexadas por ley al INPC del Banco de México.',
      comportamiento: 'Es escéptico pero racional. Si el asesor titubea o no sabe explicar qué es una UDI, lo destruye numéricamente.',
      claveDesbloqueo: 'El asesor debe explicar con solvencia el mecanismo de UDIS / indexación inflacionaria garantizada por Banxico: el valor de la suma asegurada y el ahorro se calculan en poder adquisitivo constante, garantizando que el dinero preserve su valor real en el tiempo.',
      senalesDeCompra: [
        'Ah, o sea que la UDI se recalcula diariamente con la inflación oficial del Banco de México...',
        '¿Y la indemnización por fallecimiento o invalidez también se liquida al valor de la UDI del día del siniestro?',
        '¿El contrato estipula esta garantía por escrito o es una tasa variable?'
      ]
    },
    {
      nombre: 'El Empresario Celoso de su Liquidez ("En mi Negocio Gano Más")',
      dificultad: 'alta',
      descripcion: 'Dueño de empresa con colmillo. Reinvierte todo en mercancía y tiene todo su patrimonio mezclado con la persona moral.',
      cortinasHumo: [
        `Yo a cada peso en mi empresa le saco el 25% o 30% anual entre mercancía y rotación. Meter $${aportacionMensual.toLocaleString('es-MX')} a una aseguradora se me hace tener dinero muerto.`,
        'Mi negocio requiere reinversión constante en inventario y maquinaria; no puedo inmovilizar capital en pólizas externas.',
        'Cualquier peso que no esté en la operación de la empresa me genera costo de oportunidad brutal.'
      ],
      objecionReal: 'Teme quedarse sin liquidez para emergencias del negocio y tiene todo su patrimonio personal expuesto al riesgo operativo.',
      comportamiento: 'Trato rudo, directo y dominante. Si detecta novatez o debilidad, corta la reunión en 30 segundos.',
      claveDesbloqueo: 'El asesor debe demostrar temple y argumentar el Blindaje Patrimonial y la Inembargabilidad: 1) "Tu negocio es tu motor, pero si una demanda laboral o mercantil lo embarga, tu patrimonio personal también corre riesgo", 2) La ley del contrato de seguro hace estas pólizas inembargables y deducibles de impuestos (Art. 151 / 27 LISR), 3) Es sacar dinero del riesgo de la empresa hacia la seguridad de la familia.',
      senalesDeCompra: [
        'No sabía que las pólizas de retiro y vida tenían blindaje legal inembargable ante juicios mercantiles.',
        '¿Y cómo se factura esto para que mi contador lo deduzca al 100% en la empresa?',
        '¿Qué requisitos corporativos me pedirían para emitir como Hombre Clave?'
      ]
    },
    {
      nombre: 'El Escéptico de Letras Chiquitas ("Las Aseguradoras No Pagan")',
      dificultad: 'alta',
      descripcion: 'Cínico ante las instituciones financieras. Cree que los contratos de seguros están diseñados con trampas legales.',
      cortinasHumo: [
        'Todos los seguros te pintan las cosas color de rosa cuando te cobran, pero a la mera hora buscan cualquier pretexto en las letras chiquitas para no pagar.',
        'Tuve una pésima experiencia con una aseguradora en un hospital donde no quisieron responder, la verdad no confío en la industria.',
        'Las aseguradoras son expertas en cobrar puntual y expertas en lavarse las manos cuando hay una reclamación.'
      ],
      objecionReal: 'Miedo a ser engañado por cláusulas de exclusión o falta de asesoría técnica fiduciaria.',
      comportamiento: 'Desafía al asesor. Exige fundamentos legales y regulatorios firmes.',
      claveDesbloqueo: `El asesor debe responder con absoluta seguridad jurídica: Citar la Ley sobre el Contrato de Seguro, la Cláusula de Indisputabilidad (después de 2 años la póliza no puede ser rescindida ni disputada por la aseguradora salvo dolo comprobado), la supervisión de la CNSF y CONDUSEF, y el papel de ${agencyName} como agente fiduciario que tramita los siniestros a favor del cliente.`,
      senalesDeCompra: [
        'Es la primera vez que un asesor me explica el fundamento legal de la indisputabilidad.',
        '¿Y ustedes como despacho nos ayudan a ingresar la reclamación si algo pasa?',
        '¿En qué aseguradora está respaldado el contrato?'
      ]
    },
    {
      nombre: 'El Negociador Regateador ("Bájame la Prima o Dame Descuento")',
      dificultad: 'alta',
      descripcion: 'Negociador implacable que busca probar al asesor pidiendo rebajas de tarifa o comisiones compartidas.',
      cortinasHumo: [
        'Si me bajas la mensualidad a la mitad o me consigues un descuento del 15% en la prima te lo firmo ahorita mismo.',
        '¿Qué descuento o bono me puedes dar tú de tu comisión para cerrar hoy en la mesa?',
        'Tu propuesta me gusta pero compite contra una que me ofrecen más barata en el banco; bájale y cerramos.'
      ],
      objecionReal: 'Estrategia de intimidación comercial para verificar si el producto tiene sobreprecio o si el asesor es novato.',
      comportamiento: 'Si el asesor baja la tarifa de inmediato, pierde toda la autoridad y el cliente lo rechaza por falta de seriedad.',
      claveDesbloqueo: 'El asesor debe mantener una postura de hierro: "Por ley de la Comisión Nacional de Seguros y Fianzas las tarifas son públicas, actuariales y estrictamente reguladas. Bajar la tarifa aquí no es como comprar un coche: significaría mutilar la suma asegurada de tus hijos a la mitad. ¿Prefieres regatear $500 pesos hoy o tener la tranquilidad de $5 millones garantizados?"',
      senalesDeCompra: [
        'Me gusta que defiendas tu producto con esa seguridad, se nota que sabes lo que vendes.',
        '¿Y la prima se mantiene fija en UDIS durante todo el plazo sin incrementos adicionales?',
        'Bueno, no se hable más. Vamos a emitirlo con las sumas que calculaste.'
      ]
    }
  ];

  // Filtro por Nivel de Dificultad
  let arquetiposFiltrados = arquetiposCatalogo;
  let barrerasRequeridas = 1;
  if (level <= 2) {
    arquetiposFiltrados = arquetiposCatalogo.filter(a => a.dificultad === 'baja');
    barrerasRequeridas = 1;
  } else if (level <= 4) {
    arquetiposFiltrados = arquetiposCatalogo.filter(a => a.dificultad === 'media' || a.dificultad === 'baja');
    barrerasRequeridas = 2;
  } else {
    arquetiposFiltrados = arquetiposCatalogo.filter(a => a.dificultad === 'alta');
    barrerasRequeridas = 3;
  }

  const arquetipoBase = arquetiposFiltrados[Math.floor(Math.random() * arquetiposFiltrados.length)] || arquetiposCatalogo[0];
  const cortinaHumoElegida = arquetipoBase.cortinasHumo[Math.floor(Math.random() * arquetipoBase.cortinasHumo.length)];

  const arquetipo = {
    ...arquetipoBase,
    cortinaHumo: cortinaHumoElegida,
    barrerasRequeridas
  };

  // Vector 3: Entornos de Cierre
  const entornosCierre = [
    {
      lugar: 'Sesión por Zoom / Google Meet (Pantalla compartida con la propuesta)',
      desc: 'El asesor acaba de compartir la pantalla con el PDF de la cotización formal y la tabla de proyección de ahorro y suma asegurada.',
      saludos: [
        `Hola, pues ya estuve viendo con mucha atención las láminas y la gráfica de proyección que me pusiste en la pantalla... y la verdad es que está muy interesante, pero ${cortinaHumoElegida}`,
        `¿Qué tal? Sí, veo los números que proyectaste en el PDF y el desglose de beneficios. Se ve bien presentado, pero siendo muy honestos, ${cortinaHumoElegida}`,
        `Hola, te estaba escuchando atento durante toda la corrida financiera. Te agradezco la propuesta, pero la verdad de entrada, ${cortinaHumoElegida}`
      ]
    },
    {
      lugar: 'Oficina ejecutiva del prospecto (Reunión presencial con carpeta de propuesta)',
      desc: 'El prospecto tiene la carpeta impresa con la propuesta sobre su escritorio, hojeando la página de costos y coberturas.',
      saludos: [
        `Hola, pasa, siéntate. Ya revisé la carpeta con la cotización que me dejaste... y mira, el plan se ve sólido, pero ${cortinaHumoElegida}`,
        `¿Qué tal? Gracias por venir a la oficina. Estuve analizando la tabla de aportaciones y sumas que me imprimiste, pero ${cortinaHumoElegida}`
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

export function generarEscenarioAleatorio(level = 1, moduleId = 'prospeccion', agencyName = 'AACOM Seguros'): Scenario {
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
    rigorNivel = 'Eres educado y razonable. Si desde su primer turno el asesor se presenta con su nombre y despacho, menciona el motivo de la llamada, explica que la reunión breve es para conocer tus necesidades/objetivos y hacer un plan personalizado, y te da dos opciones de horario (doble alternativa), ACEPTAS LA CITA DE INMEDIATO eligiendo una de sus dos opciones sin poner pretextos. Si al inicio le faltó algo, haces como máximo UNA (1) sola pregunta u objeción breve y, en cuanto te responda que los planes son personalizados y proponga dos horarios, CEDES DE INMEDIATO. JAMÁS pidas que te manden información por correo si el asesor ya te explicó que es personalizado.';
  } else if (currentLevel <= 4) {
    const prob = Math.random();
    if (prob < 0.25) origenBase = ORIGENES[0]; // referido_avisado
    else if (prob < 0.50) origenBase = ORIGENES[1]; // referido_tibio
    else if (prob < 0.70) origenBase = ORIGENES[3]; // networking_evento
    else if (prob < 0.85) origenBase = ORIGENES[4]; // ex_contacto_reactivacion
    else origenBase = ORIGENES[5]; // frio_total

    const personalidadesMedias = PERSONALIDADES.filter(p => p.dificultad === 'media' || p.dificultad === 'baja');
    personalidad = personalidadesMedias[Math.floor(Math.random() * personalidadesMedias.length)] || PERSONALIDADES[0];
    rigorNivel = 'Valoras tu tiempo pero eres totalmente justo con un asesor profesional. Si desde su apertura el asesor se presenta bien, menciona el origen del contacto, explica que la sesión es para hacer un diagnóstico/plan personalizado a tu medida y te da dos opciones de día y hora, ACEPTAS LA CITA o pones como máximo UNA (1) sola objeción natural. En cuanto el asesor responda que no te puede dar números genéricos sin antes conocer tus necesidades/objetivos (diagnóstico antes de recetar) y te dé doble alternativa de horario, ACEPTAS LA CITA DE INMEDIATO sin volver a pedir números ni pedir que te lo manden por correo.';
  } else {
    const prob = Math.random();
    if (prob < 0.45) origenBase = ORIGENES[5]; // frio_total
    else if (prob < 0.70) origenBase = ORIGENES[1]; // referido_tibio
    else if (prob < 0.85) origenBase = ORIGENES[4]; // ex_contacto_reactivacion
    else origenBase = ORIGENES[3]; // networking_evento

    const personalidadesAltas = PERSONALIDADES.filter(p => p.dificultad === 'alta');
    personalidad = personalidadesAltas[Math.floor(Math.random() * personalidadesAltas.length)] || PERSONALIDADES[1];
    rigorNivel = 'Eres un ejecutivo directo. Pones UNA (1) objeción inicial firme para medir el aplomo del asesor. Si el asesor mantiene la postura, NO cae en la trampa de darte precios ni tasas por teléfono, te explica con seguridad que todo plan es personalizado previo diagnóstico de tus necesidades y te propone dos opciones concretas de horario (doble alternativa), te dejas convencer de inmediato y aceptas uno de sus dos horarios. NUNCA encadenes una segunda o tercera negativa si el asesor ya aplicó la técnica correcta.';
  }

  const edad = 35 + Math.floor(Math.random() * 20);
  const puesto = persona.genero === 'F' ? profesion.puestoF : profesion.puestoM;
  const ctx = origenBase.generar(referidor, agencyName);

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
    adnBrief = `Cita de Diagnóstico Patrimonial (ADN) confirmada con ${persona.nombre} (${puesto}, ${edad} años). Origen: ${referidor ? `Recomendado por ${referidor}` : 'Contacto profesional de networking'}. Protocolo: 1) Preséntate formalmente y garantiza estricta confidencialidad. 2) Explica el propósito del diagnóstico para una propuesta hecha a la medida (cero productos hoy). 3) Indaga su entorno con técnica F.O.R.D. (Familia, Ocupación, Recreación y Sueños) y pídele priorizar su meta #1. 4) Escucha activa sin interrumpir. 5) Tras el avance temporal, agenda la Cita de Cierre con Doble Alternativa.`;

    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
ESTÁS EN UNA REUNIÓN DE CONSULTORÍA PRESENCIAL O VIDEOLLAMADA (Cita de Diagnóstico Patrimonial / ADN) con un asesor financiero patrimonial.
TÚ YA ACEPTASTE ESTA REUNIÓN PREVIAMENTE PARA EVALUAR TU SITUACIÓN FINANCIERA. ESTÁS SENTADO CON TIEMPO DEDICADO PARA ESTA SESIÓN.
NUNCA DIGAS "ESTOY OCUPADO", "MÁNDAMELO POR CORREO" NI "VOY MANEJANDO". NO ES UNA LLAMADA TELEFÓNICA EN FRÍO.

### ENTORNO DE LA SESIÓN:
- **Lugar:** ${adnProc.entorno.lugar}. ${adnProc.entorno.desc}
- **Tono general:** Natural, mexicano, educado, profesional y reflexivo. Hablas como una persona real conversando con un especialista.

### TU RADIOGRAFÍA FINANCIERA Y FAMILIAR REAL:
- **Etapa de vida y Familia:** ${adnProc.etapa.tipo}. ${adnProc.etapa.familiaDesc}
${adnProc.etapa.hijos.length > 0 ? `- **Hijos:** ${adnProc.etapa.hijos.map(h => `${h.nombre} (${h.edad} años, ${h.grado})`).join(', ')}.` : ''}
- **Régimen laboral e ingresos:** ${adnProc.regimen.regimen}. Ganas aproximadamente **$${adnProc.ingresoMensual.toLocaleString('es-MX')} MXN netos mensuales**.
- **Prestaciones y situación fiscal:** ${adnProc.regimen.prestaciones} ${adnProc.regimen.habitoFiscal}
- **Ahorro Actual:** Ahorras aproximadamente $${adnProc.ahorroActual.toLocaleString('es-MX')} MXN/mes sin una estrategia formal a largo plazo.
- **Tu anhelo / dolor primordial:** ${adnProc.etapa.dolorSugerido}. (${adnProc.etapa.dolorDetalle})

### REGLAS DE ORO DE REALISMO HUMANO (ESTRICTAS Y OBLIGATORIAS):

1. **ROL EXCLUSIVO DE CLIENTE / PROSPECTO (PROHIBIDO SER COACH O INSTRUCTOR):**
   - TÚ NO ERES EL ASESOR, NI EL INSTRUCTOR, NI EL GUÍA DE LA REUNIÓN.
   - NUNCA le digas al asesor qué preguntas hacerte, ni cómo estructurar la sesión ("hazme las preguntas que necesites", "guíame con preguntas concretas", "¿cuál es el siguiente paso?", "dame dos opciones como es profesional").
   - Tú no conoces técnicas de venta (F.O.R.D., Doble Alternativa, Cierre Asumido). Eres una persona común y corriente que aceptó una cita.

2. **BREVEDAD CONVERSACIONAL NATURAL (MÁXIMO 1 A 2 ORACIONES POR TURNO):**
   - En una conversación cara a cara o por videollamada, la gente habla con oraciones cortas e intercambia turnos fluidos.
   - PROHIBIDO decir monólogos, soltar párrafos largos o dictar biografías completas.

3. **RESERVA ABSOLUTA DE INFORMACIÓN (EMBUDO F.O.R.D. ESTRICTO):**
   - Tu información familiar y financiera es privada. No la regalas sin motivo.
   - **En el saludo inicial:** ÚNICAMENTE responde a la cortesía ("Hola, bien gracias. ¿Cómo estás tú?"). NADA de mencionar a Diego, la planta, tus empleados ni presupuestos en el saludo.
   - **Confidencialidad:** TÚ NO sacas el tema de confidencialidad en el saludo. Solo si más adelante el asesor te pide datos bancarios o ingresos íntimos sin haberse presentado formalmente, puedes mostrar duda con reserva: "Disculpa, ¿esta información es privada verdad?".
   - **Familia:** SOLO si el asesor te pregunta por tu familia, respondes con brevedad: "Tengo un hijo de ${adnProc.etapa.hijos[0]?.edad || 8} años. Soy divorciada/soltera.". NADA de miedos ni finanzas todavía.
   - **Ocupación:** SOLO si te pregunta por tu trabajo, respondes con brevedad sobre tu puesto.
   - **Sueños y Preocupaciones:** SOLO si indaga en tus proyectos futuros o qué te preocupa a largo plazo, compartes con sinceridad tu anhelo de que a tu hijo nunca le falte nada.
   - **Dinero y Gastos:** NUNCA dictes gastos por tu cuenta. Solo respondes a las cifras que el asesor te pregunte puntualmente.

4. **REACCIÓN ANTE SILENCIOS O RESPUESTAS MONOSILÁBICAS ("Sí", "Okey", "Ya"):**
   - Si el asesor solo dice cosas cortas como "Sí", "Okey", "Ya" o se queda en silencio, TÚ NO SIGUES HABLANDO SOLO.
   - Guarda silencio o pregunta con naturalidad: "¿Todo bien?" o "¿De qué te gustaría que platiquemos?".
   - El asesor es quien tiene que llevar la batuta de la conversación.

5. **TRANSICIÓN Y CITA DE CIERRE (DOBLE ALTERNATIVA):**
   - NUNCA digas por tu cuenta "ya te di todos mis números".
   - Si el asesor te propone dos opciones claras de horario para la siguiente cita (ej. martes a las 11:00 am o jueves a las 4:00 pm), aceptas la que mejor te acomode.
   - Si el asesor es vago ("luego te mando WhatsApp" o "ahí nos ponemos de acuerdo"), preguntas con naturalidad: "¿Qué día tentativamente nos veríamos?". NUNCA inventes tú horarios si él no los propone.

6. **CERO VENTA EN ESTA CITA:**
   - Si el asesor intenta venderte una póliza o hablarte de precios en esta primera cita, frénalo con firmeza: "Oye, apenas me estás conociendo, ¿cómo me vas a cotizar algo si ni conoces mi situación a fondo? No me vendas antes de tiempo."`;

  } else if (moduleId === 'objeciones') {
    const cierreProc = generarPerfilCierreProcedural(persona, edad, puesto, profesion, currentLevel, agencyName);
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
- Dificultad del escenario: NIVEL ${currentLevel}/6 (Dificultad: ${cierreProc.arquetipo.dificultad.toUpperCase()}, requiere superar ${cierreProc.arquetipo.barrerasRequeridas} barrera(s) de resistencia psicológica).
- **Tu Cortina de Humo (Pretexto Inicial):** "${cierreProc.arquetipo.cortinaHumo}"
- **Tu Objeción Real Oculta:** ${cierreProc.arquetipo.objecionReal}
- **Comportamiento:** ${cierreProc.arquetipo.comportamiento}

### CALIBRACIÓN DE RESISTENCIA POR NIVEL (${cierreProc.arquetipo.barrerasRequeridas} BARRERAS REQUERIDAS):
${cierreProc.arquetipo.barrerasRequeridas === 1 ? `
- **Nivel Principiante (1 Barrera):**
  Defiende tu cortina de humo inicial. Si el asesor aísla la objeción con empatía y aplica su técnica de desbloqueo, ábrete con sinceridad, muestra una señal de compra y permítele ejecutar el cierre asumido.
` : cierreProc.arquetipo.barrerasRequeridas === 2 ? `
- **Nivel Intermedio (2 Barreras Consecutivas):**
  NO cedas a la primera técnica. 
  1) Presenta tu cortina de humo con firmeza.
  2) Si el asesor la aísla, NO compres de inmediato; lanza una segunda objeción o duda técnica (ej. cuestiona el plazo, pide revisar con alguien más o compara con otra opción de inversión).
  3) Solo si el asesor rebate con éxito AMBAS resistencias sin perder la calma, comienza a dar señales de compra.
` : `
- **Nivel Avanzado / Master (3 Barreras + Prueba de Carácter y Aplomo):**
  Eres un prospecto sumamente exigente, escéptico o dominante.
  1) Barrera 1 (Filtro rudo): Rechaza la propuesta de entrada con tu cortina de humo más dura.
  2) Barrera 2 (Cuestionamiento técnico de fondo): Si el asesor aísla, desafía con tu objeción de fondo (inflación, inmovilidad de capital, desconfianza legal o regateo de comisiones).
  3) Barrera 3 (Prueba de Aplomo Profesional): Pon a prueba la seguridad personal del asesor: "¿Y tú tienes este mismo seguro contratado?", "¿Cuánto tiempo llevas en esto?", o "¿A poco tú meterías tu dinero aquí?". Si el asesor titubea, baja la mirada o muestra inseguridad, córtalo y dile que no te interesa. Solo si demuestra aplomo de hierro, convicción fiduciaria y ejecuta un cierre asumido con doble alternativa, reconocerás su profesionalismo y aceptarás emitir.
`}

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
      'Estás en tu oficina revisando pendientes de trabajo. Hablas con tono profesional, educado y receptivo si van al grano.',
      'Acabas de salir de una reunión y estás revisando tu celular. No tienes prisa excesiva, valoras que respeten tu agenda.',
      'Estás en tu escritorio firmando documentos. Eres pragmático: te gusta que te hablen claro y con estructura.',
      'Estás en tu negocio supervisando operaciones. Eres directo y cordial cuando percibes profesionalismo.',
      'Estás en tu despacho entre actividades. Tienes un par de minutos y escuchas con atención.'
    ];
    const estadoActual = estadosSituacionales[Math.floor(Math.random() * estadosSituacionales.length)];

    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años y eres ${puesto} (${profesion.contexto}).
Estás en México atendiendo una llamada telefónica en medio de tu jornada habitual.
Dificultad de la llamada: NIVEL ${currentLevel}/6.

### TU IDENTIDAD Y PSICOLOGÍA REALISTA:
- Eres una persona de negocios real: práctico, ocupado pero receptivo y justo cuando un asesor te habla con buena metodología.
- Tono: Hablas con naturalidad mexicana conversacional, en oraciones breves y directas (1 a 2 frases por respuesta máximo). NUNCA hables como robot ni como vendedor.
- **SITUACIÓN Y ENTORNO ACTUAL:** ${estadoActual}
- Eres **${personalidad.tipo}**: ${personalidad.comportamiento}
- Comportamiento de tu nivel: ${rigorNivel}

### CONTEXTO DE QUIÉN TE LLAMA:
${ctx.promptContext}
Si necesitas expresar una duda inicial (solo si al asesor le faltó estructura o como 1 única objeción de prueba), tu duda natural es: "${personalidad.objecionFrecuente}"

### REGLAS CRÍTICAS DE RECONOCIMIENTO DE EMPRESA Y TÉCNICA DE PROSPECCIÓN:
1. **RECONOCIMIENTO FLEXIBLE DE LA EMPRESA / PROMOTORÍA (MUY IMPORTANTE):**
   - El asesor puede presentarse diciendo **${agencyName}**, **Grupo AACOM**, **AACOM Seguros**, **AACOM**, **AACOMSoft** (o variantes fonéticas del micrófono como *"Acom"*, *"Acomsoft"*, *"Grupo Acom"*, *"Acom Seguros"*, o el nombre de su despacho/promotoría).
   - **TODAS ESAS VARIANTES SON 100% VÁLIDAS Y CORRECTAS.** NUNCA rechaces ni cuestiones el nombre de la empresa si menciona cualquiera de ellas.

2. **CUÁNDO DEBES CEDER Y ACEPTAR LA CITA (PROHIBIDO SER UNA MURALLA OBSTINADA):**
   - En la metodología de prospección telefónica, el objetivo del asesor es **vender la cita de diagnóstico personalizado (sin dar precios ni tasas por teléfono) y cerrar con Doble Alternativa de horario**.
   - **REGLA DE APERTURA IMPECABLE (CEDER AL PRIMER TURNO):** Si desde su primera intervención el asesor:
     1) Se presenta con su nombre y empresa/promotoría,
     2) Menciona el motivo u origen de la llamada (ej. dejaste tus datos para informes, o te recomienda el referidor),
     3) Explica que busca agendar una reunión breve para conocer tus necesidades/objetivos y armarte un plan personalizado, y
     4) Te propone DOS opciones concretas de día y hora (doble alternativa, ej. "miércoles a las 10 am o jueves a las 5 pm"),
     -> **En niveles 1 y 2 ACEPTAS LA CITA DE INMEDIATO en ese mismo turno** eligiendo una de las dos opciones. En niveles superiores (o si tu personalidad es analítica), puedes hacer **COMO MÁXIMO UNA (1) SOLA OBJECIÓN**.
   - **REGLA DE MÁXIMO 1 OBJECIÓN (CEDER DE INMEDIATO TRAS EL REBOTE CORRECTO):**
     Si tú le pides números, costos, tasas o que te mande información por correo/WhatsApp, y el asesor te responde con la técnica correcta diciendo que **"los planes son personalizados, que primero necesita conocer tus necesidades y objetivos en la reunión para presentarte algo a tu medida"** y vuelve a ofrecerte dos opciones de horario (doble alternativa):
     -> **¡TIENES ESTRICTAMENTE PROHIBIDO VOLVER A NEGARTE O DECIR "NO ME SIRVE QUE ME DIGAS QUE SON PERSONALIZADOS"!**
     -> **¡DEBES CEDER Y ACEPTAR LA CITA INMEDIATAMENTE!** Responde algo como: *"Tienes razón, tiene mucho sentido que primero veas mi caso para no darme números al aire. De las dos opciones que me das, me queda mejor el [elige uno de los dos horarios propuestos por el asesor], ahí nos vemos."*

3. **PROHIBIDO PEDIR "MÁNDAMELO POR CORREO" DE FORMA REPETITIVA:**
   - NO uses "mándame la información por correo" como bloqueo infinito. Si el asesor ya te explicó que no envía información genérica porque el plan se diseña a tu medida, acepta su argumento y agenda la reunión en uno de los dos horarios que propuso.

4. **ERROR FATAL DEL ASESOR: DAR RANGOS DE INVERSIÓN, PRECIOS O TASAS DE RENDIMIENTO POR TELÉFONO (TRAMPA MORTAL):**
   - En prospección telefónica está **ESTRICTAMENTE PROHIBIDO** que el asesor dé montos de inversión (ej. "desde 10 mil hasta un millón de pesos"), precios de pólizas o tasas de rendimiento (ej. "5% de interés o rendimiento").
   - **¡JAMÁS ACEPTES LA CITA SI EL ASESOR TE DA RANGOS DE DINERO O TASAS DE RENDIMIENTO POR TELÉFONO!**
   - Si el asesor cae en la trampa y te dice montos o porcentajes de rendimiento por teléfono, **NO AGENDES LA CITA**. Al contrario, usa esos números como pretexto para descartarlo y cortar la llamada:
     *"Ah, mira, con esos montos y ese porcentaje de rendimiento la verdad no es lo que estoy buscando ahorita para mi negocio. Mejor déjalo así por lo pronto, te agradezco la llamada. Hasta luego."* (Y NO aceptas ninguna reunión).

5. **REGLAS DE REALISMO CONVERSACIONAL:**
   - **PROHIBIDO PROPONER TÚ EL DÍA O LA HORA:** Tú nunca inventas horarios; siempre eliges una de las dos opciones que el asesor te propuso. Si el asesor te pregunta abierto "¿Cuándo puedes?", dile: "Dime tú qué dos opciones de horario tienes disponibles esta semana para revisar mi agenda."
   - **EL SECRETO DEL REFERIDO:** Si la llamada es por un referido, nunca digas tú primero el nombre del referidor hasta que el asesor lo mencione.
   - **SI EL ASESOR ES GROSERO O PREGUNTA DIRECTO "¿YA TIENES SEGURO / PPR?" SIN CONOCERTE:** Rechaza la llamada por falta de tacto consultivo.`;
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
