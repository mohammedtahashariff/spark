import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ShieldCheck, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import BrandLogo from './BrandLogo';

const DEMO_PASSWORD = 'password123';

const Login: React.FC = () => {
  const { login, users } = useDatabase();
  const [email, setEmail] = useState('trainer@spark.com');
  const [password, setPassword] = useState(DEMO_PASSWORD);
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
      if (password !== DEMO_PASSWORD) {
        setLoading(false);
        setErrorMsg(`Invalid password. Demo password is ${DEMO_PASSWORD}.`);
        return;
      }

      const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matchedUser) {
        setLoading(false);
        setErrorMsg('No account found for that email.');
        return;
      }

      if (rememberMe) localStorage.setItem('spk_remember', '1');
      else localStorage.removeItem('spk_remember');

      const success = login(email, matchedUser.role);
      setLoading(false);
      if (!success) setErrorMsg('Unable to sign in. Please try a demo account.');
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
          <p className="text-[#E50914] text-xs font-bold tracking-[0.35em] uppercase">Trainer operations</p>
          <h2 className="text-4xl font-bold leading-tight">Spark runs schedules, attendance, payroll and billing in one place.</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Built for training companies that need campus check-ins, class reports, reimbursements and client invoices without switching tools.
          </p>
        </div>
        <p className="relative z-10 text-[11px] tracking-wide text-zinc-400">
          A product of <span className="text-white font-semibold">DevLustro technologies pvt ltd</span>
        </p>
      </div>

      <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <BrandLogo size="md" />
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl shadow-black/5">
            <h2 className="text-2xl font-bold tracking-wide text-black dark:text-white">Sign in to Spark</h2>
            <p className="text-sm text-zinc-500 mt-1">Pick a demo role or use the seeded credentials.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
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
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-10 text-zinc-900 dark:text-white"
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
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-10 pr-10 text-zinc-900 dark:text-white"
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
                className="w-full bg-[#E50914] hover:bg-[#b00610] disabled:opacity-70 text-white rounded-xl py-3.5 font-bold tracking-wide"
              >
                {loading ? 'Signing in…' : 'Enter Spark'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 text-center mb-3">Demo accounts</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setErrorMsg(''); }}
                    className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 hover:border-[#E50914] border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold tracking-wide text-zinc-700 dark:text-zinc-300"
                  >
                    {u.role.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            Demo workspace · {DEMO_PASSWORD}
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setForgotOpen(false)}>
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Reset password</h3>
            <p className="text-sm text-zinc-500 mt-2">
              This is a demo. Every seeded account uses <strong className="text-[#E50914]">{DEMO_PASSWORD}</strong>.
            </p>
            <button onClick={() => setForgotOpen(false)} className="mt-5 w-full bg-black text-white rounded-xl py-2.5 font-bold">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
