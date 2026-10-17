import React, { useState, useMemo } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { DayOfWeek } from '../../types';
import {
  getFourWeeksDays,
  parseDate,
  formatKoreanDateTime,
} from '../../utils/dateUtils';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Calendar,
  HelpCircle,
  CalendarCheck,
} from 'lucide-react';

export const ScheduleTab: React.FC = () => {
  const {
    currentStudent,
    bookings,
    absences,
    simulatedToday,
    requestAbsence,
    cancelAbsence,
    cancelBooking,
  } = useReservation();

  // 모달 제어 상태
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'absence_confirm' | 'cancel_booking' | 'today_restricted' | 'cancel_absence';
    targetDate?: string;
    targetTime?: string;
    targetId?: string;
  }>({
    isOpen: false,
    type: 'absence_confirm',
  });

  const todayObj = useMemo(() => parseDate(simulatedToday), [simulatedToday]);
  const fourWeeksDays = useMemo(() => getFourWeeksDays(todayObj), [todayObj]);

  // 1. 현재 학생의 향후 4주간 정규 수업 목록 생성
  const upcomingRegularLessons = useMemo(() => {
    if (!currentStudent) return [];

    const list: {
      date: string;
      time: string;
      dayOfWeek: DayOfWeek;
      isAbsent: boolean;
      absenceId?: string;
      isToday: boolean;
    }[] = [];

    fourWeeksDays.forEach((day) => {
      currentStudent.regularSlots.forEach((slot) => {
        if (slot.dayOfWeek === day.dayOfWeek) {
          // 결석 신청 여부 확인
          const absence = absences.find(
            (a) =>
              a.studentId === currentStudent.id &&
              a.date === day.dateStr &&
              a.time === slot.time
          );

          list.push({
            date: day.dateStr,
            time: slot.time,
            dayOfWeek: day.dayOfWeek,
            isAbsent: !!absence,
            absenceId: absence?.id,
            isToday: day.dateStr === simulatedToday,
          });
        }
      });
    });

    // 날짜 및 시간 오름차순 정렬
    return list.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [currentStudent, fourWeeksDays, absences, simulatedToday]);

  // 2. 현재 학생이 예약한 보강 / 특강 / 상담 목록
  const myBookings = useMemo(() => {
    if (!currentStudent) return [];
    return bookings
      .filter((b) => b.studentId === currentStudent.id)
      .map((b) => ({
        ...b,
        isToday: b.date === simulatedToday,
      }))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [currentStudent, bookings, simulatedToday]);

  // 당일 취소 제한 모달 트리거
  const handleRestrictedClick = () => {
    setModalState({
      isOpen: true,
      type: 'today_restricted',
    });
  };

  // 사전 결석 신청 확인 요청
  const handleRequestAbsenceClick = (date: string, time: string, isToday: boolean) => {
    if (isToday) {
      handleRestrictedClick();
      return;
    }
    setModalState({
      isOpen: true,
      type: 'absence_confirm',
      targetDate: date,
      targetTime: time,
    });
  };

  // 결석 취소 요청
  const handleCancelAbsenceClick = (absenceId: string) => {
    setModalState({
      isOpen: true,
      type: 'cancel_absence',
      targetId: absenceId,
    });
  };

  // 예약 취소 요청
  const handleCancelBookingClick = (bookingId: string, isToday: boolean) => {
    if (isToday) {
      handleRestrictedClick();
      return;
    }
    setModalState({
      isOpen: true,
      type: 'cancel_booking',
      targetId: bookingId,
    });
  };

  const handleModalConfirm = () => {
    if (!currentStudent) return;

    if (modalState.type === 'absence_confirm' && modalState.targetDate && modalState.targetTime) {
      requestAbsence({
        studentId: currentStudent.id,
        date: modalState.targetDate,
        time: modalState.targetTime,
      });
    } else if (modalState.type === 'cancel_booking' && modalState.targetId) {
      cancelBooking(modalState.targetId, false);
    } else if (modalState.type === 'cancel_absence' && modalState.targetId) {
      cancelAbsence(modalState.targetId);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-5 pb-20">
      {/* 당일 정책 안내 배너 (Apple Frosted Capsule) */}
      <div className="bg-[#1d1d1f]/90 backdrop-blur-xl text-white p-4 rounded-[22px] shadow-sm flex items-start gap-3 border border-white/10">
        <div className="p-2 rounded-[14px] bg-white/10 shrink-0 mt-0.5">
          <HelpCircle className="w-4 h-4 text-[#47a3ff]" />
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-tight">결석 및 예약 변경 정책</h4>
          <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
            • <strong>수업 전일(내일 이후)</strong>까지 사전 결석 신청 시 해당 시간이 다른 원생의 보강 시간으로 자동 오픈됩니다.<br />
            • <strong>당일 결석 및 취소</strong>는 실시간 슬롯 보호를 위해 앱에서 불가하며 원장실로 직접 문의 바랍니다.
          </p>
        </div>
      </div>

      {/* 섹션 1: 내가 예약한 보강/특강/상담 일정 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-[#ff9500]" />
            <span>신청한 예약 수업 일정</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ff9500]/15 text-[#ff9500] border border-[#ff9500]/25">
              {myBookings.length}건
            </span>
          </h3>
        </div>

        {myBookings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[22px] border border-black/[0.06] text-center">
            <p className="text-xs text-[#86868b] font-medium">현재 예약된 수업 일정이 없습니다.</p>
            <p className="text-[11px] text-[#86868b] mt-1">[보강 예약하기] 탭에서 원하는 빈 시간을 예약해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myBookings.map((b) => {
              const typeBadge =
                b.type === 'makeup'
                  ? { label: '보강 수업 (30분)', bg: 'bg-[#ff9500]/15 text-[#ff9500] border-[#ff9500]/25' }
                  : b.type === 'special'
                  ? { label: '심화 특강 (60분)', bg: 'bg-[#0071e3]/15 text-[#0071e3] border-[#0071e3]/25' }
                  : { label: `상담 (${b.counselingType === 'in_person' ? '대면' : '전화'})`, bg: 'bg-[#34c759]/15 text-[#34c759] border-[#34c759]/25' };

              return (
                <div
                  key={b.id}
                  className="bg-white/90 backdrop-blur-xl p-4 rounded-[22px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3 hover:shadow-sm transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeBadge.bg}`}>
                        {typeBadge.label}
                      </span>
                      {b.isToday && (
                        <span className="text-[10px] font-bold text-[#ff3b30] bg-[#ff3b30]/15 border border-[#ff3b30]/25 px-2 py-0.2 rounded-full">
                          오늘 수업
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#1d1d1f]">
                      {formatKoreanDateTime(b.date, b.time)}
                    </p>
                    {b.memo && (
                      <p className="text-[11px] text-[#86868b]">메모: {b.memo}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancelBookingClick(b.id, b.isToday)}
                    className={`px-3 py-1.5 rounded-[14px] text-xs font-semibold shrink-0 transition-all ${
                      b.isToday
                        ? 'bg-black/[0.04] text-[#86868b] cursor-not-allowed border border-black/[0.04]'
                        : 'bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30] border border-[#ff3b30]/20 active:scale-95'
                    }`}
                  >
                    예약 취소
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 섹션 2: 다가오는 정규 수업 및 결석 신청 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0071e3]" />
            <span>정규 수업 일정 & 결석 신청</span>
          </h3>
          <span className="text-xs text-[#86868b]">향후 4주간 일정</span>
        </div>

        {upcomingRegularLessons.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[22px] border border-black/[0.06] text-center text-xs text-[#86868b]">
            등록된 정규 수업이 없습니다. 원장님께 시간표 배정을 요청해 주세요.
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingRegularLessons.map((lesson) => {
              const { date, time, isAbsent, absenceId, isToday } = lesson;

              return (
                <div
                  key={`${date}-${time}`}
                  className={`bg-white/90 backdrop-blur-xl p-4 rounded-[22px] border shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3 transition-all ${
                    isAbsent
                      ? 'border-dashed border-[#ff9500]/40 bg-[#ff9500]/[0.05]'
                      : 'border-black/[0.06] hover:border-black/[0.12]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                        정규 수업
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold text-[#ff3b30] bg-[#ff3b30]/15 border border-[#ff3b30]/25 px-2 py-0.2 rounded-full">
                          오늘 수업
                        </span>
                      )}
                      {isAbsent && (
                        <span className="text-[10px] font-bold text-[#ff9500] bg-[#ff9500]/15 border border-[#ff9500]/25 px-2.5 py-0.2 rounded-full">
                          사전 결석 완료
                        </span>
                      )}
                    </div>

                    <p className={`text-sm font-bold ${isAbsent ? 'line-through text-[#86868b]' : 'text-[#1d1d1f]'}`}>
                      {formatKoreanDateTime(date, time)}
                    </p>

                    {isAbsent ? (
                      <p className="text-[11px] text-[#ff9500] font-medium">
                        ✨ 해당 시간이 다른 원생의 보강 시간으로 오픈되었습니다.
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#86868b]">
                        사전 결석 시 해당 시간이 다른 원생의 보강 시간으로 오픈됩니다.
                      </p>
                    )}
                  </div>

                  {/* 결석 신청 또는 복귀 버튼 */}
                  <div>
                    {isAbsent ? (
                      absenceId && (
                        <button
                          type="button"
                          onClick={() => handleCancelAbsenceClick(absenceId)}
                          className="px-3 py-1.5 rounded-[14px] text-xs font-semibold bg-black/[0.05] hover:bg-black/[0.08] text-[#1d1d1f] transition-colors shrink-0 active:scale-95"
                        >
                          결석 취소
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestAbsenceClick(date, time, isToday)}
                        className={`px-3 py-1.5 rounded-[14px] text-xs font-semibold shrink-0 transition-all ${
                          isToday
                            ? 'bg-black/[0.04] text-[#86868b] cursor-not-allowed border border-black/[0.04]'
                            : 'bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] border border-[#0071e3]/20 active:scale-95'
                        }`}
                      >
                        사전 결석 신청
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 모달 1: 결석 신청 확인 모달 */}
      <ConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'absence_confirm'}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        title="사전 결석 신청 확인"
        description={`수업을 사전 결석 처리하시겠습니까?\n\n• 신청 일시: ${modalState.targetDate} ${modalState.targetTime}\n• 해당 시간은 다른 원생의 보강 예약 시간으로 즉시 오픈됩니다.`}
        confirmText="결석 신청하기"
        cancelText="취소"
        type="warning"
      />

      {/* 모달 2: 예약 취소 확인 모달 */}
      <ConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'cancel_booking'}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        title="예약 취소 확인"
        description="해당 예약을 취소하시겠습니까?"
        confirmText="예약 취소하기"
        cancelText="닫기"
        type="danger"
      />

      {/* 모달 3: 결석 취소 확인 모달 */}
      <ConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'cancel_absence'}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        title="결석 신청 취소 (정규 수업 복귀)"
        description="결석 신청을 취소하고 다시 본인의 정규 수업으로 복귀하시겠습니까?"
        confirmText="정규 수업 복귀"
        cancelText="닫기"
        type="info"
      />

      {/* 모달 4: 당일 결석/취소 제한 안내 모달 */}
      <ConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'today_restricted'}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        title="당일 취소 및 결석 제한 안내"
        description="당일 결석 및 변경은 앱에서 불가능하오니 원장님께 직접 문의해 주세요. (학원 유선 전화: 010-1234-5678)"
        confirmText="확인"
        hideCancel={true}
        type="warning"
      />
    </div>
  );
};
