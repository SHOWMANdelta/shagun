import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentsPage } from './pages/StudentsPage';
import { FacultyPage } from './pages/FacultyPage';
import { AcademicsPage } from './pages/AcademicsPage';
import { AuditPage } from './pages/AuditPage';
import { AttendancePage } from './pages/AttendancePage';
import { MarksPage } from './pages/MarksPage';
import { NoticesPage } from './pages/NoticesPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-xs font-mono text-slate-400">Loading profile...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-slate-800">403 Forbidden</h1>
        <p className="text-xs text-slate-500 font-mono mt-1">You do not have privilege to access this module.</p>
      </div>
    );
  }
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignInPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentsPage /></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyPage /></ProtectedRoute>} />
          <Route path="/admin/academics" element={<ProtectedRoute allowedRoles={['admin']}><AcademicsPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AuditPage /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/admin/marks" element={<ProtectedRoute allowedRoles={['admin']}><MarksPage /></ProtectedRoute>} />
          <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={['admin']}><NoticesPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />

          {/* Faculty Routes */}
          <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/faculty/marks" element={<ProtectedRoute allowedRoles={['faculty']}><MarksPage /></ProtectedRoute>} />
          <Route path="/faculty/notices" element={<ProtectedRoute allowedRoles={['faculty']}><NoticesPage /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><MarksPage /></ProtectedRoute>} />
          <Route path="/student/notices" element={<ProtectedRoute allowedRoles={['student']}><NoticesPage /></ProtectedRoute>} />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col justify-center items-center p-4">
                <h1 className="text-2xl font-bold text-slate-800">404 - Not Found</h1>
                <p className="text-xs text-slate-500 font-mono mt-1">The requested page does not exist.</p>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
