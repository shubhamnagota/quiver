/**
 * Applies the saved theme before first paint (no flash of the wrong theme).
 * Inlined into index.html and allowed by hash, so the CSP still blocks every other inline script.
 */
export const THEME_SCRIPT =
  "try{var p=JSON.parse(localStorage.getItem('quiver-prefs')||'{}').state||{},t=p.theme||'dark';document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){}";
/** sha256 of THEME_SCRIPT; a test recomputes it. */
export const THEME_SCRIPT_HASH = "'sha256-2jSMUw/IwzL0sflmfnoplHgBmplHR2U6dUPtOPN7wMo='";

/** Hosts the app may call: the keyless FX rate providers, nothing else. */
export const CONNECT_HOSTS = ['https://open.er-api.com', 'https://api.frankfurter.dev'];

const directives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", THEME_SCRIPT_HASH],
  // Inline style attributes come from React and the generated QR SVG.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", ...CONNECT_HOSTS],
  'worker-src': ["'self'"],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export const CSP = Object.entries(directives)
  .map(([k, v]) => `${k} ${v.join(' ')}`)
  .join('; ');

/** frame-ancestors only works as a header, so hosting configs add it. */
export const CSP_HEADER = `${CSP}; frame-ancestors 'none'`;
