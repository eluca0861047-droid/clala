import React, { useState, useMemo } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { Bell, CheckCircle2, Calendar, X, ArrowRight, Check } from 'lucide-react';
import { ActivityLog } from '../../types';
import { getRelativeTime, formatFullDateTime } from '../../utils/dateUtils';

export const AdminNotificationModal: React.FC = () => {
  const {
    isNotificationModalOpen,
    unreadBookingLogs,
    unreadBookingCount,
    recentBookingLogs,
    bookings,
    markAllBookingsAsRead,
    markBookingAsRead,
    readBookingIds,
    focusTimetableSlot,
    addToast,
    isParentDirectLink,
    closeNotificationModal,
  } = useReservation();

  if (!isNotificationModalOpen || isParentDirectLink) return null;

  // 필터 모드: 'unread' (신규 미확인만) | 'all' (전체 내역)
  const [filterMode, setFilterMode] = useState<'unread' | 'all'>('unread');

  // 전체 예약 목록 (최신 신청일 내림차순 정렬)
  const sortedAllList = useMemo(() => {
    return [...recentBookingLogs].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [recentBookingLogs]);

  // 미확인 신규 예약 목록
  const unreadList = useMemo(() => {
    return sortedAllList.filter((log) => {
      const isRead =
        readBookingIds.includes(log.id) ||
        (log.bookingId ? readBookingIds.includes(log.bookingId) : false);
      return !isRead;
    });
  }, [sortedAllList, readBookingIds]);

  // 현재 모드에 따라 표시할 목록 (신규 알람이 있을 땐 신규 예약만 깔끔하게 노출)
  const displayList = filterMode === 'unread' && unreadList.length > 0 ? unreadList : sortedAllList;

  // 개별 예약 알람 [확인] 처리 (빨간 동그라미 -> 녹색 동그라미로 바뀌고 확인 버튼 소멸)
  const handleConfirmSingle = (log: ActivityLog) => {
    markBookingAsRead(log.id);
    if (log.bookingId) {
      markBookingAsRead(log.bookingId);
    }
  };

  const getSlotInfoFromLog = (log: ActivityLog): { date: string; time: string } | null => {
    if (log.date && log.time) {
      return { date: log.date, time: log.time };
    }
    // bookings 테이블에서 해당 예약 매칭
    const found = bookings.find((b) => b.id === (log.bookingId || log.id));
    if (found) {
      return { date: found.date, time: found.time };
    }
    // 메시지 텍스트에서 [YYYY-MM-DD HH:mm] 추출 fallback
    const match = log.message.match(/\[(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\]/);
    if (match) {
      return { date: match[1], time: match[2] };
    }
    return null;
  };

  const handleConfirmAll = () => {
    markAllBookingsAsRead();
    closeNotificationModal();
    addToast('success', '예약 확인 완료', '새로 접수된 모든 예약을 확인 처리했습니다.');
  };

  const handleGoToTimetable = (targetLog?: ActivityLog) => {
    const log = targetLog || displayList[0];
    const slotInfo = log ? getSlotInfoFromLog(log) : null;

    markAllBookingsAsRead();
    closeNotificationModal();

    if (slotInfo) {
      focusTimetableSlot(slotInfo.date, slotInfo.time, log?.studentName);
      addToast(
        'info',
        '시간표 이동',
        `[${slotInfo.date} ${slotInfo.time}] ${log?.studentName ? `${log.studentName} 학생 ` : ''}예약 위치로 이동했습니다.`
      );
    } else {
      focusTimetableSlot('', '');
    }
  };

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
            onClick={closeNotificationModal}
            className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 필터: 신규 미확인 vs 전체 내역 */}
        <div className="px-4 sm:px-5 py-2.5 bg-black/[0.02] border-b border-black/[0.05] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-black/[0.04] p-0.5 rounded-[14px]">
            <button
              type="button"
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1 rounded-[11px] text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'unread' && unreadList.length > 0
                  ? 'bg-white text-[#ff3b30] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              신규 미확인 ({unreadList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-[11px] text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all' || unreadList.length === 0
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              전체 내역 ({sortedAllList.length})
            </button>
          </div>
          <span className="text-[11px] text-[#86868b] hidden sm:inline">
            {filterMode === 'unread' && unreadList.length > 0
              ? '새로 접수된 알람만 표시 중'
              : '확인 완료된 알람 포함'}
          </span>
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
              const isRead =
                readBookingIds.includes(log.id) ||
                (log.bookingId ? readBookingIds.includes(log.bookingId) : false);
              const isUnread = !isRead;
              const slotInfo = getSlotInfoFromLog(log);
              const relativeTime = getRelativeTime(log.createdAt, log.timestamp || '방금 전');
              const fullTime = log.createdAt ? formatFullDateTime(log.createdAt) : '';

              return (
                <div
                  key={log.id}
                  onClick={() => handleGoToTimetable(log)}
                  className={`p-3.5 rounded-[18px] border transition-all flex items-start gap-3 text-xs cursor-pointer group hover:scale-[1.008] active:scale-98 ${
                    isUnread
                      ? 'bg-[#ff3b30]/[0.03] border-[#ff3b30]/25 shadow-xs hover:border-[#ff3b30]/40 hover:bg-[#ff3b30]/[0.06]'
                      : 'bg-black/[0.02] border-black/[0.04] hover:bg-black/[0.05] hover:border-black/[0.1]'
                  }`}
                  title="클릭 시 시간표의 해당 예약 위치로 바로 이동합니다"
                >
                  {/* 왼쪽 체크 동그라미: 미확인은 빨간색, 확인 완료는 녹색 */}
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2
                      className={`w-4 h-4 transition-colors ${
                        isUnread ? 'text-[#ff3b30]' : 'text-[#34c759]'
                      }`}
                    />
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
                      <span
                        className="text-[10px] text-[#86868b] ml-auto font-medium cursor-help shrink-0"
                        title={fullTime || '신청 일시'}
                      >
                        {relativeTime}
                      </span>
                    </div>

                    <p className={`mt-1 leading-relaxed ${isUnread ? 'text-[#1d1d1f] font-semibold' : 'text-[#1d1d1f]/80 font-medium'}`}>
                      {log.message}
                    </p>

                    {/* 하단 행: 시간표 이동 링크 & 우측 하단 [확인] 버튼 */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                      {slotInfo ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#0071e3] group-hover:text-[#0077ed]">
                          <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
                          <span>시간표 이동({slotInfo.time})</span>
                          <ArrowRight className="w-3 h-3 text-[#0071e3] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* 미확인 상태일 때만 [확인] 버튼 표시 -> 누르면 녹색 체크로 바뀌고 버튼 소멸 */}
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmSingle(log);
                          }}
                          className="ml-auto px-3.5 py-1.5 rounded-[12px] bg-[#34c759] hover:bg-[#30b350] text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="이 예약을 확인 완료 상태로 변경합니다"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>확인</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 모달 푸터: 왼쪽 시간표 보기 버튼 제거 & 모두 확인 완료 버튼 */}
        <div className="p-4 border-t border-black/[0.05] bg-black/[0.01] flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-[#86868b] font-medium pl-1">
            {unreadBookingCount > 0 ? `미확인 예약 ${unreadBookingCount}건 남음` : '모든 예약을 확인했습니다.'}
          </span>

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

