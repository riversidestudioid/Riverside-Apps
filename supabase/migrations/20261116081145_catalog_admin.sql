begin;
create schema if not exists private;
grant usage on schema private to anon, authenticated;
create table public.admin_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_members enable row level security;
revoke all on public.admin_members from anon, authenticated;
grant select on public.admin_members to authenticated;
create policy own_membership on public.admin_members for select to authenticated using (user_id = (select auth.uid()));
-- The membership table has no anonymous policy and exposes only the caller's own row.
grant select on public.admin_members to anon;
create function private.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$
 select case when (select auth.uid()) is null then false else exists(select 1 from public.admin_members where user_id = (select auth.uid())) end;
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;
create table public.categories (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check(length(name) between 1 and 80), icon text not null default 'grid', sort_order integer not null default 0, is_active boolean not null default true
);
create table public.apps (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check(length(name) between 1 and 120), tagline text not null default '', short_description text not null default '', description text not null default '',
 category_id uuid references public.categories(id) on delete restrict, platform text not null default 'web' check(platform in ('web','desktop','mobile')),
 status text not null default 'draft' check(status in ('draft','published','archived')), is_visible boolean not null default false,
 is_featured boolean not null default false, featured_order integer not null default 0,
 demo_url text check(demo_url is null or demo_url ~ '^https://[^[:space:]]+$'), launch_url text check(launch_url is null or launch_url ~ '^https://[^[:space:]]+$'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 0
);
create index apps_category_idx on public.apps(category_id);
create index apps_public_idx on public.apps(featured_order, name) where status='published' and is_visible;
create table public.plans (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 name text not null check(length(name) between 1 and 100), billing_type text not null check(billing_type in ('free','one_time','monthly','yearly')),
 price_idr integer check(price_idr >= 0), currency text not null default 'IDR' check(currency='IDR'),
 license_policy text not null default '', features text[] not null default '{}', is_active boolean not null default true,
 check(price_idr is null or (billing_type='free' and price_idr=0) or (billing_type<>'free' and price_idr>0))
);
create index plans_app_idx on public.plans(app_id);
create table public.app_media (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 kind text not null check(kind in ('thumbnail','screenshot','video','youtube')), storage_path text unique, youtube_id text,
 alt_text text not null check(length(alt_text) between 1 and 250), sort_order integer not null default 0,
 check((kind='youtube' and storage_path is null and youtube_id ~ '^[A-Za-z0-9_-]{11}$') or (kind<>'youtube' and youtube_id is null and storage_path is not null)),
 check(storage_path is null or storage_path ~ ('^' || app_id::text || '/[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$'))
);
create index media_app_idx on public.app_media(app_id,sort_order);
create unique index one_thumbnail_per_app on public.app_media(app_id) where kind='thumbnail';
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null,
 action text not null, entity_type text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
-- Trigger uses invoker permissions. Authenticated users can insert only their own audit events.
create function private.record_catalog_change() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(), TG_OP, TG_TABLE_NAME, case when TG_OP='DELETE' then OLD.id else NEW.id end);
 if TG_OP='DELETE' then return OLD; end if; return NEW;
end; $$;
create function private.validate_publication() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 NEW.updated_at=now(); NEW.revision=OLD.revision+1;
 if NEW.status='published' then
  if not NEW.is_visible or NEW.launch_url is null or length(trim(NEW.description))<20 or NEW.category_id is null then raise exception 'Publication incomplete'; end if;
  if not exists(select 1 from public.categories where id=NEW.category_id and is_active) then raise exception 'Inactive category'; end if;
  if not exists(select 1 from public.app_media where app_id=NEW.id and kind='thumbnail') then raise exception 'Thumbnail required'; end if;
  if not exists(select 1 from public.plans where app_id=NEW.id and is_active) or exists(select 1 from public.plans where app_id=NEW.id and is_active and (price_idr is null or length(trim(license_policy))<5)) then raise exception 'Pricing incomplete'; end if;
 end if; return NEW;
end; $$;
create trigger validate_publication before update on public.apps for each row execute function private.validate_publication();
-- New records must start as draft, so publication is always validated by UPDATE.
alter table public.apps add constraint published_requires_visibility check(status<>'published' or is_visible);
create function private.start_as_draft() returns trigger language plpgsql security invoker set search_path='' as $$
begin if NEW.status<>'draft' then raise exception 'Create as draft first'; end if; return NEW; end; $$;
create trigger start_as_draft before insert on public.apps for each row execute function private.start_as_draft();
create function private.protect_published_children() returns trigger language plpgsql security invoker set search_path='' as $$
declare parent_id uuid; parent_status text;
begin
 if TG_OP='UPDATE' and NEW.app_id<>OLD.app_id then raise exception 'App ownership is immutable'; end if;
 parent_id=case when TG_OP='DELETE' then OLD.app_id else NEW.app_id end;
 select status into parent_status from public.apps where id=parent_id for update;
 if parent_status='published' then raise exception 'Unpublish before changing media or pricing'; end if;
 if TG_OP='DELETE' then return OLD; end if; return NEW;
end; $$;
create trigger protect_media before insert or update or delete on public.app_media for each row execute function private.protect_published_children();
create trigger protect_plans before insert or update or delete on public.plans for each row execute function private.protect_published_children();

alter table public.categories enable row level security;
alter table public.apps enable row level security;
alter table public.plans enable row level security;
alter table public.app_media enable row level security;
alter table public.audit_logs enable row level security;
revoke all on public.categories,public.apps,public.plans,public.app_media,public.audit_logs from anon,authenticated;
grant select on public.categories,public.apps,public.plans,public.app_media to anon,authenticated;
grant insert,update,delete on public.categories,public.apps,public.plans,public.app_media to authenticated;
grant select,insert on public.audit_logs to authenticated;
create policy public_categories on public.categories for select to anon,authenticated using (is_active);
create policy public_apps on public.apps for select to anon,authenticated using(status='published' and is_visible and exists(select 1 from public.categories c where c.id=category_id and c.is_active));
create policy public_plans on public.plans for select to anon,authenticated using(is_active and exists(select 1 from public.apps a where a.id=app_id and a.status='published' and a.is_visible));
create policy public_media on public.app_media for select to anon,authenticated using(exists(select 1 from public.apps a where a.id=app_id and a.status='published' and a.is_visible));
create policy admin_categories on public.categories for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_apps on public.apps for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_plans on public.plans for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_media on public.app_media for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy audit_read on public.audit_logs for select to authenticated using((select private.is_admin()));
create policy audit_append on public.audit_logs for insert to authenticated with check((select private.is_admin()) and actor_id=(select auth.uid()));
create trigger audit_apps after insert or update or delete on public.apps for each row execute function private.record_catalog_change();
create trigger audit_categories after insert or update or delete on public.categories for each row execute function private.record_catalog_change();
create trigger audit_media after insert or update or delete on public.app_media for each row execute function private.record_catalog_change();
create trigger audit_plans after insert or update or delete on public.plans for each row execute function private.record_catalog_change();
-- Atomic editor save, with optimistic revision check. No SECURITY DEFINER / service key.
create function public.save_catalog_app(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_app_id uuid := (payload->>'id')::uuid; item jsonb; current_revision integer;
begin
 if not private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 select revision into current_revision from public.apps where id=v_app_id for update;
 if found then
  if current_revision is distinct from (payload->>'revision')::integer then raise exception 'Conflict: reload editor' using errcode='40001'; end if;
  update public.apps set status='draft',is_visible=false where id=v_app_id;
 else
  insert into public.apps(id,slug,name) values(v_app_id,payload->>'slug',payload->>'name');
 end if;
 delete from public.plans where plans.app_id=v_app_id;
 for item in select * from jsonb_array_elements(payload->'plans') loop
  insert into public.plans(app_id,name,billing_type,price_idr,license_policy,features,is_active)
  values(v_app_id,item->>'name',item->>'billing_type',nullif(item->>'price_idr','')::integer,item->>'license_policy',array(select jsonb_array_elements_text(item->'features')),(item->>'is_active')::boolean);
 end loop;
 update public.apps set slug=payload->>'slug',name=payload->>'name',tagline=payload->>'tagline',short_description=payload->>'short_description',description=payload->>'description',category_id=nullif(payload->>'category_id','')::uuid,platform=payload->>'platform',status=payload->>'status',is_visible=(payload->>'is_visible')::boolean,is_featured=(payload->>'is_featured')::boolean,featured_order=(payload->>'featured_order')::integer,demo_url=nullif(payload->>'demo_url',''),launch_url=nullif(payload->>'launch_url','') where id=v_app_id;
 return v_app_id;
end; $$;
revoke all on function public.save_catalog_app(jsonb) from public;
grant execute on function public.save_catalog_app(jsonb) to authenticated;
revoke all on function private.is_admin(), private.record_catalog_change(), private.validate_publication(), private.start_as_draft(), private.protect_published_children() from public;
grant execute on function private.is_admin() to anon,authenticated;

insert into public.categories(slug,name,icon,sort_order) values
 ('church-tools','Church Tools','church',1),('pendidikan','Pendidikan','education',2),('bisnis','Bisnis','business',3),('produktivitas','Produktivitas','layers',4),('utilitas','Utilitas','image',5),('developer','Developer','code',6),('custom-app','Custom App','settings',7);
-- Private Storage: possession of an object path does not expose a draft asset.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('app-media','app-media',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']);
create policy catalog_media_read on storage.objects for select to anon,authenticated using(bucket_id='app-media' and exists(select 1 from public.app_media m join public.apps a on a.id=m.app_id where m.storage_path=storage.objects.name and a.status='published' and a.is_visible));
create policy catalog_media_admin_read on storage.objects for select to authenticated using(bucket_id='app-media' and (select private.is_admin()));
create policy catalog_media_admin_upload on storage.objects for insert to authenticated with check(bucket_id='app-media' and (select private.is_admin()) and exists(select 1 from public.apps a where a.id::text=(storage.foldername(storage.objects.name))[1] and a.status='draft'));
-- No UPDATE/upsert policy: immutable UUID paths prevent replacing a published object.
create policy catalog_media_admin_delete on storage.objects for delete to authenticated using(bucket_id='app-media' and (select private.is_admin()) and not exists(select 1 from public.apps a where a.id::text=(storage.foldername(storage.objects.name))[1] and a.status='published'));
create index audit_actor_idx on public.audit_logs(actor_id);

commit;
