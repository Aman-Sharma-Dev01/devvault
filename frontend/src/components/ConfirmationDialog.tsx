import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative bg-white border border-white rounded-[28px] max-w-md w-full shadow-[20px_20px_40px_rgba(170,200,220,0.25),-15px_-15px_40px_rgba(255,255,255,0.95)] p-6 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 bg-white border border-white text-slate-400 hover:text-[#1D9BFF] rounded-xl shadow-[2px_2px_5px_rgba(170,200,220,0.15)] hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content layout */}
            <div className="flex gap-4">
              <div className={`p-3.5 rounded-[18px] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)] h-fit ${
                isDestructive 
                  ? 'bg-[#FF7D7D]/10 text-[#FF7D7D]' 
                  : 'bg-[#FFC857]/10 text-[#FFC857]'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="font-extrabold text-lg text-[#1E293B] leading-snug">
                  {title}
                </h3>
                <p className="mt-2 text-xs text-[#64748B] font-semibold leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 flex gap-3 justify-end border-t border-[#EAF6FF] pt-4">
              <button
                onClick={onCancel}
                className="px-4.5 py-2.5 bg-white border border-slate-100 hover:bg-[#F4FAFF] rounded-xl text-xs font-bold text-slate-500 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  isDestructive
                    ? 'bg-[#FF7D7D] hover:bg-[#FF7D7D]/90 shadow-[#FF7D7D]/15 hover:scale-[1.02]'
                    : 'bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] shadow-[#1D9BFF]/15 hover:scale-[1.02]'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
