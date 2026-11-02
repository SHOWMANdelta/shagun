import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Send, Save } from 'lucide-react';

interface MarkRecord {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_no: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  exam_type_id: string;
  exam_type_name: string;
  max_marks: number;
  marks_obtained: number;
  is_published: boolean;
}

interface Subject { id: string; code: string; name: string; semester: number; }
interface ExamType { id: string; name: string; max_marks: number; }
interface Batch { id: string; name: string; }
interface Student { id: string; enrollment_no: string; display_name: string; }

interface SgpaRow { semester: number; sgpa: number; total_credits: number; }

export function MarksPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isStaff = user?.role === 'admin' || user?.role === 'faculty';

  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [sgpa, setSgpa] = useState<SgpaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Entry grid state (staff only)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [roster, setRoster] = useState<Student[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [gridLoading, setGridLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadMarks = useCallback(async () => {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        apiRequest<MarkRecord[]>('/api/marks'),
        apiRequest<SgpaRow[]>('/api/marks/sgpa'),
      ]);
      setMarks(m);
      setSgpa(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  useEffect(() => {
    if (!isStaff) return;
    Promise.all([
      apiRequest<Subject[]>('/api/academic/subjects'),
      apiRequest<ExamType[]>('/api/marks/exam-types'),
      apiRequest<Batch[]>('/api/academic/batches'),
    ])
      .then(([s, et, b]) => {
        setSubjects(s);
        setExamTypes(et);
        setBatches(b);
        if (s.length > 0) setSubjectId(s[0].id);
        if (et.length > 0) setExamTypeId(et[0].id);
        if (b.length > 0) setBatchId(b[0].id);
      })
      .catch((err) => console.error(err));
  }, [isStaff]);

  // Load roster for the selected batch when the entry triple changes
  useEffect(() => {
    if (!isStaff || !subjectId || !examTypeId || !batchId) return;
    setGridLoading(true);
    apiRequest<Student[]>(`/api/students?batchId=${batchId}&limit=100`)
      .then((rows) => {
        setRoster(rows);
        setInputs({});
        // Pre-fill existing marks for the selected subject/exam
        return apiRequest<MarkRecord[]>(
          `/api/marks?subjectId=${subjectId}&examTypeId=${examTypeId}&batchId=${batchId}`
        ).then((existing) => {
          const byStudent: Record<string, string> = {};
          for (const m of existing) {
            if (m.subject_id === subjectId && m.exam_type_id === examTypeId) {
              byStudent[m.student_id] = String(m.marks_obtained);
            }
          }
          setInputs(byStudent);
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setGridLoading(false));
  }, [isStaff, subjectId, examTypeId, batchId]);

  const maxMarks = examTypes.find((e) => e.id === examTypeId)?.max_marks ?? 100;

  const handleSaveGrid = async () => {
    const entries = Object.entries(inputs)
      .filter(([, v]) => v !== '' && !Number.isNaN(parseFloat(v)))
      .map(([studentId, v]) => ({
        studentId,
        subjectId,
        examTypeId,
        batchId,
        marksObtained: parseFloat(v),
      }));
    if (entries.length === 0) {
      alert('Enter at least one mark before saving.');
      return;
    }
    if (entries.some((e) => e.marksObtained < 0 || e.marksObtained > maxMarks)) {
      alert(`Marks must be between 0 and ${maxMarks} for this exam type.`);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await apiRequest('/api/marks/bulk', {
        method: 'POST',
        body: JSON.stringify({ entries }),
      });
      setMessage(`Saved ${entries.length} mark(s) as unpublished draft.`);
      await apiRequest<MarkRecord[]>(
        `/api/marks?subjectId=${subjectId}&examTypeId=${examTypeId}&batchId=${batchId}`
      ).then((existing) => {
        const byStudent: Record<string, string> = {};
        for (const m of existing) {
          if (m.subject_id === subjectId && m.exam_type_id === examTypeId) {
            byStudent[m.student_id] = String(m.marks_obtained);
          }
        }
        setInputs(byStudent);
      });
      loadMarks();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish all draft marks for this subject, exam type and batch?')) return;
    setMessage('');
    try {
      const data = await apiRequest<{ published: number }>('/api/marks/publish', {
        method: 'POST',
        body: JSON.stringify({ subjectId, examTypeId, batchId }),
      });
      setMessage(`Published ${data.published} mark(s) to student portal.`);
      loadMarks();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Publish failed');
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading assessment marks...</div>;
  }

  // ---------------- Student view: published results + SGPA ----------------
  if (isStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Results</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Published Semester Evaluations & SGPA (10-Point Scale)
          </p>
        </div>

        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-mono">Subject</th>
                <th className="py-2.5 px-4">Exam</th>
                <th className="py-2.5 px-4 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-teal-800 mr-1">[{m.subject_code}]</span>
                    {m.subject_name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{m.exam_type_name}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                    {m.marks_obtained} / {m.max_marks}
                  </td>
                </tr>
              ))}
              {marks.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 font-mono">
                    No published results yet — check back after evaluation is complete
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sgpa.length > 0 && (
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Semester SGPA
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
              {sgpa.map((s) => (
                <div key={s.semester} className="border border-slate-100 bg-slate-50 rounded p-3 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Semester {s.semester}</div>
                  <div className="text-2xl font-bold font-mono text-teal-800 mt-1">{s.sgpa}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.total_credits} credits</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- Staff view: entry grid + register + publish ----------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Marks Entry & Results</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Draft Assessments, Publishing & 10-Point Scale Grading
        </p>
      </div>

      {/* Entry grid controls */}
      <div className="bg-white p-3 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Exam Type</label>
          <select
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
          >
            {examTypes.map((et) => (
              <option key={et.id} value={et.id}>{et.name} (max {et.max_marks})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Batch</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium rounded px-3 py-2">
          {message}
        </div>
      )}

      {/* Entry grid */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Marks Entry Grid (max {maxMarks})</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveGrid}
              disabled={saving || gridLoading || roster.length === 0}
              className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-semibold rounded transition disabled:opacity-50"
            >
              <Save size={12} className="inline mr-1" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={gridLoading || roster.length === 0}
              className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded transition disabled:opacity-50"
            >
              <Send size={12} className="inline mr-1" />
              Publish
            </button>
          </div>
        </div>
        {gridLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading roster...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2 px-4 font-mono">Enrollment No</th>
                <th className="py-2 px-4">Student Name</th>
                <th className="py-2 px-4 text-right">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2 px-4 font-mono font-medium text-slate-900">{st.enrollment_no}</td>
                  <td className="py-2 px-4 font-medium text-slate-800">{st.display_name}</td>
                  <td className="py-2 px-4 text-right">
                    <input
                      type="number"
                      min={0}
                      max={maxMarks}
                      step="0.5"
                      value={inputs[st.id] ?? ''}
                      onChange={(e) => setInputs({ ...inputs, [st.id]: e.target.value })}
                      className="w-20 px-2 py-1 text-center text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-teal-700"
                    />
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 font-mono">
                    No students in this batch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Full marks register */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          All Entered Marks ({marks.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2 px-4 font-mono">Enrollment No</th>
              <th className="py-2 px-4">Student Name</th>
              <th className="py-2 px-4">Subject</th>
              <th className="py-2 px-4">Exam Type</th>
              <th className="py-2 px-4 text-center">Score</th>
              <th className="py-2 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marks.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition">
                <td className="py-2 px-4 font-mono font-medium text-slate-900">{m.enrollment_no}</td>
                <td className="py-2 px-4 font-medium text-slate-800">{m.student_name}</td>
                <td className="py-2 px-4">
                  <span className="font-mono text-teal-800 mr-1">[{m.subject_code}]</span>
                  {m.subject_name}
                </td>
                <td className="py-2 px-4 font-mono text-slate-600">{m.exam_type_name}</td>
                <td className="py-2 px-4 text-center font-mono font-bold text-slate-900">
                  {m.marks_obtained} / {m.max_marks}
                </td>
                <td className="py-2 px-4 text-right">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {m.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
              </tr>
            ))}
            {marks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                  No examination records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
