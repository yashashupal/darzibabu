const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+]?[0-9\s-]{8,15}$/;

/**
 * rules: { field: [ 'required' | 'email' | 'phone' | 'number' | 'positive' | {min}|{max}|{minLength}|{maxLength}|{pattern,message}|{custom:(v,all)=>string|null} ] }
 * returns { errors: {field: message}, valid }
 */
export function validate(values, rules, labels = {}) {
  const errors = {};
  Object.entries(rules).forEach(([field, list]) => {
    const label = labels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    const v = values[field];
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
    for (const rule of list) {
      let msg = null;
      if (rule === 'required') {
        if (empty) msg = `${label} is required.`;
      } else if (empty) {
        continue; // other rules only run on non-empty values
      } else if (rule === 'email') {
        if (!EMAIL.test(String(v).trim())) msg = 'Enter a valid email address.';
      } else if (rule === 'phone') {
        if (!PHONE.test(String(v).trim())) msg = 'Enter a valid phone number.';
      } else if (rule === 'number') {
        if (Number.isNaN(Number(v))) msg = `${label} must be a number.`;
      } else if (rule === 'positive') {
        if (!(Number(v) > 0)) msg = `${label} must be greater than 0.`;
      } else if (typeof rule === 'object') {
        if (rule.min !== undefined && Number(v) < rule.min) msg = `${label} must be at least ${rule.min}.`;
        else if (rule.max !== undefined && Number(v) > rule.max) msg = `${label} must be at most ${rule.max}.`;
        else if (rule.minLength !== undefined && String(v).length < rule.minLength) msg = `${label} must be at least ${rule.minLength} characters.`;
        else if (rule.maxLength !== undefined && String(v).length > rule.maxLength) msg = `${label} must be at most ${rule.maxLength} characters.`;
        else if (rule.pattern && !rule.pattern.test(String(v))) msg = rule.message || `${label} is not valid.`;
        else if (rule.custom) msg = rule.custom(v, values) || null;
      }
      if (msg) {
        errors[field] = msg;
        break;
      }
    }
  });
  return { errors, valid: Object.keys(errors).length === 0 };
}

export const isEmail = (v) => EMAIL.test(String(v || '').trim());

/** Non-cryptographic hash used ONLY so demo passwords are not kept as plain text in localStorage. */
export function demoHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return 'demo$' + (h >>> 0).toString(36);
}
