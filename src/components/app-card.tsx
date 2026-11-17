import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AppProduct, CategoryOption } from "@/lib/catalog/data";
import { Icon } from "./icon";

const palettes = ["teal", "indigo", "coral", "sky"] as const;
function palette(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}

/** Uploaded icon (private media route) or a neutral gradient tile with the category icon. */
export function AppIcon({
  mediaId,
  fallbackIcon,
  seed,
  size = 64,
  className = "",
  preview = false,
}: {
  mediaId: string | null;
  fallbackIcon: string;
  seed: string;
  size?: number;
  className?: string;
  /** Admin-only signed preview, also for draft media. */
  preview?: boolean;
}) {
  return (
    <span
      className={`app-icon ${mediaId ? "has-image" : `tone-${palette(seed)}`} ${className}`}
      style={{ width: size, height: size }}
    >
      {mediaId ? (
        <Image
          unoptimized
          src={`/media/${mediaId}${preview ? "?preview=1" : ""}`}
          alt=""
          width={size}
          height={size}
        />
      ) : (
        <Icon name={fallbackIcon} size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

export function AppCard({
  app,
  categories,
  headingLevel = 3,
}: {
  app: AppProduct;
  categories: CategoryOption[];
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const category =
    categories.find((c) => c.slug === app.category)?.name ?? app.category;
  return (
    <article className="app-card">
      <div className="app-card-head">
        <AppIcon
          mediaId={app.iconId ?? app.thumbnailId}
          fallbackIcon={app.icon}
          seed={app.slug}
        />
        <div className="app-card-title">
          <Heading>{app.name}</Heading>
          <span className="chip">{category}</span>
        </div>
      </div>
      <p className="app-card-desc">{app.description || app.tagline}</p>
      <Link
        className="app-card-link"
        href={`/apps/${app.slug}`}
        aria-label={`Lihat detail ${app.name}`}
      >
        Lihat Detail <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
