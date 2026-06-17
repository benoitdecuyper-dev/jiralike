# Jiralike — V1

Outil interne léger de suivi de tickets pour la Factory team. Stack alignée sur Wikifluence : **React (Vite)** servi par **Node/Express** sur **Render**, données + auth sur **Supabase** (même projet, schéma isolé `tickets` + RLS).

## Fonctionnalités V1
- Connexion via l'auth Wikifluence existante (Supabase Auth).
- Projets (créer / sélectionner / archiver).
- Tickets : titre, description, statut, priorité, assigné, type (tâche/bug).
- Board 4 colonnes **À faire / En cours / Bloqué-Attente / Terminé**, drag & drop (menu déroulant sur mobile).
- Commentaires horodatés par ticket.
- Recherche texte + filtres combinables (statut / priorité / type).

## 1. Base de données (une seule fois)
Dans Supabase → **SQL Editor**, exécuter `db/schema.sql`.
Puis Supabase → **Settings → API → Exposed schemas** : ajouter `tickets`.

> Sécurité : le RLS limite l'accès aux membres d'un projet. À la création d'un projet, le créateur est ajouté comme membre. Pour donner accès à un collègue, insérer une ligne dans `tickets.membre_projet (projet_id, user_id)` (admin V1 ; gestion fine = V2).

## 2. Configuration
Copier `.env.example` en `.env` et renseigner (Supabase → Settings → API) :
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 3. Lancer en local
```
npm install
npm run dev        # http://localhost:5173
```

## 4. Build + run façon production
```
npm run build      # génère dist/
npm start          # sert dist/ sur $PORT (défaut 3000)
```

## 5. Déploiement Render
- Type : **Web Service** (Node).
- Build command : `npm install && npm run build`
- Start command : `npm start`
- Environment : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (les `VITE_` sont injectées au build).
- Pas de secret serveur : seule la clé **anon** publique est utilisée, la sécurité repose sur le **RLS**. Ne jamais mettre la clé `service_role` dans le front.

## Structure
```
db/schema.sql      schéma tickets + RLS
src/               front React (App, Login, Board, TicketModal, Search, api, supabaseClient)
server.js          serveur Express (sert le build)
```

## Notes / limites V1
- L'assigné et les auteurs de commentaires s'affichent par initiales d'identifiant. L'affichage des noms complets + le sélecteur d'assigné (liste des membres) sont prévus en V2 (nécessite d'exposer un annuaire des membres).
- Pas encore : sprints, étiquettes, notifications, pièces jointes, rôles fins (cf. specs V2).
