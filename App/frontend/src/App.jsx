import React, { useState, useEffect } from "react";
import "./styles/index.css";
import Header from "./components/Header.jsx";
import AboutView from "./components/AboutView.jsx";
import LoginView from "./components/LoginView.jsx";

export default function App() {
  const [view, setView] = useState(location.hash === "#/login" ? "login" : "about");

  const show = (v) => {
    setView(v);
    if (v === "login" && location.hash !== "#/login") history.pushState({ v: "login" }, "", "#/login");
    if (v === "about" && location.hash !== "#/about") history.pushState({ v: "about" }, "", "#/about");
  };

  useEffect(() => {
    const onPopState = () => {
      setView(location.hash === "#/login" ? "login" : "about");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <Header show={show} />
      
      {/* About view with container */}
      <div className={view === "about" ? "view active" : "view"}>
        <main className="container">
          <AboutView />
        </main>
      </div>
      
      {/* Login view without container (needs full height) */}
      <div className={view === "login" ? "view active" : "view"}>
        <LoginView show={show} />
      </div>
      
      <footer>
        © 2025 Team 18 • Built with ❤️ for safer roads and happier drivers.
      </footer>
    </>
  );
}