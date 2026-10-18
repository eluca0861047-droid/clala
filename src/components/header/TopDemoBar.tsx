import React, { useMemo, useEffect, useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { DayOfWeek } from '../../types';
import {
  Smartphone,
  Monitor,
  Calendar,
  Share2,
  ChevronDown,
  Lock,
  KeyRound,
  Bell,
  Download,
} from 'lucide-react';
import { parseDate, DAY_NAMES } from '../../utils/dateUtils';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

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
    isParentDirectLink,
    getStudentShareUrl,
    exitParentDirectMode,
    goToAdminHome,
    addToast,
    isCloudConnected,
    isAdminAuthenticated,
    logoutAdmin,
    unreadBookingCount,
    setIsNotificationModalOpen,
  } = useReservation();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    }
  }, []);

  // 접속 학생 목록 가나다순(한국어 오름차순) 정렬
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  }, [students]);

  // 학부모 전용 직통 링크가 아닐 때, 기본 접속 학생을 항상 가나다순 첫 번째 학생으로 동기화
  useEffect(() => {
    if (!isParentDirectLink && sortedStudents.length > 0) {
      const hasChosen = sessionStorage.getItem('pianoslot_user_selected_student') === 'true';
      const exists = sortedStudents.some((s) => s.id === currentStudentId);
      if (!hasChosen || !exists) {
        setCurrentStudentId(sortedStudents[0].id);
      }
    }
  }, [sortedStudents, isParentDirectLink, currentStudentId, setCurrentStudentId]);

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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-white/20 shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="숙명클라라피아노 로고"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                숙명클라라피아노
              </span>
            </div>
          </div>
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
            title="클릭 시 원장님 모드 첫 화면으로 이동"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] group-hover:shadow-[0_2px_12px_rgba(255,255,255,0.3)] border border-white/20 shrink-0 overflow-hidden transition-all">
              <img
                src="/logo.png"
                alt="숙명클라라피아노 로고"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white group-hover:text-white/90 transition-colors">
                  숙명클라라피아노
                </span>
                {isCloudConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#34c759] bg-[#34c759]/15 border border-[#34c759]/25 px-2 py-0.5 rounded-full" title="Supabase 실시간 클라우드 DB 연결 완료">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                    클라우드 연동
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-400/15 border border-amber-400/25 px-2 py-0.5 rounded-full" title="로컬 저장소 모드 (Vercel 환경변수 등록 시 실시간 클라우드 DB 자동 활성화)">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    로컬 모드
                  </span>
                )}
              </div>
            </div>
          </button>
        ) : (
          <div
            className="flex items-center gap-2.5 shrink-0 text-left select-none cursor-default"
            title="숙명클라라피아노"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-white/20 shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="숙명클라라피아노 로고"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">
                  숙명클라라피아노
                </span>
                {isCloudConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#34c759] bg-[#34c759]/15 border border-[#34c759]/25 px-2 py-0.5 rounded-full" title="Supabase 실시간 클라우드 DB 연결 완료">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                    클라우드 연동
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-400/15 border border-amber-400/25 px-2 py-0.5 rounded-full" title="로컬 저장소 모드">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    로컬 모드
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 중앙: 모드 전환 & 접속 학생 (원장님 모드 왼쪽, 학부모 모드 오른쪽) */}
        <div className="flex items-center">
          <div className="inline-flex items-center p-1 bg-white/[0.08] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all">
            {appMode === 'parent' ? (
              <>
                {/* 1. 원장님 모드 전환 버튼 (왼쪽) */}
                <button
                  type="button"
                  onClick={() => setAppMode('admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98]"
                  title="원장님 모드 화면으로 전환"
                >
                  <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0071e3] shrink-0" />
                  <span>원장님 모드</span>
                  <span className="hidden md:inline text-[10px] opacity-60 font-normal">(와이드)</span>
                </button>

                {/* 2. 학부모 모드 + 접속 학생 일체형 토글 묶음 (오른쪽 - Apple Elevated Active Pill) */}
                <div className="flex items-center bg-white text-[#1d1d1f] shadow-[0_2px_10px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.08)] rounded-xl transition-all">
                  {/* 학부모 모드 라벨 */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-[13px] font-bold tracking-tight select-none">
                    <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0071e3] shrink-0" />
                    <span>학부모 모드</span>
                    <span className="hidden md:inline text-[10px] text-[#1d1d1f]/50 font-normal">(모바일)</span>
                  </div>

                  {/* 세련된 애플 헤어라인 구분선 */}
                  <div className="w-[1px] h-4 bg-black/15 my-auto" />

                  {/* 접속 학생 선택 & 링크 복사 (토글 내 일체화) */}
                  <div className="flex items-center pl-2 pr-1 py-1">
                    <span className="text-[11px] font-semibold text-[#1d1d1f]/60 shrink-0 hidden sm:inline mr-1">
                      접속:
                    </span>
                    <div className="relative flex items-center">
                      <select
                        value={currentStudentId}
                        onChange={(e) => {
                          sessionStorage.setItem('pianoslot_user_selected_student', 'true');
                          setCurrentStudentId(e.target.value);
                        }}
                        className="bg-transparent text-xs sm:text-[13px] font-bold text-[#1d1d1f] focus:outline-none cursor-pointer pl-1 pr-5 py-0.5 appearance-none tracking-tight"
                        title="접속하여 시연할 학생 선택"
                      >
                        {sortedStudents.map((st) => (
                          <option key={st.id} value={st.id} className="bg-white text-[#1d1d1f] font-medium">
                            {st.name} ({st.grade})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-[#1d1d1f]/50 pointer-events-none absolute right-1" />
                    </div>

                    {/* 학생 전용 링크 복사 버튼 */}
                    <button
                      type="button"
                      onClick={handleCopyCurrentStudentLink}
                      className="ml-1 p-1 rounded-lg hover:bg-black/5 active:bg-black/10 text-black/60 hover:text-[#0071e3] transition-colors shrink-0 cursor-pointer"
                      title="이 학생의 학부모 전용 링크 복사"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* 원장님 모드일 때: Apple Segmented Control (원장님 모드 왼쪽, 학부모 모드 오른쪽) */
              <>
                {/* 1. 원장님 모드 (왼쪽 - Active) */}
                <button
                  type="button"
                  onClick={() => setAppMode('admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold bg-white text-[#1d1d1f] shadow-[0_2px_10px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.08)] transition-all cursor-default"
                >
                  <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0071e3] shrink-0" />
                  <span>원장님 모드</span>
                  <span className="hidden md:inline text-[10px] text-[#1d1d1f]/50 font-normal">(와이드)</span>
                </button>

                {/* 2. 학부모 모드 전환 버튼 (오른쪽) */}
                <button
                  type="button"
                  onClick={() => {
                    setAppMode('parent');
                    if (sortedStudents.length > 0 && !currentStudentId) {
                      setCurrentStudentId(sortedStudents[0].id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98]"
                  title="학부모 모드로 전환"
                >
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0071e3] shrink-0" />
                  <span>학부모 모드</span>
                  <span className="hidden md:inline text-[10px] opacity-60 font-normal">(모바일)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 우측: 시뮬레이션 날짜 & 원장님 보안 제어 (열쇠 아이콘 + 화면잠금) */}
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

          {/* PWA 앱 설치 버튼 (원장님 모드일 때만 표시, 학부모 모드로 진입 시 숨김 처리) */}
          {!isStandalone && appMode === 'admin' && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('pianoslot:open-install-guide'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-[#0071e3]/25 text-white/90 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer active:scale-95"
              title="스마트폰/PC 바탕화면에 앱으로 설치하기"
            >
              <Download className="w-3.5 h-3.5 text-[#0071e3]" />
              <span className="hidden sm:inline text-[11px] font-bold">앱 설치</span>
            </button>
          )}

          {/* 원장님 신규 보강 예약 알림 벨 & 레드 닷 배지 (Feature 3) */}
          {appMode === 'admin' && isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white transition-all cursor-pointer active:scale-95"
              title="새로 접수된 보강 예약 알림"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff9500]" />
              {unreadBookingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#ff3b30] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-pulse ring-2 ring-[#1d1d1f]">
                  {unreadBookingCount > 9 ? '9+' : unreadBookingCount}
                </span>
              )}
            </button>
          )}

          {/* 원장님 보안 도구: 비밀번호 변경(열쇠) 및 화면잠금 (기존 '잠금' 자리로 통합 배치) */}
          {appMode === 'admin' && isAdminAuthenticated && (
            <div className="flex items-center gap-1 bg-white/[0.08] p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.12] transition-all cursor-pointer"
                title="원장님 비밀번호 변경"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={logoutAdmin}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#ff453a] hover:bg-white/[0.12] transition-all cursor-pointer active:scale-95"
                title="원장님 모드 화면 즉시 잠금"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-semibold">화면잠금</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 원장님 비밀번호 변경 모달 */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
};
