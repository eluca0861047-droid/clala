import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  hideCancel?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  type = 'warning',
  hideCancel = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-[18px] shrink-0 ${
              type === 'danger' ? 'bg-[#ff3b30]/15 text-[#ff3b30]' :
              type === 'warning' ? 'bg-[#ff9500]/15 text-[#ff9500]' :
              type === 'success' ? 'bg-[#34c759]/15 text-[#34c759]' :
              'bg-[#0071e3]/15 text-[#0071e3]'
            }`}>
              {type === 'danger' && <AlertTriangle className="w-6 h-6" />}
              {type === 'warning' && <AlertTriangle className="w-6 h-6" />}
              {type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {type === 'info' && <Info className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-[#424245] whitespace-pre-line leading-relaxed">
                {description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-full hover:bg-black/[0.05] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-black/[0.02] px-6 py-4 flex items-center justify-end gap-2.5 border-t border-black/[0.05]">
          {!hideCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[16px] font-semibold text-sm text-[#1d1d1f] bg-black/[0.05] hover:bg-black/[0.08] transition-colors active:scale-[0.98]"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-[16px] font-semibold text-sm transition-all active:scale-[0.98] ${
              type === 'danger'
                ? 'bg-[#ff3b30] hover:bg-[#e0352b] text-white shadow-[0_2px_8px_rgba(255,59,48,0.3)]'
                : type === 'warning'
                ? 'bg-[#ff9500] hover:bg-[#e68600] text-white shadow-[0_2px_8px_rgba(255,149,0,0.3)]'
                : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
