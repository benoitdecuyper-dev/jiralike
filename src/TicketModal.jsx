import { useEffect, useState } from 'react';
import { updateTicket, deleteTicket, listCommentaires, addCommentaire, getUserId } from './api.js';
import { STATUTS, statutMeta } from './Board.jsx';
import Dialog from './Dialog.jsx';
import { cap } from './utils.js';

const PRIORITES = ['basse', 'moyenne', 'haute'];
const TYPES = ['tache', 'bug'];

export default function TicketModal({ ticket, onClose, onChanged }) {
  const [t, setT] = useState(ticket);
  const [titre, setTitre] = useState(ticket.titre);
  const [desc, setDesc] = useState(ticket.description || '');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState(null);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => { listCommentaires(t.id).then(setComments).catch(e => { console.error(e); setErr('Chargement des commentaires impossible : ' + e.message); }); }, [t.id]);
  useEffect(() => { getUserId().then(setUid).catch(console.error); }, []);

  async function patch(fields) {
    try {
      const updated = await updateTicket(t.id, fields);
      setT(updated);
      onChanged?.();
      setErr('');
    } catch (e) { console.error(e); setErr('Enregistrement impossible : ' + e.message); }
  }
  async function saveText() {
    setSaving(true);
    try { await patch({ titre: titre.trim(), description: desc }); }
    finally { setSaving(false); }
  }
  async function send() {
    if (!newComment.trim()) return;
    try {
      const c = await addCommentaire(t.id, newComment.trim());
      setComments(cs => [...cs, c]);
      setNewComment('');
      setErr('');
    } catch (e) { console.error(e); setErr('Commentaire impossible : ' + e.message); }
  }
  async function doDelete() {
    try { await deleteTicket(t.id); onChanged?.(); onClose(); }
    catch (e) { console.error(e); setErr('Suppression impossible : ' + e.message); setConfirmDel(false); }
  }
  // V1 : on ne peut s'assigner que soi-même (pas d'annuaire de membres — cf. V2).
  function toggleAssign() {
    patch({ assigne_id: t.assigne_id === uid ? null : uid });
  }

  const meta = statutMeta(t.statut);
  const mine = uid && t.assigne_id === uid;

  return (
    <>
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
            {err && <div className="banner-err">{err}</div>}
            <input className="input" style={{ width: '100%', fontSize: 18, fontWeight: 700 }}
                   value={titre} onChange={e => setTitre(e.target.value)} onBlur={saveText} />
            <div className="section-lbl">Description</div>
            <textarea className="desc" style={{ width: '100%', minHeight: 90 }}
                      value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveText} />
            {saving && <div className="muted" style={{ fontSize: 12 }}>Enregistrement…</div>}

            <div className="section-lbl">Commentaires ({comments.length})</div>
            {comments.map(c => (
              <div className="comment" key={c.id}>
                <div className="av-sm">{(c.auteur_id || '?').slice(0, 2).toUpperCase()}</div>
                <div className="c-body">
                  <span className="who">{(c.auteur_id || '').slice(0, 8)}</span>
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
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                {t.assigne_id
                  ? <div className="av-sm">{t.assigne_id.slice(0, 2).toUpperCase()}</div>
                  : <span className="muted">Non assigné</span>}
                <button className="btn ghost" onClick={toggleAssign} disabled={!uid}>
                  {mine ? 'Me retirer' : "M'assigner"}
                </button>
              </div>
            </div>
            <div className="field">
              <div className="k">État actuel</div>
              <span className={`pill ${meta.pill}`}>{meta.label}</span>
            </div>
            <div className="field">
              <div className="k">Créé le</div>
              <span className="muted">{new Date(t.cree_le).toLocaleDateString('fr-FR')}</span>
            </div>
            <button className="btn danger" onClick={() => setConfirmDel(true)} style={{ width: '100%' }}>Supprimer</button>
          </div>
        </div>
      </div>
    </div>

    {confirmDel && (
      <Dialog title="Supprimer ce ticket ?" onClose={() => setConfirmDel(false)} onSubmit={doDelete}
              submitLabel="Supprimer" submitClass="btn danger">
        <div className="muted">Cette action est définitive.</div>
      </Dialog>
    )}
    </>
  );
}
