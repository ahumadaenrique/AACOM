const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src/app/(dashboard)/cartera');

const replacements = {
  "P\ufffdliza": "Póliza",
  "p\ufffdliza": "póliza",
  "P\ufffdlizas": "Pólizas",
  "p\ufffdlizas": "pólizas",
  "L\ufffdnea": "Línea",
  "d\ufffdas": "días",
  "Edici\ufffdn": "Edición",
  "pr\ufffdximas": "próximas",
  "Importaci\ufffdn": "Importación",
  "A\ufffdadir": "Añadir",
  "a\ufffdo": "año",
  "tama\ufffdo": "tamaño",
  "t\ufffdrmino": "término"
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
