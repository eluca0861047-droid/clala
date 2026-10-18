import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { CalculatedSlot, BookingType, CounselingType } from '../../types';
import { formatKoreanDateTime, DAY_NAMES } from '../../utils/dateUtils';
import {
  Lock,
  Unlock,
  UserPlus,
  Trash2,
  Clock,
  Phone,
  X,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: CalculatedSlot | null;
}

export const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  isOpen,
  onClose,
  slot,
}) => {
  const {
    students,
    toggleSlotLock,
    cancelBooking,
    createBooking,
  } = useReservation();

  // 직권 배정 모드 상태
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignType, setAssignType] = useState<BookingType>('makeup');
  const [assignCounselingType, setAssignCounselingType] = useState<CounselingType>('in_person');
  const [assignMemo, setAssignMemo] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !slot) return null;

  const isLocked = slot.status === 'LOCKED';
  const hasRoom = slot.currentCount < 4;

  // 이미 이 슬롯에 참여 중인 학생 ID 집합
  const assignedStudentIds = new Set<string>([
    ...slot.activeRegularStudents.map((s) => s.id),
    ...slot.activeBookings.map((b) => b.booking.studentId),
  ]);

  // 배정 가능한 학생 후보군 (중복 방지 & 가나다순 정렬)
  const candidateStudents = students
    .filter((s) => !assignedStudentIds.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const effectiveSelectedStudentId =
    selectedStudentId || candidateStudents[0]?.id || students[0]?.id || '';

  const handleToggleLock = () => {
    toggleSlotLock({
      date: slot.date,
      time: slot.time,
      reason: '원장님 잠금 (외출/휴식)',
    });
    onClose();
  };

  const handleCancelBooking = (bookingId: string, studentName: string) => {
    if (window.confirm(`${studentName} 학생의 예약을 직권 취소하시겠습니까?`)) {
      cancelBooking(bookingId, true);
      onClose();
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!effectiveSelectedStudentId) {
      setErrorMsg('배정할 학생을 선택해 주세요.');
      return;
    }

    const duration = assignType === 'special' ? 60 : 30;

    const res = createBooking({
      studentId: effectiveSelectedStudentId,
      date: slot.date,
      time: slot.time,
      type: assignType,
      duration,
      counselingType: assignType === 'counseling' ? assignCounselingType : undefined,
      memo: assignMemo.trim() || '[원장님 직권 배정]',
      isAdmin: true,
    });

    if (res.success) {
      setIsAssigning(false);
      setAssignMemo('');
      onClose();
    } else {
      setErrorMsg(res.error || '수업 배정에 실패했습니다.');
    }
  };

  return (
    <div className="no-print fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.01] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-[14px] text-white shadow-xs ${
                isLocked
                  ? 'bg-slate-600'
                  : slot.isFull
                  ? 'bg-[#ff3b30]'
                  : slot.isAvailableForParent
                  ? 'bg-[#34c759]'
                  : 'bg-[#0071e3]'
              }`}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f]">
                {formatKoreanDateTime(slot.date, slot.time)}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>현재 배정:</span>
                  <span className={`font-bold ${slot.isFull ? 'text-[#ff3b30]' : 'text-[#0071e3]'}`}>
                    {slot.currentCount} / {slot.maxCapacity}명
                  </span>
                </span>
                <span className="text-black/20">·</span>
                {isLocked ? (
                  <span className="text-[10px] font-bold text-slate-600 bg-black/[0.05] px-2.5 py-0.5 rounded-full">
                    원장실 잠금
                  </span>
                ) : slot.isAvailableForParent ? (
                  <span className="text-[10px] font-bold text-[#34c759] bg-[#34c759]/15 border border-[#34c759]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#34c759]" />
                    <span>학부모 예약 가능 (1명 이하)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#ff9500] bg-[#ff9500]/15 border border-[#ff9500]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-[#ff9500]" />
                    <span>학부모 마감 (2명 이상 수업 중)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-full hover:bg-black/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. 원장님 잠긴 슬롯 안내 */}
          {isLocked && (
            <div className="bg-slate-100 rounded-2xl p-4 space-y-2 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>잠금 사유: {slot.lockInfo?.reason || '원장님 휴식 및 외출'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                현재 학부모 화면에서 해당 슬롯은 &lsquo;마감&rsquo; 처리되어 예약할 수 없습니다.
                잠금을 해제하면 동시간대 인원 조건에 맞춰 학부모 예약이 오픈됩니다.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>이 슬롯 잠금 해제</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. 현재 배정된 학생 목록 (정규 학생 + 예약 학생) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>배정된 학생 목록 ({slot.currentCount}명)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                최대 4명 동시 수업 가능
              </span>
            </div>

            {slot.currentCount === 0 && !isLocked ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <p className="text-xs text-slate-500 font-bold">배정된 원생이 없습니다.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  학부모 화면에서 &lsquo;예약 가능&rsquo; 상태로 노출되는 빈 시간입니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 정규 수업 학생들 */}
                {slot.activeRegularStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                          정규 수업
                        </span>
                        <strong className="text-sm font-bold text-slate-900">
                          {st.name} ({st.grade})
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>연락처: {st.phone}</span>
                        <span className="text-slate-300">·</span>
                        <span>매주 {DAY_NAMES[slot.dayOfWeek]}요일 정규</span>
                      </p>
                    </div>
                  </div>
                ))}

                {/* 예약된 학생들 (보강 / 특강 / 상담) */}
                {slot.activeBookings.map(({ booking, isSpecialSecondHalf }) => {
                  const isCounseling = booking.type === 'counseling';
                  const isSpecial = booking.type === 'special';
                  const badgeBg = isCounseling
                    ? 'bg-emerald-600 text-white'
                    : isSpecial
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-500 text-white';
                  const badgeText = isCounseling
                    ? `원장님 상담 (${booking.counselingType === 'in_person' ? '대면' : '전화'})`
                    : isSpecial
                    ? `심화 특강 (60분${isSpecialSecondHalf ? ' 후반' : ''})`
                    : '보강 수업';

                  return (
                    <div
                      key={booking.id}
                      className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeBg}`}>
                            {badgeText}
                          </span>
                          <strong className="text-sm font-bold text-slate-900">
                            {booking.studentName}
                          </strong>
                        </div>
                        {booking.memo && (
                          <p className="text-[11px] text-slate-600">
                            메모: <span className="font-semibold text-slate-800">{booking.memo}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          신청 일자: {booking.createdAt.substring(0, 10)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking.id, booking.studentName)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all shadow-2xs shrink-0 flex items-center gap-1"
                        title="예약 직권 취소"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>취소</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 사전 결석 흔적 표시 */}
            {slot.absenceRecords.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {slot.absenceRecords.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2"
                  >
                    <span className="text-sm">👻</span>
                    <span>
                      <strong>{a.studentName}</strong> 학생이 사전 결석을 신청하여 자리가 확보되었습니다. ({a.reason || '개인 사정'})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. 직권 배정 또는 슬롯 제어 액션 */}
          {!isAssigning ? (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {/* 직권 배정 버튼 (4명 미만일 때 활성화) */}
                {hasRoom && !isLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssigning(true);
                      setErrorMsg(null);
                    }}
                    className="p-3.5 rounded-2xl border-2 border-indigo-200 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 flex flex-col items-center justify-center text-center transition-all group"
                  >
                    <UserPlus className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-indigo-950">원장님 직권 배정</span>
                    <span className="text-[10px] text-indigo-600 mt-0.5">
                      남은 정원 {4 - slot.currentCount}명 배정 가능
                    </span>
                  </button>
                )}

                {/* 슬롯 잠그기 / 열기 버튼 */}
                {!isLocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt(
                        '잠금 사유를 입력하세요 (예: 원장님 외출, 학원 회의)',
                        '원장님 개인 일정'
                      );
                      if (reason !== null) {
                        toggleSlotLock({
                          date: slot.date,
                          time: slot.time,
                          reason,
                        });
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 border-slate-200 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-center transition-all group ${
                      !hasRoom ? 'col-span-2' : ''
                    }`}
                  >
                    <Lock className="w-5 h-5 text-slate-600 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900">이 시간 예약 잠그기</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      외출/휴식 등으로 예약 차단
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className="col-span-2 p-3.5 rounded-2xl border-2 border-emerald-300 hover:border-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex flex-col items-center justify-center text-center transition-all group"
                  >
                    <Unlock className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-emerald-950">슬롯 잠금 해제</span>
                    <span className="text-[10px] text-emerald-700 mt-0.5">
                      예약 가능 상태로 오픈
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* 원장님 직권 배정 폼 */
            <form onSubmit={handleAssignSubmit} className="pt-2 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>원장님 직권 수업 배정 (현재 {slot.currentCount}/4명)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAssigning(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  뒤로가기
                </button>
              </div>

              {/* 배정할 학생 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">배정할 학생 선택 *</label>
                <select
                  value={effectiveSelectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                >
                  {candidateStudents.length === 0 ? (
                    <option value="">모든 원생이 이미 이 시간에 배정되어 있습니다.</option>
                  ) : (
                    candidateStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 수업 유형 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">수업 유형 *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignType('makeup')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      assignType === 'makeup'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    보강 수업
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType('special')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      assignType === 'special'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    특강 (60분)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType('counseling')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      assignType === 'counseling'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    상담
                  </button>
                </div>
              </div>

              {/* 상담인 경우 상담 방식 */}
              {assignType === 'counseling' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">상담 방식</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignCounselingType('in_person')}
                      className={`p-2 rounded-xl border text-xs font-bold text-center ${
                        assignCounselingType === 'in_person'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      대면 상담
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignCounselingType('phone')}
                      className={`p-2 rounded-xl border text-xs font-bold text-center ${
                        assignCounselingType === 'phone'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      전화 상담
                    </button>
                  </div>
                </div>
              )}

              {/* 배정 메모 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">배정 메모</label>
                <input
                  type="text"
                  value={assignMemo}
                  onChange={(e) => setAssignMemo(e.target.value)}
                  placeholder="예: 콩쿠르 대비 집중 레슨, 결석 보충"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssigning(false)}
                  className="px-4 py-2 rounded-[14px] text-xs font-semibold text-[#1d1d1f] bg-black/[0.05] hover:bg-black/[0.08]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={candidateStudents.length === 0}
                  className="px-5 py-2.5 rounded-[14px] text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 disabled:opacity-50 text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)]"
                >
                  배정 확정하기
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 푸터 닫기 */}
        <div className="p-4 bg-black/[0.01] border-t border-black/[0.05] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-[14px] text-xs font-semibold text-[#1d1d1f] bg-black/[0.05] hover:bg-black/[0.08] transition-colors active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
