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

export interface DeviceNotificationDiagnosis {
  supported: boolean;
  isSecure: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  isInAppBrowser: boolean;
  permission: PushNotificationStatus;
  statusType: 'ready' | 'insecure_http' | 'ios_needs_pwa' | 'in_app_browser' | 'denied' | 'unsupported';
  title: string;
  description: string;
  guideSteps: string[];
}

/**
 * 기기 및 브라우저의 알림 수신 환경 상세 진단
 */
export function diagnoseNotificationEnvironment(): DeviceNotificationDiagnosis {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      isSecure: false,
      isIOS: false,
      isStandalone: false,
      isInAppBrowser: false,
      permission: 'unsupported',
      statusType: 'unsupported',
      title: '알림 지원 불가',
      description: '서버 환경입니다.',
      guideSteps: [],
    };
  }

  const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const isInAppBrowser = /KAKAOTALK|NAVER|Line|Instagram|DaumApps/i.test(ua);
  const hasNotificationApi = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;
  const permission: PushNotificationStatus = hasNotificationApi
    ? (Notification.permission as PushNotificationStatus)
    : 'unsupported';

  // 1. 카카오톡/인앱 브라우저
  if (isInAppBrowser) {
    return {
      supported: false,
      isSecure,
      isIOS,
      isStandalone,
      isInAppBrowser,
      permission,
      statusType: 'in_app_browser',
      title: '인앱 브라우저(카카오톡/네이버) 안내',
      description: '카카오톡이나 앱 내부 브라우저에서는 스마트폰 보안 정책상 시스템 알림이 지원되지 않습니다.',
      guideSteps: [
        '화면 우측 상단 또는 하단의 메뉴(⋮ 또는 ···)를 누르세요.',
        '[다른 브라우저로 열기] (Chrome 또는 Safari)를 선택하세요.',
        '외부 정식 브라우저에서 알림 켜기를 진행하시면 정상 작동합니다.',
      ],
    };
  }

  // 2. 비보안 HTTP (로컬 네트워크 IP 접속)
  if (!isSecure) {
    return {
      supported: false,
      isSecure,
      isIOS,
      isStandalone,
      isInAppBrowser,
      permission,
      statusType: 'insecure_http',
      title: '보안 연결(HTTPS) 환경 필요',
      description: '웹 푸시 알림은 스마트폰 글로벌 보안 표준(W3C)에 따라 HTTPS(보안 연결) 환경에서만 권한 창이 열립니다.',
      guideSteps: [
        '현재는 개발용 로컬 IP(http://192.168...)로 접속하여 휴대폰 브라우저가 보안상 알림 창을 차단했습니다.',
        'PC에서는 http://localhost로 접속하시면 즉시 테스트 알림이 정상 작동합니다.',
        '스마트폰 잠금화면 알림은 추후 HTTPS 도메인(Vercel, Netlify 등) 배포 시 100% 정상 활성화됩니다.',
      ],
    };
  }

  // 3. 아이폰(iOS) 사파리에서 홈 화면 추가 전
  if (isIOS && !isStandalone) {
    return {
      supported: false,
      isSecure,
      isIOS,
      isStandalone,
      isInAppBrowser,
      permission,
      statusType: 'ios_needs_pwa',
      title: '아이폰(iOS) 알림 설정 방법',
      description: '애플(Apple)의 보안 정책상, 아이폰은 앱을 [홈 화면에 추가]해야만 잠금화면 푸시 알림이 활성화됩니다.',
      guideSteps: [
        '사파리(Safari) 브라우저 하단 중앙의 [공유 아이콘](네모에 위쪽 화살표 ↑)을 누르세요.',
        '메뉴를 아래로 내려 [홈 화면에 추가]를 선택하고 우측 상단 [추가]를 누르세요.',
        '아이폰 바탕화면에 새로 생긴 [숙명클라라] 앱 아이콘을 터치하여 실행하세요.',
        '앱 실행 후 [알림 켜기]를 누르면 아이폰 잠금화면 알림이 완벽히 작동합니다.',
      ],
    };
  }

  // 4. 이미 차단(denied) 상태
  if (permission === 'denied') {
    return {
      supported: true,
      isSecure,
      isIOS,
      isStandalone,
      isInAppBrowser,
      permission,
      statusType: 'denied',
      title: '브라우저 알림 권한 차단됨',
      description: '이전에 알림 권한이 거부되었거나 차단되어 브라우저가 권한 창을 다시 띄우지 않습니다.',
      guideSteps: [
        '모바일 브라우저 주소창 좌측의 [자물쇠] 또는 [설정(조절)] 아이콘을 누르세요.',
        '[사이트 설정] 또는 [권한] 메뉴로 이동하세요.',
        '[알림] 항목을 찾아 [허용]으로 변경해 주세요.',
        '페이지를 새로고침하시면 알림이 정상적으로 수신됩니다.',
      ],
    };
  }

  // 5. 알림 API 미지원 브라우저
  if (!hasNotificationApi || !hasServiceWorker) {
    return {
      supported: false,
      isSecure,
      isIOS,
      isStandalone,
      isInAppBrowser,
      permission: 'unsupported',
      statusType: 'unsupported',
      title: '알림 미지원 브라우저',
      description: '현재 사용 중인 브라우저 버전이 웹 푸시 알림을 지원하지 않습니다.',
      guideSteps: [
        '최신 버전의 크롬(Chrome) 또는 사파리(Safari) 브라우저를 이용해 주세요.',
      ],
    };
  }

  // 6. 정상 사용 가능
  return {
    supported: true,
    isSecure,
    isIOS,
    isStandalone,
    isInAppBrowser,
    permission,
    statusType: 'ready',
    title: '모바일 알림 설정 가능',
    description: '스마트폰 잠금화면 알림을 켤 수 있습니다.',
    guideSteps: [],
  };
}

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
  const diag = diagnoseNotificationEnvironment();
  if (diag.statusType !== 'ready') {
    console.warn('[Push] 알림 활성화 불가:', diag.statusType, diag.title);
    return diag.permission;
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
