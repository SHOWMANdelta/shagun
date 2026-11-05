import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  faculty: '/faculty',
  student: '/student',
};

const DEMO_ACCOUNTS: { id: string; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'FAC001', label: 'Faculty' },
  { id: '24BCA001', label: 'Student' },
];
const DEMO_PASSWORD = 'DemoPassword123!';

type Tab = 'otp' | 'password';

export function SignInPage() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>('otp');

  // OTP flow state
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Password flow state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okNote, setOkNote] = useState<string | null>(null);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const demoStartedRef = useRef(false);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const goHome = (role?: string) => {
    navigate(ROLE_HOME[role ?? 'admin'] ?? '/admin', { replace: true });
  };

  // ── Request OTP ──────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setOkNote(null);
    setSending(true);

    try {
      await apiPost('/api/auth/otp/request', { email });
      setOtpSent(true);
      setCooldown(60);
      setOkNote(
        `If ${email.trim()} is registered, a 6-digit code is on its way. It expires in 10 minutes.`
      );
      setTimeout(() => codeInputRefs.current[0]?.focus(), 150);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Try again.');
    } finally {
      setSending(false);
    }
  };

  // ── OTP entry handling ───────────────────────────────────
  const setCodeDigit = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) codeInputRefs.current[idx + 1]?.focus();
    if (digit && idx === 5) {
      const full = next.join('');
      if (full.length === 6) void handleVerifyCode(full);
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyCode = async (fullCode?: string) => {
    const joined = fullCode ?? code.join('');
    if (joined.length !== 6) {
      setError('Enter all 6 digits of the code.');
      return;
    }
    setError(null);
    setOtpSent(true);
    setVerifying(true);

    try {
      const user = await verifyOtp(email.trim(), joined);
      goHome(user.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // ── Password login ───────────────────────────────────────
  const handlePasswordLogin = async (id?: string, pw?: string) => {
    const useId = id ?? identifier;
    const usePw = pw ?? password;
    if (!useId || !usePw) {
      setError('Enter your login ID and password.');
      return;
    }
    setError(null);
    setPwLoading(true);

    try {
      const user = await login(useId, usePw);
      navigate(ROLE_HOME[user.role] ?? '/admin', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setPwLoading(false);
    }
  };

  // ── One-click demo (fully automatic sign-in) ─────────────
  const startDemoLogin = async (demoId: string) => {
    setTab('password');
    setIdentifier(demoId);
    setPassword(DEMO_PASSWORD);
    await handlePasswordLogin(demoId, DEMO_PASSWORD);
  };

  // Auto-start demo when arriving from a landing-card button (?demo=admin)
  const handleSearchParams = async () => {
    const demo = searchParams.get('demo');
    if (demo && !demoStartedRef.current) {
      demoStartedRef.current = true;
      // Clear the query param BEFORE signing in: a navigation to the console
      // followed by setSearchParams would otherwise bounce back to /login.
      searchParams.delete('demo');
      setSearchParams(searchParams, { replace: true });
      await startDemoLogin(demo);
    } else if (!demo) {
      demoStartedRef.current = false;
    }
  };

  useEffect(() => {
    void handleSearchParams();
    // Dependencies: re-run when the query string changes (e.g. demo auto-login)
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      {/* Top bar */}
      <header className="h-16 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-white flex items-center justify-center font-extrabold text-xs tracking-widest shadow-card">
              ERP
            </div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900">Mini College ERP</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </header>

      {/* Sign-in body — split layout */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid lg:grid-cols-[1fr_420px] gap-8 items-center">
          {/* Brand panel */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-[#0b3944] text-white p-8 relative overflow-hidden shadow-card-lg">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-300/10" aria-hidden="true" />
              <div
                className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:22px_22px]"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="text-eyebrow text-teal-300 mb-3">One portal, every role</div>
                <h2 className="font-display text-2xl font-bold leading-snug tracking-tight">
                  Your campus, reduced to
                  <span className="block text-gradient">one clean console.</span>
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    'Admins own enrolment, faculty and the audit trail',
                    'Faculty mark attendance and publish verified marks',
                    'Students track attendance, results and notices live',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[13px] font-medium text-teal-50/85">
                      <ShieldCheck size={15} className="text-teal-300 mt-0.5 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 rounded-xl bg-white/[0.07] border border-white/10 p-4">
                  <div className="flex items-center gap-1.5 text-teal-300">
                    <Mail size={12} /> <span className="text-eyebrow">One-time code</span>
                  </div>
                  <div className="mt-2 font-mono text-lg font-bold tracking-[0.35em]">384 912</div>
                  <div className="text-[10px] font-mono text-teal-100/50 mt-1">emailed by Resend · expires in 10 min</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form column */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="text-center mb-6">
            <div className="text-eyebrow text-brand-600">Secure sign in</div>
            <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Prove it&apos;s you with an emailed code, or your institution ID.
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 rounded-lg mb-5">
            <button
              onClick={() => { setTab('otp'); setError(null); setOkNote(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-[13px] font-bold rounded-md transition-all ${
                tab === 'otp' ? 'bg-white text-brand-700 shadow-card' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Mail size={14} /> Email code
            </button>
            <button
              onClick={() => { setTab('password'); setError(null); setOkNote(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-[13px] font-bold rounded-md transition-all ${
                tab === 'password' ? 'bg-white text-brand-700 shadow-card' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <KeyRound size={14} /> Password
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-card-lg p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2" role="alert">
                <ShieldCheck size={14} className="text-red-500 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {okNote && !error && (
              <div className="mb-4 p-3 bg-brand-50 border border-brand-100 text-brand-800 text-xs rounded-lg flex items-start gap-2">
                <Mail size={14} className="mt-0.5 shrink-0" />
                {okNote}
              </div>
            )}

            {/* ── OTP panel ── */}
            {tab === 'otp' && (
              <div className="space-y-4">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Institution email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={otpSent}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50/60 transition focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white disabled:opacity-70"
                        placeholder="admin@college.edu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sending || cooldown > 0}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg shadow-card transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? 'Resend code' : 'Send my code'}
                    {!sending && cooldown === 0 && <ArrowRight size={15} />}
                  </button>
                </form>

                {otpSent && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider text-center">
                      Enter your 6-digit code
                    </label>
                    <div className="flex gap-2 justify-center" role="group" aria-label="6 digit code">
                      {code.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { codeInputRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={d}
                          onChange={(e) => setCodeDigit(i, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(i, e)}
                          maxLength={1}
                          className={`w-12 h-14 text-center text-xl font-bold font-mono border rounded-lg transition focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
                            d ? 'border-brand-500 bg-gradient-to-b from-brand-50 to-white text-brand-800 shadow-card' : 'border-slate-300 bg-slate-50/60'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => void handleVerifyCode()}
                      disabled={verifying || code.join('').length < 6}
                      className="mt-4 w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-bold rounded-lg shadow-card transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {verifying ? 'Verifying…' : 'Verify & sign in'} <ArrowRight size={15} />
                    </button>
                    <button
                      onClick={() => { setOtpSent(false); setCode(['', '', '', '', '', '']); setOkNote(null); }}
                      className="mt-2.5 w-full text-[12px] font-semibold text-slate-500 hover:text-brand-700 transition-colors"
                    >
                      Use a different email
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Password panel ── */}
            {tab === 'password' && (
              <form onSubmit={(e) => { e.preventDefault(); void handlePasswordLogin(); }} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Login ID / Identifier
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <UserIcon size={15} />
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-sm font-mono border border-slate-300 rounded-lg bg-slate-50/60 transition focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white"
                      placeholder="admin / FAC001 / 24BCA001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50/60 transition focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg shadow-card transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pwLoading ? 'Signing in…' : 'Sign In'} <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>

          {/* One-click demo accounts — actually sign you in */}
          <div className="mt-5 bg-white/60 border border-slate-200/70 rounded-xl p-4">
            <div className="text-eyebrow text-slate-400 mb-2.5 flex items-center gap-2 text-center justify-center">
              <UserIcon size={12} /> One-click demo — takes you straight in
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => void startDemoLogin(d.id)}
                  disabled={pwLoading}
                  className="py-2 px-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 rounded-lg text-slate-600 hover:text-brand-700 text-[11px] font-bold transition-colors text-center disabled:opacity-50"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
      </main>

      <footer className="px-6 pb-6 text-center text-[11px] text-slate-400">
        <span className="font-semibold">Mini College ERP System</span> — Campus Management Suite
      </footer>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────
async function apiPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'erp' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || `HTTP error ${res.status}`);
  return data;
}
