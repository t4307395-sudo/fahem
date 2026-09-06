import { json, body, me, studentId, limitText, originGuard } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  if (!user || user.role !== 'student') return json({ attempts: [] });
  const userId = await studentId(user, env);
  if (!userId) return json({ attempts: [] });
  const rows = await env.DB.prepare('SELECT id,scope_type,scope_key,scope_label,score,total_gradable,completed_at FROM attempts WHERE user_id=? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 500').bind(userId).all();
  return json({ attempts: rows.results || [] });
}

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
  const userId = await studentId(user, env); if (!userId) return json({ error: 'الطالب غير موجود' }, 404);
  const profile = await env.DB.prepare('SELECT educational_stage,school_year FROM users WHERE id=? AND role=\'student\'').bind(userId).first();
  if (!profile?.educational_stage || !profile?.school_year) return json({ error: 'بيانات المرحلة والسنة الدراسية غير مكتملة' }, 400);
  const rows = await env.DB.prepare(`SELECT id,type,correct_answer FROM questions WHERE id IN (${placeholders}) AND educational_stage=? AND school_year=?`).bind(...ids, profile.educational_stage, profile.school_year).all();
  const questions = rows.results || [];
  if (questions.length !== ids.length) return json({ error: 'يتضمن الاختبار أسئلة خارج منهجك الدراسي' }, 403);
  const answers = {}, scores = {};
  let score = 0, total = 0;
  for (const q of questions) {
    const answer = limitText(x.answers?.[q.id], 20000) || null;
    const correct = q.type === 'essay' ? null : answer === q.correct_answer;
    answers[q.id] = answer;
    scores[q.id] = { automatic_correct: correct === null ? null : (correct ? 1 : 0), teacher_score: null, feedback: null };
    if (q.type !== 'essay') { total++; if (correct) score++; }
  }
  const scopeType = ['lesson','unit'].includes(x.scope_type) ? x.scope_type : null;
  const scopeKey = limitText(x.scope_key, 240) || null;
  const scopeLabel = limitText(x.scope_label, 240) || null;
  const attempt = await env.DB.prepare('INSERT INTO attempts(user_id,mode,scope_type,scope_key,scope_label,answers_json,scores_json,score,total_gradable,completed_at) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) RETURNING id').bind(userId, mode, scopeType, scopeKey, scopeLabel, JSON.stringify(answers), JSON.stringify(scores), score, total).first();
  return json({ id: attempt.id, score, total });
}
