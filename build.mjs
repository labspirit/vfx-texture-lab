import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + fs.readFileSync(path.join(root, 'style.css'), 'utf8') + '</style>');
for (const file of ['catalog.js', 'model.js', 'post-shader.js', 'renderer.js', 'gif.js', 'layout.js', 'view.js', 'app.js']) {
  html = html.replace('<script src="' + file + '"></script>', () => '<script>' + fs.readFileSync(path.join(root, file), 'utf8') + '</script>');
}
fs.writeFileSync(path.join(root, 'Ember.html'), html);
console.log('Created standalone Ember.html');
