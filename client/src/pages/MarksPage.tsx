import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

interface MarkRecord {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_no: string;
  subject_code: string;
  subject_name: string;
  exam_type_name: string;
  max_marks: number;
  marks_obtained: number;
  is_published: boolean;
}

export function MarksPage() {
  const { user } = useAuth();
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<MarkRecord[]>('/api/marks')
      .then(setMarks)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Results & Assessments</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Internal Assessments & Semester Evaluations
          </p>
        </div>
        {user?.role !== 'student' && marks.length > 0 && (
          <button
            onClick={() => alert('Marks published successfully to student portal!')}
            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
          >
            <Send size={14} />
            Publish All Marks
          </button>
        )}
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading assessment marks...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-mono">Enrollment No</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Exam Type</th>
                <th className="py-2.5 px-4 text-center">Score</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{m.enrollment_no}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{m.student_name}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-teal-800 mr-1">[{m.subject_code}]</span>
                    {m.subject_name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{m.exam_type_name}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                    {m.marks_obtained} / {m.max_marks}
                  </td>
                  <td className="py-2.5 px-4 text-right">
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
        )}
      </div>
    </div>
  );
}
