import { json, body, me, requireTeacher, optionsJson, limitText, originGuard } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const user = await me(request, env); const teacher = ['admin','teacher'].includes(user?.role);
  if (!user) return json({ questions: [] }, 401);
  const columns = teacher ? 'q.*' : 'q.id,q.subject,q.unit,q.lesson,q.school_year,q.educational_stage,q.type,q.prompt,q.options_json,q.explanation,q.difficulty,q.created_at,q.updated_at';
  if (!teacher && user?.role === 'student') {
    const profile = await env.DB.prepare("SELECT educational_stage,school_year FROM users WHERE id=? AND role='student'").bind(user.id).first();
    if (!profile?.school_year) return json({questions:[], needsCurriculum:true});
    const rows = await env.DB.prepare(`SELECT ${columns},q.lesson AS chapter FROM questions q WHERE q.school_year=? AND (q.educational_stage=? OR q.educational_stage IS NULL OR trim(q.educational_stage)='') AND q.is_published=1 ORDER BY q.subject, CASE WHEN q.unit LIKE '%الأولى%' THEN 1 WHEN q.unit LIKE '%الثانية%' THEN 2 WHEN q.unit LIKE '%الثالثة%' THEN 3 WHEN q.unit LIKE '%الرابعة%' THEN 4 ELSE 99 END, CASE WHEN q.lesson LIKE '%الأول%' THEN 1 WHEN q.lesson LIKE '%الثاني%' THEN 2 WHEN q.lesson LIKE '%الثالث%' THEN 3 WHEN q.lesson LIKE '%الرابع%' THEN 4 WHEN q.lesson LIKE '%الخامس%' THEN 5 WHEN q.lesson LIKE '%السادس%' THEN 6 ELSE 99 END, q.id`).bind(profile.school_year, profile.educational_stage || '').all();
    return json({questions:(rows.results||[]).map(q=>({...q,options:optionsJson(q.options_json)}))});
  }
  const rows = await env.DB.prepare(`SELECT ${columns},q.lesson AS chapter FROM questions q ORDER BY q.subject, CASE WHEN q.unit LIKE '%الأولى%' THEN 1 WHEN q.unit LIKE '%الثانية%' THEN 2 WHEN q.unit LIKE '%الثالثة%' THEN 3 WHEN q.unit LIKE '%الرابعة%' THEN 4 ELSE 99 END, CASE WHEN q.lesson LIKE '%الأول%' THEN 1 WHEN q.lesson LIKE '%الثاني%' THEN 2 WHEN q.lesson LIKE '%الثالث%' THEN 3 WHEN q.lesson LIKE '%الرابع%' THEN 4 WHEN q.lesson LIKE '%الخامس%' THEN 5 WHEN q.lesson LIKE '%السادس%' THEN 6 ELSE 99 END, q.id`).all();
  return json({questions:(rows.results||[]).map(q=>({...q,options:optionsJson(q.options_json)}))});
}

export async function onRequestPost({ request, env }) {
  const denied=requireTeacher(await me(request,env)); if(denied)return denied; const od=originGuard(request);if(od)return od; const x=await body(request);
  const subject=limitText(x.subject,160), lesson=limitText(x.chapter||x.lesson,160), prompt=limitText(x.prompt,20000); if(!subject||!lesson||!prompt||!['mcq','boolean','essay'].includes(x.type))return json({error:'بيانات السؤال غير مكتملة'},400);
  const options=Array.isArray(x.options)?x.options.map(v=>limitText(v,1000)).filter(Boolean).slice(0,10):[]; const difficulty=['easy','medium','hard'].includes(x.difficulty)?x.difficulty:'medium';
  const q=await env.DB.prepare('INSERT INTO questions(subject,lesson,school_year,educational_stage,type,prompt,options_json,correct_answer,explanation,difficulty,is_published) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id').bind(subject,lesson,limitText(x.school_year,100)||null,limitText(x.educational_stage,80)||null,x.type,prompt,JSON.stringify(options),limitText(x.correct_answer,1000)||null,limitText(x.explanation,20000)||null,difficulty,x.is_published===false?0:1).first(); return json({id:q.id});
}

export async function onRequestPut({request,env}) { return json({error:'استخدم مسار السؤال المحدد'},405); }
