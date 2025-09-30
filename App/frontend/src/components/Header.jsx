import React from "react";

export default function Header({ show }) {
  return (
    <header>
      <div className="brand">
        <div className="logo" aria-hidden="true"></div>
        <div className="title">Team 18 • Good Driver Incentive Program</div>
      </div>
      <div className="nav-actions">
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => show("about")}
          aria-label="Go to About"
          title="About"
        >
          About
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => show("login")}
          aria-label="Go to Login"
          title="Login"
        >
          Login
        </button>
      </div>
    </header>
  );
}
