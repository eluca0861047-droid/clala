import React, { useState, useMemo } from 'react';
import { useReservation } from '../../context/ReservationContext';
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Ticket,
  ChevronDown,
  ChevronUp,
  History,
  Search,
  X,
  ArrowRight,
  Calendar,
  Check,
  CheckCheck,
} from 'lucide-react';

// 상대 시간 표시 헬퍼
function getRelativeTime(createdAt?: string, fallback = '방금 전'): string {
  if (!createdAt) return fallback;
  const time = new Date(createdAt).getTime();
  if (isNaN(time)) return fallback;
  const now = Date.now();
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const d = new Date(time);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 정확한 일시 표시 헬퍼
function formatFullDateTime(createdAt?: string, fallback = ''): string {
  if (!createdAt) return fallback;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return fallback;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export const AdminDashboard: React.FC = () => {
  const {
    logs,
    bookings,
    recentBookingLogs,
    readBookingIds,
    markBookingAsRead,
    markAllBookingsAsRead,
    unreadBookingCount,
    focusTimetableSlot,
    addToast,
  } = useReservation();

  // 특정 알람 클릭 시 해당 날짜/시간의 시간표 슬롯으로 즉시 이동
  const handleJumpToTimetable = (log: any) => {
    let targetDate = log.date;
    let targetTime = log.time;

    if (!targetDate || !targetTime) {
      const found = bookings.find((b) => b.id === (log.bookingId || log.id));
      if (found) {
        targetDate = found.date;
        targetTime = found.time;
      }
    }

    if (!targetDate || !targetTime) {
      const match = log.message.match(/\[(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\]/);
      if (match) {
        targetDate = match[1];
        targetTime = match[2];
      }
    }

    if (targetDate && targetTime) {
      focusTimetableSlot(targetDate, targetTime, log.studentName);
      addToast(
        'info',
        '시간표 이동',
        `[${targetDate} ${targetTime}] ${log.studentName ? `${log.studentName} 학생 ` : ''}예약 위치로 이동했습니다.`
      );
    }
  };

  // 최신 이벤트가 항상 맨 상단에 오도록 createdAt/ID 기준 내림차순 정렬 (모달 전체 알림용)
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const timeA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : a.id.startsWith('log_')
        ? Number(a.id.replace('log_', '').split('_')[0]) || 0
        : 0;
      const timeB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : b.id.startsWith('log_')
        ? Number(b.id.replace('log_', '').split('_')[0]) || 0
        : 0;
      return timeB - timeA;
    });
  }, [logs]);

  // 피드 인라인 더보기 상태 및 전체 모달 상태
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAllLogsModalOpen, setIsAllLogsModalOpen] = useState(false);
  const [modalFilterType, setModalFilterType] = useState<'all' | 'booking' | 'cancel'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 각 카테고리별 개수 카운트 (모달용)
  const logCounts = useMemo(() => {
    return {
      all: sortedLogs.length,
      booking: sortedLogs.filter((l) => l.type === 'booking').length,
      cancel: sortedLogs.filter((l) => l.type === 'cancel').length,
    };
  }, [sortedLogs]);

  // 모달 내 필터링된 로그 목록
  const modalFilteredLogs = useMemo(() => {
    return sortedLogs.filter((log) => {
      // 1. 타입 필터
      if (modalFilterType === 'booking' && log.type !== 'booking') return false;
      if (modalFilterType === 'cancel' && log.type !== 'cancel') return false;

      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchMessage = log.message.toLowerCase().includes(query);
        const matchStudent = log.studentName ? log.studentName.toLowerCase().includes(query) : false;
        return matchMessage || matchStudent;
      }
      return true;
    });
  }, [sortedLogs, modalFilterType, searchQuery]);

  // 카드에 직접 표시할 보강 알람 목록 (중복 제거 & 정확한 시간순 recentBookingLogs 기반: 기본 5개 표시)
  const displayedLogs = isExpanded ? recentBookingLogs : recentBookingLogs.slice(0, 5);

  // 알람 내용 클릭 시 확인 알람으로 즉시 변경
  const handleCardClick = (log: any) => {
    markBookingAsRead(log.id);
    if (log.bookingId) markBookingAsRead(log.bookingId);
  };

  return (
    <div className="space-y-4">
      {/* 보강 알람 피드 (Apple Continuous Squircle Card) */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
        {/* 헤더 바 */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[8px] bg-[#ff9500]/10 text-[#ff9500] flex items-center justify-center shadow-xs">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f]">보강 알람</h4>
            <span className="text-[10px] text-[#86868b] hidden sm:inline">
              (2개월 지난 알람 자동 삭제)
            </span>
            {unreadBookingCount > 0 ? (
              <span className="text-[11px] font-bold bg-[#ff3b30]/15 text-[#ff3b30] px-2.5 py-0.5 rounded-full border border-[#ff3b30]/25 animate-pulse">
                미확인 알람 {unreadBookingCount}건
              </span>
            ) : (
              <span className="text-[11px] font-bold bg-[#34c759]/15 text-[#34c759] px-2.5 py-0.5 rounded-full border border-[#34c759]/25 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#34c759]" />
                <span>확인 알람</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadBookingCount > 0 && (
              <button
                type="button"
                onClick={() => markAllBookingsAsRead()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[12px] text-xs font-semibold bg-[#34c759]/10 hover:bg-[#34c759]/20 text-[#34c759] border border-[#34c759]/20 transition-all active:scale-95 cursor-pointer"
                title="모든 미확인 보강 알람을 확인 상태로 변경합니다"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>모두 확인</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setModalFilterType('all');
                setIsAllLogsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold bg-black/[0.05] hover:bg-[#0071e3]/10 text-[#1d1d1f] hover:text-[#0071e3] border border-black/[0.04] transition-all active:scale-95 cursor-pointer"
              title="전체 알림 내역 검색 및 상세 보기"
            >
              <History className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>알림 전체 내역</span>
            </button>
          </div>
        </div>

        {/* 보강 알람 피드 리스트 */}
        {recentBookingLogs.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-[18px] bg-black/[0.02] border border-dashed border-black/[0.08] text-[#86868b] space-y-1.5">
            <p className="text-xs font-bold text-[#1d1d1f]">
              최근 신청된 보강 알람이 없습니다.
            </p>
            <p className="text-[11px] text-[#86868b]">
              학부모가 빈 시간에 보강/특강을 예약하면 실시간으로 이곳에 알람이 피드됩니다.
            </p>
          </div>
        ) : (
          <div className={`space-y-2 ${isExpanded ? 'max-h-[460px] overflow-y-auto pr-1' : ''}`}>
            {displayedLogs.map((log) => {
              const relativeTime = getRelativeTime(log.createdAt, log.timestamp);
              const isRead =
                readBookingIds.includes(log.id) ||
                (log.bookingId ? readBookingIds.includes(log.bookingId) : false);

              return (
                <div
                  key={log.id}
                  onClick={() => handleCardClick(log)}
                  className={`p-3 rounded-[16px] border flex items-start gap-3 text-xs transition-all cursor-pointer group ${
                    !isRead
                      ? 'bg-[#ff3b30]/[0.04] border-[#ff3b30]/25 shadow-xs hover:border-[#ff3b30]/50 hover:bg-[#ff3b30]/[0.07]'
                      : 'bg-black/[0.02] border-black/[0.04] hover:bg-[#0071e3]/[0.04] hover:border-[#0071e3]/30'
                  }`}
                  title={!isRead ? '클릭 시 확인 알람으로 변경됩니다' : '확인 완료된 보강 알람입니다'}
                >
                  <div className="mt-0.5 shrink-0">
                    {isRead ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-[#ff3b30]/15 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#ff3b30] animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`leading-relaxed ${!isRead ? 'text-[#1d1d1f] font-bold' : 'text-[#48484a] font-medium'}`}>
                        {log.message}
                      </p>
                      {!isRead ? (
                        <span className="text-[10px] font-bold bg-[#ff3b30]/15 text-[#ff3b30] px-2 py-0.5 rounded-full border border-[#ff3b30]/25 shrink-0 animate-pulse">
                          미확인 알람
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-[#34c759]/15 text-[#34c759] px-2 py-0.5 rounded-full border border-[#34c759]/25 flex items-center gap-0.5 shrink-0">
                          <Check className="w-3 h-3 text-[#34c759]" />
                          <span>확인 알람</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markBookingAsRead(log.id);
                        if (log.bookingId) markBookingAsRead(log.bookingId);
                        handleJumpToTimetable(log);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#0071e3] hover:text-[#0077ed] hover:underline cursor-pointer transition-colors"
                      title="시간표의 해당 예약 위치로 바로 이동합니다"
                    >
                      <Calendar className="w-3 h-3 text-[#0071e3]" />
                      <span>시간표 이동</span>
                      <ArrowRight className="w-3 h-3 text-[#0071e3]" />
                    </button>
                  </div>
                  <span
                    className="text-[10px] text-[#86868b] shrink-0 font-medium cursor-help"
                    title={log.createdAt ? formatFullDateTime(log.createdAt) : log.timestamp}
                  >
                    {relativeTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 인라인 더보기 / 접기 컨트롤 버튼 */}
        {recentBookingLogs.length > 5 && (
          <div className="pt-1">
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full py-2.5 rounded-[14px] bg-black/[0.03] hover:bg-[#ff9500]/10 border border-dashed border-black/[0.08] hover:border-[#ff9500]/30 text-xs font-bold text-[#86868b] hover:text-[#ff9500] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] group cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 text-[#86868b] group-hover:text-[#ff9500] transition-colors" />
                <span>
                  보강 알람 더보기 ({recentBookingLogs.length - 5}개 남음)
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-full py-2.5 rounded-[14px] bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.06] text-xs font-bold text-[#86868b] hover:text-[#1d1d1f] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
                <span>간략히 접기 (최신 5개만 표시)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 전체 알림 피드 상세 모달 (Apple Sheet) */}
      {isAllLogsModalOpen && (
        <div className="no-print fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white/95 backdrop-blur-2xl w-full max-w-2xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.01] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[14px] bg-[#0071e3] text-white shadow-sm">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1d1d1f]">
                      알림 전체 내역
                    </h3>
                    <span className="text-xs font-semibold bg-[#0071e3]/10 text-[#0071e3] px-2.5 py-0.5 rounded-full border border-[#0071e3]/20">
                      총 {sortedLogs.length}건
                    </span>
                  </div>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    보강 예약, 취소 및 원장실 전체 알림 기록을 확인합니다. (2개월 지난 알람 자동 삭제)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllLogsModalOpen(false)}
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 필터 탭 & 검색바 */}
            <div className="p-4 border-b border-black/[0.05] bg-white/60 space-y-3 shrink-0">
              {/* 카테고리 필터 탭: 전체, 보강예약, 예약취소 3개 (전체가 기본값) */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: `전체 (${logCounts.all})` },
                  { key: 'booking', label: `보강예약 (${logCounts.booking})` },
                  { key: 'cancel', label: `예약취소 (${logCounts.cancel})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setModalFilterType(tab.key as any)}
                    className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                      modalFilterType === tab.key
                        ? 'bg-[#0071e3] text-white shadow-xs'
                        : 'bg-black/[0.04] text-[#86868b] hover:bg-black/[0.08] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 검색 입력창 */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="학생 이름이나 내용 검색 (예: 김민준, 박서연, 15:00)"
                  className="w-full pl-9 pr-8 py-2 rounded-[14px] bg-black/[0.04] border border-black/[0.04] text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 로그 목록 본문 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modalFilteredLogs.length === 0 ? (
                <div className="py-12 text-center text-[#86868b] space-y-2">
                  <div className="w-12 h-12 rounded-[16px] bg-black/[0.04] flex items-center justify-center mx-auto text-[#86868b]">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-[#86868b]">
                    {searchQuery ? `'${searchQuery}' 검색 조건에 맞는 피드가 없습니다.` : '해당 카테고리의 피드가 없습니다.'}
                  </p>
                </div>
              ) : (
                modalFilteredLogs.map((log) => {
                  const isAbsence = log.type === 'absence';
                  const isBooking = log.type === 'booking';
                  const isCancel = log.type === 'cancel';
                  const isTicket = log.type === 'ticket';
                  const relativeTime = getRelativeTime(log.createdAt, log.timestamp);
                  const fullTime = log.createdAt ? formatFullDateTime(log.createdAt) : log.timestamp;

                  // 배지 라벨 및 색상
                  let badgeLabel = '관리';
                  let badgeClass = 'bg-black/[0.05] text-[#1d1d1f] border-black/[0.05]';
                  if (isBooking) {
                    badgeLabel = '보강';
                    badgeClass = 'bg-[#34c759]/15 text-[#34c759] border-[#34c759]/25';
                  } else if (isAbsence) {
                    badgeLabel = '결석';
                    badgeClass = 'bg-[#ff9500]/15 text-[#ff9500] border-[#ff9500]/25';
                  } else if (isCancel) {
                    badgeLabel = '취소';
                    badgeClass = 'bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/25';
                  } else if (isTicket) {
                    badgeLabel = '보강권';
                    badgeClass = 'bg-[#0071e3]/15 text-[#0071e3] border-[#0071e3]/25';
                  }

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-[16px] bg-black/[0.02] hover:bg-black/[0.04] border border-black/[0.04] flex items-start gap-3 text-xs transition-colors"
                    >
                      <div className="mt-0.5 shrink-0">
                        {isAbsence && <span className="text-base">👻</span>}
                        {isBooking && <CheckCircle2 className="w-4 h-4 text-[#34c759]" />}
                        {isCancel && <XCircle className="w-4 h-4 text-[#ff3b30]" />}
                        {isTicket && <Ticket className="w-4 h-4 text-[#0071e3]" />}
                        {!isAbsence && !isBooking && !isCancel && !isTicket && (
                          <Clock className="w-4 h-4 text-[#86868b]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          {log.studentName && (
                            <span className="text-[11px] font-bold text-[#1d1d1f]">
                              {log.studentName}
                            </span>
                          )}
                          <span className="text-[10px] text-[#86868b] font-medium ml-auto">
                            {relativeTime} · {fullTime}
                          </span>
                        </div>
                        <p className="text-[#1d1d1f] font-medium leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-black/[0.05] bg-black/[0.01] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#86868b]">
                표시 중: {modalFilteredLogs.length}건 / 전체 {sortedLogs.length}건
              </span>
              <button
                type="button"
                onClick={() => setIsAllLogsModalOpen(false)}
                className="px-4 py-2 rounded-[14px] text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
