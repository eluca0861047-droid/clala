import { Student, SlotLock, Booking, ActivityLog, AbsenceRecord } from '../types';
import { getMondayOfWeek, formatDate, getWeekdays } from './dateUtils';

export function getInitialSeedData(referenceDate: Date = new Date()) {
  const monday = getMondayOfWeek(referenceDate);
  const weekdays = getWeekdays(monday);

  // weekdays[0] = 월, [1] = 화, [2] = 수, [3] = 목, [4] = 금
  const monStr = weekdays[0].dateStr;
  const tueStr = weekdays[1].dateStr;
  const wedStr = weekdays[2].dateStr;
  const thuStr = weekdays[3].dateStr;
  const friStr = weekdays[4].dateStr;

  const students: Student[] = [
    {
      id: 'student-1',
      name: '김민준',
      grade: '초2',
      phone: '010-3456-7890',
      makeupTickets: 0,
      regularSlots: [
        { dayOfWeek: 1, time: '15:00' }, // 월 15:00 (1명 배정 -> 학부모 예약가능)
        { dayOfWeek: 3, time: '15:00' }, // 수 15:00 (사전 결석 신청됨 -> 빈 시간 오픈)
        { dayOfWeek: 5, time: '15:00' }, // 금 15:00 (1명 배정)
      ],
      avatarBg: 'bg-blue-100 text-blue-700',
      accessCode: 'mj-7k3xp',
    },
    {
      id: 'student-2',
      name: '박서연',
      grade: '초4',
      phone: '010-8765-4321',
      makeupTickets: 0,
      regularSlots: [
        { dayOfWeek: 2, time: '16:30' }, // 화 16:30 (최하은과 동시간 2명 배정 -> 학부모 마감 테스트용!)
        { dayOfWeek: 4, time: '16:30' }, // 목 16:30 (1명 배정 -> 학부모 예약 가능)
        { dayOfWeek: 5, time: '14:00' }, // 금 14:00 (1명 배정)
      ],
      avatarBg: 'bg-rose-100 text-rose-700',
      accessCode: 'sy-9w4af',
    },
    {
      id: 'student-3',
      name: '이도윤',
      grade: '초1',
      phone: '010-9988-1122',
      makeupTickets: 0,
      regularSlots: [
        { dayOfWeek: 1, time: '13:30' }, // 월 13:30
        { dayOfWeek: 2, time: '13:30' }, // 화 13:30
        { dayOfWeek: 3, time: '13:30' }, // 수 13:30
        { dayOfWeek: 4, time: '13:30' }, // 목 13:30
      ],
      avatarBg: 'bg-emerald-100 text-emerald-700',
      accessCode: 'dy-3m8qz',
    },
    {
      id: 'student-4',
      name: '최하은',
      grade: '초3',
      phone: '010-5566-7788',
      makeupTickets: 0,
      regularSlots: [
        { dayOfWeek: 2, time: '16:30' }, // 화 16:30 (박서연과 함께 배정되어 동시간대 2명 -> 학부모 예약 불가 마감!)
        { dayOfWeek: 4, time: '14:30' }, // 목 14:30
        { dayOfWeek: 5, time: '16:30' }, // 금 16:30
      ],
      avatarBg: 'bg-purple-100 text-purple-700',
      accessCode: 'he-5v7tn',
    },
    {
      id: 'student-5',
      name: '정시우',
      grade: '초5',
      phone: '010-2233-4455',
      makeupTickets: 0,
      regularSlots: [
        { dayOfWeek: 3, time: '14:00' }, // 수 14:00
        { dayOfWeek: 5, time: '17:00' }, // 금 17:00
      ],
      avatarBg: 'bg-amber-100 text-amber-700',
      accessCode: 'su-4n2kw',
    },
  ];

  // 기본 고정 잠금 (매일 16:00 ~ 16:30 원장님 휴식 시간)
  const defaultLocks: SlotLock[] = [
    {
      id: 'lock-daily-break',
      time: '16:00',
      isRecurringDaily: true,
      reason: '원장님 고정 휴식 (Break Time)',
      createdAt: new Date().toISOString(),
    },
  ];

  // 샘플 예약 내역:
  // 이번 주 목요일 15:00에 박서연 학생의 보강 수업 1건 예약됨
  const defaultBookings: Booking[] = [
    {
      id: 'booking-seed-1',
      date: thuStr,
      time: '15:00',
      duration: 30,
      type: 'makeup',
      studentId: 'student-2',
      studentName: '박서연',
      memo: '체르니 100번 보강 연습',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    // 이번 주 수요일 17:30에 김민준 학부모 대면 상담 1건
    {
      id: 'booking-seed-2',
      date: wedStr,
      time: '17:30',
      duration: 30,
      type: 'counseling',
      counselingType: 'in_person',
      studentId: 'student-1',
      studentName: '김민준',
      memo: '하반기 콩쿠르 출전 상담',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  // 결석 샘플: 이번 주 수요일 15:00 김민준 학생이 사전 결석 신청한 상황
  // 수요일 15:00가 '빈 시간(결석: 김민준)'으로 오픈되는 비즈니스 로직을 즉시 확인 가능하게 함
  const defaultAbsences: AbsenceRecord[] = [
    {
      id: 'absence-seed-1',
      studentId: 'student-1',
      studentName: '김민준',
      date: wedStr,
      time: '15:00',
      reason: '학교 학예회 일정으로 인한 사전 결석',
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ];

  const now = Date.now();
  const defaultLogs: ActivityLog[] = [
    {
      id: 'log-1',
      type: 'absence',
      message: `김민준 학생이 [${wedStr} 15:00] 정규 수업 결석을 신청했습니다. (동시간대 인원 감소로 슬롯 오픈)`,
      timestamp: '2시간 전',
      studentName: '김민준',
      createdAt: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: 'log-2',
      type: 'booking',
      message: `박서연 학생이 [${thuStr} 15:00] 보강 수업을 예약했습니다.`,
      timestamp: '5시간 전',
      studentName: '박서연',
      createdAt: new Date(now - 3600000 * 5).toISOString(),
    },
    {
      id: 'log-3',
      type: 'booking',
      message: `김민준 학부모님이 [${wedStr} 17:30] 대면 상담을 예약했습니다.`,
      timestamp: '1일 전',
      studentName: '김민준',
      createdAt: new Date(now - 3600000 * 24).toISOString(),
    },
    {
      id: 'log-4',
      type: 'admin',
      message: `[원장님 직권] 이도윤 학생을 [${monStr} 14:00] 보강 수업에 배정했습니다.`,
      timestamp: '2일 전',
      studentName: '이도윤',
      createdAt: new Date(now - 3600000 * 48).toISOString(),
    },
    {
      id: 'log-5',
      type: 'admin',
      message: `[원장님] [${friStr} 16:00] 슬롯을 잠갔습니다. (학원 정기 조율 및 방역)`,
      timestamp: '3일 전',
      createdAt: new Date(now - 3600000 * 72).toISOString(),
    },
    {
      id: 'log-6',
      type: 'booking',
      message: `최유진 학생이 [${tueStr} 15:30] 60분 심화 특강 예약을 완료했습니다.`,
      timestamp: '4일 전',
      studentName: '최유진',
      createdAt: new Date(now - 3600000 * 96).toISOString(),
    },
  ];

  return {
    students,
    locks: defaultLocks,
    bookings: defaultBookings,
    absences: defaultAbsences,
    logs: defaultLogs,
  };
}
