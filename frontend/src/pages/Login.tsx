import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/Toast.js';
import { Terminal, Lock, Mail, User, Eye, EyeOff, KeyRound, ArrowRight, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FormMode = 'login' | 'register' | 'forgot';

export default function Login() {
  const [mode, setMode] = useState<FormMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, error: authError } = useAuth();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [tempPassResult, setTempPassResult] = useState<{ tempPass: string; instructions: string } | null>(null);

  const { register: registerField, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setTempPassResult(null);
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
        success('Welcome back to the Vault.', 'Authentication Successful');
      } else if (mode === 'register') {
        await register(data.username, data.email, data.password);
        success('Workspace initialized successfully.', 'Access Granted');
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        });
        const resJson = await res.json();
        if (res.ok) {
          setTempPassResult({
            tempPass: resJson.tempPassword || '',
            instructions: resJson.instructions || ''
          });
          success('Temporary credentials generated.', 'Password Reset');
        } else {
          toastError(resJson.message || 'Failed to request password reset.');
        }
      }
    } catch (err: any) {
      toastError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: FormMode) => {
    setMode(newMode);
    setTempPassResult(null);
    reset();
  };

  return (
    <div className="w-full relative z-10 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[480px] bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]"
      >
        
        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1D9BFF] to-[#0A5D9E] rounded-2xl flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(29,155,255,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <Code2 className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            DevVaulttest1
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-[280px] leading-relaxed">
            {mode === 'login' && 'Authenticate to access your encrypted project environments.'}
            {mode === 'register' && 'Initialize your local authoritative workspace.'}
            {mode === 'forgot' && 'Request emergency access to your vault.'}
          </p>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <AnimatePresence mode="popLayout">
            
            {/* Username field (Register only) */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-slate-300 ml-1">Developer Handle</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-[#4FC3FF] transition-colors">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    {...registerField('username', { 
                      required: mode === 'register' ? 'Handle is required' : false,
                      minLength: { value: 3, message: 'Handle must be at least 3 characters' }
                    })}
                    placeholder="sysadmin"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/60 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-[#4FC3FF] focus:ring-1 focus:ring-[#4FC3FF] transition-all"
                  />
                </div>
                {errors.username && (
                  <p className="text-[10px] text-red-400 font-medium mt-1 ml-1">{errors.username.message}</p>
                )}
              </motion.div>
            )}

            {/* Email field */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <label className="text-xs font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-[#4FC3FF] transition-colors">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  {...registerField('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email format'
                    }
                  })}
                  placeholder="dev@company.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/60 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-[#4FC3FF] focus:ring-1 focus:ring-[#4FC3FF] transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-400 font-medium mt-1 ml-1">{errors.email.message}</p>
              )}
            </motion.div>

            {/* Password field */}
            {mode !== 'forgot' && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-semibold text-slate-300">Master Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      className="text-[10px] text-[#4FC3FF] font-medium hover:text-white transition-colors"
                    >
                      Lost access?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-[#4FC3FF] transition-colors">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerField('password', { 
                      required: 'Master password is required',
                      minLength: { value: 6, message: 'Must be at least 6 characters' }
                    })}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/60 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-[#4FC3FF] focus:ring-1 focus:ring-[#4FC3FF] transition-all font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-[#4FC3FF] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-red-400 font-medium mt-1 ml-1">{errors.password.message}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Temp Password Output */}
          <AnimatePresence>
            {tempPassResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-3"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>Temporary Access Key</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-center select-all font-medium text-emerald-300 tracking-wider text-sm">
                  {tempPassResult.tempPass}
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">{tempPassResult.instructions}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Error Banner */}
          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <p className="text-xs font-medium text-red-400">{authError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-[#1D9BFF] hover:bg-[#1582D8] active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(29,155,255,0.3)] hover:shadow-[0_0_25px_rgba(29,155,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Initialize Session'}
                  {mode === 'register' && 'Provision Account'}
                  {mode === 'forgot' && 'Request Reset Token'}
                </span>
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggles */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center gap-3 text-xs text-slate-500 font-medium">
          {mode === 'login' && (
            <div className="flex items-center gap-2">
              <span>Unregistered system?</span>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className="text-white hover:text-[#4FC3FF] transition-colors underline decoration-slate-700 hover:decoration-[#4FC3FF] underline-offset-4"
              >
                Provision access
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="flex items-center gap-2">
              <span>Existing configuration?</span>
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-white hover:text-[#4FC3FF] transition-colors underline decoration-slate-700 hover:decoration-[#4FC3FF] underline-offset-4"
              >
                Authenticate here
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-white hover:text-[#4FC3FF] transition-colors underline decoration-slate-700 hover:decoration-[#4FC3FF] underline-offset-4 inline-flex items-center gap-1.5"
            >
              Return to primary authentication
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}
