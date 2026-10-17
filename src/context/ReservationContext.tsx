import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Student,
  Booking,
  AbsenceRecord,
  SlotLock,
  ActivityLog,
  CalculatedSlot,
  DayOfWeek,
  BookingType,
  CounselingType,
  SlotStatusType,
} from '../types';
import {
  TIME_SLOTS,
  getNextSlotTime,
  parseDate,
  formatDate,
  getMondayOfWeek,
  getWeekdays,
} from '../utils/dateUtils';
import { getInitialSeedData } from '../utils/seedData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface ReservationContextType {
  // Mode & Student State
  appMode: 'parent' | 'admin';
  setAppMode: (mode: 'parent' | 'admin') => void;
  currentStudentId: string;
  setCurrentStudentId: (id: string) => void;
  currentStudent: Student | undefined;

  // Virtual Date Simulation
  simulatedToday: string;
  setSimulatedToday: (dateStr: string) => void;

  // Direct Parent Access Link Mode (Security Guard)
  isParentDirectLink: boolean;
  getStudentShareUrl: (student: Student) => string;
  exitParentDirectMode: () => void;
  
  // Base Data
  students: Student[];
  bookings: Booking[];
  absences: AbsenceRecord[];
  locks: SlotLock[];
  logs: ActivityLog[];

  // Slot Calculation & Inspection
  getSlot: (dateStr: string, timeStr: string) => CalculatedSlot;
  getSlotsForDay: (dateStr: string) => CalculatedSlot[];
  getAvailableCountForDay: (dateStr: string, is60MinSpecial?: boolean) => number;
  
  // Actions
  createBooking: (params: {
    studentId: string;
    date: string;
    time: string;
    type: BookingType;
    duration: 30 | 60;
    counselingType?: CounselingType;
    memo?: string;
    isAdmin?: boolean;
  }) => { success: boolean; error?: string };

  cancelBooking: (bookingId: string, isAdmin?: boolean) => { success: boolean; error?: string };

  requestAbsence: (params: {
    studentId: string;
    date: string;
    time: string;
    reason?: string;
  }) => { success: boolean; error?: string };

  cancelAbsence: (absenceId: string) => { success: boolean; error?: string };

  // Admin Actions
  toggleSlotLock: (params: { date?: string; time: string; reason?: string }) => void;
  adjustTickets: (studentId: string, delta: number) => void;
  addRegularSlot: (studentId: string, dayOfWeek: DayOfWeek, time: string) => { success: boolean; error?: string };
  removeRegularSlot: (studentId: string, dayOfWeek: DayOfWeek, time: string) => void;
  createStudent: (name: string, grade: string, phone: string) => void;
  deleteStudent: (studentId: string) => void;

  // Reset & Toast
  resetData: () => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Admin Navigation
  adminTab: 'timetable' | 'students';
  setAdminTab: (tab: 'timetable' | 'students') => void;
  adminHomeTimestamp: number;
  goToAdminHome: () => void;
}

const STORAGE_KEYS = {
  STUDENTS: 'pianoslot_students_v1',
  BOOKINGS: 'pianoslot_bookings_v1',
  ABSENCES: 'pianoslot_absences_v1',
  LOCKS: 'pianoslot_locks_v1',
  LOGS: 'pianoslot_logs_v1',
  CURRENT_STUDENT: 'pianoslot_current_student_v1',
  APP_MODE: 'pianoslot_app_mode_v1',
  SIMULATED_TODAY: 'pianoslot_simulated_today_v1',
};

const ReservationContext = createContext<ReservationContextType | null>(null);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Reference date calculation
  const defaultMonday = useMemo(() => getMondayOfWeek(new Date()), []);
  const initialSeed = useMemo(() => getInitialSeedData(new Date()), []);
  // 접속한 실제 오늘 날짜 (YYYY-MM-DD)
  const defaultTodayStr = useMemo(() => {
    return formatDate(new Date());
  }, []);

  // States with LocalStorage Initialization
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : initialSeed.students;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return saved ? JSON.parse(saved) : initialSeed.bookings;
  });

  const [absences, setAbsences] = useState<AbsenceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ABSENCES);
    return saved ? JSON.parse(saved) : initialSeed.absences;
  });

  const [locks, setLocks] = useState<SlotLock[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCKS);
    return saved ? JSON.parse(saved) : initialSeed.locks;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : initialSeed.logs;
  });

  // Direct Parent Access Link Detection (URL Query: ?student=... or ?code=...)
  const [isParentDirectLink, setIsParentDirectLink] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('student') || params.has('code');
  });

  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const studentParam = params.get('student');
      const codeParam = params.get('code');

      if (studentParam) {
        return studentParam;
      }
      if (codeParam) {
        const found = initialSeed.students.find(s => s.accessCode === codeParam);
        if (found) return found.id;
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    return saved || 'student-1';
  });

  const [appMode, setAppMode] = useState<'parent' | 'admin'>((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('student') || params.has('code')) {
        return 'parent'; // 학부모 전용 링크로 들어오면 무조건 학부모 모드로 고정
      }
      if (params.get('mode') === 'admin') {
        return 'admin';
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.APP_MODE);
    return (saved as 'parent' | 'admin') || 'parent';
  }));

  const [simulatedToday, setSimulatedToday] = useState<string>(() => {
    // 이전 세션에 남아있던 고정된 옛날 날짜 정리
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SIMULATED_TODAY);
      const sessionSaved = sessionStorage.getItem('pianoslot_simulated_today_v1');
      if (sessionSaved) return sessionSaved;
    }
    // 접속한 날짜가 기본 오늘 날짜가 되도록 실제 오늘 날짜로 초기화
    return formatDate(new Date());
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [adminTab, setAdminTab] = useState<'timetable' | 'students'>('timetable');
  const [adminHomeTimestamp, setAdminHomeTimestamp] = useState<number>(0);

  // 학생별 고유 카카오톡 전용 링크 생성 헬퍼
  const getStudentShareUrl = useCallback((student: Student): string => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const code = student.accessCode || student.id;
    return `${origin}${pathname}?student=${student.id}&code=${code}`;
  }, []);

  // 학부모 전용 링크로 접속한 경우 관리자 모드로 전환 차단하는 보안 래퍼
  const setAppModeSecure = useCallback(
    (mode: 'parent' | 'admin') => {
      if (isParentDirectLink && mode === 'admin') {
        return;
      }
      setAppMode(mode);
    },
    [isParentDirectLink]
  );

  // 학부모 전용 링크 모드에서 데모/관리자 모드로 돌아가기
  const exitParentDirectMode = useCallback(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('student');
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url.toString());
    setIsParentDirectLink(false);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absences));
  }, [absences]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCKS, JSON.stringify(locks));
  }, [locks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, currentStudentId);
  }, [currentStudentId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APP_MODE, appMode);
  }, [appMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pianoslot_simulated_today_v1', simulatedToday);
    }
  }, [simulatedToday]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 원장님 관리자 최초 페이지로 이동 (원장님 모드일 때만 동작)
  const goToAdminHome = useCallback(() => {
    if (appMode !== 'admin') return;
    setAdminTab('timetable');
    setAdminHomeTimestamp(Date.now());
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    addToast('info', '원장님 관리자 첫 화면', '주간 타임테이블 첫 화면으로 이동했습니다.');
  }, [appMode, addToast]);

  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === currentStudentId) || students[0];
  }, [students, currentStudentId]);

  /**
   * 핵심 슬롯 상태 및 정원(최대 4명) 판별 함수
   */
  const getSlot = useCallback(
    (dateStr: string, timeStr: string): CalculatedSlot => {
      const parsed = parseDate(dateStr);
      const dayOfWeek = parsed.getDay() as DayOfWeek;

      // 1. 원장님 잠금 체크 (매일 고정 휴식 or 특정 날짜 잠금)
      const lock = locks.find(
        (l) =>
          l.time === timeStr &&
          (l.isRecurringDaily || l.date === dateStr)
      );

      // 2. 예약 내역 조회 (정확한 시작 시간 또는 60분 특강의 후반부 30분)
      const directBookings = bookings.filter(
        (b) => b.date === dateStr && b.time === timeStr
      );

      const prevTimeIndex = TIME_SLOTS.indexOf(timeStr) - 1;
      let specialSecondHalfBookings: Booking[] = [];
      if (prevTimeIndex >= 0) {
        const prevTime = TIME_SLOTS[prevTimeIndex];
        specialSecondHalfBookings = bookings.filter(
          (b) => b.date === dateStr && b.time === prevTime && b.duration === 60
        );
      }

      const activeBookings: { booking: Booking; isSpecialSecondHalf?: boolean }[] = [
        ...directBookings.map((b) => ({ booking: b, isSpecialSecondHalf: false })),
        ...specialSecondHalfBookings.map((b) => ({ booking: b, isSpecialSecondHalf: true })),
      ];

      // 3. 정규 고정 수업 학생 조회 (해당 요일/시간)
      const matchingRegularStudents = students.filter((s) =>
        s.regularSlots.some(
          (slot) => slot.dayOfWeek === dayOfWeek && slot.time === timeStr
        )
      );

      // 결석 신청 확인
      const absenceRecords = absences.filter(
        (a) => a.date === dateStr && a.time === timeStr
      );

      // 결석하지 않은 실제 출석 정규 학생들
      const activeRegularStudents = matchingRegularStudents.filter(
        (s) => !absenceRecords.some((a) => a.studentId === s.id)
      );

      // 4. 인원 및 정원 계산 (최대 4명)
      const currentCount = activeRegularStudents.length + activeBookings.length;
      const maxCapacity = 4;
      const isFull = currentCount >= maxCapacity;

      // 학부모 예약 가능 조건: 잠금이 아니고 동시간대 수업 인원이 0명 또는 1명일 때만!
      const isAvailableForParent = !lock && currentCount <= 1;

      // 상태 결정
      let status: SlotStatusType = 'AVAILABLE';
      if (lock) {
        status = 'LOCKED';
      } else if (activeBookings.length > 0) {
        status = 'BOOKED';
      } else if (activeRegularStudents.length > 0) {
        status = 'REGULAR';
      } else {
        status = 'AVAILABLE';
      }

      return {
        date: dateStr,
        time: timeStr,
        dayOfWeek,
        status,
        maxCapacity,
        currentCount,
        isAvailableForParent,
        isFull,
        activeRegularStudents,
        activeBookings,
        absenceRecords,
        lockInfo: lock,
        // 하위 호환 필드 (단일 학생 참조)
        booking: activeBookings[0]?.booking,
        regularStudent: activeRegularStudents[0] || matchingRegularStudents[0],
        absenceInfo: absenceRecords[0],
        isSpecialSecondHalf: activeBookings.some((b) => b.isSpecialSecondHalf),
      };
    },
    [locks, bookings, students, absences]
  );

  // 하루 전체 12개 슬롯 반환
  const getSlotsForDay = useCallback(
    (dateStr: string): CalculatedSlot[] => {
      return TIME_SLOTS.map((time) => getSlot(dateStr, time));
    },
    [getSlot]
  );

  // 특정 날짜의 학부모 예약 가능한 빈 슬롯 개수 카운트 (동시간대 인원 1명 이하)
  const getAvailableCountForDay = useCallback(
    (dateStr: string, is60MinSpecial = false): number => {
      const slots = getSlotsForDay(dateStr);
      if (!is60MinSpecial) {
        return slots.filter((s) => s.isAvailableForParent).length;
      }
      // 60분 특강인 경우: 연속된 두 슬롯이 모두 학부모 예약 가능(인원 <= 1)인 시작 슬롯 개수
      let count = 0;
      for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i].isAvailableForParent && slots[i + 1].isAvailableForParent) {
          count++;
        }
      }
      return count;
    },
    [getSlotsForDay]
  );

  /**
   * 예약 생성 (학부모 예약: 동시간대 인원 1명 이하일 때만 가능 / 원장님 직권: 최대 4명까지 배정 가능)
   */
  const createBooking = useCallback(
    (params: {
      studentId: string;
      date: string;
      time: string;
      type: BookingType;
      duration: 30 | 60;
      counselingType?: CounselingType;
      memo?: string;
      isAdmin?: boolean;
    }): { success: boolean; error?: string } => {
      const { studentId, date, time, type, duration, counselingType, memo, isAdmin = false } = params;
      const targetStudent = students.find((s) => s.id === studentId);
      if (!targetStudent) {
        return { success: false, error: '학생 정보를 찾을 수 없습니다.' };
      }

      // 첫 번째 슬롯 조회
      const firstSlot = getSlot(date, time);

      // 이미 이 시간에 해당 학생의 수업이 있는지 중복 체크
      const alreadyInFirstSlot =
        firstSlot.activeRegularStudents.some((s) => s.id === studentId) ||
        firstSlot.activeBookings.some((b) => b.booking.studentId === studentId);

      if (alreadyInFirstSlot) {
        return { success: false, error: `${targetStudent.name} 학생은 이미 해당 시간(${time})에 수업이 배정되어 있습니다.` };
      }

      // 60분 특강인 경우 다음 슬롯 확인
      let secondSlot: CalculatedSlot | null = null;
      if (duration === 60) {
        const nextTime = getNextSlotTime(time);
        if (!nextTime) {
          return { success: false, error: '특강(60분)은 마지막 타임(18:30)에 예약할 수 없습니다.' };
        }
        secondSlot = getSlot(date, nextTime);
        const alreadyInSecondSlot =
          secondSlot.activeRegularStudents.some((s) => s.id === studentId) ||
          secondSlot.activeBookings.some((b) => b.booking.studentId === studentId);
        if (alreadyInSecondSlot) {
          return { success: false, error: `${targetStudent.name} 학생은 연속 시간(${nextTime})에 이미 수업이 있습니다.` };
        }
      }

      // 가용성 및 정원 검사
      if (!isAdmin) {
        // [학부모 예약 규칙]: 동시간대 수업 인원이 1명 이하(0명 또는 1명)일 때만 예약 가능!
        if (!firstSlot.isAvailableForParent) {
          return {
            success: false,
            error: '선택하신 시간은 동시간대 예약 인원(2명 이상) 마감되었거나 예약이 불가능합니다.',
          };
        }
        if (duration === 60 && secondSlot && !secondSlot.isAvailableForParent) {
          return {
            success: false,
            error: '특강(60분)은 연속된 2개 시간대 모두 동시간대 인원 1명 이하이어야 합니다.',
          };
        }
      } else {
        // [원장님 직권 배정]: 최대 정원(4명) 미만일 때 배정 가능
        if (firstSlot.currentCount >= 4) {
          return { success: false, error: '선택하신 시간은 이미 최대 정원(4명)이 모두 찼습니다.' };
        }
        if (duration === 60 && secondSlot && secondSlot.currentCount >= 4) {
          return { success: false, error: '특강(60분)의 다음 슬롯이 이미 최대 정원(4명)입니다.' };
        }
      }

      const newBooking: Booking = {
        id: 'booking_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        studentId,
        studentName: targetStudent.name,
        date,
        time,
        duration,
        type,
        counselingType,
        memo,
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);

      // 알림 로그 추가
      const typeLabel =
        type === 'makeup'
          ? '보강 수업'
          : type === 'special'
          ? '심화 특강(60분)'
          : `원장님 상담(${counselingType === 'in_person' ? '대면' : '전화'})`;

      const newLog: ActivityLog = {
        id: 'log_' + Date.now(),
        type: 'booking',
        message: isAdmin
          ? `[원장님 직권] ${targetStudent.name} 학생을 [${date} ${time}] ${typeLabel}에 배정했습니다. (동시간대 ${firstSlot.currentCount + 1}/4명)`
          : `${targetStudent.name} 학생이 [${date} ${time}] ${typeLabel} 예약을 완료했습니다.`,
        timestamp: '방금 전',
        studentName: targetStudent.name,
        createdAt: new Date().toISOString(),
      };

      setLogs((prev) => [newLog, ...prev]);
      addToast(
        'success',
        '예약 완료',
        `${date} ${time} ${typeLabel} 예약이 확정되었습니다!`
      );

      return { success: true };
    },
    [students, getSlot, addToast]
  );

  /**
   * 예약 취소 (학부모 또는 원장님)
   */
  const cancelBooking = useCallback(
    (bookingId: string, isAdmin = false): { success: boolean; error?: string } => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        return { success: false, error: '예약 정보를 찾을 수 없습니다.' };
      }

      // 당일 취소 제한 검사 (학부모인 경우에만 엄격 적용)
      if (!isAdmin && booking.date === simulatedToday) {
        return {
          success: false,
          error:
            '당일 결석 및 예약 취소는 앱에서 불가능하오니 원장님께 직접 문의해 주세요.',
        };
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));

      const logMsg = isAdmin
        ? `[원장님 직권] ${booking.studentName} 학생의 [${booking.date} ${booking.time}] 예약이 취소되었습니다.`
        : `${booking.studentName} 학생이 [${booking.date} ${booking.time}] 예약을 취소했습니다.`;

      const newLog: ActivityLog = {
        id: 'log_' + Date.now(),
        type: 'cancel',
        message: logMsg,
        timestamp: '방금 전',
        studentName: booking.studentName,
        createdAt: new Date().toISOString(),
      };

      setLogs((prev) => [newLog, ...prev]);
      addToast(
        'info',
        '예약 취소 완료',
        `${booking.date} ${booking.time} 예약이 성공적으로 취소되었습니다.`
      );

      return { success: true };
    },
    [bookings, simulatedToday, addToast]
  );

  /**
   * 사전 결석 신청 (슬롯 빈 시간 오픈)
   */
  const requestAbsence = useCallback(
    (params: {
      studentId: string;
      date: string;
      time: string;
      reason?: string;
    }): { success: boolean; error?: string } => {
      const { studentId, date, time, reason } = params;
      const student = students.find((s) => s.id === studentId);
      if (!student) {
        return { success: false, error: '학생 정보를 찾을 수 없습니다.' };
      }

      // 당일 결석 신청 제한 안전장치
      if (date === simulatedToday) {
        return {
          success: false,
          error:
            '당일 결석은 앱에서 불가능하오니 원장님께 직접 유선 문의해 주세요.',
        };
      }

      // 이미 결석 신청되어 있는지 확인
      const alreadyAbsent = absences.some(
        (a) => a.studentId === studentId && a.date === date && a.time === time
      );
      if (alreadyAbsent) {
        return { success: false, error: '이미 결석 처리된 수업입니다.' };
      }

      const newAbsence: AbsenceRecord = {
        id: 'absence_' + Date.now(),
        studentId,
        studentName: student.name,
        date,
        time,
        reason: reason || '학부모 사전 결석 신청',
        createdAt: new Date().toISOString(),
      };

      setAbsences((prev) => [newAbsence, ...prev]);

      const newLog: ActivityLog = {
        id: 'log_' + Date.now(),
        type: 'absence',
        message: `${student.name} 학생이 [${date} ${time}] 정규 수업 결석을 신청했습니다. (해당 슬롯 오픈됨)`,
        timestamp: '방금 전',
        studentName: student.name,
        createdAt: new Date().toISOString(),
      };

      setLogs((prev) => [newLog, ...prev]);
      addToast(
        'success',
        '결석 신청 완료',
        `결석 처리가 완료되었습니다. 해당 시간이 다른 원생의 보강 시간으로 오픈되었습니다.`
      );

      return { success: true };
    },
    [students, simulatedToday, absences, addToast]
  );

  /**
   * 결석 신청 취소 (다시 본인 정규 수업 복구)
   */
  const cancelAbsence = useCallback(
    (absenceId: string): { success: boolean; error?: string } => {
      const record = absences.find((a) => a.id === absenceId);
      if (!record) {
        return { success: false, error: '결석 기록을 찾을 수 없습니다.' };
      }

      // 이미 그 시간에 다른 예약들로 인해 정원(4명)이 찼다면 결석 취소 불가
      const currentSlot = getSlot(record.date, record.time);
      if (currentSlot.currentCount >= 4) {
        return {
          success: false,
          error: '해당 시간에 이미 다른 예약으로 정원(4명)이 마감되어 결석을 취소할 수 없습니다. 원장님께 문의하세요.',
        };
      }

      setAbsences((prev) => prev.filter((a) => a.id !== absenceId));

      const newLog: ActivityLog = {
        id: 'log_' + Date.now(),
        type: 'absence',
        message: `${record.studentName} 학생의 [${record.date} ${record.time}] 결석 신청이 취소되어 정규 수업으로 복귀되었습니다.`,
        timestamp: '방금 전',
        studentName: record.studentName,
        createdAt: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      addToast('info', '결석 취소', '정규 수업으로 복귀되었습니다.');

      return { success: true };
    },
    [absences, getSlot, addToast]
  );

  /**
   * 원장님 직권 슬롯 잠금 / 해제
   */
  const toggleSlotLock = useCallback(
    (params: { date?: string; time: string; reason?: string }) => {
      const { date, time, reason } = params;

      // 이미 잠겨있는지 확인
      const existing = locks.find(
        (l) => l.time === time && (l.date === date || (date === undefined && l.isRecurringDaily))
      );

      if (existing) {
        // 잠금 해제
        setLocks((prev) => prev.filter((l) => l.id !== existing.id));
        addToast('info', '잠금 해제', `${date || '매일'} ${time} 슬롯이 오픈되었습니다.`);
        setLogs((prev) => [
          {
            id: 'log_' + Date.now(),
            type: 'admin',
            message: `[원장님] [${date || '매일'} ${time}] 슬롯 잠금을 해제했습니다.`,
            timestamp: '방금 전',
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        // 잠금 등록
        const newLock: SlotLock = {
          id: 'lock_' + Date.now(),
          date,
          time,
          isRecurringDaily: date === undefined,
          reason: reason || '원장님 잠금 (개인용무/휴식)',
          createdAt: new Date().toISOString(),
        };
        setLocks((prev) => [...prev, newLock]);
        addToast('warning', '슬롯 잠금', `${date || '매일'} ${time} 슬롯이 예약 불가 상태로 잠겼습니다.`);
        setLogs((prev) => [
          {
            id: 'log_' + Date.now(),
            type: 'admin',
            message: `[원장님] [${date || '매일'} ${time}] 슬롯을 잠갔습니다. (${reason || '개인용무'})`,
            timestamp: '방금 전',
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    },
    [locks, addToast]
  );

  /**
   * 원생 보강권 수동 증감
   */
  const adjustTickets = useCallback(
    (studentId: string, delta: number) => {
      const st = students.find((s) => s.id === studentId);
      if (!st) return;
      const nextCount = Math.max(0, st.makeupTickets + delta);

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, makeupTickets: nextCount } : s))
      );

      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      addToast('info', '보강권 변경', `${st.name} 학생의 보강권이 ${nextCount}회로 변경되었습니다.`);
      setLogs((prev) => [
        {
          id: 'log_' + Date.now(),
          type: 'ticket',
          message: `[원장님] ${st.name} 학생의 보강권을 수동 조정했습니다 (${sign}회, 총 ${nextCount}회).`,
          timestamp: '방금 전',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [students, addToast]
  );

  /**
   * 원생 정규 수업 추가 (동시간대 최대 4명까지 허용)
   */
  const addRegularSlot = useCallback(
    (studentId: string, dayOfWeek: DayOfWeek, time: string): { success: boolean; error?: string } => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return { success: false, error: '학생을 찾을 수 없습니다.' };

      // 본인이 이미 이 요일/시간에 등록되어 있는지 체크
      const alreadyRegistered = student.regularSlots.some(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.time === time
      );
      if (alreadyRegistered) {
        return {
          success: false,
          error: `${student.name} 학생은 이미 이 시간에 정규 수업이 등록되어 있습니다.`,
        };
      }

      // 해당 요일/시간에 배정된 총 정규 원생 수 확인 (최대 4명)
      const currentRegularCount = students.filter((s) =>
        s.regularSlots.some((slot) => slot.dayOfWeek === dayOfWeek && slot.time === time)
      ).length;

      if (currentRegularCount >= 4) {
        return {
          success: false,
          error: `해당 시간(${time})은 이미 최대 정원(4명)이 모두 배정되었습니다.`,
        };
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, regularSlots: [...s.regularSlots, { dayOfWeek, time }] }
            : s
        )
      );

      addToast('success', '정규 수업 추가', `${student.name} 학생의 정규 수업이 추가되었습니다. (동시간대 ${currentRegularCount + 1}/4명)`);
      return { success: true };
    },
    [students, addToast]
  );

  /**
   * 원생 정규 수업 삭제
   */
  const removeRegularSlot = useCallback(
    (studentId: string, dayOfWeek: DayOfWeek, time: string) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                regularSlots: s.regularSlots.filter(
                  (slot) => !(slot.dayOfWeek === dayOfWeek && slot.time === time)
                ),
              }
            : s
        )
      );
      addToast('info', '정규 수업 삭제', '정규 수업이 삭제되었습니다.');
    },
    [addToast]
  );

  /**
   * 신규 학생 등록
   */
  const createStudent = useCallback(
    (name: string, grade: string, phone: string) => {
      const newStudent: Student = {
        id: 'student_' + Date.now(),
        name,
        grade,
        phone,
        makeupTickets: 0,
        regularSlots: [],
        avatarBg: 'bg-indigo-100 text-indigo-700',
      };
      setStudents((prev) => [...prev, newStudent]);
      addToast('success', '학생 등록 완료', `${name} 학생이 새로 등록되었습니다.`);
    },
    [addToast]
  );

  /**
   * 학생 삭제
   */
  const deleteStudent = useCallback(
    (studentId: string) => {
      const st = students.find((s) => s.id === studentId);
      if (!st) return;
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setBookings((prev) => prev.filter((b) => b.studentId !== studentId));
      setAbsences((prev) => prev.filter((a) => a.studentId !== studentId));
      if (currentStudentId === studentId) {
        setCurrentStudentId(students[0]?.id || '');
      }
      addToast('info', '학생 삭제', `${st.name} 학생이 삭제되었습니다.`);
    },
    [students, currentStudentId, addToast]
  );

  /**
   * 초기 샘플 데이터로 리셋
   */
  const resetData = useCallback(() => {
    const seed = getInitialSeedData(new Date());
    setStudents(seed.students);
    setBookings(seed.bookings);
    setAbsences(seed.absences);
    setLocks(seed.locks);
    setLogs(seed.logs);
    setCurrentStudentId('student-1');
    setSimulatedToday(defaultTodayStr);

    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.ABSENCES);
    localStorage.removeItem(STORAGE_KEYS.LOCKS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    localStorage.removeItem(STORAGE_KEYS.APP_MODE);
    localStorage.removeItem(STORAGE_KEYS.SIMULATED_TODAY);

    addToast('info', '데이터 리셋 완료', '모든 시간표와 예약 내역이 초기 샘플 상태로 복원되었습니다.');
  }, [defaultTodayStr, addToast]);

  const value = {
    appMode,
    setAppMode: setAppModeSecure,
    currentStudentId,
    setCurrentStudentId,
    currentStudent,
    simulatedToday,
    setSimulatedToday,
    isParentDirectLink,
    getStudentShareUrl,
    exitParentDirectMode,
    students,
    bookings,
    absences,
    locks,
    logs,
    getSlot,
    getSlotsForDay,
    getAvailableCountForDay,
    createBooking,
    cancelBooking,
    requestAbsence,
    cancelAbsence,
    toggleSlotLock,
    adjustTickets,
    addRegularSlot,
    removeRegularSlot,
    createStudent,
    deleteStudent,
    resetData,
    toasts,
    addToast,
    removeToast,
    adminTab,
    setAdminTab,
    adminHomeTimestamp,
    goToAdminHome,
  };

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
