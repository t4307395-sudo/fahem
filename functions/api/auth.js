import { json, body, me, hashPassword, verifyPassword, session, cookie, originGuard, limitText, loginRateAllowed } from './_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const denied = originGuard(request); if (denied) return denied;
    const x = await body(request); const email = String(x.email || '').trim().toLowerCase(); const password = String(x.password || ''); const name = limitText(x.name, 120); const educational_stage = limitText(x.educational_stage || x.stage, 80); const school_year = limitText(x.school_year || x.year, 100);
    if (!email || !email.includes('@') || email.length > 254 || password.length < 8 || password.length > 200) return json({ error: 'الإيميل وكلمة المرور مطلوبان، وكلمة المرور 8 أحرف على الأقل' }, 400);
    if (!(await loginRateAllowed(request, env, email))) return json({ error: 'محاولات كثيرة. حاول بعد دقيقة.' }, 429);
    let user = await env.DB.prepare('SELECT * FROM users WHERE lower(email)=?').bind(email).first();
    if (!user) {
      if (!name || !educational_stage || !school_year) return json({ error: 'أدخل الاسم والمرحلة والسنة الدراسية' }, 400);
      user = await env.DB.prepare('INSERT INTO users(role,name,email,password_hash,educational_stage,school_year) VALUES(\'student\',?,?,?,?,?) RETURNING *').bind(name, email, await hashPassword(password), educational_stage, school_year).first();
    } else {
      const checked = await verifyPassword(password, user.password_hash); if (!checked.valid) return json({ error: 'بيانات الدخول غير صحيحة' }, 401);
      if (checked.needsUpgrade) { const upgraded = await hashPassword(password); await env.DB.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(upgraded, user.id).run(); user.password_hash = upgraded; }
      if (user.role === 'student') { if (!name || !educational_stage || !school_year) return json({ error: 'أكمل الاسم والمرحلة والسنة الدراسية' }, 400); await env.DB.prepare('UPDATE users SET last_seen_at=CURRENT_TIMESTAMP,name=?,educational_stage=?,school_year=? WHERE id=?').bind(name, educational_stage, school_year, user.id).run(); user.name = name; user.educational_stage = educational_stage; user.school_year = school_year; }
    }
    const role = user.role === 'admin' ? 'admin' : 'student'; const token = await session(user.id, user.email, role, env);
    return json({ user: { id: user.id, email: user.email, name: user.name, role, educational_stage: user.educational_stage || null, school_year: user.school_year || null } }, 200, { 'Set-Cookie': cookie(token) });
  } catch (error) {
    console.error('auth-runtime-error', error);
    return json({ error: 'خدمة الدخول غير متاحة مؤقتًا' }, 500);
  }
}

export async function onRequestGet({ request, env }) { const user=await me(request,env); if(!user)return json({user:null}); const row=await env.DB.prepare('SELECT name,email,role,educational_stage,school_year FROM users WHERE id=?').bind(user.id).first(); return json({user:row?{...user,name:row.name,email:row.email,role:row.role,educational_stage:row.educational_stage||null,school_year:row.school_year||null}:user}); }
