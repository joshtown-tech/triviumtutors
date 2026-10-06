export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="15" fill="#14284B" />
      <rect x="13" y="30" width="10" height="20" rx="2" fill="#FBF8F1" />
      <rect x="27" y="22" width="10" height="28" rx="2" fill="#FBF8F1" />
      <rect x="41" y="13" width="10" height="37" rx="2" fill="#D9A441" />
      <rect x="10" y="52.5" width="44" height="2.5" rx="1.25" fill="#FBF8F1" opacity=".55" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-serif text-xl font-semibold leading-none ${light ? "text-cream" : "text-ink"}`}>
        Trivium <span className={`font-medium ${light ? "text-gold" : "text-gold-deep"}`}>Tutors</span>
      </span>
    </span>
  );
}
