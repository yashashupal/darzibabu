import { BadgeCheck, Gift, Palette, Shirt, Scissors, Sparkles } from 'lucide-react';

const ICONS = { BadgeCheck, Gift, Palette, Shirt, Scissors, Sparkles };

/** Original, generated cover artwork for blog posts (no third-party imagery). */
export default function CoverArt({ cover, className = '', title }) {
  const Icon = ICONS[cover?.icon] || Sparkles;
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${cover?.from || '#064072'}, ${cover?.to || '#f24b69'})` }} role="img" aria-label={title || 'Article cover'}>
      <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="stitch" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 6h6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" /></pattern></defs>
        <rect width="200" height="120" fill="url(#stitch)" />
        <circle cx="170" cy="20" r="46" fill="#fff" fillOpacity=".25" />
        <circle cx="20" cy="110" r="38" fill="#fff" fillOpacity=".18" />
      </svg>
      <Icon className="relative h-1/3 w-1/3 max-h-24 max-w-[6rem] text-white/95" strokeWidth={1.4} />
    </div>
  );
}
