import React from 'react';
import { ReservationProvider, useReservation } from './context/ReservationContext';
import { TopDemoBar } from './components/header/TopDemoBar';
import { ParentView } from './components/parent/ParentView';
import { AdminView } from './components/admin/AdminView';
import { AdminLockScreen } from './components/auth/AdminLockScreen';
import { ToastContainer } from './components/common/ToastContainer';
import { AdminNotificationModal } from './components/common/AdminNotificationModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';

const AppContent: React.FC = () => {
  const { appMode, isParentDirectLink, isAdminAuthenticated } = useReservation();

  // 원장님 미인증 상태이고 학부모 전용링크가 아닌 경우 -> 전체 잠금 (상단바 및 모드 전환 원천 차단)
  if (!isAdminAuthenticated && !isParentDirectLink) {
    return (
      <div className="min-h-screen bg-[#1d1d1f] text-white flex flex-col font-sans select-none">
        <ToastContainer />
        <AdminLockScreen />
        <PwaInstallPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans print:bg-white print:min-h-0 selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      {/* 1. 최상단 모드 전환 & 테스트 컨트롤 헤더 */}
      <div className="no-print">
        <TopDemoBar />
      </div>

      {/* 2. 전역 알림 토스트 & 부재중 예약 모달 & PWA 설치 배너 */}
      <div className="no-print">
        <ToastContainer />
        <AdminNotificationModal />
        <PwaInstallPrompt />
      </div>

      {/* 3. 모드별 메인 화면 렌더링 */}
      <main className="flex-1 pb-16 print:p-0 print:m-0 print:pb-0 flex flex-col">
        {appMode === 'parent' ? <ParentView /> : <AdminView />}
      </main>

      {/* 4. 푸터 (Apple Minimalist Glass Footer) */}
      <footer className="no-print border-t border-black/[0.05] bg-white/60 backdrop-blur-md py-6 text-center text-xs text-[#86868b]">
        <p className="font-semibold text-[#1d1d1f] tracking-tight flex items-center justify-center gap-1.5">
          <img src="/logo.png" alt="숙명클라라피아노" className="w-4 h-4 object-contain inline-block" />
          <span>숙명클라라피아노 - 보강 예약하기</span>
        </p>
        <p className="text-[11px] mt-1 text-[#86868b] tracking-normal">
          Apple Human Interface Design · React · TypeScript · Tailwind CSS
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ReservationProvider>
      <AppContent />
    </ReservationProvider>
  );
}
