import React, { useEffect } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { Bell, Calendar, X, ArrowRight } from 'lucide-react';

export const AdminLiveAlertBanner: React.FC = () => {
  const {
    latestLiveAlert,
    dismissLiveAlert,
    setAppMode,
    setAdminTab,
    isParentDirectLink,
  } = useReservation();

  // 8초 후 자동 닫힘
  useEffect(() => {
    if (!latestLiveAlert) return;
    const timer = setTimeout(() => {
      dismissLiveAlert();
    }, 8000);
    return () => clearTimeout(timer);
  }, [latestLiveAlert, dismissLiveAlert]);

  if (!latestLiveAlert || isParentDirectLink) return null;

  const handleGoToTimetable = () => {
    setAppMode('admin');
    setAdminTab('timetable');
    dismissLiveAlert();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="no-print fixed top-16 right-4 z-[9999] max-w-sm sm:max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[24px] p-4 border border-black/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.18)] flex items-start gap-3.5 ring-1 ring-black/[0.05]">
        {/* 애니메이션 벨 아이콘 */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-[14px] bg-[#ff9500] text-white flex items-center justify-center shadow-md animate-bounce">
            <Bell className="w-5 h-5 fill-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff3b30] rounded-full border-2 border-white animate-ping" />
        </div>

        {/* 알림 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#ff9500] uppercase tracking-wider">
              실시간 예약 알림
            </span>
            <span className="text-[10px] text-[#86868b] font-medium">방금 전</span>
          </div>

          <h4 className="text-sm font-bold text-[#1d1d1f] tracking-tight mt-0.5">
            {latestLiveAlert.studentName} {latestLiveAlert.grade ? `(${latestLiveAlert.grade})` : ''} 학생
          </h4>

          <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]/80 mt-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
            <span>{latestLiveAlert.date} {latestLiveAlert.time}</span>
            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.2 rounded-full border border-[#0071e3]/20">
              {latestLiveAlert.typeLabel || '보강 수업'}
            </span>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToTimetable}
              className="flex-1 py-1.5 px-3 rounded-[12px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
            >
              <span>시간표에서 확인</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={dismissLiveAlert}
              className="py-1.5 px-2.5 rounded-[12px] bg-black/[0.04] hover:bg-black/[0.08] text-[#86868b] hover:text-[#1d1d1f] text-xs font-semibold transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={dismissLiveAlert}
          className="text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full hover:bg-black/[0.05] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
