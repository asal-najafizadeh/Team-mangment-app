import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Tasks from '../pages/Tasks';
import TaskDetails from '../pages/TaskDetails';
import CreateTask from '../pages/tasks/CreateTask';
import EditTask from '../pages/tasks/EditTask';
import TaskManagerPanel from '../pages/tasks/TaskManagerPanel';
import TaskMemberWarnings from '../pages/tasks/TaskMemberWarnings';
import SendReport from '../pages/SendReport';
import Attendance from '../pages/Attendance';
import CalendarPage from '../pages/CalendarPage';
import CalendarAdminPage from '../pages/CalendarAdminPage';
import ManagerReports from '../pages/ManagerReports';
import BotSettings from '../pages/BotSettings';
import WarningsUsers from '../pages/warnings/WarningsUsers';
import UserWarnings from '../pages/warnings/UserWarnings';
import WarningsSettings from '../pages/warnings/WarningsSettings';
import UsersManagement from '../pages/users/UsersManagement';
import EditUser from '../pages/users/EditUser';
import CreateUser from '../pages/users/CreateUser';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public route - not wrapped in MainLayout */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes - wrapped in MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/new" element={<CreateTask />} />
        <Route path="/tasks/edit/:id" element={<EditTask />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/task-manager/:id" element={<TaskManagerPanel />} />
        <Route path="/task-manager/:taskId/user/:userId" element={<TaskMemberWarnings />} />
        <Route path="/reports/send" element={<SendReport />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/admin" element={<CalendarAdminPage />} />
        <Route path="/manager/reports" element={<ManagerReports />} />
        <Route path="/bot/settings" element={<BotSettings />} />
        <Route path="/warnings" element={<WarningsUsers />} />
        <Route path="/warnings/user/:id" element={<UserWarnings />} />
        <Route path="/warnings/settings" element={<WarningsSettings />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/users/new" element={<CreateUser />} />
        <Route path="/users/edit/:id" element={<EditUser />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;

