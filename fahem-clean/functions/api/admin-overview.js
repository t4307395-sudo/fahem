import { json, me } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  if (user?.role !== 'admin') return json({ error: 'غير مصرح' }, 403);
  const [counts, recentUsers, recentAttempts, subjects, lessons] = await Promise.all([
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM users WHERE role='student') AS students,
      (SELECT COUNT(*) FROM questions) AS questions,
      (SELECT COUNT(DISTINCT subject) FROM questions) AS subjects,
      (SELECT COUNT(DISTINCT lesson) FROM questions) AS lessons,
      (SELECT COUNT(*) FROM attempts) AS attempts,
      (SELECT COUNT(*) FROM attempts WHERE completed_at IS NOT NULL AND date(completed_at)=date('now')) AS attempts_today,
      (SELECT COUNT(*) FROM messages WHERE status='new') AS new_messages`).first(),
    env.DB.prepare(`SELECT id,name,email,school_year,last_seen_at,created_at FROM users WHERE role='student' ORDER BY created_at DESC LIMIT 8`).all(),
    env.DB.prepare(`SELECT a.id,a.mode,a.score,a.total_gradable,a.completed_at,u.name AS student_name FROM attempts a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 8`).all(),
    env.DB.prepare(`SELECT subject,COUNT(*) AS total FROM questions GROUP BY subject ORDER BY total DESC`).all(),
    env.DB.prepare(`SELECT unit,lesson,subject,COUNT(*) AS total FROM questions GROUP BY subject,unit,lesson ORDER BY subject,CASE WHEN unit LIKE '%الأولى%' THEN 1 WHEN unit LIKE '%الثانية%' THEN 2 WHEN unit LIKE '%الثالثة%' THEN 3 WHEN unit LIKE '%الرابعة%' THEN 4 ELSE 99 END,CASE WHEN lesson LIKE '%الأول%' THEN 1 WHEN lesson LIKE '%الثاني%' THEN 2 WHEN lesson LIKE '%الثالث%' THEN 3 WHEN lesson LIKE '%الرابع%' THEN 4 WHEN lesson LIKE '%الخامس%' THEN 5 WHEN lesson LIKE '%السادس%' THEN 6 ELSE 99 END LIMIT 50`).all()
  ]);
  return json({ ok: true, counts: counts || {}, recentUsers: recentUsers.results || [], recentAttempts: recentAttempts.results || [], subjects: subjects.results || [], lessons: lessons.results || [] });
}
