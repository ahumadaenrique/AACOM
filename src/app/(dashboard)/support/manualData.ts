export type ManualMockupType =
  | "cobros-recibos"
  | "nueva-poliza"
  | "mis-referidores"
  | "adn-menu"
  | "tips-promotoria"
  | "asistente-ia"
  | "admin-adn"
  | "admin-encuestas"
  | "admin-nps"
  | "admin-votaciones"
  | "mi-membresia"
  | "mi-tarjeta-digital"
  | "ayuda-soporte"
  | "proyecto-200";

export interface ManualTable {
  headers: string[];
  rows: string[][];
}

export interface ManualFigure {
  number?: number;
  src?: string;
  mockup?: ManualMockupType;
  caption: string;
}

export interface ManualStepGroup {
  title: string;
  steps: string[];
}

export interface ManualSubsection {
  id: string;
  number: string;
  title: string;
  roleBadge?: "Todos" | "Agente" | "Admin";
  quickPath?: string;
  quickLink?: string;
  purpose?: string;
  howToReach?: string[];
  description?: string[];
  screenElements?: {
    groupTitle?: string;
    items: { label?: string; text: string }[];
  }[];
  tables?: ManualTable[];
  stepGroups?: ManualStepGroup[];
  figures?: ManualFigure[];
  tips?: { type: "CONSEJO" | "NOTA"; text: string }[];
}

export interface ManualChapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  iconName: string;
  roleBadge: "Todos" | "Agente" | "Admin";
  quickLink?: string;
  quickPath?: string;
  purpose?: string;
  howToReach?: string[];
  introParagraphs?: string[];
  screenElements?: {
    groupTitle?: string;
    items: { label?: string; text: string }[];
  }[];
  tables?: ManualTable[];
  stepGroups?: ManualStepGroup[];
  figures?: ManualFigure[];
  tips?: { type: "CONSEJO" | "NOTA"; text: string }[];
  subsections?: ManualSubsection[];
}

export interface GlossaryItem {
  term: string;
  meaning: string;
  category: "Módulos" | "Seguros y Coberturas" | "Métricas y Procesos" | "Tecnología";
  relatedChapterId?: string;
}

export const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: "introduccion",
    number: "1",
    title: "Introducción",
    subtitle: "Conoce qué es aacomsoft, los roles de usuario y cómo aprovechar este centro de ayuda.",
    iconName: "BookOpen",
    roleBadge: "Todos",
    subsections: [
      {
        id: "que-es-aacomsoft",
        number: "1.1",
        title: "¿Qué es aacomsoft?",
        description: [
          "aacomsoft es un software de gestión en la nube diseñado para promotorías de seguros y sus agentes. Reúne en una sola plataforma web la operación diaria del equipo comercial: registro de actividad, cartera de pólizas y clientes, cotizaciones, diagnósticos financieros (ADN), talleres en vivo (TIPS), capacitación, inteligencia artificial y tableros de control para la dirección de la promotoría.",
          "Las funciones inteligentes (noticias curadas, asistente, simulador de llamadas y análisis de desempeño) funcionan con el motor de inteligencia artificial de aacomsoft. La plataforma se usa desde el navegador, sin instalar nada. Cada promotoría trabaja en su propio espacio, con su nombre, su color y su logotipo (consulta el capítulo «Mi Agencia SaaS, Mi Membresía y menú de usuario»)."
        ]
      },
      {
        id: "roles-de-usuario",
        number: "1.2",
        title: "Roles de usuario",
        description: [
          "Lo que ves en el menú depende del rol que el administrador de tu promotoría te haya asignado:"
        ],
        tables: [
          {
            headers: ["Rol", "Qué puede hacer"],
            rows: [
              [
                "Agente de seguros",
                "Usa los módulos de trabajo diario: Inicio, Newsletters, 25 puntos, PEA/PRP/JEP, Mi Cartera, Equipo, Ranking, Mis Referidores, Herramientas e Inteligencia Artificial Avanzada."
              ],
              [
                "Administrador de la promotoría",
                "Además de lo anterior, ve el menú Admin para dar de alta usuarios, revisar la producción, los reportes y la actividad del equipo, y configurar la plataforma de la promotoría (marca, banners, notificaciones, biblioteca, cotizador, Plan de Arranque, etc.)."
              ]
            ]
          }
        ],
        tips: [
          {
            type: "NOTA",
            text: "Al crear una cuenta, el formulario ofrece también otros roles de acceso (por ejemplo, «Agente Limitado»). Pide al administrador de tu promotoría que te confirme qué módulos incluye tu rol."
          }
        ]
      },
      {
        id: "como-usar-este-manual",
        number: "1.3",
        title: "Cómo usar este manual",
        screenElements: [
          {
            items: [
              { text: "Los capítulos siguen el orden del menú superior de la aplicación." },
              {
                text: "Cada pantalla se explica con la misma estructura: Para qué sirve, Cómo llegar, Qué hay en la pantalla (botones, campos, filtros y columnas), Paso a paso y Consejos."
              },
              {
                text: "Los nombres de botones, pestañas y campos se destacan en negritas, tal como aparecen en pantalla."
              },
              {
                text: "Por privacidad, en las capturas de pantalla los datos personales y financieros (nombres, correos, teléfonos, montos y números de póliza) aparecen cubiertos con recuadros grises o pixelados. En tu cuenta verás tus propios datos."
              },
              {
                text: "Todas las pantallas cuentan con capturas reales ampliables o vistas interactivas detalladas de la interfaz."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "primeros-pasos",
    number: "2",
    title: "Primeros pasos",
    subtitle: "Acceso a la plataforma, barra de navegación superior, menú de perfil y sistema de niveles XP.",
    iconName: "Compass",
    roleBadge: "Todos",
    subsections: [
      {
        id: "acceso-plataforma",
        number: "2.1",
        title: "Acceso a la plataforma",
        description: [
          "Tu cuenta la crea el administrador de tu promotoría desde Admin › Dashboard Admin › Gestión de Agentes (ver 14.4.3). Al darte de alta registra tu nombre, tu correo electrónico (que será tu usuario de acceso), tu teléfono, una contraseña inicial y tu rol."
        ],
        stepGroups: [
          {
            title: "Paso a paso: iniciar sesión",
            steps: [
              "Abre tu navegador (se recomienda una versión actualizada de Chrome, Edge, Safari o Firefox).",
              "Entra a www.aacomsoft.com.",
              "Escribe el correo electrónico y la contraseña que te proporcionó tu administrador.",
              "Al ingresar, verás la pantalla Inicio."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Si olvidaste tu contraseña o no puedes entrar, pide al administrador de tu promotoría que la restablezca: desde Gestión de Agentes puede activar o suspender cuentas y redefinir contraseñas."
          }
        ]
      },
      {
        id: "barra-menu-superior",
        number: "2.2",
        title: "La barra de menú superior",
        description: [
          "En la parte superior de todas las pantallas está la barra de navegación. La opción en la que te encuentras aparece resaltada y subrayada."
        ],
        tables: [
          {
            headers: ["Opción del menú", "Qué encuentras"],
            rows: [
              ["Logotipo (izquierda)", "Regresa a la pantalla Inicio."],
              ["Newsletters", "Noticias financieras y del sector asegurador, con tipos de cambio y valor de la UDI."],
              ["25 puntos", "Registro de tu actividad comercial diaria con meta de 25 puntos."],
              [
                "PEA/PRP/JEP",
                "Desempeño Operativo (Planeación Estratégica de Actividad, Planeación Recurrente de Productividad y Junta Estratégica de Productividad): bandeja de aprobación y archivo histórico de reportes."
              ],
              ["Mi Cartera", "Pólizas, cobros y recibos, aniversarios y oportunidades de venta; acceso al Directorio de Clientes."],
              ["Equipo", "Directorio de los miembros de tu promotoría."],
              ["Ranking", "Clasificación de agentes por diagnósticos ADN completados."],
              ["Mis Referidores", "Tus referidores registrados."],
              ["Herramientas ▾", "Proyecto 200, Encuesta de satisfacción, Mi Biblioteca, Cotizador, ADN, TIPS, Plan de Arranque y Academia."],
              ["Inteligencia Artificial Avanzada ▾", "Asistente de inteligencia artificial."],
              [
                "Admin ▾ (solo administradores)",
                "Producción & Primas, Referidores, Votaciones, Dashboard Admin, Admin P. Arranque y Reportes."
              ],
              ["Indicador NIVEL / XP", "Tu nivel y puntos de experiencia (ver 2.4)."],
              ["Foto de perfil (derecha)", "Menú de usuario (ver 2.3)."]
            ]
          }
        ],
        tips: [
          {
            type: "NOTA",
            text: "Las opciones con el símbolo ▾ despliegan un submenú al hacer clic."
          }
        ]
      },
      {
        id: "menu-usuario-perfil",
        number: "2.3",
        title: "Menú de usuario y perfil",
        description: [
          "Haz clic en tu foto de perfil, en la esquina superior derecha, para abrir el menú de usuario. Según tu rol, contiene:"
        ],
        screenElements: [
          {
            items: [
              { label: "Mi Agencia SaaS (administradores)", text: "marca, logotipo y conexión de IA de la promotoría." },
              { label: "Mi Tarjeta Digital", text: "tu tarjeta de presentación digital." },
              { label: "Ayuda y Soporte", text: "manual de usuario y tickets de soporte." },
              { label: "Mi Membresía (administradores)", text: "estado de la licencia y programa de referidos." },
              { label: "Portal de Pagos", text: "acceso a la facturación y pagos de la suscripción." },
              { label: "Cerrar Sesión", text: "sale de la plataforma." }
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Si usas una computadora compartida, cierra siempre tu sesión desde Cerrar Sesión al terminar."
          }
        ]
      },
      {
        id: "nivel-puntos-experiencia",
        number: "2.4",
        title: "Nivel y puntos de experiencia (XP)",
        description: [
          "Junto a tu foto de perfil aparece el indicador NIVEL con tus puntos de experiencia (XP) y una barra de avance. Al hacer clic se abre el panel Tu Progreso, que explica cómo subir de nivel: «Sube de nivel completando llamadas exitosas para desbloquear recompensas».",
          "Los niveles bloqueados se muestran en gris con un candado. La XP se obtiene en el simulador de llamadas de la Academia (ver 12.7)."
        ],
        figures: [
          {
            number: 1,
            src: "/manual/figura-1.webp",
            caption: "Figura 1. Panel «Tu Progreso» que se abre al hacer clic en el indicador de nivel."
          }
        ],
        tables: [
          {
            headers: ["Nivel", "Recompensa que muestra la plataforma"],
            rows: [
              ["Nivel 1: Novato", "Acceso al Módulo de Prospección Telefónica."],
              ["Nivel 2: Intermedio", "Desbloquea el Módulo de Análisis de Necesidades (ADN)."],
              ["Nivel 3: Avanzado", "Desbloquea el Módulo de Objeciones y Cierre."],
              ["Nivel 4: Experto", "Desbloquea Voces Premium y Casos Complejos."],
              ["Nivel 5: Maestro", "1 perdón de multas/retardos al mes."]
            ]
          }
        ]
      }
    ]
  },
  {
    id: "inicio",
    number: "3",
    title: "Inicio",
    subtitle: "Pantalla de bienvenida con comunicados, campañas vigentes y solicitud de desarrollos a la medida.",
    iconName: "Home",
    roleBadge: "Todos",
    quickLink: "/",
    quickPath: "Logotipo superior izquierdo › Inicio",
    purpose:
      "Es la pantalla de bienvenida. Muestra los comunicados y campañas vigentes que publica la dirección de tu promotoría y un acceso para solicitar desarrollos a la medida.",
    howToReach: [
      "Se abre automáticamente al iniciar sesión. Desde cualquier pantalla, haz clic en el logotipo de la esquina superior izquierda."
    ],
    figures: [
      {
        number: 2,
        src: "/manual/figura-2.webp",
        caption: "Figura 2. Pantalla Inicio. Los comunicados de la promotoría aparecen pixelados en esta captura."
      }
    ],
    screenElements: [
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          {
            label: "¿Necesitas tecnología a la medida? (etiqueta PREMIUM)",
            text: "si tu promotoría requiere un módulo, cotizador o funcionalidad exclusiva, el botón Cotizar Desarrollo te lleva a levantar una solicitud mediante un ticket."
          },
          {
            label: "Comunicados y campañas activas",
            text: "galería de imágenes con avisos, metas y campañas. Haz clic en cualquier imagen para ampliarla."
          }
        ]
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: ver un comunicado completo",
        steps: [
          "En Comunicados y campañas activas, haz clic sobre la imagen del comunicado.",
          "La imagen se abre ampliada para leerla con detalle.",
          "Cierra la vista ampliada para regresar a Inicio."
        ]
      }
    ],
    tips: [
      {
        type: "CONSEJO",
        text: "Los comunicados los administra la promotoría desde Admin › Dashboard Admin › Banners de Inicio (ver 14.4.5). Si un comunicado tiene un enlace configurado, puede llevarte a una página con más información."
      }
    ]
  },
  {
    id: "newsletters",
    number: "4",
    title: "Newsletters",
    subtitle: "Terminal de información financiera y aseguradora curada con IA e impacto para el asesor.",
    iconName: "Newspaper",
    roleBadge: "Todos",
    quickLink: "/newsletters",
    quickPath: "Menú superior › Newsletters",
    purpose:
      "Es tu terminal de información financiera: reúne noticias del sector asegurador y de la economía, seleccionadas con inteligencia artificial, y para cada una explica el Impacto para el asesor, es decir, cómo usarla en tu conversación con clientes.",
    howToReach: ["En el menú superior, haz clic en Newsletters."],
    figures: [
      {
        number: 3,
        src: "/manual/figura-3.webp",
        caption: "Figura 3. Pantalla Newsletters con indicadores financieros y noticias."
      }
    ],
    screenElements: [
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          { label: "Actualizar con IA", text: "solicita una nueva actualización de las noticias." },
          {
            label: "Indicadores",
            text: "tarjetas con el tipo de cambio del dólar (USD FIX), euro (EUR), libra esterlina (GBP) y el valor de la UDI del día."
          },
          { label: "Fecha de la edición", text: "muestra la fecha actual y la leyenda «Curación con inteligencia artificial»." },
          {
            label: "Categorías",
            text: "Todos, Seguros y Fianzas, Macroeconomía y Tasas, Retiro e Inversiones, Insurtech e Innovación."
          },
          { label: "Buscar por tag o palabra clave...", text: "filtra las noticias por texto." },
          {
            label: "Tarjeta de noticia",
            text: "fuente y fecha, titular, resumen, recuadro Impacto para el asesor, etiquetas temáticas y el enlace Ver boletín original."
          }
        ]
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: encontrar noticias para una cita",
        steps: [
          "Abre Newsletters.",
          "Elige una categoría (por ejemplo, Retiro e Inversiones) o escribe una palabra en el buscador (por ejemplo, «UDI»).",
          "Lee el resumen y el recuadro Impacto para el asesor.",
          "Si necesitas la fuente completa, haz clic en Ver boletín original."
        ]
      }
    ],
    tips: [
      {
        type: "CONSEJO",
        text: "Usa el recuadro «Impacto para el asesor» como argumento de apertura en tus llamadas o citas."
      }
    ]
  },
  {
    id: "25-puntos",
    number: "5",
    title: "25 puntos (actividad diaria)",
    subtitle: "Registro diario de prospección, llamadas, citas, cierres, referidos y emisiones.",
    iconName: "ClipboardCheck",
    roleBadge: "Agente",
    quickLink: "/activity",
    quickPath: "Menú superior › 25 puntos",
    purpose:
      "Registra tu actividad comercial del día. Cada acción suma puntos y la meta diaria es de 25 puntos. El administrador de la promotoría ve esta actividad en sus reportes.",
    howToReach: ["En el menú superior, haz clic en 25 puntos."],
    figures: [
      {
        number: 4,
        src: "/manual/figura-4.webp",
        caption: "Figura 4. Pantalla de actividad diaria con meta de 25 puntos."
      }
    ],
    screenElements: [
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          { label: "Planear mi día", text: "botón para planear tus actividades de la jornada." },
          {
            label: "Indicador circular",
            text: "puntos acumulados hoy «de 25», con un estado (por ejemplo, INICIAL) y el mensaje de cuántos puntos te faltan."
          },
          { label: "Registrar nueva actividad", text: "cada actividad tiene botones + y − para sumar o corregir." },
          { label: "Detalle de actividad de hoy", text: "lista de lo que has registrado en el día." },
          { label: "Historial de actividades", text: "actividad de días anteriores, con un selector de mes." }
        ]
      }
    ],
    tables: [
      {
        headers: ["Actividad", "Puntos"],
        rows: [
          ["Llamada telefónica", "+1"],
          ["Cita agendada", "+2"],
          ["Cita Efectiva", "+3"],
          ["Cierre de póliza", "+5"],
          ["Referido obtenido", "+3"],
          ["Póliza EMITIDA", "+8"],
          ["RDA (Referido de Asesor)", "+8"]
        ]
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: registrar tu actividad",
        steps: [
          "Abre 25 puntos.",
          "Cada vez que realices una actividad, haz clic en el botón + de esa actividad.",
          "Si te equivocaste, usa el botón − para restarla.",
          "Revisa el indicador circular y el Detalle de actividad de hoy para confirmar tus puntos.",
          "Para consultar días anteriores, elige el mes en Historial de actividades."
        ]
      }
    ],
    tips: [
      {
        type: "CONSEJO",
        text: "Registra cada actividad en el momento en que ocurre. La plataforma puede enviarte recordatorios automáticos de planeación por la mañana y de validación de 25 puntos por la tarde (los configura el administrador)."
      }
    ]
  },
  {
    id: "pea-prp-jep",
    number: "6",
    title: "PEA/PRP/JEP (Desempeño Operativo)",
    subtitle: "Motor de IA para la gestión del ciclo de vida operativo, aprobaciones y archivo histórico.",
    iconName: "Target",
    roleBadge: "Todos",
    quickLink: "/pea-prp",
    quickPath: "Menú superior › PEA/PRP/JEP",
    purpose:
      "Es el módulo de Desempeño Operativo, descrito en pantalla como «Motor de Inteligencia Artificial para la gestión del ciclo de vida (PEA/PRP/JEP)». Concentra los reportes de desempeño: los pendientes de revisión y el archivo de los reportes ya autorizados.",
    howToReach: ["En el menú superior, haz clic en PEA/PRP/JEP."],
    screenElements: [
      {
        groupTitle: "Significado de las siglas",
        items: [
          { label: "PEA", text: "Planeación Estratégica de Actividad." },
          { label: "PRP", text: "Planeación Recurrente de Productividad." },
          { label: "JEP", text: "Junta Estratégica de Productividad." }
        ]
      },
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          {
            label: "Pestaña Dashboard",
            text: "muestra la Bandeja de Aprobación. Cuando no hay pendientes aparece el mensaje «¡Todo al día! No hay reportes pendientes de revisión»."
          },
          {
            label: "Pestaña Archivo Histórico",
            text: "registro de todos los reportes previamente autorizados, agrupados por mes."
          }
        ]
      }
    ],
    figures: [
      {
        number: 5,
        src: "/manual/figura-5.webp",
        caption: "Figura 5. Desempeño Operativo, pestaña Dashboard, con la Bandeja de Aprobación al día."
      },
      {
        number: 6,
        src: "/manual/figura-6.webp",
        caption: "Figura 6. Pestaña Archivo Histórico: reportes autorizados agrupados por mes."
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: consultar reportes anteriores",
        steps: [
          "Abre PEA/PRP/JEP y haz clic en la pestaña Archivo Histórico.",
          "Cada mes muestra el número de reportes autorizados.",
          "Haz clic en el mes para desplegar sus reportes."
        ]
      }
    ],
    tips: [
      {
        type: "CONSEJO",
        text: "Revisa la Bandeja de Aprobación con regularidad para que ningún reporte quede pendiente."
      }
    ]
  },
  {
    id: "mi-cartera",
    number: "7",
    title: "Mi Cartera",
    subtitle: "Pólizas vigentes, cobros programados, aniversarios, venta cruzada e importación desde Excel.",
    iconName: "Wallet",
    roleBadge: "Todos",
    quickLink: "/cartera",
    quickPath: "Menú superior › Mi Cartera",
    purpose:
      "Concentra en un solo lugar tus pólizas, cobros programados, aniversarios y oportunidades de venta. Desde aquí también das de alta pólizas, importas tu cartera desde Excel y accedes al Directorio de Clientes.",
    howToReach: ["En el menú superior, haz clic en Mi Cartera."],
    figures: [
      {
        number: 7,
        src: "/manual/figura-7.webp",
        caption: "Figura 7. Mi Cartera, pestaña Mis Pólizas. Montos y datos de clientes cubiertos."
      }
    ],
    screenElements: [
      {
        groupTitle: "Botones superiores",
        items: [
          { label: "Nueva Póliza", text: "abre el formulario para registrar una póliza (ver 7.6)." },
          {
            label: "Directorio de Clientes (n)",
            text: "abre el directorio con el número de clientes entre paréntesis (ver capítulo 8)."
          },
          { label: "Importar Excel", text: "carga pólizas de forma masiva desde un archivo de Excel." }
        ]
      },
      {
        groupTitle: "Tarjetas de resumen",
        items: [
          { label: "Prima Anualizada Activa", text: "suma de la prima anual de tus pólizas vigentes." },
          { label: "Cobros y Recibos", text: "recibos por cobrar o confirmar." },
          {
            label: "Próximos Aniversarios",
            text: "pólizas con aniversario en los próximos 30 días; desde ahí puedes enviar felicitación o aviso por WhatsApp."
          },
          {
            label: "Oportunidades de Venta",
            text: "clientes con brechas de protección detectadas, con el promedio de pólizas por cliente."
          }
        ]
      }
    ],
    introParagraphs: [
      "Debajo están las cuatro pestañas de la cartera, cada una con un contador: Mis Pólizas, Cobros y Recibos, Aniversarios y Renovaciones y Oportunidades de Venta. Si tienes recibos en periodo de gracia o pendientes de confirmar pago, aparece un aviso con el botón Revisar recibos ahora."
    ],
    subsections: [
      {
        id: "cartera-mis-polizas",
        number: "7.1",
        title: "Pestaña Mis Pólizas",
        screenElements: [
          {
            items: [
              {
                label: "Desglose GMM y Autos (nuevas vs. renovaciones)",
                text: "cuántas pólizas son nuevas (año 1) y cuántas renovaciones (año 2+), con botones GMM y Autos."
              },
              {
                label: "Vista Vida Grupo (recibos pagados)",
                text: "pólizas y recibos pagados de Vida Grupo, con botón Filtrar."
              },
              { label: "Buscador", text: "«Buscar póliza, cliente, plan...»." },
              {
                label: "Filtros",
                text: "Todos los Ramos, Nuevas y renovaciones, Todos los Estatus y Todos los Agentes."
              },
              { label: "Exportar CSV (n)", text: "descarga la lista filtrada en formato CSV." },
              {
                label: "Columnas de la tabla",
                text: "Póliza / Aseguradora, Agente, Cliente / Contratante, Plan / Ramo, Estatus / Tipo, Próx. Aniversario / Renovación, Prima Anual, Carátula PDF (para subir o ver la carátula de la póliza) y Acciones."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: buscar una póliza y descargar la lista",
            steps: [
              "En Mis Pólizas, escribe en el buscador el número de póliza, el nombre del cliente o el plan.",
              "Si lo necesitas, combina los filtros de ramo, tipo, estatus y agente.",
              "Haz clic en Exportar CSV para descargar el resultado."
            ]
          },
          {
            title: "Paso a paso: adjuntar la carátula de una póliza",
            steps: [
              "Localiza la póliza en la tabla.",
              "En la columna Carátula PDF, usa la opción para subir el archivo PDF.",
              "Una vez cargada, la misma columna permite ver el PDF."
            ]
          }
        ]
      },
      {
        id: "cartera-cobros-recibos",
        number: "7.2",
        title: "Pestaña Cobros y Recibos",
        description: [
          "Muestra los recibos de tu cartera agrupados en sub-filtros: En Gracia / Confirmar, Próximos 30 días y Pagados, cada uno con su contador. En cada recibo hay botones Marcar Pagado y WhatsApp para registrar el pago o contactar al cliente."
        ],
        figures: [
          {
            mockup: "cobros-recibos",
            caption: "Vista interactiva: Pestaña Cobros y Recibos con sub-filtros de seguimiento y acciones rápidas."
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: dar seguimiento a un recibo",
            steps: [
              "Abre la pestaña Cobros y Recibos (o el botón Revisar recibos ahora del aviso).",
              "Elige el sub-filtro En Gracia / Confirmar para ver primero los recibos más urgentes.",
              "Usa WhatsApp para recordar el pago al cliente.",
              "Cuando confirmes el pago, haz clic en Marcar Pagado."
            ]
          }
        ]
      },
      {
        id: "cartera-aniversarios",
        number: "7.3",
        title: "Pestaña Aniversarios y Renovaciones",
        description: [
          "Lista los próximos aniversarios y renovaciones anuales. En Vida Individual se monitorea el aniversario anual de la póliza; en GMM, Autos y Daños, la renovación del contrato. Puedes elegir el horizonte con los botones 30 días, 45 días, 60 días y 90 días. Cada registro tiene un botón WhatsApp."
        ],
        figures: [
          {
            number: 8,
            src: "/manual/figura-8.webp",
            caption: "Figura 8. Pestaña Aniversarios y Renovaciones con botones de WhatsApp."
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: felicitar o avisar a un cliente",
            steps: [
              "Abre Aniversarios y Renovaciones.",
              "Elige el horizonte (por ejemplo, 30 días).",
              "Haz clic en WhatsApp junto al cliente para enviarle la felicitación o el aviso de renovación."
            ]
          }
        ]
      },
      {
        id: "cartera-oportunidades",
        number: "7.4",
        title: "Pestaña Oportunidades de Venta",
        description: [
          "Muestra Oportunidades de Venta Cruzada y Leads TIPS: clientes actuales de tu cartera y prospectos de talleres TIPS con brechas abiertas en Retiro/PPR, Gastos Médicos, Vida o Patrimonio."
        ],
        figures: [
          {
            number: 9,
            src: "/manual/figura-9.webp",
            caption: "Figura 9. Pestaña Oportunidades de Venta: tarjetas por cliente con su brecha de protección."
          }
        ],
        screenElements: [
          {
            items: [
              { label: "Buscar cliente o taller TIPS...", text: "buscador." },
              {
                label: "Filtros",
                text: "Todas las brechas, Origen: TIPS, Falta Retiro / PPR, Falta Gastos Médicos, Falta Vida y Falta Autos / Daños."
              },
              {
                label: "Tarjeta de cliente",
                text: "porcentaje de Blindaje, lo que el cliente Ya tiene, lo que conviene Ofrecer y el enlace Ver expediente."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: preparar una venta cruzada",
            steps: [
              "Abre Oportunidades de Venta.",
              "Filtra por la brecha que quieres trabajar (por ejemplo, Falta Gastos Médicos).",
              "Revisa en cada tarjeta qué tiene el cliente y qué se sugiere ofrecer.",
              "Haz clic en Ver expediente para consultar al cliente antes de contactarlo."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Empieza por los clientes con menor porcentaje de Blindaje: son los que tienen más brechas de protección."
          }
        ]
      },
      {
        id: "cartera-importar-excel",
        number: "7.5",
        title: "Importar cartera desde Excel",
        stepGroups: [
          {
            title: "Paso a paso: importar cartera masivamente",
            steps: [
              "En Mi Cartera, haz clic en Importar Excel.",
              "Selecciona el archivo con tus pólizas y sigue las indicaciones en pantalla.",
              "Al terminar, verifica en Mis Pólizas que la información se haya cargado correctamente."
            ]
          }
        ],
        tips: [
          {
            type: "NOTA",
            text: "Consulta con tu administrador el formato (layout) de archivo que utiliza tu promotoría."
          }
        ]
      },
      {
        id: "cartera-nueva-poliza",
        number: "7.6",
        title: "Registrar una nueva póliza",
        description: [
          "Ventana que se abre con el botón Nueva Póliza. Incluye la opción Autocompletar con PDF y los campos: Cliente / Contratante*, Número de Póliza*, Aseguradora*, Ramo* (Vida Individual, PPR, GMM, Autos, Vida Grupo, Daños), Producto / Plan, Inicio de Vigencia, Forma de Pago, Prima Anual MXN*, WhatsApp y Opciones avanzadas (UDI / moneda). Los campos con * son obligatorios."
        ],
        figures: [
          {
            mockup: "nueva-poliza",
            caption: "Vista interactiva: Formulario Nueva Póliza con lector inteligente Autocompletar con PDF."
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: dar de alta una póliza",
            steps: [
              "En Mi Cartera, haz clic en Nueva Póliza.",
              "Si tienes la carátula en PDF, puedes usar Autocompletar con PDF para precargar los datos; revisa siempre lo que se llenó.",
              "Completa los campos obligatorios (*) y los opcionales que apliquen.",
              "Si la póliza está en UDI u otra moneda, abre Opciones avanzadas.",
              "Guarda la póliza. Para salir sin guardar, cierra la ventana (también con la tecla Esc)."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "directorio-clientes",
    number: "8",
    title: "Directorio de Clientes",
    subtitle: "Administración de asegurados, cumpleaños, nivel de blindaje y prospectos TIPS.",
    iconName: "Users",
    roleBadge: "Todos",
    quickLink: "/cartera",
    quickPath: "Mi Cartera › Directorio de Clientes (n)",
    purpose:
      "Administra tu cartera de asegurados: datos de contacto, fechas de cumpleaños y nivel de blindaje. Incluye los clientes dados de alta manualmente o mediante la importación de tu layout, y los prospectos que llegan de los talleres TIPS.",
    howToReach: [
      "En el menú superior, haz clic en Mi Cartera.",
      "Haz clic en el botón Directorio de Clientes (n).",
      "Para regresar, usa la flecha ← junto al título."
    ],
    figures: [
      {
        number: 10,
        src: "/manual/figura-10.webp",
        caption: "Figura 10. Directorio de Clientes. Los datos de clientes están cubiertos."
      }
    ],
    screenElements: [
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          { label: "Nuevo Cliente", text: "da de alta un cliente." },
          { label: "Clientes Activos (n)", text: "total de clientes." },
          { label: "Buscador", text: "busca por nombre, correo, teléfono o RFC." },
          { label: "Filtros", text: "Todos (n) y Prospectos TIPS (n)." },
          { label: "Orden", text: "por ejemplo, Nombre (A-Z)." },
          {
            label: "Columnas",
            text: "Nombre / Contacto, Agente, Cumpleaños / Edad, Pólizas Activas, Próx. Aniversario, Prima Activa y Acciones."
          }
        ]
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: dar de alta un cliente",
        steps: [
          "Haz clic en Nuevo Cliente.",
          "Captura los datos que solicita el formulario.",
          "Guarda. El cliente aparecerá en la lista de Clientes Activos."
        ]
      },
      {
        title: "Paso a paso: ver los prospectos de tus talleres",
        steps: [
          "Haz clic en el filtro Prospectos TIPS.",
          "Revisa los datos de contacto y da seguimiento desde Acciones."
        ]
      }
    ]
  },
  {
    id: "equipo",
    number: "9",
    title: "Equipo",
    subtitle: "Directorio de promotores, agentes y staff de tu promotoría e invitación de agentes.",
    iconName: "UserCheck",
    roleBadge: "Todos",
    quickLink: "/team",
    quickPath: "Menú superior › Equipo",
    purpose:
      "Es el directorio del equipo de tu promotoría: promotores, agentes y staff, con sus datos de contacto y las aseguradoras con las que trabajan.",
    howToReach: ["En el menú superior, haz clic en Equipo."],
    figures: [
      {
        number: 12,
        src: "/manual/figura-12.webp",
        caption: "Figura 12. Equipo. Las tarjetas de los miembros están cubiertas por privacidad."
      }
    ],
    screenElements: [
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          { label: "Buscar por nombre, correo o aseguradora...", text: "buscador del directorio." },
          { label: "Tarjetas de miembros", text: "nombre, rol, correo, teléfono y aseguradoras de cada persona." },
          {
            label: "Copiar Enlace de Invitación",
            text: "copia un enlace para invitar agentes adicionales que paguen por su cuenta y se unan a tu estructura."
          }
        ]
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: invitar a un agente",
        steps: [
          "Haz clic en Copiar Enlace de Invitación.",
          "Pega el enlace en un mensaje o correo para el agente.",
          "El agente se registra con ese enlace y se une a tu estructura."
        ]
      }
    ]
  },
  {
    id: "ranking",
    number: "10",
    title: "Ranking",
    subtitle: "Clasificación mensual y podio de líderes por diagnósticos ADN completados.",
    iconName: "Award",
    roleBadge: "Todos",
    quickLink: "/ranking",
    quickPath: "Menú superior › Ranking",
    purpose:
      "Muestra a los líderes de la promotoría ordenados por la cantidad de diagnósticos ADN completados en el mes seleccionado.",
    howToReach: ["En el menú superior, haz clic en Ranking."],
    figures: [
      {
        number: 13,
        src: "/manual/figura-13.webp",
        caption: "Figura 13. Ranking de Agentes: podio y tabla de clasificación general (nombres cubiertos)."
      }
    ],
    screenElements: [
      {
        groupTitle: "Qué hay en la pantalla",
        items: [
          { label: "Selectores de mes y año", text: "cambian el periodo del ranking." },
          { label: "Podio", text: "los tres primeros lugares, con su número de ADNs completados." },
          { label: "Tabla de clasificación general", text: "el resto de los agentes con su número de ADNs." }
        ]
      }
    ],
    introParagraphs: [
      "Si la promotoría tiene una campaña de premiación activa, su imagen se muestra en la parte superior de esta pantalla (la configura el administrador en Productividad de Agentes)."
    ],
    stepGroups: [
      {
        title: "Paso a paso: consultar el ranking de otro mes",
        steps: [
          "Abre Ranking.",
          "Elige el mes y el año en los selectores junto al título.",
          "El podio y la tabla se actualizan con ese periodo."
        ]
      }
    ]
  },
  {
    id: "mis-referidores",
    number: "11",
    title: "Mis Referidores",
    subtitle: "Consulta las personas asignadas que te refieren prospectos comerciales.",
    iconName: "Network",
    roleBadge: "Agente",
    quickLink: "/referidores",
    quickPath: "Menú superior › Mis Referidores",
    purpose: "Lista las personas que te refieren prospectos (referidores) y que tienes asignadas.",
    howToReach: ["En el menú superior, haz clic en Mis Referidores."],
    figures: [
      {
        mockup: "mis-referidores",
        caption: "Vista interactiva: Mis Referidores asignados al agente."
      }
    ],
    tips: [
      {
        type: "NOTA",
        text: "Muestra tus referidores registrados. Si no tienes ninguno, aparece un mensaje de lista vacía. Los referidores los da de alta el administrador desde Admin › Referidores (ver 14.2)."
      }
    ]
  },
  {
    id: "herramientas",
    number: "12",
    title: "Herramientas",
    subtitle: "Encuesta de satisfacción, Mi Biblioteca, Cotizador, ADN, TIPS, Plan de Arranque y Academia.",
    iconName: "Sparkles",
    roleBadge: "Todos",
    introParagraphs: [
      "El menú Herramientas ▾ agrupa las herramientas de venta y capacitación: Encuesta de satisfacción, Mi Biblioteca, Cotizador, ADN, TIPS, Plan de Arranque y Academia. Para abrir cualquiera: haz clic en Herramientas en el menú superior y elige la opción."
    ],
    subsections: [
      {
        id: "encuesta-satisfaccion",
        number: "12.1",
        title: "Encuesta de satisfacción",
        quickLink: "/encuesta-satisfaccion",
        quickPath: "Herramientas › Encuesta de satisfacción",
        purpose:
          "Aplica la «Técnica de los 4 SÍes» para obtener referidos de forma natural: haces cuatro preguntas de validación a tu cliente y, si responde «Sí» a todas, la quinta pregunta (pedir referidos) se convierte en una respuesta afirmativa natural.",
        howToReach: ["Haz clic en Herramientas › Encuesta de satisfacción."],
        figures: [
          {
            number: 14,
            src: "/manual/figura-14.webp",
            caption: "Figura 14. Encuesta de Satisfacción: datos del entrevistado y técnica de los 4 SÍes."
          }
        ],
        screenElements: [
          {
            groupTitle: "Qué hay en la pantalla",
            items: [
              { label: "Pestañas", text: "Nueva Encuesta y Mis Referidos & Histórico." },
              {
                label: "1. Datos de la Persona Entrevistada",
                text: "Nombre completo del cliente o prospecto* (obligatorio)."
              },
              {
                label: "2. La Técnica de los 4 SÍ's y la Recomendación",
                text: "cuatro preguntas con botones Sí / No (Utilidad, Propuesta de valor, Profesionalismo y Claridad) y un contador de SÍes confirmados."
              },
              {
                label: "El cierre / Pregunta 5",
                text: "«¿Recomendarías mis servicios a gente que pueda encontrar utilidad en ellos?» con ¡Sí! / No."
              },
              {
                label: "Captura de referidos",
                text: "filas para capturar a los referidos (nombre, teléfono y notas), botones Agregar otro contacto / Agregar otra fila, Ver 6 preguntas de ayuda, un campo de notas y el botón Guardar encuesta y referidos."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: aplicar una encuesta",
            steps: [
              "Abre Nueva Encuesta y escribe el nombre del cliente.",
              "Haz las cuatro preguntas y marca Sí o No en cada una.",
              "Haz la pregunta de cierre y marca la respuesta.",
              "Captura los datos de cada referido; agrega filas si es necesario. Si el cliente necesita ideas, usa Ver 6 preguntas de ayuda.",
              "Haz clic en Guardar encuesta y referidos.",
              "Consulta tus encuestas anteriores en Mis Referidos & Histórico."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Aplica la encuesta al final de una asesoría bien valorada: es el mejor momento para pedir recomendaciones."
          }
        ]
      },
      {
        id: "mi-biblioteca",
        number: "12.2",
        title: "Mi Biblioteca",
        quickLink: "/documentacion",
        quickPath: "Herramientas › Mi Biblioteca",
        purpose:
          "Consulta y descarga documentos, manuales y políticas: los documentos internos de tu promotoría y los catálogos oficiales de aseguradoras que tu promotor habilitó.",
        howToReach: ["Haz clic en Herramientas › Mi Biblioteca."],
        figures: [
          {
            number: 15,
            src: "/manual/figura-15.webp",
            caption: "Figura 15. Mi Biblioteca: documentos de la promotoría y catálogos oficiales."
          }
        ],
        screenElements: [
          {
            groupTitle: "Qué hay en la pantalla",
            items: [
              {
                label: "Documentos de la promotoría",
                text: "políticas internas, guías y formatos exclusivos de tu promotoría, organizados en carpetas (por ejemplo, Comercial)."
              },
              {
                label: "Catálogos Oficiales",
                text: "material oficial de aseguradoras habilitado por tu promotor, organizado por paquete y en carpetas Comercial, Marketing, Formatos, Condiciones Generales y Otros."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: descargar un documento",
            steps: [
              "Abre Mi Biblioteca.",
              "Haz clic en la carpeta para desplegar su contenido.",
              "Haz clic en el documento para consultarlo o descargarlo."
            ]
          }
        ]
      },
      {
        id: "cotizador",
        number: "12.3",
        title: "Cotizador",
        quickLink: "/cotizador",
        quickPath: "Herramientas › Cotizador",
        purpose:
          "Genera proyecciones y cotizaciones: convierte archivos de aseguradoras en cotizaciones web e imprimibles para tus clientes, y guarda un historial de todas tus cotizaciones.",
        howToReach: ["Haz clic en Herramientas › Cotizador."],
        figures: [
          {
            number: 16,
            src: "/manual/figura-16.webp",
            caption: "Figura 16. Menú principal del Cotizador."
          },
          {
            number: 17,
            src: "/manual/figura-17.webp",
            caption: "Figura 17. Paso 1 del Cotizador: información general de la cotización."
          },
          {
            number: 18,
            src: "/manual/figura-18.webp",
            caption: "Figura 18. Historial de Cotizaciones agrupado por mes (datos de clientes cubiertos)."
          }
        ],
        screenElements: [
          {
            groupTitle: "Opciones principales",
            items: [
              { label: "Nueva Cotización", text: "calcula y genera una nueva proyección desde cero (4 pasos: 1 Datos Generales, 2 Cargar Archivo, 3 Mapeo y 4 Resultados)." },
              { label: "Mis Cotizaciones", text: "visualiza y recupera el historial de cotizaciones que has guardado." }
            ]
          },
          {
            groupTitle: "Campos del Paso 1: Información General de la Cotización",
            items: [
              { label: "Datos de contacto", text: "Nombre del Cliente, Nombre del Agente (lista) y Teléfono del Cliente (10 dígitos)." },
              { label: "Perfil y producto", text: "Edad del Cliente, Producto (por ejemplo, Vida Pagos Limitados) y Forma de Pago Cotizada (por ejemplo, Anual)." },
              { label: "Hipótesis financieras", text: "Plazo / Edad de Retiro, Valor Inicial UDI e Inflación UDI Anual (%) (rango sugerido 4% – 5%)." },
              {
                label: "Coberturas Adicionales",
                text: "ITP (Invalidez Total y Permanente), EPP (Exención de Pago de Primas por ITP), MA (Muerte Accidental) y MAPO (Muerte Accidental con Pérdidas Orgánicas)."
              }
            ]
          },
          {
            groupTitle: "Mis Cotizaciones (Historial de Cotizaciones)",
            items: [
              { label: "Filtro de periodo", text: "por ejemplo, Todo el Histórico y botón Regresar." },
              { label: "Agrupación", text: "cotizaciones agrupadas por mes con su contador." },
              { label: "Columnas", text: "Fecha, Cliente, Producto, Prima Anual, Ahorro 65 (Pesos) y Acción (Ver Reporte)." }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: generar una nueva cotización",
            steps: [
              "Haz clic en Nueva Cotización.",
              "Completa los datos del cliente, el producto y las hipótesis financieras; marca las coberturas adicionales.",
              "Haz clic en Continuar a Carga.",
              "En Cargar Archivo, sube el archivo de la aseguradora.",
              "En Mapeo, relaciona los datos del archivo según te indique la pantalla.",
              "En Resultados, revisa la proyección generada para presentarla o imprimirla."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "El valor inicial de la UDI que aparece precargado lo define el administrador en el Dashboard Admin."
          }
        ]
      },
      {
        id: "adn-diagnostico",
        number: "12.4",
        title: "ADN (diagnóstico financiero)",
        quickLink: "/adn",
        quickPath: "Herramientas › ADN",
        purpose:
          "Herramienta para el diagnóstico financiero y patrimonial digital del cliente. Te permite capturar ingresos y gastos del cliente y conservar un historial de tus diagnósticos.",
        howToReach: ["Haz clic en Herramientas › ADN."],
        description: [
          "El menú principal de ADN muestra dos tarjetas: Capturar Nuevo ADN (botón Iniciar captura) y Mi Base de Clientes (ADNs) (botón Ver mis diagnósticos).",
          "Al capturar un nuevo ADN, la plataforma pregunta «¿De qué manera deseas capturar el diagnóstico financiero?» y ofrece tres niveles de detalle, según el tiempo que tengas con tu cliente:"
        ],
        figures: [
          {
            mockup: "adn-menu",
            caption: "Vista interactiva: Menú principal de ADN (Capturar Nuevo ADN y Mi Base de Clientes)."
          },
          {
            number: 19,
            src: "/manual/figura-19.webp",
            caption: "Figura 19. Elección del tipo de captura del ADN."
          },
          {
            number: 20,
            src: "/manual/figura-20.webp",
            caption: "Figura 20. Mi Base de Clientes de ADN (datos de clientes cubiertos)."
          }
        ],
        tables: [
          {
            headers: ["Modalidad", "Descripción en pantalla", "Botón"],
            rows: [
              [
                "Cuestionario Extendido",
                "Análisis completo con desglose detallado de gastos de casa, transporte, educación, diversión, deudas y mascotas.",
                "Iniciar detallado"
              ],
              [
                "Resumen de Rubros",
                "Captura ágil de totales acumulados en las 9 categorías principales de gastos; ideal para un diagnóstico ejecutivo rápido.",
                "Iniciar resumido"
              ],
              [
                "Ingreso y Gasto Total",
                "Análisis exprés: solo se ingresa el total de ingresos mensuales brutos/netos y el total aproximado de gastos mensuales.",
                "Iniciar básico"
              ]
            ]
          }
        ],
        screenElements: [
          {
            groupTitle: "Mi Base de Clientes (Diagnósticos ADN)",
            items: [
              { label: "Navegación y búsqueda", text: "botón Volver al Menú y buscador Buscar cliente por nombre..." },
              { label: "Sección Recientes", text: "muestra los diagnósticos de los últimos 30 días." },
              {
                label: "Columnas",
                text: "Fecha, Nombre del cliente, Edad, Modalidad, Ingresos netos, Egresos totales, ¿Cerrada y pagada? y Acciones (Consultar)."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: capturar un diagnóstico ADN",
            steps: [
              "Haz clic en Capturar Nuevo ADN › Iniciar captura.",
              "Elige la modalidad (Cuestionario Extendido, Resumen de Rubros o Ingreso y Gasto Total).",
              "Captura la información con tu cliente y guarda el diagnóstico."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Cada ADN completado cuenta para el Ranking de la promotoría."
          }
        ]
      },
      {
        id: "tips-taller",
        number: "12.5",
        title: "TIPS (Taller Integral de Planeación y Seguridad)",
        quickLink: "/tips",
        quickPath: "Herramientas › TIPS",
        purpose:
          "Permite dirigir talleres patrimoniales en vivo, al estilo de un juego interactivo: los asistentes escanean un código QR, avanzan paso a paso a tu ritmo y, al cierre, recibes los prospectos interesados («leads calientes») directamente en tu cartera y agenda.",
        howToReach: ["Haz clic en Herramientas › TIPS."],
        figures: [
          {
            number: 21,
            src: "/manual/figura-21.webp",
            caption: "Figura 21. TIPS: créditos disponibles y sesiones de taller."
          },
          {
            number: 22,
            src: "/manual/figura-22.webp",
            caption: "Figura 22. Sala de Modo Demo vista por un asistente."
          },
          {
            mockup: "tips-promotoria",
            caption: "Vista interactiva: Pestaña Toda mi Promotoría con el listado de talleres de todos los agentes."
          }
        ],
        screenElements: [
          {
            groupTitle: "Qué hay en la pantalla",
            items: [
              {
                label: "Créditos TIPS disponibles",
                text: "prospectos disponibles y vigencia de los créditos; Bolsa Personal y Bolsa Promotoría (compartida con los agentes autorizados)."
              },
              { label: "Acciones principales", text: "Comprar Créditos, Nueva Sesión y Configurar quién puede usar créditos de Promotoría." },
              { label: "Enlaces de prueba", text: "botones para créditos de prueba (+30 cr Prueba)." },
              {
                label: "Sesiones de Taller TIPS",
                text: "pestañas Mis Talleres y Toda mi Promotoría; botones Modo Demo / Práctica (Gratis), Actualizar, Permisos de Créditos y Parámetros y Crear Sesión en Vivo."
              },
              {
                label: "Tarjeta de sesión",
                text: "estado (por ejemplo, En curso · Paso 8/8 o Finalizada), Código, sede y fecha; contadores Conectados, Identificados, Terminaron 8/8 y Calientes; botones Dirigir Sesión (Host) o Ver Consola / Detalle, Proyector, Invitar, Embudo y descarga."
              },
              {
                label: "Modo Demo / Práctica",
                text: "Con Modo Demo / Práctica (Gratis) abres una sala de capacitación que no consume créditos. Se abre en una pestaña nueva con la vista del asistente: cada participante escribe su nombre o apodo y entra con Entrar al Taller."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: dar un taller en vivo",
            steps: [
              "Haz clic en Crear Sesión en Vivo (o Nueva Sesión).",
              "Completa los datos de la sesión que solicite la plataforma.",
              "En la tarjeta de la sesión, abre Proyector en la pantalla del salón para que los asistentes escaneen el QR.",
              "Usa Dirigir Sesión (Host) para avanzar los pasos del taller.",
              "Al terminar, revisa Calientes y el Embudo; los prospectos llegan a tu cartera (filtro Prospectos TIPS del Directorio y Origen: TIPS en Oportunidades de Venta)."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Practica primero en Modo Demo antes de tu primer taller con clientes reales."
          }
        ]
      },
      {
        id: "plan-de-arranque",
        number: "12.6",
        title: "Plan de Arranque",
        quickLink: "/plan-arranque",
        quickPath: "Herramientas › Plan de Arranque",
        purpose:
          "Es la ruta de formación paso a paso para agentes (en pantalla, «Tu Ruta de Éxito»). Cada módulo incluye objetivos, video, material adjunto y una evaluación que debes aprobar para avanzar.",
        howToReach: ["Haz clic en Herramientas › Plan de Arranque."],
        figures: [
          {
            number: 23,
            src: "/manual/figura-23.webp",
            caption: "Figura 23. Plan de Arranque: ruta de módulos y contenido del módulo actual."
          }
        ],
        screenElements: [
          {
            groupTitle: "Qué hay en la pantalla",
            items: [
              { label: "Tu Ruta de Éxito (columna izquierda)", text: "los módulos numerados; el módulo actual aparece resaltado." },
              { label: "Encabezado", text: "«Módulo n de N» y el porcentaje Completado global." },
              {
                label: "Contenido del módulo",
                text: "título, objetivos, Video del módulo y Material Adjunto (con Abrir en nueva pestaña)."
              },
              {
                label: "Evaluación del Módulo",
                text: "preguntas de opción múltiple; se requiere un mínimo de 100% de aciertos para avanzar."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: completar un módulo",
            steps: [
              "Abre el módulo resaltado en Tu Ruta de Éxito.",
              "Mira el video y revisa el material adjunto.",
              "Realiza las actividades indicadas.",
              "Responde la evaluación; al aprobarla avanzas al siguiente módulo."
            ]
          }
        ],
        tips: [
          {
            type: "NOTA",
            text: "Los módulos y su orden los define el administrador en Admin › Admin P. Arranque (ver 14.5)."
          }
        ]
      },
      {
        id: "academia",
        number: "12.7",
        title: "Academia",
        quickLink: "/academia",
        quickPath: "Herramientas › Academia",
        purpose:
          "Centro de capacitación y formación profesional para agentes y promotores de seguros. Incluye simuladores para la certificación de la CNSF y la Academia PRO de entrenamiento de llamadas con inteligencia artificial.",
        howToReach: ["Haz clic en Herramientas › Academia."],
        figures: [
          {
            number: 24,
            src: "/manual/figura-24.webp",
            caption: "Figura 24. Academia: simuladores Cédula A, Cédula B y Academia PRO."
          },
          {
            number: 25,
            src: "/manual/figura-25.webp",
            caption: "Figura 25. Hub de Entrenamiento IA (ranking de la agencia cubierto)."
          },
          {
            number: 26,
            src: "/manual/figura-26.webp",
            caption: "Figura 26. Portal del simulador Cédula A, vista Promotor (lista de agentes cubierta)."
          },
          {
            number: 27,
            src: "/manual/figura-27.webp",
            caption: "Figura 27. Portal del simulador Cédula B, vista Promotor."
          }
        ],
        tables: [
          {
            headers: ["Tarjeta", "Descripción", "Botón"],
            rows: [
              [
                "Simulador Cédula A (Oficial CNSF)",
                "Preparación para la certificación oficial: módulos de estudio interactivos, explicaciones por voz y simulacros de examen.",
                "Ingresar al Portal"
              ],
              [
                "Simulador Cédula B (Oficial CNSF)",
                "Entrenamiento para la Cédula B (Riesgos Empresariales de Personas y Daños): módulos interactivos, explicaciones técnicas y exámenes de práctica.",
                "Ingresar al Portal"
              ],
              [
                "Academia PRO (IA · Voz en vivo)",
                "Entrena llamadas telefónicas con prospectos simulados por IA: supera objeciones, aplica la regla de diagnóstico y concreta citas.",
                "Entrar a la Academia PRO"
              ]
            ]
          }
        ],
        screenElements: [
          {
            groupTitle: "Academia PRO: simulador de llamadas (Hub de Entrenamiento IA)",
            items: [
              { label: "Bolsa Agencia", text: "minutos disponibles para la promotoría, y botón Recargar Minutos." },
              { label: "Tarjeta de nivel", text: "nivel actual, XP totales, racha y progreso hacia el siguiente nivel." },
              { label: "Ver Álbum de Insignias", text: "muestra las medallas desbloqueadas." },
              {
                label: "Disciplinas con botón Iniciar Misión",
                text: "Llamada de Prospección, Análisis de Necesidades (ADN) y Objeciones y Cierre."
              },
              { label: "Ranking de la Agencia", text: "top 10 por XP y Beneficios por Nivel." }
            ]
          },
          {
            groupTitle: "Portales Cédula A y Cédula B (Panel de Control del Promotor)",
            items: [
              {
                label: "Días de Acceso para tu Estructura",
                text: "días incluidos en tu suscripción y disponibles para asignar; botón Comprar Paquete para adquirir días adicionales."
              },
              {
                label: "Indicadores",
                text: "Agentes en Práctica, Tiempo Total Acumulado y Aprobación Simulador."
              },
              {
                label: "Estructura de Agentes y Control de Acceso",
                text: "columnas Agente, Tiempo de Estudio, Evaluaciones Realizadas, Promedio Simulador, Días Restantes, Estado y Acciones, para asignar tiempo de práctica a tus asesores."
              },
              {
                label: "Menú lateral",
                text: "Dashboard Promotor, Reportes de Agentes y Volver a la Academia."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: entrenar en Academia PRO",
            steps: [
              "Abre Academia › Entrar a la Academia PRO.",
              "Elige una disciplina disponible para tu nivel y haz clic en Iniciar Misión.",
              "Realiza la llamada simulada con el prospecto de IA.",
              "Revisa tu evaluación; tu XP y tu nivel se actualizan."
            ]
          }
        ]
      },
      {
        id: "proyecto-200",
        number: "12.8",
        title: "Proyecto 200 (CRM, Piloto Automático de Prospección y Tanques de Gasolina)",
        quickLink: "/proyecto-200",
        quickPath: "Herramientas › Proyecto 200",
        purpose:
          "Es el sistema vivo de prospección y ejecución secuencial de tu promotoría (metodología LIMRA / MDRT Project 200). Permite construir tu inventario inicial de 200 contactos, mantener siempre tu Tanque de Gasolina Comercial con al menos 100 prospectos calificados activos y ejecutar llamadas diarias en modo Piloto Automático con la regla «Teléfono Primero».",
        howToReach: ["En el menú superior, haz clic en Herramientas › Proyecto 200 (o accede directamente a /proyecto-200)."],
        description: [
          "Proyecto 200 transforma la tradicional lista estática de Excel en un motor inteligente que ordena tu cola de llamadas según el sueldo estimado, la probabilidad de cierre y el origen del referido.",
          "Cuenta con dos termómetros superiores en tiempo real: 1) Inventario Total (Meta 200 contactos registrados) y 2) Tanque de Gasolina Comercial (Meta mínima de 100 prospectos calificados y no descalificados vivos, combinando Contactos Base + Referidos)."
        ],
        figures: [
          {
            mockup: "proyecto-200",
            caption: "Vista interactiva: Módulo Proyecto 200 con Tanques de Gasolina Comercial, Piloto Automático de Llamadas y Candado Anti-WhatsApp."
          }
        ],
        tables: [
          {
            headers: ["Pestaña del módulo", "Para qué sirve"],
            rows: [
              [
                "1. Piloto Automático de Prospección",
                "Estación de llamadas uno por uno. Te presenta al prospecto de mayor prioridad, su guion personalizado y el botón Llamar Ahora. Incluye el candado «Teléfono Primero» que bloquea WhatsApp en el 1er toque hasta haber marcado por teléfono."
              ],
              [
                "2. Directorio & CRM (200)",
                "Tabla completa de tus contactos con filtros por clasificación (Prospecto, Centro de Influencia / Referidor, Descalificado), estatus y buscador rápido."
              ],
              [
                "3. Carga Masiva Excel",
                "Descarga la plantilla oficial .xlsx y sube tus 200 contactos de golpe con validación automática y prevención de teléfonos duplicados."
              ],
              [
                "4. Guiones & Reglas de Oro",
                "Manual práctico de prospección telefónica, manejo de objeciones en vivo y guion para desarrollar Centros de Influencia (Referidores)."
              ],
              [
                "5. Auditoría Dirección (solo Admin)",
                "Tablero ejecutivo con los Tanques de Gasolina Comercial de cada asesor, barra de Contactos Base vs. Referidos vs. Descalificados, semáforo de uso Teléfono vs. WhatsApp y selector para activar u ocultar agentes del seguimiento."
              ]
            ]
          }
        ],
        screenElements: [
          {
            groupTitle: "Reglas de Oro del Customer Journey en Proyecto 200",
            items: [
              {
                label: "Regla Teléfono Primero (Candado Anti-WhatsApp en 1er toque)",
                text: "En el primer contacto está bloqueado el envío de mensajes en frío por WhatsApp. Primero debes hacer clic en Llamar Ahora; solo si el prospecto no contesta se habilita el botón «WhatsApp de Rescate (Doble Toque)» para acordar una llamada de 2 minutos."
              },
              {
                label: "Puente automático con Encuesta de Satisfacción (4 SÍes)",
                text: "Los referidos capturados en Herramientas › Encuesta de satisfacción aparecen automáticamente en un banner superior dentro de Proyecto 200 listos para calificarse e inyectarse al tope de tu cola de llamadas."
              },
              {
                label: "Sincronización con 25 Puntos y Agenda",
                text: "Cada llamada o cita agendada desde el Piloto Automático suma puntos automáticamente en tu módulo de Actividad 25 Puntos y crea el evento en tu agenda."
              },
              {
                label: "Tablero de Tanques de Gasolina Comercial (Dirección)",
                text: "Muestra el nivel de combustible de cada asesor sobre 100 prospectos calificados: 🟢 Óptimo (≥100 calificados, 4-5 semanas de ritmo), 🟡 Medio (65-99, momento de pedir referidos), 🟠 En Reserva (35-64, menos de 10 días) y 🔴 Peligro de Paro (<35). Además permite activar u ocultar agentes del tablero sin desactivar su cuenta."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: cargar tus 200 contactos y usar el Piloto Automático",
            steps: [
              "Abre Herramientas › Proyecto 200 y entra a la pestaña Carga Masiva Excel para descargar la plantilla oficial o agrega contactos con + Nuevo Contacto.",
              "Sube tu archivo Excel; el sistema calculará automáticamente el puntaje de prioridad (0 a 100) de cada contacto.",
              "Ve a la pestaña Piloto Automático de Prospección, haz clic en Llamar Ahora y utiliza el guion en pantalla.",
              "Al colgar, registra el resultado en el panel derecho (¡Cita de Diagnóstico Agendada!, No Contestó / Buzón, Rescate por WhatsApp tras llamada, Clasificar como Referidor o Descalificar con motivo obligatorio) para avanzar automáticamente al siguiente prospecto."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Por cada prospecto que descalifiques o cierres, pide al menos 2 referidos nuevos para que tu Tanque de Gasolina Comercial nunca baje de 100 prospectos calificados activos."
          }
        ]
      }
    ]
  },
  {
    id: "ia-asistente",
    number: "13",
    title: "Inteligencia Artificial Avanzada: Asistente",
    subtitle: "Asistente conversacional entrenado con los cuadernos, lineamientos y pólizas de tu promotoría.",
    iconName: "Bot",
    roleBadge: "Todos",
    quickLink: "/assistant",
    quickPath: "Inteligencia Artificial Avanzada › Asistente",
    purpose:
      "Asistente conversacional que funciona con el motor de inteligencia artificial de aacomsoft, para resolver dudas comerciales y técnicas. Responde con base en los lineamientos, cuadernos y condiciones que la promotoría carga en la plataforma.",
    howToReach: [
      "En el menú superior, haz clic en Inteligencia Artificial Avanzada.",
      "Elige Asistente."
    ],
    figures: [
      {
        mockup: "asistente-ia",
        caption: "Vista interactiva: Pantalla de chat del Asistente de IA con preguntas sugeridas y aviso de verificación."
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: consultar al Asistente IA",
        steps: [
          "Abre el asistente.",
          "Elige una pregunta sugerida o escribe la tuya en el cuadro de texto.",
          "Envía la pregunta y lee la respuesta."
        ]
      }
    ],
    tips: [
      {
        type: "CONSEJO",
        text: "Verifica siempre la información sensible (condiciones, montos, requisitos) contra los documentos oficiales antes de compartirla con un cliente."
      },
      {
        type: "NOTA",
        text: "Los documentos que usa el asistente los administra la promotoría en Dashboard Admin › Asistente (Conocimiento) (ver 14.4.7)."
      }
    ]
  },
  {
    id: "administracion",
    number: "14",
    title: "Administración",
    subtitle: "Panel directivo para controlar producción, referidores, votaciones, configuración y reportes.",
    iconName: "Settings",
    roleBadge: "Admin",
    quickLink: "/admin",
    quickPath: "Menú superior › Admin",
    introParagraphs: [
      "El menú Admin ▾ solo aparece para los administradores de la promotoría. Contiene: Producción & Primas, Referidores, Votaciones, Dashboard Admin, Admin P. Arranque y Reportes. Para abrir cualquier opción, haz clic en Admin en el menú superior y elige la opción."
    ],
    subsections: [
      {
        id: "admin-produccion-primas",
        number: "14.1",
        title: "Producción & Primas",
        roleBadge: "Admin",
        quickLink: "/admin/produccion",
        quickPath: "Admin › Producción & Primas",
        purpose:
          "Controla las emisiones y primas por aseguradora y el avance de cada asesor contra su presupuesto mensual PEA (Planeación Estratégica de Actividad).",
        howToReach: ["Haz clic en Admin › Producción & Primas."],
        figures: [
          {
            number: 28,
            src: "/manual/figura-28.webp",
            caption: "Figura 28. Resultados de Producción: indicadores y tabla por asesor y aseguradora (montos y nombres cubiertos)."
          }
        ],
        screenElements: [
          {
            groupTitle: "Qué hay en la pantalla",
            items: [
              {
                label: "Pestañas",
                text: "Dashboard de Resultados, Ingreso de Pólizas (con contador de pendientes) y Aseguradoras & Logos."
              },
              {
                label: "Filtros y acciones",
                text: "mes, año y promotoría; botones Sincronizar PEA, Descargar CSV y actualizar."
              },
              { label: "Banner del mes", text: "muestra la tasa global de cumplimiento." },
              {
                label: "Indicadores",
                text: "Total de Pólizas, Prima Emitida (PE), Prima Pagada (PPC/PP) y Presupuesto PEA (Meta)."
              },
              {
                label: "Tabla de Emisiones por Asesor y Aseguradora",
                text: "para cada aseguradora, pólizas (PÓL.), PE y PPC; Totales Generales, Presupuesto PEA y % Avance. Haz clic en el lápiz de presupuesto para editar la meta de un asesor."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: revisar la producción del mes",
            steps: [
              "Elige el mes y el año.",
              "Revisa los indicadores generales.",
              "Consulta la tabla para ver el avance de cada asesor.",
              "Para editar la meta de un asesor, haz clic en el lápiz de su presupuesto.",
              "Descarga la información con Descargar CSV."
            ]
          }
        ],
        tips: [
          {
            type: "CONSEJO",
            text: "Usa Ingreso de Pólizas para revisar las pólizas pendientes y Aseguradoras & Logos para mantener actualizado el catálogo de aseguradoras de la tabla."
          }
        ]
      },
      {
        id: "admin-referidores",
        number: "14.2",
        title: "Referidores",
        roleBadge: "Admin",
        quickLink: "/admin/referidores",
        quickPath: "Admin › Referidores",
        purpose: "Gestiona los referidores de la promotoría y monitorea su actividad diaria de 15 puntos.",
        howToReach: ["Haz clic en Admin › Referidores."],
        figures: [
          {
            number: 29,
            src: "/manual/figura-29.webp",
            caption: "Figura 29. Administración de Referidores."
          }
        ],
        screenElements: [
          {
            items: [
              { label: "Total Referidores", text: "contador." },
              { label: "Alta de Referidor", text: "da de alta un referidor y lo asigna a un agente." },
              { label: "Columnas", text: "Referidor, Agente Asignado, Estado y Pts. Hoy." }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: dar de alta un referidor",
            steps: [
              "Haz clic en Alta de Referidor.",
              "Captura los datos solicitados y asigna el agente.",
              "Guarda; el referidor aparecerá en la tabla y en Mis Referidores del agente asignado."
            ]
          }
        ]
      },
      {
        id: "admin-votaciones",
        number: "14.3",
        title: "Votaciones (Mejoras de Plataforma)",
        roleBadge: "Admin",
        quickLink: "/votaciones",
        quickPath: "Admin › Votaciones",
        purpose:
          "Muestra las propuestas de mejora de la plataforma publicadas para votación. Cuando no hay propuestas aparece «No hay votaciones activas».",
        howToReach: ["Haz clic en Admin › Votaciones."],
        figures: [
          {
            number: 30,
            src: "/manual/figura-30.webp",
            caption: "Figura 30. Mejoras de Plataforma sin votaciones activas."
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: emitir tu voto",
            steps: [
              "Abre Votaciones.",
              "Si hay una propuesta activa, elige tu opción y emite tu voto."
            ]
          }
        ]
      },
      {
        id: "dashboard-admin",
        number: "14.4",
        title: "Dashboard Admin (Administración de Cotizaciones)",
        roleBadge: "Admin",
        quickLink: "/admin",
        quickPath: "Admin › Dashboard Admin",
        purpose:
          "Es el panel central de administración: auditoría y rescate de propuestas, productividad comercial de los agentes y configuración de la plataforma de la promotoría. Se organiza en 14 pestañas.",
        howToReach: [
          "Haz clic en Admin › Dashboard Admin.",
          "Elige la pestaña. Usa la barra de desplazamiento horizontal bajo las pestañas para ver las que no caben en pantalla."
        ],
        screenElements: [
          {
            groupTitle: "Elementos comunes a todas las pestañas",
            items: [
              { label: "Actualizar Datos", text: "recarga la información." },
              {
                label: "Valor de la UDI Predeterminado",
                text: "define el valor que se muestra en el formulario inicial del cotizador. Escribe el valor y haz clic en Fijar Tasa."
              }
            ]
          },
          {
            groupTitle: "14.4.1 Productividad de Agentes",
            items: [
              {
                label: "Campaña de premiación (Ranking #1)",
                text: "sube una imagen (JPG, PNG o GIF, hasta 5 MB) para incentivar a los agentes; se muestra en la parte superior de su pantalla de Ranking."
              },
              { label: "Mix de productos cotizados (global)", text: "participación de cada producto en las cotizaciones." },
              { label: "Métricas rápidas", text: "Agentes activos (con al menos una cotización) y Volumen primas global." },
              {
                label: "Tabla de Productividad de Agentes",
                text: "Agente, Total Cotizaciones, Este Mes, Mes Pasado, Este Año, Prima Promedio, Producto Más Cotizado y Estadística de Cotizaciones (4 semanas)."
              }
            ]
          },
          {
            groupTitle: "14.4.2 Historial de Cotizaciones",
            items: [
              { label: "Indicadores", text: "Cotizaciones filtradas, Volumen primas, Ahorro proyectado y Prima promedio." },
              { label: "Filtros", text: "buscador por cliente, teléfono o agente; filtros de producto, periodo y año." },
              {
                label: "Registro Histórico de Cotizaciones",
                text: "agrupado por mes, con columnas Cliente, Teléfono, Producto, Prima Anual, Prima Total, Ahorro Proyectado (65), Rendimiento (65), Agente, Fecha y Rescatar (para recuperar e imprimir la propuesta)."
              }
            ]
          },
          {
            groupTitle: "14.4.3 Gestión de Agentes",
            items: [
              {
                label: "Crear cuenta de usuario",
                text: "crea credenciales oficiales (Nombre completo, Correo electrónico, Teléfono, Contraseña mínimo 6 caracteres y Rol de acceso) con el botón Registrar Cuenta."
              },
              {
                label: "Cuentas de usuarios con acceso (login)",
                text: "permite activar o suspender cuentas, redefinir contraseñas y eliminar credenciales. Columnas Usuario, Contacto, Rol, Estatus y Acciones."
              },
              { label: "Capacidad", text: "número de asientos de tu plan, con el botón Gestionar Asientos Extras." }
            ]
          },
          {
            groupTitle: "14.4.4 Diagnóstico ADN",
            items: [
              {
                label: "Auditoría de ADNs",
                text: "Indicadores de ADNs realizados, cierres y efectividad; filtros por mes, año y agente; historial de ADN por cliente."
              }
            ]
          },
          {
            groupTitle: "14.4.5 Banners de Inicio",
            items: [
              {
                label: "Subir nuevo comunicado",
                text: "Enlace opcional (URL al hacer clic) y Seleccionar imagen (JPG, PNG o GIF, menor de 5 MB)."
              },
              {
                label: "Galería de banners de Inicio",
                text: "cada banner muestra su fecha de carga y estado (ACTIVO), flechas para cambiar el orden y botones Pausar y Eliminar."
              }
            ]
          },
          {
            groupTitle: "14.4.6 Actividad 25",
            items: [
              { label: "Reporte de actividad comercial 25", text: "audita la actividad diaria, llamadas y prospectos de tus agentes." },
              { label: "Filtros e indicadores", text: "Filtrar por agente, Fecha inicio, Fecha fin; Total puntos sumados, Días con actividad y Promedio de puntos diario." },
              { label: "Desglose por agente", text: "citas efectivas, citas agendadas y puntos; despliega cada fila para ver el detalle." }
            ]
          },
          {
            groupTitle: "14.4.7 Asistente (Conocimiento)",
            items: [
              {
                label: "Cargar lineamiento / cuaderno",
                text: "Título del documento, Extraer texto desde PDF (opcional) y Contenido del lineamiento. Botón Guardar Documento."
              },
              { label: "Documentos de entrenamiento activos", text: "cada documento tiene botones Editar, Pausar y Eliminar." }
            ]
          },
          {
            groupTitle: "14.4.8 Push Notifications",
            items: [
              {
                label: "Notificaciones automáticas (sistema)",
                text: "Validación 25 Puntos (lunes a viernes, 5:00 p. m.) y Planeación Diaria (lunes a viernes, 8:30 a. m.), cada una con su botón de encendido."
              },
              {
                label: "Enviar o programar notificación push",
                text: "Destinatarios (Todos los agentes o selección individual), Mensaje a mostrar (hasta 150 caracteres), ¿Cuándo enviar?, Hora (México) y PIN de autorización."
              }
            ]
          },
          {
            groupTitle: "14.4.9 Biblioteca de Documentos",
            items: [
              {
                label: "Catálogo de Packs Oficiales",
                text: "habilita con el interruptor los manuales y documentos globales que deben ver los agentes de tu promotoría."
              },
              {
                label: "Documentos internos de la agencia",
                text: "sube guías y políticas exclusivas para tu equipo; muestra el almacenamiento usado y la lista de Archivos subidos."
              }
            ]
          },
          {
            groupTitle: "14.4.10 a 14.4.14 (Encuestas, Producción, NPS, Votaciones y Cotizador)",
            items: [
              {
                label: "14.4.10 Encuestas & Referidos",
                text: "indicadores de encuestas, referidos, prospección, propuestas y cerrados; tabla con Asesor, Agencia, Encuestas, Referidos, Contactados, Agendados, Propuestas, Cerrados, Efectividad y Acción."
              },
              { label: "14.4.11 Producción & Primas", text: "misma vista que Admin › Producción & Primas (ver 14.1)." },
              {
                label: "14.4.12 Calidad (NPS)",
                text: "calificación promedio (escala de 5 estrellas), distribución por estrellas y tabla con Usuario, Agencia, Rating, Comentarios, Permiso de contacto y Fecha."
              },
              {
                label: "14.4.13 Control de Votaciones",
                text: "formulario Lanzar nueva encuesta (título, pregunta, opciones, Agregar Opción y Publicar) y tabla de resultados con Opción, Votos y %."
              },
              {
                label: "14.4.14 Cotizador",
                text: "Compañía de Seguros (Vida), Productos Habilitados (ej. VPL, VPL PPR), opción Mostrar columna «Prima en Pesos Acumulada» y botón Guardar Ajustes."
              }
            ]
          }
        ],
        tables: [
          {
            headers: ["#", "Pestaña", "Para qué sirve"],
            rows: [
              ["1", "Productividad de Agentes", "Campaña de premiación, mix de productos cotizados y productividad por agente."],
              ["2", "Historial de Cotizaciones", "Registro de todas las cotizaciones, con rescate de propuestas."],
              ["3", "Gestión de Agentes", "Crear y administrar cuentas de usuario."],
              ["4", "Diagnóstico ADN", "Indicadores e historial de ADN por cliente."],
              ["5", "Banners de Inicio", "Comunicados de la pantalla Inicio."],
              ["6", "Actividad 25", "Reporte detallado de actividad diaria."],
              ["7", "Asistente (Conocimiento)", "Documentos con los que aprende el asistente de IA."],
              ["8", "Push Notifications", "Notificaciones automáticas y programadas."],
              ["9", "Biblioteca de Documentos", "Packs oficiales y documentos internos."],
              ["10", "Encuestas & Referidos", "Resultados de las encuestas de satisfacción."],
              ["11", "Producción & Primas", "Misma vista que Admin › Producción & Primas."],
              ["12", "Calidad (NPS)", "Calificaciones y comentarios de satisfacción."],
              ["13", "Control de Votaciones", "Publicación de encuestas y resultados."],
              ["14", "Cotizador", "Parámetros del cotizador."]
            ]
          }
        ],
        figures: [
          {
            number: 31,
            src: "/manual/figura-31.webp",
            caption: "Figura 31. Pestaña Productividad de Agentes (nombres y montos cubiertos)."
          },
          {
            number: 32,
            src: "/manual/figura-32.webp",
            caption: "Figura 32. Pestaña Historial de Cotizaciones (clientes y montos cubiertos)."
          },
          {
            number: 33,
            src: "/manual/figura-33.webp",
            caption: "Figura 33. Pestaña Gestión de Agentes (lista de usuarios cubierta)."
          },
          {
            mockup: "admin-adn",
            caption: "Vista interactiva (14.4.4): Pestaña Diagnóstico ADN con indicadores de efectividad e historial."
          },
          {
            number: 34,
            src: "/manual/figura-34.webp",
            caption: "Figura 34. Pestaña Banners de Inicio (imágenes pixeladas)."
          },
          {
            number: 35,
            src: "/manual/figura-35.webp",
            caption: "Figura 35. Pestaña Actividad 25 (nombres de agentes cubiertos)."
          },
          {
            number: 36,
            src: "/manual/figura-36.webp",
            caption: "Figura 36. Pestaña Asistente (Conocimiento) (lista de documentos cubierta)."
          },
          {
            number: 37,
            src: "/manual/figura-37.webp",
            caption: "Figura 37. Pestaña Push Notifications (destinatarios cubiertos)."
          },
          {
            number: 38,
            src: "/manual/figura-38.webp",
            caption: "Figura 38. Pestaña Biblioteca de Documentos."
          },
          {
            mockup: "admin-encuestas",
            caption: "Vista interactiva (14.4.10): Pestaña Encuestas & Referidos con embudo de conversión."
          },
          {
            number: 39,
            src: "/manual/figura-39.webp",
            caption: "Figura 39. Pestaña Producción & Primas dentro del Dashboard Admin."
          },
          {
            mockup: "admin-nps",
            caption: "Vista interactiva (14.4.12): Pestaña Calidad (NPS) con calificación de 5 estrellas y comentarios."
          },
          {
            mockup: "admin-votaciones",
            caption: "Vista interactiva (14.4.13): Pestaña Control de Votaciones para lanzar encuestas y ver resultados."
          },
          {
            number: 40,
            src: "/manual/figura-40.webp",
            caption: "Figura 40. Pestaña Cotizador: parámetros del cotizador modular."
          }
        ]
      },
      {
        id: "admin-plan-arranque",
        number: "14.5",
        title: "Admin P. Arranque",
        roleBadge: "Admin",
        quickLink: "/admin/plan-arranque",
        quickPath: "Admin › Admin P. Arranque",
        purpose:
          "Configura el plan de desarrollo paso a paso que siguen tus agentes en Herramientas › Plan de Arranque.",
        howToReach: ["Haz clic en Admin › Admin P. Arranque."],
        figures: [
          {
            number: 41,
            src: "/manual/figura-41.webp",
            caption: "Figura 41. Configuración del Plan de Arranque."
          }
        ],
        screenElements: [
          {
            items: [
              { label: "Ver Avance de Agentes", text: "progreso de cada agente en el plan." },
              { label: "Añadir Módulo", text: "crea un nuevo módulo." },
              {
                label: "Temario del Plan",
                text: "columnas Módulo, Título, Recursos (enlaces y archivos), Candado (estado, por ejemplo Activo) y Acciones (subir, bajar, editar y eliminar)."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: configurar módulos del Plan de Arranque",
            steps: [
              "Haz clic en Añadir Módulo y captura título, recursos y evaluación.",
              "Ordena los módulos con las flechas de Acciones.",
              "Edita un módulo con el ícono de lápiz o elimínalo con el ícono de papelera.",
              "Consulta el progreso con Ver Avance de Agentes."
            ]
          }
        ]
      },
      {
        id: "admin-reportes",
        number: "14.6",
        title: "Reportes (Reporte de Actividad)",
        roleBadge: "Admin",
        quickLink: "/reportes",
        quickPath: "Admin › Reportes",
        purpose: "Resumen gerencial de la productividad del equipo por periodo.",
        howToReach: ["Haz clic en Admin › Reportes."],
        figures: [
          {
            number: 42,
            src: "/manual/figura-42.webp",
            caption: "Figura 42. Reporte de Actividad (datos de agentes cubiertos)."
          }
        ],
        screenElements: [
          {
            items: [
              { label: "Periodo", text: "fecha inicial y final." },
              { label: "Métricas Semanales", text: "buscador Buscar agente..., Filtrar Agentes y Exportar CSV." },
              {
                label: "Columnas",
                text: "Nombre del Agente, Puntos Totales, Citas Agendadas, Citas Efectivas, ADN's Realizados, Número de Llamadas, Pólizas Emitidas y Referidos Obtenidos."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: exportar reporte gerencial",
            steps: [
              "Define el periodo.",
              "Filtra o busca agentes si lo necesitas.",
              "Haz clic en Exportar CSV para descargar el reporte."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "mi-agencia-membresia",
    number: "15",
    title: "Mi Agencia SaaS, Mi Membresía y menú de usuario",
    subtitle: "Identidad visual, conexión IA, minutos de simulador, suscripción, facturación y tarjeta digital.",
    iconName: "Building2",
    roleBadge: "Todos",
    subsections: [
      {
        id: "mi-agencia-saas",
        number: "15.1",
        title: "Mi Agencia SaaS",
        roleBadge: "Admin",
        quickLink: "/admin/agencia",
        quickPath: "Foto de perfil › Mi Agencia SaaS",
        purpose:
          "Personaliza la marca de tu promotoría dentro de la plataforma (nombre, logotipo y color) y administra la conexión de IA y los minutos del simulador de la Academia PRO.",
        howToReach: ["Haz clic en tu foto de perfil.", "Elige Mi Agencia SaaS."],
        figures: [
          {
            number: 43,
            src: "/manual/figura-43.webp",
            caption: "Figura 43. Mi Agencia SaaS: identidad visual, logotipo e IA."
          }
        ],
        screenElements: [
          {
            items: [
              {
                label: "Identidad Visual",
                text: "Nombre de la Agencia y Color Primario (selector y código hexadecimal; se usa en botones, menús y elementos destacados). Botón Guardar Cambios."
              },
              {
                label: "Logotipo",
                text: "se recomienda PNG con fondo transparente; botón Seleccionar Nueva Imagen."
              },
              {
                label: "Inteligencia Artificial y Simulador (Academia PRO)",
                text: "Uso de tu Equipo Este Mes (minutos practicados) y Bolsa de Minutos (saldo prepagado o de cortesía); botones para comprar minutos, Gestionar Conexión de IA (BYOK y Motor) y Comprar Paquete de Minutos."
              }
            ]
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: personalizar tu agencia",
            steps: [
              "Escribe el nombre de tu promotoría y elige el color primario.",
              "Haz clic en Guardar Cambios.",
              "Sube tu logotipo con Seleccionar Nueva Imagen."
            ]
          }
        ]
      },
      {
        id: "mi-membresia",
        number: "15.2",
        title: "Mi Membresía",
        roleBadge: "Admin",
        quickLink: "/admin/suscripcion",
        quickPath: "Foto de perfil › Mi Membresía",
        description: [
          "Muestra el estado actual de la licencia (por ejemplo, Activa y días restantes), el programa Refiere y Gana con tu enlace único, un campo para cupón de descuento y los planes disponibles."
        ],
        figures: [
          {
            mockup: "mi-membresia",
            caption: "Vista interactiva: Panel Mi Membresía con estado de licencia, programa Refiere y Gana y planes."
          }
        ]
      },
      {
        id: "portal-de-pagos",
        number: "15.3",
        title: "Portal de Pagos",
        roleBadge: "Admin",
        quickLink: "/api/billing",
        quickPath: "Foto de perfil › Portal de Pagos",
        description: [
          "Desde el menú de usuario, Portal de Pagos abre el portal seguro de facturación de la suscripción (Stripe), donde se administran métodos de pago, facturas y recibos."
        ]
      },
      {
        id: "mi-tarjeta-digital",
        number: "15.4",
        title: "Mi Tarjeta Digital",
        roleBadge: "Todos",
        quickPath: "Foto de perfil › Mi Tarjeta Digital",
        description: [
          "Ventana con tu tarjeta de presentación digital: nombre, rol, código QR, teléfono y correo, con el botón Descargar Contacto (archivo .vcf) para guardar tus datos en la agenda del teléfono."
        ],
        figures: [
          {
            mockup: "mi-tarjeta-digital",
            caption: "Vista interactiva: Tarjeta de presentación digital con código QR y descarga de contacto (.vcf)."
          }
        ],
        stepGroups: [
          {
            title: "Paso a paso: compartir tu tarjeta digital",
            steps: [
              "Haz clic en tu foto de perfil y elige Mi Tarjeta Digital.",
              "Muestra el código QR a tu prospecto o descarga el contacto con Descargar Contacto."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "ayuda-y-soporte",
    number: "16",
    title: "Ayuda y Soporte",
    subtitle: "Manual de usuario interactivo y sistema de tickets para soporte o desarrollos a la medida.",
    iconName: "LifeBuoy",
    roleBadge: "Todos",
    quickLink: "/support?tab=ticket",
    quickPath: "Foto de perfil › Ayuda y Soporte",
    purpose:
      "Reúne el manual de usuario y el sistema de tickets para reportar problemas o hacer solicitudes al equipo de soporte de aacomsoft.",
    howToReach: ["Haz clic en tu foto de perfil.", "Elige Ayuda y Soporte."],
    figures: [
      {
        mockup: "ayuda-soporte",
        caption: "Vista interactiva: Centro de Ayuda y Soporte con formulario Levantar Nuevo Ticket y seguimiento."
      }
    ],
    stepGroups: [
      {
        title: "Paso a paso: levantar un ticket",
        steps: [
          "Abre Ayuda y Soporte y selecciona la pestaña Levantar Ticket.",
          "En Levantar Nuevo Ticket, escribe un asunto claro.",
          "Describe el problema: qué hacías, en qué pantalla y qué mensaje apareció.",
          "Adjunta una captura de pantalla si es posible (también puedes pegarla con Ctrl+V).",
          "Envía el ticket y da seguimiento."
        ]
      }
    ],
    tips: [
      {
        type: "CONSEJO",
        text: "El botón Cotizar Desarrollo de la pantalla Inicio también te trae aquí para solicitar desarrollos a la medida."
      }
    ]
  }
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: "ADN",
    meaning: "Diagnóstico financiero y patrimonial del cliente que se realiza en Herramientas › ADN (captura de ingresos y gastos).",
    category: "Módulos",
    relatedChapterId: "herramientas"
  },
  {
    term: "Aniversario",
    meaning: "Fecha anual de la póliza (Vida Individual). En GMM, Autos y Daños se habla de renovación del contrato.",
    category: "Seguros y Coberturas",
    relatedChapterId: "mi-cartera"
  },
  {
    term: "Blindaje",
    meaning: "Porcentaje que indica el nivel de protección de un cliente según los ramos que ya tiene contratados.",
    category: "Métricas y Procesos",
    relatedChapterId: "mi-cartera"
  },
  {
    term: "BYOK",
    meaning: "Opción para conectar la IA de la promotoría con una llave propia («bring your own key»).",
    category: "Tecnología",
    relatedChapterId: "mi-agencia-membresia"
  },
  {
    term: "Cédula A / Cédula B",
    meaning: "Certificaciones de la CNSF para agentes de seguros. La Cédula B corresponde a Riesgos Empresariales de Personas y Daños.",
    category: "Seguros y Coberturas",
    relatedChapterId: "herramientas"
  },
  {
    term: "CNSF",
    meaning: "Comisión Nacional de Seguros y Fianzas.",
    category: "Seguros y Coberturas",
    relatedChapterId: "herramientas"
  },
  {
    term: "CSV",
    meaning: "Formato de archivo de datos que se abre con Excel u hojas de cálculo.",
    category: "Tecnología",
    relatedChapterId: "mi-cartera"
  },
  {
    term: "EPP",
    meaning: "Exención de Pago de Primas por ITP (cobertura adicional).",
    category: "Seguros y Coberturas",
    relatedChapterId: "herramientas"
  },
  {
    term: "GMM",
    meaning: "Gastos Médicos Mayores.",
    category: "Seguros y Coberturas",
    relatedChapterId: "mi-cartera"
  },
  {
    term: "ITP",
    meaning: "Invalidez Total y Permanente (cobertura adicional).",
    category: "Seguros y Coberturas",
    relatedChapterId: "herramientas"
  },
  {
    term: "Lead caliente",
    meaning: "Prospecto que mostró interés durante un taller TIPS.",
    category: "Métricas y Procesos",
    relatedChapterId: "herramientas"
  },
  {
    term: "MA / MAPO",
    meaning: "Muerte Accidental / Muerte Accidental con Pérdidas Orgánicas (coberturas adicionales).",
    category: "Seguros y Coberturas",
    relatedChapterId: "herramientas"
  },
  {
    term: "PE",
    meaning: "Prima Emitida.",
    category: "Métricas y Procesos",
    relatedChapterId: "administracion"
  },
  {
    term: "JEP",
    meaning: "Junta Estratégica de Productividad.",
    category: "Métricas y Procesos",
    relatedChapterId: "pea-prp-jep"
  },
  {
    term: "PEA",
    meaning: "Planeación Estratégica de Actividad. En Producción & Primas, el «Presupuesto PEA» es la meta mensual de cada asesor contra la que se mide el % de avance.",
    category: "Métricas y Procesos",
    relatedChapterId: "pea-prp-jep"
  },
  {
    term: "PPC / PP",
    meaning: "Prima pagada.",
    category: "Métricas y Procesos",
    relatedChapterId: "administracion"
  },
  {
    term: "PPR",
    meaning: "Plan Personal de Retiro.",
    category: "Seguros y Coberturas",
    relatedChapterId: "mi-cartera"
  },
  {
    term: "PRP",
    meaning: "Planeación Recurrente de Productividad.",
    category: "Métricas y Procesos",
    relatedChapterId: "pea-prp-jep"
  },
  {
    term: "Proyecto 200",
    meaning: "Sistema vivo de prospección y CRM secuencial (Herramientas › Proyecto 200) donde el asesor construye su inventario de 200 contactos, mantiene su Tanque de Gasolina con al menos 100 calificados activos y ejecuta llamadas en Piloto Automático bajo la regla Teléfono Primero.",
    category: "Módulos",
    relatedChapterId: "herramientas"
  },
  {
    term: "Tanque de Gasolina Comercial",
    meaning: "Indicador de Proyecto 200 que mide cuántos prospectos calificados y no descalificados (Contactos Base + Referidos) tiene activos un asesor sobre la meta mínima de 100 para sostener su ritmo de citas.",
    category: "Métricas y Procesos",
    relatedChapterId: "herramientas"
  },
  {
    term: "RDA",
    meaning: "Referido de Asesor (actividad que suma 8 puntos en 25 puntos).",
    category: "Métricas y Procesos",
    relatedChapterId: "25-puntos"
  },
  {
    term: "Referidor",
    meaning: "Persona que refiere prospectos a un agente; se registra en Admin › Referidores.",
    category: "Módulos",
    relatedChapterId: "mis-referidores"
  },
  {
    term: "TIPS",
    meaning: "Taller Integral de Planeación y Seguridad: taller patrimonial en vivo.",
    category: "Módulos",
    relatedChapterId: "herramientas"
  },
  {
    term: "UDI",
    meaning: "Unidad de Inversión, valor de referencia que se actualiza con la inflación.",
    category: "Seguros y Coberturas",
    relatedChapterId: "newsletters"
  },
  {
    term: "VPL",
    meaning: "Vida Pagos Limitados.",
    category: "Seguros y Coberturas",
    relatedChapterId: "herramientas"
  },
  {
    term: "XP",
    meaning: "Puntos de experiencia que se ganan en el simulador de la Academia PRO y determinan tu nivel.",
    category: "Métricas y Procesos",
    relatedChapterId: "primeros-pasos"
  }
];
