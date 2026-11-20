export const USERS_STORAGE_KEY = "carrierchk_users";
export const CURRENT_USER_KEY = "carrierchk_current_user";

const DEFAULT_ADMIN = {
  id: 1,
  name: "Fiaz Ahmad",
  email: "fiazahmad13072@gmail.com",
  password: "fiaz@13072",
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export function initUsers() {
  const existing = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "null");

  if (!Array.isArray(existing) || existing.length === 0) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }

  const adminEmailLower = DEFAULT_ADMIN.email.toLowerCase();
  const hasTargetAdmin = existing.some(
    (u) => u.email?.toLowerCase() === adminEmailLower
  );

  const normalized = existing.map((u) => {
    if (u.email?.toLowerCase() === adminEmailLower) {
      return {
        ...u,
        name: u.name || DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password,
        role: "admin",
      };
    }
    return {
      ...u,
      role: u.role === "admin" && u.email?.toLowerCase() !== adminEmailLower ? "user" : (u.role || "user"),
    };
  });

  const finalUsers = hasTargetAdmin ? normalized : [DEFAULT_ADMIN, ...normalized];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUsers));
  return finalUsers;
}

export function getUsers() {
  return initUsers();
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("carrierchk-auth-change"));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event("carrierchk-auth-change"));
  }
}

export function logoutUser() {
  setCurrentUser(null);
}

// Role guard: only Admin can create new users, and assigned role is always "user"
export function createUserByAdmin({ name, email, password }) {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "admin") {
    return {
      ok: false,
      error: "Unauthorized: Only Admin can create new users.",
    };
  }

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanName || !cleanEmail || cleanPassword.length < 6) {
    return {
      ok: false,
      error: "Please enter valid name, email, and a password (min 6 characters).",
    };
  }

  const users = getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return {
      ok: false,
      error: "A user with this email already exists.",
    };
  }

  const newUser = {
    id: Date.now(),
    name: cleanName,
    email: cleanEmail,
    password: cleanPassword,
    role: "user", // Automatically assigned "user" role
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
  window.dispatchEvent(new Event("carrierchk-auth-change"));

  return { ok: true, user: newUser };
}