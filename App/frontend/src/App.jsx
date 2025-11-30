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
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [originalAdminUser, setOriginalAdminUser] = useState(null);

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
    localStorage.removeItem("user");
    setView("about");
    history.pushState({ v: "about" }, "", "#/about");
  };

  // Handle admin impersonating a driver
  const handleImpersonateDriver = (driverData) => {
    console.log("[IMPERSONATION] Impersonating driver:", driverData);
    // Store the original admin user
    setOriginalAdminUser(user);
    // Ensure the driver object has all required fields, including role
    const impersonatedDriver = {
      ...driverData,
      role: "driver", // Ensure role is set
      email: driverData.email || "", // Ensure email exists
      username: driverData.username, // Ensure username exists
    };
    console.log("[IMPERSONATION] Impersonated driver object:", impersonatedDriver);
    // Set the impersonated driver as the current user
    setImpersonatedUser(impersonatedDriver);
    // Switch to driver view
    setView("driver");
    history.pushState({ v: "driver" }, "", "#/driver");
  };

  // Handle admin impersonating a sponsor
  const handleImpersonateSponsor = (sponsorData) => {
    console.log("[IMPERSONATION] Impersonating sponsor:", sponsorData);
    // Store the original admin user
    setOriginalAdminUser(user);
    // Ensure the sponsor object has all required fields, including role
    const impersonatedSponsor = {
      ...sponsorData,
      role: "sponsor", // Ensure role is set
      email: sponsorData.email || "", // Ensure email exists
      username: sponsorData.username, // Ensure username exists
    };
    console.log("[IMPERSONATION] Impersonated sponsor object:", impersonatedSponsor);
    // Set the impersonated sponsor as the current user
    setImpersonatedUser(impersonatedSponsor);
    // Switch to sponsor view
    setView("sponsor");
    history.pushState({ v: "sponsor" }, "", "#/sponsor");
  };

  // Handle exiting impersonation
  const handleExitImpersonation = () => {
    setImpersonatedUser(null);
    setUser(originalAdminUser);
    setOriginalAdminUser(null);
    setView("admin");
    history.pushState({ v: "admin" }, "", "#/admin");
  };

  // If user is logged in and viewing dashboard, show only dashboard
if (user) {
  // If impersonating a user, show the appropriate view with impersonated user
  if (impersonatedUser) {
    if (impersonatedUser.role === "driver") {
      return <DriverView user={impersonatedUser} onLogout={handleExitImpersonation} isImpersonated={true} originalAdmin={originalAdminUser} onExitImpersonation={handleExitImpersonation} />;
    } else if (impersonatedUser.role === "sponsor") {
      return <SponsorView user={impersonatedUser} onLogout={handleExitImpersonation} isImpersonated={true} originalAdmin={originalAdminUser} onExitImpersonation={handleExitImpersonation} />;
    }
  }
  
  if (view === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} onImpersonateDriver={handleImpersonateDriver} onImpersonateSponsor={handleImpersonateSponsor} />;
  } else if (view === "sponsor") {
    return <SponsorView user={user} onLogout={handleLogout} />;
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