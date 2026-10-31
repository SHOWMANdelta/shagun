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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-teal-800 text-white flex items-center justify-center font-bold text-sm tracking-wider">
            ERP
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">Mini College ERP</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono font-medium">
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800">{user.displayName}</div>
            <div className="text-xs font-mono text-slate-500">{user.identifier}</div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100 transition"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex">
        {/* Fixed Sidebar */}
        <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between py-4 select-none shrink-0">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition ${
                    active
                      ? 'bg-teal-50 text-teal-800 font-semibold border-l-2 border-teal-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-teal-700' : 'text-slate-400'} />
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
      <footer className="h-9 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-xs text-slate-500 font-mono">
        <div>Mini College ERP System - BCA Project by Shagun Kaushal</div>
        <div>Project No. 41 | Course: BCA (6 semesters)</div>
      </footer>
    </div>
  );
}
