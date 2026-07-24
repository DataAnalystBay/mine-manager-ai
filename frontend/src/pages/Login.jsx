import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import useAuth from "../hooks/useAuth";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@minemanager.ai");
  const [password, setPassword] = useState("admin123");
  const [rememberMe, setRememberMe] = useState(true);
  const [language, setLanguage] = useState("EN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(email, password);

      login(response.access_token, {
        full_name: response.full_name,
        email: response.email,
        role: response.role,
        company_id: response.company_id,
        rememberMe,
        language,
      });

      navigate("/");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="brand-top">
            <img
              src="/images/logo.png"
              alt="Mine Manager AI Logo"
              className="brand-logo"
            />

            <div>
              <h1>Mine Manager AI</h1>
              <p className="brand-subtitle">
                Executive Operations Intelligence Platform
              </p>
            </div>
          </div>

          <div className="brand-hero simple-hero">
            <div className="hero-label">
              Commercial MVP · Version 1.0
            </div>

            <h3>
              Transform operational data into executive decisions.
            </h3>

            <p>
              Monitor. Analyze. Act.
            </p>

            <p className="brand-support-text">
              Secure AI-powered operational intelligence for modern mining
              companies.
            </p>
          </div>

          <div className="brand-footer">
            Secure Pilot Access · Built for Mine Leaders
          </div>
        </section>

        <section className="login-card">
          <div className="language-toggle">
            <button
              className={language === "EN" ? "active" : ""}
              onClick={() => setLanguage("EN")}
              type="button"
            >
              🇬🇧 English
            </button>

            <button
              className={language === "MN" ? "active" : ""}
              onClick={() => setLanguage("MN")}
              type="button"
            >
              🇲🇳
            </button>
          </div>

          <h2>Welcome Back</h2>

          <p className="login-muted">
            Sign in to access your Executive Dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@minemanager.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="login-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>

              <button type="button" className="link-button">
                Forgot Password?
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="security-note">
            Secure Access
            <br />
            JWT Authentication · Role-Based Access Control
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;