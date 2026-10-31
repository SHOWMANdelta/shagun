import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { BookOpen, CalendarCheck, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FacultyStats {
  totalAssignments: number;
  totalSessionsMarked: number;
  assignments: { id: string; code: string; name: string; batch_name: string }[];
}

export function FacultyDashboard() {
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<FacultyStats>('/api/dashboard/stats')
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading faculty dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Workspace</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Teaching Assignments & Course Management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Allocated Courses</span>
            <BookOpen size={16} className="text-teal-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {stats?.totalAssignments ?? 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Sessions Recorded</span>
            <CalendarCheck size={16} className="text-teal-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {stats?.totalSessionsMarked ?? 0}
          </div>
        </div>
      </div>

      {/* Course Assignments List */}
      <div className="bg-white rounded border border-slate-200 p-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
          Assigned Course Sections
        </h2>
        <div className="divide-y divide-slate-100">
          {stats?.assignments?.map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  <span className="font-mono text-teal-800 mr-2">[{a.code}]</span>
                  {a.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Batch: {a.batch_name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/faculty/attendance"
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium flex items-center gap-1"
                >
                  <CalendarCheck size={13} />
                  Attendance
                </Link>
                <Link
                  to="/faculty/marks"
                  className="px-2.5 py-1 text-xs bg-teal-800 hover:bg-teal-900 text-white rounded font-medium flex items-center gap-1"
                >
                  <Award size={13} />
                  Marks
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
          {(!stats?.assignments || stats.assignments.length === 0) && (
            <div className="py-4 text-xs text-slate-400 text-center">No assignments allocated</div>
          )}
        </div>
      </div>
    </div>
  );
}
