import { supabase } from './supabaseClient.js';
import { sanitizeSearchTerm } from './utils.js';

// Modèle authentifié (Supabase Auth) : l'utilisateur courant identifie qui crée,
// assigne et commente. L'accès aux données est filtré côté base par le RLS.
export async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Non authentifié.');
  return user.id;
}

// ---------- Projets ----------
export async function listProjets() {
  const { data, error } = await supabase
    .from('projet').select('*').eq('archive', false)
    .order('cree_le', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createProjet(nom) {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from('projet').insert({ nom, cree_par: uid }).select().single();
  if (error) throw error;
  // Le créateur devient membre — requis par le RLS pour accéder aux tickets du projet.
  const { error: mErr } = await supabase
    .from('membre_projet').insert({ projet_id: data.id, user_id: uid });
  if (mErr) throw mErr;
  return data;
}

export async function archiveProjet(id) {
  const { error } = await supabase.from('projet').update({ archive: true }).eq('id', id);
  if (error) throw error;
}

// ---------- Tickets ----------
const TICKET_COLS = 'id,projet_id,titre,description,statut,priorite,type,assigne_id,cree_par,cree_le,maj_le';

export async function listTickets(projetId, filters = {}) {
  let q = supabase.from('ticket').select(TICKET_COLS).eq('projet_id', projetId);
  if (filters.statut)   q = q.eq('statut', filters.statut);
  if (filters.priorite) q = q.eq('priorite', filters.priorite);
  if (filters.type)     q = q.eq('type', filters.type);
  if (filters.q) {
    // Recherche sur le titre OU la description. On neutralise les caractères qui
    // casseraient la syntaxe du filtre .or() de PostgREST (virgules, parenthèses…).
    const safe = sanitizeSearchTerm(filters.q);
    if (safe) q = q.or(`titre.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  q = q.order('maj_le', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTicket(t) {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from('ticket').insert({ ...t, cree_par: uid }).select(TICKET_COLS).single();
  if (error) throw error;
  return data;
}

export async function updateTicket(id, fields) {
  const { data, error } = await supabase
    .from('ticket').update(fields).eq('id', id).select(TICKET_COLS).single();
  if (error) throw error;
  return data;
}

export async function deleteTicket(id) {
  const { error } = await supabase.from('ticket').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Commentaires ----------
export async function listCommentaires(ticketId) {
  const { data, error } = await supabase
    .from('commentaire').select('*').eq('ticket_id', ticketId)
    .order('cree_le', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCommentaire(ticketId, contenu) {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from('commentaire')
    .insert({ ticket_id: ticketId, contenu, auteur_id: uid })
    .select().single();
  if (error) throw error;
  return data;
}
