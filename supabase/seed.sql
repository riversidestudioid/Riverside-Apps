-- Optional LOCAL/STAGING fixtures. Not applied automatically by this implementation.
-- Never set published, visible, prices, or fake URLs from design references.
insert into public.apps(slug,name,tagline,short_description,description,category_id,status,is_visible)
select seed.slug,seed.name,seed.tagline,seed.description,seed.description,c.id,'draft',false
from (values
 ('sagi-worship','Sagi Worship','Worship Presentation Software','Aplikasi presentasi lirik, ayat, dan media untuk ibadah gereja.','church-tools'),
 ('rscertio','RSCertio','Certificate Generator','Generator sertifikat berbasis template dan daftar nama.','pendidikan'),
 ('resizefoto','ResizeFoto','Image Utility','Pengubah ukuran dan kompresi foto.','utilitas')
) as seed(slug,name,tagline,description,category_slug)
join public.categories c on c.slug=seed.category_slug
on conflict(slug) do nothing;
