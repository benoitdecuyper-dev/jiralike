// Petit serveur Node/Express qui sert le build Vite (front + auth/données via Supabase).
// Aligné sur Wikifluence : déploiement en "Web Service" Node sur Render.
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback : toute route renvoie index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Jiralike sur le port ${PORT}`));
