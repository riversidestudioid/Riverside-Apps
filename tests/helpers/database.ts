import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
export const admin = "11111111-1111-4111-8111-111111111111";
export const customer = "22222222-2222-4222-8222-222222222222";
export async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${admin}'),('${customer}'); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated; create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text default auth.uid()::text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`,
  );
  // Execute the complete ordered migration chain, not a hand-picked schema copy.
  for (const filename of readdirSync("supabase/migrations")
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(`supabase/migrations/${filename}`, "utf8"));
  }
  await db.exec(
    `insert into public.admin_members(user_id) values('${admin}');`,
  );
  return db;
}
