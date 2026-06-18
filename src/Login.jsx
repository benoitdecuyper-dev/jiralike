import { useState } from 'react';
import { supabase } from './supabaseClient.js';
import { isValidEmail, authErrorMessage } from './utils.js';

// Connexion uniquement : pas d'inscription depuis l'app. Les comptes sont ceux,
// déjà existants, du projet Supabase partagé (mêmes comptes que Wikifluence).
// La création de comptes se fait hors de Jiralike (cf. doc d'architecture auth).
export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(next) {
    setMode(next); setErr(''); setMsg(''); setPw('');
  }

  async function submit(e) {
    e.preventDefault();
    setErr(''); setMsg('');

    if (mode === 'forgot') {
      if (!isValidEmail(email)) { setErr('Saisis une adresse email valide.'); return; }
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // doit figurer dans Supabase > Auth > URL Configuration
      });
      setLoading(false);
      // Message neutre volontaire (ne révèle pas si le compte existe).
      if (error) { setErr(authErrorMessage(error)); return; }
      setMsg("Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) setErr(authErrorMessage(error));
  }

  return (
    <div className="login">
      <form className="box" onSubmit={submit}>
        <div className="logo">J</div>
        <h1>Jiralike</h1>
        <div className="muted">
          {mode === 'login'
            ? 'Connecte-toi avec ton compte interne.'
            : 'Réinitialise ton mot de passe.'}
        </div>

        <label>Email</label>
        <input className="input" type="email" autoComplete="username"
               value={email} onChange={e => setEmail(e.target.value)} required />

        {mode === 'login' && (
          <>
            <label>Mot de passe</label>
            <input className="input" type="password" autoComplete="current-password"
                   value={pw} onChange={e => setPw(e.target.value)} required minLength={6} />
          </>
        )}

        <button className="btn" disabled={loading}>
          {loading ? '…' : (mode === 'login' ? 'Se connecter' : 'Envoyer le lien')}
        </button>

        {err && <div className="err">{err}</div>}
        {msg && <div className="muted" style={{ marginTop: 10 }}>{msg}</div>}

        <div className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          {mode === 'login'
            ? <a href="#" onClick={e => { e.preventDefault(); switchMode('forgot'); }}>Mot de passe oublié ?</a>
            : <a href="#" onClick={e => { e.preventDefault(); switchMode('login'); }}>← Retour à la connexion</a>}
        </div>
      </form>
    </div>
  );
}
