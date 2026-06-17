import { useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setMsg(''); setLoading(true);
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password: pw });
      setLoading(false);
      if (error) { setErr(error.message); return; }
      setMsg('Compte créé. Connecte-toi maintenant.');
      setMode('login');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      setLoading(false);
      if (error) setErr('Connexion impossible : ' + error.message);
    }
  }

  return (
    <div className="login">
      <form className="box" onSubmit={submit}>
        <div className="logo">J</div>
        <h1>Jiralike</h1>
        <div className="muted">
          {mode === 'login' ? 'Connecte-toi à ton espace tickets.' : 'Crée ton compte Jiralike.'}
        </div>
        <label>Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Mot de passe</label>
        <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} required minLength={6} />
        <button className="btn" disabled={loading}>
          {loading ? '…' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
        </button>
        {err && <div className="err">{err}</div>}
        {msg && <div className="muted" style={{ marginTop: 10 }}>{msg}</div>}
        <div className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          {mode === 'login'
            ? <>Pas encore de compte ? <a href="#" onClick={e => { e.preventDefault(); setErr(''); setMsg(''); setMode('signup'); }}>Créer un compte</a></>
            : <>Déjà un compte ? <a href="#" onClick={e => { e.preventDefault(); setErr(''); setMsg(''); setMode('login'); }}>Se connecter</a></>}
        </div>
      </form>
    </div>
  );
}
