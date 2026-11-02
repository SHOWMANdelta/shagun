import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Pin, CheckCheck, Bell, Search, Trash2, Megaphone } from 'lucide-react';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  target: string;
  target_batch_id: string | null;
  target_semester: number | null;
  is_pinned: boolean;
  expires_at: string | null;
  author_name: string;
  created_at: string;
  is_read: boolean;
}

interface Batch { id: string; name: string; }

export function NoticesPage() {
  const { user } = useAuth();
  const canPost = user?.role === 'admin' || user?.role === 'faculty';

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Composer
  const [showComposer, setShowComposer] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    target: 'all',
    targetBatchId: '',
    targetSemester: '',
    isPinned: false,
    expiresAt: '',
  });

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      const data = await apiRequest<NoticeItem[]>(`/api/notices?${q.toString()}`);
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    if (!canPost) return;
    apiRequest<Batch[]>('/api/academic/batches')
      .then(setBatches)
      .catch((err) => console.error(err));
  }, [canPost]);

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/api/notices/${id}/read`, { method: 'POST' });
      fetchNotices();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      alert('Title and body are required.');
      return;
    }
    setPosting(true);
    try {
      await apiRequest('/api/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          target: form.target,
          targetBatchId: form.target === 'batch' ? form.targetBatchId : undefined,
          targetSemester: form.target === 'semester' ? parseInt(form.targetSemester, 10) : undefined,
          isPinned: form.isPinned,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        }),
      });
      setShowComposer(false);
      setForm({ title: '', body: '', target: 'all', targetBatchId: '', targetSemester: '', isPinned: false, expiresAt: '' });
      fetchNotices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Post failed');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notice permanently?')) return;
    try {
      await apiRequest(`/api/notices/${id}`, { method: 'DELETE' });
      fetchNotices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Circulars</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Role, Batch & Semester Targeted Academic Updates
          </p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
          >
            <Megaphone size={14} />
            New Notice
          </button>
        )}
      </div>

      {showComposer && (
        <div className="bg-white p-4 rounded border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target Audience</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
              >
                <option value="all">Everyone</option>
                <option value="students">All Students</option>
                <option value="faculty">All Faculty</option>
                <option value="batch">Specific Batch</option>
                <option value="semester">Specific Semester</option>
              </select>
            </div>
            {form.target === 'batch' && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Batch</label>
                <select
                  value={form.targetBatchId}
                  onChange={(e) => setForm({ ...form, targetBatchId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
                >
                  <option value="">Select batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            {form.target === 'semester' && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Semester</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={form.targetSemester}
                  onChange={(e) => setForm({ ...form, targetSemester: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-teal-700"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Expires On (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              className="w-full text-xs border border-slate-300 rounded p-2 focus:outline-none focus:border-teal-700"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="accent-teal-700"
              />
              Pin to top
            </label>
            <button
              onClick={handlePost}
              disabled={posting}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded transition disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Publish Notice'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices by title or content..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-700"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Bell size={13} />
          {notices.filter((n) => !n.is_read).length} unread
        </span>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading announcements...</div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded border p-4 space-y-2 transition ${
                n.is_pinned ? 'border-teal-700/60 shadow-sm' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.is_pinned && <Pin size={14} className="text-teal-700" />}
                  <h2 className="text-sm font-bold text-slate-900">{n.title}</h2>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded uppercase font-mono">
                    {n.target === 'batch' && n.target_batch_id
                      ? `Batch notice`
                      : n.target === 'semester' && n.target_semester
                      ? `Semester ${n.target_semester}`
                      : `All ${n.target}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="px-2 py-0.5 text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-medium flex items-center gap-1"
                    >
                      <CheckCheck size={13} />
                      Mark Read
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Delete notice"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {n.body}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Issued by: {n.author_name}</span>
                <span>
                  {new Date(n.created_at).toLocaleDateString()}
                  {n.expires_at
                    ? ` · expires ${new Date(n.expires_at).toLocaleDateString()}`
                    : ''}
                </span>
              </div>
            </div>
          ))
        )}
        {!loading && notices.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">No active notices available</div>
        )}
      </div>
    </div>
  );
}
