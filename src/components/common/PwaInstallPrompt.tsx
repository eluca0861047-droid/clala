import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  useEffect(() => {
    deferredPromptRef.current = deferredPrompt;
  }, [deferredPrompt]);

  useEffect(() => {
    // 1. 이미 앱으로 설치되어 실행 중인지 검사
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. iOS Safari 기기 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Android / Chrome / PC 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      deferredPromptRef.current = promptEvent;
      // 이전에 닫은 적이 없으면 자동 표시
      const dismissed = sessionStorage.getItem('pianoslot_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 헤더나 다른 버튼에서 수동으로 설치 가이드를 열었을 때
    const handleOpenExternal = () => {
      if (isIosDevice) {
        setIsIOSGuideOpen(true);
      } else {
        setShowPrompt(true);
        if (deferredPromptRef.current) {
          deferredPromptRef.current.prompt();
        }
      }
    };
    window.addEventListener('pianoslot:open-install-guide', handleOpenExternal);

    // iOS인 경우 최초 1회 부드럽게 안내
    if (isIosDevice) {
      const dismissed = sessionStorage.getItem('pianoslot_pwa_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 1500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pianoslot:open-install-guide', handleOpenExternal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setIsIOSGuideOpen(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pianoslot_pwa_dismissed', 'true');
  };

  // 이미 설치되어 단독 앱으로 실행 중이면 배너 숨김
  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* 하단 플로팅 PWA 설치 배너 */}
      <div className="no-print fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9990] animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[24px] p-4 border border-black/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.18)] flex items-center justify-between gap-3.5 ring-1 ring-black/[0.05]">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="숙명클라라피아노"
              className="w-11 h-11 rounded-[14px] shadow-sm object-cover shrink-0 border border-black/[0.06]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-[#1d1d1f] tracking-tight truncate">
                  숙명클라라피아노
                </h4>
                <span className="text-[10px] font-extrabold bg-[#0071e3]/10 text-[#0071e3] px-1.5 py-0.2 rounded-full border border-[#0071e3]/20">
                  앱 설치
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] mt-0.5 truncate">
                홈 화면에 추가하여 앱처럼 편리하게 이용하세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="py-2 px-3.5 rounded-[14px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>설치</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS 사파리 전용 홈 화면 추가 방법 안내 팝업 */}
      {isIOSGuideOpen && (
        <div
          className="no-print fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsIOSGuideOpen(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[28px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-black/[0.08] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="숙명클라라" className="w-7 h-7 rounded-[8px]" />
                <h3 className="text-sm font-bold text-[#1d1d1f]">아이폰 홈 화면 앱 설치</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIOSGuideOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:text-[#1d1d1f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#1d1d1f]">
              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-black/[0.02] border border-black/[0.04]">
                <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-[#1d1d1f]">사파리 브라우저 하단 공유 버튼 클릭</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5 flex items-center gap-1">
                    화면 하단 중앙의 공유 아이콘(<Share className="w-3.5 h-3.5 text-[#0071e3] inline" />)을 누릅니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-black/[0.02] border border-black/[0.04]">
                <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-[#1d1d1f]">[홈 화면에 추가] 메뉴 선택</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5 flex items-center gap-1">
                    메뉴 목록에서 <PlusSquare className="w-3.5 h-3.5 text-[#0071e3] inline" /> <strong>홈 화면에 추가</strong>를 누릅니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[16px] bg-black/[0.02] border border-black/[0.04]">
                <div className="w-7 h-7 rounded-full bg-[#34c759]/10 text-[#34c759] flex items-center justify-center font-bold shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#1d1d1f]">우측 상단 [추가] 완료</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    바탕화면에 피아노 학원 앱 아이콘이 생성됩니다.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsIOSGuideOpen(false)}
              className="w-full py-2.5 rounded-[14px] bg-[#0071e3] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </>
  );
};
