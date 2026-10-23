import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const VALID_ROLES = ["patient", "doctor", "admin"];


export default function RoleRedirect() {
  const { firebaseUser, role, loading, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  
  const brokenAccount = !loading && firebaseUser && !VALID_ROLES.includes(role);

  useEffect(() => {
    if (loading || brokenAccount) return;
    if (!firebaseUser) {
      navigate("/login", { replace: true });
    } else if (role === "doctor") {
      navigate("/doctor", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/patient", { replace: true });
    }
  }, [firebaseUser, role, loading, brokenAccount, navigate]);

  if (brokenAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <p className="text-sm text-ink font-semibold mb-2">
            This account isn't fully set up yet.
          </p>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Your sign-in worked, but no profile was found for it. This can happen if the
            account was created before a recent setup change. Sign out and sign up again to
            fix it.
          </p>
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    );
  }

  return <div className="p-10 text-center text-muted">{t("common.loading")}</div>;
}