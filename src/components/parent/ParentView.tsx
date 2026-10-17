import React from 'react';
import { useReservation } from '../../context/ReservationContext';
import { StudentHeaderCard } from './StudentHeaderCard';
import { BookingTab } from './BookingTab';
import { CalendarPlus } from 'lucide-react';

export const ParentView: React.FC = () => {
  const { currentStudent, isParentDirectLink } = useReservation();

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-4 sm:pt-6">
      {/* 학부모 전용 링크 보안 배너 (Apple Privacy Pill) */}
      {isParentDirectLink && currentStudent && (
        <div className="mb-3.5 px-3.5 py-2.5 rounded-[20px] bg-[#0071e3]/[0.08] border border-[#0071e3]/20 flex items-center justify-between text-xs text-[#0071e3] shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-sm">🔒</span>
            <span>{currentStudent.name} 학생 전용 안심 예약</span>
          </div>
          <span className="text-[10px] text-[#0071e3] font-semibold bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#0071e3]/20">
            보안 보호 적용
          </span>
        </div>
      )}

      {/* 학생 정보 요약 카드 */}
      <StudentHeaderCard />

      {/* 단독 섹션 타이틀: 보강 예약하기 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[12px] bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
            <CalendarPlus className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight">
            보강 예약하기
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#0071e3] bg-[#0071e3]/10 border border-[#0071e3]/20 px-2.5 py-0.5 rounded-full">
          실시간 빈 시간 오픈
        </span>
      </div>

      {/* 보강 예약 컨텐츠 */}
      <BookingTab />
    </div>
  );
};
