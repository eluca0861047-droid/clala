import React from 'react';
import { StudentHeaderCard } from './StudentHeaderCard';
import { BookingTab } from './BookingTab';
import { CalendarPlus } from 'lucide-react';

export const ParentView: React.FC = () => {
  return (
    <div className="max-w-md mx-auto w-full px-4 pt-4 sm:pt-6">
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
      </div>

      {/* 보강 예약 컨텐츠 */}
      <BookingTab />
    </div>
  );
};
