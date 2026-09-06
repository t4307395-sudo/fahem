import { json, me } from '../_shared.js';
export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  if (!user) return json({ user: null }, 401);
  const current = await env.DB.prepare('SELECT id,email,name,role,educational_stage,school_year FROM users WHERE id=? AND lower(email)=?').bind(user.id, String(user.email).toLowerCase()).first();
  return current ? json({ user: { id: current.id, email: current.email, name: current.name, role: current.role, educational_stage: current.educational_stage || null, school_year: current.school_year || null } }) : json({ user: null }, 401);
}
