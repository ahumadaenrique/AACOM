const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;
      
      if (content.includes("|| 'aacom'")) {
        content = content.replace(/\|\| 'aacom'/g, "|| process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom'");
        modified = true;
      }
      
      if (content.includes("{ slug: 'aacom' }")) {
        // Special case: where: { slug: 'aacom' } usually follows let slug = ...
        // We replace it with { slug }
        content = content.replace(/\{\s*slug:\s*'aacom'\s*\}/g, "{ slug }");
        modified = true;
      }
      
      if (content.includes("{ agencyId: 'aacom' }")) {
        content = content.replace(/\{\s*agencyId:\s*'aacom'\s*\}/g, "{ agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }");
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + filePath);
      }
    }
  }
}

walk('src');
console.log('Done replacing fallbacks.');
