import { json, body, me, requireTeacher, originGuard, limitText } from '../_shared.js';
async function ids(env, x) {
  const s = await env.DB.prepare('INSERT INTO subjects(name) VALUES(?) ON CONFLICT(name) DO UPDATE SET name=name RETURNING id').bind(x.subject.trim()).first();
  const c = await env.DB.prepare('INSERT INTO chapters(subject_id,name) VALUES(?,?) ON CONFLICT(subject_id,name) DO UPDATE SET name=name RETURNING id').bind(s.id, x.chapter.trim()).first();
  return [s.id, c.id];
}
export async function onRequestPut({ request, env, params }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  const subject = limitText(x.subject, 160), chapter = limitText(x.chapter, 160), prompt = limitText(x.prompt, 20000);
  if (!subject || !chapter || !prompt || !['mcq','boolean','essay'].includes(x.type)) return json({ error: 'بيانات السؤال غير مكتملة' }, 400);
  const options = Array.isArray(x.options) ? x.options.map(v => limitText(v, 1000)).slice(0, 10) : [];
  const [sid,cid] = await ids(env,{ subject, chapter }); const difficulty = ['easy','medium','hard'].includes(x.difficulty) ? x.difficulty : 'medium';
  await env.DB.prepare('UPDATE questions SET subject_id=?,chapter_id=?,type=?,prompt=?,options_json=?,correct_answer=?,explanation=?,difficulty=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(sid,cid,x.type,prompt,JSON.stringify(options),limitText(x.correct_answer, 1000) || null,limitText(x.explanation, 20000) || null,difficulty,params.id).run();
  return json({ ok: true, id: params.id });
}
export async function onRequestDelete({ request, env, params }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const id = Number(params.id); if (!Number.isInteger(id) || id < 1) return json({ error: 'معرّف السؤال غير صالح' }, 400);
  await env.DB.prepare('DELETE FROM questions WHERE id=?').bind(id).run(); return json({ ok: true });
}
