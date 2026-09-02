import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ShieldCheck, Lock, Mail, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import BrandLogo from './BrandLogo';

const DEFAULT_PASSWORD = 'password123';

const Login: React.FC = () => {
  const { login, users, sessionExpiredMessage, setSessionExpiredMessage } = useDatabase();
  const [email, setEmail] = useState('trainer@spark.com');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    window.setTimeout(() => {
      const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matchedUser) {
        setLoading(false);
        setErrorMsg('No account found for that email.');
        return;
      }

      if (rememberMe) localStorage.setItem('spk_remember', '1');
      else localStorage.removeItem('spk_remember');

      setSessionExpiredMessage(null);
      const success = login(email, matchedUser.role);
      setLoading(false);
      if (!success) setErrorMsg('Unable to sign in. Please verify your credentials.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-black text-zinc-800 dark:text-zinc-100 flex font-sans antialiased">
      <div className="hidden lg:flex w-[46%] relative overflow-hidden bg-black text-white flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,9,20,0.35),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(229,9,20,0.18),transparent_40%)]" />
        <div className="relative z-10">
          <BrandLogo size="lg" showWordmark={false} />
        </div>
        <div className="relative z-10 max-w-md space-y-5">
          <p className="text-[#E50914] text-xs font-bold tracking-[0.35em] uppercase">Enterprise Trainer Operations</p>
          <h2 className="text-4xl font-bold leading-tight">Spark powers schedules, real-time attendance, payroll & tax invoices.</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Built for professional training enterprises needing geofenced check-ins, instant live rosters, HR compliance tracking, and tax invoicing.
          </p>
        </div>
        <p className="relative z-10 text-[11px] tracking-wide text-zinc-400">
          A product of <span className="text-white font-semibold">DevLustro Technologies Pvt Ltd</span>
        </p>
      </div>

      <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <BrandLogo size="md" />
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl shadow-black/5">
            <h2 className="text-2xl font-bold tracking-wide text-black dark:text-white">Sign in to Spark</h2>
            <p className="text-sm text-zinc-500 mt-1">Pick a role or sign in with your enterprise credentials.</p>

            {/* Session Expired Notice */}
            {sessionExpiredMessage && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-fadeIn">
                <Clock size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>{sessionExpiredMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-10 text-zinc-900 dark:text-white focus:border-[#E50914] outline-none transition"
                  />
                  <Mail size={16} className="text-zinc-400 absolute top-3.5 left-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                  <button type="button" onClick={() => setForgotOpen(true)} className="text-[11px] text-[#E50914] font-bold">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-10 pr-10 text-zinc-900 dark:text-white focus:border-[#E50914] outline-none transition"
                  />
                  <Lock size={16} className="text-zinc-400 absolute top-3.5 left-3" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute top-3 right-3 text-zinc-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-300 text-[#E50914] focus:ring-0"
                />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Keep me signed in</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E50914] hover:bg-[#b00610] disabled:opacity-70 text-white rounded-xl py-3.5 font-bold tracking-wide transition shadow-lg shadow-red-600/20"
              >
                {loading ? 'Signing in…' : 'Enter Spark'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 text-center mb-3">Enterprise Quick-Switch Profiles</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setEmail(u.email); setPassword(DEFAULT_PASSWORD); setErrorMsg(''); setSessionExpiredMessage(null); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition border ${
                      email === u.email 
                        ? 'bg-[#E50914] text-white border-[#E50914]' 
                        : 'bg-zinc-50 dark:bg-zinc-900 hover:border-[#E50914] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {u.role.replace('_', ' ').toUpperCase()} ({u.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            Enterprise SSO Active · 15-Minute Inactivity Protection
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setForgotOpen(false)}>
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Enterprise Password Assistance</h3>
            <p className="text-sm text-zinc-500 mt-2">
              Please contact your DevLustro IT Administrator or HR department at <strong className="text-[#E50914]">hr@spark.com</strong> to reset your organization credentials.
            </p>
            <button onClick={() => setForgotOpen(false)} className="mt-5 w-full bg-[#E50914] text-white rounded-xl py-2.5 font-bold transition">
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
