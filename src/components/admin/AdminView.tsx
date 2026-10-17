import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { AdminDashboard } from './AdminDashboard';
import { WeeklyTimetable } from './WeeklyTimetable';
import { StudentManagement } from './StudentManagement';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { Calendar, Users, Lock, KeyRound } from 'lucide-react';

export const AdminView: React.FC = () => {
  const { adminTab, setAdminTab, logoutAdmin } = useReservation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 print:max-w-none print:w-full print:p-0 print:m-0 print:space-y-0">
      {/* 관리자 헤더 & 탭 네비게이션 (인쇄 시 숨김 - Apple macOS Pro Header) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">
              원장님 예약관리
            </h1>
            <span className="text-[11px] font-semibold bg-[#0071e3]/10 text-[#0071e3] px-2.5 py-0.5 rounded-full border border-[#0071e3]/20">
              Admin Wide View
            </span>
          </div>
          <p className="text-xs text-[#86868b] mt-1">
            실시간 스마트 슬롯(최대 4인) 자동 순환 매칭 및 주간 시간표 직권 제어
          </p>
        </div>

        {/* 탭 전환기 & 원장님 보안 제어 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Apple Segmented Control 탭 전환기 */}
          <div className="bg-black/[0.05] p-1 rounded-[18px] flex items-center shrink-0 border border-black/[0.03]">
            <button
              type="button"
              onClick={() => setAdminTab('timetable')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs sm:text-[13px] font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs sm:text-[13px] font-bold transition-all ${
                adminTab === 'students'
                  ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Users className={`w-4 h-4 ${adminTab === 'students' ? 'text-[#0071e3]' : 'text-[#86868b]'}`} />
              <span>원생 & 정규수업</span>
            </button>
          </div>

          {/* 원장님 보안 도구: 비밀번호 변경 및 화면 잠금 */}
          <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-[18px] border border-black/[0.04]">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="p-2 rounded-[14px] text-[#86868b] hover:text-[#1d1d1f] hover:bg-white transition-all cursor-pointer"
              title="원장님 접속 비밀번호 변경"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={logoutAdmin}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[14px] text-xs font-semibold text-[#ff3b30] hover:bg-white transition-all cursor-pointer active:scale-95"
              title="원장님 모드 즉시 잠금"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">화면잠금</span>
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* 상단 대시보드 통계 카드 & 실시간 알림 로그 (인쇄 시 숨김) */}
      <div className="no-print">
        <AdminDashboard />
      </div>

      {/* 선택된 탭 컨텐츠 */}
      {adminTab === 'timetable' ? <WeeklyTimetable /> : <StudentManagement />}
    </div>
  );
};
