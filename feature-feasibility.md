# تقييم قابلية مميزات الطالب

## مصادر رسمية

1. MDN Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
   يوضح أن Push API يمكنه استقبال الرسائل حتى عندما لا تكون الصفحة مفتوحة، لكنه يتطلب Service Worker فعالًا، اشتراك Push، وموافقة المستخدم. يجب حفظ endpoint ومفاتيح التشفير على الخادم، وحماية مسار الاشتراك من CSRF/XSRF.

2. MDN Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API
   يوضح أن الإذن يجب أن يطلب بعد ضغط المستخدم على زر، وأن HTTPS مطلوب، وعلى الهاتف يفضل عرض الإشعار عبر ServiceWorkerRegistration.showNotification بدل Notification constructor.

3. MDN Service Worker: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
   يوضح أن Service Worker مناسب للتخزين والعمل دون اتصال، ويعمل عبر HTTPS، ويستطيع التعامل مع أحداث install وactivate وfetch وpush.

4. Apple Web Push: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
   يوضح أن Web Push يعمل لتطبيقات Home Screen على iOS 16.4 أو أحدث، ويتطلب موافقة المستخدم وVAPID وخادمًا يرسل الطلبات. Safari لا يدعم الإشعارات الصامتة؛ يجب عرض إشعار مباشرة عند استلام push.

## القرار

Bookmark، مستوى الصعوبة، الترتيب العشوائي، الأوفلاين للمفضلة، والوضع الليلي قابلة للتنفيذ في المشروع الحالي.

Push Notifications قابلة للتنفيذ تقنيًا، لكنها تحتاج VAPID key pair، تخزين اشتراكات المستخدمين في D1، دالة إرسال Web Push على الخادم، وجدولة يومية لتحديد من لم يفتح التطبيق منذ ثلاثة أيام. لن تكون مضمونة إذا رفض الطالب الإذن أو كان المتصفح/النظام لا يدعمها، وعلى iPhone يجب تثبيت PWA على الشاشة الرئيسية واستخدام iOS 16.4 أو أحدث.
