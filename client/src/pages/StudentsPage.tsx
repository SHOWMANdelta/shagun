import { useState, useEffect, useCallback } from 'react';
import { apiRequest, apiRequestFull } from '../lib/api';
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

interface Batch { id: string; name: string; }
interface PreviewRow { row: Record<string, string>; reason?: string | null }

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [batches, setBatches] = useState<Batch[]>([]);

  // CSV import state (Phase 4: preview -> confirm flow)
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importBatchId, setImportBatchId] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{ validRows: PreviewRow[]; invalidRows: PreviewRow[] } | null>(null);
  const [importResult, setImportResult] = useState<{ importedCount: number; credentials: { enrollmentNo: string }[] } | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) q.append('search', search);
      const res = await apiRequestFull<Student[]>(`/api/students?${q.toString()}`);
      setStudents(res.data);
      setTotal(typeof res.meta.total === 'number' ? res.meta.total : 0);
      setTotalPages(typeof res.meta.totalPages === 'number' ? res.meta.totalPages : 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    apiRequest<Batch[]>('/api/academic/batches')
      .then((data) => {
        setBatches(data);
        if (data.length > 0) setImportBatchId((prev) => prev || data[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePreview = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const data = await apiRequest<{ validRows: PreviewRow[]; invalidRows: PreviewRow[] }>(
        '/api/students/import-preview',
        { method: 'POST', body: JSON.stringify({ csv: csvText, batchId: importBatchId }) }
      );
      setPreview(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const data = await apiRequest<{ importedCount: number; credentials: { enrollmentNo: string }[] }>(
        '/api/students/import-confirm',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: preview.validRows.map((v) => v.row),
            batchId: importBatchId,
          }),
        }
      );
      setImportResult(data);
      setPreview(null);
      fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

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
            onClick={() => { setShowImport(!showImport); setPreview(null); setImportResult(null); }}
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
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-0.5 text-[11px] border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-[11px] font-mono text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-0.5 text-[11px] border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* CSV Import Panel (Phase 4: preview -> confirm) */}
      {showImport && (
        <div className="bg-white p-4 rounded border border-slate-200 space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Bulk Student Import</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target Batch</label>
              <select
                value={importBatchId}
                onChange={(e) => setImportBatchId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <p className="md:col-span-2 text-[10px] text-slate-400 font-mono self-end">
              Required columns: enrollment_no, display_name. Optional: current_semester, phone.
            </p>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={5}
            placeholder={'enrollment_no,display_name,current_semester,phone\n24BCA201,Alice Rani,1,9876500001\n24BCA202,Bob Verma,1,9876500002'}
            className="w-full text-[11px] font-mono border border-slate-300 rounded p-2 focus:outline-none focus:border-teal-700"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              disabled={importing || !csvText.trim() || !importBatchId}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded transition disabled:opacity-50"
            >
              {importing ? 'Working...' : 'Step 1: Preview' }
            </button>
            {preview && (
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded transition disabled:opacity-50"
              >
                Step 2: Confirm Import ({preview.validRows.length})
              </button>
            )}
          </div>
          {preview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-emerald-200 bg-emerald-50/50 rounded p-3">
                <div className="text-[10px] font-bold uppercase text-emerald-700 mb-1">Valid rows: {preview.validRows.length}</div>
                {preview.validRows.slice(0, 8).map((v, i) => (
                  <div key={i} className="text-[11px] font-mono text-slate-600">{v.row.enrollment_no} — {v.row.display_name}</div>
                ))}
              </div>
              <div className="border border-red-200 bg-red-50/50 rounded p-3">
                <div className="text-[10px] font-bold uppercase text-red-700 mb-1">Invalid rows: {preview.invalidRows.length}</div>
                {preview.invalidRows.slice(0, 8).map((v, i) => (
                  <div key={i} className="text-[11px] font-mono text-slate-600">{v.reason}</div>
                ))}
              </div>
            </div>
          )}
          {importResult && (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded p-3 text-[11px] text-slate-600">
              <span className="font-bold text-emerald-700">Imported {importResult.importedCount} student(s).</span>{' '}
              Default password assigned to: {importResult.credentials.map((c) => c.enrollmentNo).join(', ')}
            </div>
          )}
        </div>
      )}

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
