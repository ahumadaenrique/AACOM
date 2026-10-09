const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'public', 'cedula-a', 'preguntas.json');
const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

// 1. Clean JSON Export
const cleanExport = raw.map(q => {
  const correctText = q.options && q.options[q.correct] !== undefined ? q.options[q.correct] : '';
  return {
    id: q.id,
    modulo: q.module,
    pregunta: q.question,
    opciones: q.options,
    indice_correcto: q.correct,
    respuesta_correcta: correctText,
    explicacion: ''
  };
});

const jsonOutPath = path.join(__dirname, '..', 'public', 'cedula-a', 'bateria_preguntas_cedula_a.json');
fs.writeFileSync(jsonOutPath, JSON.stringify(cleanExport, null, 2), 'utf8');
console.log('✅ JSON export saved at:', jsonOutPath, 'Total:', cleanExport.length);

// 2. CSV Export
const escapeCsv = (str) => {
  if (str === null || str === undefined) return '""';
  return '"' + String(str).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
};

const headers = ['id', 'modulo', 'pregunta', 'opcion_A', 'opcion_B', 'opcion_C', 'opcion_D', 'respuesta_correcta', 'explicacion'];
let csvLines = [headers.join(',')];

cleanExport.forEach(q => {
  const row = [
    q.id,
    escapeCsv(q.modulo),
    escapeCsv(q.pregunta),
    escapeCsv(q.opciones[0] || ''),
    escapeCsv(q.opciones[1] || ''),
    escapeCsv(q.opciones[2] || ''),
    escapeCsv(q.opciones[3] || ''),
    escapeCsv(q.respuesta_correcta),
    '""'
  ];
  csvLines.push(row.join(','));
});

const csvOutPath = path.join(__dirname, '..', 'public', 'cedula-a', 'bateria_preguntas_cedula_a.csv');
fs.writeFileSync(csvOutPath, csvLines.join('\n'), 'utf8');
console.log('✅ CSV export saved at:', csvOutPath);

// 3. Modulos separados por carpetas o archivos para que sea ultra fácil procesar por bloques
const modulesDir = path.join(__dirname, '..', 'public', 'cedula-a', 'por_modulos');
if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir, { recursive: true });

const modulesMap = {};
cleanExport.forEach(q => {
  if (!modulesMap[q.modulo]) modulesMap[q.modulo] = [];
  modulesMap[q.modulo].push(q);
});

for (const [modName, questions] of Object.entries(modulesMap)) {
  const safeName = modName.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
  const modFilePath = path.join(modulesDir, `${safeName}.json`);
  fs.writeFileSync(modFilePath, JSON.stringify(questions, null, 2), 'utf8');
  console.log(` - Módulo "${modName}": ${questions.length} preguntas -> ${modFilePath}`);
}
