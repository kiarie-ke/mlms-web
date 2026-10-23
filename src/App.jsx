import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { menus, pathOf } from './lib/nav.js';
import Layout from './components/Layout.jsx';
import { AppSkeleton } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Apply from './pages/Apply.jsx';
import Verify from './pages/Verify.jsx';

const page = (loader) => lazy(loader);
const pages = {
  dashboard: page(() => import('./pages/Dashboard.jsx')),
  students: page(() => import('./pages/Students.jsx')),
  admissions: page(() => import('./pages/Admissions.jsx')),
  cohorts: page(() => import('./pages/Cohorts.jsx')),
  courses: page(() => import('./pages/Courses.jsx')),
  learning: page(() => import('./pages/Learning.jsx')),
  attendance: page(() => import('./pages/Attendance.jsx')),
  fees: page(() => import('./pages/Fees.jsx')),
  financials: page(() => import('./pages/Financials.jsx')),
  instructors: page(() => import('./pages/Instructors.jsx')),
  assignments: page(() => import('./pages/Assignments.jsx')),
  classes: page(() => import('./pages/Classes.jsx')),
  announcements: page(() => import('./pages/Announcements.jsx')),
  messages: page(() => import('./pages/Messages.jsx')),
  certification: page(() => import('./pages/Certification.jsx')),
  reports: page(() => import('./pages/Reports.jsx')),
  admin: page(() => import('./pages/Administration.jsx')),
  materials: page(() => import('./pages/Materials.jsx')),
  playground: page(() => import('./pages/Playground.jsx')),
  quizzes: page(() => import('./pages/Quizzes.jsx')),
  grades: page(() => import('./pages/Grades.jsx')),
  discussions: page(() => import('./pages/Discussions.jsx')),
  notifications: page(() => import('./pages/Notifications.jsx')),
  resetPassword: page(() => import('./pages/ResetPassword.jsx')),
};
const Lesson = page(() => import('./pages/Lesson.jsx'));
const Account = page(() => import('./pages/Account.jsx'));

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <AppSkeleton />;
  if (!user)
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<pages.resetPassword />} />
        <Route path="/reset-password/:token" element={<pages.resetPassword />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/verify/:code" element={<Verify />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  if (user.mustChangePassword) {
    return (
      <Suspense fallback={<AppSkeleton />}>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/account" replace />} />
        </Routes>
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<AppSkeleton />}>
      <Routes>
        <Route path="/verify/:code" element={<Verify />} />
        <Route path="/reset-password" element={<pages.resetPassword />} />
        <Route path="/reset-password/:token" element={<pages.resetPassword />} />
        <Route element={<Layout />}>
          {menus[user.role].map(([k]) => {
            const Page = pages[k];
            return <Route key={k} path={pathOf(k)} element={<Page />} />;
          })}
          <Route path="/lessons/:id" element={<Lesson />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
