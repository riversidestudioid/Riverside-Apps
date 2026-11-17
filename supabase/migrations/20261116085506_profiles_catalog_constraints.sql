begin;

-- Profiles contain customer-editable identity data, not authorization claims.
-- Admin authority remains in admin_members, which clients cannot insert/update/delete.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, full_name) on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy profiles_read_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_read_admin on public.profiles
  for select to authenticated using ((select private.is_admin()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create function private.touch_profile() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.full_name = trim(new.full_name);
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_profile() from public, anon, authenticated;
create trigger profiles_timestamp before insert or update on public.profiles
  for each row execute function private.touch_profile();

-- No auth.users trigger or elevated SECURITY DEFINER is required: the authenticated
-- application can lazily insert/upsert only its own profile. No secrets or passwords here.
alter table public.apps
  add constraint apps_slug_length check (char_length(slug) <= 120),
  add constraint apps_tagline_length check (char_length(tagline) <= 200),
  add constraint apps_summary_length check (char_length(short_description) <= 500),
  add constraint apps_description_length check (char_length(description) <= 30000),
  add constraint apps_featured_order_nonnegative check (featured_order >= 0),
  add constraint apps_revision_nonnegative check (revision >= 0);
alter table public.categories
  add constraint categories_slug_length check (char_length(slug) <= 80),
  add constraint categories_order_nonnegative check (sort_order >= 0);
alter table public.plans
  add constraint plans_feature_count check (cardinality(features) <= 30),
  add constraint plans_license_length check (char_length(license_policy) <= 2000);
alter table public.app_media
  drop constraint app_media_kind_check,
  add constraint app_media_kind_check check (kind in ('icon', 'thumbnail', 'screenshot', 'video', 'youtube')),
  add constraint media_order_nonnegative check (sort_order >= 0),
  add constraint youtube_id_required check (kind <> 'youtube' or youtube_id is not null);
create unique index one_icon_per_app on public.app_media(app_id) where kind = 'icon';
create index apps_admin_status_idx on public.apps(status, updated_at desc);
create index apps_newest_public_idx on public.apps(created_at desc) where status = 'published' and is_visible;
create index plans_billing_idx on public.plans(billing_type, app_id) where is_active;
create index categories_order_idx on public.categories(sort_order) where is_active;

commit;
