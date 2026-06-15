const fs = require('fs');
const file = './src/app/(dashboard)/admin/AdminClient.tsx';
let code = fs.readFileSync(file, 'utf8');

const fragment = fs.readFileSync('./ui_fragment.txt', 'utf8');

const beforeTarget = '{activeTab === "notificaciones" && (';
const afterTarget = '{/* Styles inject for print layout within Admin preview */}';

const start = code.indexOf(beforeTarget);
const end = code.indexOf(afterTarget);

if (start === -1 || end === -1) {
    console.error("Failed to find targets. Start: " + start + ", End: " + end);
    process.exit(1);
}

code = code.substring(0, start) + fragment + "\n\n      " + code.substring(end);
fs.writeFileSync(file, code);
console.log("UI Patched successfully with Node");
