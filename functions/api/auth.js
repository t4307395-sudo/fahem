import { json, body, me, hashPassword, verifyPassword, session, cookie, originGuard, limitText, loginRateAllowed } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const denied = originGuard(request); if (denied) return denied;
  const x = await body(request);
  const email = String(x.email || '').trim().toLowerCase();
  const password = String(x.password || '');
  const name = limitText(x.name, 120);
  if (!email || !email.includes('@') || email.length > 254 || password.length < 8 || password.length > 200) return json({ error: 'بيانات الدخول غير صحيحة' }, 400);
  if (!(await loginRateAllowed(request, env, email))) return json({ error: 'محاولات كثيرة. حاول بعد دقيقة.' }, 429);
  let user = await env.DB.prepare('SELECT * FROM users WHERE lower(email)=?').bind(email).first();
  if (!user) {
    if (!name) return json({ error: 'أدخل اسمك للمتابعة' }, 400);
    user = await env.DB.prepare('INSERT INTO users(role,name,email,password_hash) VALUES(\'student\',?,?,?) RETURNING *').bind(name, email, await hashPassword(password)).first();
  } else {
    const checked = await verifyPassword(password, user.password_hash);
    if (!checked.valid) return json({ error: 'بيانات الدخول غير صحيحة' }, 401);
    if (checked.needsUpgrade) { const upgraded = await hashPassword(password); await env.DB.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(upgraded, user.id).run(); user.password_hash = upgraded; }
    if (user.role === 'student') { await env.DB.prepare('UPDATE users SET last_seen_at=CURRENT_TIMESTAMP,name=? WHERE id=?').bind(name || user.name, user.id).run(); user.name = name || user.name; }
  }
  const role = user.role === 'admin' ? 'admin' : 'student';
  const token = await session(user.id, user.email, role, env);
  return json({ user: { id: user.id, email: user.email, name: user.name, role } }, 200, { 'Set-Cookie': cookie(token) });
}

export async function onRequestGet({ request, env }) { return json({ user: await me(request, env) }); }
