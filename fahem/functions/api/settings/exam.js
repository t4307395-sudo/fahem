import { json, body, me, requireTeacher, originGuard } from '../_shared.js';

function readSettings(value) { try { const parsed = JSON.parse(value || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; } }

export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  const owner = ['admin','teacher'].includes(user?.role) ? user : await env.DB.prepare("SELECT id,settings_json FROM users WHERE role='admin' ORDER BY id LIMIT 1").first();
  if (!owner) return json({ seconds: 900 });
  const row = owner.settings_json !== undefined ? owner : await env.DB.prepare('SELECT settings_json FROM users WHERE id=?').bind(owner.id).first();
  const settings = readSettings(row?.settings_json); return json({ seconds: Math.max(60, Number(settings.exam_duration_seconds) || 900) });
}

export async function onRequestPut({ request, env }) {
  const user = await me(request, env); const denied = requireTeacher(user); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const value = Number((await body(request)).seconds); if (!Number.isFinite(value)) return json({ error: 'المدة غير صالحة' }, 400);
  const seconds = Math.min(7200, Math.max(60, Math.round(value)));
  const row = await env.DB.prepare('SELECT settings_json FROM users WHERE id=?').bind(user.id).first(); const settings = readSettings(row?.settings_json); settings.exam_duration_seconds = seconds;
  await env.DB.prepare('UPDATE users SET settings_json=? WHERE id=?').bind(JSON.stringify(settings), user.id).run(); return json({ ok: true, seconds });
}
