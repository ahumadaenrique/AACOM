const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'public', 'cedula-b', 'app.js');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Reemplazar todas las rutas API de cedula-a por cedula-b
code = code.replace(/\/api\/cedula-a\//g, '/api/cedula-b/');

// 2. Reemplazar modulesData
const oldModulesRegex = /const modulesData = \[\s*\{ name: "Aspectos Generales"[\s\S]*?\];/;
const newModules = `const modulesData = [
        { name: "Seguro de Personas (Grupo y Colectivo)", total: 175, display: "1. Personas (Grupo y Col.)" },
        { name: "Seguro de Daños: Incendio y Catastróficos", total: 71, display: "2. Daños: Incendio y Cat." },
        { name: "Marítimo, Transportes y Automóviles Flotillas", total: 79, display: "3. Marítimo y Flotillas" },
        { name: "Responsabilidad Civil y Admón. de Riesgos", total: 78, display: "4. Resp. Civil y Riesgos" },
        { name: "Ramos Técnicos de Daños", total: 90, display: "5. Ramos Técnicos" },
        { name: "Ramos Diversos y Misceláneos", total: 68, display: "6. Diversos y Misceláneos" },
        { name: "Regulación CNSF, Marco Legal y PLD", total: 84, display: "7. Regulación CNSF y PLD" }
    ];`;
code = code.replace(oldModulesRegex, newModules);

// 3. Reemplazar config de simulador de examen
const oldConfigRegex = /const config = \[\s*\{ mod: "Aspectos Generales"[\s\S]*?\];/;
const newConfig = `const config = [
        { mod: "Seguro de Personas (Grupo y Colectivo)", count: 18 },
        { mod: "Seguro de Daños: Incendio y Catastróficos", count: 10 },
        { mod: "Marítimo, Transportes y Automóviles Flotillas", count: 10 },
        { mod: "Responsabilidad Civil y Admón. de Riesgos", count: 10 },
        { mod: "Ramos Técnicos de Daños", count: 12 },
        { mod: "Ramos Diversos y Misceláneos", count: 10 },
        { mod: "Regulación CNSF, Marco Legal y PLD", count: 10 }
    ];`;
code = code.replace(oldConfigRegex, newConfig);

// 4. Reemplazar textos de Cédula A a Cédula B
code = code.replace(/Apto para Cédula A/g, 'Apto para Cédula B');
code = code.replace(/de los 6 módulos/g, 'de los 7 módulos');
code = code.replace(/temario oficial de certificación Cédula A/g, 'temario oficial de certificación Cédula B');

// 5. Reemplazar ruta a preguntas.json si se carga estáticamente
code = code.replace(/\/cedula-a\/preguntas\.json/g, '/cedula-b/preguntas.json');

fs.writeFileSync(targetPath, code, 'utf8');
console.log("public/cedula-b/app.js parcheado con éxito.");
