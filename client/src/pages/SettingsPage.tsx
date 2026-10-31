import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { ShieldCheck, Info } from 'lucide-react';

interface SettingsData {
  collegeName: string;
  universityName: string;
  studentName: string;
  projectTitle: string;
  projectNo: number;
  course: string;
  session: string;
  attendanceThreshold: number;
  passPercent: number;
  attendanceEditWindowDays: number;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<SettingsData>('/api/settings')
      .then(setSettings)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & About</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Project Parameters, Institutional Constants & Credits
        </p>
      </div>

      {/* Mandatory About block in Settings */}
      <div className="bg-white rounded border border-slate-200 p-5 space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Info size={15} className="text-teal-700" />
          About This Project
        </h2>
        <div className="text-xs text-slate-600 leading-relaxed font-sans">
          This system is the final-year Bachelor of Computer Applications (BCA) capstone project developed by{' '}
          <strong className="text-slate-900 font-semibold">{settings?.studentName}</strong> (Project No. {settings?.projectNo}).
          Engineered with an enterprise relational PostgreSQL foundation, strictly enforcing Third Normal Form (3NF),
          stateless atomic transactions, custom advisory-locked migrations, and layered authorization guards.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 font-mono text-[11px] text-slate-500">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-slate-400 block text-[10px]">CANDIDATE</span>
            <span className="font-semibold text-slate-800">{settings?.studentName}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-slate-400 block text-[10px]">PROJECT NO</span>
            <span className="font-semibold text-slate-800">{settings?.projectNo}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-slate-400 block text-[10px]">COURSE</span>
            <span className="font-semibold text-slate-800">{settings?.course}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-slate-400 block text-[10px]">ACADEMIC SESSION</span>
            <span className="font-semibold text-slate-800">{settings?.session}</span>
          </div>
        </div>
      </div>

      {/* Institutional Profile */}
      <div className="bg-white rounded border border-slate-200 p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck size={15} className="text-teal-700" />
          Institution & Threshold Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">College Name</label>
            <input
              type="text"
              readOnly
              value={settings?.collegeName}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-slate-50 text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Affiliated University</label>
            <input
              type="text"
              readOnly
              value={settings?.universityName}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-slate-50 text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Attendance Threshold (%)</label>
            <input
              type="number"
              readOnly
              value={settings?.attendanceThreshold}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-slate-50 text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Passing Mark (%)</label>
            <input
              type="number"
              readOnly
              value={settings?.passPercent}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-slate-50 text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
