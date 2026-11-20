import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

function ProtectedRoute({ children, allowedRoles = ["admin", "user"] }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const syncAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener("carrierchk-auth-change", syncAuth);
    return () => window.removeEventListener("carrierchk-auth-change", syncAuth);
  }, []);

  // Jab tak user logged in na ho ya role assign na ho
  if (!currentUser || !currentUser.role) {
    return <Navigate to="/login" replace />;
  }

  // Agar user ka role is route ke liye allowed nahi (maslan normal user /registration par jaye)
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600">
            Your current role (<span className="font-mono font-bold text-[#156b3e]">{currentUser.role}</span>) does not have permission to access this route.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;