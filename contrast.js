const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Increase contrast by bumping text colors darker
content = content.replace(/text-slate-600/g, 'text-slate-700');
content = content.replace(/text-slate-500/g, 'text-slate-600');
content = content.replace(/text-slate-400/g, 'text-slate-500');
content = content.replace(/text-slate-300/g, 'text-slate-400');

// Handle placeholders if they were missed (they should be caught by the above if they are e.g., placeholder:text-slate-400)
// wait, the above replaces "text-slate-400" even inside "placeholder:text-slate-400", so that's good.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Contrast improved in page-client.tsx');
