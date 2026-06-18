import { useState } from 'react';
import { supabase } from './supabaseClient.js';
import { authErrorMessage } from './utils.js';

// Affiché quand l'utilisateur revient depuis le lien email de réinitialisation
// (événement Supabase PASSWORD_RECOVERY → une session temporaire existe déjà).
// On définit le nouveau mot de passe via updateUser, puis on entre dans l'app.
export default function ResetPassword({ onDone }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (pw.length < 6) { setErr('Le mot de passe doit faire au moins 6 caractères.'); return; }
    if (pw !== pw2) { setErr('Les deux mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setErr(authErrorMessage(error)); return; }
    onDone(); // session déjà active → on bascule sur l'app
  }

  return (
    <div className="login">
      <form className="box" onSubmit={submit}>
        <div className="logo">J</div>
        <h1>Nouveau mot de passe</h1>
        <div className="muted">Choisis un nouveau mot de passe pour ton compte.</div>

        <label>Nouveau mot de passe</label>
        <input className="input" type="password" autoComplete="new-password"
               value={pw} onChange={e => setPw(e.target.value)} required minLength={6} />

        <label>Confirme le mot de passe</label>
        <input className="input" type="password" autoComplete="new-password"
               value={pw2} onChange={e => setPw2(e.target.value)} required minLength={6} />

        <button className="btn" disabled={loading}>
          {loading ? '…' : 'Enregistrer'}
        </button>

        {err && <div className="err">{err}</div>}
      </form>
    </div>
  );
}
