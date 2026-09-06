import { json, body, me, studentId, optionsJson, originGuard } from './_shared.js';

function idsFrom(value) { try { const ids = JSON.parse(value || '[]'); return Array.isArray(ids) ? [...new Set(ids.map(Number).filter(Number.isInteger).filter(id => id > 0))] : []; } catch { return []; } }

export async function onRequestGet({ request, env }) {
  const sid = await studentId(await me(request, env), env); if (!sid) return json({ favorites: [] });
  const user = await env.DB.prepare('SELECT favorites_json FROM users WHERE id=?').bind(sid).first();
  const ids = idsFrom(user?.favorites_json); if (!ids.length) return json({ favorites: [] });
  const rows = await env.DB.prepare(`SELECT q.*,q.lesson AS chapter FROM questions q WHERE q.id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
  const order = new Map(ids.map((id, i) => [id, i]));
  const favorites = (rows.results || []).sort((a,b) => order.get(a.id)-order.get(b.id)).map(q => ({ ...q, options: optionsJson(q.options_json) }));
  return json({ favorites });
}

export async function onRequestPost({ request, env }) {
  const denied = originGuard(request); if (denied) return denied;
  const sid = await studentId(await me(request, env), env); if (!sid) return json({ error: 'يلزم تسجيل الدخول' }, 401);
  const questionId = Number((await body(request)).question_id); if (!Number.isInteger(questionId) || questionId < 1) return json({ error: 'السؤال غير صحيح' }, 400);
  const exists = await env.DB.prepare('SELECT id FROM questions WHERE id=?').bind(questionId).first(); if (!exists) return json({ error: 'السؤال غير موجود' }, 404);
  const user = await env.DB.prepare('SELECT favorites_json FROM users WHERE id=?').bind(sid).first(); const ids = idsFrom(user?.favorites_json); if (!ids.includes(questionId)) ids.push(questionId);
  await env.DB.prepare('UPDATE users SET favorites_json=? WHERE id=?').bind(JSON.stringify(ids), sid).run(); return json({ ok: true, saved: true });
}

export async function onRequestDelete({ request, env }) {
  const denied = originGuard(request); if (denied) return denied;
  const sid = await studentId(await me(request, env), env); if (!sid) return json({ error: 'يلزم تسجيل الدخول' }, 401);
  const questionId = Number((await body(request)).question_id); if (!Number.isInteger(questionId) || questionId < 1) return json({ error: 'السؤال غير صحيح' }, 400);
  const user = await env.DB.prepare('SELECT favorites_json FROM users WHERE id=?').bind(sid).first(); const ids = idsFrom(user?.favorites_json).filter(id => id !== questionId);
  await env.DB.prepare('UPDATE users SET favorites_json=? WHERE id=?').bind(JSON.stringify(ids), sid).run(); return json({ ok: true, saved: false });
}
