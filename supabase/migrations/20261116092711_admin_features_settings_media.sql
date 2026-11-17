begin;
alter table public.apps add column key_features text[] not null default '{}';
alter table public.apps add constraint apps_key_feature_count check(cardinality(key_features)<=30 and array_position(key_features,null) is null);

create table public.site_settings (
 id uuid unique not null default gen_random_uuid(),
 key text primary key check(key in ('site_name','tagline','support_email','support_whatsapp')),
 value text not null check(char_length(value)<=200),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null
);
create index settings_actor_idx on public.site_settings(updated_by);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from public,anon,authenticated;
grant select(key,value) on public.site_settings to anon,authenticated;
grant insert(key,value),update(value) on public.site_settings to authenticated;
create policy settings_public_read on public.site_settings for select to anon,authenticated using(true);
create policy settings_admin_insert on public.site_settings for insert to authenticated with check((select private.is_admin()));
create policy settings_admin_update on public.site_settings for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create function private.touch_settings() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=clock_timestamp();new.updated_by=auth.uid();return new;end;$$;
revoke all on function private.touch_settings() from public,anon,authenticated;
create trigger settings_timestamp before insert or update on public.site_settings for each row execute function private.touch_settings();
create trigger audit_settings after insert or update on public.site_settings for each row execute function private.record_catalog_change();
insert into public.site_settings(key,value) values('site_name','Riverside Apps'),('tagline','by Riverside Studio'),('support_email',''),('support_whatsapp','');

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
 delete from public.plans where plans.app_id=v_app_id;
 for item in select * from jsonb_array_elements(payload->'plans') loop
  insert into public.plans(app_id,name,billing_type,price_idr,license_policy,features,is_active)
  values(v_app_id,item->>'name',item->>'billing_type',nullif(item->>'price_idr','')::integer,item->>'license_policy',array(select jsonb_array_elements_text(item->'features')),(item->>'is_active')::boolean);
 end loop;
 update public.apps set key_features=array(select jsonb_array_elements_text(coalesce(payload->'key_features','[]'::jsonb))),slug=payload->>'slug',name=payload->>'name',tagline=payload->>'tagline',short_description=payload->>'short_description',description=payload->>'description',category_id=nullif(payload->>'category_id','')::uuid,platform=payload->>'platform',status=payload->>'status',is_visible=(payload->>'is_visible')::boolean,is_featured=(payload->>'is_featured')::boolean,featured_order=(payload->>'featured_order')::integer,demo_url=nullif(payload->>'demo_url',''),launch_url=nullif(payload->>'launch_url','') where id=v_app_id;
 return v_app_id;
end; $$;

-- Atomic media replacement keeps the existing media UUID and the old object until commit.
create function public.save_catalog_media(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_app uuid := (payload->>'app_id')::uuid; v_id uuid := nullif(payload->>'id','')::uuid; v_status text;
begin
 if not private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 select status into v_status from public.apps where id=v_app for update;
 if v_status is distinct from 'draft' then raise exception 'Media requires draft'; end if;
 if v_id is null then
  insert into public.app_media(app_id,kind,storage_path,youtube_id,alt_text,sort_order)
  values(v_app,payload->>'kind',nullif(payload->>'storage_path',''),nullif(payload->>'youtube_id',''),payload->>'alt_text',(payload->>'sort_order')::integer)
  returning id into v_id;
 else
  update public.app_media set storage_path=nullif(payload->>'storage_path',''),youtube_id=nullif(payload->>'youtube_id',''),alt_text=payload->>'alt_text',sort_order=(payload->>'sort_order')::integer
  where id=v_id and app_id=v_app and kind=payload->>'kind';
  if not found then raise exception 'Invalid media replacement'; end if;
 end if;
 return v_id;
end;$$;
revoke all on function public.save_catalog_media(jsonb) from public;
grant execute on function public.save_catalog_media(jsonb) to authenticated;

drop policy catalog_media_admin_upload on storage.objects;
create policy catalog_media_admin_upload on storage.objects for insert to authenticated with check(
 bucket_id='app-media' and (select private.is_admin()) and owner_id=(select auth.uid())::text
 and exists(select 1 from public.apps a where a.id::text=(storage.foldername(storage.objects.name))[1] and a.status='draft'
 and storage.objects.name ~ ('^'||a.id::text||'/[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$'))
);
drop policy catalog_media_admin_delete on storage.objects;
create policy catalog_media_admin_delete on storage.objects for delete to authenticated using(
 bucket_id='app-media' and (select private.is_admin()) and not exists(
 select 1 from public.app_media m join public.apps a on a.id=m.app_id where m.storage_path=storage.objects.name and a.status='published')
);
create function public.save_site_settings(payload jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare k text;
begin
 if not private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 foreach k in array array['site_name','tagline','support_email','support_whatsapp'] loop
  if not(payload ? k) then raise exception 'Incomplete settings'; end if;
  insert into public.site_settings(key,value) values(k,payload->>k) on conflict(key) do update set value=excluded.value;
 end loop;
end;$$;
revoke all on function public.save_site_settings(jsonb) from public;
grant execute on function public.save_site_settings(jsonb) to authenticated;
commit;
