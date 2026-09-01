import { json, body, sha, session, cookie } from './_shared.js';
export async function onRequestPost({ request, env }) {
  const x = await body(request);
  if (x.role === 'teacher') {
    const teacher = await env.DB.prepare('SELECT id,email,name,password_hash FROM teachers WHERE email=?').bind(x.email).first();
    if (!teacher || teacher.password_hash !== await sha(x.password || '')) return json({ error: 'بيانات المعلم غير صحيحة' }, 401);
    const token = await session(teacher.id, teacher.email, 'teacher', env.SESSION_SECRET || 'change-me');
    return json({ user: { id: teacher.id, email: teacher.email, name: teacher.name, role: 'teacher' } }, 200, { 'Set-Cookie': cookie(token) });
  }
  let student = await env.DB.prepare('SELECT * FROM students WHERE email=?').bind(x.email).first();
  if (!student) student = await env.DB.prepare('INSERT INTO students(name,email) VALUES(?,?) RETURNING *').bind(x.name, x.email).first();
  await env.DB.prepare('UPDATE students SET last_seen_at=CURRENT_TIMESTAMP,name=? WHERE id=?').bind(x.name, student.id).run();
  const token = await session(student.id, student.email, 'student', env.SESSION_SECRET || 'change-me');
  return json({ user: { id: student.id, email: student.email, name: x.name, role: 'student' } }, 200, { 'Set-Cookie': cookie(token) });
}
