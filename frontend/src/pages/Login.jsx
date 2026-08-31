import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useLanguage } from "../context/LanguageContext";
import useAuth from "../hooks/useAuth";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState("admin@minemanager.ai");
  const [password, setPassword] = useState("admin123");
  const [rememberMe, setRememberMe] = useState(true);
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
    } catch (error) {
      console.error("Login flow failed:", error);

      setError(
        error?.response?.data?.detail ||
          error?.message ||
          t("login.unableToSignIn")
      );
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
              alt={t("login.logoAlt")}
              className="brand-logo"
            />

            <div>
              <h1>Mine Manager AI</h1>
              <p className="brand-subtitle">
                {t("login.brandSubtitle")}
              </p>
            </div>
          </div>

          <div className="brand-hero simple-hero">
            <div className="hero-label">
              {t("login.commercialMvp")}
            </div>

            <h3>
              {t("login.heroTitle")}
            </h3>

            <p>
              {t("login.heroTagline")}
            </p>

            <p className="brand-support-text">
              {t("login.brandSupport")}
            </p>
          </div>

          <div className="brand-footer">
            {t("login.brandFooter")}
          </div>
        </section>

        <section className="login-card">
          <div className="language-toggle">
            <button
              className={language === "EN" ? "active" : ""}
              onClick={() => setLanguage("EN")}
              type="button"
            >
              EN
            </button>

            <button
              className={language === "MN" ? "active" : ""}
              onClick={() => setLanguage("MN")}
              type="button"
            >
              МОН
            </button>
          </div>

          <h2>{t("login.welcomeBack")}</h2>

          <p className="login-muted">
            {t("login.dashboardAccess")}
          </p>

          <form onSubmit={handleLogin}>
            <label>{t("login.emailAddress")}</label>
            <input
              type="email"
              placeholder="admin@minemanager.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>{t("login.password")}</label>
            <input
              type="password"
              placeholder={t("login.passwordPlaceholder")}
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
                {t("login.rememberMe")}
              </label>

              <button type="button" className="link-button">
                {t("login.forgotPassword")}
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>

          <p className="security-note">
            {t("login.secureAccess")}
            <br />
            {t("login.securityDescription")}
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
