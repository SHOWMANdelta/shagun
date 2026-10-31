import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('DemoPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string) => {
    setIdentifier(id);
    setPassword('DemoPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded border border-slate-200 shadow-sm p-6">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-teal-800 text-white rounded flex items-center justify-center font-bold text-lg mx-auto mb-2">
            ERP
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mini College ERP</h1>
          {/* Mandatory Login screen caption */}
          <p className="text-xs text-slate-500 font-mono mt-1">
            BCA Project No. 41 by Shagun Kaushal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Login ID / Identifier
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <UserIcon size={14} />
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-teal-700"
                placeholder="admin / FAC001 / 24BCA001"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Lock size={14} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-teal-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-600 mb-2">Demo Accounts (One-Click):</div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
            <button
              onClick={() => fillDemo('admin')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-center"
            >
              Admin
            </button>
            <button
              onClick={() => fillDemo('FAC001')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-center"
            >
              Faculty
            </button>
            <button
              onClick={() => fillDemo('24BCA001')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-center"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
