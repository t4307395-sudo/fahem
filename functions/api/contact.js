import { json, body, me, originGuard, limitText } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const user = await me(request, env); if (!user) return json({ error: 'يلزم تسجيل الدخول' }, 401);
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  const message = limitText(x.message, 10000); if (!message) return json({ error: 'اكتب الرسالة أولًا' }, 400);
  const type = ['question_report','password_reset'].includes(x.type) ? x.type : 'contact';
  const questionId = Number.isInteger(Number(x.question_id)) ? Number(x.question_id) : null;
  const snapshot = x.question_snapshot && typeof x.question_snapshot === 'object' ? JSON.stringify(x.question_snapshot) : '{}';
  const payload = x.payload && typeof x.payload === 'object' ? JSON.stringify(x.payload) : JSON.stringify({ message });
  const result = await env.DB.prepare('INSERT INTO messages(type,sender_user_id,sender_email,sender_name,question_id,question_snapshot_json,payload_json) VALUES(?,?,?,?,?,?,?) RETURNING id').bind(type,user.id,user.email,user.name,questionId,snapshot,payload).first();
  return json({ ok: true, id: result.id });
}

export async function onRequestGet({ request, env }) {
  const user = await me(request, env); if (!['admin','teacher'].includes(user?.role)) return json({ error: 'غير مصرح' }, 403);
  const rows = await env.DB.prepare('SELECT id,type,sender_user_id,sender_email,sender_name,question_id,question_snapshot_json,payload_json,status,created_at FROM messages ORDER BY created_at DESC LIMIT 100').all();
  return json({ messages: rows.results || [] });
}
