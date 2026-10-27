export interface ManualVideoItem {
  key: string;
  episodeNumber: string;
  title: string;
  shortModuleTitle: string;
  subtitle: string;
  duration: string;
  roleBadge: "Todos" | "Agente" | "Admin";
  videoUrl: string;
  blobUrl: string;
  posterUrl: string;
  quickLink: string;
  modulePaths: string[];
  manualChapterIds: string[];
  highlights: string[];
}

export const MANUAL_VIDEOS_CATALOG: ManualVideoItem[] = [
  {
    key: "ep00",
    episodeNumber: "00",
    title: "Cómo crear y configurar tu cuenta paso a paso",
    shortModuleTitle: "Registro y Configuración Inicial",
    subtitle: "Activa tu prueba gratis de 5 días, personaliza tu logotipo, color institucional y WhatsApp de soporte.",
    duration: "2:04",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/ep00",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_00_como_crear_tu_cuenta_aacomsoft_AAA.mp4",
    posterUrl: "/manual/posters/ep00.png",
    quickLink: "/registro",
    modulePaths: ["/registro"],
    manualChapterIds: ["introduccion", "acceso-y-navegacion"],
    highlights: [
      "Paso 1: Datos del Administrador y seguridad de contraseña",
      "Paso 2: Identidad de tu Promotoría o Despacho y WhatsApp",
      "Paso 3: Logotipo oficial y paleta de color en tiempo real",
      "Paso 4: Verificación por código de 6 dígitos y 5 días gratis"
    ]
  },
  {
    key: "mod01",
    episodeNumber: "01",
    title: "Módulo de Inicio: Campañas, Avisos y Cumpleaños",
    shortModuleTitle: "Módulo de Inicio",
    subtitle: "Tu sala de bienvenida diaria: revisa comunicados de tu promotoría, haz zoom a los bonos y felicita a los cumpleañeros.",
    duration: "1:29",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod01",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod01_inicio_campanas_AAA.mp4",
    posterUrl: "/manual/posters/mod01.png",
    quickLink: "/",
    modulePaths: ["/"],
    manualChapterIds: ["inicio", "acceso-y-navegacion"],
    highlights: [
      "Tip de oro: clic en el logotipo superior para regresar a Inicio",
      "Cartelera de Comunicados, cuadernos de bonos y campañas activas",
      "Visor en pantalla completa con descarga directa y enlace de registro",
      "Radar de Cumpleañeros de Hoy y Próximos Cumpleaños del equipo"
    ]
  },
  {
    key: "mod02",
    episodeNumber: "02",
    title: "Módulo Newsletters: Noticias e Indicadores Banxico",
    shortModuleTitle: "Newsletters y Banxico",
    subtitle: "Consulta la UDI con 6 decimales, Dólar FIX, Euro y noticias financieras curadas con argumentos comerciales.",
    duration: "1:27",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod02",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod02_newsletters_banxico_AAA.mp4",
    posterUrl: "/manual/posters/mod02.png",
    quickLink: "/newsletters",
    modulePaths: ["/newsletters"],
    manualChapterIds: ["newsletters"],
    highlights: [
      "Indicadores en vivo de Banxico: UDI (6 decimales), Dólar FIX, Euro y Libra",
      "Curación diaria de noticias en 5 categorías estratégicas",
      "Buscador rápido por etiquetas (#UDI, #ISR, #Retiro, #Inflación)",
      "Recuadro verde «Impacto para el Asesor» listo para usar en tus citas"
    ]
  },
  {
    key: "mod03",
    episodeNumber: "03",
    title: "Módulo 25 Puntos: Tu Velocímetro de Actividad Diaria",
    shortModuleTitle: "Actividad 25 Puntos",
    subtitle: "Planea tu día a las 8:30 AM, registra llamadas, citas y cierres, y pinta tu anillo en verde cada tarde.",
    duration: "1:32",
    roleBadge: "Agente",
    videoUrl: "/api/manual-video/mod03",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod03_25_puntos_actividad_AAA.mp4",
    posterUrl: "/manual/posters/mod03.png",
    quickLink: "/activity",
    modulePaths: ["/activity"],
    manualChapterIds: ["actividad-25-puntos"],
    highlights: [
      "Botón «Planear mi día» para comprometer tus metas matutinas",
      "Semáforo circular: Rojo (0-15 pts), Ámbar (16-24 pts) y Verde (25+ pts)",
      "Tabla de las 7 actividades (+1 llamada, +2 cita, +3 ADN/referido, +5 cierre, +8 emisión)",
      "Registro con nombre del prospecto e historial mensual desplegable"
    ]
  },
  {
    key: "mod04",
    episodeNumber: "04",
    title: "Módulo PEA / PRP / JEP: Desempeño Operativo con IA",
    shortModuleTitle: "PEA / PRP / JEP",
    subtitle: "Sincroniza tus puntos y ADNs automáticamente, recibe tu Dictamen Ejecutivo con IA y autoriza con tu promotor.",
    duration: "1:23",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod04",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod04_pea_prp_jep_AAA.mp4",
    posterUrl: "/manual/posters/mod04.png",
    quickLink: "/pea-prp",
    modulePaths: ["/pea-prp"],
    manualChapterIds: ["pea-prp-jep"],
    highlights: [
      "Autocarga automática de Puntos de Actividad 25 y ADNs realizados",
      "Dictamen Ejecutivo redactado al instante por Inteligencia Artificial",
      "Bandeja de Aprobación del Promotor (Autorizar o Rechazar con retroalimentación)",
      "Archivo Histórico y gráfica de evolución mensual"
    ]
  },
  {
    key: "mod05",
    episodeNumber: "05",
    title: "Módulo Mi Cartera 360° y Directorio de Clientes",
    shortModuleTitle: "Mi Cartera 360°",
    subtitle: "Sube tus pólizas con lector IA de carátulas PDF o Excel, controla recibos en gracia y detecta venta cruzada.",
    duration: "1:38",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod05",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod05_mi_cartera_360_AAA.mp4",
    posterUrl: "/manual/posters/mod05.png",
    quickLink: "/cartera",
    modulePaths: ["/cartera", "/admin/cartera"],
    manualChapterIds: ["mi-cartera"],
    highlights: [
      "4 Tableros: Prima Activa, Cobros y Recibos, Aniversarios y Oportunidades",
      "Botón «Autocompletar con PDF» (lector IA de carátulas) e Importar Excel",
      "Recordatorios de cobranza y renovación por WhatsApp en un clic",
      "Porcentaje de Blindaje Patrimonial para detectar venta cruzada"
    ]
  },
  {
    key: "mod06",
    episodeNumber: "06",
    title: "Módulos Equipo, Mi Tarjeta Digital QR y Ranking",
    shortModuleTitle: "Equipo, Tarjeta QR y Ranking",
    subtitle: "Personaliza tu perfil para generar tu Tarjeta Digital con QR vCard y compite en el Podio mensual de ADNs.",
    duration: "1:30",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod06",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod06_equipo_tarjeta_ranking_AAA.mp4",
    posterUrl: "/manual/posters/mod06.png",
    quickLink: "/team",
    modulePaths: ["/team", "/ranking"],
    manualChapterIds: ["equipo-y-tarjeta", "ranking"],
    highlights: [
      "Edición de perfil: foto, cumpleaños, redes sociales y aseguradoras",
      "Mi Tarjeta Digital con código QR dinámico y descarga de contacto (.vcf)",
      "Enlace de invitación para reclutamiento de nuevos asesores",
      "Podio de Honor (Oro, Plata y Bronce) y clasificación mensual por ADNs"
    ]
  },
  {
    key: "mod07",
    episodeNumber: "07",
    title: "Encuesta de Satisfacción (4 SÍes) y Mis Referidos",
    shortModuleTitle: "Encuesta 4 SÍes y Referidos",
    subtitle: "Multiplica tus recomendados al terminar cada cita con la técnica de los 4 SÍes y gestiona tu histórico de referidos.",
    duration: "1:23",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod07",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod07_encuesta_referidores_AAA.mp4",
    posterUrl: "/manual/posters/mod07.png",
    quickLink: "/encuesta-satisfaccion",
    modulePaths: ["/encuesta-satisfaccion"],
    manualChapterIds: ["encuesta-satisfaccion"],
    highlights: [
      "Técnica psicológica de los 4 SÍes frente al cliente",
      "Botón salvavidas «Ver 6 preguntas de ayuda» para destrabar la memoria",
      "Pestaña «Mis Referidos e Histórico» para llamar en tu Hora Dorada",
      "Conexión directa de tus referidos calificados con el CRM de Proyecto 200"
    ]
  },
  {
    key: "mod08",
    episodeNumber: "08",
    title: "Módulo ADN: Diagnóstico Financiero en 3 Modalidades",
    shortModuleTitle: "Diagnóstico ADN",
    subtitle: "Elige entre 3 velocidades de captura, muestra en vivo la regla 50/30/20 y enciende el Semáforo de 5 Prioridades.",
    duration: "1:35",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod08",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod08_adn_tres_modalidades_AAA.mp4",
    posterUrl: "/manual/posters/mod08.png",
    quickLink: "/adn",
    modulePaths: ["/adn"],
    manualChapterIds: ["herramientas-comerciales"],
    highlights: [
      "3 Modalidades: Cuestionario Extendido, Resumen de Rubros e Ingreso/Gasto Total",
      "Captura de familia (hijos con edades), salud y auditoría de seguros actuales",
      "Gráfica 50/30/20 de Elizabeth Warren y Semáforo de 5 Prioridades Patrimoniales",
      "Evidencia fotográfica, impresión PDF y botón «¿Cerrada y pagada?»"
    ]
  },
  {
    key: "mod09",
    episodeNumber: "09",
    title: "Módulo Cotizador Maestro Modular en 4 Pasos",
    shortModuleTitle: "Cotizador Modular",
    subtitle: "Transforma cualquier Excel de la aseguradora en una presentación ejecutiva con proyección de UDI y devolución SAT.",
    duration: "1:36",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod09",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod09_cotizador_modular_AAA.mp4",
    posterUrl: "/manual/posters/mod09.png",
    quickLink: "/cotizador",
    modulePaths: ["/cotizador"],
    manualChapterIds: ["herramientas-comerciales"],
    highlights: [
      "Paso 1: Cliente, producto, UDI precargada, inflación, coberturas e ISR (35%)",
      "Pasos 2 y 3: Arrastrar archivo Excel/CSV de la aseguradora y mapeo de columnas",
      "Paso 4: Proyección de Suma Asegurada (1, 10, 20 y 30 años), ahorro a edad 65 y SAT",
      "Impresión de propuesta PDF con el logo de tu agencia y bóveda Mis Cotizaciones"
    ]
  },
  {
    key: "mod10",
    episodeNumber: "10",
    title: "Módulo TIPS: Talleres Interactivos en Vivo con QR",
    shortModuleTitle: "TIPS (Taller en Vivo)",
    subtitle: "Convierte pláticas grupales o por Zoom en dinámicas interactivas desde el celular y detecta los prospectos más calientes.",
    duration: "1:27",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod10",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod10_tips_talleres_qr_AAA.mp4",
    posterUrl: "/manual/posters/mod10.png",
    quickLink: "/tips",
    modulePaths: ["/tips"],
    manualChapterIds: ["herramientas-comerciales"],
    highlights: [
      "Bolsa de créditos y botón «Modo Demo / Práctica Gratis» ilimitado",
      "Vista Proyector con código QR gigante y avance sincronizado en vivo",
      "Semáforo de Temperatura Comercial (🔥 Caliente, 🟡 Tibio, 🔵 Frío)",
      "Descarga de base en CSV y envío directo al CRM en un clic"
    ]
  },
  {
    key: "mod11",
    episodeNumber: "11",
    title: "Módulo Plan de Arranque: Camino al Éxito y Cédula CNSF",
    shortModuleTitle: "Plan de Arranque y CNSF",
    subtitle: "Avanza semana a semana en tu incubadora comercial y prepárate con simuladores cronometrados para la CNSF.",
    duration: "1:21",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod11",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod11_plan_arranque_cnsf_AAA.mp4",
    posterUrl: "/manual/posters/mod11.png",
    quickLink: "/plan-arranque",
    modulePaths: ["/plan-arranque", "/admin/plan-arranque"],
    manualChapterIds: ["capacitacion-y-academia"],
    highlights: [
      "Camino al Éxito: fases semanales, checklists y desbloqueo por calificación",
      "Exámenes con retroalimentación instantánea y confeti al aprobar",
      "Obtención de Cédula (CNSF): guías de estudio y videos bajo demanda",
      "Simulador Oficial CNSF con temporizador real y desglose por áreas"
    ]
  },
  {
    key: "mod12",
    episodeNumber: "12",
    title: "Academia Pro: E-Learning y Simulador Roleplay con IA",
    shortModuleTitle: "Academia Pro y Roleplay IA",
    subtitle: "Entrena por voz en tiempo real frente a clientes virtuales con IA, gana XP y desbloquea insignias.",
    duration: "1:33",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod12",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod12_academia_pro_elearning_AAA.mp4",
    posterUrl: "/manual/posters/mod12.png",
    quickLink: "/academia",
    modulePaths: ["/academia", "/academia/videos", "/academia/simulador"],
    manualChapterIds: ["capacitacion-y-academia"],
    highlights: [
      "Videoteca E-Learning en modo cine filtrada por categorías comerciales",
      "3 Arenas de Voz con IA: Prospección, Objeciones y Cierre, y Práctica de ADN",
      "Evaluación automática post-llamada con calificación de 0 a 100 y grabación",
      "Sistema de niveles XP, rachas de entrenamiento y medallero de 8 insignias"
    ]
  },
  {
    key: "mod13",
    episodeNumber: "13",
    title: "Mi Biblioteca y Asistente de Inteligencia Artificial",
    shortModuleTitle: "Biblioteca y Asistente IA",
    subtitle: "Descarga formatos y Condiciones Generales al instante o pregúntale en lenguaje natural al Asistente IA.",
    duration: "1:15",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod13",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod13_biblioteca_asistente_ia_AAA.mp4",
    posterUrl: "/manual/posters/mod13.png",
    quickLink: "/documentacion",
    modulePaths: ["/documentacion", "/assistant"],
    manualChapterIds: ["biblioteca-y-documentos", "asistente-ia"],
    highlights: [
      "Dos bóvedas: Documentos de mi Agencia y Biblioteca Global de Aseguradoras",
      "Filtros por categoría (Comercial, Marketing, Formatos, Condiciones Generales)",
      "Asistente IA entrenado con las Condiciones Generales y manuales de tu agencia",
      "Respuestas en segundos con artículos exactos, periodos de espera y exclusiones"
    ]
  },
  {
    key: "mod14",
    episodeNumber: "14",
    title: "Panel del Promotor: Admin, Reportes, Agencia SaaS y Soporte",
    shortModuleTitle: "Panel Admin, Reportes y Soporte",
    subtitle: "Domina el centro de mando directivo: Producción, Dashboard de 14 pestañas, Push con PIN, Marca Blanca y Tickets con Ctrl+V.",
    duration: "1:49",
    roleBadge: "Admin",
    videoUrl: "/api/manual-video/mod14",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod14_admin_reportes_soporte_AAA.mp4",
    posterUrl: "/manual/posters/mod14.png",
    quickLink: "/admin",
    modulePaths: ["/admin", "/reportes", "/votaciones"],
    manualChapterIds: ["administracion-promotoria", "mi-agencia-saas", "centro-ayuda-tickets"],
    highlights: [
      "Producción y Primas + Reportes Semanales con exportación de Sábana Excel",
      "Dashboard Admin (14 pestañas): Usuarios, ADNs, Encuestas, NPS y Menús",
      "Notificaciones Push con PIN de seguridad y fábrica de reactivos con IA",
      "Mi Agencia SaaS, Mi Membresía Stripe y Tickets de Soporte pegando capturas con Ctrl+V"
    ]
  },
  {
    key: "mod15",
    episodeNumber: "15",
    title: "Módulo Proyecto 200: CRM y Piloto Automático de Prospección",
    shortModuleTitle: "Proyecto 200 (Piloto Automático)",
    subtitle: "Audita tus 200 contactos válidos de arranque, conecta tus Encuestas de Satisfacción y ejecuta llamadas secuenciales con Priority Score.",
    duration: "2:36",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod15",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod15_proyecto_200_crm_piloto_AAA.mp4",
    posterUrl: "/manual/posters/mod15.png",
    quickLink: "/proyecto-200",
    modulePaths: ["/proyecto-200"],
    manualChapterIds: ["herramientas-comerciales", "prospeccion-y-referidos"],
    highlights: [
      "Termómetro Oficial de Arranque (200 contactos válidos) y puente con Encuesta de Satisfacción",
      "Importador Excel/CSV con Validador Inteligente de 5 campos obligatorios y exclusión automática",
      "Piloto Automático Secuencial (Score 1–100 pts), Guion de 5 Pilares y Escudo Anti-Objeciones",
      "Candado de Resolución (Cita Agendada con confeti), Tabla CRM y Torre Ejecutiva para el Promotor"
    ]
  },
  {
    key: "mod16",
    episodeNumber: "16",
    title: "Módulo Mis Referidores: Autogestión de 5 Referidores, Bono CNSF y 15 Puntos",
    shortModuleTitle: "Mis Referidores (Cupo 5 y Bono CNSF)",
    subtitle: "Da de alta hasta 5 referidores sin costo de asiento SaaS, registra su Bono por Referencia de Prospectos (CNSF) y audita su meta diaria de 15 puntos.",
    duration: "2:38",
    roleBadge: "Todos",
    videoUrl: "/api/manual-video/mod16",
    blobUrl: "https://lxyhgkkgwtxjiqp0.private.blob.vercel-storage.com/manual-aacomsoft/video_mod16_mis_referidores_aacomsoft_AAA.mp4",
    posterUrl: "/manual/posters/mod16.png",
    quickLink: "/referidores",
    modulePaths: ["/referidores", "/admin/referidores"],
    manualChapterIds: ["mis-referidores", "administracion-promotoria"],
    highlights: [
      "Autogestión del Agente: cupo de hasta 5 referidores activos sin ocupar asientos SaaS de la promotoría",
      "Cumplimiento CNSF: registro privado de Bono por Referencia (% Base 30–50% y % Adicional 0–50%) y envío por WhatsApp en 1 clic",
      "Portal enfocado del Referidor: meta diaria de 15 puntos, Proyecto 200 propio, Videos E-Learning e IA sin examen CNSF",
      "Bitácora detallada nombre por nombre, menú (⋮) para Suspender o Dar de Baja (liberar espacio) y Torre Admin con filtro en Actividad 25"
    ]
  }
];

export function getManualVideoForPathname(pathname: string): ManualVideoItem | null {
  if (!pathname || pathname.startsWith("/support")) return null;

  if (pathname === "/") {
    return MANUAL_VIDEOS_CATALOG.find((v) => v.key === "mod01") || null;
  }

  // Exact or prefix match (longest prefix wins)
  let bestMatch: ManualVideoItem | null = null;
  let bestLen = 0;

  for (const video of MANUAL_VIDEOS_CATALOG) {
    for (const mp of video.modulePaths) {
      if (mp === "/") continue;
      if (pathname === mp || pathname.startsWith(mp + "/")) {
        if (mp.length > bestLen) {
          bestLen = mp.length;
          bestMatch = video;
        }
      }
    }
  }

  return bestMatch;
}

export function getManualVideosForChapter(chapterId: string): ManualVideoItem[] {
  return MANUAL_VIDEOS_CATALOG.filter((v) => v.manualChapterIds.includes(chapterId));
}
