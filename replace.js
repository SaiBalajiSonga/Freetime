const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (filePath.includes('middleware.ts')) {
      if (content.includes("!request.nextUrl.pathname.startsWith('/login') &&")) {
        content = content.replace("!request.nextUrl.pathname.startsWith('/login') &&\\n    ", "");
        modified = true;
      }
      if (content.includes("url.pathname = '/login'")) {
        content = content.replace("url.pathname = '/login'", "url.pathname = '/'");
        modified = true;
      }
    } else {
      if (content.includes("redirect('/login')")) {
        content = content.replace(/redirect\('\/login'\)/g, "redirect('/')");
        modified = true;
      }
      if (content.includes("href=\"/login\"")) {
        content = content.replace(/href="\/login"/g, "href=\"/\"");
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
