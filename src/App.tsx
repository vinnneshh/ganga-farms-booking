/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { AuthState } from "./types";

export default function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    return {
      token,
      isAuthenticated: !!token,
    };
  });

  const handleLogin = (token: string) => {
    localStorage.setItem("token", token);
    setAuth({ token, isAuthenticated: true });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.removeItem("token");
    setAuth({ token: null, isAuthenticated: false });
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (auth.token) {
        try {
          const res = await fetch("/api/bookings", {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
          if (res.status === 401) {
            handleLogout();
          }
        } catch (e) {
          console.error("Token verification failed", e);
        }
      }
    };
    verifyToken();
  }, []);

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} token={auth.token!} />;
}
