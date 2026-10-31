import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Download, Upload, Search, UserX } from 'lucide-react';

interface Student {
  id: string;
  enrollment_no: string;
  display_name: string;
  batch_name: string;
  current_semester: number;
  phone: string | null;
  is_active: boolean;
}

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) q.append('search', search);
      const res = await apiRequest<Student[]>(`/api/students?${q.toString()}`);
      setStudents(res);
      setTotal(res.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this student?')) return;
    try {
      await apiRequest(`/api/students/${id}/deactivate`, { method: 'PATCH' });
      fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Records</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Directory, Enrollment & Cohort Status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/students/export/csv"
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 transition"
          >
            <Download size={14} />
            Export CSV
          </a>
          <button
            onClick={() => alert('CSV Import Preview: Upload students via format (enrollment_no, display_name, phone)')}
            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
          >
            <Upload size={14} />
            Import CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or enrollment number..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700 font-mono"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">Found: {total} record(s)</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading student directory...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-mono">Enrollment No</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Batch</th>
                <th className="py-2.5 px-4">Semester</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{st.enrollment_no}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{st.display_name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{st.batch_name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">Sem {st.current_semester}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        st.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {st.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {st.is_active && (
                      <button
                        onClick={() => handleDeactivate(st.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Deactivate Student"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                    No student records matching query
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
