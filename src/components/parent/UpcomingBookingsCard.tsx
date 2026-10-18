import React, { useState, useMemo } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { Booking } from '../../types';
import { parseDate, DAY_NAMES } from '../../utils/dateUtils';
import {
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';

export const UpcomingBookingsCard: React.FC = () => {
  const { currentStudent, bookings, simulatedToday } = useReservation();

  // 지난 일정 보기 토글 상태
  const [showPastHistory, setShowPastHistory] = useState(false);

  // 현재 학생의 전체 예약 목록
  const studentBookings = useMemo(() => {
    if (!currentStudent) return [];
    return bookings.filter((b) => b.studentId === currentStudent.id);
  }, [bookings, currentStudent]);

  // 1. 다가오는 예약 (오늘 및 미래 일정: date >= simulatedToday)
  const upcomingBookings = useMemo(() => {
    return studentBookings
      .filter((b) => b.date >= simulatedToday)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [studentBookings, simulatedToday]);

  // 2. 지난 예약 (날짜가 지난 일정: date < simulatedToday)
  const pastBookings = useMemo(() => {
    return studentBookings
      .filter((b) => b.date < simulatedToday)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [studentBookings, simulatedToday]);

  if (!currentStudent) return null;

  // D-Day 계산 함수
  const getDDayInfo = (dateStr: string) => {
    const today = new Date(`${simulatedToday}T00:00:00`).getTime();
    const target = new Date(`${dateStr}T00:00:00`).getTime();
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        label: 'D-Day (오늘)',
        badgeStyle: 'bg-red-500/10 text-red-600 border-red-500/20 font-bold',
        isToday: true,
      };
    } else if (diffDays === 1) {
      return {
        label: 'D-1 (내일)',
        badgeStyle: 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold',
        isToday: false,
      };
    } else {
      return {
        label: `D-${diffDays}`,
        badgeStyle: 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20 font-semibold',
        isToday: false,
      };
    }
  };

  // 날짜 한국어 포맷 (예: 10월 22일(목))
  const formatKoreanDate = (dateStr: string) => {
    const d = parseDate(dateStr);
    const dayOfWeek = d.getDay();
    return `${d.getMonth() + 1}월 ${d.getDate()}일(${DAY_NAMES[dayOfWeek] || ''})`;
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'makeup':
        return '보강 (30분)';
      case 'special':
        return '특강 (60분)';
      case 'counseling':
        return '상담 (30분)';
      default:
        return '보강';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4 transition-all">
        {/* 상단 타이틀 바 */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">
              나의 다가오는 보강 일정
            </h3>
          </div>
          {upcomingBookings.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0071e3] text-white shadow-xs">
              {upcomingBookings.length}건 예약됨
            </span>
          )}
        </div>

        {/* 1. 다가오는 일정 목록 */}
        <div className="pt-3">
          {upcomingBookings.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs font-medium text-[#86868b]">
                현재 예약된 다가오는 보강 일정이 없습니다.
              </p>
              <p className="text-[11px] text-[#86868b]/80 mt-1">
                아래 달력에서 원하는 날짜를 선택하여 보강을 신청해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBookings.map((booking) => {
                const dDay = getDDayInfo(booking.date);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-[18px] bg-black/[0.02] border border-black/[0.05] hover:bg-black/[0.03] transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* D-Day 뱃지 */}
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-xl border shrink-0 leading-tight ${dDay.badgeStyle}`}
                      >
                        {dDay.label}
                      </span>

                      {/* 일시 및 정보 */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-[#1d1d1f]">
                            {formatKoreanDate(booking.date)}
                          </span>
                          <span className="text-sm font-extrabold text-[#0071e3]">
                            {booking.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#86868b]">
                          <span className="font-semibold text-[#424245]">
                            {getTypeName(booking.type)}
                          </span>
                          {booking.memo && (
                            <span className="truncate max-w-[120px] text-[11px]">
                              · {booking.memo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 예약 상태 뱃지 (예약 취소 버튼 제거) */}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 shrink-0">
                      예약 완료
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 지난 보강 이력 (날짜가 지난 완료 일정 아코디언) */}
        {pastBookings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/[0.05]">
            <button
              type="button"
              onClick={() => setShowPastHistory((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs text-[#86868b] hover:text-[#1d1d1f] font-medium py-1 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>지난 보강 완료 이력 ({pastBookings.length}건)</span>
              </div>
              {showPastHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showPastHistory && (
              <div className="mt-2.5 space-y-2 animate-in fade-in duration-150">
                {pastBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-[14px] bg-black/[0.015] border border-black/[0.03] text-xs text-[#86868b]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#424245]">
                        {formatKoreanDate(b.date)} {b.time}
                      </span>
                      <span>· {getTypeName(b.type)}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] text-[#86868b]">
                      수업 완료
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
  );
};
