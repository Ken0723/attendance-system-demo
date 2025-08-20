import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RouteProtection from "./utils/RouteProtection";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Calendar from "./pages/Calendar";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import Unauthorized from "./error-page/Unauthorized";
import EventControl from "./pages/admin/EventControl";
import AttendanceControl from "./pages/admin/AttendanceControl";
import PermissionControl from "./pages/admin/PermissionControl";
import UserControl from "./pages/admin/UserControl";
// import Unauthorized from "./pages/Unauthorized";
import { useAuth } from "./components/auth/AuthContext";
import Callback from "./components/auth/AuthCallback";
import MainLayout from "./components/MainLayout";

function LogoutRoute() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return null;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <RouteProtection requiredPermission="get:dashboard">
              <Dashboard />
            </RouteProtection>
          }
        />

        <Route
          path="/attendance"
          element={
            <RouteProtection requiredPermission="get:attendance">
              <Attendance />
            </RouteProtection>
          }
        />

        <Route
          path="/calendar"
          element={
            <RouteProtection requiredPermission="get:calendar">
              <Calendar />
            </RouteProtection>
          }
        />

        <Route
          path="/event-control"
          element={
            <RouteProtection requiredPermission="post:events">
              <EventControl />
            </RouteProtection>
          }
        />

        <Route
          path="/attendance-control"
          element={
            <RouteProtection requiredPermission="post:attendance">
              <AttendanceControl />
            </RouteProtection>
          }
        />

        <Route
          path="/permission-control"
          element={
            <RouteProtection requiredPermission="assign:permission">
              <PermissionControl />
            </RouteProtection>
          }
        />

        <Route
          path="/user-control"
          element={
            <RouteProtection requiredPermission="post:user-info">
              <UserControl />
            </RouteProtection>
          }
        />

        <Route
          path="/user-profile"
          element={
            <RouteProtection requiredPermission="get:user-info">
              <UserProfile />
            </RouteProtection>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
