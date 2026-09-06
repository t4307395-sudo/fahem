import { json, body, me, requireTeacher, limitText, originGuard } from './_shared.js';

const TYPES = new Set(['stage', 'year', 'subject', 'unit', 'lesson']);
const PARENT = { stage: null, year: 'stage', subject: 'year', unit: 'subject', lesson: 'unit' };
const slugify = value => String(value || '').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 160) || 'node';
const adminOnly = async (request, env) => { const user = await me(request, env); return user?.role === 'admin' ? null : json({ error: 'هذه العملية متاحة للإدارة فقط' }, 403); };

async function validateParent(env, type, parentId) {
  const required = PARENT[type];
  if (!required) return parentId == null || parentId === '';
  if (!Number.isInteger(Number(parentId)) || Number(parentId) < 1) return false;
  const parent = await env.DB.prepare('SELECT id,node_type FROM content_nodes WHERE id=?').bind(Number(parentId)).first();
  return parent?.node_type === required;
}

export async function onRequestGet({ request, env }) {
  const user = await me(request, env);
  if (!user) return json({ error: 'سجّل الدخول أولًا' }, 401);
  const admin = ['admin', 'teacher'].includes(user.role);
  const nodeRows = await env.DB.prepare(`SELECT id,node_type,parent_id,name,slug,sort_order,is_active,metadata_json FROM content_nodes ${admin ? '' : 'WHERE is_active=1'} ORDER BY node_type,sort_order,id`).all();
  let nodes = nodeRows.results || [];
  let allowed = null;
  if (!admin) {
    const profile = await env.DB.prepare('SELECT educational_stage,school_year FROM users WHERE id=?').bind(user.id).first();
    const stageIds = new Set(nodes.filter(n => n.node_type === 'stage' && n.name === profile?.educational_stage).map(n => n.id));
    const yearIds = new Set(nodes.filter(n => n.node_type === 'year' && stageIds.has(n.parent_id) && n.name === profile?.school_year).map(n => n.id));
    allowed = new Set([...stageIds, ...yearIds]);
    let changed = true;
    while (changed) { changed = false; for (const n of nodes) if (allowed.has(n.parent_id) && !allowed.has(n.id)) { allowed.add(n.id); changed = true; } }
    nodes = nodes.filter(n => allowed.has(n.id));
  }
  const assessmentRows = await env.DB.prepare(`SELECT id,node_type,node_id,title,description,sort_order,is_active FROM content_assessments ${admin ? '' : 'WHERE is_active=1'} ORDER BY sort_order,id`).all();
  const assessments = (assessmentRows.results || []).filter(a => !allowed || allowed.has(a.node_id));
  const assessmentIds = new Set(assessments.map(a => a.id));
  const linkRows = await env.DB.prepare('SELECT assessment_id,question_id,sort_order FROM assessment_questions ORDER BY sort_order,question_id').all();
  const links = (linkRows.results || []).filter(l => assessmentIds.has(l.assessment_id));
  return json({ nodes, assessments, assessment_questions: links });
}

export async function onRequestPost({ request, env }) {
  const denied = await adminOnly(request, env); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  if (x.resource === 'node') {
    const node_type = limitText(x.node_type, 20);
    const name = limitText(x.name, 200);
    const parent_id = x.parent_id == null || x.parent_id === '' ? null : Number(x.parent_id);
    if (!TYPES.has(node_type) || !name || !(await validateParent(env, node_type, parent_id))) return json({ error: 'بيانات عقدة المحتوى غير صالحة' }, 400);
    const sort_order = Math.max(0, Math.min(99999, Number(x.sort_order) || 0));
    const slug = slugify(name);
    try {
      const row = await env.DB.prepare('INSERT INTO content_nodes(node_type,parent_id,name,slug,sort_order,is_active,metadata_json) VALUES(?,?,?,?,?,1,?) RETURNING *').bind(node_type, parent_id, name, slug, sort_order, JSON.stringify(x.metadata || {})).first();
      return json({ ok: true, node: row }, 201);
    } catch (error) { return json({ error: 'تعذر إنشاء العنصر؛ قد يكون الاسم مكررًا داخل المستوى نفسه' }, 409); }
  }
  if (x.resource === 'assessment') {
    const node_type = limitText(x.node_type, 20), node_id = Number(x.node_id), title = limitText(x.title, 200);
    if (!['lesson', 'unit'].includes(node_type) || !Number.isInteger(node_id) || !title) return json({ error: 'بيانات الاختبار غير مكتملة' }, 400);
    const node = await env.DB.prepare('SELECT id FROM content_nodes WHERE id=? AND node_type=?').bind(node_id, node_type).first();
    if (!node) return json({ error: 'العنصر التعليمي غير موجود' }, 404);
    const row = await env.DB.prepare('INSERT INTO content_assessments(node_type,node_id,title,description,sort_order,is_active) VALUES(?,?,?,?,?,1) RETURNING *').bind(node_type, node_id, title, limitText(x.description, 2000) || null, Number(x.sort_order) || 0).first();
    return json({ ok: true, assessment: row }, 201);
  }
  if (x.resource === 'assessment-question') {
    const assessment_id = Number(x.assessment_id), question_id = Number(x.question_id);
    if (!Number.isInteger(assessment_id) || !Number.isInteger(question_id)) return json({ error: 'معرّف الاختبار أو السؤال غير صالح' }, 400);
    const assessment = await env.DB.prepare('SELECT id FROM content_assessments WHERE id=?').bind(assessment_id).first();
    const question = await env.DB.prepare('SELECT id FROM questions WHERE id=?').bind(question_id).first();
    if (!assessment || !question) return json({ error: 'الاختبار أو السؤال غير موجود' }, 404);
    await env.DB.prepare('INSERT OR REPLACE INTO assessment_questions(assessment_id,question_id,sort_order) VALUES(?,?,?)').bind(assessment_id, question_id, Number(x.sort_order) || 0).run();
    return json({ ok: true });
  }
  return json({ error: 'نوع مورد غير معروف' }, 400);
}

export async function onRequestPut({ request, env }) {
  const denied = await adminOnly(request, env); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  if (x.resource === 'node') {
    const id = Number(x.id), name = limitText(x.name, 200);
    if (!Number.isInteger(id) || !name) return json({ error: 'بيانات العنصر غير صالحة' }, 400);
    const result = await env.DB.prepare('UPDATE content_nodes SET name=?,slug=?,sort_order=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(name, slugify(name), Number(x.sort_order) || 0, x.is_active === false ? 0 : 1, id).run();
    return result.meta?.changes ? json({ ok: true }) : json({ error: 'العنصر غير موجود' }, 404);
  }
  if (x.resource === 'assessment') {
    const id = Number(x.id), title = limitText(x.title, 200);
    if (!Number.isInteger(id) || !title) return json({ error: 'بيانات الاختبار غير صالحة' }, 400);
    const result = await env.DB.prepare('UPDATE content_assessments SET title=?,description=?,sort_order=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(title, limitText(x.description, 2000) || null, Number(x.sort_order) || 0, x.is_active === false ? 0 : 1, id).run();
    return result.meta?.changes ? json({ ok: true }) : json({ error: 'الاختبار غير موجود' }, 404);
  }
  return json({ error: 'نوع مورد غير معروف' }, 400);
}

export async function onRequestDelete({ request, env }) {
  const denied = await adminOnly(request, env); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const x = await body(request);
  if (x.resource === 'assessment-question') {
    await env.DB.prepare('DELETE FROM assessment_questions WHERE assessment_id=? AND question_id=?').bind(Number(x.assessment_id), Number(x.question_id)).run();
    return json({ ok: true });
  }
  if (x.resource === 'assessment') {
    await env.DB.prepare('DELETE FROM assessment_questions WHERE assessment_id=?').bind(Number(x.id)).run();
    await env.DB.prepare('DELETE FROM content_assessments WHERE id=?').bind(Number(x.id)).run();
    return json({ ok: true });
  }
  if (x.resource === 'node') {
    const id = Number(x.id);
    const children = await env.DB.prepare('SELECT COUNT(*) AS count FROM content_nodes WHERE parent_id=?').bind(id).first();
    if (Number(children?.count) > 0) return json({ error: 'لا يمكن حذف عنصر له عناصر فرعية؛ عطّله أو احذف الفروع أولًا' }, 409);
    await env.DB.prepare('DELETE FROM content_nodes WHERE id=?').bind(id).run();
    return json({ ok: true });
  }
  return json({ error: 'نوع مورد غير معروف' }, 400);
}
