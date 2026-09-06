import { json, body, me, requireTeacher, originGuard, limitText } from '../_shared.js';

export async function onRequestPut({ request, env, params }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const id = Number(params.id); if (!Number.isInteger(id) || id < 1) return json({ error: 'معرّف السؤال غير صالح' }, 400);
  const x = await body(request);
  const subject = limitText(x.subject, 160), unit = limitText(x.unit, 160) || 'الوحدة الأولى', lesson = limitText(x.chapter || x.lesson, 160), prompt = limitText(x.prompt, 20000);
  if (!subject || !lesson || !prompt || !['mcq','boolean','essay'].includes(x.type)) return json({ error: 'بيانات السؤال غير مكتملة' }, 400);
  const options = Array.isArray(x.options) ? x.options.map(v => limitText(v, 1000)).filter(Boolean).slice(0, 10) : [];
  const difficulty = ['easy','medium','hard'].includes(x.difficulty) ? x.difficulty : 'medium';
  const result = await env.DB.prepare('UPDATE questions SET subject=?,unit=?,lesson=?,school_year=?,educational_stage=?,type=?,prompt=?,options_json=?,correct_answer=?,explanation=?,difficulty=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(subject, unit, lesson, limitText(x.school_year, 80) || null, limitText(x.educational_stage || x.stage, 120) || null, x.type, prompt, JSON.stringify(options), limitText(x.correct_answer, 1000) || null, limitText(x.explanation, 20000) || null, difficulty, x.is_published === false ? 0 : 1, id).run();
  if (!result.meta?.changes) return json({ error: 'السؤال غير موجود' }, 404);
  return json({ ok: true, id });
}

export async function onRequestDelete({ request, env, params }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const id = Number(params.id); if (!Number.isInteger(id) || id < 1) return json({ error: 'معرّف السؤال غير صالح' }, 400);
  const result = await env.DB.prepare('DELETE FROM questions WHERE id=?').bind(id).run();
  if (!result.meta?.changes) return json({ error: 'السؤال غير موجود' }, 404);
  return json({ ok: true });
}
