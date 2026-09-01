import { json, me, studentId } from './_shared.js';
export async function onRequestGet({ request, env }) {
  const user = await me(request, env), sid = await studentId(user, env); if (!sid) return json({ stats: [], trend: [] });
  const bySubject = await env.DB.prepare('SELECT s.name subject,COUNT(DISTINCT a.id) attempts,ROUND(100.0*SUM(CASE WHEN aa.automatic_correct=1 THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN aa.automatic_correct IS NOT NULL THEN 1 ELSE 0 END),0),1) rate FROM attempts a JOIN attempt_answers aa ON aa.attempt_id=a.id JOIN questions q ON q.id=aa.question_id JOIN subjects s ON s.id=q.subject_id WHERE a.student_id=? GROUP BY s.id,s.name ORDER BY s.name').bind(sid).all();
  const trend = await env.DB.prepare('SELECT DATE(a.completed_at) day,COUNT(DISTINCT a.id) attempts,ROUND(100.0*SUM(CASE WHEN aa.automatic_correct=1 THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN aa.automatic_correct IS NOT NULL THEN 1 ELSE 0 END),0),1) rate FROM attempts a JOIN attempt_answers aa ON aa.attempt_id=a.id WHERE a.student_id=? AND a.completed_at IS NOT NULL GROUP BY DATE(a.completed_at) ORDER BY day ASC LIMIT 30').bind(sid).all();
  return json({ stats: bySubject.results || [], trend: trend.results || [] });
}
