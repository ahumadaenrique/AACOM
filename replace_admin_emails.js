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

      // Replace targetUser.email === "enrique.ahumada@aacommx.com"
      if (content.includes('targetUser.email === "enrique.ahumada@aacommx.com"')) {
        content = content.replace(/targetUser\.email === "enrique\.ahumada@aacommx\.com"/g, '(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(targetUser.email)');
        modified = true;
      }
      
      // Replace currentUser.email !== 'enrique.ahumada@aacommx.com'
      if (content.includes("currentUser.email !== 'enrique.ahumada@aacommx.com'")) {
        content = content.replace(/currentUser\.email !== 'enrique\.ahumada@aacommx\.com'/g, '!(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(currentUser.email)');
        modified = true;
      }

      // Replace dbUser?.email !== 'enrique.ahumada@aacommx.com'
      if (content.includes("dbUser?.email !== 'enrique.ahumada@aacommx.com'")) {
        content = content.replace(/dbUser\?\.email !== 'enrique\.ahumada@aacommx\.com'/g, '!(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(dbUser?.email || "")');
        modified = true;
      }

      // Replace user.email !== 'enrique.ahumada@aacommx.com'
      if (content.includes("user.email !== 'enrique.ahumada@aacommx.com'")) {
        content = content.replace(/user\.email !== 'enrique\.ahumada@aacommx\.com'/g, '!(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(user.email || "")');
        modified = true;
      }

      // Replace user.email === 'enrique.ahumada@aacommx.com'
      if (content.includes("user.email === 'enrique.ahumada@aacommx.com'")) {
        content = content.replace(/user\.email === 'enrique\.ahumada@aacommx\.com'/g, '(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(user.email || "")');
        modified = true;
      }

      // Replace lowerEmail === "enrique.ahumada@aacommx.com" || lowerEmail === "desarrollo.agencias@gmail.com"
      if (content.includes('lowerEmail === "enrique.ahumada@aacommx.com" || lowerEmail === "desarrollo.agencias@gmail.com"')) {
        content = content.replace(/lowerEmail === "enrique\.ahumada@aacommx\.com" \|\| lowerEmail === "desarrollo\.agencias@gmail\.com"/g, '(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com,desarrollo.agencias@gmail.com").includes(lowerEmail)');
        modified = true;
      }

      // Replace to: "enrique.ahumada@aacommx.com" in support/route.ts
      if (content.includes('to: "enrique.ahumada@aacommx.com", // Tu correo para recibir alertas')) {
        content = content.replace(/to: "enrique\.ahumada@aacommx\.com", \/\/ Tu correo para recibir alertas/g, 'to: process.env.SUPPORT_EMAIL || "enrique.ahumada@aacommx.com", // Tu correo para recibir alertas');
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
console.log('Done replacing admin emails.');
