import React from 'react';
import { StudentHeaderCard } from './StudentHeaderCard';
import { UpcomingBookingsCard } from './UpcomingBookingsCard';
import { BookingTab } from './BookingTab';

export const ParentView: React.FC = () => {
  return (
    <div className="max-w-md mx-auto w-full px-4 pt-4 sm:pt-6">
      {/* 학생 정보 요약 카드 */}
      <StudentHeaderCard />

      {/* 나의 다가오는 보강 일정 카드 (UX #1 & UX #3) */}
      <UpcomingBookingsCard />

      {/* 보강 예약 컨텐츠 (날짜 선택 및 슬롯) */}
      <BookingTab />
    </div>
  );
};
