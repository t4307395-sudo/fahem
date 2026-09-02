import { json, body, me, requireTeacher, originGuard, limitText } from './_shared.js';
export async function onRequestGet({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const rows = await env.DB.prepare('SELECT aa.id,aa.answer_text,aa.teacher_score,aa.feedback,a.completed_at,st.name student_name,q.prompt,s.name subject,c.name chapter FROM attempt_answers aa JOIN attempts a ON a.id=aa.attempt_id JOIN students st ON st.id=a.student_id JOIN questions q ON q.id=aa.question_id JOIN subjects s ON s.id=q.subject_id JOIN chapters c ON c.id=q.chapter_id WHERE q.type=\'essay\' AND aa.teacher_score IS NULL ORDER BY a.completed_at DESC').all();
  return json({ essays: rows.results || [] });
}
export async function onRequestPut({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request); const score = Number(x.teacher_score), id = Number(x.id); if (!Number.isInteger(id) || id < 1 || !Number.isFinite(score) || score < 0 || score > 100) return json({ error: 'بيانات التقييم غير صالحة' }, 400);
  await env.DB.prepare('UPDATE attempt_answers SET teacher_score=?,feedback=? WHERE id=?').bind(score, limitText(x.feedback, 20000), id).run(); return json({ ok: true });
}
