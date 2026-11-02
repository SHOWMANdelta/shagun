import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Trash2, Plus } from 'lucide-react';

interface Program { id: string; code: string; name: string; total_semesters: number; is_active: boolean; }
interface Batch { id: string; name: string; program_name: string; start_year: number; end_year: number; is_active: boolean; }
interface Subject { id: string; code: string; name: string; semester: number; credits: number; program_name: string; is_active: boolean; }
interface Assignment {
  id: string; faculty_name: string; subject_code: string; subject_name: string;
  batch_name: string; academic_year: string;
}
interface Faculty { id: string; display_name: string; }

export function AcademicsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ facultyId: '', subjectId: '', batchId: '', academicYear: '2026-27' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b, s, a, f] = await Promise.all([
        apiRequest<Program[]>('/api/academic/programs'),
        apiRequest<Batch[]>('/api/academic/batches'),
        apiRequest<Subject[]>('/api/academic/subjects'),
        apiRequest<Assignment[]>('/api/academic/assignments'),
        apiRequest<Faculty[]>('/api/faculty?limit=100'),
      ]);
      setPrograms(p);
      setBatches(b);
      setSubjects(s);
      setAssignments(a);
      setFaculty(f);
      if (b.length > 0) setForm((prev) => ({ ...prev, batchId: prev.batchId || b[0].id }));
      if (s.length > 0) setForm((prev) => ({ ...prev, subjectId: prev.subjectId || s[0].id }));
      if (f.length > 0) setForm((prev) => ({ ...prev, facultyId: prev.facultyId || f[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAssign = async () => {
    setSaving(true);
    try {
      await apiRequest('/api/academic/assignments', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (id: string) => {
    if (!window.confirm('Remove this subject assignment?')) return;
    try {
      await apiRequest(`/api/academic/assignments/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading academic structure...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Structure</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Programs, Batches, Subjects & Faculty Subject Assignments
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
        >
          <Plus size={14} />
          New Assignment
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Faculty</label>
            <select
              value={form.facultyId}
              onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.display_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>[{s.code}] {s.name} (Sem {s.semester})</option>
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
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Session</label>
              <input
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:border-teal-700"
              />
            </div>
            <button
              onClick={handleAssign}
              disabled={saving || !form.facultyId || !form.subjectId || !form.batchId}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* Assignments */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Faculty Subject Assignments
        </div>
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2 px-4">Faculty</th>
              <th className="py-2 px-4">Subject</th>
              <th className="py-2 px-4">Batch</th>
              <th className="py-2 px-4 font-mono">Session</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/80 transition">
                <td className="py-2.5 px-4 font-medium text-slate-800">{a.faculty_name}</td>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-teal-800 mr-1">[{a.subject_code}]</span>
                  {a.subject_name}
                </td>
                <td className="py-2.5 px-4 text-slate-600">{a.batch_name}</td>
                <td className="py-2.5 px-4 font-mono text-slate-600">{a.academic_year}</td>
                <td className="py-2.5 px-4 text-right">
                  <button
                    onClick={() => handleUnassign(a.id)}
                    className="text-slate-400 hover:text-red-600 transition p-1"
                    title="Remove assignment"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                  No subject assignments yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Programs, Batches, Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded border border-slate-200">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Programs
          </div>
          <div className="divide-y divide-slate-100">
            {programs.map((p) => (
              <div key={p.id} className="px-4 py-2.5 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    <span className="font-mono text-teal-800 mr-1">[{p.code}]</span>
                    {p.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.total_semesters} semesters</div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded border border-slate-200">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Batches
          </div>
          <div className="divide-y divide-slate-100">
            {batches.map((b) => (
              <div key={b.id} className="px-4 py-2.5 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{b.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {b.program_name} · {b.start_year}–{b.end_year}
                  </div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded border border-slate-200">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Subjects
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {subjects.map((s) => (
              <div key={s.id} className="px-4 py-2.5 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    <span className="font-mono text-teal-800 mr-1">[{s.code}]</span>
                    {s.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Sem {s.semester} · {s.credits} credits
                  </div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
