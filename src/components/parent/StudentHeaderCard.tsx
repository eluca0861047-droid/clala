import React from 'react';
import { useReservation } from '../../context/ReservationContext';
import { DayOfWeek } from '../../types';
import { DAY_NAMES } from '../../utils/dateUtils';
import { User, CalendarDays } from 'lucide-react';

export const StudentHeaderCard: React.FC = () => {
  const { currentStudent } = useReservation();

  if (!currentStudent) return null;

  // 요일별 정규 시간표 텍스트 생성
  const regularScheduleSummary = currentStudent.regularSlots.length > 0
    ? currentStudent.regularSlots
        .slice()
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((slot) => `${DAY_NAMES[slot.dayOfWeek as DayOfWeek] || ''} ${slot.time}`)
        .join(' · ')
    : '등록된 정규 수업 없음';

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#0071e3] to-[#47a3ff] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,113,227,0.25)] shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1d1d1f] tracking-tight">{currentStudent.name}</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.04] text-[#1d1d1f] border border-black/[0.04]">
              {currentStudent.grade}
            </span>
          </div>
          <p className="text-xs text-[#86868b] mt-1 flex items-center gap-1.5 flex-wrap">
            <CalendarDays className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
            <span className="font-medium text-[#1d1d1f]">정규 수업:</span>
            <span className="text-[#424245] font-semibold">{regularScheduleSummary}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
