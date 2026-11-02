import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Search, UserPlus, UserX } from 'lucide-react';

interface Faculty {
  id: string;
  employee_code: string;
  display_name: string;
  display_name_from_user?: string;
  department: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
}

export function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeCode: '', displayName: '', department: '', designation: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: '1', limit: '50' });
      if (search) q.append('search', search);
      const res = await apiRequest<Faculty[]>(`/api/faculty?${q.toString()}`);
      setFaculty(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.employeeCode || !form.displayName) {
      alert('Employee code and full name are required.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/api/faculty', {
        method: 'POST',
        body: JSON.stringify({
          employeeCode: form.employeeCode,
          displayName: form.displayName,
          department: form.department || undefined,
          designation: form.designation || undefined,
          phone: form.phone || undefined,
        }),
      });
      setShowForm(false);
      setForm({ employeeCode: '', displayName: '', department: '', designation: '', phone: '' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this faculty member?')) return;
    try {
      await apiRequest(`/api/faculty/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Directory</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Staff Records & Profile Management</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
        >
          <UserPlus size={14} />
          Add Faculty
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Employee Code</label>
            <input
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              placeholder="FAC012"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:border-teal-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Designation</label>
            <input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Faculty'}
            </button>
          </div>
          <p className="md:col-span-5 text-[10px] text-slate-400 font-mono">
            Default login password applies until the member changes it (set by institution seed policy).
          </p>
        </div>
      )}

      <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or code..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700 font-mono"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">Found: {faculty.length} record(s)</span>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading faculty directory...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-mono">Employee Code</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Designation</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faculty.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{f.employee_code}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{f.display_name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{f.department || '—'}</td>
                  <td className="py-2.5 px-4 text-slate-600">{f.designation || '—'}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {f.is_active && (
                      <button
                        onClick={() => handleDeactivate(f.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Deactivate Faculty"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {faculty.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                    No faculty records matching query
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
