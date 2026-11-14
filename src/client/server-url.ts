/**
 * server-url.ts — origin backend untuk client.
 *
 * Default: same-origin (server menyajikan web + socket di satu port).
 * Set `VITE_SERVER_URL` saat build untuk frontend terpisah, mis. Vercel/Netlify
 * yang memanggil backend Render/Railway.
 */

const raw = import.meta.env.VITE_SERVER_URL ?? '';

/** Origin backend tanpa trailing slash; string kosong = same-origin. */
export const SERVER_URL = raw.replace(/\/+$/, '');

/** URL API absolut bila backend terpisah; bila same-origin tetap path relatif. */
export function apiUrl(path: string): string {
  return `${SERVER_URL}${path}`;
}
