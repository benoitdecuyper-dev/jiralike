-- =====================================================================
-- Jiralike — schéma de base de données (V1)
-- Projet Supabase PARTAGÉ avec Wikifluence : tout est isolé dans le
-- schéma dédié "tickets" + Row Level Security (RLS).
-- Auth réutilisée : auth.users (comptes Wikifluence existants).
-- À exécuter dans le SQL Editor de Supabase.
-- =====================================================================

create schema if not exists tickets;

-- ---------- Enums ----------
do $$ begin
  create type tickets.statut as enum ('a_faire','en_cours','bloque','termine');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tickets.priorite as enum ('basse','moyenne','haute');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tickets.type_ticket as enum ('tache','bug');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists tickets.projet (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  archive    boolean not null default false,
  cree_par   uuid not null references auth.users(id),
  cree_le    timestamptz not null default now()
);

create table if not exists tickets.membre_projet (
  projet_id  uuid not null references tickets.projet(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  primary key (projet_id, user_id)
);

create table if not exists tickets.ticket (
  id          uuid primary key default gen_random_uuid(),
  projet_id   uuid not null references tickets.projet(id) on delete cascade,
  titre       text not null,
  description text default '',
  statut      tickets.statut   not null default 'a_faire',
  priorite    tickets.priorite not null default 'moyenne',
  type        tickets.type_ticket not null default 'tache',
  assigne_id  uuid references auth.users(id),
  cree_par    uuid not null references auth.users(id),
  cree_le     timestamptz not null default now(),
  maj_le      timestamptz not null default now()
);
create index if not exists ticket_projet_idx on tickets.ticket(projet_id);
create index if not exists ticket_titre_idx  on tickets.ticket using gin (to_tsvector('french', titre));

create table if not exists tickets.commentaire (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets.ticket(id) on delete cascade,
  auteur_id  uuid not null references auth.users(id),
  contenu    text not null,
  cree_le    timestamptz not null default now()
);

-- maj_le auto sur ticket
create or replace function tickets.touch_maj_le() returns trigger as $$
begin new.maj_le = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_ticket_maj on tickets.ticket;
create trigger trg_ticket_maj before update on tickets.ticket
  for each row execute function tickets.touch_maj_le();

-- ---------- Row Level Security ----------
-- Règle : un utilisateur n'accède qu'aux projets dont il est membre,
-- et aux tickets / commentaires rattachés.

alter table tickets.projet        enable row level security;
alter table tickets.membre_projet enable row level security;
alter table tickets.ticket        enable row level security;
alter table tickets.commentaire   enable row level security;

-- Helper : l'utilisateur courant est-il membre du projet ?
create or replace function tickets.is_membre(p uuid) returns boolean as $$
  select exists (
    select 1 from tickets.membre_projet mp
    where mp.projet_id = p and mp.user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = tickets;

-- projet : visible/éditable par ses membres ; créable par tout user connecté.
-- NB : le créateur doit pouvoir relire sa ligne juste après l'INSERT (avant
-- d'être inséré dans membre_projet) -> on autorise aussi cree_par = auth.uid().
create policy projet_select on tickets.projet for select
  using (tickets.is_membre(id) or cree_par = auth.uid());
create policy projet_insert on tickets.projet for insert
  with check (cree_par = auth.uid());
create policy projet_update on tickets.projet for update
  using (tickets.is_membre(id));

-- membre_projet : un membre voit la liste ; le créateur du projet ajoute des membres.
-- NB : on autorise aussi user_id = auth.uid() pour que la ligne soit relisible
-- juste après INSERT en return=representation (la ligne n'est pas encore visible
-- par is_membre() dans la même requête PostgREST).
create policy membre_select on tickets.membre_projet for select
  using (user_id = auth.uid() or tickets.is_membre(projet_id));
create policy membre_insert on tickets.membre_projet for insert
  with check (
    user_id = auth.uid()  -- on s'ajoute soi-même (à la création)
    or exists (select 1 from tickets.projet p where p.id = projet_id and p.cree_par = auth.uid())
  );

-- ticket : accessible aux membres du projet
create policy ticket_all on tickets.ticket for all
  using (tickets.is_membre(projet_id))
  with check (tickets.is_membre(projet_id));

-- commentaire : accessible aux membres du projet du ticket ; auteur = soi
create policy comm_select on tickets.commentaire for select
  using (exists (select 1 from tickets.ticket t where t.id = ticket_id and tickets.is_membre(t.projet_id)));
create policy comm_insert on tickets.commentaire for insert
  with check (
    auteur_id = auth.uid()
    and exists (select 1 from tickets.ticket t where t.id = ticket_id and tickets.is_membre(t.projet_id))
  );

-- Exposer le schéma à l'API Supabase.
-- Option 1 (recommandée) : Settings > API > Exposed schemas > ajouter "tickets".
-- Option 2 (par SQL, sans dashboard) : étendre la config PostgREST puis recharger.
--   alter role authenticator set pgrst.db_schemas = 'public, graphql_public, tickets';
--   notify pgrst, 'reload config';
--   notify pgrst, 'reload schema';
grant usage on schema tickets to anon, authenticated;
grant all on all tables in schema tickets to authenticated;
grant all on all functions in schema tickets to authenticated;
