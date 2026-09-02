export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
export async function body(request) { try { return await request.json(); } catch { return {}; } }
export async function sha(text) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function hashPassword(password) { const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256); return `pbkdf2$150000$${b64(salt)}$${b64(bits)}`; }
export async function verifyPassword(password, stored) { if (!stored) return { valid: false, needsUpgrade: false }; if (!stored.startsWith('pbkdf2$')) return { valid: stored === await sha(password), needsUpgrade: stored === await sha(password) }; const [, iterations, saltText, hashText] = stored.split('$'); const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltText), iterations: Number(iterations), hash: 'SHA-256' }, key, 256); return { valid: b64(bits) === hashText, needsUpgrade: false }; }
function secret(env) { const value = String(env?.SESSION_SECRET || ''); if (value.length < 32) throw new Error('SESSION_SECRET is missing or too short'); return value; }
const toUrl64 = value => value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromUrl64 = value => value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
export async function session(id, email, role, env, maxAge = 604800) { const raw = toUrl64(btoa(JSON.stringify({ id, email, role, exp: Math.floor(Date.now() / 1000) + maxAge }))); return `${raw}.${await sha(raw + secret(env))}`; }
export async function me(request, env) {
  const token = (request.headers.get('Cookie') || '').match(/(?:^|;\\s*)mr_session=([^;]+)/)?.[1];
  if (!token) return null;
  const [raw, sig] = token.split('.');
  if (!raw || !sig || sig !== await sha(raw + secret(env))) return null;
  try {
    const user = JSON.parse(atob(fromUrl64(raw)));
    if (!user?.id || !user?.email || !['admin', 'teacher', 'student'].includes(user.role) || !Number.isInteger(user.exp) || user.exp <= Math.floor(Date.now() / 1000)) return null;
    return user;
  } catch { return null; }
}
export const cookie = (value, maxAge = 604800) => `mr_session=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
export function optionsJson(value) { try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
export function requireTeacher(user) { return !user || !['admin','teacher'].includes(user.role) ? json({ error: 'غير مصرح' }, 403) : null; }
export async function studentId(user, env) { const email=String(user?.email||'').trim().toLowerCase(); return email && user.role === 'student' ? (await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? AND role=\'student\'').bind(email).first())?.id : null; }
export function originGuard(request) { const origin = request.headers.get('Origin'); const host = request.headers.get('Host'); if (origin && host && new URL(origin).host !== host) return json({ error: 'طلب غير صالح' }, 403); return null; }
export function limitText(value, max = 10000) { const text = String(value ?? '').trim(); return text.length > max ? text.slice(0, max) : text; }
export async function loginRateAllowed(_request, _env, _email) { return true; }
