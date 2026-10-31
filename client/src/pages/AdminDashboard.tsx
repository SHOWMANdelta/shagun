import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { Users, GraduationCap, BookOpen, Layers, Bell, ShieldCheck } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalBatches: number;
  totalSubjects: number;
  latestNotices: { id: string; title: string; created_at: string }[];
  recentAudit: { id: string; table_name: string; action: string; changed_at: string }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<StatsData>('/api/dashboard/stats')
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading console statistics...</div>;
  }

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: GraduationCap },
    { label: 'Faculty Members', value: stats?.totalFaculty ?? 0, icon: Users },
    { label: 'Active Batches', value: stats?.totalBatches ?? 0, icon: Layers },
    { label: 'Curriculum Subjects', value: stats?.totalSubjects ?? 0, icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Overview</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Mini College ERP Console • System Status & Operations
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                <Icon size={16} className="text-teal-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Notices & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Notices */}
        <div className="bg-white rounded border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Bell size={14} className="text-teal-700" />
              Recent Announcements
            </h2>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {stats?.latestNotices?.map((n) => (
              <div key={n.id} className="py-2.5">
                <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {(!stats?.latestNotices || stats.latestNotices.length === 0) && (
              <div className="py-4 text-xs text-slate-400 text-center">No recent circulars</div>
            )}
          </div>
        </div>

        {/* Audit Trail Preview */}
        <div className="bg-white rounded border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal-700" />
              Recent System Modifications
            </h2>
          </div>
          <div className="divide-y divide-slate-100 mt-2">
            {stats?.recentAudit?.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{a.table_name}</span>
                  <span className="text-slate-400 mx-1">•</span>
                  <span className="text-slate-500">{new Date(a.changed_at).toLocaleTimeString()}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-bold uppercase">
                  {a.action}
                </span>
              </div>
            ))}
            {(!stats?.recentAudit || stats.recentAudit.length === 0) && (
              <div className="py-4 text-xs text-slate-400 text-center">No recent audit events</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
