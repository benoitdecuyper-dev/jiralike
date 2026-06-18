import { useEffect, useState } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { listTickets, createTicket, updateTicket } from './api.js';
import Dialog from './Dialog.jsx';
import { cap, shortId, parseMarkdownTickets } from './utils.js';

export const STATUTS = [
  { key: 'a_faire', label: 'À faire',          pill: 'todo' },
  { key: 'en_cours', label: 'En cours',         pill: 'prog' },
  { key: 'bloque',   label: 'Bloqué / Attente', pill: 'bloque' },
  { key: 'termine',  label: 'Terminé',          pill: 'termine' }
];
export const statutMeta = k => STATUTS.find(s => s.key === k) || STATUTS[0];

const PRIORITES = ['basse', 'moyenne', 'haute'];

function Card({ t, onOpen, onMove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} className="card" {...attributes} {...listeners}
         onClick={() => onOpen(t)}>
      <div className="row spread">
        <span className={`type ${t.type}`}>{t.type === 'bug' ? 'Bug' : 'Tâche'}</span>
        <span className={`chip ${t.priorite}`}>{cap(t.priorite)}</span>
      </div>
      <div className="ttl">{t.titre}</div>
      <div className="meta">
        <span className="key">{shortId(t.id)}</span>
        {t.assigne_id && <div className="av-sm">{t.assigne_id.slice(0, 2).toUpperCase()}</div>}
      </div>
      {/* Fallback mobile : changer le statut sans drag */}
      <select className="input mobile-move" value={t.statut}
              onClick={e => e.stopPropagation()}
              onChange={e => { e.stopPropagation(); onMove(t, e.target.value); }}>
        {STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </div>
  );
}

function Column({ statut, tickets, onOpen, onMove }) {
  const { setNodeRef, isOver } = useDroppable({ id: statut.key });
  return (
    <div ref={setNodeRef} className={`col ${isOver ? 'drop' : ''}`}>
      <h3><span className={`pill ${statut.pill}`}>{statut.label}</span><span className="count">{tickets.length}</span></h3>
      {tickets.map(t => <Card key={t.id} t={t} onOpen={onOpen} onMove={onMove} />)}
    </div>
  );
}

function NewTicketDialog({ onClose, onCreate, creating }) {
  const [titre, setTitre] = useState('');
  const [priorite, setPriorite] = useState('moyenne');
  const [type, setType] = useState('tache');
  return (
    <Dialog title="Nouveau ticket" onClose={onClose}
            onSubmit={() => onCreate({ titre, priorite, type })}
            submitLabel={creating ? '…' : 'Créer'} canSubmit={!creating && titre.trim().length > 0}>
      <label>Titre</label>
      <input className="input" autoFocus value={titre} onChange={e => setTitre(e.target.value)}
             placeholder="Intitulé du ticket" />
      <label>Priorité</label>
      <select className="input" value={priorite} onChange={e => setPriorite(e.target.value)}>
        {PRIORITES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
      </select>
      <label>Type</label>
      <select className="input" value={type} onChange={e => setType(e.target.value)}>
        <option value="tache">Tâche</option>
        <option value="bug">Bug</option>
      </select>
    </Dialog>
  );
}

function ImportDialog({ onClose, onImport, importing }) {
  const [text, setText] = useState('');
  const count = parseMarkdownTickets(text).length;
  return (
    <Dialog title="Importer des tickets (Markdown)" onClose={onClose}
            onSubmit={() => onImport(text)}
            submitLabel={importing ? '…' : `Importer ${count} ticket(s)`}
            canSubmit={!importing && count > 0}>
      <label>Colle une liste Markdown (ex. backlog « prêt à coller »)</label>
      <textarea className="input" style={{ width: '100%', minHeight: 160 }} autoFocus
                value={text} onChange={e => setText(e.target.value)}
                placeholder={'- **FDF-1** Première tâche\n- FDF-2 Deuxième tâche'} />
      <div className="muted" style={{ marginTop: 6 }}>{count} ticket(s) détecté(s). Créés en « À faire », priorité moyenne.</div>
    </Dialog>
  );
}

export default function Board({ projetId, onOpen }) {
  const [tickets, setTickets] = useState([]);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [err, setErr] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    try { setTickets(await listTickets(projetId)); setErr(''); }
    catch (e) { console.error(e); setErr('Chargement des tickets impossible : ' + e.message); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recharge volontairement au seul changement de projet
  useEffect(() => { load(); }, [projetId]);

  async function move(ticket, statut) {
    if (ticket.statut === statut) return;
    setTickets(ts => ts.map(t => t.id === ticket.id ? { ...t, statut } : t)); // optimiste
    try { await updateTicket(ticket.id, { statut }); setErr(''); }
    catch (e) { console.error(e); setErr('Déplacement impossible : ' + e.message); load(); }
  }

  function onDragEnd(ev) {
    const { active, over } = ev;
    if (!over) return;
    const ticket = tickets.find(t => t.id === active.id);
    if (ticket) move(ticket, over.id);
  }

  async function createNew({ titre, priorite, type }) {
    if (!titre.trim()) return;
    setCreating(true);
    try {
      const t = await createTicket({ projet_id: projetId, titre: titre.trim(), statut: 'a_faire', priorite, type });
      setTickets(ts => [t, ...ts]);
      setShowNew(false);
      setErr('');
    } catch (e) { console.error(e); setErr('Création impossible : ' + e.message); }
    finally { setCreating(false); }
  }

  async function importMd(text) {
    const items = parseMarkdownTickets(text);
    if (!items.length) { setErr('Aucun ticket détecté dans le texte collé.'); return; }
    setCreating(true);
    try {
      const created = [];
      for (const it of items) {
        const t = await createTicket({ projet_id: projetId, titre: it.titre, statut: 'a_faire', priorite: it.priorite, type: it.type });
        created.push(t);
      }
      setTickets(ts => [...created.reverse(), ...ts]);
      setShowImport(false);
      setErr('');
    } catch (e) {
      console.error(e);
      setErr('Import interrompu : ' + e.message);
      load(); // resynchronise avec ce qui a effectivement été créé
    } finally { setCreating(false); }
  }

  return (
    <>
      <div className="row spread">
        <div className="muted">{tickets.length} ticket(s)</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost" onClick={() => setShowImport(true)}>Importer</button>
          <button className="btn" onClick={() => setShowNew(true)}>+ Nouveau ticket</button>
        </div>
      </div>
      {err && <div className="banner-err">{err}</div>}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="board">
          {STATUTS.map(s => (
            <Column key={s.key} statut={s}
                    tickets={tickets.filter(t => t.statut === s.key)}
                    onOpen={onOpen} onMove={move} />
          ))}
        </div>
      </DndContext>
      {showNew && <NewTicketDialog onClose={() => setShowNew(false)} onCreate={createNew} creating={creating} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} onImport={importMd} importing={creating} />}
    </>
  );
}
