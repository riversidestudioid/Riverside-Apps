import type { PGlite } from "@electric-sql/pglite";
export const publishedId = "33333333-3333-4333-8333-333333333333";
export const publishedSlug = "alat-sertifikat-uji";
// Database fixtures are test-only and are never imported by src/ or loaded in production.
export async function seedCatalogFixture(db: PGlite) {
  await db.exec(`reset role;
 insert into apps(id,slug,name,tagline,short_description,description,key_features,category_id,is_featured,featured_order,launch_url,demo_url,created_at)
 select '${publishedId}','${publishedSlug}','Alat Sertifikat Uji','Untuk pendidikan','Deskripsi ringkas katalog.','Generator sertifikat dengan pencarian rahasia-katalog pada deskripsi lengkap.',array['Kelola template','Ekspor PDF'],id,true,1,'https://example.com/app','https://example.com/demo','2026-01-01' from categories where slug='pendidikan';
 insert into app_media(app_id,kind,storage_path,alt_text) values
 ('${publishedId}','thumbnail','${publishedId}/44444444-4444-4444-8444-444444444444.png','Thumbnail sertifikat'),
 ('${publishedId}','screenshot','${publishedId}/55555555-5555-4555-8555-555555555555.png','Screenshot pengelolaan template');
 insert into app_media(app_id,kind,youtube_id,alt_text) values('${publishedId}','youtube','dQw4w9WgXcQ','Demo cara menggunakan aplikasi');
 insert into plans(app_id,name,billing_type,price_idr,license_policy,features) values
 ('${publishedId}','Gratis','free',0,'Akses gratis fitur dasar.',array['Kelola template']),
 ('${publishedId}','Sekali Beli','one_time',125000,'Lisensi satu pengguna untuk versi yang dibeli.',array['Ekspor PDF']),
 ('${publishedId}','Bulanan','monthly',49000,'Akses selama satu bulan, tanpa perpanjangan otomatis.',array['Template premium']),
 ('${publishedId}','Tahunan','yearly',499000,'Akses selama satu tahun.',array['Template premium']);
 update apps set status='published',is_visible=true where id='${publishedId}';
 insert into apps(slug,name,description,short_description,category_id,launch_url,created_at)
 select 'bisnis-uji','Bisnis Uji','Solusi bisnis produktif untuk kebutuhan organisasi.','Pencatatan bisnis.',id,'https://example.com/business','2026-11-01' from categories where slug='bisnis';
 insert into app_media(app_id,kind,storage_path,alt_text) select id,'thumbnail',id::text||'/66666666-6666-4666-8666-666666666666.png','Thumbnail bisnis' from apps where slug='bisnis-uji';
 insert into plans(app_id,name,billing_type,price_idr,license_policy,features) select id,'Bisnis Sekali','one_time',200000,'Lisensi satu pengguna.',array['Laporan bisnis'] from apps where slug='bisnis-uji';
 update apps set status='published',is_visible=true where slug='bisnis-uji';
 insert into apps(slug,name,description,category_id) select 'produk-draft-uji','Nama Draft Rahasia','Jangan pernah tampil di katalog publik.',id from categories where slug='pendidikan';
 insert into apps(slug,name,description,category_id) select 'produk-arsip-uji','Nama Arsip Rahasia','Jangan pernah tampil di katalog publik.',id from categories where slug='pendidikan';
 update apps set status='archived' where slug='produk-arsip-uji';
 insert into storage.objects(bucket_id,name) select 'app-media',storage_path from app_media where storage_path is not null;
 `);
}
