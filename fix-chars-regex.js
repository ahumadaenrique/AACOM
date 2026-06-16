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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/P[^\w]{1,3}lizas/g, 'Pólizas');
  content = content.replace(/p[^\w]{1,3}lizas/g, 'pólizas');
  content = content.replace(/P[^\w]{1,3}liza/g, 'Póliza');
  content = content.replace(/p[^\w]{1,3}liza/g, 'póliza');
  
  content = content.replace(/d[^\w]{1,3}as/g, 'días');
  content = content.replace(/L[^\w]{1,3}nea/g, 'Línea');
  
  content = content.replace(/pr[^\w]{1,3}ximas/g, 'próximas');
  content = content.replace(/Importaci[^\w]{1,3}n/g, 'Importación');
  content = content.replace(/A[^\w]{1,3}adir/g, 'Añadir');
  content = content.replace(/Edici[^\w]{1,3}n/g, 'Edición');
  content = content.replace(/tama[^\w]{1,3}o/g, 'tamaño');
  content = content.replace(/a[^\w]{1,3}o/g, 'año');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
