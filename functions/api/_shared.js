export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
export async function body(request) { try { return await request.json(); } catch { return {}; } }
export async function sha(text) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function session(id, email, role, secret) { const raw = btoa(JSON.stringify({ id, email, role })); return `${raw}.${await sha(raw + secret)}`; }
export async function me(request, env) { const token = (request.headers.get('Cookie') || '').match(/mr_session=([^;]+)/)?.[1]; if (!token) return null; const [raw, sig] = token.split('.'); const secret = env.SESSION_SECRET || 'change-me'; if (!raw || sig !== await sha(raw + secret)) return null; try { return JSON.parse(atob(raw)); } catch { return null; } }
export const cookie = (value, maxAge = 604800) => `mr_session=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
export function requireTeacher(user) { return !user || user.role !== 'teacher' ? json({ error: 'غير مصرح' }, 403) : null; }
export async function studentId(user, env) { return user ? (await env.DB.prepare('SELECT id FROM students WHERE email=?').bind(user.email).first())?.id : null; }
