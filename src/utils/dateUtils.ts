import { DayOfWeek } from '../types';

export const TIME_SLOTS: string[] = [
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
];

export const DAY_NAMES: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

export const DAY_FULL_NAMES: Record<number, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
};

// 다음 30분 슬롯 계산
export function getNextSlotTime(time: string): string | null {
  const index = TIME_SLOTS.indexOf(time);
  if (index >= 0 && index < TIME_SLOTS.length - 1) {
    return TIME_SLOTS[index + 1];
  }
  return null;
}

// 종료 시간 문자열 계산 (예: 13:00 + 30m -> 13:30, 13:00 + 60m -> 14:00)
export function getEndTime(startTime: string, durationMinutes: number = 30): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// YYYY-MM-DD 형식으로 포맷
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// "2026-10-19" -> Date 객체
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// YYYY-MM-DD -> 요일 (1=Mon, ..., 5=Fri, 0=Sun, 6=Sat)
export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

// 특정 날짜가 속한 주의 월요일 날짜 구하기
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // 일요일(0)이면 -6일, 월요일(1)이면 0일, 화요일(2)이면 -1일...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 특정 주의 월~금 5일 목록 반환
export function getWeekdays(monday: Date): { dateStr: string; dayOfWeek: DayOfWeek; dayNum: number; month: number }[] {
  const list = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayOfWeek = (i + 1) as DayOfWeek;
    list.push({
      dateStr: formatDate(d),
      dayOfWeek,
      dayNum: d.getDate(),
      month: d.getMonth() + 1,
    });
  }
  return list;
}

// 이번 주 & 다음 주 평일 10일 목록 (하위 호환용)
export function getTwoWeeksDays(baseDate: Date): { dateStr: string; dayOfWeek: DayOfWeek; label: string; isThisWeek: boolean }[] {
  const mondayThisWeek = getMondayOfWeek(baseDate);
  const result: { dateStr: string; dayOfWeek: DayOfWeek; label: string; isThisWeek: boolean }[] = [];

  // 이번 주 월~금
  for (let i = 0; i < 5; i++) {
    const d = new Date(mondayThisWeek);
    d.setDate(mondayThisWeek.getDate() + i);
    result.push({
      dateStr: formatDate(d),
      dayOfWeek: (i + 1) as DayOfWeek,
      label: `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[(i + 1) as DayOfWeek]})`,
      isThisWeek: true,
    });
  }

  // 다음 주 월~금
  const mondayNextWeek = new Date(mondayThisWeek);
  mondayNextWeek.setDate(mondayThisWeek.getDate() + 7);
  for (let i = 0; i < 5; i++) {
    const d = new Date(mondayNextWeek);
    d.setDate(mondayNextWeek.getDate() + i);
    result.push({
      dateStr: formatDate(d),
      dayOfWeek: (i + 1) as DayOfWeek,
      label: `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[(i + 1) as DayOfWeek]})`,
      isThisWeek: false,
    });
  }

  return result;
}

export interface WeekDayItem {
  dateStr: string;
  dayOfWeek: DayOfWeek;
  dayNum: number;
  month: number;
  label: string;
}

export interface WeekStructure {
  weekIndex: number; // 0, 1, 2, 3
  weekLabel: string; // '1주차', '2주차', '3주차', '4주차'
  rangeText: string; // '10.12 ~ 16'
  startDateStr: string;
  endDateStr: string;
  days: WeekDayItem[];
}

// 4주간 주차별 구조화된 데이터 반환 (지정된 시작일 기준 5일 평일 순환)
export function getFourWeeksStructure(startDate: Date): WeekStructure[] {
  // 만약 주말(토=6, 일=0)이면 다음 월요일로 자동 보정
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  if (start.getDay() === 6) { // 토
    start.setDate(start.getDate() + 2);
  } else if (start.getDay() === 0) { // 일
    start.setDate(start.getDate() + 1);
  }

  // 1주차, 2주차, 3주차, 4주차
  const weekLabels = ['1주차', '2주차', '3주차', '4주차'];
  const weeks: WeekStructure[] = [];

  let currentPointer = new Date(start);

  for (let w = 0; w < 4; w++) {
    const days: WeekDayItem[] = [];

    while (days.length < 5) {
      const dayOfWeek = currentPointer.getDay();
      // 평일(월=1 ~ 금=5)만 추가
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push({
          dateStr: formatDate(currentPointer),
          dayOfWeek: dayOfWeek as DayOfWeek,
          dayNum: currentPointer.getDate(),
          month: currentPointer.getMonth() + 1,
          label: `${currentPointer.getMonth() + 1}/${currentPointer.getDate()} (${DAY_NAMES[dayOfWeek as DayOfWeek]})`,
        });
      }
      currentPointer.setDate(currentPointer.getDate() + 1);
    }

    const startMonth = days[0].month;
    const startDay = days[0].dayNum;
    const endMonth = days[4].month;
    const endDay = days[4].dayNum;
    const rangeText =
      startMonth === endMonth
        ? `${startMonth}.${startDay} ~ ${endDay}`
        : `${startMonth}.${startDay} ~ ${endMonth}.${endDay}`;

    weeks.push({
      weekIndex: w,
      weekLabel: weekLabels[w],
      rangeText,
      startDateStr: days[0].dateStr,
      endDateStr: days[4].dateStr,
      days,
    });
  }

  return weeks;
}

// 4주간 평일 20일 전체 목록 (일정 관리 탭용)
export function getFourWeeksDays(baseDate: Date): { dateStr: string; dayOfWeek: DayOfWeek; label: string; weekIndex: number }[] {
  const weeks = getFourWeeksStructure(baseDate);
  const result: { dateStr: string; dayOfWeek: DayOfWeek; label: string; weekIndex: number }[] = [];
  weeks.forEach((w) => {
    w.days.forEach((d) => {
      result.push({
        dateStr: d.dateStr,
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        weekIndex: w.weekIndex,
      });
    });
  });
  return result;
}

// 날짜가 오늘인지 검사 (당일 취소 제한용)
export function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}

// 날짜가 과거인지 검사
export function isPastDate(dateStr: string, todayStr: string): boolean {
  return dateStr < todayStr;
}

// 한국어 날짜 친화적 표현 (예: "10월 22일(목) 15:00")
export function formatKoreanDateTime(dateStr: string, timeStr: string): string {
  const date = parseDate(dateStr);
  const dayName = DAY_NAMES[date.getDay() as DayOfWeek] || '';
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${dayName}) ${timeStr}`;
}

// 상대 시간 표시 헬퍼 (예: "방금 전", "5분 전", "2시간 전", "10월 18일")
export function getRelativeTime(createdAt?: string, fallback = '방금 전'): string {
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

// 정확한 일시 표시 헬퍼 (예: "2026.10.18 20:40")
export function formatFullDateTime(createdAt?: string, fallback = ''): string {
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

