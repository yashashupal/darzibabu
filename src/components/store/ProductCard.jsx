import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Img } from '../ui/Misc';
import { Rating, Badge } from '../ui/Feedback';
import { useWishlist } from '../../context/WishlistContext';
import { formatINR, cx } from '../../utils/format';
import { startingPrice, stockStatus, savingsPercent } from '../../utils/pricing';

export default function ProductCard({ product: p, categoryName }) {
  const wish = useWishlist();
  const liked = wish.has(p.id);
  const status = stockStatus(p);
  const save = savingsPercent(p);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-pop">
      <Link to={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100" aria-label={p.name}>
        <Img src={p.images[0]} alt={p.name} className={cx('h-full w-full object-cover transition duration-500', p.images[1] && 'group-hover:opacity-0')} />
        {p.images[1] ? <Img src={p.images[1]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" /> : null}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {p.bestSeller ? <Badge tone="pink" className="shadow-sm">Best seller</Badge> : null}
          {status === 'low' ? <Badge tone="amber">Low stock</Badge> : null}
          {status === 'out' ? <Badge tone="slate">Out of stock</Badge> : null}
        </div>
      </Link>
      <button type="button" onClick={() => wish.toggle(p.id, p.name)} aria-pressed={liked} aria-label={liked ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow hover:scale-105">
        <Heart className={cx('h-4 w-4', liked ? 'fill-brand-500 text-brand-500' : 'text-slate-600')} />
      </button>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {categoryName ? <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">{categoryName}</p> : null}
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] font-semibold leading-snug text-navy-900"><Link to={`/product/${p.slug}`} className="hover:text-brand-600">{p.name}</Link></h3>
        <div className="mt-1.5 min-h-[1.25rem]">{p.reviewCount ? <Rating value={p.rating} count={p.reviewCount} /> : <span className="text-xs text-slate-400">No reviews yet</span>}</div>
        <div className="mt-auto pt-3">
          <p className="text-xs text-slate-500">From</p>
          <p className="flex flex-wrap items-baseline gap-x-2"><span className="font-display text-xl font-extrabold text-navy-900">{formatINR(startingPrice(p))}</span><span className="text-xs text-slate-500">/ pc · MOQ {p.moq}</span></p>
          {save ? <p className="mt-0.5 text-xs font-semibold text-emerald-600">Save up to {save}% on bulk</p> : null}
        </div>
      </div>
    </article>
  );
}
