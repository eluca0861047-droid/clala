import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { BookingType, CounselingType } from '../../types';
import { formatKoreanDateTime } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';
import { Calendar, Clock, Sparkles, X } from 'lucide-react';

interface BookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  time: string;
  type: BookingType;
  duration: 30 | 60;
  onSuccess?: () => void;
}

export const BookingConfirmModal: React.FC<BookingConfirmModalProps> = ({
  isOpen,
  onClose,
  date,
  time,
  type,
  duration,
  onSuccess,
}) => {
  const { currentStudent, createBooking } = useReservation();
  const [counselingType, setCounselingType] = useState<CounselingType>('in_person');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentStudent) return null;

  const typeLabel =
    type === 'makeup'
      ? '보강 수업'
      : type === 'special'
      ? '심화 특강'
      : '원장님 1:1 상담';

  const handleConfirm = () => {
    setErrorMsg(null);
    const res = createBooking({
      studentId: currentStudent.id,
      date,
      time,
      type,
      duration,
      counselingType: type === 'counseling' ? counselingType : undefined,
    });

    if (res.success) {
      // Confetti 축하 효과
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || '예약 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-t-[32px] sm:rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden transform transition-all animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-5 pb-4 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1d1d1f] tracking-tight">예약 내용 확인</h3>
              <p className="text-xs text-[#86868b]">선택하신 일정 정보를 확인해 주세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-full hover:bg-black/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-[16px] text-[#ff3b30] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 일정 카드 */}
          <div className="bg-[#0071e3]/[0.08] border border-[#0071e3]/20 rounded-[20px] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0071e3] text-white">
                {typeLabel}
              </span>
              <span className="text-xs font-semibold text-[#1d1d1f]">
                {currentStudent.name} ({currentStudent.grade})
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#1d1d1f] font-bold text-lg pt-1">
              <Calendar className="w-5 h-5 text-[#0071e3] shrink-0" />
              <span>{formatKoreanDateTime(date, time)}</span>
            </div>

            {type === 'special' && (
              <div className="flex items-center gap-1.5 text-xs text-[#0071e3] bg-[#0071e3]/10 px-3 py-1.5 rounded-[12px] font-medium">
                <Clock className="w-4 h-4 text-[#0071e3] shrink-0" />
                <span>연속된 2개 슬롯(총 60분)이 예약 처리됩니다.</span>
              </div>
            )}

            {type === 'counseling' && (
              <div className="flex items-center gap-1.5 text-xs text-[#34c759] bg-[#34c759]/10 px-3 py-1.5 rounded-[12px] font-medium">
                <Sparkles className="w-4 h-4 text-[#34c759] shrink-0" />
                <span>원장님과 1:1 맞춤 상담(대면 또는 유선)이 진행됩니다.</span>
              </div>
            )}
          </div>

          {/* 상담 옵션 (상담일 때만) */}
          {type === 'counseling' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1d1d1f]">상담 방식 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCounselingType('in_person')}
                  className={`p-3 rounded-[16px] border text-xs font-bold transition-all text-center ${
                    counselingType === 'in_person'
                      ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] shadow-xs'
                      : 'border-black/[0.08] text-[#86868b] hover:bg-black/[0.02]'
                  }`}
                >
                  🏫 학원 대면 상담
                </button>
                <button
                  type="button"
                  onClick={() => setCounselingType('phone')}
                  className={`p-3 rounded-[16px] border text-xs font-bold transition-all text-center ${
                    counselingType === 'phone'
                      ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] shadow-xs'
                      : 'border-black/[0.08] text-[#86868b] hover:bg-black/[0.02]'
                  }`}
                >
                  📞 전화 유선 상담
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하단 확정 버튼 */}
        <div className="p-4 bg-black/[0.02] border-t border-black/[0.05] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-[16px] font-semibold text-sm text-[#1d1d1f] bg-black/[0.05] hover:bg-black/[0.08] transition-colors active:scale-[0.98]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 py-3 px-6 rounded-[16px] font-semibold text-sm bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all text-center"
          >
            예약 확정하기
          </button>
        </div>
      </div>
    </div>
  );
};
