import { useEffect, useState } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { listTickets, createTicket, updateTicket } from './api.js';

export const STATUTS = [
  { key: 'a_faire', label: 'À faire',          pill: 'todo' },
  { key: 'en_cours', label: 'En cours',         pill: 'prog' },
  { key: 'bloque',   label: 'Bloqué / Attente', pill: 'bloque' },
  { key: 'termine',  label: 'Terminé',          pill: 'termine' }
];
export const statutMeta = k => STATUTS.find(s => s.key === k) || STATUTS[0];

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
        {t.assigne_nom && <div className="av-sm">{t.assigne_nom.slice(0, 2).toUpperCase()}</div>}
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

export default function Board({ projetId, onOpen }) {
  const [tickets, setTickets] = useState([]);
  const [creating, setCreating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() { setTickets(await listTickets(projetId)); }
  useEffect(() => { load().catch(console.error); }, [projetId]);

  async function move(ticket, statut) {
    if (ticket.statut === statut) return;
    setTickets(ts => ts.map(t => t.id === ticket.id ? { ...t, statut } : t)); // optimiste
    try { await updateTicket(ticket.id, { statut }); }
    catch (e) { console.error(e); load(); }
  }

  function onDragEnd(ev) {
    const { active, over } = ev;
    if (!over) return;
    const ticket = tickets.find(t => t.id === active.id);
    if (ticket) move(ticket, over.id);
  }

  async function addTicket() {
    const titre = prompt('Titre du ticket :');
    if (!titre) return;
    setCreating(true);
    try {
      const t = await createTicket({ projet_id: projetId, titre: titre.trim(), statut: 'a_faire' });
      setTickets(ts => [t, ...ts]);
    } catch (e) { console.error(e); alert('Création impossible : ' + e.message); }
    finally { setCreating(false); }
  }

  return (
    <>
      <div className="row spread">
        <div className="muted">{tickets.length} ticket(s)</div>
        <button className="btn" onClick={addTicket} disabled={creating}>+ Nouveau ticket</button>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="board">
          {STATUTS.map(s => (
            <Column key={s.key} statut={s}
                    tickets={tickets.filter(t => t.statut === s.key)}
                    onOpen={onOpen} onMove={move} />
          ))}
        </div>
      </DndContext>
    </>
  );
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function shortId(id) { return id.slice(0, 8); }
