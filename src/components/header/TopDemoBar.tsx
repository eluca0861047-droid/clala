import React from 'react';
import { useReservation } from '../../context/ReservationContext';
import { DayOfWeek } from '../../types';
import {
  Smartphone,
  Monitor,
  RotateCcw,
  Calendar,
  Lock,
  Share2,
} from 'lucide-react';
import { parseDate, DAY_NAMES } from '../../utils/dateUtils';

export const TopDemoBar: React.FC = () => {
  const {
    appMode,
    setAppMode,
    students,
    currentStudentId,
    setCurrentStudentId,
    currentStudent,
    simulatedToday,
    setSimulatedToday,
    resetData,
    isParentDirectLink,
    getStudentShareUrl,
    exitParentDirectMode,
    goToAdminHome,
    addToast,
  } = useReservation();

  // 날짜 파싱 정보
  const todayDate = parseDate(simulatedToday);
  const dayIndex = todayDate.getDay();
  const dayName = DAY_NAMES[dayIndex] || '월';

  // 현재 학생의 학부모 전용 링크 복사
  const handleCopyCurrentStudentLink = () => {
    if (!currentStudent) return;
    const url = getStudentShareUrl(currentStudent);
    navigator.clipboard.writeText(url);
    addToast(
      'success',
      '전용 링크 복사 완료',
      `${currentStudent.name} 학부모 전용 링크가 클립보드에 복사되었습니다! 카카오톡으로 전송하세요.`
    );
  };

  // 1. 학부모 전용 링크로 접속한 경우 (보안 격리 모드: 원장님 관리자 접근 차단 - Apple Minimalist Dark Blur)
  if (isParentDirectLink && currentStudent) {
    return (
      <header className="sticky top-0 z-50 bg-[#1d1d1f]/85 backdrop-blur-2xl text-white border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.15)] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Apple Style Minimal Logo */}
          <div className="flex items-center gap-2.5 text-left select-none cursor-default">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#47a3ff] flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.35)]">
              <span className="text-base">🎹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">
                  클라라피아노
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/10 text-white/90 border border-white/15 px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5 text-[#34c759]" />
                  {currentStudent.name} 학생 전용
                </span>
              </div>
            </div>
          </div>

          {/* Apple Privacy Badge */}
          <span className="text-[11px] font-medium text-white/70 bg-white/[0.08] border border-white/[0.1] px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-default select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse"></span>
            <span>보안 안심 모드</span>
          </span>
        </div>
      </header>
    );
  }

  // 2. 관리자/시연 데모 모드 (Apple macOS Pro Bar)
  return (
    <header className="sticky top-0 z-50 bg-[#1d1d1f]/85 backdrop-blur-2xl text-white border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.12)] px-3 py-2.5 sm:px-6 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* 서비스 로고: 원장님 모드일 때만 클릭 시 최초 페이지 이동 */}
        {appMode === 'admin' ? (
          <button
            type="button"
            onClick={goToAdminHome}
            className="flex items-center gap-2.5 shrink-0 text-left group cursor-pointer transition-transform active:scale-[0.98]"
            title="클릭 시 원장님 관리자 첫 화면으로 이동"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#47a3ff] flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.4)] group-hover:shadow-[0_2px_14px_rgba(0,113,227,0.6)] transition-all">
              <span className="text-base">🎹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white group-hover:text-white/90 transition-colors">
                  클라라피아노
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold bg-white/10 text-white/80 border border-white/10 px-2 py-0.5 rounded-full">
                  원장님 관리자
                </span>
              </div>
            </div>
          </button>
        ) : (
          <div
            className="flex items-center gap-2.5 shrink-0 text-left select-none cursor-default"
            title="클라라피아노"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#47a3ff] flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.4)]">
              <span className="text-base">🎹</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">
                  클라라피아노
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold bg-white/10 text-white/80 border border-white/10 px-2 py-0.5 rounded-full">
                  스마트 예약 & 보강
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 중앙: Apple iOS Segmented Control 스위처 */}
        <div className="flex items-center gap-2">
          <div className="bg-white/[0.08] p-1 rounded-2xl border border-white/[0.08] flex items-center shadow-inner">
            <button
              onClick={() => setAppMode('parent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
                appMode === 'parent'
                  ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0071e3]" />
              <span>학부모 모드</span>
              <span className="hidden md:inline text-[10px] opacity-60 font-normal">(모바일)</span>
            </button>
            <button
              onClick={() => setAppMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
                appMode === 'admin'
                  ? 'bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0071e3]" />
              <span>원장님 관리자</span>
              <span className="hidden md:inline text-[10px] opacity-60 font-normal">(와이드)</span>
            </button>
          </div>

          {/* 학부모 모드일 때 접속 학생 전환 드롭다운 (Apple Glass Style) */}
          {appMode === 'parent' && (
            <div className="flex items-center gap-1.5 bg-white/[0.08] px-2.5 py-1.5 rounded-2xl border border-white/[0.08]">
              <span className="text-xs text-white/50 shrink-0 hidden sm:inline">접속 학생:</span>
              <select
                value={currentStudentId}
                onChange={(e) => setCurrentStudentId(e.target.value)}
                className="bg-transparent text-xs sm:text-[13px] font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id} className="bg-[#1d1d1f] text-white">
                    {st.name} ({st.grade})
                  </option>
                ))}
              </select>

              {/* 현재 학생 전용 링크 복사 버튼 */}
              <button
                type="button"
                onClick={handleCopyCurrentStudentLink}
                className="ml-1 p-1.5 rounded-xl bg-white/10 hover:bg-[#0071e3] text-white/80 hover:text-white text-xs transition-colors flex items-center gap-1 active:scale-95"
                title="이 학생의 학부모 전용 링크 복사"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[10px]">전용링크</span>
              </button>
            </div>
          )}
        </div>

        {/* 우측: 시뮬레이션 날짜 및 리셋 버튼 (Apple Minimalist) */}
        <div className="flex items-center gap-2">
          {/* 가상 오늘 날짜 표시 */}
          <div className="hidden lg:flex items-center gap-1.5 bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/[0.08] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
            <span className="text-white/60">기준 오늘:</span>
            <input
              type="date"
              value={simulatedToday}
              onChange={(e) => setSimulatedToday(e.target.value)}
              className="bg-white/10 text-white text-xs font-semibold px-2 py-0.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
            />
            <span className="text-white/90 font-bold">({dayName})</span>
          </div>

          {/* 초기 샘플 데이터로 리셋 버튼 */}
          <button
            onClick={() => {
              if (window.confirm('모든 데이터가 초기 샘플 상태로 복원됩니다. 계속하시겠습니까?')) {
                resetData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white border border-white/[0.08] transition-all active:scale-95"
            title="초기 상태로 되돌리기"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#ff9500]" />
            <span className="hidden sm:inline">데이터</span> 리셋
          </button>
        </div>
      </div>
    </header>
  );
};
