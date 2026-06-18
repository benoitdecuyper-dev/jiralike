import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants — voir .env.example');
}

// Schéma dédié "tickets" (isolé de Wikifluence), auth Supabase partagée (mêmes
// comptes que Wikifluence). L'accès aux données est contrôlé côté base par le RLS.
// Le schéma doit être déclaré dans Supabase > Settings > API > Exposed schemas.
export const supabase = createClient(url, anon, {
  db: { schema: 'tickets' },
  auth: { persistSession: true, autoRefreshToken: true }
});
