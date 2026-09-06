import { body, me, originGuard } from './_shared.js';

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  const user = await me(request, env);
  if (!user) return json({ error: 'يجب تسجيل الدخول' }, 401);
  const originDenied = originGuard(request);
  if (originDenied) return originDenied;
  const input = await body(request);
  const id = Number(input.id);
  const value = String(input.value ?? '').trim();
  if (!Number.isInteger(id) || id < 1 || !value) return json({ error: 'بيانات الإجابة غير مكتملة' }, 400);
  const question = await env.DB.prepare('SELECT correct_answer, explanation, type FROM questions WHERE id=?').bind(id).first();
  if (!question) return json({ error: 'السؤال غير موجود' }, 404);
  if (question.type === 'essay') return json({ ok: true, correct: null, explanation: question.explanation || 'سيقيّم المعلم الإجابة المقالية.' });
  const correct = value === String(question.correct_answer ?? '').trim();
  return json({
    ok: true,
    correct,
    ...(correct ? {} : { correct_answer: question.correct_answer }),
    explanation: question.explanation || 'راجع الفكرة الأساسية في الدرس.'
  });
}
