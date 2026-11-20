export const USERS_STORAGE_KEY = "carrierchk_users";
export const CURRENT_USER_KEY = "carrierchk_current_user";

export const USERS_LIST = [
  {
    id: 1,
    name: "Admin",
    email: "fiazahmad13072@gmail.com",
    password: "atif1122",
    role: "admin",
  },
  {
    id: 2,
    name: "User",
    email: "user@360logistics.com",
    password: "user@13072",
    role: "user",
  },
];

let activeUserMemory = null;

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("carrierchk-auth-change"));
  }
}

export function initUsers() {
  return USERS_LIST;
}

export function getUsers() {
  return USERS_LIST;
}

export function getCurrentUser() {
  if (activeUserMemory) return activeUserMemory;
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(CURRENT_USER_KEY);
      if (raw) {
        activeUserMemory = JSON.parse(raw);
        return activeUserMemory;
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function setCurrentUser(user) {
  activeUserMemory = user || null;
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      if (user) {
        window.sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        window.sessionStorage.removeItem(CURRENT_USER_KEY);
      }
    }
  } catch {
    // ignore storage errors
  }
  notifyAuthChange();
}

export function logoutUser() {
  setCurrentUser(null);
}

export function loginUser({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  if (!cleanEmail || !rawPassword) {
    return { ok: false, error: "Please enter both email and password." };
  }

  const matchedUser = USERS_LIST.find(
    (u) =>
      String(u.email || "").trim().toLowerCase() === cleanEmail &&
      String(u.password || "") === rawPassword
  );

  if (!matchedUser) {
    return { ok: false, error: "Invalid email or password." };
  }

  setCurrentUser(matchedUser);
  return { ok: true, user: matchedUser };
}

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

  const exists = USERS_LIST.some(
    (u) => String(u.email || "").trim().toLowerCase() === cleanEmail
  );
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
    role: "user",
  };

  USERS_LIST.push(newUser);
  notifyAuthChange();

  return { ok: true, user: newUser };
}