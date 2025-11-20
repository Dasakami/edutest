import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import StudentDashboard from "./pages/student/Dashboard";
import ResultDetails from "./pages/student/ResultDetails";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TakeTest from "./pages/test/TakeTest";
import CreateTest from "./pages/teacher/CreateTest";
import EditTest from "./pages/teacher/EditTest";
import TestStatistics from "./pages/teacher/TestStatistics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ResultDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/test/create"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <CreateTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/test/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <EditTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/test/:id/statistics"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TestStatistics />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
