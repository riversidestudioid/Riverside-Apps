/** Decorative hero artwork (inline SVG, no external image host), matching the owner's reference design. */
export function HeroLaptop() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 760 450" fill="none">
        <defs>
          <linearGradient id="laptop-blob" x2="1" y2="1">
            <stop stopColor="#b9f3ee" />
            <stop offset="1" stopColor="#e4f7fd" />
          </linearGradient>
          <linearGradient id="laptop-screen" x2="1" y2="1">
            <stop stopColor="#f0f5ff" />
            <stop offset="1" stopColor="#b8e3ee" />
          </linearGradient>
          <linearGradient id="laptop-metal">
            <stop stopColor="#8d99aa" />
            <stop offset=".17" stopColor="#eef2f6" />
            <stop offset=".5" stopColor="#a6b0be" />
            <stop offset=".8" stopColor="#f7f9fa" />
            <stop offset="1" stopColor="#758295" />
          </linearGradient>
          <linearGradient id="laptop-teal" x2="1" y2="1">
            <stop stopColor="#00b8a9" />
            <stop offset="1" stopColor="#005775" />
          </linearGradient>
          <filter
            id="laptop-shadow"
            x="-30%"
            y="-100%"
            width="160%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="13" />
          </filter>
          <clipPath id="screen-clip">
            <path d="M268 94 631 54 595 319 230 319Z" />
          </clipPath>
        </defs>
        <path
          d="M77 330C150 244 151 54 269 35C382 15 444 95 545 98C633 101 698 62 718 136C733 192 675 258 654 333Z"
          fill="url(#laptop-blob)"
        />
        <ellipse
          cx="420"
          cy="380"
          rx="287"
          ry="15"
          fill="#253c60"
          opacity=".14"
          filter="url(#laptop-shadow)"
        />
        <path
          d="M68 366C207 344 578 343 746 364L730 387H57Z"
          fill="white"
          opacity=".8"
        />
        <path
          d="M257 83 638 41Q649 40 647 56L609 332H215L252 95Q253 86 257 83Z"
          fill="#0c182b"
          stroke="#687586"
          strokeWidth="2"
        />
        <path d="M268 94 631 54 595 319 230 319Z" fill="url(#laptop-screen)" />
        <g clipPath="url(#screen-clip)">
          <path
            d="M225 255C347 252 344 314 454 268C534 234 558 273 631 201V340H222Z"
            fill="#70ced6"
          />
          <path
            d="M221 274C351 333 461 341 634 200V340H220Z"
            fill="url(#laptop-teal)"
          />
          <path
            d="M243 301C335 296 402 348 577 265L603 324H228Z"
            fill="#0089a3"
            opacity=".45"
          />
          <g transform="translate(416 155) skewX(-8)">
            <path
              d="M-17 0H4C29 0 29 29 6 31L23 48H8L-12 28H0C13 28 15 12 2 12H-12L-17 48H-29L-24 9Q-23 0-17 0Z"
              fill="url(#laptop-teal)"
            />
          </g>
          <text
            x="420"
            y="235"
            textAnchor="middle"
            fill="#0b1f44"
            fontSize="25"
            fontWeight="750"
            fontFamily="Arial,sans-serif"
            transform="rotate(-4 420 235)"
          >
            Riverside Apps
          </text>
          <text
            x="418"
            y="257"
            textAnchor="middle"
            fill="#425775"
            fontSize="11"
            fontFamily="Arial,sans-serif"
            transform="rotate(-4 418 257)"
          >
            Solusi Aplikasi Digital
          </text>
        </g>
        <path
          d="M107 333H609L638 341Q615 355 565 355H157Q123 354 107 345Z"
          fill="url(#laptop-metal)"
          stroke="#a1aab8"
        />
        <path d="M267 333H345L340 339H274Z" fill="#7f8b9b" />
        <path
          d="M586 339H607M612 339H620"
          stroke="#38475b"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
