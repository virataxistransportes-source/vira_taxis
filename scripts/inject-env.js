/**
 * inject-env.js — Injetar variáveis de ambiente no HTML no build (Vercel / local).
 * Uso: node scripts/inject-env.js
 * Requer GOOGLE_MAPS_KEY em process.env (Vercel) ou no .env (local com dotenv).
 *
 * Na Vercel: em Settings → Environment Variables, crie GOOGLE_MAPS_KEY.
 * Build Command: npm run build | Output Directory: (deixe em branco ou .)
 *
 * Atenção: o script altera index.html no lugar. Se rodar build localmente,
 * não commite em seguida (a chave ficaria no repo). Para reverter: git checkout index.html
 */

const fs = require('fs');
const path = require('path');

// Carrega .env em desenvolvimento local (opcional)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  // dotenv não instalado — usa só process.env (ex.: Vercel)
}

// Aceita GOOGLE_MAPS_KEY ou GOOGLE_MAPS_API_KEY (nome comum na Vercel)
const key = (process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY || '').trim();
if (!key) {
  console.error('');
  console.error('inject-env: variável de ambiente da chave do Google Maps não encontrada.');
  console.error('  Nome esperado: GOOGLE_MAPS_KEY ou GOOGLE_MAPS_API_KEY');
  if (process.env.VERCEL) {
    console.error('  Na Vercel: Project → Settings → Environment Variables');
    console.error('  Adicione GOOGLE_MAPS_KEY para Production (e Preview se quiser).');
  } else {
    console.error('  Local: crie um arquivo .env na raiz com GOOGLE_MAPS_KEY=sua_chave');
  }
  console.error('');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('inject-env: index.html não encontrado em', htmlPath);
  process.exit(1);
}
let html = fs.readFileSync(htmlPath, 'utf8');

if (!html.includes('__GOOGLE_MAPS_KEY__')) {
  console.error('inject-env: Placeholder __GOOGLE_MAPS_KEY__ não encontrado em index.html.');
  process.exit(1);
}

html = html.replace(/__GOOGLE_MAPS_KEY__/g, key.trim());
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('inject-env: GOOGLE_MAPS_KEY injetada em index.html.');
