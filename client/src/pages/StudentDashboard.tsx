import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AttendanceSummaryItem {
  code: string;
  name: string;
  attendance_pct: number;
  total_sessions: number;
  present_count: number;
}

interface SgpaItem {
  semester: number;
  sgpa: number;
  total_credits: number;
}

interface StudentStats {
  attendance: AttendanceSummaryItem[];
  sgpa: SgpaItem[];
}

export function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<StudentStats>('/api/dashboard/stats')
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading academic records...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Progress</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Cumulative Attendance & Semester Grade Performance
        </p>
      </div>

      {/* SGPA Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats?.sgpa?.map((s) => (
          <div key={s.semester} className="bg-white p-4 rounded border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Semester {s.semester} SGPA</span>
              <Award size={16} className="text-teal-700" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {Number(s.sgpa).toFixed(2)}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Credits Completed: {s.total_credits}
            </div>
          </div>
        ))}
      </div>

      {/* Attendance by Subject */}
      <div className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">
          Subject Attendance Monitoring (Threshold: 75%)
        </h2>
        <div className="space-y-4">
          {stats?.attendance?.map((item) => {
            const isShortage = item.attendance_pct < 75;
            return (
              <div key={item.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-800">
                    <span className="font-mono text-teal-800 mr-2">[{item.code}]</span>
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500">
                      {item.present_count}/{item.total_sessions} classes
                    </span>
                    <span
                      className={`font-bold ${
                        isShortage ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {item.attendance_pct}%
                    </span>
                    {isShortage ? (
                      <span title="Attendance Shortage">
                        <AlertTriangle size={14} className="text-red-500" />
                      </span>
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    )}
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isShortage ? 'bg-red-500' : 'bg-teal-700'
                    }`}
                    style={{ width: `${Math.min(100, item.attendance_pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {(!stats?.attendance || stats.attendance.length === 0) && (
            <div className="py-4 text-xs text-slate-400 text-center">
              No session records available for current semester.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
