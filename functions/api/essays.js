import { json, body, me, requireTeacher } from './_shared.js';
export async function onRequestGet({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const rows = await env.DB.prepare('SELECT aa.id,aa.answer_text,aa.teacher_score,aa.feedback,a.completed_at,st.name student_name,q.prompt,s.name subject,c.name chapter FROM attempt_answers aa JOIN attempts a ON a.id=aa.attempt_id JOIN students st ON st.id=a.student_id JOIN questions q ON q.id=aa.question_id JOIN subjects s ON s.id=q.subject_id JOIN chapters c ON c.id=q.chapter_id WHERE q.type=\'essay\' AND aa.teacher_score IS NULL ORDER BY a.completed_at DESC').all();
  return json({ essays: rows.results || [] });
}
export async function onRequestPut({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const x = await body(request); const score = Number(x.teacher_score); if (!Number.isFinite(score) || score < 0 || score > 100) return json({ error: 'الدرجة يجب أن تكون بين 0 و100' }, 400);
  await env.DB.prepare('UPDATE attempt_answers SET teacher_score=?,feedback=? WHERE id=?').bind(score, String(x.feedback || '').trim(), x.id).run(); return json({ ok: true });
}
