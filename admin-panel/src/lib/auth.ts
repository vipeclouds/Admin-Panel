export const ADMIN_TOKEN_KEY = "admin_token";

export const getAdminToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  document.cookie = `${ADMIN_TOKEN_KEY}=${token}; path=/`;
};

export const clearAdminToken = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  document.cookie = `${ADMIN_TOKEN_KEY}=; Max-Age=0; path=/`;
};

export const syncAdminTokenCookie = () => {
  if (typeof window === "undefined") {
    return;
  }
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    document.cookie = `${ADMIN_TOKEN_KEY}=${token}; path=/`;
  } else {
    document.cookie = `${ADMIN_TOKEN_KEY}=; Max-Age=0; path=/`;
  }
};
