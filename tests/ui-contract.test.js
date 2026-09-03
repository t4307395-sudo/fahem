import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

 describe('Fahem student experience contract', () => {
  it('keeps an Arabic RTL document and cache-busted app entry', () => {
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('app.js?rev=fahem-navigation-20260904');
  });

  it('exposes the three requested study modes', () => {
    expect(app).toContain('function startExam()');
    expect(app).toContain('async function quizSetup()');
    expect(app).toContain('async function trainingSetup()');
    expect(app).toContain('function beginTraining(kind)');
  });

  it('supports the open test year and subject filters', () => {
    expect(app).toContain('function yearSelect(id,years)');
    expect(app).toContain("document.querySelector('#quizYear')");
    expect(app).toContain("optionSelect('quizSubject','المادة',subjects,'كل المواد')");
    expect(app).toContain("filteredPool(subject,'',difficulty,limit,schoolYear,50)");
    expect(app).toContain('اختر السنة الدراسية أولًا');
    expect(app).toContain('الاختبار المفتوح');
  });

  it('supports configurable exam and explanation feedback', () => {
    expect(app).toContain('examLimit');
    expect(app).toContain('examMinutes');
    expect(app).toContain('examSubject');
    expect(app).toContain('الإجابة النموذجية');
    expect(app).toContain('q.explanation');
  });

  it('escapes question content before inserting it into the interface', () => {
    expect(app).toContain('replace(/[&<>');
    expect(app).toContain('esc(q.prompt)');
  });

  it('keeps account and support tools inside the app shell', () => {
    expect(app).toContain("go('profile')");
    expect(app).toContain("go('contact')");
    expect(app).toContain("api('/contact'");
    expect(app).toContain('تم إرسال رسالتك بنجاح');
  });

  it('supports an in-app PWA install flow', () => {
    expect(html).toContain('/manifest.json');
    expect(app).toContain('beforeinstallprompt');
    expect(app).toContain("navigator.serviceWorker.register('/sw.js')");
    expect(app).toContain('installApp()');
  });

  it('does not expose teacher wording in the student login copy', () => {
    expect(app).not.toContain('كلمة المرور للمعلم فقط');
    expect(app).not.toContain('المعلم يستخدم كلمة المرور');
  });

  it('requires a material for full-book review', () => {
    expect(app).toContain("optionSelect('bookSubject','المادة',subjects)");
    expect(app).toContain("document.querySelector('#bookSubject')");
  });
  it('uses fixed student-safe question count selectors and caps study modes', () => {
    expect(app).toContain("countSelect('trainLimit','عدد الأسئلة',50");
    expect(app).toContain("countSelect('quizLimit','عدد الأسئلة',50");
    expect(app).toContain("countSelect('examLimit','عدد الأسئلة',100");
    expect(app).toContain("filteredPool(subject,chapter,difficulty,limit,'',50)");
    expect(app).toContain("filteredPool(subject,'',difficulty,limit,'',100)");
  });
  it('shows administration navigation only to the admin account', () => {
    expect(app).toContain("state.user?.role==='admin'");
    expect(app).toContain('>الإدارة</button>');
  });
  it('provides a clickable question index and result review navigation', () => {
    expect(app).toContain('function questionIndex()');
    expect(app).toContain('function jumpToQuestion(index)');
    expect(app).toContain('function resultIndex()');
    expect(app).toContain('function reviewResultQuestion(index)');
    expect(app).toContain('data-question-index="${i}"');
    expect(app).toContain('state.results[id]');
    expect(app).toContain('splitActionArgs');
    expect(app).toContain('canNext=Boolean');
  });
  it('provides previous and next navigation in both study modes', () => {
    expect(app).toContain('class="question-navigation"');
    expect(app).toContain("state.mode==='training'||state.mode==='exam'");
    expect(app).toContain("اختر إجابة للمتابعة");
  });
  it('includes search and social sharing metadata', () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('/assets/og-image.png');
    expect(html).toContain('EducationalApplication');
  });
});
