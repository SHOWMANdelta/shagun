import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  CalendarCheck,
  Award,
  Bell,
  GraduationCap,
  Users,
  ArrowRight,
  Database,
  Server,
} from 'lucide-react';

const MODULE_HIGHLIGHTS = [
  { icon: GraduationCap, title: 'Students & Academics', desc: 'Programs, batches, subjects and CSV enrolment' },
  { icon: CalendarCheck, title: 'Smart Attendance', desc: 'Atomic daily registers with IST-safe dates' },
  { icon: Award, title: 'Marks & Results', desc: '10-point SGPA grading, controlled publishing' },
  { icon: Bell, title: 'Campus Notices', desc: 'Role, batch and semester targeted announcements' },
];

const FEATURE_BADGES = [
  { icon: ShieldCheck, label: 'Role-based access (Admin / Faculty / Student)' },
  { icon: Database, label: 'PostgreSQL with audited 3NF schema' },
  { icon: Server, label: 'Session auth, rate-limited & helmet-hardened' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('DemoPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string) => {
    setIdentifier(id);
    setPassword('DemoPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-screen flex bg-[#0a2e34]">
      {/* ===== Left: Landing / brand panel ===== */}
      <section className="hidden lg:flex flex-col justify-between w-[46%] max-w-[720px] relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-[#083a44] text-white">
        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute top-1/3 -left-28 w-80 h-80 rounded-full bg-teal-300/10" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:22px_22px]" aria-hidden="true" />

        <div className="relative p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-brand-800 flex items-center justify-center font-extrabold text-sm tracking-widest shadow-card-lg">
              ERP
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight">Mini College ERP System</div>
              <div className="text-eyebrow text-teal-200/80 mt-0.5">Unified Campus Management</div>
            </div>
          </div>

          <h1 className="mt-10 text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            One console for your
            <span className="block text-teal-300">entire campus.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-teal-50/80 max-w-md">
            A complete college management suite built for daily academic operations —
            enrol students, track attendance hour by hour, publish verified results and
            announce notices to the right audience, all with role-aware dashboards.
          </p>

          {/* Module cards */}
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-xl">
            {MODULE_HIGHLIGHTS.map((m) => (
              <div
                key={m.title}
                className="rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm p-3.5 hover:bg-white/[0.12] transition-colors"
              >
                <m.icon size={18} className="text-teal-300 mb-2" />
                <div className="text-[12.5px] font-bold tracking-tight">{m.title}</div>
                <div className="text-[11px] text-teal-100/60 mt-0.5 leading-snug">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: feature badges + credits */}
        <div className="relative p-10 xl:p-14 pt-0">
          <ul className="space-y-2 mb-6">
            {FEATURE_BADGES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-[12px] text-teal-50/70">
                <f.icon size={14} className="text-teal-300 shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="text-eyebrow text-teal-200/70">Submitted by</div>
            <div className="mt-0.5 text-sm font-bold tracking-tight">Shagun Kaushal</div>
            <div className="text-eyebrow text-teal-100/60 mt-0.5">
              BCA Project No. 41 by Shagun Kaushal
            </div>
          </div>
        </div>
      </section>

      {/* ===== Right: sign-in panel ===== */}
      <section className="flex-1 flex flex-col bg-[#f4f7f9]">
        {/* Compact brand bar for small screens */}
        <div className="lg:hidden flex items-center gap-3 px-6 pt-8">
          <div className="w-10 h-10 rounded-lg bg-brand-800 text-white flex items-center justify-center font-extrabold text-xs tracking-widest">
            ERP
          </div>
          <div>
            <div className="text-sm font-bold text-brand-900 tracking-tight">Mini College ERP System</div>
            <div className="text-[11px] text-slate-500">BCA Project No. 41 by Shagun Kaushal</div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 w-full">
          <div className="w-full max-w-sm">
            <div className="text-eyebrow text-brand-600">Secure sign in</div>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Use your institution ID — <span className="font-mono text-slate-600">admin</span>,{' '}
              <span className="font-mono text-slate-600">FAC001</span> or{' '}
              <span className="font-mono text-slate-600">24BCA001</span> — to enter your workspace.
            </p>

            <div className="mt-6 bg-white rounded-xl border border-slate-200/80 shadow-card-lg p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <ShieldCheck size={14} className="text-red-500 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50/60 transition focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white"
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
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-bold rounded-lg shadow-card transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating…' : 'Sign In'}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-eyebrow text-slate-400 mb-2 flex items-center gap-2">
                  <Users size={12} />
                  Demo accounts — one-click
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'admin', label: 'Admin' },
                    { id: 'FAC001', label: 'Faculty' },
                    { id: '24BCA001', label: 'Student' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => fillDemo(d.id)}
                      className="py-2 px-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 rounded-lg text-slate-600 hover:text-brand-700 text-[11px] font-bold transition-colors text-center"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10.5px] text-slate-400 font-mono text-center">
                  Demo password: DemoPassword123!
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="px-6 pb-5 text-center text-[11px] text-slate-400">
          <span className="font-semibold">Mini College ERP System</span> — BCA Project by Shagun Kaushal · Project No. 41 · Node · Express · PostgreSQL · React
        </footer>
      </section>
    </div>
  );
}
