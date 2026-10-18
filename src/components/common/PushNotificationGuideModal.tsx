import React from 'react';
import { DeviceNotificationDiagnosis } from '../../services/pushNotificationService';
import {
  Smartphone,
  ShieldAlert,
  Apple,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface PushNotificationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: DeviceNotificationDiagnosis | null;
  onRetry?: () => void;
}

export const PushNotificationGuideModal: React.FC<PushNotificationGuideModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  onRetry,
}) => {
  if (!isOpen || !diagnosis) return null;

  const isIOS = diagnosis.statusType === 'ios_needs_pwa';
  const isInsecure = diagnosis.statusType === 'insecure_http';
  const isInApp = diagnosis.statusType === 'in_app_browser';
  const isDenied = diagnosis.statusType === 'denied';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.25)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="p-5 sm:p-6 border-b border-black/[0.05] flex items-start gap-4 bg-black/[0.01]">
          <div
            className={`w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 shadow-sm ${
              isIOS
                ? 'bg-black text-white'
                : isInsecure
                ? 'bg-[#ff9500]/15 text-[#ff9500]'
                : isDenied
                ? 'bg-[#ff3b30]/15 text-[#ff3b30]'
                : 'bg-[#0071e3]/15 text-[#0071e3]'
            }`}
          >
            {isIOS && <Apple className="w-6 h-6" />}
            {isInsecure && <ShieldAlert className="w-6 h-6" />}
            {isInApp && <ExternalLink className="w-6 h-6" />}
            {isDenied && <Smartphone className="w-6 h-6" />}
            {!isIOS && !isInsecure && !isInApp && !isDenied && (
              <Smartphone className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                모바일 알림 설정 가이드
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full hover:bg-black/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight mt-0.5">
              {diagnosis.title}
            </h3>
            <p className="text-xs text-[#424245] mt-1.5 leading-relaxed">
              {diagnosis.description}
            </p>
          </div>
        </div>

        {/* 단계별 해결 가이드 */}
        <div className="p-5 sm:p-6 space-y-3 overflow-y-auto max-h-[55vh]">
          <h4 className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>해결 방법 및 설정 순서</span>
          </h4>

          <div className="space-y-2">
            {diagnosis.guideSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-[16px] bg-black/[0.02] border border-black/[0.04] text-xs text-[#1d1d1f] leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-[#0071e3] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium">{step}</span>
              </div>
            ))}
          </div>

          {/* 시스템 정상 작동 안내 박스 */}
          <div className="mt-3 p-3.5 rounded-[18px] bg-blue-50/60 border border-blue-100/80 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0071e3]">
                알림 기능은 이미 완벽히 연동되어 있습니다
              </p>
              <p className="mt-0.5 text-blue-800/80">
                스마트폰 보안 규정(HTTPS / 홈 화면 추가)에 따라 설정이 완료되면, 화면이 꺼져 있어도 보강 예약 접수 시 진동과 함께 잠금화면 배너가 즉각 울립니다.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 바 */}
        <div className="bg-black/[0.02] px-6 py-4 flex items-center justify-end gap-2.5 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[16px] font-semibold text-xs text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(0,113,227,0.3)] cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
