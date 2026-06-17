import { supabase } from './supabaseClient.js';

// Modèle "portail unique" : pas d'auth par utilisateur. Attribution souple via un
// prénom stocké en local (localStorage 'jira_nom').
export function getNom() { return localStorage.getItem('jira_nom') || ''; }
export function setNom(n) { localStorage.setItem('jira_nom', n); }

// ---------- Projets ----------
export async function listProjets() {
  const { data, error } = await supabase
    .from('jira_projet').select('*').eq('archive', false)
    .order('cree_le', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createProjet(nom) {
  const { data, error } = await supabase
    .from('jira_projet').insert({ nom }).select().single();
  if (error) throw error;
  return data;
}

export async function archiveProjet(id) {
  const { error } = await supabase.from('jira_projet').update({ archive: true }).eq('id', id);
  if (error) throw error;
}

// ---------- Tickets ----------
const TICKET_COLS = 'id,projet_id,titre,description,statut,priorite,type,assigne_nom,cree_le,maj_le';

export async function listTickets(projetId, filters = {}) {
  let q = supabase.from('jira_ticket').select(TICKET_COLS).eq('projet_id', projetId);
  if (filters.statut)   q = q.eq('statut', filters.statut);
  if (filters.priorite) q = q.eq('priorite', filters.priorite);
  if (filters.type)     q = q.eq('type', filters.type);
  if (filters.q)        q = q.ilike('titre', `%${filters.q}%`);
  q = q.order('maj_le', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTicket(t) {
  const { data, error } = await supabase
    .from('jira_ticket').insert({ ...t }).select(TICKET_COLS).single();
  if (error) throw error;
  return data;
}

export async function updateTicket(id, fields) {
  const { data, error } = await supabase
    .from('jira_ticket').update(fields).eq('id', id).select(TICKET_COLS).single();
  if (error) throw error;
  return data;
}

export async function deleteTicket(id) {
  const { error } = await supabase.from('jira_ticket').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Commentaires ----------
export async function listCommentaires(ticketId) {
  const { data, error } = await supabase
    .from('jira_commentaire').select('*').eq('ticket_id', ticketId)
    .order('cree_le', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCommentaire(ticketId, contenu) {
  const { data, error } = await supabase
    .from('jira_commentaire')
    .insert({ ticket_id: ticketId, contenu, auteur_nom: getNom() || 'Anonyme' })
    .select().single();
  if (error) throw error;
  return data;
}
