import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { Eye, EyeOff } from 'lucide-react';

export const AdminLockScreen: React.FC = () => {
  const { loginAdmin } = useReservation();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setErrorMessage('비밀번호를 입력해주세요.');
      triggerShake();
      return;
    }

    // 로그인 유지(true)로 자동 처리
    const success = loginAdmin(pin.trim(), true);
    if (!success) {
      setErrorMessage('비밀번호가 올바르지 않습니다.');
      triggerShake();
      setPin('');
    } else {
      setErrorMessage('');
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden select-none bg-[#1d1d1f]">
      {/* 배경 은은한 애플 앰비언트 글로우 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] bg-[#0071e3]/12 rounded-full blur-[100px] pointer-events-none" />

      {/* 중앙 메인 카드 */}
      <div
        className={`w-full max-w-sm bg-[#2c2c2e]/80 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-7 sm:p-8 flex flex-col items-center relative z-10 transition-transform duration-200 ${
          isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        {/* 맨 위 그림 (로고 아이콘) */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] border border-white/20 mb-4 overflow-hidden">
          <img
            src="/logo.png"
            alt="숙명클라라피아노 로고"
            className="w-full h-full object-contain"
          />
        </div>

        {/* 숙명클라라피아노 타이틀 */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-6 text-center">
          숙명클라라피아노
        </h2>

        {/* 비밀번호 입력 폼 */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMessage('');
              }}
              placeholder="비밀번호 입력"
              autoFocus
              className="w-full px-4 pr-11 py-3 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.12] border border-white/15 focus:border-[#0071e3] rounded-2xl text-white text-center text-base sm:text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all placeholder:text-white/35 placeholder:tracking-normal placeholder:text-sm"
            />
            {/* 오른쪽 눈그림 */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors cursor-pointer"
              title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <p className="text-xs text-[#ff453a] text-center font-medium animate-fade-in">
              {errorMessage}
            </p>
          )}

          {/* 파란창 접속 버튼 */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] text-white font-bold text-sm sm:text-[15px] shadow-[0_4px_16px_rgba(0,113,227,0.4)] transition-all flex items-center justify-center cursor-pointer"
          >
            접속
          </button>
        </form>
      </div>
    </div>
  );
};
