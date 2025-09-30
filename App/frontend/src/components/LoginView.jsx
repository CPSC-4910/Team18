import React from "react";

export default function LoginView({ show }) {
  return (
    <section id="loginView" aria-labelledby="loginHeading">
      <div className="login-shell">
        <form className="login-card" onSubmit={(e) => e.preventDefault()}>
          <h2 id="loginHeading">Welcome back</h2>
          <p className="login-sub">Sign in to continue to <strong>Truck Points</strong></p>

          <div className="field">
            <label className="label" htmlFor="username">Username</label>
            <input className="input" type="text" id="username" name="username" placeholder="e.g. jdoe" />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input className="input" type="password" id="password" name="password" placeholder="••••••••" />
          </div>

          <div className="row" style={{ margin: "6px 0 10px" }}>
            <label className="checkbox">
              <input type="checkbox" id="remember" /> Remember me
            </label>
            <a href="#" className="muted">Forgot password?</a>
          </div>

          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={() => show("about")}>
              ← Back to About
            </button>
            <button type="submit" className="btn btn-primary btn-wide">
              Sign In
            </button>
          </div>

          <p id="formMsg" className="muted" role="status" style={{ marginTop: "12px" }}></p>
        </form>
      </div>
    </section>
  );
}