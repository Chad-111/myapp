// src/utils/auth.js

import { jwtDecode } from "jwt-decode";
function isTokenExpired() {
  const token = localStorage.getItem("authToken");
  if (!token || token.split(".").length !== 3) {
    return true; // treat invalid or empty token as expired
  }

  try {
    const decoded = jwtDecode(token);
    const exp = decoded.exp;

    if (!exp) return true;

    const now = Date.now() / 1000; // JWT `exp` is in seconds
    return now > exp;
  } catch (error) {
    console.error("Token decoding error:", error);
    return true; // on decoding error, treat token as expired
  }
}

export const getAuthToken = () => {
  if (!isTokenExpired()) {
    return localStorage.getItem("authToken");
  } else {
    removeAuthToken();
    return null;
  }
};

export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("authToken");
};
