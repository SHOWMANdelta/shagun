import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Pin, CheckCheck } from 'lucide-react';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  target: string;
  is_pinned: boolean;
  author_name: string;
  created_at: string;
  is_read: boolean;
}

export function NoticesPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = () => {
    setLoading(true);
    apiRequest<NoticeItem[]>('/api/notices')
      .then(setNotices)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/api/notices/${id}/read`, { method: 'POST' });
      fetchNotices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Circulars</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Official College Notifications & Academic Updates
        </p>
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
                <div className="flex items-center gap-2">
                  {n.is_pinned && <Pin size={14} className="text-teal-700" />}
                  <h2 className="text-sm font-bold text-slate-900">{n.title}</h2>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded uppercase font-mono">
                    Target: {n.target}
                  </span>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="px-2 py-0.5 text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-medium flex items-center gap-1"
                  >
                    <CheckCheck size={13} />
                    Mark Read
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {n.body}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Issued by: {n.author_name}</span>
                <span>{new Date(n.created_at).toLocaleDateString()}</span>
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
