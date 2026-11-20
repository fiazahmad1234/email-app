import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, setCurrentUser } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!matchedUser) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    setCurrentUser(matchedUser);
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <section className="bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-3">
          <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            CARRIERCHK • ROLE AUTHENTICATION
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Sign In to <span className="text-emerald-300">CarrierChk</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto">
            Login with your Admin or User account to access your role-based dashboard and menu.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 px-4 sm:px-8">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center tracking-tight">
            Account Login
          </h2>
          <p className="text-slate-500 text-sm text-center mt-1.5 mb-7">
            Default Admin: <span className="font-mono font-semibold">admin@carrierchk.com</span> / <span className="font-mono font-semibold">Admin123!</span>
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
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
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#156b3e] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#156b3e] hover:bg-[#115431] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm cursor-pointer shadow-sm"
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;