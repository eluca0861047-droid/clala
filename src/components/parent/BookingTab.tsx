import React, { useState, useMemo, useEffect } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { DayOfWeek } from '../../types';
import {
  TIME_SLOTS,
  parseDate,
  DAY_NAMES,
  getFourWeeksStructure,
} from '../../utils/dateUtils';
import { BookingConfirmModal } from './BookingConfirmModal';
import {
  Calendar,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const BookingTab: React.FC = () => {
  const {
    currentStudent,
    getSlot,
    getAvailableCountForDay,
    simulatedToday,
    bookingStartDate,
    setBookingStartDate,
    appMode,
  } = useReservation();

  // 원장님이 지정한 1주차 처음 시작일 기준으로 4주간 주차별 구조화된 데이터 생성
  const startDateObj = useMemo(() => {
    const raw = bookingStartDate || simulatedToday;
    return parseDate(raw);
  }, [bookingStartDate, simulatedToday]);

  const fourWeeks = useMemo(() => getFourWeeksStructure(startDateObj), [startDateObj]);

  // 현재 선택된 주차 인덱스 (0: 1주차, 1: 2주차, 2: 3주차, 3: 4주차)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

  // 선택된 날짜 (기본값: 오늘 또는 1주차 첫날)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const allDays = fourWeeks.flatMap((w) => w.days);
    const found = allDays.find((d) => d.dateStr === simulatedToday);
    return found ? found.dateStr : fourWeeks[0]?.days[0]?.dateStr || '';
  });

  // 선택된 타임 슬롯
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 예약 모달 오픈 여부
  const [isModalOpen, setIsModalOpen] = useState(false);

  const duration = 30; // 30분 단위 수업 예약

  // 현재 활성화된 주의 5일 데이터
  const currentWeek = fourWeeks[selectedWeekIndex] || fourWeeks[0];

  // 요일 범위 텍스트 (예: 월~금, 수~화 등 시작일에 따라 자동 계산)
  const firstDayName = DAY_NAMES[currentWeek.days[0]?.dayOfWeek || 1];
  const lastDayName = DAY_NAMES[currentWeek.days[4]?.dayOfWeek || 5];
  const dateSectionTitle = `날짜 선택 (${firstDayName}~${lastDayName})`;

  // 오늘 날짜(simulatedToday) 또는 시작일 변경 시 선택 날짜 자동 동기화
  useEffect(() => {
    const allDays = fourWeeks.flatMap((w) => w.days);
    const found = allDays.find((d) => d.dateStr === simulatedToday);
    if (found) {
      setSelectedDate(found.dateStr);
    } else if (fourWeeks[0]?.days[0]?.dateStr) {
      setSelectedDate(fourWeeks[0].days[0].dateStr);
    }
  }, [simulatedToday, fourWeeks]);

  // 만약 선택된 날짜가 다른 주차로 바뀔 때 주차 인덱스 동기화 (예: 리셋 또는 외부 변경 시)
  useEffect(() => {
    const targetWeekIdx = fourWeeks.findIndex((w) =>
      w.days.some((d) => d.dateStr === selectedDate)
    );
    if (targetWeekIdx !== -1 && targetWeekIdx !== selectedWeekIndex) {
      setSelectedWeekIndex(targetWeekIdx);
    }
  }, [selectedDate, fourWeeks]);

  // 주차 탭 클릭 핸들러
  const handleSelectWeek = (weekIdx: number) => {
    setSelectedWeekIndex(weekIdx);
    setSelectedTime(null);
    const targetWeek = fourWeeks[weekIdx];
    if (!targetWeek) return;

    // 만약 이미 선택된 날짜가 해당 주에 속해 있다면 유지, 없으면 해당 주의 첫 날로 이동
    const hasSelectedDate = targetWeek.days.some((d) => d.dateStr === selectedDate);
    if (!hasSelectedDate) {
      // 빈 슬롯이 있는 첫 날을 우선 선택, 없으면 월요일 선택
      const dayWithSlots = targetWeek.days.find((d) => getAvailableCountForDay(d.dateStr) > 0);
      setSelectedDate(dayWithSlots ? dayWithSlots.dateStr : targetWeek.days[0].dateStr);
    }
  };

  // 선택된 날짜의 슬롯 리스트 계산
  const currentDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    return TIME_SLOTS.map((time) => {
      const slot = getSlot(selectedDate, time);

      // 본인 수업 여부 확인
      const isMyRegular = slot.activeRegularStudents.some((s) => s.id === currentStudent?.id);
      const isMyBooking = slot.activeBookings.some((b) => b.booking.studentId === currentStudent?.id);
      const isMine = isMyRegular || isMyBooking;

      // 학부모 예약 가능 여부: 동시간대 수업 인원이 1명 이하(0명 또는 1명)이고 본인 수업이 아님
      const isSelectable = slot.isAvailableForParent && !isMine;

      return {
        ...slot,
        isSelectable,
        isMine,
      };
    });
  }, [selectedDate, getSlot, currentStudent]);

  const displaySlots = currentDaySlots;


  const handleSlotClick = (time: string, isSelectable: boolean) => {
    if (!isSelectable) return;
    setSelectedTime(time);
  };

  const handleOpenConfirm = () => {
    if (!selectedTime) return;
    setIsModalOpen(true);
  };

  const parsedSelectedDay = selectedDate ? parseDate(selectedDate) : null;
  const selectedDayIndex = parsedSelectedDay ? ((parsedSelectedDay.getDay() || 1) as DayOfWeek) : 1;

  return (
    <div className="space-y-4 pb-20">
      {/* 4주간 날짜 선택기 (주차 탭 + 5열 원터치 그리드) - Apple Continuous Card */}
      <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.06] space-y-3.5">
        {/* 상단 타이틀 & 원장님 제어 */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
            <Calendar className="w-4 h-4 text-[#0071e3]" />
            <span>{dateSectionTitle}</span>
          </div>

          {/* 원장님 관리자 모드일 때 학부모 화면에서도 1주차 시작일 직접 변경 가능 */}
          {appMode === 'admin' && (
            <div className="flex items-center gap-1.5 bg-black/[0.04] px-2 py-0.5 rounded-xl border border-black/[0.04]">
              <span className="text-[10px] text-[#86868b] font-medium">1주차 시작:</span>
              <input
                type="date"
                value={bookingStartDate}
                onChange={(e) => setBookingStartDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-[#0071e3] focus:outline-none cursor-pointer"
                title="원장님 권한: 1주차 처음 시작일 변경"
              />
            </div>
          )}
        </div>

        {/* 1. 주차 선택 탭 (4열 Apple Segmented Pill) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-black/[0.04] rounded-[18px] border border-black/[0.02]">
          {fourWeeks.map((week) => {
            const isSelectedWeek = selectedWeekIndex === week.weekIndex;
            return (
              <button
                key={week.weekIndex}
                type="button"
                onClick={() => handleSelectWeek(week.weekIndex)}
                className={`py-2 px-1 rounded-[14px] text-center transition-all ${
                  isSelectedWeek
                    ? 'bg-white text-[#1d1d1f] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <span className="block text-xs font-bold leading-tight">{week.weekLabel}</span>
                <span
                  className={`block text-[10px] mt-0.5 leading-tight ${
                    isSelectedWeek ? 'text-[#0071e3] font-medium' : 'text-[#86868b]'
                  }`}
                >
                  {week.rangeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. 해당 주의 5일(월~금) 원터치 5열 카드 그리드 */}
        <div className="grid grid-cols-5 gap-1.5 pt-0.5">
          {currentWeek.days.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const count = getAvailableCountForDay(day.dateStr);
            const hasSlots = count > 0;
            const isToday = day.dateStr === simulatedToday;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(day.dateStr);
                  setSelectedTime(null);
                }}
                className={`py-2.5 px-0.5 rounded-[18px] border flex flex-col items-center justify-center transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3] font-bold shadow-sm ring-1 ring-[#0071e3]'
                    : 'border-black/[0.06] bg-white/70 hover:bg-white text-[#1d1d1f]'
                }`}
              >
                {/* 요일명 */}
                <span
                  className={`text-[10px] font-semibold ${
                    isSelected ? 'text-[#0071e3]' : 'text-[#86868b]'
                  }`}
                >
                  {DAY_NAMES[day.dayOfWeek]}요일
                </span>

                {/* 일자 */}
                <span className="text-sm font-bold mt-0.5 leading-tight">
                  {day.dayNum}일
                </span>

                {/* 오늘 표시 or 빈 슬롯 개수 뱃지 */}
                <div className="mt-1 flex flex-col items-center gap-0.5">
                  {isToday && (
                    <span className="text-[9px] font-bold text-[#0071e3] bg-[#0071e3]/15 px-1.5 py-0.2 rounded-full leading-none mb-0.5">
                      오늘
                    </span>
                  )}
                  {hasSlots ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-[#34c759] bg-[#34c759]/15 px-1.5 py-0.2 rounded-full border border-[#34c759]/25">
                      {count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#86868b] font-normal">
                      마감
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 선택 일자 헤더 */}
      <div className="px-1">
        <span className="text-xs font-bold text-[#1d1d1f]">
          {parsedSelectedDay &&
            `${parsedSelectedDay.getMonth() + 1}월 ${parsedSelectedDay.getDate()}일 (${
              DAY_NAMES[selectedDayIndex] || ''
            })`}
        </span>
      </div>

      {/* 4. 30분 단위 타임 슬롯 그리드 (Apple Time Chips) - 3열 배치 */}
      <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.06]">
        {displaySlots.length === 0 ? (
          <div className="py-12 text-center text-[#86868b] text-xs">
            시간표 정보가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {displaySlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const isAvailable = slot.isSelectable;
              const isMine = slot.isMine;

              let buttonStyle = '';
              let badgeText = '';

              if (isSelected) {
                // 사용자가 선택한 슬롯 (Apple System Blue)
                buttonStyle =
                  'border border-[#0071e3] bg-[#0071e3] text-white shadow-[0_4px_14px_rgba(0,113,227,0.35)] scale-[1.02]';
                badgeText = '선택됨';
              } else if (isMine) {
                // 본인의 수업
                buttonStyle =
                  'border border-[#0071e3]/30 bg-[#0071e3]/[0.08] text-[#0071e3] cursor-not-allowed';
                badgeText = '내 수업';
              } else if (isAvailable) {
                // 예약 가능 빈 슬롯
                buttonStyle =
                  'border border-black/[0.08] bg-white hover:bg-[#0071e3]/[0.05] hover:border-[#0071e3] text-[#1d1d1f] font-bold active:scale-[0.98] shadow-xs';
                badgeText = '예약 가능';
              } else {
                // 마감 슬롯
                buttonStyle =
                  'border border-black/[0.04] bg-black/[0.03] text-[#86868b] cursor-not-allowed opacity-75';
                badgeText = '마감';
              }

              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleSlotClick(slot.time, isAvailable)}
                  className={`py-3 px-2 rounded-[18px] flex flex-col items-center justify-center transition-all ${buttonStyle}`}
                >
                  <span className="text-sm font-bold tracking-tight">{slot.time}</span>
                  <span
                    className={`text-[10px] mt-1 font-semibold ${
                      isSelected
                        ? 'text-white/90'
                        : isMine
                        ? 'text-[#0071e3]'
                        : isAvailable
                        ? 'text-[#0071e3]'
                        : 'text-[#86868b]'
                    }`}
                  >
                    {badgeText}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 플로팅 예약 확정 바 (Apple Frosted Glass) */}
      {selectedTime && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/85 backdrop-blur-2xl border-t border-black/[0.08] z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#86868b] font-medium">선택된 시간</p>
              <p className="text-sm font-bold text-[#1d1d1f]">
                {parsedSelectedDay &&
                  `${parsedSelectedDay.getMonth() + 1}월 ${parsedSelectedDay.getDate()}일(${
                    DAY_NAMES[selectedDayIndex] || ''
                  })`}{' '}
                {selectedTime}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenConfirm}
              className="py-3 px-6 rounded-[18px] font-semibold text-sm bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all flex items-center gap-1.5"
            >
              <span>예약 확정하기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 예약 확정 모달 */}
      {selectedTime && (
        <BookingConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          time={selectedTime}
          type="makeup"
          duration={30}
          onSuccess={() => {
            setSelectedTime(null);
          }}
        />
      )}
    </div>
  );
};
