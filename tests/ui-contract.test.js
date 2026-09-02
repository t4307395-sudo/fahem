import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

 describe('Fahem student experience contract', () => {
  it('keeps an Arabic RTL document and cache-busted app entry', () => {
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('app.js?rev=fahem-upgrade-20260902');
  });

  it('exposes the three requested study modes', () => {
    expect(app).toContain('function startExam()');
    expect(app).toContain('async function quizSetup()');
    expect(app).toContain('async function trainingSetup()');
    expect(app).toContain('function beginTraining(kind)');
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
});
