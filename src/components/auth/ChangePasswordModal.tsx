import React, { useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { KeyRound, X, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changeAdminPassword } = useReservation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      setErrorMessage('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMessage('새 비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    const res = changeAdminPassword(oldPassword.trim(), newPassword.trim());
    if (!res.success) {
      setErrorMessage(res.error || '비밀번호 변경에 실패했습니다.');
      return;
    }

    // 초기화 및 닫기
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-black/10 overflow-hidden animate-scale-up">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-black/[0.08] flex items-center justify-between bg-[#f5f5f7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f]">원장님 비밀번호 변경</h3>
              <p className="text-[11px] text-[#86868b]">관리자 모드 접속 시 사용할 암호를 설정합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              현재 비밀번호 <span className="text-[#86868b] font-normal">(초기값: 1234)</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="현재 비밀번호 입력"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]"
              />
              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/40 hover:text-black/70"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              새 비밀번호 <span className="text-[#86868b] font-normal">(4자리 이상 권장)</span>
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrorMessage('');
              }}
              placeholder="새로운 비밀번호 입력"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]"
            />
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              새 비밀번호 재입력 확인
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage('');
              }}
              placeholder="새 비밀번호 다시 한 번 입력"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]"
            />
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <p className="text-xs text-[#ff3b30] font-medium bg-[#ff3b30]/10 p-2.5 rounded-xl border border-[#ff3b30]/20">
              {errorMessage}
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1d1d1f]/70 hover:bg-black/5 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>비밀번호 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
