import { useEffect, useState } from 'react';
import { listProjets, createProjet, getNom, setNom } from './api.js';
import Board from './Board.jsx';
import Search from './Search.jsx';
import TicketModal from './TicketModal.jsx';

export default function App() {
  const [projets, setProjets] = useState([]);
  const [projetId, setProjetId] = useState(null);
  const [tab, setTab] = useState('board');
  const [openTicket, setOpenTicket] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nom, setNomState] = useState(getNom());

  useEffect(() => {
    listProjets().then(p => {
      setProjets(p);
      if (p.length && !projetId) setProjetId(p[0].id);
    }).catch(console.error);
  }, []);

  // Demande du prénom (attribution souple, stocké en local)
  if (!nom) {
    return (
      <div className="login">
        <form className="box" onSubmit={e => { e.preventDefault(); const v = e.target.nom.value.trim(); if (v) { setNom(v); setNomState(v); } }}>
          <div className="logo">J</div>
          <h1>Jiralike</h1>
          <div className="muted">Ton prénom (pour signer tes commentaires).</div>
          <label>Prénom</label>
          <input className="input" name="nom" autoFocus required />
          <button className="btn">Entrer</button>
        </form>
      </div>
    );
  }

  const refresh = () => setRefreshKey(k => k + 1);

  async function newProjet() {
    const n = prompt('Nom du projet :');
    if (!n) return;
    const p = await createProjet(n.trim());
    setProjets(prev => [...prev, p]);
    setProjetId(p.id);
  }

  return (
    <>
      <header className="app-header">
        <div className="logo">J</div>
        <div className="brand">Jiralike</div>
        <select className="input" value={projetId || ''} onChange={e => setProjetId(e.target.value)}>
          {projets.length === 0 && <option value="">Aucun projet</option>}
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <button className="btn ghost" onClick={newProjet}>+ Projet</button>
        <div className="me">
          <span>{nom}</span>
          <div className="avatar">{nom.slice(0, 2).toUpperCase()}</div>
          <button className="btn ghost" onClick={() => { setNom(''); setNomState(''); }}>Changer</button>
        </div>
      </header>

      <div className="wrap">
        <div className="tabs">
          <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</button>
          <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Recherche &amp; filtres</button>
        </div>

        {!projetId
          ? <p className="muted">Crée un projet pour commencer.</p>
          : tab === 'board'
            ? <Board key={`b-${projetId}-${refreshKey}`} projetId={projetId} onOpen={setOpenTicket} />
            : <Search key={`s-${projetId}-${refreshKey}`} projetId={projetId} onOpen={setOpenTicket} />}
      </div>

      {openTicket && (
        <TicketModal ticket={openTicket} onClose={() => setOpenTicket(null)} onChanged={refresh} />
      )}
    </>
  );
}
