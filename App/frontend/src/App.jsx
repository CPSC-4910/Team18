// App/frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import "./styles/index.css";
import Header from "./components/Header.jsx";
import AboutView from "./components/AboutView.jsx";
import LoginView from "./components/LoginView.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import DriverView from "./components/DriverView.jsx";
import SponsorView from "./components/SponsorView.jsx";
import ForgotPasswordView from "./components/ForgotPasswordView.jsx";

export default function App() {
  const [view, setView] = useState("about");
  const [user, setUser] = useState(null);
  const [assumedDriver, setAssumedDriver] = useState(null); // NEW: For sponsor assuming driver role

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

    // NEW: Check for assumed driver session
    const savedAssumedDriver = localStorage.getItem("assumedDriver");
    if (savedAssumedDriver) {
      try {
        const assumedDriverData = JSON.parse(savedAssumedDriver);
        setAssumedDriver(assumedDriverData);
      } catch (error) {
        console.error("Error loading assumed driver session:", error);
        localStorage.removeItem("assumedDriver");
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
      } else if(location.hash === "#/forgot") {
        setView("forgot");
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
    } else if (v === "forgot" && location.hash !== "#/forgot") {
      history.pushState({v: "forgot" }, "", "#/forgot")
    } else if (v === "dashboard" && location.hash !== "#/dashboard") {
      history.pushState({ v: "dashboard" }, "", "#/dashboard");
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // ✅ Redirect based on user role
    if (userData.role === "admin") {
      setView("admin");
      history.pushState({ v: "admin" }, "", "#/admin");
    } else if (userData.role === "sponsor") {
      setView("sponsor");
      history.pushState({ v: "sponsor" }, "", "#/sponsor");
    } else if (userData.role === "driver") {
      setView("driver");
      history.pushState({ v: "driver" }, "", "#/driver");
    } else {
      // fallback
      setView("about");
      history.pushState({ v: "about" }, "", "#/about");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAssumedDriver(null); // NEW: Clear assumed driver on logout
    localStorage.removeItem("user");
    localStorage.removeItem("assumedDriver"); // NEW: Clear assumed driver from storage
    setView("about");
    history.pushState({ v: "about" }, "", "#/about");
  };

  // NEW: Handle sponsor assuming driver role
  const handleAssumeDriver = (driverData) => {
    setAssumedDriver(driverData);
    localStorage.setItem("assumedDriver", JSON.stringify(driverData));
    setView("driver");
    history.pushState({ v: "driver" }, "", "#/driver");
  };

  // NEW: Handle sponsor stopping assumption of driver role
  const handleStopAssuming = () => {
    setAssumedDriver(null);
    localStorage.removeItem("assumedDriver");
    setView("sponsor");
    history.pushState({ v: "sponsor" }, "", "#/sponsor");
  };

  // If user is logged in and viewing dashboard, show only dashboard
  if (user) {
    // NEW: If sponsor is assuming a driver role, show DriverView
    if (assumedDriver && user.role === "sponsor") {
      return (
        <DriverView 
          user={assumedDriver} 
          onLogout={handleStopAssuming} 
          isAssumedBySponsor={true}
          actualSponsor={user}
        />
      );
    }

    if (view === "admin") {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    } else if (view === "sponsor") {
      return <SponsorView user={user} onLogout={handleLogout} onAssumeDriver={handleAssumeDriver} />;
    } else if (view === "driver") {
      return <DriverView user={user} onLogout={handleLogout} />;
    }
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

      {/* Forgot Password view */}
      <div className={view === "forgot" ? "view active" : "view"}>
        <ForgotPasswordView show={show} onBack={() => show("login")}/>
      </div>
      
      <footer>
        © 2025 Team 18 • Built with ❤️ for safer roads and happier drivers.
      </footer>
    </>
  );
}