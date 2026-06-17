import { useEffect, useState } from 'react';
import { listTickets } from './api.js';
import { STATUTS, statutMeta } from './Board.jsx';

export default function Search({ projetId, onOpen }) {
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [priorite, setPriorite] = useState('');
  const [type, setType] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const filters = {};
    if (q) filters.q = q;
    if (statut) filters.statut = statut;
    if (priorite) filters.priorite = priorite;
    if (type) filters.type = type;
    const id = setTimeout(() => {
      listTickets(projetId, filters).then(setRows).catch(console.error);
    }, 200); // debounce
    return () => clearTimeout(id);
  }, [projetId, q, statut, priorite, type]);

  return (
    <>
      <div className="h1" style={{ marginTop: 12 }}>Recherche &amp; filtres</div>
      <div className="searchbar">
        <span>⌕</span>
        <input placeholder="Rechercher dans les titres…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="filters">
        <select className="input" value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Statut : tous</option>
          {STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="input" value={priorite} onChange={e => setPriorite(e.target.value)}>
          <option value="">Priorité : toutes</option>
          {['basse', 'moyenne', 'haute'].map(p => <option key={p} value={p}>{cap(p)}</option>)}
        </select>
        <select className="input" value={type} onChange={e => setType(e.target.value)}>
          <option value="">Type : tous</option>
          <option value="tache">Tâche</option>
          <option value="bug">Bug</option>
        </select>
        <button className="btn ghost" onClick={() => { setQ(''); setStatut(''); setPriorite(''); setType(''); }}>
          Réinitialiser
        </button>
      </div>

      <table className="res">
        <thead>
          <tr><th>Clé</th><th>Titre</th><th className="hide-m">Type</th><th>Priorité</th><th>Statut</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="5" className="muted">Aucun résultat.</td></tr>}
          {rows.map(t => {
            const m = statutMeta(t.statut);
            return (
              <tr key={t.id} onClick={() => onOpen(t)}>
                <td className="key">{t.id.slice(0, 8)}</td>
                <td>{t.titre}</td>
                <td className="hide-m"><span className={`type ${t.type}`}>{t.type === 'bug' ? 'Bug' : 'Tâche'}</span></td>
                <td><span className={`chip ${t.priorite}`}>{cap(t.priorite)}</span></td>
                <td><span className={`pill ${m.pill}`}>{m.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
