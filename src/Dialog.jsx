// Petite modale de formulaire réutilisable (remplace les prompt()/confirm() natifs).
export default function Dialog({ title, onClose, onSubmit, submitLabel = 'Valider', submitClass = 'btn', canSubmit = true, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <form className="dialog" onClick={e => e.stopPropagation()}
            onSubmit={e => { e.preventDefault(); if (canSubmit) onSubmit(); }}>
        <div className="dlg-title">{title}</div>
        {children}
        <div className="row spread" style={{ marginTop: 18 }}>
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className={submitClass} disabled={!canSubmit}>{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
