// App/frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import "./styles/index.css";
import Header from "./components/Header.jsx";
import AboutView from "./components/AboutView.jsx";
import LoginView from "./components/LoginView.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";

export default function App() {
  const [view, setView] = useState("about");
  const [user, setUser] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setView("dashboard");
      } catch (error) {
        console.error("Error loading user session:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Handle URL hash changes
  useEffect(() => {
    const onPopState = () => {
      if (user && location.hash === "#/dashboard") {
        setView("dashboard");
      } else if (location.hash === "#/login") {
        setView("login");
      } else {
        setView("about");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [user]);

  const show = (v) => {
    setView(v);
    if (v === "login" && location.hash !== "#/login") {
      history.pushState({ v: "login" }, "", "#/login");
    } else if (v === "about" && location.hash !== "#/about") {
      history.pushState({ v: "about" }, "", "#/about");
    } else if (v === "dashboard" && location.hash !== "#/dashboard") {
      history.pushState({ v: "dashboard" }, "", "#/dashboard");
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Save user to localStorage for session persistence
    localStorage.setItem("user", JSON.stringify(userData));
    setView("dashboard");
    history.pushState({ v: "dashboard" }, "", "#/dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setView("about");
    history.pushState({ v: "about" }, "", "#/about");
  };

  // If user is logged in and viewing dashboard, show only dashboard
  if (user && view === "dashboard") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Otherwise show the normal app with header/footer
  return (
    <>
      <Header show={show} user={user} onLogout={handleLogout} />
      
      {/* About view */}
      <div className={view === "about" ? "view active" : "view"}>
        <main className="container">
          <AboutView />
        </main>
      </div>
      
      {/* Login view */}
      <div className={view === "login" ? "view active" : "view"}>
        <LoginView show={show} onLoginSuccess={handleLoginSuccess} />
      </div>
      
      <footer>
        © 2025 Team 18 • Built with ❤️ for safer roads and happier drivers.
      </footer>
    </>
  );
}