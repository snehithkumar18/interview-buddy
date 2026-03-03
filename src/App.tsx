import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

import StudentLayout from "./components/layouts/StudentLayout";
import Dashboard from "./pages/app/Dashboard";
import NewInterview from "./pages/app/NewInterview";
import InterviewHistory from "./pages/app/InterviewHistory";
import Credits from "./pages/app/Credits";
import ProfilePage from "./pages/app/ProfilePage";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Legacy routes redirect */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Register />} />

            {/* Student Portal */}
            <Route path="/app" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="new-interview" element={<NewInterview />} />
              <Route path="interview/setup" element={<NewInterview />} />
              <Route path="history" element={<InterviewHistory />} />
              <Route path="reports" element={<InterviewHistory />} />
              <Route path="credits" element={<Credits />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
