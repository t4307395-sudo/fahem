import { json, body, me, requireTeacher } from '../_shared.js';
async function ids(env, x) {
  const s = await env.DB.prepare('INSERT INTO subjects(name) VALUES(?) ON CONFLICT(name) DO UPDATE SET name=name RETURNING id').bind(x.subject.trim()).first();
  const c = await env.DB.prepare('INSERT INTO chapters(subject_id,name) VALUES(?,?) ON CONFLICT(subject_id,name) DO UPDATE SET name=name RETURNING id').bind(s.id, x.chapter.trim()).first();
  return [s.id, c.id];
}
export async function onRequestPut({ request, env, params }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const x = await body(request); if (!x.subject || !x.chapter || !x.prompt) return json({ error: 'بيانات السؤال غير مكتملة' }, 400);
  const [sid,cid] = await ids(env,x); const difficulty = ['easy','medium','hard'].includes(x.difficulty) ? x.difficulty : 'medium';
  await env.DB.prepare('UPDATE questions SET subject_id=?,chapter_id=?,type=?,prompt=?,options_json=?,correct_answer=?,explanation=?,difficulty=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(sid,cid,x.type,x.prompt.trim(),JSON.stringify(x.options||[]),x.correct_answer||null,x.explanation||null,difficulty,params.id).run();
  return json({ ok: true, id: params.id });
}
export async function onRequestDelete({ request, env, params }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  await env.DB.prepare('DELETE FROM questions WHERE id=?').bind(params.id).run(); return json({ ok: true });
}
