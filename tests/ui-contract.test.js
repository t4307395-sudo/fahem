import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const styles=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const shared=readFileSync(new URL('../functions/api/_shared.js',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const auth=readFileSync(new URL('../functions/api/auth.js',import.meta.url),'utf8');

describe('Textbook question bank SPA contract',()=>{
 it('keeps one Arabic RTL application shell',()=>{expect(html).toContain('<html lang="ar" dir="rtl">');expect(html).toContain('id="app"');expect(html).toContain('/styles.css');expect(html).toContain('/app.js?');});
 it('starts with the two requested journeys',()=>{expect(app).toContain('بنك أسئلة الكتاب المدرسي');expect(app).toContain("startJourney('review')");expect(app).toContain("startJourney('exam')");});
 it('provides the year then setup flow in the same SPA',()=>{expect(app).toContain('function yearPicker()');expect(app).toContain('function chooseYear(y)');expect(app).toContain("state.page==='reviewSetup'");expect(app).toContain("state.page==='examSetup'");});
 it('supports lesson, question count, and exam duration choices',()=>{expect(app).toContain('id="lesson"');expect(app).toContain('id="count"');expect(app).toContain('id="minutes"');expect(app).toContain('function beginStudy(mode)');});
 it('renders educational cards with hidden answers and explanations',()=>{expect(app).toContain('function questionCard(q,i,exam=false)');expect(app).toContain('إظهار الإجابة');expect(app).toContain('الإجابة النموذجية');expect(app).toContain('q.explanation');expect(styles).toContain('.study-card');});
 it('supports timed exams and submits attempts through the existing API',()=>{expect(app).toContain('timer-pill');expect(app).toContain('setInterval');expect(app).toContain("api('/attempts'");expect(app).toContain("mode:'mock'");});
 it('escapes question content before inserting it into cards',()=>{expect(app).toContain('replace(/[&<>');expect(app).toContain('esc(q.prompt)');});
 it('keeps registration and login distinct',()=>{expect(app).toContain("state.authMode==='register'");expect(app).toContain('إنشاء حساب');expect(app).toContain('تسجيل الدخول');expect(auth).toContain('if(user.role === \'student\' && (name || educational_stage || school_year))');});
 it('keeps login protection and PWA support',()=>{expect(shared).toContain('maxAttempts = 5');expect(shared).toContain('return false');expect(html).toContain('/manifest.json');expect(app).toContain("navigator.serviceWorker.register('/sw.js')");expect(sw).toContain('self.skipWaiting()');});
 it('keeps the question and answer APIs in the deployment tree',()=>{expect(readFileSync(new URL('../functions/api/questions.js',import.meta.url),'utf8')).toContain('export async function onRequestGet');expect(readFileSync(new URL('../functions/api/attempts.js',import.meta.url),'utf8')).toContain('export async function onRequestPost');});
});
