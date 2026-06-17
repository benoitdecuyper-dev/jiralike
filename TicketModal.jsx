import { useEffect, useState } from 'react';
import { updateTicket, deleteTicket, listCommentaires, addCommentaire } from './api.js';
import { STATUTS, statutMeta } from './Board.jsx';

const PRIORITES = ['basse', 'moyenne', 'haute'];
const TYPES = ['tache', 'bug'];

export default function TicketModal({ ticket, onClose, onChanged }) {
  const [t, setT] = useState(ticket);
  const [titre, setTitre] = useState(ticket.titre);
  const [desc, setDesc] = useState(ticket.description || '');
  const [assigne, setAssigne] = useState(ticket.assigne_nom || '');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { listCommentaires(t.id).then(setComments).catch(console.error); }, [t.id]);

  async function patch(fields) {
    const updated = await updateTicket(t.id, fields);
    setT(updated);
    onChanged?.();
  }
  async function saveText() {
    setSaving(true);
    try { await patch({ titre: titre.trim(), description: desc, assigne_nom: assigne.trim() || null }); }
    finally { setSaving(false); }
  }
  async function send() {
    if (!newComment.trim()) return;
    const c = await addCommentaire(t.id, newComment.trim());
    setComments(cs => [...cs, c]);
    setNewComment('');
  }
  async function remove() {
    if (!confirm('Supprimer ce ticket ?')) return;
    await deleteTicket(t.id);
    onChanged?.();
    onClose();
  }

  const meta = statutMeta(t.statut);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ gap: 8 }}>
            <span className={`type ${t.type}`}>{t.type === 'bug' ? 'Bug' : 'Tâche'}</span>
            <span className="key">{t.id.slice(0, 8)}</span>
          </div>
          <button className="btn ghost" onClick={onClose}>Fermer</button>
        </div>
        <div className="body">
          <div>
            <input className="input" style={{ width: '100%', fontSize: 18, fontWeight: 700 }}
                   value={titre} onChange={e => setTitre(e.target.value)} onBlur={saveText} />
            <div className="section-lbl">Description</div>
            <textarea className="desc" style={{ width: '100%', minHeight: 90 }}
                      value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveText} />
            {saving && <div className="muted" style={{ fontSize: 12 }}>Enregistrement…</div>}

            <div className="section-lbl">Commentaires ({comments.length})</div>
            {comments.map(c => (
              <div className="comment" key={c.id}>
                <div className="av-sm">{(c.auteur_nom || '?').slice(0, 2).toUpperCase()}</div>
                <div className="c-body">
                  <span className="who">{c.auteur_nom || 'Anonyme'}</span>
                  <span className="when">{new Date(c.cree_le).toLocaleString('fr-FR')}</span>
                  <div>{c.contenu}</div>
                </div>
              </div>
            ))}
            <div className="comment">
              <textarea className="input" style={{ flex: 1 }} placeholder="Ajouter un commentaire…"
                        value={newComment} onChange={e => setNewComment(e.target.value)} />
            </div>
            <button className="btn" onClick={send} style={{ marginTop: 8 }}>Commenter</button>
          </div>

          <div className="side">
            <div className="field">
              <div className="k">Statut</div>
              <select className="input" value={t.statut} onChange={e => patch({ statut: e.target.value })}>
                {STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="k">Priorité</div>
              <select className="input" value={t.priorite} onChange={e => patch({ priorite: e.target.value })}>
                {PRIORITES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="k">Type</div>
              <select className="input" value={t.type} onChange={e => patch({ type: e.target.value })}>
                {TYPES.map(x => <option key={x} value={x}>{x === 'bug' ? 'Bug' : 'Tâche'}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="k">Assigné</div>
              <input className="input" style={{ width: '100%' }} placeholder="Prénom"
                     value={assigne} onChange={e => setAssigne(e.target.value)} onBlur={saveText} />
            </div>
            <div className="field">
              <div className="k">État actuel</div>
              <span className={`pill ${meta.pill}`}>{meta.label}</span>
            </div>
            <div className="field">
              <div className="k">Créé le</div>
              <span className="muted">{new Date(t.cree_le).toLocaleDateString('fr-FR')}</span>
            </div>
            <button className="btn danger" onClick={remove} style={{ width: '100%' }}>Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
