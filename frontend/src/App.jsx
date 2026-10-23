import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RoleRedirect from "./pages/RoleRedirect";

import PatientHome from "./pages/patient/Home";
import FindDoctor from "./pages/patient/FindDoctor";
import DoctorProfile from "./pages/patient/DoctorProfile";
import BookAppointment from "./pages/patient/BookAppointment";
import Queue from "./pages/patient/Queue";
import SubmitReview from "./pages/patient/SubmitReview";

import DoctorSchedule from "./pages/doctor/Schedule";
import DoctorCredibility from "./pages/doctor/Credibility";

import AdminOverview from "./pages/admin/Overview";
import AdminQueueManagement from "./pages/admin/QueueManagement";
import AdminManageDoctors from "./pages/admin/ManageDoctors";
import AdminCredibilityReviews from "./pages/admin/CredibilityReviews";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminAIModels from "./pages/admin/AIModels";

import AccountSettings from "./pages/shared/AccountSettings";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<RoleRedirect />} />

            {/* Shared account settings — reachable by patient or doctor */}
            <Route
              path="/account"
              element={
                <ProtectedRoute allowedRoles={["patient", "doctor"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AccountSettings />} />
            </Route>

            {/* Patient */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PatientHome />} />
              <Route path="find-a-doctor" element={<FindDoctor />} />
              <Route path="doctors/:doctorId" element={<DoctorProfile />} />
              <Route path="doctors/:doctorId/book" element={<BookAppointment />} />
              <Route path="doctors/:doctorId/review" element={<SubmitReview />} />
              <Route path="queue" element={<Queue />} />
            </Route>

            {/* Doctor */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DoctorSchedule />} />
              <Route path="credibility" element={<DoctorCredibility />} />
            </Route>

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="queue" element={<AdminQueueManagement />} />
              <Route path="doctors" element={<AdminManageDoctors />} />
              <Route path="credibility" element={<AdminCredibilityReviews />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ai-models" element={<AdminAIModels />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}