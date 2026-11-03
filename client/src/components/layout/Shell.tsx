import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  Bell,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Faculty', path: '/admin/faculty', icon: Users },
    { label: 'Academics', path: '/admin/academics', icon: BookOpen },
    { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { label: 'Results & Marks', path: '/admin/marks', icon: Award },
    { label: 'Notices', path: '/admin/notices', icon: Bell },
    { label: 'Audit Trail', path: '/admin/audit', icon: ShieldAlert },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const facultyNav = [
    { label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { label: 'Attendance', path: '/faculty/attendance', icon: CalendarCheck },
    { label: 'Marks Entry', path: '/faculty/marks', icon: Award },
    { label: 'Notices', path: '/faculty/notices', icon: Bell },
  ];

  const studentNav = [
    { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { label: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
    { label: 'My Results', path: '/student/results', icon: Award },
    { label: 'Notices', path: '/student/notices', icon: Bell },
  ];

  const navItems = user.role === 'admin' ? adminNav : user.role === 'faculty' ? facultyNav : studentNav;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9] text-slate-800">
      {/* Top Header */}
      <header className="h-14 bg-white/90 backdrop-blur border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-white flex items-center justify-center font-extrabold text-xs tracking-widest shadow-card">
            ERP
          </div>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">Mini College ERP</span>
          <span className="text-eyebrow px-2 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-100">
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 tracking-tight">{user.displayName}</div>
            <div className="text-[11px] font-mono text-slate-500">{user.identifier}</div>
          </div>
          <div className="w-px h-6 bg-slate-200" aria-hidden="true" />
          <button
            onClick={() => logout()}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex">
        {/* Fixed Sidebar */}
        <aside className="w-56 bg-white border-r border-slate-200/80 flex flex-col justify-between py-4 select-none shrink-0">
          <nav className="space-y-0.5 px-3">
            <div className="text-eyebrow text-slate-400 px-3 pb-2 pt-1">Main menu</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition ${
                    active
                      ? 'bg-brand-50 text-brand-800 shadow-card font-bold'
                      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full transition-all ${
                      active ? 'bg-brand-600' : 'bg-transparent group-hover:bg-slate-200'
                    }`}
                  />
                  <Icon size={16} className={active ? 'text-brand-600' : 'text-slate-400'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 text-[10px] text-slate-400 font-mono">
            Session: 2026-27 (BCA)
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* App Footer */}
      <footer className="h-9 bg-white border-t border-slate-200/80 flex items-center justify-between px-6 text-[11px] text-slate-500">
        <div className="font-semibold tracking-tight">Mini College ERP System — BCA Project by Shagun Kaushal</div>
        <div className="font-mono">Project No. 41 | Course: BCA (6 semesters)</div>
      </footer>
    </div>
  );
}
