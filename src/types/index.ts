export type DayOfWeek = 1 | 2 | 3 | 4 | 5; // 1: 월, 2: 화, 3: 수, 4: 목, 5: 금

export interface RegularSlot {
  dayOfWeek: DayOfWeek; // 1=Mon, ..., 5=Fri
  time: string; // "13:00", "15:00", etc.
}

export interface Student {
  id: string;
  name: string;
  grade: string; // "초2", "초4", etc.
  phone: string;
  makeupTickets: number; // 보유 보강 예약권 횟수
  regularSlots: RegularSlot[]; // 매주 반복 정규 수업
  avatarBg?: string;
  accessCode?: string; // 학부모 전용 접속 고유 코드 (카카오톡 링크용)
}

export type BookingType = 'makeup' | 'special' | 'counseling';
export type CounselingType = 'in_person' | 'phone';

export interface Booking {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm" (시작 시간)
  duration: 30 | 60; // 분 단위 (보강/상담=30, 특강=60)
  type: BookingType;
  studentId: string;
  studentName: string;
  counselingType?: CounselingType;
  memo?: string;
  createdAt: string;
}

export interface AbsenceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  reason?: string;
  createdAt: string;
}

export interface SlotLock {
  id: string;
  date?: string; // 특정 날짜 ("YYYY-MM-DD"), 비어있으면 매일 반복
  time: string; // "HH:mm"
  isRecurringDaily?: boolean; // 매일 16:00 고정 휴식 등
  reason: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'booking' | 'cancel' | 'absence' | 'admin' | 'ticket';
  message: string;
  timestamp: string;
  studentName?: string;
  createdAt?: string;
}

// 30분 단위 계산된 슬롯 상태
export type SlotStatusType = 
  | 'AVAILABLE'     // 빈 시간 (예약 가능)
  | 'REGULAR'       // 정규 고정 수업
  | 'BOOKED'        // 보강/특강/상담 예약 완료
  | 'LOCKED';       // 원장님 휴식 또는 잠금

export interface CalculatedSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  dayOfWeek: DayOfWeek;
  status: SlotStatusType;
  
  // 정원 및 인원 정보 (최대 4명)
  maxCapacity: number; // 4
  currentCount: number; // 현재 동시간대 수업 인원 (정규 + 예약)
  isAvailableForParent: boolean; // 학부모 예약 가능 여부: 동시간대 인원이 0명 또는 1명일 때만 true!
  isFull: boolean; // 원장님 기준 정원 마감(4명) 여부
  
  // 상세 다중 배정 데이터
  activeRegularStudents: Student[]; // 정규 수업 참여 학생들
  activeBookings: { booking: Booking; isSpecialSecondHalf?: boolean }[]; // 예약된 학생들
  absenceRecords: AbsenceRecord[]; // 결석 신청된 학생들
  lockInfo?: SlotLock;

  // 단일 참조용 호환 필드 (1번째 학생/예약)
  booking?: Booking;
  regularStudent?: Student;
  absenceInfo?: AbsenceRecord;
  isSpecialSecondHalf?: boolean;
}
