import { json, body, me, originGuard, limitText } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const denied = originGuard(request); if (denied) return denied;
  const user = await me(request, env); if (!user) return json({ error: 'يلزم تسجيل الدخول' }, 401);
  const x = await body(request);
  const message = limitText(x.message, 10000);
  if (!message) return json({ error: 'اكتب رسالتك أولًا' }, 400);
  const table = user.role === 'teacher' ? 'teachers' : 'students';
  const sender = await env.DB.prepare(`SELECT name,email FROM ${table} WHERE id=?`).bind(user.id).first();
  if (!sender) return json({ error: 'الحساب غير موجود' }, 401);
  await env.DB.prepare('INSERT INTO contact_messages(sender_email,sender_name,message) VALUES(?,?,?)').bind(sender.email, sender.name, message).run();
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const user = await me(request, env); if (!user || user.role !== 'teacher') return json({ error: 'غير مصرح' }, 403);
  const rows = await env.DB.prepare("SELECT id,sender_email,sender_name,message,status,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 100").all();
  return json({ messages: rows.results || [] });
}
