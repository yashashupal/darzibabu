import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cx } from '../../utils/format';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-300 shadow-sm',
  navy: 'bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-300 shadow-sm',
  secondary: 'bg-white text-navy-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-navy-300',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
  soft: 'bg-navy-50 text-navy-900 hover:bg-navy-100 focus-visible:ring-navy-300',
  white: 'bg-white text-navy-900 hover:bg-slate-100 focus-visible:ring-white/60 shadow-sm',
};
const sizes = { xs: 'h-8 px-2.5 text-xs gap-1', sm: 'h-9 px-3.5 text-sm gap-1.5', md: 'h-11 px-5 text-sm gap-2', lg: 'h-12 px-7 text-base gap-2' };

/** Renders a <Link> when `to` is given, otherwise a <button>. */
const Button = forwardRef(function Button({ variant = 'primary', size = 'md', to, href, loading, icon: Icon, iconRight: IconRight, className, children, disabled, type = 'button', ...rest }, ref) {
  const cls = cx(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-55',
    variants[variant], sizes[size], className
  );
  const content = (
    <>
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4" /> : null}
    </>
  );
  if (to && !disabled) return <Link ref={ref} to={to} className={cls} {...rest}>{content}</Link>;
  if (href && !disabled) return <a ref={ref} href={href} className={cls} {...rest}>{content}</a>;
  return <button ref={ref} type={type} className={cls} disabled={disabled || loading} {...rest}>{content}</button>;
});
export default Button;

export function IconButton({ label, icon: Icon, className, variant = 'ghost', badge, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-4 focus-visible:ring-navy-200', variant === 'ghost' ? 'text-slate-700 hover:bg-slate-100' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50', className)} {...rest}>
      <Icon className="h-5 w-5" />
      {badge ? <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{badge}</span> : null}
    </button>
  );
}
