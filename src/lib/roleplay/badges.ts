export type ModuleId = 'prospeccion' | 'adn' | 'objeciones' | 'general';

export interface Badge {
  id: string;
  moduleId: ModuleId;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  // PROSPECCIÓN (10)
  { id: 'p_rompehielo', moduleId: 'prospeccion', name: 'Rompehielo Maestro', description: 'Logró un tono amigable y relajado al inicio de la llamada.', icon: '🧊' },
  { id: 'p_referido_oro', moduleId: 'prospeccion', name: 'El Referido de Oro', description: 'Mencionó al referidor estratégicamente en los primeros segundos.', icon: '🥇' },
  { id: 'p_ninja_tiempo', moduleId: 'prospeccion', name: 'Ninja del Tiempo', description: 'Consiguió la cita en menos de 90 segundos.', icon: '⏱️' },
  { id: 'p_escudo_filtros', moduleId: 'prospeccion', name: 'Escudo Anti-Filtros', description: 'Superó el mándamelo por WhatsApp sin ceder.', icon: '🛡️' },
  { id: 'p_doble_alt', moduleId: 'prospeccion', name: 'Doble Alternativa', description: 'Ofreció dos opciones claras de horario para la cita.', icon: '⚖️' },
  { id: 'p_persistencia', moduleId: 'prospeccion', name: 'Persistencia Educada', description: 'Revirtió 2 objeciones iniciales negativas exitosamente.', icon: '🧗‍♂️' },
  { id: 'p_citas_no_polizas', moduleId: 'prospeccion', name: 'Vendedor de Citas', description: 'Evitó dar precios, productos o nombres de aseguradoras.', icon: '🎟️' },
  { id: 'p_control_agenda', moduleId: 'prospeccion', name: 'Control de la Agenda', description: 'No aceptó el yo te aviso, y fijó un compromiso.', icon: '📅' },
  { id: 'p_frio_exitoso', moduleId: 'prospeccion', name: 'Contacto Frío Exitoso', description: 'Cerró cita con un desconocido total en dificultad media o alta.', icon: '❄️' },
  { id: 'p_impecable', moduleId: 'prospeccion', name: 'Llamada Impecable', description: 'Obtuvo calificación perfecta (100) en el módulo de prospección.', icon: '🌟' },

  // ADN (12)
  { id: 'a_escucha', moduleId: 'adn', name: 'Escucha Activa', description: 'El prospecto habló la mayor parte del tiempo, guiado por buenas preguntas.', icon: '👂' },
  { id: 'a_ford', moduleId: 'adn', name: 'Familia Primero', description: 'Indagó exitosamente la técnica F.O.R.D.', icon: '👨‍👩‍👧‍👦' },
  { id: 'a_dedo_llaga', moduleId: 'adn', name: 'El Dedo en la Llaga', description: 'Preguntó sobre el impacto de faltar mañana o en el retiro.', icon: '💥' },
  { id: 'a_arquitecto', moduleId: 'adn', name: 'Arquitecto del Futuro', description: 'Ayudó al cliente a visualizar su retiro y necesidades.', icon: '🏗️' },
  { id: 'a_presupuesto', moduleId: 'adn', name: 'Buscador de Presupuesto', description: 'Averiguó la capacidad real de ahorro mensual del cliente.', icon: '💰' },
  { id: 'a_cero_productos', moduleId: 'adn', name: 'Cero Productos', description: 'Hizo el diagnóstico sin vender ni mencionar seguros específicos.', icon: '🚫' },
  { id: 'a_medico', moduleId: 'adn', name: 'El Médico Diagnóstica', description: 'Calmó a un cliente ansioso por precios para terminar el análisis.', icon: '🩺' },
  { id: 'a_deudas', moduleId: 'adn', name: 'Descubridor de Deudas', description: 'Indagó exitosamente pasivos, hipotecas y créditos.', icon: '💳' },
  { id: 'a_compromiso', moduleId: 'adn', name: 'Compromiso Siguiente Cita', description: 'Fijó la Cita de Cierre con fecha y hora explícita.', icon: '🤝' },
  { id: 'a_prioridades', moduleId: 'adn', name: 'Experto en Prioridades', description: 'Consiguió que el cliente ordenara sus metas de mayor a menor.', icon: '📋' },
  { id: 'a_rompemuros', moduleId: 'adn', name: 'Rompe-Muros', description: 'Relajó a un prospecto inicialmente a la defensiva o apático.', icon: '🧱' },
  { id: 'a_perfecto', moduleId: 'adn', name: 'Diagnóstico Perfecto', description: 'Obtuvo 100/100 en un diagnóstico de Nivel 5 o superior.', icon: '💎' },

  // OBJECIONES Y CIERRE (12 + 1 final = 13)
  { id: 'c_aislador', moduleId: 'objeciones', name: 'Aislador de Objeciones', description: 'Aisló la duda usando: ¿Además del precio, hay algo más?', icon: '🔬' },
  { id: 'c_matacompetencias', moduleId: 'objeciones', name: 'Mata-Competencias', description: 'Resolvió comparaciones con el banco priorizando su valor como asesor.', icon: '⚔️' },
  { id: 'c_consultor', moduleId: 'objeciones', name: 'Consultor del Contador', description: 'Manejó la objeción Déjame revisarlo con mi esposo/contador.', icon: '📊' },
  { id: 'c_presupuesto_oculto', moduleId: 'objeciones', name: 'Presupuesto Oculto', description: 'Rebatió el No tengo dinero encontrando gastos hormiga o ajustes.', icon: '🕵️' },
  { id: 'c_asumido', moduleId: 'objeciones', name: 'Cierre Asumido', description: 'Asumió la compra avanzando al trámite (Ej. ¿A qué tarjeta va el cargo?).', icon: '📝' },
  { id: 'c_rescate', moduleId: 'objeciones', name: 'Rescate de Tarjeta', description: 'Superó el miedo a domiciliar u objeción de pago con alternativas.', icon: '🛟' },
  { id: 'c_implacable', moduleId: 'objeciones', name: 'Seguridad Implacable', description: 'No usó muletillas durante la etapa de cierre.', icon: '🎯' },
  { id: 'c_rapido', moduleId: 'objeciones', name: 'Cierre Rápido', description: 'Obtuvo el sí definitivo en los primeros minutos del módulo.', icon: '⚡' },
  { id: 'c_valor', moduleId: 'objeciones', name: 'Vendedor de Valor', description: 'Se negó a dar descuentos o bajar la suma al primer intento de regateo.', icon: '💎' },
  { id: 'c_fiscal', moduleId: 'objeciones', name: 'Experto Fiscal', description: 'Explicó beneficios fiscales y deducibilidad para cerrar.', icon: '🏛️' },
  { id: 'c_boomerang', moduleId: 'objeciones', name: 'El Boomerang', description: 'Usó la excusa del cliente como la razón principal por la que debe comprar.', icon: '🪃' },
  { id: 'c_hostil', moduleId: 'objeciones', name: 'Cierre Hostil Superado', description: 'Cerró la póliza ante un cliente agresivo de Nivel 6.', icon: '🔥' },
  { id: 'c_maestro', moduleId: 'general', name: 'Maestro de la Academia', description: 'Obtuvo todas las insignias. ¡Bono desbloqueado!', icon: '👑' }
];
