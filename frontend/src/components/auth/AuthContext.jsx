import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../../utils/ApiHandler";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.permissions) {
          setPermissions(decoded.permissions);
        }

        const response = await api.get("/api/user-info");
        if (response.data.success) {
          setUser(response.data.user_info);
          setIsAuthenticated(true);

          if (response.data.user_info.permissions) {
            setPermissions(response.data.user_info.permissions);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setIsAuthenticated(false);
    setPermissions([]);

    const auth0Domain = process.env.REACT_APP_AUTH0_DOMAIN;
    const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
    const returnTo = encodeURIComponent(window.location.origin + "/login");

    window.location.href = `https://${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`;
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, logout, permissions }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
