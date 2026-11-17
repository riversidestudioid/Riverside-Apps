import Image from "next/image";
import Link from "next/link";

export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 58" aria-hidden="true">
      <defs>
        <linearGradient id="brand-gradient" x2="1" y2="1">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0a6f73" />
        </linearGradient>
      </defs>
      <path
        d="M14 3H34C59 3 60 33 37 36L54 54H37L17 32H28C43 32 45 16 30 16H12C1 16 2 3 14 3ZM8 26Q18 20 23 21L18 49Q14 56 2 56L5 35Q5 29 8 26Z"
        fill="url(#brand-gradient)"
      />
    </svg>
  );
}

export function Brand({
  name,
  tagline,
  logoUrl,
  href = "/",
  onNavigate,
}: {
  name: string;
  tagline: string;
  logoUrl?: string | null;
  href?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} className="brand" onClick={onNavigate}>
      {logoUrl ? (
        <Image
          unoptimized
          src={logoUrl}
          alt=""
          width={40}
          height={40}
          className="brand-logo"
        />
      ) : (
        <BrandMark />
      )}
      <span className="brand-text">
        <span className="brand-name">{name}</span>
        <span className="brand-tagline">{tagline}</span>
      </span>
    </Link>
  );
}
