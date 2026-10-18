import React from 'react';
import { useReservation } from '../../context/ReservationContext';
import { Bell, CheckCircle2, Calendar, Clock, X, ArrowRight, Check } from 'lucide-react';

export const AdminNotificationModal: React.FC = () => {
  const {
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    unreadBookingLogs,
    unreadBookingCount,
    recentBookingLogs,
    markAllBookingsAsRead,
    setAppMode,
    setAdminTab,
    addToast,
    isParentDirectLink,
  } = useReservation();

  if (!isNotificationModalOpen || isParentDirectLink) return null;

  const handleConfirmAll = () => {
    markAllBookingsAsRead();
    setIsNotificationModalOpen(false);
    addToast('success', '예약 확인 완료', '새로 접수된 모든 예약을 확인 처리했습니다.');
  };

  const handleGoToTimetable = () => {
    markAllBookingsAsRead();
    setIsNotificationModalOpen(false);
    setAppMode('admin');
    setAdminTab('timetable');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 표시할 목록 (미확인이 있으면 미확인 우선, 없으면 최근 내역 표시)
  const displayList = unreadBookingCount > 0 ? unreadBookingLogs : recentBookingLogs;

  return (
    <div className="no-print fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.01] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[16px] bg-[#ff9500] text-white shadow-md flex items-center justify-center">
              <Bell className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight">
                  새로 접수된 보강 예약
                </h3>
                {unreadBookingCount > 0 ? (
                  <span className="text-[11px] font-extrabold bg-[#ff3b30] text-white px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                    미확인 {unreadBookingCount}건
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-[#34c759]/15 text-[#34c759] px-2 py-0.5 rounded-full border border-[#34c759]/25">
                    모두 확인됨
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86868b] mt-0.5">
                {unreadBookingCount > 0
                  ? '새로 접수된 보강 예약 내역입니다. 확인 후 시간표로 이동하거나 완료 처리해 주세요.'
                  : '최근 접수된 보강 예약 전체 기록입니다.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationModalOpen(false)}
            className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 예약 목록 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-[#86868b] space-y-2">
              <div className="w-12 h-12 rounded-[16px] bg-black/[0.03] flex items-center justify-center mx-auto text-[#86868b]">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#1d1d1f]">
                새로 접수된 보강 예약 내역이 없습니다.
              </p>
              <p className="text-[11px] text-[#86868b]">
                학부모가 보강을 예약하면 실시간으로 이곳에 등록됩니다.
              </p>
            </div>
          ) : (
            displayList.map((log) => {
              const isUnread = unreadBookingLogs.some((u) => u.id === log.id);

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-[18px] border transition-all flex items-start gap-3 text-xs ${
                    isUnread
                      ? 'bg-[#ff9500]/[0.08] border-[#ff9500]/30 shadow-xs'
                      : 'bg-black/[0.02] border-black/[0.04]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[#1d1d1f] text-[13px]">
                        {log.studentName || '학생'}
                      </span>
                      {isUnread && (
                        <span className="text-[9px] font-extrabold bg-[#ff3b30] text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] text-[#86868b] ml-auto font-medium">
                        {log.timestamp || '방금 전'}
                      </span>
                    </div>

                    <p className="text-[#1d1d1f]/90 mt-1 font-medium leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 모달 푸터 버튼 */}
        <div className="p-4 border-t border-black/[0.05] bg-black/[0.01] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGoToTimetable}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-xs font-bold bg-black/[0.05] hover:bg-[#0071e3]/10 text-[#1d1d1f] hover:text-[#0071e3] transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#0071e3]" />
            <span>시간표 보기</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0071e3]" />
          </button>

          <button
            type="button"
            onClick={handleConfirmAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>모두 확인 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
