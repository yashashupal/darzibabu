import { forwardRef, useId } from 'react';
import { cx } from '../../utils/format';

const base = 'block w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500';
const ok = 'border-slate-300 focus:border-navy-500 focus:ring-navy-100';
const bad = 'border-red-400 focus:border-red-500 focus:ring-red-100';

export function Field({ label, error, hint, required, children, htmlFor, className }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-800">
          {label} {required ? <span className="text-brand-600" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className, id, ...rest }, ref) {
  const gen = useId();
  const fid = id || gen;
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={fid} className={className}>
      <input ref={ref} id={fid} aria-invalid={!!error} className={cx(base, 'h-11', error ? bad : ok)} {...rest} />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, required, className, id, rows = 4, ...rest }, ref) {
  const gen = useId();
  const fid = id || gen;
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={fid} className={className}>
      <textarea ref={ref} id={fid} rows={rows} aria-invalid={!!error} className={cx(base, 'py-2.5', error ? bad : ok)} {...rest} />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, required, className, id, options = [], placeholder, children, ...rest }, ref) {
  const gen = useId();
  const fid = id || gen;
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={fid} className={className}>
      <select ref={ref} id={fid} aria-invalid={!!error} className={cx(base, 'h-11 pr-8', error ? bad : ok)} {...rest}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
        {children}
      </select>
    </Field>
  );
});

export function Checkbox({ label, checked, onChange, className, description, ...rest }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-3 text-sm', className)}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-300" {...rest} />
      <span><span className="font-medium text-slate-800">{label}</span>{description ? <span className="block text-xs text-slate-500">{description}</span> : null}</span>
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled} onClick={() => onChange?.(!checked)}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-4 focus-visible:ring-navy-200 disabled:opacity-50', checked ? 'bg-emerald-500' : 'bg-slate-300')}>
      <span className={cx('inline-block h-5 w-5 transform rounded-full bg-white shadow transition', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}
