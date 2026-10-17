import React, { useState, useMemo } from 'react';
import { useReservation } from '../../context/ReservationContext';
import {
  parseDate,
  getMondayOfWeek,
  getWeekdays,
} from '../../utils/dateUtils';
import {
  CalendarDays,
  Sparkles,
  Ticket,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  History,
  Search,
  X,
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
    bookings,
    getSlotsForDay,
    simulatedToday,
    logs,
  } = useReservation();

  // 최신 이벤트가 항상 맨 상단에 오도록 createdAt/ID 기준 내림차순 정렬
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
  // 피드 알림 기본값을 '보강/특강'('booking')으로 설정
  const [cardCategory, setCardCategory] = useState<'booking' | 'absence' | 'all' | 'admin'>('booking');
  const [filterType, setFilterType] = useState<'all' | 'booking' | 'absence' | 'cancel' | 'admin'>('booking');
  const [searchQuery, setSearchQuery] = useState('');

  // 오늘 총 수업 수 계산 (오늘의 정규 수업 + 보강/특강 예약)
  const todayClassCount = useMemo(() => {
    const slots = getSlotsForDay(simulatedToday);
    let count = 0;
    slots.forEach((s) => {
      if (s.status === 'REGULAR') count++;
      if (s.status === 'BOOKED' && !s.isSpecialSecondHalf && s.booking?.type !== 'counseling') {
        count++;
      }
    });
    return count;
  }, [getSlotsForDay, simulatedToday]);

  // 이번 주 보강/특강 및 상담 통계 계산
  const todayMonday = useMemo(() => getMondayOfWeek(parseDate(simulatedToday)), [simulatedToday]);
  const weekdays = useMemo(() => getWeekdays(todayMonday), [todayMonday]);
  const weekDateStrs = useMemo(() => new Set(weekdays.map((w) => w.dateStr)), [weekdays]);

  const { thisWeekMakeups, totalCounselings } = useMemo(() => {
    let makeups = 0;
    let counselings = 0;

    bookings.forEach((b) => {
      if (b.type === 'counseling') {
        counselings++;
      }
      if (weekDateStrs.has(b.date) && (b.type === 'makeup' || b.type === 'special')) {
        makeups++;
      }
    });

    return { thisWeekMakeups: makeups, totalCounselings: counselings };
  }, [bookings, weekDateStrs]);

  // 모달 내 필터링된 로그 목록
  const modalFilteredLogs = useMemo(() => {
    return sortedLogs.filter((log) => {
      // 1. 타입 필터
      if (filterType !== 'all') {
        if (filterType === 'booking' && log.type !== 'booking') return false;
        if (filterType === 'absence' && log.type !== 'absence') return false;
        if (filterType === 'cancel' && log.type !== 'cancel') return false;
        if (filterType === 'admin' && log.type !== 'admin' && log.type !== 'ticket') return false;
      }
      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchMessage = log.message.toLowerCase().includes(query);
        const matchStudent = log.studentName ? log.studentName.toLowerCase().includes(query) : false;
        return matchMessage || matchStudent;
      }
      return true;
    });
  }, [sortedLogs, filterType, searchQuery]);

  // 각 카테고리별 개수 카운트
  const logCounts = useMemo(() => {
    return {
      all: sortedLogs.length,
      booking: sortedLogs.filter((l) => l.type === 'booking').length,
      absence: sortedLogs.filter((l) => l.type === 'absence').length,
      cancel: sortedLogs.filter((l) => l.type === 'cancel').length,
      admin: sortedLogs.filter((l) => l.type === 'admin' || l.type === 'ticket').length,
    };
  }, [sortedLogs]);

  // 카드에 직접 표시할 로그 목록 필터링 (기본값: 'booking' 보강/특강)
  const cardFilteredLogs = useMemo(() => {
    return sortedLogs.filter((log) => {
      if (cardCategory === 'booking') return log.type === 'booking';
      if (cardCategory === 'absence') return log.type === 'absence';
      if (cardCategory === 'admin') return log.type === 'admin' || log.type === 'ticket';
      return true; // 'all'
    });
  }, [sortedLogs, cardCategory]);

  // 카드에 직접 표시할 로그 목록 (접힌 상태: 4개, 펼친 상태: 전체)
  const displayedLogs = isExpanded ? cardFilteredLogs : cardFilteredLogs.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 1. 상단 통계 카드 3종 (Apple Continuous Squircle Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 카드 1: 오늘 총 수업 수 */}
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-[16px] bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0 shadow-xs">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#86868b]">오늘 진행 수업</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-[#1d1d1f] tracking-tight">{todayClassCount}</span>
              <span className="text-xs font-semibold text-[#86868b]">회</span>
            </div>
            <p className="text-[10px] text-[#0071e3] font-medium mt-0.5">정규 + 보강/특강 포함</p>
          </div>
        </div>

        {/* 카드 2: 이번 주 보강/특강 신청 */}
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-[16px] bg-[#ff9500]/10 text-[#ff9500] flex items-center justify-center shrink-0 shadow-xs">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#86868b]">이번 주 보강/특강</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-[#ff9500] tracking-tight">{thisWeekMakeups}</span>
              <span className="text-xs font-semibold text-[#86868b]">건</span>
            </div>
            <p className="text-[10px] text-[#ff9500] font-medium mt-0.5">빈 시간 자동 순환 매칭</p>
          </div>
        </div>

        {/* 카드 3: 학부모 상담 예약 */}
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-[16px] bg-[#34c759]/10 text-[#34c759] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#86868b]">신청된 상담 일정</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-[#34c759] tracking-tight">{totalCounselings}</span>
              <span className="text-xs font-semibold text-[#86868b]">건</span>
            </div>
            <p className="text-[10px] text-[#34c759] font-medium mt-0.5">대면 및 전화 상담</p>
          </div>
        </div>
      </div>

      {/* 2. 최근 실시간 알림 로그 목록 */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
        {/* 헤더 바 */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[8px] bg-[#ff9500]/10 text-[#ff9500] flex items-center justify-center shadow-xs">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f]">최근 학부모 실시간 알림 피드</h4>
            <span className="text-[11px] font-semibold bg-[#ff9500]/15 text-[#ff9500] px-2.5 py-0.5 rounded-full border border-[#ff9500]/25">
              {cardCategory === 'booking'
                ? `보강/특강 ${logCounts.booking}건`
                : cardCategory === 'absence'
                ? `결석 ${logCounts.absence}건`
                : cardCategory === 'admin'
                ? `관리 ${logCounts.admin}건`
                : `총 ${sortedLogs.length}건`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#86868b] hidden sm:inline">최신순 자동 정렬</span>
            <button
              type="button"
              onClick={() => setIsAllLogsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold bg-black/[0.05] hover:bg-[#0071e3]/10 text-[#1d1d1f] hover:text-[#0071e3] border border-black/[0.04] transition-all active:scale-95"
              title="전체 알림 피드 검색 및 상세 내역 보기"
            >
              <History className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>전체 피드 모달</span>
            </button>
          </div>
        </div>

        {/* 카테고리 필터 탭 바 (Apple Segmented Style - 기본값: ⭐ 보강/특강) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 border-b border-black/[0.05] pb-2.5">
          {[
            { key: 'booking', label: '⭐ 보강/특강', count: logCounts.booking, activeCls: 'bg-[#ff9500] text-white font-bold shadow-xs' },
            { key: 'absence', label: '👻 결석 신청', count: logCounts.absence, activeCls: 'bg-[#af52de] text-white font-bold shadow-xs' },
            { key: 'all', label: '📋 전체 알림', count: logCounts.all, activeCls: 'bg-[#0071e3] text-white font-bold shadow-xs' },
            { key: 'admin', label: '🔒 원장실 관리', count: logCounts.admin, activeCls: 'bg-[#1d1d1f] text-white font-bold shadow-xs' },
          ].map((tab) => {
            const isActive = cardCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setCardCategory(tab.key as any);
                  setIsExpanded(false);
                }}
                className={`px-3 py-1.5 rounded-[12px] text-xs transition-all flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? tab.activeCls
                    : 'bg-black/[0.04] text-[#86868b] hover:bg-black/[0.08] hover:text-[#1d1d1f] font-semibold'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-black/[0.06] text-[#86868b]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 피드 리스트 (Apple Inset Grouped Items) */}
        {cardFilteredLogs.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-[18px] bg-black/[0.02] border border-dashed border-black/[0.08] text-[#86868b] space-y-1.5">
            <p className="text-xs font-bold text-[#1d1d1f]">
              {cardCategory === 'booking'
                ? '최근 신청된 보강/특강 피드가 없습니다.'
                : '해당 카테고리의 알림이 없습니다.'}
            </p>
            <p className="text-[11px] text-[#86868b]">
              {cardCategory === 'booking'
                ? '학부모가 빈 시간에 보강/특강을 예약하면 실시간으로 이곳에 최우선 표시됩니다.'
                : '새로운 이벤트가 발생하면 실시간으로 피드에 기록됩니다.'}
            </p>
            {cardCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setCardCategory('all')}
                className="mt-2 text-xs font-bold text-[#0071e3] hover:underline inline-block"
              >
                전체 알림 피드 확인하기
              </button>
            )}
          </div>
        ) : (
          <div className={`space-y-2 ${isExpanded ? 'max-h-[460px] overflow-y-auto pr-1' : ''}`}>
            {displayedLogs.map((log, index) => {
              const isAbsence = log.type === 'absence';
              const isBooking = log.type === 'booking';
              const isCancel = log.type === 'cancel';
              const isTicket = log.type === 'ticket';
              const relativeTime = getRelativeTime(log.createdAt, log.timestamp);
              
              // 최근 10분 이내이거나 최상단 1번째 항목이면 NEW 배지 표시
              const isRecentNew = log.createdAt 
                ? (Date.now() - new Date(log.createdAt).getTime() < 10 * 60 * 1000)
                : index === 0;

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-[16px] border flex items-start gap-3 text-xs transition-all ${
                    isRecentNew
                      ? 'bg-[#ff9500]/[0.08] border-[#ff9500]/25 shadow-xs'
                      : 'bg-black/[0.02] border-black/[0.04] hover:bg-black/[0.04]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isAbsence && <span className="text-sm">👻</span>}
                    {isBooking && <CheckCircle2 className="w-4 h-4 text-[#34c759]" />}
                    {isCancel && <XCircle className="w-4 h-4 text-[#ff3b30]" />}
                    {isTicket && <Ticket className="w-4 h-4 text-[#ff9500]" />}
                    {!isAbsence && !isBooking && !isCancel && !isTicket && (
                      <Clock className="w-4 h-4 text-[#0071e3]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[#1d1d1f] font-medium leading-relaxed">{log.message}</p>
                      {isRecentNew && (
                        <span className="text-[9px] font-bold bg-[#ff9500] text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
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
        {cardFilteredLogs.length > 4 && (
          <div className="pt-1">
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full py-2.5 rounded-[14px] bg-black/[0.03] hover:bg-[#ff9500]/10 border border-dashed border-black/[0.08] hover:border-[#ff9500]/30 text-xs font-bold text-[#86868b] hover:text-[#ff9500] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] group"
              >
                <ChevronDown className="w-4 h-4 text-[#86868b] group-hover:text-[#ff9500] transition-colors" />
                <span>
                  못 본 {cardCategory === 'booking' ? '보강/특강' : ''} 피드 더보기 ({cardFilteredLogs.length - 4}개 남음)
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-full py-2.5 rounded-[14px] bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.06] text-xs font-bold text-[#86868b] hover:text-[#1d1d1f] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
              >
                <ChevronUp className="w-4 h-4" />
                <span>간략히 접기 (최신 4개만 표시)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. 전체 알림 피드 상세 모달 (Apple Sheet) */}
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
                      학부모 실시간 알림 피드 전체 내역
                    </h3>
                    <span className="text-xs font-semibold bg-[#0071e3]/10 text-[#0071e3] px-2.5 py-0.5 rounded-full border border-[#0071e3]/20">
                      총 {sortedLogs.length}건
                    </span>
                  </div>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    학부모의 모든 예약, 결석 신청, 취소 및 원장실 직권 배정 기록을 최신순으로 확인합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllLogsModalOpen(false)}
                className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 필터 탭 & 검색바 */}
            <div className="p-4 border-b border-black/[0.05] bg-white/60 space-y-3 shrink-0">
              {/* 카테고리 필터 탭 */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: `전체 (${logCounts.all})` },
                  { key: 'booking', label: `보강/특강 (${logCounts.booking})` },
                  { key: 'absence', label: `결석 신청 (${logCounts.absence})` },
                  { key: 'cancel', label: `예약 취소 (${logCounts.cancel})` },
                  { key: 'admin', label: `원장실 관리 (${logCounts.admin})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterType(tab.key as any)}
                    className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all ${
                      filterType === tab.key
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
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
                    badgeLabel = '예약';
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
                className="px-4 py-2 rounded-[14px] text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-xs active:scale-95"
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
