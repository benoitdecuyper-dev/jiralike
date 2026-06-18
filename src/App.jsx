import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { listProjets, createProjet } from './api.js';
import Board from './Board.jsx';
import Search from './Search.jsx';
import TicketModal from './TicketModal.jsx';
import Login from './Login.jsx';
import ResetPassword from './ResetPassword.jsx';
import ChangePassword from './ChangePassword.jsx';
import Dialog from './Dialog.jsx';

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

function NewProjetDialog({ onClose, onCreate }) {
  const [nom, setNom] = useState('');
  return (
    <Dialog title="Nouveau projet" onClose={onClose} onSubmit={() => onCreate(nom)}
            submitLabel="Créer" canSubmit={nom.trim().length > 0}>
      <label>Nom du projet</label>
      <input className="input" autoFocus value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du projet" />
    </Dialog>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [recovery, setRecovery] = useState(false); // arrivée depuis un lien "mot de passe oublié"

  const [projets, setProjets] = useState([]);
  const [projetId, setProjetId] = useState(null);
  const [tab, setTab] = useState('board');
  const [openTicket, setOpenTicket] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNewProjet, setShowNewProjet] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [notice, setNotice] = useState('');
  const [err, setErr] = useState('');

  // Auth Supabase : on suit la session (comptes partagés Wikifluence).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Lien "mot de passe oublié" suivi : Supabase ouvre une session temporaire
      // et émet PASSWORD_RECOVERY → on force l'écran de définition du mot de passe.
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    listProjets().then(p => {
      setProjets(p);
      if (p.length && !projetId) setProjetId(p[0].id);
    }).catch(e => { console.error(e); setErr('Chargement des projets impossible : ' + e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recharge volontairement au seul changement de session
  }, [session]);

  if (!authReady) return null;                       // évite le flash de l'écran de login
  if (recovery) return <ResetPassword onDone={() => setRecovery(false)} />; // reset en cours
  if (!session) return <Login />;                    // pas de session → écran de connexion

  const email = session.user.email || '';
  const initials = (email || '?').slice(0, 2).toUpperCase();
  const refresh = () => setRefreshKey(k => k + 1);

  async function createNewProjet(nom) {
    if (!nom.trim()) return;
    try {
      const p = await createProjet(nom.trim());
      setProjets(prev => [...prev, p]);
      setProjetId(p.id);
      setShowNewProjet(false);
      setErr('');
    } catch (e) { console.error(e); setErr('Création du projet impossible : ' + e.message); }
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
        <button className="btn ghost" onClick={() => setShowNewProjet(true)}>+ Projet</button>
        <div className="me">
          <span>{email}</span>
          <div className="avatar">{initials}</div>
          <button className="btn ghost" onClick={() => setShowChangePw(true)}>Mot de passe</button>
          <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
      </header>

      <div className="wrap">
        {notice && <div className="banner-ok">{notice}</div>}
        {err && <div className="banner-err">{err}</div>}
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
      {showNewProjet && (
        <NewProjetDialog onClose={() => setShowNewProjet(false)} onCreate={createNewProjet} />
      )}
      {showChangePw && (
        <ChangePassword
          onClose={() => setShowChangePw(false)}
          onDone={() => { setShowChangePw(false); setNotice('Mot de passe mis à jour.'); }}
        />
      )}
    </>
  );
}
