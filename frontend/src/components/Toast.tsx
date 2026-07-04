import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', title?: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((msg: string, title = 'Success') => toast(msg, 'success', title), [toast]);
  const error = useCallback((msg: string, title = 'Error') => toast(msg, 'error', title), [toast]);
  const warning = useCallback((msg: string, title = 'Warning') => toast(msg, 'warning', title), [toast]);
  const info = useCallback((msg: string, title = 'Info') => toast(msg, 'info', title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      
      {/* Toast Render Area */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => {
            let bgClass = '';
            let borderClass = '';
            let textClass = 'text-[#1E293B]';
            let icon = null;

            switch (t.type) {
              case 'success':
                bgClass = 'bg-[#42D392]/10';
                icon = <CheckCircle className="w-5 h-5 text-[#42D392]" />;
                break;
              case 'error':
                bgClass = 'bg-[#FF7D7D]/10';
                icon = <AlertCircle className="w-5 h-5 text-[#FF7D7D]" />;
                break;
              case 'warning':
                bgClass = 'bg-[#FFC857]/10';
                icon = <AlertTriangle className="w-5 h-5 text-[#FFC857]" />;
                break;
              default:
                bgClass = 'bg-[#33A9FF]/10';
                icon = <Info className="w-5 h-5 text-[#33A9FF]" />;
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="p-4 bg-white/95 border border-white rounded-[22px] flex gap-3 shadow-[10px_10px_24px_rgba(170,200,220,0.18),-5px_-5px_15px_rgba(255,255,255,0.95)] backdrop-blur-md"
              >
                <div className={`p-2 rounded-xl flex-shrink-0 h-fit shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)] ${bgClass}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  {t.title && <h4 className="font-extrabold text-xs text-[#1E293B] mb-0.5">{t.title}</h4>}
                  <p className="text-[11px] font-bold text-[#64748B] leading-relaxed">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 p-1.5 bg-white border border-slate-50 hover:bg-[#F4FAFF] hover:scale-[1.03] text-slate-400 hover:text-[#1D9BFF] rounded-lg shadow-sm transition-all self-start"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
