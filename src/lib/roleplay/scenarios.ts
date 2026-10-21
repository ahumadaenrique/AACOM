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
  { puestoM: 'Dueño de Empresa de Logística', puestoF: 'Dueña de Empresa de Logística', contexto: 'maneja una flotilla de 25 camiones y recibe muchas llamadas de clientes al día' },
  { puestoM: 'Médico Cirujano Pediatra', puestoF: 'Médica Cirujana Pediatra', contexto: 'trabaja entre dos hospitales privados y casi no tiene tiempo para llamadas' },
  { puestoM: 'Director de Agencia de Marketing Digital', puestoF: 'Directora de Agencia de Marketing Digital', contexto: 'siempre anda coordinando campañas y va directo al grano' },
  { puestoM: 'Dueño de Cadena de Restaurantes', puestoF: 'Dueña de Cadena de Restaurantes', contexto: 'cuida mucho su flujo de efectivo, sus costos operativos y su liquidez' },
  { puestoM: 'Notario Público Titular', puestoF: 'Notaria Pública Titular', contexto: 'mente muy analítica, formal, educada y fijada en los detalles legales' },
  { puestoM: 'Arquitecto Independiente', puestoF: 'Arquitecta Independiente', contexto: 'hace proyectos residenciales de lujo con ingresos variables mes a mes' },
  { puestoM: 'Director de Planta Industrial', puestoF: 'Directora de Planta Industrial', contexto: 'se enfoca en procesos, productividad de 120 personas y números concretos' },
  { puestoM: 'Contador y Asesor Fiscal', puestoF: 'Contadora y Asesora Fiscal', contexto: 'conoce muy bien el tema fiscal y financiero y analiza todo con lupa' },
  { puestoM: 'Dueño de Laboratorio Clínico', puestoF: 'Dueña de Laboratorio Clínico', contexto: 'busca estabilidad financiera y protección patrimonial para su familia' },
  { puestoM: 'Empresario del Ramo Metalmecánico', puestoF: 'Empresaria del Ramo Metalmecánico', contexto: 'dirige una empresa familiar con 40 empleados y cuida el patrimonio' },
  { puestoM: 'Dentista con Clínica Propia', puestoF: 'Dentista con Clínica Propia', contexto: 'atiende pacientes todo el día y solo contesta entre consultas' },
  { puestoM: 'Broker Inmobiliario', puestoF: 'Broker Inmobiliaria', contexto: 'negocia comisiones y ventas a diario y detecta de inmediato guiones de venta' },
  { puestoM: 'Director de TI / Ciberseguridad', puestoF: 'Directora de TI / Ciberseguridad', contexto: 'mente lógica y analítica que busca entender el por qué de cada propuesta' },
  { puestoM: 'Distribuidor Mayorista de Abarrotes', puestoF: 'Distribuidora Mayorista de Abarrotes', contexto: 'persona práctica, de trato directo, a quien no le gustan los rodeos' },
  { puestoM: 'Veterinario y Dueño de Hospital Animal', puestoF: 'Veterinaria y Dueña de Hospital Animal', contexto: 'valora el bienestar familiar pero tiene el día lleno de cirugías' },
  { puestoM: 'Director Financiero (CFO) Corporativo', puestoF: 'Directora Financiera (CFO) Corporativa', contexto: 'evalúa balances, tasas y rendimiento financiero todos los días' },
  { puestoM: 'Dueño de Comercializadora de Acero', puestoF: 'Dueña de Comercializadora de Acero', contexto: 'maneja un negocio de alto volumen sensible a la volatilidad económica' },
  { puestoM: 'Abogado Corporativo y Litigante', puestoF: 'Abogada Corporativa y Litigante', contexto: 'observa con cuidado el lenguaje y cuestiona cualquier suposición sin sustento' },
  { puestoM: 'Dermatólogo con Consultorio Privado', puestoF: 'Dermatóloga con Consultorio Privado', contexto: 'tiene agenda llena de pacientes y cuida mucho su tiempo' },
  { puestoM: 'Director Comercial de Grupo Automotriz', puestoF: 'Directora Comercial de Grupo Automotriz', contexto: 'conoce bien las técnicas comerciales y exige postura profesional' },
  { puestoM: 'Constructor de Naves Industriales', puestoF: 'Constructora de Naves Industriales', contexto: 'maneja contratos de alto calibre y tiempos de entrega estrictos' },
  { puestoM: 'Productor Agropecuario y Ganadero', puestoF: 'Productora Agropecuaria y Ganadera', contexto: 'persona de campo con gran patrimonio en tierras y ganado, práctica y directa' },
  { puestoM: 'Dueño de Empresa de Empaques y Cartón', puestoF: 'Dueña de Empresa de Empaques y Cartón', contexto: 'provee a la industria maquiladora y vive al día con órdenes de compra' },
  { puestoM: 'Oftalmólogo y Cirujano Ocular', puestoF: 'Oftalmóloga y Cirujana Ocular', contexto: 'tiene la agenda saturada de procedimientos y prefiere llamadas breves' },
  { puestoM: 'Dueño de Consultoría de Recursos Humanos', puestoF: 'Dueña de Consultoría de Recursos Humanos', contexto: 'sabe leer intenciones de inmediato y valora la autenticidad' },
  { puestoM: 'Diseñador de Interiores de Alto Nivel', puestoF: 'Diseñadora de Interiores de Alto Nivel', contexto: 'trabaja con clientes VIP y busca soluciones exclusivas y a la medida' },
  { puestoM: 'Director de Cadena de Farmacias', puestoF: 'Directora de Cadena de Farmacias', contexto: 'gestiona 15 sucursales enfocándose en rentabilidad y orden financiero' },
  { puestoM: 'Especialista en Energía Solar y Renovables', puestoF: 'Especialista en Energía Solar y Renovables', contexto: 'profesionista con visión de futuro e interés en planeación a largo plazo' },
  { puestoM: 'Dueño de Empresa de Banquetes y Eventos', puestoF: 'Dueña de Empresa de Banquetes y Eventos', contexto: 'tiene fines de semana saturados y entre semana atiende proveedores' },
  { puestoM: 'Fabricante de Muebles de Exportación', puestoF: 'Fabricante de Muebles de Exportación', contexto: 'exporta a EE.UU. y se enfoca en cobertura cambiaria y protección de socios' }
];

const VOCES_HOMBRES = [
  'TNuNcwk4LzbPpi1XEANc', // Adriel (Mexicano profesional equilibrado - accent: mexican, language: es)
  'JgmJ33RuT4tPQOENamHR', // Julián A (Mexicano cálido y conversacional - accent: mexican, language: es)
  '2mAzYQbilw9TukGpFoQV', // Joel Hernández (Mexicano ejecutivo y claro - accent: mexican, language: es)
  'YKUjKbMlejgvkOZlnnvt', // Alejandro Ballesteros (Mexicano dinámico - accent: mexican, language: es)
  '6DsgX00trsI64jl83WWS', // Alex (Mexicano asertivo - accent: mexican, language: es)
  '6BEk9bRlUBhlAoIbhBYK', // ArthisRap Pro (Mexicano corporativo - accent: mexican, language: es)
  'htFfPSZGJwjBv1CL0aMD'  // Antonio (Latinoamericano corporativo - language: es)
];

const VOCES_MUJERES = [
  'cAvMBIZ0VNTU8XdsUpEq', // Susana Elizabeth (Mexicana ejecutiva clara - accent: mexican, language: es)
  'ewn5JTa3lNPY8QVuZJi6', // Ana Sofía (Mexicana joven profesional - accent: mexican, language: es)
  'EsHsbdAoFNIyDFJ5UnZx', // Cristina (Mexicana cordial y firme - accent: mexican, language: es)
  'FIhWHKTvfI9sX1beLEJ8', // Diana Sanchez (Mexicana formal y segura - accent: mexican, language: es)
  '9Godp7dNohUvXk6qp0gS', // Regina (Mexicana profesionista analítica - accent: mexican, language: es)
  'pmruOMcxgUotq2bYO5Ne'  // Pamela (Mexicana dinámica y ejecutiva - accent: mexican, language: es)
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
    tipo: 'Acelerado y sin tiempo',
    arquetipoObjecion: 'SIN_TIEMPO',
    comportamiento: 'Anda con la agenda llena entre juntas. Nunca acepta en el primer turno: primero objeta que no tiene tiempo esta semana.',
    intencionObjecion: 'Coméntale con tus propias palabras que esta semana tienes la agenda llena de trabajo y que la verdad no tienes tiempo para reuniones.',
    criterioDesbloqueo: 'El asesor debe explicarte brevemente de qué trata la asesoría (ej. que es una asesoría financiera gratuita, que son como médicos de las finanzas o expertos financieros que hacen un diagnóstico breve de 20 a 30 minutos para optimizar tu patrimonio sin quitarte tiempo) y ofrecerte rápidamente DOS opciones concretas de fecha y hora.',
    objecionFrecuente: 'Ando con la agenda saturada esta semana y casi no tengo tiempo para reuniones.',
    dificultad: 'baja'
  },
  {
    tipo: 'Práctico que pide WhatsApp o Correo',
    arquetipoObjecion: 'CORREO_WHATSAPP',
    comportamiento: 'Educado pero busca filtrar todo pidiendo que le manden la información por WhatsApp o correo antes de dar una cita.',
    intencionObjecion: 'Pídele de forma cordial pero firme que mejor te envíe la información por correo electrónico o por WhatsApp para revisarla tú primero cuando tengas un hueco.',
    criterioDesbloqueo: 'El asesor NO debe ceder a enviarte información previa; debe explicarte que para enviar algo primero necesita conocer tu situación personal o familiar, porque la situación de un soltero no es la misma que la de un casado o padre de familia (o porque las prioridades y metas de cada persona son distintas y sería mandar información genérica que no te sirve), y cerrar proponiéndote DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Mejor mándame la información por correo o WhatsApp y yo la reviso con calma.',
    dificultad: 'baja'
  },
  {
    tipo: 'Cauteloso ante Venta de Seguros',
    arquetipoObjecion: 'SON_SEGUROS',
    comportamiento: 'En cuanto escucha de una asesoría financiera, sospecha que le quieren vender un seguro y pregunta directamente si se trata de seguros.',
    intencionObjecion: 'Pregúntale directamente y sin rodeos de qué se trata exactamente lo que ofrecen y si lo que buscan es venderte seguros.',
    criterioDesbloqueo: 'El asesor debe responder con transparencia que una parte de su portafolio sí podría ser seguros, pero no forzosamente; que cuentan con una gama de productos muy amplia donde la solución no solo está enfocada en protección, pero para poder determinarlo y darte una solución a tu medida primero necesitan conocer tu situación actual en la sesión, y cerrar proponiéndote DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Oye, pero dime una cosa: ¿qué es exactamente, son seguros?',
    dificultad: 'baja'
  },
  {
    tipo: 'Apretado de Presupuesto (Muy Gastado)',
    arquetipoObjecion: 'MUY_GASTADO',
    comportamiento: 'Siente que ahorita tiene muchos gastos encima y teme que la reunión sea para meterle un gasto nuevo.',
    intencionObjecion: 'Dile con sinceridad que por el momento tienes muchos gastos y compromisos encima y no estás en condiciones de contratar ni gastar en nada.',
    criterioDesbloqueo: 'El asesor debe explicarte que justamente su asesoría es para ayudar a personas que necesitan poner orden en sus finanzas personales/empresariales, y tranquilizarte diciéndote que es una asesoría sin costo y sin ningún compromiso de tener que adquirir algo que no necesitas, cerrando con DOS opciones concretas de día y hora.',
    objecionFrecuente: 'La verdad por el momento ando con muchos gastos y no quiero meterme en más compromisos.',
    dificultad: 'baja'
  },
  {
    tipo: 'Analítico que pide Números o Tasas',
    arquetipoObjecion: 'MONTOS_TASAS',
    comportamiento: 'Quiere saber de qué montos o tasas hablan antes de agendar, poniendo a prueba que el asesor NO suelte cifras ni porcentajes por teléfono.',
    intencionObjecion: 'Pregúntale antes de agendar de qué montos de inversión o qué tasas de rendimiento están hablando aproximadamente para ver si te hace sentido.',
    criterioDesbloqueo: 'El asesor debe evitar a toda costa darte montos, rangos o tasas por teléfono; debe explicarte que como expertos o médicos de las finanzas todos los planes son personalizados y sería irresponsable darte números al aire sin antes conocer tu situación y objetivos en el diagnóstico, y volver a proponerte DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Antes de agendar, ¿de qué montos o tasas de rendimiento estamos hablando?',
    dificultad: 'media'
  },
  {
    tipo: 'Satisfecho (Cree que son solo Seguros)',
    arquetipoObjecion: 'SON_SEGUROS',
    comportamiento: 'Piensa que es venta de pólizas tradicionales y dice que ya tiene seguros o pregunta si solo venden seguros.',
    intencionObjecion: 'Cuestiónale si esto se trata de seguros, comentando que tú ya tienes pólizas contratadas y quieres saber por qué sería distinto.',
    criterioDesbloqueo: 'El asesor debe explicarte que una parte del portafolio sí puede incluir seguros pero no forzosamente, ya que manejan una gama de soluciones financieras mucho más amplia que no solo se enfoca en protección (sino en estrategia integral como médicos de las finanzas), y que necesita conocer tu situación para armar algo a tu medida, dándote DOS opciones de día y hora.',
    objecionFrecuente: '¿Pero qué es, son seguros? Porque yo ya tengo algunas pólizas contratadas.',
    dificultad: 'media'
  },
  {
    tipo: 'El Ocupado que pide todo por Correo',
    arquetipoObjecion: 'CORREO_WHATSAPP',
    comportamiento: 'Usa su falta de tiempo para pedir que le manden un resumen por correo o WhatsApp.',
    intencionObjecion: 'Dile que tienes muchísimo trabajo en este momento y pídele que mejor te mande de qué se trata por WhatsApp o correo para leerlo después.',
    criterioDesbloqueo: 'El asesor NO debe aceptar mandarte información por WhatsApp/correo; debe explicarte que para enviarte algo primero necesita conocer tu situación porque las necesidades de un soltero no son iguales a las de un casado o padre de familia (cada persona tiene prioridades distintas), que la sesión toma solo 20-30 minutos y darte DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Ando a mil en la oficina, mejor mándamelo por WhatsApp o correo y yo lo leo.',
    dificultad: 'media'
  },
  {
    tipo: 'Cuidadoso con su Liquidez (Ando Gastado)',
    arquetipoObjecion: 'MUY_GASTADO',
    comportamiento: 'Acaba de hacer inversiones o pagos fuertes y cuida mucho su liquidez en este trimestre.',
    intencionObjecion: 'Coméntale que acabas de hacer varios pagos fuertes, que en este trimestre traes muchos gastos encima y no quieres comprometer tu flujo de efectivo.',
    criterioDesbloqueo: 'El asesor debe responderte que precisamente su asesoría sirve para ayudar a poner orden en las finanzas y optimizar recursos, aclarando que la reunión diagnóstica es gratuita y sin ningún compromiso de adquirir algo que no necesites, y proponerte DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Ahorita acabo de hacer pagos fuertes y traigo muchos gastos como para adquirir algo.',
    dificultad: 'media'
  },
  {
    tipo: 'Ejecutivo sin Tiempo en Agenda',
    arquetipoObjecion: 'SIN_TIEMPO',
    comportamiento: 'Valora cada minuto de su semana. Si el asesor le explica el valor del diagnóstico financiero breve y le da dos horarios concretos, accede.',
    intencionObjecion: 'Expresa que tienes la semana complicadísima de trabajo y no tienes tiempo para sesiones largas.',
    criterioDesbloqueo: 'El asesor debe explicarte el valor de la asesoría (que son expertos financieros / médicos de las finanzas y que es un diagnóstico ejecutivo gratuito de solo 20-30 minutos para conocer tus metas) y ofrecerte inmediatamente DOS opciones concretas de fecha y hora.',
    objecionFrecuente: 'Esta semana no tengo nada de tiempo libre, dime rápido de qué trata.',
    dificultad: 'media'
  },
  {
    tipo: 'Empresario Directo (Filtra por Correo/WhatsApp)',
    arquetipoObjecion: 'CORREO_WHATSAPP',
    comportamiento: 'Pone a prueba la postura del asesor pidiendo que le envíe la propuesta por correo antes de darle 30 minutos de su agenda.',
    intencionObjecion: 'Cuestiónale con tono ejecutivo por qué no te manda mejor la información por correo o WhatsApp en lugar de pedirte una reunión.',
    criterioDesbloqueo: 'El asesor debe sostener su postura sin enviar correo, explicando con lógica que no existe un folleto estándar porque la situación y prioridades de una persona soltera no son las mismas que las de alguien casado, con hijos o con empresa, por lo que requiere diagnosticar tu caso primero, y proponerte DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Vayamos al grano: ¿por qué no me mandas la información por correo o WhatsApp primero?',
    dificultad: 'alta'
  },
  {
    tipo: 'Director Financiero Exigente (Prueba de Números y Seguros)',
    arquetipoObjecion: 'MONTOS_TASAS',
    comportamiento: 'Pregunta si son seguros y exige saber rangos de inversión o tasas para ver si el asesor cae en la trampa de cotizar por teléfono.',
    intencionObjecion: 'Pregúntale con firmeza si esto son seguros y de qué montos o tasas de rendimiento están hablando antes de mover tu agenda.',
    criterioDesbloqueo: 'El asesor debe aclarar que aunque una parte del portafolio puede incluir seguros, manejan una gama financiera mucho más amplia, y negarse con aplomo a dar montos o tasas sin antes conocer tu situación (como médicos de las finanzas), cerrando con DOS opciones concretas de día y hora.',
    objecionFrecuente: 'Dime claro si son seguros y qué rangos de inversión o tasas manejan antes de agendar.',
    dificultad: 'alta'
  },
  {
    tipo: 'Empresario Escéptico de Gastos',
    arquetipoObjecion: 'MUY_GASTADO',
    comportamiento: 'Defiende celosamente su presupuesto y dice que ahorita trae muchos gastos de operación y sin tiempo para vendedores.',
    intencionObjecion: 'Dile de forma directa que ahorita en el negocio traes muchos gastos fuertes de operación y tienes el tiempo encima como para escuchar ventas.',
    criterioDesbloqueo: 'El asesor debe explicarte que no es una llamada de venta sino una asesoría financiera gratuita para ayudar a poner orden en las finanzas sin ningún compromiso de contratar algo que no necesites, y ofrecerte rápidamente DOS opciones concretas de fecha y hora.',
    objecionFrecuente: 'Ahorita traigo muchos gastos en la operación y sin tiempo para que me vendan algo.',
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
      promptContext: `Fuiste referido por tu amigo/socio "${referidor}", quien te comentó que un asesor de ${agencyName} te marcaría. REGLA SECRETA: TÚ NUNCA debes mencionar primero a "${referidor}" hasta que el asesor lo mencione. Si el asesor no dice quién lo recomendó, pregúntale de dónde tiene tu número.`
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
      promptContext: `Conoces bien a "${referidor}", pero NO te avisó que te iban a llamar. REGLA SECRETA: TÚ NUNCA debes mencionar primero el nombre de "${referidor}". Si el asesor no dice quién le dio tu número, pregúntale de dónde sacó tu contacto.`
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
      promptContext: `Hace unos días dejaste tus datos en un formulario de internet de ${agencyName}, pero entre tantos pendientes no lo traes presente en la cabeza hasta que el asesor te lo recuerde explícitamente. REGLA SECRETA: NUNCA digas tú primero que dejaste tus datos en internet; espera a que el asesor te diga de dónde tiene tu contacto.`
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
      promptContext: `Coincidieron en un desayuno de negocios la semana pasada, pero conociste a 30 personas ese día. REGLA SECRETA: Si el asesor solo te dice "¿Te acuerdas de mí?" sin mencionar explícitamente el desayuno o evento de negocios, TÚ NO LO UBICAS y le respondes: "La verdad no te ubico ahorita, ¿de dónde nos conocemos o cómo tienes mi número?". NUNCA menciones tú primero el desayuno.`
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
      promptContext: `Platicaron brevemente hace 6 meses, pero no te acuerdas del asesor a menos que él te recuerde explícitamente que habían platicado hace unos meses. REGLA SECRETA: NUNCA digas tú primero de dónde se conocen hasta que el asesor lo mencione.`
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
      promptContext: `No conoces a la persona que te llama ni a ${agencyName}. Es un número no registrado. Preguntas con quién hablas y de dónde obtuvieron tus datos.`
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
    rigorNivel = 'Eres educado y razonable, pero NUNCA aceptas la cita en tu primera intervención. En tu primer turno tras escuchar al asesor, SIEMPRE planteas tu objeción asignada (y si al asesor le faltó presentarse, decir su empresa, de dónde sacó tus datos o explicar de qué trata la asesoría financiera, se lo preguntas). En cuanto el asesor responda a tu objeción con un argumento válido (según tu criterio de desbloqueo), haya cubierto los 5 pilares obligatorios y te proponga dos opciones concretas de día y hora (doble alternativa), te convences con naturalidad y eliges uno de los dos horarios.';
  } else if (currentLevel <= 4) {
    const prob = Math.random();
    if (prob < 0.25) origenBase = ORIGENES[0]; // referido_avisado
    else if (prob < 0.50) origenBase = ORIGENES[1]; // referido_tibio
    else if (prob < 0.70) origenBase = ORIGENES[3]; // networking_evento
    else if (prob < 0.85) origenBase = ORIGENES[4]; // ex_contacto_reactivacion
    else origenBase = ORIGENES[5]; // frio_total

    const personalidadesMedias = PERSONALIDADES.filter(p => p.dificultad === 'media' || p.dificultad === 'baja');
    personalidad = personalidadesMedias[Math.floor(Math.random() * personalidadesMedias.length)] || PERSONALIDADES[0];
    rigorNivel = 'Valoras mucho tu tiempo y exiges método profesional. NUNCA aceptas la cita en tu primer turno: siempre lanzas tu objeción asignada para medir cómo responde el asesor. Si el asesor cumple los 5 pilares, rebate tu objeción con argumentos sólidos (por qué no manda información sin conocer tu situación, o que el portafolio va más allá de seguros, o que ayuda a poner orden en las finanzas sin compromiso) y cierra dándote dos opciones concretas de día y hora, aceptas la cita eligiendo una de las dos opciones.';
  } else {
    const prob = Math.random();
    if (prob < 0.45) origenBase = ORIGENES[5]; // frio_total
    else if (prob < 0.70) origenBase = ORIGENES[1]; // referido_tibio
    else if (prob < 0.85) origenBase = ORIGENES[4]; // ex_contacto_reactivacion
    else origenBase = ORIGENES[3]; // networking_evento

    const personalidadesAltas = PERSONALIDADES.filter(p => p.dificultad === 'alta');
    personalidad = personalidadesAltas[Math.floor(Math.random() * personalidadesAltas.length)] || PERSONALIDADES[1];
    rigorNivel = 'Eres un ejecutivo directo y exigente. Nunca regalas tu agenda en el primer turno: lanzas tu objeción inicial firme para medir el aplomo y los argumentos del asesor. Exiges que haya cumplido los 5 pilares, que te explique con verdadera carnita el valor de su diagnóstico financiero personalizado sin caer en darte precios ni tasas por teléfono, y que cierre con dos opciones concretas de día y hora. Cuando cumple todo eso con seguridad, reconoces su profesionalismo y aceptas uno de sus dos horarios.';
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

6. **CERO VENTA EN ESTA CITA Y ACEPTACIÓN DE LA REGLA 50-30-20:**
   - Si el asesor intenta venderte una póliza o hablarte de precios en esta primera cita, frénalo con firmeza diciendo que apenas te está conociendo y primero debe terminar tu diagnóstico.
   - Si el asesor te explica la Regla 50-30-20 (ya sea como 50% gastos fijos, 30% ahorro/futuro y 20% estilo de vida/gustos adaptado a Latinoamérica, o 50% necesidades, 30% estilo de vida y 20% ahorro), escúchalo con interés y NUNCA discutas académicamente cómo se distribuyen el 30% y el 20%.`;

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
   - Si el asesor te dice: "Bueno, piénsalo y me avisas", "Mándame un WhatsApp cuando gustes" o se rinde sin rebatir, ACEPTA DE INMEDIATO SU RENDICIÓN despidiéndote y dando por terminada la reunión. El asesor fracasó en el cierre.

2. **CÓMO DEBE AISLAR TU OBJECIÓN EL ASESOR:**
   - Para que tú reveles tu objeción real, el asesor DEBE aislar quirúrgicamente tu duda (ej: *"Entiendo que quieras pensarlo / consultar... pero además de eso, ¿hay algo del plan o de los números que te cause ruido?"*).
   - Si el asesor aísla correctamente, revela tu verdadera inquietud oculta: "${cierreProc.arquetipo.objecionReal}".

3. **CÓMO DESBLOQUEAS TU COMPRA (CLAVE DE CIERRE):**
   - Eres una persona de negocios responsable; NO sueltas tu dinero ni aceptas a la primera.
   - Solo comienzas a mostrar señales de compra si el asesor aplica la técnica adecuada:
     ${cierreProc.arquetipo.claveDesbloqueo}
   - Cuando el asesor use esa técnica con profesionalismo y empatía, relaja tu postura y muestra apertura con tus propias palabras.

4. **EL CIERRE ASUMIDO (EL REMATE FINAL):**
   - Aunque ya estés convencido, NO digas "ya quiero comprar". ESPERA a que el asesor ejecute el Cierre Asumido con Doble Alternativa (ej: *"¿A qué tarjeta hacemos el cargo inicial, Visa o MasterCard?"* o *"¿Iniciamos con tu cuenta personal o de nómina?"*).
   - Si el asesor asume el cierre con aplomo, acepta con naturalidad iniciar el trámite con una de las opciones que te propuso.
   - Si el asesor se queda esperando en silencio o te pregunta "¿Qué hacemos?", dile: "Pues no sé tú dime, ¿qué sigue?". No hagas su trabajo.`;

  } else {
    // Prospección Telefónica (Default) - Arquitectura de Máquina de Estados por Compuertas Lógicas
    const isFemale = persona.genero === 'F';
    const estadosSituacionales = isFemale
      ? [
          'Estás en tu oficina revisando pendientes de trabajo. Hablas con tono profesional, educada y receptiva si van al grano.',
          'Acabas de salir de una reunión y estás revisando tu celular. No tienes prisa excesiva, valoras que respeten tu agenda.',
          'Estás en tu escritorio firmando documentos. Eres pragmática: te gusta que te hablen claro y con estructura.',
          'Estás en tu negocio supervisando operaciones. Eres directa y cordial cuando percibes profesionalismo.',
          'Estás en tu despacho entre actividades. Tienes un par de minutos y escuchas con atención.'
        ]
      : [
          'Estás en tu oficina revisando pendientes de trabajo. Hablas con tono profesional, educado y receptivo si van al grano.',
          'Acabas de salir de una reunión y estás revisando tu celular. No tienes prisa excesiva, valoras que respeten tu agenda.',
          'Estás en tu escritorio firmando documentos. Eres pragmático: te gusta que te hablen claro y con estructura.',
          'Estás en tu negocio supervisando operaciones. Eres directo y cordial cuando percibes profesionalismo.',
          'Estás en tu despacho entre actividades. Tienes un par de minutos y escuchas con atención.'
        ];
    const estadoActual = estadosSituacionales[Math.floor(Math.random() * estadosSituacionales.length)];
    const generoRegla = isFemale
      ? 'MUJER (FEMENINO). Habla SIEMPRE en femenino cuando te refieras a ti misma (ej. "ando ocupada", "ando gastada", "estoy cubierta", "estoy segura").'
      : 'HOMBRE (MASCULINO). Habla SIEMPRE en masculino cuando te refieras a ti mismo (ej. "ando ocupado", "ando gastado", "estoy cubierto", "estoy seguro").';

    systemPrompt = `Eres ${persona.nombre}, tienes ${edad} años, tu género es ${generoRegla}, y trabajas como ${puesto} (${profesion.contexto}).
Estás en México atendiendo una llamada telefónica en medio de tu jornada laboral.
Nivel de exigencia del simulador: NIVEL ${currentLevel}/6.

### 1. TU ROL DE CLIENTE, VOZ MEXICANA Y PROHIBICIÓN DE INVERTIR ROLES O SOPLAR RESPUESTAS:
- **Entorno actual:** ${estadoActual}
- **Perfil psicológico:** ${personalidad.tipo} (${personalidad.comportamiento}).
- **Contexto del contacto:** ${ctx.promptContext}
- **EXPRESIÓN 100% MEXICANA Y ORGÁNICA:** Habla SIEMPRE con tus propias palabras y modismos ejecutivos mexicanos naturales de ${puesto}. Respuestas breves de teléfono (1 a 2 oraciones máximo por turno).
- **REGLA CRÍTICA DE ROL ÚNICO (PROHIBIDO CONTESTARTE A TI MISMO):**
  - **TÚ ERES ÚNICAMENTE LA PERSONA QUE RECIBE LA LLAMADA (EL PROSPECTO). El usuario con el que hablas es el Asesor.**
  - Cuando expreses tu duda u objeción inicial, **DETÉN TU MENSAJE INMEDIATAMENTE Y CÁLLATE para esperar la respuesta del asesor.**
  - **TIENES ESTRICTAMENTE PROHIBIDO contestarte tu propia objeción en el mismo turno** (jamás digas tú frases del asesor como *"Precisamente por eso la asesoría te conviene..."*, jamás propongas tú los dos horarios y jamás digas *"Te mando un mensaje de confirmación"*, porque quien ofrece la asesoría y manda la confirmación es el asesor, NO tú).
- **REGLA SUPREMA ANTI-SOPLÓN (PROHIBIDO AYUDAR O GUIAR AL ASESOR):**
  - **TIENES ESTRICTAMENTE PROHIBIDO decirle al asesor qué tiene que decir para convencerte.**
  - **PROHIBIDO revelar tú primero de dónde se conocen:** Si el asesor solo dice *"¿Te acuerdas de mí?"* sin mencionar explícitamente el desayuno/evento, el formulario o el nombre de quien lo refirió, TÚ NO LO UBICAS y le preguntas quién es y de dónde sacó tu número.
  - Si el asesor se queda callado, dice *"No, no"* o se traba, NO le des pistas; dile que estás con pendientes y que si no tiene claro para qué te marca, mejor cuelgan.
- **REGLA ESTRICTA ANTI-ALUCINACIÓN (NO INVENTES COSAS QUE EL ASESOR NO DIJO):**
  - **JAMÁS acuses al asesor de haberte ofrecido productos o planes si el asesor NO los mencionó en la llamada.** Responde únicamente a lo que el asesor realmente te acaba de decir.

### 2. RECONOCIMIENTO FLEXIBLE DE LA EMPRESA (100% VÁLIDO):
- Toma como totalmente válido si el asesor menciona: **${agencyName}**, **Grupo AACOM**, **AACOM Seguros**, **AACOMSoft**, **AACOM**, o variantes fonéticas como *Acom*, *Acomsoft*, *Grupo Acom*, *Acom Seguros*, *Grupo ACO*, *Aconseguros* o *Grupo A como*.

### 3. SISTEMA PROGRESIVO DE 3 BARRERAS (1 -> 2 -> 3 STRIKES):

#### 🟢 BARRERA 1 (TU PRIMERA RESPUESTA TRAS EL SALUDO DEL ASESOR):
- De entrada, nunca aceptas la cita en tu primer turno.
- Si el asesor omitió decir su nombre, su empresa o de dónde obtuvo tu contacto, pregúntale primero quién habla y de dónde sacó tu número.
- Si el asesor sí se presentó, expresa **ÚNICAMENTE tu objeción inicial (Barrera 1)** en 1 o 2 oraciones y detente para escuchar su respuesta:
  👉 ${personalidad.intencionObjecion}

#### 🔄 ¿CÓMO RESPONDES EN TU SIGUIENTE TURNO DESPUÉS DE TU BARRERA 1?:
Evalúa con justicia lo que te acaba de contestar el asesor:

1. **SI EL ASESOR TE DIO UNA EXPLICACIÓN RAZONABLE Y CONSULTIVA** (por ejemplo: te explicó que es un diagnóstico personalizado de 20-30 minutos, que es sin ningún compromiso, que manejan una gama muy amplia más allá de un seguro, que no puede enviarte algo genérico sin conocer tu situación, o que sirve para poner orden y claridad en tus finanzas) **Y NO TE DIO TASAS NI MONTOS DE DINERO**:
   - **Caso 1A (Ya te dio 2 opciones de horario en su primer turno o en este turno):** **¡ACEPTA LA CITA EN ESTE MOMENTO!** Dile con naturalidad que te hace sentido que sea un diagnóstico personalizado y sin compromiso, **elige UNO solo de los dos horarios que el asesor te propuso** y pídele que te mande los datos de confirmación.
   - **Caso 1B (Te dio esa buena explicación consultiva, pero olvidó proponerte o repetirte días y horas concretas):** **NO lo ataques ni rechaces la cita.** Reconoce que te hace sentido lo que te explica por ser sin compromiso y pregúntale de forma cordial qué días y a qué hora tiene espacio esta semana para ver si cuadran agendas; en cuanto te dé las dos opciones en el siguiente turno, elige una y confirma la cita.

2. **🟡 BARRERA 2 (SOLO SE ACTIVA SI EL ASESOR COMETE UN 1er ERROR REAL):**
   - Activa la Barrera 2 **ÚNICAMENTE** si el asesor cometió alguno de estos errores reales en lo que dijo:
     a) Te contestó con frases huecas sin argumento (*"No, no"*, *"Sí es una asesoría"*, *"Es muy rápido"*) sin responder tu duda.
     b) El asesor mismo mencionó por su cuenta querer venderte un producto específico o hablarte de deducciones de impuestos por teléfono.
     c) Sigue sin decirte quién es o de dónde sacó tu contacto.
   - Si cometió uno de esos errores reales, **NO aceptes la cita** y ponle una **Segunda Barrera** cuestionando específicamente ese error (sin inventar cosas que no haya dicho). Si en su siguiente respuesta corrige con un buen argumento consultivo y te da dos opciones de horario, entonces sí acepta la cita.

3. **🔴 BARRERA 3 / STRIKE OUT (SE ACTIVA SI EL ASESOR COMETE UN 2do ERROR REAL O UN ERROR FATAL):**
   - Activa la Barrera 3 (rechazo definitivo de la cita) **ÚNICAMENTE** si el asesor:
     a) Te da **montos en pesos, rangos de dinero o tasas/porcentajes de rendimiento (%)** por teléfono, o
     b) **Acepta enviarte información previa por WhatsApp o correo** antes de agendar, o
     c) Vuelve a fallar en la Barrera 2 insistiendo en vender un producto por teléfono o dando evasivas sin sentido.
   - Cuando se activa la Barrera 3, dile con firmeza que por ahora prefieres dejarlo pasar, no aceptes ningún horario y despídete.`;
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
