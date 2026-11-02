import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Check, X, Clock, Save, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SessionItem {
  id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  batch_id: string;
  batch_name: string;
  session_date: string;
  topic: string | null;
  is_locked: boolean;
}

interface StudentRecord {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_no: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

interface Subject { id: string; code: string; name: string; semester: number; }
interface Batch { id: string; name: string; }

interface SummaryRow {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_pct: number;
}

export function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New session form (staff only)
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({ subjectId: '', batchId: '', sessionDate: '', topic: '' });
  const [creating, setCreating] = useState(false);

  // Student summary
  const [summary, setSummary] = useState<SummaryRow[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiRequest<SessionItem[]>('/api/attendance/sessions');
      setSessions(data);
      setSelectedSession((prev) => prev || data[0]?.id || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isStudent) {
      apiRequest<SummaryRow[]>('/api/attendance/summary')
        .then(setSummary)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        apiRequest<Subject[]>('/api/academic/subjects'),
        apiRequest<Batch[]>('/api/academic/batches'),
      ])
        .then(([s, b]) => {
          setSubjects(s);
          setBatches(b);
          if (s.length > 0) setForm((prev) => ({ ...prev, subjectId: prev.subjectId || s[0].id }));
          if (b.length > 0) setForm((prev) => ({ ...prev, batchId: prev.batchId || b[0].id }));
        })
        .catch((err) => console.error(err));
      loadSessions();
    }
  }, [isStudent, loadSessions]);

  useEffect(() => {
    if (isStudent || !selectedSession) return;
    setLoading(true);
    apiRequest<StudentRecord[]>(`/api/attendance/sessions/${selectedSession}/records`)
      .then(setRecords)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isStudent, selectedSession]);

  const handleCreateSession = async () => {
    setCreating(true);
    setMessage('');
    try {
      const data = await apiRequest<{ id: string }>('/api/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm((prev) => ({ ...prev, topic: '' }));
      await loadSessions();
      setSelectedSession(data.id);
      setMessage('Attendance session created. Mark the roster and save.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Session creation failed');
    } finally {
      setCreating(false);
    }
  };

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
    setMessage('');
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
      setMessage('Attendance saved successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Student view: personal attendance summary ----------------
  if (isStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Subject-wise Cumulative Register (75% Threshold)
          </p>
        </div>
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading summary...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-mono">Subject</th>
                  <th className="py-2.5 px-4 text-center">Sessions</th>
                  <th className="py-2.5 px-4 text-center">Present / Late / Absent</th>
                  <th className="py-2.5 px-4 text-right">Percent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.map((s) => (
                  <tr key={s.subject_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-teal-800 mr-1">[{s.subject_code}]</span>
                      {s.subject_name}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{s.total_sessions}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                      {s.present_count} / {s.late_count} / {s.absent_count}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          s.attendance_pct >= 75
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.attendance_pct >= 60
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {s.attendance_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">
                      No attendance recorded yet
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

  // ---------------- Staff view: session roster ----------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Roster</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Class Roll Call & Session Attendance Register
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition"
          >
            <Plus size={14} />
            New Session
          </button>
          {records.length > 0 && (
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
      </div>

      {message && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium rounded px-3 py-2">
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-4 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Batch</label>
            <select
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Session Date (IST)</label>
            <input
              type="date"
              value={form.sessionDate}
              onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:border-teal-700"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Topic</label>
              <input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
              />
            </div>
            <button
              onClick={handleCreateSession}
              disabled={creating || !form.sessionDate || !form.subjectId || !form.batchId}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded transition disabled:opacity-50"
            >
              {creating ? '...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Session Selection */}
      <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">Session:</label>
        <select
          value={selectedSession || ''}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:border-teal-700"
        >
          {sessions.length === 0 && <option value="">No sessions yet</option>}
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.session_date} — [{s.subject_code}] {s.subject_name} ({s.batch_name})
              {s.is_locked ? ' — LOCKED' : ''}
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
