import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (firebaseUser) navigate("/");
  }, [firebaseUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(t("pages.loginError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center font-body">
      <div className="p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-display font-bold text-2xl">
              V
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-surface-alt text-ink text-xs rounded-lg px-2 py-1.5 border border-line focus:outline-none"
              aria-label="Language"
            >
              {supportedLanguages.map((code) => (
                <option key={code} value={code}>
                  {{ en: "English", si: "සිංහල", ta: "தமிழ்" }[code] || code}
                </option>
              ))}
            </select>
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">{t("pages.signInTitle")}</h1>
          <p className="text-muted text-sm mt-2 mb-3 leading-relaxed">
            {t("pages.signInSubtitle")}.
          </p>
          <p className="text-xs text-muted mb-6 leading-relaxed bg-surface-alt rounded-lg p-3">
            {t("pages.loginRoleNotice")}
          </p>

          {error && <p className="text-alert text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm mb-3.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.password")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition disabled:opacity-60"
            >
              {submitting ? "…" : t("common.signIn")}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-4">
            {t("pages.newPatient")}{" "}
            <Link to="/signup" className="text-primary font-semibold">
              {t("pages.createAccount")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}