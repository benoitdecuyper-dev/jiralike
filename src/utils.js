// Helpers purs (sans dépendance React/réseau) — faciles à tester unitairement.

export function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

export function shortId(id) { return id ? id.slice(0, 8) : ''; }

// Neutralise les caractères qui casseraient la syntaxe du filtre .or() de PostgREST.
export function sanitizeSearchTerm(q) { return (q || '').replace(/[,()*]/g, ' ').trim(); }

// Validation email minimale (présence d'un @ entouré de caractères, un point après).
export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
}

// Traduit les erreurs d'auth Supabase en messages FR clairs pour l'utilisateur.
// On reste volontairement vague sur "identifiants invalides" pour ne pas révéler
// si un email existe (anti-énumération de comptes).
export function authErrorMessage(error) {
  if (!error) return '';
  const raw = (error.message || String(error)).toLowerCase();
  if (raw.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (raw.includes('email not confirmed')) return "Ce compte n'a pas encore été confirmé.";
  if (raw.includes('rate limit') || raw.includes('too many'))
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (raw.includes('network') || raw.includes('fetch'))
    return 'Connexion au serveur impossible. Vérifie ta connexion.';
  if (raw.includes('new password') && raw.includes('different'))
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (raw.includes('password') && raw.includes('6'))
    return 'Le mot de passe doit faire au moins 6 caractères.';
  return error.message || "Une erreur est survenue.";
}

// Parse une liste Markdown "prête à coller" en tickets.
// Règles : on prend les puces (-, *, +, "1.") ; à défaut de puce, chaque ligne
// non vide et non-titre devient un ticket. On retire l'emphase Markdown et une
// éventuelle clé de ticket en tête (ex. "FDF-12", "[FDF-1]").
export function parseMarkdownTickets(md) {
  const lines = (md || '').split(/\r?\n/);
  const bullet = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/;
  const items = [];

  const push = (raw) => {
    let s = (raw || '').replace(/[*_`]/g, '');                 // emphase / code inline
    s = s.replace(/^\s*\[?[A-Za-z]{1,8}-\d+\]?\s*[:.)-]?\s*/, ''); // clé de ticket en tête
    s = s.trim();
    if (s) items.push({ titre: s, type: 'tache', priorite: 'moyenne' });
  };

  let foundBullet = false;
  for (const line of lines) {
    const m = line.match(bullet);
    if (m) { foundBullet = true; push(m[1]); }
  }
  if (!foundBullet) {
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#') || t.startsWith('>')) continue;
      push(t);
    }
  }
  return items;
}
