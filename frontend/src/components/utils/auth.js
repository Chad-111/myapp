// src/utils/auth.js

import {jwtDecode} from "jwt-decode";
function isTokenExpired() {
  if (!isLoggedIn()) {
    return false;
  };

  const decoded = jwtDecode(localStorage.getItem("authToken"));
  const exp = decoded.exp;
  console.log(exp);
  if (!exp) return true;

  const now = Date.now() / 1000; // JWT `exp` is in seconds
  return now > exp;
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
