import { useEffect, useState } from 'react';
import { listProjets, createProjet, getNom, setNom } from './api.js';
import Board from './Board.jsx';
import Search from './Search.jsx';
import TicketModal from './TicketModal.jsx';

const ACCESS = import.meta.env.VITE_ACCESS_PASSWORD || '';

function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jiralike">
      <rect width="28" height="28" rx="7" fill="#2563eb" />
      <rect x="6" y="9" width="4" height="13" rx="1.4" fill="#fff" />
      <rect x="12" y="6" width="4" height="16" rx="1.4" fill="#ffffff" fillOpacity="0.92" />
      <rect x="18" y="12" width="4" height="10" rx="1.4" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );
}

export default function App() {
  const [ok, setOk] = useState(() => !ACCESS || sessionStorage.getItem('jira_ok') === '1');
  const [pwErr, setPwErr] = useState('');

  const [projets, setProjets] = useState([]);
  const [projetId, setProjetId] = useState(null);
  const [tab, setTab] = useState('board');
  const [openTicket, setOpenTicket] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nom, setNomState] = useState(getNom());

  useEffect(() => {
    if (!ok || !nom) return;
    listProjets().then(p => {
      setProjets(p);
      if (p.length && !projetId) setProjetId(p[0].id);
    }).catch(console.error);
  }, [ok, nom]);

  // 1) Portail mot de passe partagé (style Wikifluence)
  if (!ok) {
    return (
      <div className="login">
        <form className="box" onSubmit={e => {
          e.preventDefault();
          if (e.target.pw.value === ACCESS) { sessionStorage.setItem('jira_ok', '1'); setOk(true); }
          else setPwErr('Mot de passe incorrect.');
        }}>
          <Logo size={40} />
          <h1>Jiralike</h1>
          <div className="muted">Accès réservé. Saisis le mot de passe d'équipe.</div>
          <label>Mot de passe</label>
          <input className="input" name="pw" type="password" autoFocus required />
          <button className="btn">Entrer</button>
          {pwErr && <div className="err">{pwErr}</div>}
        </form>
      </div>
    );
  }

  // 2) Prénom (attribution souple, stocké en local)
  if (!nom) {
    return (
      <div className="login">
        <form className="box" onSubmit={e => { e.preventDefault(); const v = e.target.nom.value.trim(); if (v) { setNom(v); setNomState(v); } }}>
          <Logo size={40} />
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
        <Logo size={28} />
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
