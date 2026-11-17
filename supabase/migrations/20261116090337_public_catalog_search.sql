begin;

-- One public read API: search/filter/order/page execute before PostgREST's row cap.
-- Invoker security preserves table RLS; explicit published checks also hold for admin callers.
create function public.catalog_apps(
  p_query text default '', p_category text default '', p_billing text default '',
  p_sort text default 'featured', p_page integer default 1,
  p_page_size integer default 24, p_featured boolean default false
) returns jsonb language sql stable security invoker set search_path = '' as $$
  with eligible as (
    select a.*, c.slug as category_slug, c.icon as category_icon
    from public.apps a join public.categories c on c.id = a.category_id
    where a.status = 'published' and a.is_visible and c.is_active
      and (not coalesce(p_featured, false) or a.is_featured)
      and (coalesce(p_category, '') in ('', 'semua') or c.slug = p_category)
      and (coalesce(p_billing, '') = '' or exists (
        select 1 from public.plans p where p.app_id = a.id and p.is_active and p.billing_type = p_billing
      ))
      and strpos(lower(concat_ws(' ', a.name, a.tagline, a.short_description, a.description)), lower(left(trim(coalesce(p_query, '')), 200))) > 0
  ), numbered as (
    select e.*, row_number() over(order by
      case when p_sort = 'newest' then e.created_at end desc,
      case when p_sort = 'name' then lower(e.name) end asc,
      case when coalesce(p_sort, 'featured') not in ('newest','name') then e.is_featured::integer end desc,
      case when coalesce(p_sort, 'featured') not in ('newest','name') then e.featured_order end asc,
      lower(e.name) asc, e.id asc
    ) as position from eligible e
  ), paged as (
    select * from numbered
    where position > (least(greatest(coalesce(p_page,1),1),1000)-1) * least(greatest(coalesce(p_page_size,24),1),48)
    order by position limit least(greatest(coalesce(p_page_size,24),1),48)
  )
  select jsonb_build_object(
    'total', (select count(*) from eligible),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', a.id, 'slug', a.slug, 'name', a.name, 'tagline', a.tagline,
      'description', coalesce(nullif(a.short_description,''),a.description),
      'category', a.category_slug, 'icon', a.category_icon,
      'status', 'published', 'isVisible', true, 'featured', a.is_featured,
      'createdAt', a.created_at, 'demoUrl', a.demo_url, 'launchUrl', a.launch_url,
      'thumbnailId', (select m.id from public.app_media m where m.app_id=a.id and m.kind='thumbnail' limit 1),
      'iconId', (select m.id from public.app_media m where m.app_id=a.id and m.kind='icon' limit 1),
      'plans', coalesce((select jsonb_agg(to_jsonb(p) order by p.price_idr asc nulls last, p.billing_type, p.id)
        from public.plans p where p.app_id=a.id and p.is_active),'[]'::jsonb)
    ) order by a.position) from paged a),'[]'::jsonb)
  );
$$;
revoke all on function public.catalog_apps(text,text,text,text,integer,integer,boolean) from public;
grant execute on function public.catalog_apps(text,text,text,text,integer,integer,boolean) to anon, authenticated;
commit;
