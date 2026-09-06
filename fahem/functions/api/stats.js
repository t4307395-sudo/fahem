import { json, me, studentId } from './_shared.js';

function parse(value, fallback = {}) { try { const parsed = JSON.parse(value || ''); return parsed && typeof parsed === 'object' ? parsed : fallback; } catch { return fallback; } }

export async function onRequestGet({ request, env }) {
  const sid = await studentId(await me(request, env), env); if (!sid) return json({ stats: [], trend: [] });
  const [attemptRows, questionRows] = await Promise.all([env.DB.prepare('SELECT * FROM attempts WHERE user_id=? AND completed_at IS NOT NULL ORDER BY completed_at DESC').bind(sid).all(), env.DB.prepare('SELECT id,subject,type FROM questions').all()]);
  const questions = new Map((questionRows.results || []).map(q => [Number(q.id), q])); const bySubject = new Map(); const byDay = new Map();
  for (const attempt of attemptRows.results || []) {
    const answers = parse(attempt.answers_json); const scores = parse(attempt.scores_json); const subjects = new Set(); let correct = 0, gradable = 0;
    for (const id of Object.keys(answers)) { const q = questions.get(Number(id)); const item = scores[id] || {}; if (q) subjects.add(q.subject); if (item.automatic_correct !== null && item.automatic_correct !== undefined) { gradable++; if (Number(item.automatic_correct) === 1) correct++; } }
    for (const subject of subjects) { const row = bySubject.get(subject) || { subject, attempts: 0, correct: 0, gradable: 0 }; row.attempts++; row.correct += correct; row.gradable += gradable; bySubject.set(subject, row); }
    const day = String(attempt.completed_at || '').slice(0, 10); if (day) { const row = byDay.get(day) || { day, attempts: 0, correct: 0, gradable: 0 }; row.attempts++; row.correct += correct; row.gradable += gradable; byDay.set(day, row); }
  }
  const finish = row => ({ ...row, rate: row.gradable ? Math.round(row.correct * 1000 / row.gradable) / 10 : 0 });
  return json({ stats: [...bySubject.values()].map(finish), trend: [...byDay.values()].sort((a,b) => a.day.localeCompare(b.day)).slice(-30).map(finish) });
}
