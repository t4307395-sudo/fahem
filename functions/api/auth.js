import { json, body, me, sha, session, cookie } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const x = await body(request);
  const email = String(x.email || '').trim().toLowerCase();
  const password = String(x.password || '');
  const name = String(x.name || '').trim();
  if (!email || !email.includes('@')) return json({ error: 'أدخل بريدًا إلكترونيًا صحيحًا' }, 400);

  const teacher = await env.DB.prepare('SELECT id,email,name,password_hash FROM teachers WHERE lower(email)=?').bind(email).first();
  if (teacher) {
    if (!password || teacher.password_hash !== await sha(password)) return json({ error: 'بيانات الدخول غير صحيحة' }, 401);
    const token = await session(teacher.id, teacher.email, 'teacher', env.SESSION_SECRET || 'change-me');
    return json({ user: { id: teacher.id, email: teacher.email, name: teacher.name, role: 'teacher' } }, 200, { 'Set-Cookie': cookie(token) });
  }

  if (!name) return json({ error: 'أدخل اسمك للمتابعة' }, 400);
  let student = await env.DB.prepare('SELECT * FROM students WHERE lower(email)=?').bind(email).first();
  if (!student) student = await env.DB.prepare('INSERT INTO students(name,email) VALUES(?,?) RETURNING *').bind(name, email).first();
  await env.DB.prepare('UPDATE students SET last_seen_at=CURRENT_TIMESTAMP,name=? WHERE id=?').bind(name, student.id).run();
  const token = await session(student.id, student.email, 'student', env.SESSION_SECRET || 'change-me');
  return json({ user: { id: student.id, email: student.email, name, role: 'student' } }, 200, { 'Set-Cookie': cookie(token) });
}

export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  return json({ user });
}
