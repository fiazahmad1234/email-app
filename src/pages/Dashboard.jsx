import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createUserByAdmin, getCurrentUser, getUsers } from "../utils/auth";
import * as authModule from "../utils/auth";

function Dashboard() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [usersList, setUsersList] = useState(() => getUsers());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const refreshUsers = () => {
    setCurrentUser(getCurrentUser());
    setUsersList(getUsers());
  };

  useEffect(() => {
    window.addEventListener("carrierchk-auth-change", refreshUsers);
    return () => window.removeEventListener("carrierchk-auth-change", refreshUsers);
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full min-w-0 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Login Required</h2>
          <p className="text-sm text-slate-600">
            Please login with your Admin or User account to access the dashboard.
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";

  const handleQuickAddUser = (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    const res = createUserByAdmin({ name, email, password });
    if (!res.ok) {
      setFeedback({ type: "error", text: res.error });
      return;
    }

    setUsersList(getUsers());
    setFeedback({
      type: "success",
      text: `User "${res.user.name}" added with role "${res.user.role}".`,
    });
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleDeleteUser = (targetUser) => {
    setFeedback({ type: "", text: "" });

    if (!isAdmin) {
      setFeedback({
        type: "error",
        text: "Only Admin can delete user accounts.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${targetUser.name}" (${targetUser.email})?`
    );
    if (!confirmed) return;

    // Prefer helper from ../utils/auth if available, otherwise update localStorage cleanly
    if (typeof authModule.deleteUserByAdmin === "function") {
      const res = authModule.deleteUserByAdmin(targetUser.id ?? targetUser.email);
      if (res && res.ok === false) {
        setFeedback({ type: "error", text: res.error || "Failed to delete user." });
        return;
      }
    } else if (typeof authModule.deleteUser === "function") {
      const res = authModule.deleteUser(targetUser.id ?? targetUser.email);
      if (res && res.ok === false) {
        setFeedback({ type: "error", text: res.error || "Failed to delete user." });
        return;
      }
    } else {
      const updated = getUsers().filter((u) => {
        if (targetUser.id !== undefined && u.id !== undefined) {
          return u.id !== targetUser.id;
        }
        return u.email !== targetUser.email;
      });
      localStorage.setItem("carrierchk_users", JSON.stringify(updated));
    }

    const isSelf =
      (targetUser.id !== undefined &&
        currentUser.id !== undefined &&
        targetUser.id === currentUser.id) ||
      targetUser.email === currentUser.email;

    if (isSelf) {
      localStorage.removeItem("carrierchk_current_user");
      localStorage.removeItem("carrierchk_session");
    }

    window.dispatchEvent(new Event("carrierchk-auth-change"));
    refreshUsers();

    setFeedback({
      type: "success",
      text: `User "${targetUser.name}" has been deleted.`,
    });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 text-slate-800 font-sans antialiased">
      <section className="w-full max-w-full overflow-x-clip bg-gradient-to-br from-slate-950 via-[#0d3b22] to-[#156b3e] text-white py-10 sm:py-16">
        <div className="max-w-7xl w-full min-w-0 mx-auto px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 max-w-full">
            <span className="inline-block bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              {isAdmin ? "ADMIN DASHBOARD" : "USER DASHBOARD"}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight break-words">
              Welcome, <span className="text-emerald-300">{currentUser.name}</span>
            </h1>
            <p className="text-sm text-slate-200 mt-1 break-words">
              Active Role:{" "}
              <span className="font-mono font-bold uppercase text-emerald-300">
                {currentUser.role}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-full overflow-x-clip py-8 sm:py-14 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 min-w-0">
            {/* Admin Add User Form */}
            <div className="lg:col-span-5 w-full min-w-0 bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm h-fit">
              <h2 className="text-xl font-black text-slate-900 mb-1">Add New User</h2>
              <p className="text-xs text-slate-500 mb-5">
                Role is automatically assigned as{" "}
                <span className="font-bold text-[#156b3e]">user</span>.
              </p>

              {feedback.text && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-semibold border break-words ${
                    feedback.type === "error"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-emerald-50 border-emerald-200 text-[#156b3e]"
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <form onSubmit={handleQuickAddUser} className="space-y-4">
                <div className="min-w-0">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    className="w-full min-w-0 px-3.5 sm:px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full min-w-0 px-3.5 sm:px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full min-w-0 px-3.5 sm:px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#156b3e]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#156b3e] hover:bg-[#115431] text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                >
                  Create User (Role: user)
                </button>
              </form>
            </div>

            {/* Admin Users List */}
            <div className="lg:col-span-7 w-full min-w-0 bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                Registered Accounts ({usersList.length})
              </h2>
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px] sm:text-xs uppercase">
                      <th className="p-2.5 sm:p-3.5 font-black rounded-tl-xl">Name</th>
                      <th className="p-2.5 sm:p-3.5 font-black">Email</th>
                      <th className="p-2.5 sm:p-3.5 font-black">Role</th>
                      <th className="p-2.5 sm:p-3.5 font-black rounded-tr-xl text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id ?? u.email} className="hover:bg-slate-50/70">
                        <td className="p-2.5 sm:p-3.5 font-bold text-slate-900 break-words">
                          {u.name}
                        </td>
                        <td className="p-2.5 sm:p-3.5 font-mono text-[11px] sm:text-xs text-slate-600 break-all">
                          {u.email}
                        </td>
                        <td className="p-2.5 sm:p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase ${
                              u.role === "admin"
                                ? "bg-emerald-100 text-[#156b3e]"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {usersList.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-6 text-center text-sm text-slate-500"
                        >
                          No registered accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* User Dashboard */
          <div className="w-full min-w-0 bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-2xl font-black text-slate-900">User Workspace</h2>
            <p className="text-sm text-slate-600">
              You are logged in as a standard{" "}
              <span className="font-bold text-[#156b3e]">user</span>. User creation
              and Admin menus are restricted to Admin accounts.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/app1"
                className="bg-[#156b3e] hover:bg-[#115431] text-white font-bold px-5 py-3 rounded-xl text-xs transition"
              >
                FMCSA Data
              </Link>
              <Link
                to="/app2"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs transition"
              >
                Carrier Lookup
              </Link>
              <Link
                to="/app3"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition"
              >
                Motus Extractor
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;