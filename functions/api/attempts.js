import { json, body, me, studentId, originGuard, limitText } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const user = await me(request, env); if (!user || user.role !== 'student') return json({ error: 'سجّل كطالب' }, 403);
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  const mode = ['practice','mock','mistakes'].includes(x.mode) ? x.mode : null;
  const maxQuestions = mode === 'mock' ? 100 : 50;
  if (!mode || !Array.isArray(x.question_ids) || x.question_ids.length > maxQuestions || !x.answers || typeof x.answers !== 'object') return json({ error: 'بيانات المحاولة غير صالحة' }, 400);
  const ids = [...new Set(x.question_ids.map(Number).filter(Number.isInteger).filter(id => id > 0))];
  if (!ids.length) return json({ error: 'لم يتم اختيار أسئلة' }, 400);
  const placeholders = ids.map(() => '?').join(',');
  const rows = await env.DB.prepare(`SELECT id,type,correct_answer FROM questions WHERE id IN (${placeholders})`).bind(...ids).all();
  const questions = rows.results || [];
  const userId = await studentId(user, env); if (!userId) return json({ error: 'الطالب غير موجود' }, 404);
  const answers = {}, scores = {};
  let score = 0, total = 0;
  for (const q of questions) {
    const answer = limitText(x.answers?.[q.id], 20000) || null;
    const correct = q.type === 'essay' ? null : answer === q.correct_answer;
    answers[q.id] = answer;
    scores[q.id] = { automatic_correct: correct === null ? null : (correct ? 1 : 0), teacher_score: null, feedback: null };
    if (q.type !== 'essay') { total++; if (correct) score++; }
  }
  const attempt = await env.DB.prepare('INSERT INTO attempts(user_id,mode,answers_json,scores_json,score,total_gradable,completed_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) RETURNING id').bind(userId, mode, JSON.stringify(answers), JSON.stringify(scores), score, total).first();
  return json({ id: attempt.id, score, total });
}
