begin;

-- Riverside Apps v2.0: catalog + custom requests (see docs/PRD.md).
-- Non-destructive: no table, column, row or earlier migration is dropped.
-- Pricing tables stay in place but are no longer required for publication.

-- 1. Publication no longer requires an active plan. An icon or a thumbnail is required.
create or replace function private.validate_publication() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 NEW.updated_at=now(); NEW.revision=OLD.revision+1;
 if NEW.status='published' then
  if not NEW.is_visible or NEW.launch_url is null or length(trim(NEW.description))<20 or NEW.category_id is null then raise exception 'Publication incomplete'; end if;
  if not exists(select 1 from public.categories where id=NEW.category_id and is_active) then raise exception 'Inactive category'; end if;
  if not exists(select 1 from public.app_media where app_id=NEW.id and kind in ('icon','thumbnail')) then raise exception 'Icon required'; end if;
 end if; return NEW;
end; $$;

-- 2. Plans are replaced only when the payload explicitly contains "plans".
-- The v2 editor omits them, so existing pricing rows are preserved.
create or replace function public.save_catalog_app(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
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
 if payload ? 'plans' then
  delete from public.plans where plans.app_id=v_app_id;
  for item in select * from jsonb_array_elements(payload->'plans') loop
   insert into public.plans(app_id,name,billing_type,price_idr,license_policy,features,is_active)
   values(v_app_id,item->>'name',item->>'billing_type',nullif(item->>'price_idr','')::integer,item->>'license_policy',array(select jsonb_array_elements_text(item->'features')),(item->>'is_active')::boolean);
  end loop;
 end if;
 update public.apps set key_features=array(select jsonb_array_elements_text(coalesce(payload->'key_features','[]'::jsonb))),slug=payload->>'slug',name=payload->>'name',tagline=payload->>'tagline',short_description=payload->>'short_description',description=payload->>'description',category_id=nullif(payload->>'category_id','')::uuid,platform=payload->>'platform',status=payload->>'status',is_visible=(payload->>'is_visible')::boolean,is_featured=(payload->>'is_featured')::boolean,featured_order=(payload->>'featured_order')::integer,demo_url=nullif(payload->>'demo_url',''),launch_url=nullif(payload->>'launch_url','') where id=v_app_id;
 return v_app_id;
end; $$;

-- 3. Custom app requests. Personal data: readable by admins only.
create table public.custom_requests (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 120 and name = trim(name)),
 email text not null check(char_length(email) <= 254 and email = lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 whatsapp text not null check(whatsapp ~ '^[1-9][0-9]{7,14}$'),
 app_type text not null check(app_type in ('website','web_app','mobile_app','desktop_app')),
 project_name text not null check(char_length(project_name) between 2 and 150 and project_name = trim(project_name)),
 description text not null check(char_length(description) between 20 and 5000),
 privacy_consent_at timestamptz not null,
 status text not null default 'new' check(status in ('new','contacted','discussion','accepted','completed','rejected')),
 admin_notes text not null default '' check(char_length(admin_notes) <= 5000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index custom_requests_status_idx on public.custom_requests(status, created_at desc);
create index custom_requests_created_idx on public.custom_requests(created_at desc);
create index custom_requests_email_idx on public.custom_requests(email, created_at desc);
alter table public.custom_requests enable row level security;
revoke all on public.custom_requests from public, anon, authenticated;
grant select, delete on public.custom_requests to authenticated;
grant update(status, admin_notes) on public.custom_requests to authenticated;
create policy custom_requests_admin_read on public.custom_requests for select to authenticated using((select private.is_admin()));
create policy custom_requests_admin_update on public.custom_requests for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy custom_requests_admin_delete on public.custom_requests for delete to authenticated using((select private.is_admin()));

create function private.touch_custom_request() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=clock_timestamp(); return new; end; $$;
revoke all on function private.touch_custom_request() from public, anon, authenticated;
create trigger custom_requests_timestamp before update on public.custom_requests for each row execute function private.touch_custom_request();
-- Admin changes are audited; anonymous submissions are not attributed to anyone.
create trigger audit_custom_requests after update or delete on public.custom_requests for each row execute function private.record_catalog_change();

-- Short-lived throttle log. Holds only SHA-256 fingerprints computed by the server, never raw IPs.
create table private.custom_request_throttle (
 id bigint generated always as identity primary key,
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
create index custom_request_throttle_lookup_idx on private.custom_request_throttle(fingerprint, created_at);
create index custom_request_throttle_age_idx on private.custom_request_throttle(created_at);
revoke all on private.custom_request_throttle from public, anon, authenticated;

-- The only public write path. SECURITY DEFINER is required so anonymous callers can insert and be
-- rate limited without SELECT access to other submissions. search_path is empty; every name is qualified.
-- Limits: 5/hour per fingerprint, 3/hour per email, 30 per 10 minutes overall.
create function public.submit_custom_request(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_id uuid;
 v_fingerprint text := coalesce(payload->>'client_fingerprint','');
 v_email text := lower(trim(coalesce(payload->>'email','')));
begin
 if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
 if coalesce(payload->>'privacy_consent','') <> 'true' then raise exception 'Privacy consent required' using errcode='22023'; end if;
 if v_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Invalid client fingerprint' using errcode='22023'; end if;
 delete from private.custom_request_throttle where created_at < now() - interval '1 day';
 if (select count(*) from private.custom_request_throttle t where t.fingerprint=v_fingerprint and t.created_at > now() - interval '1 hour') >= 5
  or (select count(*) from public.custom_requests r where r.email=v_email and r.created_at > now() - interval '1 hour') >= 3
  or (select count(*) from public.custom_requests r where r.created_at > now() - interval '10 minutes') >= 30 then
  raise exception 'Too many requests' using errcode='PT429';
 end if;
 insert into public.custom_requests(name,email,whatsapp,app_type,project_name,description,privacy_consent_at)
 values(trim(payload->>'name'),v_email,payload->>'whatsapp',payload->>'app_type',trim(payload->>'project_name'),trim(payload->>'description'),now())
 returning id into v_id;
 insert into private.custom_request_throttle(fingerprint) values(v_fingerprint);
 return v_id;
end; $$;
revoke all on function public.submit_custom_request(jsonb) from public, anon, authenticated;
grant execute on function public.submit_custom_request(jsonb) to anon, authenticated;

-- 4. Site settings: extended whitelist. No secrets are representable; URLs must be HTTPS.
alter table public.site_settings drop constraint site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check check(key in (
 'site_name','tagline','site_description','logo_path','support_email','support_whatsapp',
 'instagram_url','facebook_url','youtube_url','tiktok_url','linkedin_url'));
alter table public.site_settings drop constraint site_settings_value_check;
alter table public.site_settings add constraint site_settings_value_check check(char_length(value) <= 500);
alter table public.site_settings add constraint site_settings_url_value check(
 key not in ('instagram_url','facebook_url','youtube_url','tiktok_url','linkedin_url') or value = '' or value ~ '^https://[^[:space:]]+$');
alter table public.site_settings add constraint site_settings_logo_value check(
 key <> 'logo_path' or value = '' or value ~ '^logo/[a-f0-9-]{36}\.(jpg|png|webp)$');
insert into public.site_settings(key,value) values
 ('site_description','Temukan aplikasi siap pakai atau buat aplikasi custom sesuai kebutuhan gereja, sekolah, bisnis, dan organisasi.'),
 ('logo_path',''),('instagram_url',''),('facebook_url',''),('youtube_url',''),('tiktok_url',''),('linkedin_url','')
on conflict(key) do nothing;

create or replace function public.save_site_settings(payload jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare k text;
begin
 if not private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 foreach k in array array['site_name','tagline','support_email','support_whatsapp'] loop
  if not(payload ? k) then raise exception 'Incomplete settings'; end if;
 end loop;
 foreach k in array array['site_name','tagline','site_description','logo_path','support_email','support_whatsapp','instagram_url','facebook_url','youtube_url','tiktok_url','linkedin_url'] loop
  if payload ? k then
   insert into public.site_settings(key,value) values(k,payload->>k) on conflict(key) do update set value=excluded.value;
  end if;
 end loop;
end;$$;

-- 5. Public logo bucket. Public read is intended (the logo is shown to everyone); writes are admin-only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-assets','site-assets',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy site_assets_admin_read on storage.objects for select to authenticated using(bucket_id='site-assets' and (select private.is_admin()));
create policy site_assets_admin_upload on storage.objects for insert to authenticated with check(
 bucket_id='site-assets' and (select private.is_admin()) and owner_id=(select auth.uid())::text
 and storage.objects.name ~ '^logo/[a-f0-9-]{36}\.(jpg|png|webp)$');
-- No UPDATE policy: logo files are immutable. The active logo cannot be deleted.
create policy site_assets_admin_delete on storage.objects for delete to authenticated using(
 bucket_id='site-assets' and (select private.is_admin())
 and not exists(select 1 from public.site_settings s where s.key='logo_path' and s.value=storage.objects.name));

commit;
