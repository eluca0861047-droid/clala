import React from 'react';
import { useReservation } from '../../context/ReservationContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useReservation();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 sm:top-20 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-white/10 bg-[#1d1d1f]/90 text-white backdrop-blur-2xl transition-all animate-in slide-in-from-top-3 duration-300"
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#34c759]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#ff3b30]" />}
              {isWarning && <AlertCircle className="w-5 h-5 text-[#ff9500]" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-[#0071e3]" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold tracking-tight text-white">{toast.title}</h4>
              <p className="text-xs mt-0.5 text-white/80 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
