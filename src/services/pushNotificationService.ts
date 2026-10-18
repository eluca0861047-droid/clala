/**
 * 숙명클라라피아노 모바일 백그라운드 PWA 푸시 & 시스템 알림 서비스
 */

export type PushNotificationStatus = 'unsupported' | 'default' | 'granted' | 'denied';

export interface NotificationPayload {
  title: string;
  body: string;
  date?: string;
  time?: string;
  studentName?: string;
  url?: string;
  tag?: string;
}

const STORAGE_KEY_NOTIFICATION_ENABLED = 'pianoslot_push_notifications_enabled';

/**
 * 브라우저 및 기기의 알림 지원 여부 확인
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * 현재 시스템 알림 권한 상태 조회
 */
export function getNotificationPermissionStatus(): PushNotificationStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as PushNotificationStatus;
}

/**
 * 모바일/PC 시스템 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<PushNotificationStatus> {
  if (!isNotificationSupported()) {
    console.warn('[Push] 이 기기/브라우저는 시스템 알림을 지원하지 않습니다.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEY_NOTIFICATION_ENABLED, 'true');
      console.info('[Push] 시스템 알림 권한이 허용되었습니다.');
    } else {
      localStorage.removeItem(STORAGE_KEY_NOTIFICATION_ENABLED);
      console.warn('[Push] 시스템 알림 권한이 거부되었거나 보류되었습니다:', permission);
    }
    return permission as PushNotificationStatus;
  } catch (error) {
    console.error('[Push] 알림 권한 요청 중 오류 발생:', error);
    return 'denied';
  }
}

/**
 * 시스템 네이티브 알림 발송 (잠금화면 배너, 진동, 사운드 트리거)
 */
export async function sendSystemNotification(payload: NotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const title = payload.title || '숙명클라라피아노';
  const options: any = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    // 모바일 진동 패턴 (200ms 진동, 100ms 대기, 200ms 진동)
    vibrate: [200, 100, 200, 100, 200],
    tag: payload.tag || 'pianoslot-notice-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.url || '/',
      date: payload.date,
      time: payload.time,
      studentName: payload.studentName,
    },
  };

  try {
    // 1. Service Worker 등록을 통한 네이티브 알림 (PWA 모바일 잠금화면 최적화)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, options);
          return true;
        }
      } catch (swErr) {
        console.warn('[Push] ServiceWorker showNotification 실패, 기본 Notification으로 폴백:', swErr);
      }
    }

    // 2. 기본 Notification API 폴백
    new Notification(title, options);
    return true;
  } catch (err) {
    console.error('[Push] 알림 발송 실패:', err);
    return false;
  }
}

/**
 * 원장님 알림 연동 테스트 발송 (즉시 알림 배너 확인용)
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendSystemNotification({
    title: '🎵 숙명클라라피아노 알림 연동 완료',
    body: '모바일 잠금화면 알림이 성공적으로 활성화되었습니다! 학부모가 보강을 예약하면 실시간으로 알림이 울립니다.',
    tag: 'pianoslot-test-alert',
  });
}
