const fs = require('fs');
const path = require('path');
const os = require('os');

const home = os.homedir();
const jsonSrc = path.join(home, 'Downloads', 'cedulaA_con_explicaciones.json');
const csvSrc = path.join(home, 'Downloads', 'posibles_errores_clave.csv');

if (!fs.existsSync(jsonSrc)) {
  console.error("❌ Archivo no encontrado:", jsonSrc);
  process.exit(1);
}
if (!fs.existsSync(csvSrc)) {
  console.error("❌ Archivo no encontrado:", csvSrc);
  process.exit(1);
}

const rawQuestions = JSON.parse(fs.readFileSync(jsonSrc, 'utf8'));
const csvLines = fs.readFileSync(csvSrc, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);

// Parse exclusion list
const excludeIds = new Set();
let excludeSinIdCount = 0;

for (let i = 1; i < csvLines.length; i++) {
  const line = csvLines[i].trim();
  if (line.startsWith('(sin id)') || line.startsWith('" (sin id)"') || line.startsWith('"(sin id)"')) {
    excludeSinIdCount++;
    continue;
  }
  const parts = line.split(',');
  const idNum = parseInt(parts[0].replace(/"/g, '').trim());
  if (!isNaN(idNum)) {
    excludeIds.add(idNum);
  }
}

console.log(`📋 IDs numéricos a excluir: ${excludeIds.size}`);
console.log(`📋 Items 'sin id' a excluir: ${excludeSinIdCount}`);
console.log(`Total a excluir según CSV: ${excludeIds.size + excludeSinIdCount}`);

let excludedList = [];
let cleanQuestions = [];

rawQuestions.forEach((q, idx) => {
  // Check if matches numeric ID
  if (q.id && excludeIds.has(q.id)) {
    excludedList.push({ id: q.id, modulo: q.modulo, pregunta: q.pregunta.slice(0, 60) });
    return;
  }
  // Check if matches item without ID (position 238)
  if (!q.id && q.modulo === 'Vida Individual' && q.pregunta.includes('Pérdidas Orgánicas')) {
    excludedList.push({ id: '(sin id)', modulo: q.modulo, pregunta: q.pregunta.slice(0, 60) });
    return;
  }

  // Format question cleanly for Cedula A
  cleanQuestions.push({
    id: q.id || (idx + 1),
    number: cleanQuestions.length + 1,
    module: q.modulo || q.module,
    modulo: q.modulo || q.module,
    question: q.pregunta || q.question,
    pregunta: q.pregunta || q.question,
    options: q.opciones || q.options,
    opciones: q.opciones || q.options,
    correct: q.indice_correcto !== undefined ? q.indice_correcto : q.correct,
    indice_correcto: q.indice_correcto !== undefined ? q.indice_correcto : q.correct,
    respuesta_correcta: q.respuesta_correcta || (q.opciones ? q.opciones[q.indice_correcto] : ''),
    explanation: q.explicacion || q.explanation || '',
    explicacion: q.explicacion || q.explanation || '',
    has_error: false
  });
});

console.log(`\n📊 Resumen de depuración:`);
console.log(`- Preguntas originales: ${rawQuestions.length}`);
console.log(`- Preguntas excluidas: ${excludedList.length}`);
console.log(`- Preguntas limpias finales: ${cleanQuestions.length}`);

// Guardar preguntas.json en public/cedula-a/
const targetPath = path.join(__dirname, '..', 'public', 'cedula-a', 'preguntas.json');
fs.writeFileSync(targetPath, JSON.stringify(cleanQuestions, null, 2), 'utf8');
console.log(`\n✅ Guardado exitoso en: ${targetPath}`);

// Breakdown por modulo
const moduleCounts = {};
cleanQuestions.forEach(q => {
  moduleCounts[q.module] = (moduleCounts[q.module] || 0) + 1;
});
console.log('\n📚 Distribución por módulo en preguntas limpias:');
console.log(moduleCounts);
