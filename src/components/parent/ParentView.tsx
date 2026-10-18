import React from 'react';
import { StudentHeaderCard } from './StudentHeaderCard';
import { BookingTab } from './BookingTab';

export const ParentView: React.FC = () => {
  return (
    <div className="max-w-md mx-auto w-full px-4 pt-4 sm:pt-6">
      {/* 학생 정보 요약 카드 */}
      <StudentHeaderCard />

      {/* 보강 예약 컨텐츠 (날짜 선택 및 슬롯) */}
      <BookingTab />
    </div>
  );
};
