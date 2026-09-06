import { json, me, studentId, optionsJson } from './_shared.js';

function parse(value, fallback = {}) { try { const parsed = JSON.parse(value || ''); return parsed && typeof parsed === 'object' ? parsed : fallback; } catch { return fallback; } }

export async function onRequestGet({ request, env }) {
  const sid = await studentId(await me(request, env), env); if (!sid) return json({ questions: [] });
  const attempts = await env.DB.prepare('SELECT answers_json,scores_json FROM attempts WHERE user_id=?').bind(sid).all();
  const wrongIds = new Set(); for (const attempt of attempts.results || []) for (const [id, score] of Object.entries(parse(attempt.scores_json))) if (Number(score?.automatic_correct) === 0) wrongIds.add(Number(id));
  if (!wrongIds.size) return json({ questions: [] });
  const ids = [...wrongIds].filter(Number.isInteger); const rows = await env.DB.prepare(`SELECT q.*,q.lesson AS chapter FROM questions q WHERE q.id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
  return json({ questions: (rows.results || []).map(q => ({ ...q, options: optionsJson(q.options_json) })) });
}
