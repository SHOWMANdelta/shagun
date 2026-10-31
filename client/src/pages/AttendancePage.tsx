import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Check, X, Clock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SessionItem {
  id: string;
  subject_name: string;
  subject_code: string;
  batch_name: string;
  session_date: string;
  topic: string | null;
}

interface StudentRecord {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_no: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export function AttendancePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<SessionItem[]>('/api/attendance/sessions')
      .then((data) => {
        setSessions(data);
        if (data.length > 0) setSelectedSession(data[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    setLoading(true);
    apiRequest<StudentRecord[]>(`/api/attendance/sessions/${selectedSession}/records`)
      .then(setRecords)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedSession]);

  const toggleStatus = (studentId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.student_id !== studentId) return r;
        const nextStatus =
          r.status === 'present' ? 'absent' : r.status === 'absent' ? 'late' : 'present';
        return { ...r, status: nextStatus };
      })
    );
  };

  const handleBulkSave = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      await apiRequest('/api/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: selectedSession,
          records: records.map((r) => ({
            studentId: r.student_id,
            status: r.status,
            remarks: r.remarks,
          })),
        }),
      });
      alert('Attendance saved successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Roster</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Class Roll Call & Session Attendance Register
          </p>
        </div>
        {user?.role !== 'student' && records.length > 0 && (
          <button
            onClick={handleBulkSave}
            disabled={saving}
            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Roster'}
          </button>
        )}
      </div>

      {/* Session Selection */}
      <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">Session:</label>
        <select
          value={selectedSession || ''}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-teal-700"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.session_date} — [{s.subject_code}] {s.subject_name} ({s.batch_name})
            </option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading roster...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-mono">Enrollment No</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.student_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{r.enrollment_no}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{r.student_name}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${
                        r.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.status === 'absent'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {r.status === 'present' && <Check size={12} />}
                      {r.status === 'absent' && <X size={12} />}
                      {r.status === 'late' && <Clock size={12} />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(r.student_id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px]"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">
                    No student attendance records for this session
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
