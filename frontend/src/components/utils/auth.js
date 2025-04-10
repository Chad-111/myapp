// src/utils/auth.js
export const getAuthToken = () => {
    return localStorage.getItem("authToken");
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
  