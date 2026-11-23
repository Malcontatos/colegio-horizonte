import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen } from './components/ui';
import { homeForRole, useAuth } from './context/auth';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudentsPage } from './pages/admin/StudentsPage';
import { AdminTeachersPage } from './pages/admin/TeachersPage';
import { AdminSubjectsPage } from './pages/admin/SubjectsPage';
import { AdminClassesPage } from './pages/admin/ClassesPage';
import { AdminAssignmentsPage } from './pages/admin/AssignmentsPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { GradebookPage } from './pages/teacher/GradebookPage';
import { TeacherResourcesPage } from './pages/teacher/TeacherResourcesPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSubjectsPage } from './pages/student/StudentSubjectsPage';
import { StudentLibraryPage } from './pages/student/StudentLibraryPage';
import type { Role } from './types';

const ALL_ROLES: Role[] = ['ADMIN', 'TEACHER', 'STUDENT'];

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-paper min-h-screen">
        <LoadingScreen label="Abrindo o portal..." />
      </div>
    );
  }

  return <Navigate to={user ? homeForRole(user.role) : '/login'} replace />;
}

function RoleGate({ roles }: { roles: Role[] }) {
  return (
    <ProtectedRoute roles={roles}>
      <Outlet />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute roles={ALL_ROLES}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="conta/senha" element={<ChangePasswordPage />} />

        <Route element={<RoleGate roles={['ADMIN']} />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/alunos" element={<AdminStudentsPage />} />
          <Route path="admin/professores" element={<AdminTeachersPage />} />
          <Route path="admin/disciplinas" element={<AdminSubjectsPage />} />
          <Route path="admin/turmas" element={<AdminClassesPage />} />
          <Route path="admin/vinculos" element={<AdminAssignmentsPage />} />
        </Route>

        <Route element={<RoleGate roles={['TEACHER']} />}>
          <Route path="professor" element={<TeacherDashboard />} />
          <Route path="professor/notas" element={<GradebookPage />} />
          <Route path="professor/materiais" element={<TeacherResourcesPage />} />
        </Route>

        <Route element={<RoleGate roles={['STUDENT']} />}>
          <Route path="aluno" element={<StudentDashboard />} />
          <Route path="aluno/disciplinas" element={<StudentSubjectsPage />} />
          <Route path="aluno/biblioteca" element={<StudentLibraryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
