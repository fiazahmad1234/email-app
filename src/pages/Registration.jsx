import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createUserByAdmin, getCurrentUser } from "../utils/auth";

function Registration() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const syncAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener("carrierchk-auth-change", syncAuth);
    return () => window.removeEventListener("carrierchk-auth-change", syncAuth);
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const res = createUserByAdmin({ name, email, password });

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setMessage(
      `New user "${res.user.name}" (${res.user.email}) created with automatic role: ${res.user.role}.`
    );
    setName("");
    setEmail("");
    setPassword("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-3">
          <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            CARRIERCHK • ADMIN USER MANAGEMENT
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Add New <span className="text-emerald-300">User</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto">
            Only Admin can create users. Every newly added account automatically receives the <span className="font-mono font-bold text-emerald-300">user</span> role.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 px-4 sm:px-8">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {!isAdmin ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold">
                Access Denied: Only Admin can add new users. Normal users cannot create accounts.
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Link
                  to="/login"
                  className="bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
                >
                  Admin Login
                </Link>
                <Link
                  to="/dashboard"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-xl text-xs transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center tracking-tight">
                Create User Account
              </h2>
              <p className="text-slate-500 text-sm text-center mt-1.5 mb-7">
                Assigned role will automatically be <span className="font-bold text-[#156b3e]">user</span>
              </p>

              {message && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-[#156b3e] rounded-xl text-sm font-semibold">
                  {message}
                </div>
              )}

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter user name"
                    required
                    className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter user email"
                    required
                    className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    value="user"
                    readOnly
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-100 rounded-xl text-sm font-bold text-[#156b3e] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#156b3e] hover:bg-[#115431] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm cursor-pointer shadow-sm"
                >
                  {loading ? "Creating User..." : "Add User"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Registration;