import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Registration from "./pages/Registration";
import Mcnumber from "./pages/Mcnumber";
import Downloadapp from "./pages/App";
import CarrierLookup from "./pages/CarrierLookup";
import MotusExtractor from "./pages/MotusExtractor";
import BulkEmailSender from "./pages/BulkEmailSender";
import Policy from "./pages/PrivacyPolicy";

import Contact from "./pages/Contact";
import Fmsc from "./pages/Fmsc";



function App() {
  return (
    
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-white text-slate-800">
        <Header />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
                  <Route path="/contact" element={<Contact />} />
                    <Route path="/Policy" element={<Policy />} />



            {/* Sirf logged-in role (admin ya user) ke liye */}
    <Route
              path="/BulkEmailSender"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <BulkEmailSender/>
                </ProtectedRoute>
              }
            />

                 <Route
              path="/Fmsc"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <Fmsc/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app1"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <Mcnumber />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app2"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <CarrierLookup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app3"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <MotusExtractor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <Downloadapp />
                </ProtectedRoute>
              }
            />

            {/* Sirf Admin ke liye */}
            <Route
              path="/registration"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Registration />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;