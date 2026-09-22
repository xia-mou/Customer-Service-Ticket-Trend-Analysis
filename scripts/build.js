const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'index.template.html'), 'utf8');
const analysis = fs.readFileSync(path.join(root, 'src', 'analysis.js'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'src', 'dashboard.js'), 'utf8');
const tickets = JSON.parse(fs.readFileSync(path.join(root, 'data', 'tickets.json'), 'utf8'));

const html = template
  .replace('/* INLINE_ANALYSIS */', analysis)
  .replace('/* INLINE_TICKETS */', `globalThis.Tickets = ${JSON.stringify(tickets)};`)
  .replace('/* INLINE_DASHBOARD */', dashboard);

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log(`Built index.html with ${tickets.length} tickets`);
