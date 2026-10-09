const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/ahuma/Downloads/cedulaB_reactivos.json';
const rawData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

console.log(`Leídas ${rawData.length} preguntas de Cédula B.`);

// Mapa de los 27 tópicos a los 7 Módulos Oficiales CNSF Cédula B
function mapToMainModule(submodule) {
  const s = submodule ? submodule.trim() : '';

  if (
    s === 'Seguro de Grupo Vida' ||
    s === 'Seguros Colectivos de Vida' ||
    s === 'Hombre Clave y Socios' ||
    s === 'Gastos Médicos Mayores Grupo y Colectivo' ||
    s === 'Accidentes Personales Colectivo' ||
    s === 'Marco Legal y Fiscal de Personas'
  ) {
    return 'Seguro de Personas (Grupo y Colectivo)';
  }

  if (
    s === 'Incendio' ||
    s === 'Riesgos Catastróficos: Terremoto e Hidrometeorológicos'
  ) {
    return 'Seguro de Daños: Incendio y Catastróficos';
  }

  if (
    s === 'Marítimo y Transportes' ||
    s === 'Automóviles Flotillas'
  ) {
    return 'Marítimo, Transportes y Automóviles Flotillas';
  }

  if (
    s === 'Responsabilidad Civil' ||
    s === 'Administración de Riesgos'
  ) {
    return 'Responsabilidad Civil y Admón. de Riesgos';
  }

  if (s.startsWith('Técnicos:')) {
    return 'Ramos Técnicos de Daños';
  }

  if (s.startsWith('Diversos:')) {
    return 'Ramos Diversos y Misceláneos';
  }

  if (
    s === 'Marco Legal: LISF y CUSF' ||
    s === 'Agentes de Seguros: Reglamento y Obligaciones' ||
    s === 'Protección al Usuario: CONDUSEF, LPDUSF y LSCS' ||
    s === 'Prevención de Lavado de Dinero'
  ) {
    return 'Regulación CNSF, Marco Legal y PLD';
  }

  return 'Regulación CNSF, Marco Legal y PLD';
}

const formattedQuestions = rawData.map((r, idx) => {
  const mainModule = mapToMainModule(r.modulo);
  return {
    id: r.id || (idx + 1),
    module: mainModule,
    modulo: mainModule,
    submodulo: r.modulo,
    question: r.pregunta,
    pregunta: r.pregunta,
    options: r.opciones,
    opciones: r.opciones,
    correct: r.indice_correcto,
    indice_correcto: r.indice_correcto,
    respuesta_correcta: r.respuesta_correcta,
    explanation: r.explicacion,
    explicacion: r.explicacion
  };
});

// Guardar en public/cedula-b/
const outDir = path.join(process.cwd(), 'public', 'cedula-b');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outDir, 'preguntas.json'),
  JSON.stringify(formattedQuestions, null, 2),
  'utf8'
);

fs.writeFileSync(
  path.join(outDir, 'bateria_preguntas_cedula_b.json'),
  JSON.stringify(formattedQuestions, null, 2),
  'utf8'
);

// Módulos desglosados
const modDir = path.join(outDir, 'por_modulos');
if (!fs.existsSync(modDir)) {
  fs.mkdirSync(modDir, { recursive: true });
}

const modMap = {};
formattedQuestions.forEach(q => {
  if (!modMap[q.module]) modMap[q.module] = [];
  modMap[q.module].push(q);
});

Object.entries(modMap).forEach(([modName, items]) => {
  const slug = modName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  fs.writeFileSync(
    path.join(modDir, `${slug}.json`),
    JSON.stringify(items, null, 2),
    'utf8'
  );
  console.log(`Módulo "${modName}": ${items.length} preguntas.`);
});

console.log(`\nImportación Cédula B completada con éxito: ${formattedQuestions.length} reactivos guardados.`);
