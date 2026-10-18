import React from 'react';
import { useReservation } from '../../context/ReservationContext';
import { AdminDashboard } from './AdminDashboard';
import { WeeklyTimetable } from './WeeklyTimetable';
import { StudentManagement } from './StudentManagement';
import { Calendar, Users, Bell } from 'lucide-react';
import { parseDate, DAY_NAMES } from '../../utils/dateUtils';
import { DayOfWeek } from '../../types';

export const AdminView: React.FC = () => {
  const {
    adminTab,
    setAdminTab,
    bookingStartDate,
    setBookingStartDate,
    unreadBookingCount,
    recentBookingLogs,
  } = useReservation();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 print:max-w-none print:w-full print:p-0 print:m-0 print:space-y-0">
      {/* 관리자 헤더 & 탭 네비게이션 (인쇄 시 숨김 - Apple macOS Pro Header) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">
            원장님 예약관리
          </h1>
        </div>

        {/* Apple Segmented Control 탭 전환기 (주간 시간표 / 원생관리 / 실시간 보강 알람) */}
        <div className="bg-black/[0.05] p-1 rounded-[18px] flex items-center shrink-0 border border-black/[0.03] overflow-x-auto">
          <button
            type="button"
            onClick={() => setAdminTab('timetable')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-[14px] text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              adminTab === 'timetable'
                ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <Calendar className={`w-4 h-4 ${adminTab === 'timetable' ? 'text-[#0071e3]' : 'text-[#86868b]'}`} />
            <span>주간 시간표</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('students')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-[14px] text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              adminTab === 'students'
                ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <Users className={`w-4 h-4 ${adminTab === 'students' ? 'text-[#0071e3]' : 'text-[#86868b]'}`} />
            <span>원생관리</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('feed')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-[14px] text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
              adminTab === 'feed'
                ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <Bell className={`w-4 h-4 ${adminTab === 'feed' ? 'text-[#ff9500]' : 'text-[#86868b]'}`} />
            <span>보강 알람</span>
            {unreadBookingCount > 0 ? (
              <span className="text-[10px] font-extrabold bg-[#ff3b30] text-white px-1.5 py-0.2 rounded-full animate-pulse shadow-2xs">
                {unreadBookingCount}
              </span>
            ) : recentBookingLogs.length > 0 ? (
              <span className="text-[10px] font-bold bg-black/[0.08] text-[#86868b] px-1.5 py-0.2 rounded-full">
                {recentBookingLogs.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* 선택된 탭 컨텐츠 */}
      {adminTab === 'timetable' && (
        <div className="space-y-5">
          {/* 보강 예약 1주차 시작일 제어 바 (원장님 변경 기능 - Apple Inset Bar) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-xl p-3.5 px-4 rounded-[20px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[12px] bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#1d1d1f]">보강 예약 1주차 시작일</span>
                  <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full border border-[#0071e3]/20">
                    {DAY_NAMES[parseDate(bookingStartDate).getDay() as DayOfWeek || 1]}요일 시작 (평일 5일 순환)
                  </span>
                </div>
                <p className="text-[11px] text-[#86868b] mt-0.5">
                  학부모 모드의 1~4주차 날짜가 이 시작일을 기준으로 5일씩 자동 배정됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={bookingStartDate}
                onChange={(e) => setBookingStartDate(e.target.value)}
                className="bg-black/[0.04] text-[#1d1d1f] font-bold text-xs px-3 py-1.5 rounded-[12px] border border-black/[0.08] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 cursor-pointer"
                title="보강 예약 1주차 시작일 직접 변경"
              />
            </div>
          </div>

          <WeeklyTimetable />
        </div>
      )}

      {adminTab === 'students' && <StudentManagement />}

      {adminTab === 'feed' && (
        <div className="no-print animate-in fade-in duration-200">
          <AdminDashboard />
        </div>
      )}
    </div>
  );
};

