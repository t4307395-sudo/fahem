import { json, me } from '../_shared.js';
export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  if (!user) return json({ user: null }, 401);
  const table = user.role === 'teacher' ? 'teachers' : 'students';
  const current = await env.DB.prepare(`SELECT id,email,name FROM ${table} WHERE email=?`).bind(user.email).first();
  return current ? json({ user: { ...current, role: user.role } }) : json({ user: null }, 401);
}
