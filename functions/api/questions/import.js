import * as XLSX from 'xlsx';
import { json, me, requireTeacher, limitText, originGuard } from '../_shared.js';

const TYPES = new Set(['mcq', 'boolean', 'essay']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const REQUIRED = ['subject', 'chapter', 'school_year', 'type', 'prompt', 'difficulty'];

function clean(value, max = 20000) {
  return limitText(String(value ?? '').trim(), max);
}

function normalizeRow(raw, rowNumber) {
  const row = Object.fromEntries(Object.entries(raw).map(([k, v]) => [String(k).trim().toLowerCase(), v]));
  const type = clean(row.type, 20).toLowerCase();
  const difficulty = clean(row.difficulty, 20).toLowerCase();
  const options = [row.option_a, row.option_b, row.option_c, row.option_d]
    .map(v => clean(v, 1000)).filter(Boolean);
  const item = {
    row: rowNumber,
    subject: clean(row.subject, 160),
    chapter: clean(row.chapter || row.lesson, 160),
    school_year: clean(row.school_year, 80),
    type,
    prompt: clean(row.prompt, 20000),
    options,
    correct_answer: clean(row.correct_answer, 1000),
    explanation: clean(row.explanation, 20000),
    difficulty: DIFFICULTIES.has(difficulty) ? difficulty : 'medium'
  };
  const errors = [];
  for (const key of REQUIRED) if (!item[key]) errors.push(`الحقل ${key} فارغ`);
  if (!TYPES.has(type)) errors.push('type يجب أن يكون mcq أو boolean أو essay');
  if (type === 'mcq' && (options.length < 2 || !item.correct_answer)) errors.push('سؤال mcq يحتاج اختيارين على الأقل وإجابة صحيحة');
  if (type === 'boolean' && (!options.includes('صحيح') || !options.includes('خطأ') || !item.correct_answer)) errors.push('سؤال boolean يحتاج اختيارَي صحيح وخطأ وإجابة صحيحة');
  if (type === 'essay' && options.length) errors.push('السؤال المقالي لا يحتاج اختيارات');
  if (item.correct_answer && type !== 'essay' && !options.includes(item.correct_answer)) errors.push('الإجابة الصحيحة يجب أن تطابق أحد الاختيارات حرفيًا');
  return { item, errors };
}

async function parseExcel(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) return { rows: [], errors: [{ row: 0, errors: ['حجم الملف يتجاوز 8 ميجابايت'] }] };
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false, cellFormula: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (!rawRows.length) return { rows: [], errors: [{ row: 0, errors: ['الملف لا يحتوي على صفوف'] }] };
  const rows = [], errors = [];
  rawRows.slice(0, 500).forEach((raw, index) => {
    const result = normalizeRow(raw, index + 2);
    if (result.errors.length) errors.push({ row: result.item.row, errors: result.errors });
    else rows.push(result.item);
  });
  if (rawRows.length > 500) errors.push({ row: 0, errors: ['الحد الأقصى للاستيراد هو 500 سؤال في الدفعة الواحدة'] });
  return { rows, errors };
}

function jsonRows(value) {
  if (!Array.isArray(value)) return { rows: [], errors: [{ row: 0, errors: ['لم يتم إرسال صفوف صحيحة'] }] };
  const rows = [], errors = [];
  value.slice(0, 500).forEach((raw, index) => {
    const result = normalizeRow(raw, Number(raw.row) || index + 2);
    if (result.errors.length) errors.push({ row: result.item.row, errors: result.errors });
    else rows.push(result.item);
  });
  return { rows, errors };
}

export async function onRequestPost({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  const contentType = request.headers.get('content-type') || '';
  let parsed;
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') return json({ error: 'اختر ملف Excel أولًا' }, 400);
    parsed = await parseExcel(file);
    return json({ ok: true, preview: true, rows: parsed.rows, errors: parsed.errors, total: parsed.rows.length });
  }
  const payload = await request.json().catch(() => ({}));
  parsed = jsonRows(payload.rows);
  if (parsed.errors.length) return json({ error: 'يوجد أخطاء في الملف', errors: parsed.errors, valid: parsed.rows.length }, 400);
  const existing = await env.DB.prepare('SELECT subject, lesson, prompt FROM questions').all();
  const keys = new Set((existing.results || []).map(q => `${q.subject}\u0000${q.lesson}\u0000${q.prompt}`));
  const unique = [], duplicates = [];
  for (const q of parsed.rows) {
    const key = `${q.subject}\u0000${q.chapter}\u0000${q.prompt}`;
    if (keys.has(key)) duplicates.push(q.row);
    else { keys.add(key); unique.push(q); }
  }
  if (!unique.length) return json({ ok: true, imported: 0, duplicates, message: 'كل الأسئلة موجودة مسبقًا' });
  const statements = unique.map(q => env.DB.prepare('INSERT INTO questions(subject,lesson,school_year,type,prompt,options_json,correct_answer,explanation,difficulty) VALUES(?,?,?,?,?,?,?,?,?)').bind(q.subject, q.chapter, q.school_year || null, q.type, q.prompt, JSON.stringify(q.options), q.correct_answer || null, q.explanation || null, q.difficulty));
  await env.DB.batch(statements);
  return json({ ok: true, imported: unique.length, duplicates });
}
