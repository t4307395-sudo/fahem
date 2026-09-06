# ملفات قديمة — لا تُنفَّذ على قاعدة الإنتاج

الملفات هنا كانت جزءًا من نسخة أقدم من مخطط قاعدة البيانات (بجدول `students` منفصل
وجداول `subjects`/`chapters` مرتبطة بـ id)، وهي **غير متوافقة إطلاقًا** مع
`schema.sql` الحالي (جدول `users` موحّد بأعمدة `subject`/`lesson` نصية مباشرة).

- `phase3_student_features.OLD-SCHEMA.sql` و`phase4_security_students.OLD-SCHEMA.sql`:
  بيشيروا لجدول `students` غير موجود حاليًا. لو اتنفذوا هيفشلوا فورًا.
- `rebuild-four-tables.INCOMPLETE.sql`: تعريف قديم لجدول `users` **بدون عمود
  `educational_stage`** المستخدَم في كل منطق عرض الأسئلة للطالب حاليًا. تنفيذه
  هيكسر التطبيق بالكامل لأي طالب.
- `d1-final-backup.OLD-SCHEMA.json`: نسخة احتياطية قديمة بمخطط `subject_id`/`chapter_id`
  (قبل التحويل للأعمدة النصية المباشرة). محفوظة للرجوع التاريخي فقط، ومفيهاش أي
  بيانات مستخدمين أو باسورد.

المصدر الوحيد المعتمد لبناء أو تحديث قاعدة الإنتاج هو `schema.sql` في جذر
المشروع، بالإضافة لملفات `migrations/` الحالية (`phase5_contact_messages.sql`
و`phase6_login_rate_limits.sql`) وهي فقط المتوافقة مع المخطط الحالي.
