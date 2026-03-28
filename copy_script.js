const fs = require('fs');
const path = require('path');

function copyReplace(src, dest, searchStr, replaceStr) {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(item => {
      copyReplace(path.join(src, item), path.join(dest, item), searchStr, replaceStr);
    });
  } else {
    let content = fs.readFileSync(src, 'utf8');
    // For API routes, change "news" collection to "kahani" / "kavita"
    content = content.replace(new RegExp(searchStr, 'g'), replaceStr);
    fs.writeFileSync(dest, content);
  }
}

// 1. Copy APIs
copyReplace('app/api/news', 'app/api/kahani', '"news"', '"kahani"');
copyReplace('app/api/news', 'app/api/kavita', '"news"', '"kavita"');

// 2. Copy Frontend CRUD
// Duplicate articles folder
copyReplace('app/articles', 'app/kahani', '/api/news', '/api/kahani');
copyReplace('app/articles', 'app/kavita', '/api/news', '/api/kavita');

console.log('Duplication complete');
