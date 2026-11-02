import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { ShieldCheck } from 'lucide-react';

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_at: string;
  new_data: Record<string, unknown> | null;
}

const actionColor = (action: string) =>
  action === 'INSERT'
    ? 'bg-emerald-50 text-emerald-700'
    : action === 'DELETE'
    ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-700';

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    apiRequest<AuditEntry[]>('/api/settings/audit')
      .then(setEntries)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail</h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Append-Only Institutional Change Log (Latest 50 Events)
        </p>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading audit trail...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Event</th>
                <th className="py-2.5 px-4 font-mono">Table</th>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition align-top">
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${actionColor(e.action)}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{e.table_name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {new Date(e.changed_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {e.new_data && (
                      <button
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                      >
                        {expanded === e.id ? 'Hide' : 'View'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {expanded && (
                <tr key={`${expanded}-detail`}>
                  <td colSpan={4} className="px-4 pb-3">
                    <pre className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] font-mono text-slate-700 overflow-x-auto max-h-48">
                      {JSON.stringify(
                        entries.find((e) => e.id === expanded)?.new_data,
                        null,
                        2
                      )}
                    </pre>
                  </td>
                </tr>
              )}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">
                    No audit events recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
        <ShieldCheck size={13} className="text-teal-700" />
        Audit log is append-only — UPDATE and DELETE are blocked by database triggers.
      </div>
    </div>
  );
}
