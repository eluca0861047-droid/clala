// public/sw-push-handler.js
// 숙명클라라피아노 PWA 백그라운드 웹 푸시 & 시스템 알림 핸들러

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '숙명클라라피아노';
  const options = {
    body: data.body || '새로운 보강 예약이 접수되었습니다.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'pianoslot-alert-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      date: data.date,
      time: data.time,
      studentName: data.studentName,
    },
    actions: [
      { action: 'view', title: '시간표 확인' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. 이미 열려있는 브라우저/PWA 창이 있으면 즉시 포커스
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          });
          return;
        }
      }
      // 2. 열린 창이 없으면 앱 실행
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
