import React, { useState, useMemo, useEffect } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { CalculatedSlot } from '../../types';
import {
  TIME_SLOTS,
  DAY_NAMES,
  getMondayOfWeek,
  getWeekdays,
  parseDate,
} from '../../utils/dateUtils';
import { SlotDetailModal } from './SlotDetailModal';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Calendar,
  Printer,
} from 'lucide-react';

export const WeeklyTimetable: React.FC = () => {
  const { getSlot, simulatedToday, adminHomeTimestamp, addToast, focusedTimetableSlot } = useReservation();

  // 주간 시간표 인쇄 / PDF 저장 핸들러
  const handlePrint = () => {
    addToast(
      'info',
      '시간표 인쇄 준비',
      '인쇄 대화상자가 열립니다. [A4 가로(Landscape)] 및 [배경 그래픽 포함] 옵션을 설정하시면 가장 선명하게 출력됩니다.'
    );
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // 현재 표시할 주의 월요일 상태
  const todayMonday = useMemo(() => getMondayOfWeek(parseDate(simulatedToday)), [simulatedToday]);
  const [currentMonday, setCurrentMonday] = useState<Date>(todayMonday);

  // 선택된 슬롯 (모달용)
  const [selectedSlot, setSelectedSlot] = useState<CalculatedSlot | null>(null);

  // 강조 표시할 슬롯 키 (예: "2026-10-21-15:00")
  const [highlightedSlotKey, setHighlightedSlotKey] = useState<string | null>(null);

  // 기준 오늘 날짜 변경 시 현재 표시 주차 자동 동기화
  useEffect(() => {
    setCurrentMonday(todayMonday);
  }, [todayMonday]);

  // 로고 클릭으로 관리자 최초 화면으로 돌아올 때 이번 주 및 모달 초기화
  useEffect(() => {
    if (adminHomeTimestamp > 0) {
      setCurrentMonday(todayMonday);
      setSelectedSlot(null);
    }
  }, [adminHomeTimestamp, todayMonday]);

  // focusedTimetableSlot이 전달되면 해당 주차로 이동하고 해당 시간 슬롯으로 부드럽게 스크롤 & 강조 펄스
  useEffect(() => {
    if (!focusedTimetableSlot || !focusedTimetableSlot.date || !focusedTimetableSlot.time) return;

    const { date, time } = focusedTimetableSlot;

    // 1. 해당 날짜가 속한 주의 월요일로 시간표 전환
    try {
      const targetMonday = getMondayOfWeek(parseDate(date));
      setCurrentMonday(targetMonday);
    } catch (e) {
      console.error('Invalid date for focused slot:', date, e);
    }

    const slotKey = `${date}-${time}`;
    setHighlightedSlotKey(slotKey);

    // 2. DOM 렌더링 완료 후 해당 슬롯 위치로 화면 정중앙 부드러운 스크롤 이동
    const scrollToTargetCell = () => {
      const cellEl = document.getElementById(`slot-cell-${date}-${time}`);
      if (cellEl) {
        cellEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        return true;
      }
      return false;
    };

    // 1차 시도 (150ms 후)
    const timer1 = setTimeout(() => {
      if (!scrollToTargetCell()) {
        // 주차 전환으로 재렌더링 중일 경우 2차 재시도 (250ms 후)
        const timer2 = setTimeout(scrollToTargetCell, 250);
        return () => clearTimeout(timer2);
      }
    }, 150);

    // 3. 5초 후 강조 효과 자동 종료
    const clearTimer = setTimeout(() => {
      setHighlightedSlotKey(null);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(clearTimer);
    };
  }, [focusedTimetableSlot]);

  // 주간 이동 핸들러
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  const handleThisWeek = () => {
    setCurrentMonday(todayMonday);
  };

  // 월~금 5일 날짜 객체 목록
  const weekdays = useMemo(() => getWeekdays(currentMonday), [currentMonday]);

  // 주차 헤더 타이틀 (예: 2026년 10월 3주차 (10.19 ~ 10.23))
  const weekTitle = useMemo(() => {
    const start = weekdays[0];
    const end = weekdays[4];
    return `${start.month}월 ${start.dayNum}일(월) ~ ${end.month}월 ${end.dayNum}일(금)`;
  }, [weekdays]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.06] space-y-5 print:rounded-none print:p-0 print:border-none print:shadow-none print:space-y-0 print:m-0 print:overflow-hidden">
      {/* 🖨️ 인쇄 전용 공식 헤더 (화면에서는 숨김, A4 가로 1페이지 인쇄/PDF 저장 시 최상단 표시) */}
      <div className="hidden print:block mb-1 pb-1 border-b border-slate-800">
        <div className="flex items-center justify-between leading-tight">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="숙명클라라피아노" className="w-5 h-5 object-contain" />
            <h1 className="text-sm font-black text-slate-900 tracking-tight">
              숙명클라라피아노 주간 레슨 시간표
            </h1>
            <span className="text-[10px] font-bold text-indigo-700 ml-2">
              ({weekTitle})
            </span>
            <span className="text-[9px] text-slate-500">
              · 월~금 13:00~19:00 (최대 정원 4인)
            </span>
          </div>
          <div className="text-right text-[9px] text-slate-500 leading-none">
            출력일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })} · 숙명클라라피아노 원장실
          </div>
        </div>

        {/* 인쇄용 범례 요약 인라인 바 */}
        <div className="flex items-center gap-3 mt-1 pt-0.5 border-t border-slate-200 text-[8px] font-bold leading-none">
          <span className="text-slate-500">범례:</span>
          <span className="inline-flex items-center gap-1 text-blue-800">
            <span className="w-2 h-2 rounded bg-blue-500 inline-block"></span> 정규수업
          </span>
          <span className="inline-flex items-center gap-1 text-amber-800">
            <span className="w-2 h-2 rounded bg-amber-500 inline-block"></span> 보강/특강
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-800">
            <span className="w-2 h-2 rounded bg-emerald-500 inline-block"></span> 상담
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span className="w-2 h-2 rounded bg-slate-400 inline-block"></span> 잠금/휴식
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700 ml-1">
            [0~1명: 학부모 예약가능]
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            [2~4명: 마감/만석]
          </span>
          <span className="text-slate-400 ml-auto">
            ※ 동시간대 1명 이하 시 학부모 보강 신청 오픈
          </span>
        </div>
      </div>

      {/* 주간 네비게이션 & 범례 (화면용: 인쇄 시 숨김 - Apple Bar) */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-black/[0.05]">
        {/* 주간 이동 버튼 & 인쇄 버튼 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-black/[0.04] p-1 rounded-[16px] border border-black/[0.03]">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-[12px] hover:bg-white text-[#1d1d1f] transition-all shadow-none hover:shadow-xs active:scale-95"
              title="이전 주"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleThisWeek}
              className="px-3 py-1 text-xs font-bold text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
            >
              이번 주
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-[12px] hover:bg-white text-[#1d1d1f] transition-all shadow-none hover:shadow-xs active:scale-95"
              title="다음 주"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0071e3]" />
            <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight">{weekTitle}</h3>
          </div>

          {/* 주간 시간표 인쇄 / PDF 출력 버튼 (Apple Primary Button) */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[14px] text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition-all active:scale-95 ml-1 sm:ml-2"
            title="현재 주차 시간표 인쇄 또는 PDF로 저장"
          >
            <Printer className="w-4 h-4" />
            <span>시간표 인쇄 / PDF</span>
          </button>
        </div>

        {/* 상태 범례 (Legend) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-500 shrink-0"></span>
            <span className="text-[#86868b]">정규</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0"></span>
            <span className="text-[#86868b]">보강/특강</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0"></span>
            <span className="text-[#86868b]">상담</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-400 shrink-0"></span>
            <span className="text-[#86868b]">잠금</span>
          </div>
        </div>
      </div>

      {/* 타임테이블 그리드 테이블 */}
      <div className="overflow-x-auto -mx-2 sm:mx-0 print:overflow-hidden print:mx-0 print:w-full print:p-0 print:m-0">
        <div className="min-w-[840px] print:min-w-0 print:w-full">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] print:grid-cols-[48px_repeat(5,1fr)] gap-2 print:gap-1 mb-2 print:mb-0.5 font-bold text-center">
            <div className="py-2.5 print:py-0 print:h-[6.5mm] text-xs print:text-[10px] text-[#86868b] print:text-slate-700 flex items-center justify-center font-bold">
              시간
            </div>
            {weekdays.map((day) => {
              const isToday = day.dateStr === simulatedToday;
              return (
                <div
                  key={day.dateStr}
                  className={`py-2 px-3 print:py-0 print:px-1 print:h-[6.5mm] rounded-[16px] print:rounded flex flex-col print:flex-row items-center justify-center print:gap-1 border transition-all print:shadow-none ${
                    isToday
                      ? 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#0071e3] font-bold shadow-xs print:bg-indigo-50 print:border-indigo-400'
                      : 'bg-black/[0.02] border-black/[0.05] text-[#1d1d1f] print:border-slate-300'
                  }`}
                >
                  <span className={`text-[11px] print:text-[10px] ${isToday ? 'text-[#0071e3] font-bold' : 'text-[#86868b]'}`}>
                    {DAY_NAMES[day.dayOfWeek]}요일
                  </span>
                  <span className="text-sm print:text-[10px] font-bold mt-0.5 print:mt-0">
                    ({day.month}.{day.dayNum})
                  </span>
                  {isToday && (
                    <span className="text-[9px] print:text-[7px] bg-[#0071e3] text-white px-2 py-0.2 print:px-1 print:py-0 rounded-full font-bold mt-0.5 print:mt-0 print:bg-indigo-700">
                      오늘
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 슬롯 행 리스트 (13:00 ~ 18:30, 12개 행) */}
          <div className="space-y-2 print:space-y-0.5">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="grid grid-cols-[80px_repeat(5,1fr)] print:grid-cols-[48px_repeat(5,1fr)] gap-2 print:gap-1 print:break-inside-avoid print:page-break-inside-avoid"
              >
                {/* 세로 시간 레이블 */}
                <div className="min-h-[72px] sm:min-h-[76px] print:min-h-0 print:h-[12.8mm] flex flex-col items-center justify-center text-xs sm:text-[13px] print:text-[10px] font-extrabold text-slate-700 bg-slate-50/70 print:bg-slate-100 rounded-2xl print:rounded border border-slate-100 print:border-slate-300">
                  <span>{time}</span>
                </div>

                {/* 5개 요일별 슬롯 셀 */}
                {weekdays.map((day) => {
                  const slot = getSlot(day.dateStr, time);
                  const isLocked = slot.status === 'LOCKED';
                  const isEmpty = slot.currentCount === 0 && !isLocked;

                  // 셀에 배정된 모든 학생 목록 구성 (정규 + 보강/특강/상담)
                  const allAssigned = [
                    ...slot.activeRegularStudents.map((st) => ({
                      id: `reg-${st.id}`,
                      name: st.name,
                      label: '정규',
                      bg: 'bg-blue-500 print:border-blue-700',
                    })),
                    ...slot.activeBookings.map(({ booking, isSpecialSecondHalf }) => {
                      const isCounseling = booking.type === 'counseling';
                      const isSpecial = booking.type === 'special';
                      const bg = isCounseling
                        ? 'bg-emerald-500 print:border-emerald-700'
                        : 'bg-amber-500 print:border-amber-700';
                      const label = isCounseling
                        ? '상담'
                        : isSpecial
                        ? (isSpecialSecondHalf ? '특강2' : '특강')
                        : '보강';
                      return {
                        id: `booking-${booking.id}`,
                        name: booking.studentName,
                        label,
                        bg,
                      };
                    }),
                  ];

                  const isHighlighted = highlightedSlotKey === `${day.dateStr}-${time}`;

                  // 셀 배경 스타일 결정
                  let cellBg = '';
                  if (isHighlighted) {
                    cellBg = 'ring-4 ring-[#ff9500] ring-offset-2 ring-offset-white shadow-[0_0_24px_rgba(255,149,0,0.6)] z-20 scale-[1.03] animate-pulse bg-amber-50/95 border-[#ff9500] text-slate-800';
                  } else if (isLocked) {
                    cellBg = 'bg-slate-100/90 border border-slate-300 hover:bg-slate-200/90 text-slate-600';
                  } else if (isEmpty) {
                    cellBg = 'bg-white hover:bg-indigo-50/40 border border-dashed border-slate-300 hover:border-indigo-400 text-slate-600 shadow-2xs';
                  } else if (slot.isAvailableForParent) {
                    // 1명 배정 (학부모 예약 가능 상태)
                    cellBg = 'bg-emerald-50/30 hover:bg-emerald-50/70 border border-emerald-200 hover:border-emerald-400 text-slate-800 shadow-2xs';
                  } else if (slot.isFull) {
                    // 4명 만석
                    cellBg = 'bg-rose-50/30 hover:bg-rose-50/60 border border-rose-200 hover:border-rose-400 text-slate-800 shadow-2xs';
                  } else {
                    // 2~3명 (학부모 예약 마감, 원장님 직권 배정은 가능)
                    cellBg = 'bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-slate-800 shadow-2xs';
                  }

                  return (
                    <button
                      key={`${day.dateStr}-${time}`}
                      id={`slot-cell-${day.dateStr}-${time}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`relative min-h-[72px] sm:min-h-[76px] print:min-h-0 print:h-[12.8mm] p-1.5 sm:p-2 print:p-0.5 rounded-2xl print:rounded flex flex-col justify-between text-left transition-all active:scale-98 overflow-hidden group print:overflow-hidden print:transform-none print:shadow-none print:border-slate-300 ${cellBg}`}
                    >
                      {/* 시간표 포커싱 강조 뱃지 */}
                      {isHighlighted && (
                        <div className="absolute top-1 right-1 z-30 flex items-center gap-0.5 bg-[#ff9500] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce pointer-events-none">
                          <span>👈</span>
                          <span>예약 위치</span>
                        </div>
                      )}

                      {/* 상단: 인원 카운트 및 학부모 가용성 뱃지 */}
                      <div className="flex items-center justify-between w-full mb-1 print:mb-0 leading-none">
                        <div className="flex items-center gap-1">
                          {isLocked ? (
                            <span className="text-[10px] print:text-[8px] font-bold text-slate-600 flex items-center gap-0.5">
                              <Lock className="w-3 h-3 print:w-2 print:h-2 text-slate-500 shrink-0" />
                              <span>잠금</span>
                            </span>
                          ) : (
                            <span className={`text-[10px] sm:text-[11px] print:text-[8px] font-black ${
                              slot.isFull ? 'text-rose-600' :
                              slot.currentCount >= 2 ? 'text-amber-700' :
                              slot.currentCount === 1 ? 'text-indigo-600' :
                              'text-slate-500'
                            }`}>
                              {slot.currentCount}/4명
                            </span>
                          )}
                        </div>

                        {/* 우측 학부모 상태 뱃지 */}
                        {!isLocked && (
                          slot.isAvailableForParent ? (
                            <span className="text-[9px] print:text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 print:px-1 print:py-0 rounded border border-emerald-200 shrink-0 print:border-emerald-400 leading-tight">
                              예약가능
                            </span>
                          ) : (
                            <span className={`text-[9px] print:text-[7px] font-bold px-1.5 py-0.2 print:px-1 print:py-0 rounded shrink-0 border leading-tight ${
                              slot.isFull
                                ? 'text-rose-700 bg-rose-50 border-rose-200 print:border-rose-400'
                                : 'text-slate-600 bg-slate-100 border-slate-200 print:border-slate-300'
                            }`}>
                              {slot.isFull ? '만석' : '마감'}
                            </span>
                          )
                        )}
                      </div>

                      {/* 중단/하단: 배정된 학생 목록 (4명까지 초소형 2열 압축 그리드) 또는 빈 시간 안내 */}
                      {isLocked ? (
                        <div className="my-auto py-1 print:py-0">
                          <p className="text-[10px] print:text-[8px] font-bold text-slate-600 truncate leading-none">
                            {slot.lockInfo?.reason || '휴식'}
                          </p>
                          <p className="text-[9px] text-slate-400 print:hidden">클릭하여 잠금 해제</p>
                        </div>
                      ) : isEmpty ? (
                        <div className="my-auto flex flex-col items-center justify-center py-1 print:py-0 text-slate-400 group-hover:text-indigo-600 print:text-slate-300">
                          <div className="flex items-center gap-1 text-[11px] font-bold print:hidden">
                            <Plus className="w-3.5 h-3.5" />
                            <span>빈 시간</span>
                          </div>
                          <span className="hidden print:inline text-[8px] text-slate-300 font-normal leading-none">
                            -
                          </span>
                          {slot.absenceRecords.length > 0 && (
                            <span className="text-[9px] print:text-[7px] text-amber-700 font-bold bg-amber-50 px-1 rounded mt-0.5 print:mt-0 print:bg-white print:border print:border-amber-300 leading-none">
                              👻 {slot.absenceRecords[0].studentName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 print:gap-0.5 w-full my-auto py-0.5 print:py-0">
                          {/* 배정된 원생 리스트: 4명이어도 2열 그리드로 최대 2줄만 차지 */}
                          {allAssigned.map((st) => {
                            // 1명일 때만 전체 너비(col-span-2)
                            // 2명 이상(2명, 3명, 4명)일 때는 모든 학생이 균일하게 동일한 1열(col-span-1) 크기로 표시되어
                            // 3번째 학생(박서연)도 1번째 학생(김땡큐)과 완전히 동일한 크기로 단정하게 배치됩니다.
                            const isColSpan2 = allAssigned.length === 1;

                            return (
                              <div
                                key={st.id}
                                className={`${
                                  isColSpan2 ? 'col-span-2' : 'col-span-1'
                                } text-[10px] print:text-[8px] font-bold ${
                                  st.bg
                                } text-white px-1.5 py-0.5 print:py-0 print:px-1 rounded-lg print:rounded-sm flex items-center justify-between shadow-2xs print:shadow-none leading-tight min-w-0`}
                                title={`${st.name} (${st.label})`}
                              >
                                <span className="truncate">{st.name}</span>
                                <span className="text-[8px] sm:text-[9px] print:text-[7px] opacity-85 shrink-0 ml-0.5 font-normal">
                                  {st.label}
                                </span>
                              </div>
                            );
                          })}

                          {/* 사전 결석 흔적 표시 (하단 전체 너비) */}
                          {slot.absenceRecords.map((a) => (
                            <div
                              key={a.id}
                              className="col-span-2 text-[9px] print:text-[7px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 print:py-0 rounded truncate flex items-center gap-0.5 leading-tight print:bg-white print:border-amber-300"
                              title={`결석: ${a.studentName}`}
                            >
                              <span>👻</span>
                              <span className="truncate">결석: {a.studentName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 슬롯 클릭 시 제어/배정/잠금 모달 */}
      <SlotDetailModal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        slot={selectedSlot}
      />
    </div>
  );
};
