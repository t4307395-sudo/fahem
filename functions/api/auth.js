import { json, body, me, hashPassword, verifyPassword, session, cookie, originGuard, limitText, loginRateAllowed } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const denied = originGuard(request); if (denied) return denied;
  const x = await body(request);
  const email = String(x.email || '').trim().toLowerCase();
  const password = String(x.password || '');
  const name = limitText(x.name, 120);
  if (!email || !email.includes('@') || email.length > 254 || password.length < 8 || password.length > 200) return json({ error: 'بيانات الدخول غير صحيحة' }, 400);
  if (!(await loginRateAllowed(request, env, email))) return json({ error: 'محاولات كثيرة. حاول بعد دقيقة.' }, 429);

  const teacher = await env.DB.prepare('SELECT id,email,name,password_hash FROM teachers WHERE lower(email)=?').bind(email).first();
  if (teacher) {
    const checked = await verifyPassword(password, teacher.password_hash);
    if (!checked.valid) return json({ error: 'بيانات الدخول غير صحيحة' }, 401);
    if (checked.needsUpgrade) await env.DB.prepare('UPDATE teachers SET password_hash=? WHERE id=?').bind(await hashPassword(password), teacher.id).run();
    const token = await session(teacher.id, teacher.email, 'teacher', env);
    return json({ user: { id: teacher.id, email: teacher.email, name: teacher.name, role: 'teacher' } }, 200, { 'Set-Cookie': cookie(token) });
  }

  if (!name) return json({ error: 'أدخل اسمك للمتابعة' }, 400);
  let student = await env.DB.prepare('SELECT * FROM students WHERE lower(email)=?').bind(email).first();
  if (!student) student = await env.DB.prepare('INSERT INTO students(name,email,password_hash) VALUES(?,?,?) RETURNING *').bind(name, email, await hashPassword(password)).first();
  else if (!(await verifyPassword(password, student.password_hash)).valid) return json({ error: 'بيانات الدخول غير صحيحة' }, 401);
  await env.DB.prepare('UPDATE students SET last_seen_at=CURRENT_TIMESTAMP,name=? WHERE id=?').bind(name, student.id).run();
  const token = await session(student.id, student.email, 'student', env);
  return json({ user: { id: student.id, email: student.email, name, role: 'student' } }, 200, { 'Set-Cookie': cookie(token) });
}

export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  return json({ user });
}
