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
  
  // Acentos en ó
  content = content.replace(/P[^\w<]{1,3}lizas/g, 'Pólizas');
  content = content.replace(/p[^\w<]{1,3}lizas/g, 'pólizas');
  content = content.replace(/P[^\w<]{1,3}liza/g, 'Póliza');
  content = content.replace(/p[^\w<]{1,3}liza/g, 'póliza');
  
  content = content.replace(/pr[^\w<]{1,3}ximos/g, 'próximos');
  content = content.replace(/Pr[^\w<]{1,3}ximamente/g, 'Próximamente');
  
  content = content.replace(/importaci[^\w<]{1,3}n/g, 'importación');
  content = content.replace(/Renovaci[^\w<]{1,3}n/g, 'Renovación');
  content = content.replace(/Informaci[^\w<]{1,3}n/g, 'Información');
  
  content = content.replace(/Electr[^\w<]{1,3}nico/g, 'Electrónico');
  content = content.replace(/Ocurri[^\w<]{1,3} /g, 'Ocurrió ');
  
  // Acentos en á
  content = content.replace(/est[^\w<]{1,3}n /g, 'están ');
  content = content.replace(/inv[^\w<]{1,3}lido/g, 'inválido');
  content = content.replace(/Est[^\w<]{1,3}s /g, 'Estás ');
  
  // Acentos en é
  content = content.replace(/Tel[^\w<]{1,3}fono/g, 'Teléfono');
  
  // Acentos en ú
  content = content.replace(/A[^\w<]{1,3}n /g, 'Aún ');
  content = content.replace(/N[^\w<]{1,3}mero/g, 'Número');
  
  // Signos de interrogación (the non-word char before Seguro)
  content = content.replace(/[^\w<"\(]Seguro/g, '¿Seguro');
  content = content.replace(/[^\w<"\(]Estás/g, '¿Estás');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
