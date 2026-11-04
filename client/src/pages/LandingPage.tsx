import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  Bell,
  ShieldCheck,
  Database,
  Zap,
  LayoutDashboard,
  ArrowRight,
  MoveRight,
  Users,
  BookOpenCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Three role consoles',
    desc: 'Admin, faculty and student each get a purpose-built dashboard — no menus they cannot use.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance that stays honest',
    desc: 'Atomic daily registers with IST-safe dates, ON CONFLICT re-saves and a faculty edit window.',
  },
  {
    icon: Award,
    title: 'Verified results pipeline',
    desc: 'Marks enter against max-marks triggers, publish in one click, SGPA computes to the 10-point scale.',
  },
  {
    icon: Bell,
    title: 'Notices that reach people',
    desc: 'Target by role, batch or semester; expiry and unread tracking built in.',
  },
  {
    icon: ShieldCheck,
    title: 'Security by default',
    desc: 'Session auth with lockout, rate limiting, CSRF guards, helmet headers and a full audit trail.',
  },
  {
    icon: Database,
    title: 'Serious data layer',
    desc: 'A normalised PostgreSQL schema with triggers, constraints and indexed access paths.',
  },
];

const MODULES = [
  { icon: GraduationCap, label: 'Students & Academics' },
  { icon: CalendarCheck, label: 'Attendance' },
  { icon: Award, label: 'Marks & Results' },
  { icon: Bell, label: 'Notices' },
  { icon: Users, label: 'Faculty Assignments' },
  { icon: BookOpenCheck, label: 'SGPA Reports' },
];

const ROLES = [
  {
    icon: ShieldCheck,
    title: 'Administrator',
    desc: 'Own the institution: enrol students, manage faculty, publish notices and watch the audit trail.',
    demo: 'admin',
    cta: 'Open Admin console',
  },
  {
    icon: CalendarCheck,
    title: 'Faculty',
    desc: 'Mark attendance in seconds, enter marks, and post notices to exactly the right batches.',
    demo: 'FAC001',
    cta: 'Open Faculty console',
  },
  {
    icon: GraduationCap,
    title: 'Student',
    desc: 'Track your own attendance, view published results and SGPA, and never miss a circular.',
    demo: '24BCA001',
    cta: 'Open Student console',
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800">
      {/* ===== Nav ===== */}
      <header className="sticky top-0 z-30 bg-[#f4f7f9]/80 backdrop-blur border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-white flex items-center justify-center font-extrabold text-xs tracking-widest shadow-card">
              ERP
            </div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900">
              Mini College ERP
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-slate-600">
            <button onClick={() => scrollToId('features')} className="hover:text-brand-700 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToId('modules')} className="hover:text-brand-700 transition-colors">
              Modules
            </button>
            <button onClick={() => scrollToId('roles')} className="hover:text-brand-700 transition-colors">
              Consoles
            </button>
            <button onClick={() => scrollToId('peek')} className="hover:text-brand-700 transition-colors">
              Peek inside
            </button>
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold px-4 py-2 rounded-lg shadow-card transition-colors"
          >
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-700 to-[#0b3944]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:22px_22px]" aria-hidden="true" />
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-teal-300/10" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <div className="text-eyebrow text-teal-300 mb-4">Campus management, unified</div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.08] tracking-tight">
              Run your entire college
              <span className="block text-teal-300">from one console.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-teal-50/80 max-w-md">
              Enrol students, take attendance, publish verified results and tell the right
              people the right things — with three crisp role dashboards and a security
              model your auditor will like.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => scrollToId('peek')}
                className="inline-flex items-center gap-2 bg-white text-brand-800 text-sm font-bold px-5 py-2.5 rounded-lg shadow-card-lg hover:bg-teal-50 transition-colors"
              >
                Peek inside <MoveRight size={15} />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-white/25 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Sign in <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-teal-100/70">
              {[
                { k: '3', v: 'consoles' },
                { k: '9', v: 'modules' },
                { k: 'OTP', v: 'sign-in' },
              ].map((s) => (
                <div key={s.v}>
                  <div className="text-xl font-extrabold text-white font-mono">{s.k}</div>
                  <div className="text-eyebrow text-teal-200/60 mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Peek: mock console preview */}
          <div id="peek" className="relative lg:pl-6">
            <div className="relative rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-teal-300/20 to-white/10 blur-xl" aria-hidden="true" />
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-card-lg border border-white/40">
                {/* Window bar */}
                <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 px-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-[10px] font-mono text-slate-400 truncate max-w-[220px]">
                    erp.college /admin — dashboard
                  </span>
                </div>
                <div className="flex">
                  {/* Mini sidebar */}
                  <div className="w-32 bg-white border-r border-slate-100 p-3 space-y-1.5 hidden sm:block">
                    <span className="text-eyebrow text-slate-400 block px-2 pb-1">Main menu</span>
                    {['Dashboard', 'Students', 'Faculty', 'Attendance', 'Marks', 'Notices'].map((i, idx) => (
                      <div key={i} className={`text-[11px] font-semibold px-2 py-1 rounded-md ${idx === 0 ? 'bg-brand-50 text-brand-700' : 'text-slate-400'}`}>
                        {i}
                      </div>
                    ))}
                  </div>
                  {/* Mini content */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { l: 'Students', v: '4', bar: 'w-3/4' },
                        { l: 'Faculty', v: '2', bar: 'w-1/2' },
                        { l: 'Batches', v: '1', bar: 'w-2/3' },
                        { l: 'Subjects', v: '7', bar: 'w-5/6' },
                      ].map((c) => (
                        <div key={c.l} className="rounded-lg border border-slate-200/80 p-2">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.l}</div>
                          <div className="text-lg font-extrabold font-mono text-slate-800">{c.v}</div>
                          <div className="h-1 rounded bg-slate-100 mt-1 overflow-hidden">
                            <div className={`h-full rounded bg-brand-500 ${c.bar}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-slate-200/80 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-eyebrow text-slate-400">Recent announcements</span>
                        <Zap size={12} className="text-amber-400" />
                      </div>
                      <div className="space-y-1.5">
                        {['Mid-Term Exam Schedule', 'Library hours extended', 'SGPA results published'].map((n, i) => (
                          <div key={n} className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-600">{n}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${i === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                              {i === 0 ? 'pinned' : 'sent'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notice slip */}
            <div className="absolute -bottom-6 -left-2 sm:-left-6 w-44 rounded-xl bg-white shadow-card-lg border border-slate-200/80 p-3 -rotate-3">
              <div className="flex items-center gap-1.5 text-brand-700">
                <Bell size={12} />
                <span className="text-eyebrow">Notice sent</span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-slate-600 leading-snug">
                Mid-Term schedule → batch BCA-2024-2027
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="text-eyebrow text-brand-600 mb-2">Why it clicks</div>
        <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-900">
          Built for the way a college actually works
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white rounded-lg border border-slate-200/80 shadow-card p-5 hover:shadow-card-lg hover:-translate-y-0.5 transition-all"
            >
              <span className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                <f.icon size={17} className="text-brand-600" />
              </span>
              <h3 className="mt-3 text-sm font-extrabold tracking-tight text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Modules strip ===== */}
      <section id="modules" className="scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-xl bg-gradient-to-br from-brand-800 to-brand-900 text-white p-8 xl:p-10 shadow-card-lg relative overflow-hidden">
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-teal-300/10" aria-hidden="true" />
            <div className="text-eyebrow text-teal-300 mb-2">Everything under one roof</div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Six modules, one database, zero spreadsheets
            </h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODULES.map((m) => (
                <div key={m.label} className="flex items-center gap-2.5 rounded-lg bg-white/[0.07] border border-white/10 px-3.5 py-3 hover:bg-white/[0.12] transition-colors">
                  <m.icon size={15} className="text-teal-300" />
                  <span className="text-[12.5px] font-bold tracking-tight">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Consoles / roles ===== */}
      <section id="roles" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="text-eyebrow text-brand-600 mb-2">Pick your seat</div>
        <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-900">
          A console for every role
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <div key={r.title} className="bg-white rounded-xl border border-slate-200/80 shadow-card p-5 flex flex-col">
              <span className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                <r.icon size={18} className="text-brand-600" />
              </span>
              <h3 className="mt-3 text-sm font-extrabold tracking-tight text-slate-900">{r.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500 flex-1">{r.desc}</p>
              <button
                onClick={() => navigate(`/login?demo=${r.demo}`)}
                className="mt-4 inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold px-4 py-2.5 rounded-lg shadow-card transition-colors w-full"
              >
                {r.cta} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Bottom CTA ===== */}
      <section className="border-t border-slate-200/70 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
              Have your institution ID ready?
            </h3>
            <p className="text-[13px] text-slate-500 mt-1">
              Get a one-time code by email — no password required.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-card transition-colors shrink-0"
          >
            Sign in with email <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-[#0a2e34] text-teal-100/60">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center font-extrabold text-[9px] tracking-widest text-white">ERP</div>
            <span className="font-semibold text-white/85">Mini College ERP System</span>
          </div>
          <div className="font-mono">Node · Express · PostgreSQL · React · Resend</div>
        </div>
      </footer>
    </div>
  );
}
