const fs = require('fs');

const data = JSON.parse(fs.readFileSync('aacom_report.json', 'utf8'));

let md = `# Diagnóstico de Código: Referencias "AACOM"

A continuación, te presento el diagnóstico de todas las instancias donde **"AACOM"** está "hardcodeado" (escrito en texto fijo) a lo largo de la aplicación. 

Al ser una Aplicación Web Progresiva (PWA) **White-label (marca blanca)**, diseñada para ser utilizada por distintas agencias, es importante que el código sea lo más agnóstico posible.

He categorizado los hallazgos en grupos, con su respectiva evaluación de si el uso es **Correcto**, **Incorrecto** o **Mejorable**.

`;

const categories = {
  fallbackSlugs: {
    title: '1. Fallbacks del Slug de la Agencia (`|| \\'aacom\\'` y defaults de base de datos)',
    desc: 'Se usa `\\'aacom\\'` como fallback cuando no se detecta el subdominio o no hay sesión. También se usa para asignar actividades huérfanas o inicializar datos base.\\n\\n> [!NOTE]\\n> **Evaluación: Mejorable**.\\n> Es aceptable temporalmente para evitar que la app falle, pero lo ideal sería usar una variable de entorno como `process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG` para que el código sea 100% agnóstico y no dependa de la cadena literal "aacom".',
    items: []
  },
  fallbackNames: {
    title: '2. Nombres de Agencia por Defecto (`agencyName = "AACOM"`)',
    desc: 'Se usa como prop por defecto en múltiples componentes (como `ClientHome`, `ActivityClient`, `TeamDirectoryPage`, etc).\\n\\n> [!WARNING]\\n> **Evaluación: Incorrecto para White-label**.\\n> Si a un componente no se le pasa el nombre de la agencia, mostrará "AACOM". Debería ser algo genérico como "Mi Agencia" o tomarse del contexto global/estado de la agencia actual.',
    items: []
  },
  adminEmails: {
    title: '3. Correos y accesos de Super Admin (`enrique.ahumada@aacommx.com`)',
    desc: 'Existen validaciones estrictas atadas a tus correos de AACOM (ej. para dar de alta otros administradores o recibir alertas del Cron).\\n\\n> [!WARNING]\\n> **Evaluación: Funcional pero frágil**.\\n> Es mejor tener estos correos centralizados en variables de entorno (ej. `SUPER_ADMIN_EMAILS`) en lugar de estar "quemados" a lo largo del middleware o los actions.',
    items: []
  },
  domains: {
    title: '4. Dominios quemados (`aacomsoft.com`)',
    desc: 'Enlaces absolutos a la plataforma SaaS (ej. en callbacks de Google Auth, enlaces de referidos o webhooks de Stripe).\\n\\n> [!IMPORTANT]\\n> **Evaluación: Incorrecto**.\\n> Deberían usar una variable centralizada como `process.env.NEXT_PUBLIC_APP_URL` para evitar problemas si algún día cambias de dominio o despliegas en staging.',
    items: []
  },
  uiLogos: {
    title: '5. Textos en Interfaz y Logos (`alt="AACOM"`, textos en el sidebar, etc.)',
    desc: 'Muchos textos visibles en la app dicen "AACOM", "Academia de Ventas AACOM", o los logos tienen `alt="AACOM Seguros"`.\\n\\n> [!WARNING]\\n> **Evaluación: Incorrecto para agencias cliente**.\\n> Estos textos deben reemplazarse por la variable `agency?.name` y los textos estáticos no deberían hacer alusión a AACOM si otra promotoría usará el sistema.',
    items: []
  },
  legal: {
    title: '6. Términos, Privacidad y Landing Page de Ventas',
    desc: 'Las páginas de inicio, landing de ventas (`/presentacion`), términos y condiciones y privacidad mencionan a AACOMSoft.\\n\\n> [!TIP]\\n> **Evaluación: Correcto**.\\n> Dado que AACOM es el proveedor y fabricante del software SaaS (AACOMSoft), tiene sentido que los documentos legales, derechos de autor y landing de ventas hagan referencia a la empresa matriz.',
    items: []
  },
  others: {
    title: '7. Otros (Comentarios de Código, Usuarios Demo)',
    desc: 'Usuarios como `demo@aacommx.com` y muchos comentarios de código que organizan las secciones.\\n\\n> [!NOTE]\\n> **Evaluación: Correcto / Neutro**.\\n> Son comentarios internos para los desarrolladores o correos de prueba. No afectan el comportamiento white-label.',
    items: []
  }
};

Object.keys(data).forEach(file => {
  data[file].forEach(entry => {
    const text = entry.text.toLowerCase();
    let cat = 'others';
    
    if (text.includes('\\'aacom\\'') && (text.includes('slug') || text.includes('agencyid') || text.includes('where'))) {
      cat = 'fallbackSlugs';
    } else if (text.includes('agencyname = ') || text.includes('agency?.name ||') || text.includes('|| "aacom"')) {
      cat = 'fallbackNames';
    } else if (text.includes('enrique.ahumada') || text.includes('@aacommx.com') || text.includes('desarrollo.agencias')) {
      cat = 'adminEmails';
    } else if (text.includes('aacomsoft.com')) {
      cat = 'domains';
    } else if (text.includes('alt=') || text.includes('<span>aacom') || text.includes('aacom cotizador') || text.includes('aacom seguros') || text.includes('title=')) {
      cat = 'uiLogos';
    } else if (file.includes('terminos') || file.includes('privacidad') || file.includes('presentacion') || file.includes('inicio')) {
      cat = 'legal';
    }
    
    categories[cat].items.push(`- **${file}:${entry.line}**: \`${entry.text}\``);
  });
});

Object.keys(categories).forEach(k => {
  md += `## ${categories[k].title}\n${categories[k].desc}\n\n`;
  if (categories[k].items.length > 0) {
    md += `<details><summary>Ver ${categories[k].items.length} ocurrencias encontradas en el código</summary>\n\n${categories[k].items.join('\n')}\n</details>\n\n`;
  } else {
    md += `*No se encontraron ocurrencias para esta categoría.*\n\n`;
  }
});

fs.writeFileSync('C:\\Users\\ahuma\\.gemini\\antigravity\\brain\\808d51c0-824c-4fa3-bc12-0557e429647b\\diagnostic_aacom.md', md);
console.log('Artifact generated successfully.');
