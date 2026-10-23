import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpPatient } from "../firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Signup() {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (firebaseUser) navigate("/");
  }, [firebaseUser, navigate]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError(t("signup.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await signUpPatient({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
    } catch (err) {
      setError(t("signup.createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center font-body">
      <div className="p-6">
      <div className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-display font-bold text-2xl mb-6">
          V
        </div>
        <h1 className="font-display font-bold text-2xl text-ink">{t("signup.title")}</h1>
        <p className="text-muted text-sm mt-2 mb-6 leading-relaxed">
          {t("signup.subtitle")}
        </p>

        {error && <p className="text-alert text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.fullName")}</label>
            <input required value={form.fullName} onChange={update("fullName")}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.email")}</label>
            <input type="email" required value={form.email} onChange={update("email")}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.phoneNumber")}</label>
            <input value={form.phone} onChange={update("phone")}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.password")}</label>
            <input type="password" required value={form.password} onChange={update("password")}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.confirmPassword")}</label>
            <input type="password" required value={form.confirm} onChange={update("confirm")}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition disabled:opacity-60">
            {submitting ? "…" : t("signup.createAccount")}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          {t("signup.alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-primary font-semibold">{t("common.signIn")}</Link>
        </p>
      </div>
      </div>
    </div>
  );
}