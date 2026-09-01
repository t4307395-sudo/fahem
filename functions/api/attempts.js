import { json, body, me, studentId } from './_shared.js';
export async function onRequestPost({ request, env }) {
  const user = await me(request, env); if (!user || user.role !== 'student') return json({ error: 'سجّل كطالب' }, 403);
  const x = await body(request), ids = new Set((x.question_ids || []).map(Number));
  const rows = await env.DB.prepare('SELECT id,type,correct_answer FROM questions').all();
  const questions = (rows.results || []).filter(q => ids.size === 0 || ids.has(Number(q.id)));
  const sid = await studentId(user, env); if (!sid) return json({ error: 'الطالب غير موجود' }, 404);
  let score = 0, total = 0;
  const attempt = await env.DB.prepare('INSERT INTO attempts(student_id,mode,completed_at) VALUES(?,?,CURRENT_TIMESTAMP) RETURNING id').bind(sid, x.mode || 'mock').first();
  for (const q of questions) { const answer = x.answers?.[q.id] ?? null; const correct = q.type === 'essay' ? null : answer === q.correct_answer; if (q.type !== 'essay') { total++; if (correct) score++; } await env.DB.prepare('INSERT INTO attempt_answers(attempt_id,question_id,answer_text,automatic_correct) VALUES(?,?,?,?)').bind(attempt.id,q.id,answer,correct === null ? null : (correct ? 1 : 0)).run(); }
  await env.DB.prepare('UPDATE attempts SET score=?,total_gradable=? WHERE id=?').bind(score,total,attempt.id).run(); return json({ id: attempt.id, score, total });
}
