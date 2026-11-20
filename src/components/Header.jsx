import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  getUsers,
  createUserByAdmin,
} from "../utils/auth";

const CarrierLogo = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="40" height="40" rx="10" fill="#156b3e" />
    <path d="M12.5 13.5L19.5 20.5L12.5 27.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22.5 13.5L29.5 20.5L22.5 27.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
  </svg>
);

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  // Header Login Modal State
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Header Add User Modal State (Admin Only)
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addUserMsg, setAddUserMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const syncAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener("carrierchk-auth-change", syncAuth);
    return () => window.removeEventListener("carrierchk-auth-change", syncAuth);
  }, []);

  const hasRole = Boolean(currentUser?.role);
  const isAdmin = currentUser?.role === "admin";

  const adminNavLinks = [
    { name: "Home", path: "/" },
    { name: "Admin Dashboard", path: "/dashboard" },
         { name: "Fmsc", path: "/Fmsc" },
         { name: "Transportation", path: "/app1" },
          { name: "Motus Extractor", path: "/app3" },


    { name: "Carrier Lookup", path: "/app2" },
    { name: "Contact Us", path: "/contact" },
        { name: "Add User", action: "addUser" },

  ];

  const userNavLinks = [
    { name: "Home", path: "/" },
    { name: "User Dashboard", path: "/dashboard" },
    { name: "FMCSA Data", path: "/app1" },
    { name: "Carrier Lookup", path: "/app2" },
    { name: "Motus Extractor", path: "/app3" },
    { name: "Fmsc", path: "/Fmsc" },
    { name: "Contact Us", path: "/contact" },
  ];

  // Default (jab role assign na ho): sirf Home aur Contact Us
  const defaultNavLinks = [
    { name: "Home", path: "/" },
    { name: "Contact Us", path: "/contact" },
  ];

  const navLinks = !hasRole ? defaultNavLinks : isAdmin ? adminNavLinks : userNavLinks;

  const handleHeaderLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    const users = getUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        u.password === loginPassword
    );

    if (!found || !found.role) {
      setLoginError("Invalid credentials or role not assigned.");
      return;
    }

    setCurrentUser(found);
    setLoginEmail("");
    setLoginPassword("");
    setLoginOpen(false);
    setMobileMenuOpen(false);
    navigate("/dashboard");
  };

  const handleHeaderAddUser = (e) => {
    e.preventDefault();
    setAddUserMsg({ type: "", text: "" });

    const res = createUserByAdmin({
      name: newName,
      email: newEmail,
      password: newPassword,
    });

    if (!res.ok) {
      setAddUserMsg({ type: "error", text: res.error });
      return;
    }

    setAddUserMsg({
      type: "success",
      text: `User "${res.user.name}" added with role "${res.user.role}".`,
    });
    setNewName("");
    setNewEmail("");
    setNewPassword("");
  };

  const handleLogout = () => {
    logoutUser();
    setAddUserOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200 shadow-2xs">
        <div className="w-full fizii  px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between sm:justify-center gap-4 lg:gap-10">
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <CarrierLogo />
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-[#156b3e] transition-colors">
              CarrierChk
            </span>
          </Link>

          {/* Role-Based Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link, index) => {
              if (link.action === "addUser") {
                if (!isAdmin) return null;
                return (
                  <button
                    key={`add-user-${index}`}
                    onClick={() => {
                      setAddUserMsg({ type: "", text: "" });
                      setAddUserOpen(true);
                    }}
                    className="text-sm font-bold text-[#156b3e] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    {link.name}
                  </button>
                );
              }

              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={`${link.name}-${index}`}
                  to={link.path}
                  className={`text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                    isActive
                      ? "text-[#156b3e] font-bold underline underline-offset-8"
                      : "text-slate-700 hover:text-[#156b3e]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Auth Controls */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {hasRole ? (
              <>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-[#156b3e] border border-emerald-200 uppercase">
                  {currentUser.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full transition cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setLoginError("");
                  setLoginOpen(true);
                }}
                className="bg-[#156b3e] hover:bg-[#115431] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md transition cursor-pointer"
              >
                Admin Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition focus:outline-none shrink-0"
            aria-label="Toggle Mobile Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-2 shadow-xl w-full">
            {navLinks.map((link, index) => {
              if (link.action === "addUser") {
                if (!isAdmin) return null;
                return (
                  <button
                    key={`m-add-user-${index}`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAddUserMsg({ type: "", text: "" });
                      setAddUserOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-[#156b3e] hover:bg-emerald-50"
                  >
                    {link.name}
                  </button>
                );
              }

              return (
                <Link
                  key={`${link.name}-m-${index}`}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              {hasRole ? (
                <button
                  onClick={handleLogout}
                  className="flex-1 text-center py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl"
                >
                  Logout ({currentUser.role})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginError("");
                    setLoginOpen(true);
                  }}
                  className="flex-1 text-center py-2.5 text-xs font-bold text-white bg-[#156b3e] rounded-xl"
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Header Login Modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Admin Login</h2>
              <button
                onClick={() => setLoginOpen(false)}
                className="text-slate-500 hover:text-slate-900 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Admin: <span className="font-mono font-semibold">fiazahmad13072@gmail.com</span> / <span className="font-mono font-semibold">fiaz@13072</span>
            </p>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleHeaderLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#156b3e] hover:bg-[#115431] text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Add User Modal (Admin Only; Auto Role = 'user') */}
      {addUserOpen && isAdmin && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Add New User</h2>
              <button
                onClick={() => setAddUserOpen(false)}
                className="text-slate-500 hover:text-slate-900 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addUserMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  addUserMsg.type === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-[#156b3e]"
                }`}
              >
                {addUserMsg.text}
              </div>
            )}

            <form onSubmit={handleHeaderAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="User full name"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Assigned Role
                </label>
                <input
                  type="text"
                  value="user"
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-100 rounded-xl text-sm font-bold text-[#156b3e] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#156b3e] hover:bg-[#115431] text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="h-[72px] w-full"></div>
    </>
  );
}

export default Header;