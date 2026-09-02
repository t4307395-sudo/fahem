import { json, me, requireTeacher, originGuard } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  return json({ essays: [] });
}

export async function onRequestPut({ request, env }) {
  const denied = requireTeacher(await me(request, env)); if (denied) return denied;
  const originDenied = originGuard(request); if (originDenied) return originDenied;
  return json({ error: 'مراجعة المقالات مؤجلة إلى مرحلة لاحقة' }, 501);
}
