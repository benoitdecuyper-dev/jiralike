import { useState } from 'react';
import { supabase } from './supabaseClient.js';
import { authErrorMessage } from './utils.js';
import Dialog from './Dialog.jsx';

// Changement de mot de passe par un utilisateur déjà connecté.
// N'utilise PAS d'email (updateUser sur la session courante) → indépendant du SMTP.
// Sert au cas courant : 1re connexion avec un mot de passe temporaire fourni par l'admin.
export default function ChangePassword({ onClose, onDone }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr('');
    if (pw.length < 6) { setErr('Le mot de passe doit faire au moins 6 caractères.'); return; }
    if (pw !== pw2) { setErr('Les deux mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setErr(authErrorMessage(error)); return; }
    onDone();
  }

  return (
    <Dialog title="Changer mon mot de passe" onClose={onClose} onSubmit={submit}
            submitLabel={loading ? '…' : 'Enregistrer'} canSubmit={!loading}>
      <label>Nouveau mot de passe</label>
      <input className="input" type="password" autoComplete="new-password"
             value={pw} onChange={e => setPw(e.target.value)} />
      <label>Confirme le mot de passe</label>
      <input className="input" type="password" autoComplete="new-password"
             value={pw2} onChange={e => setPw2(e.target.value)} />
      {err && <div className="err">{err}</div>}
    </Dialog>
  );
}
