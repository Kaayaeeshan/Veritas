import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../../api/account";
import { useLanguage } from "../../context/LanguageContext";
import Avatar from "../../components/Avatar";

export default function AccountSettings() {
  const { profile, role, logout, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getMyProfile().then((p) => setForm({ fullName: p.fullName, email: p.email, phone: p.phone || "" }));
  }, []);

  async function saveChanges() {
    setError("");
    setStatus("");

    if (password && password !== password2) {
      setError(t("accountSettings.passwordMismatch"));
      return;
    }

    setStatus(t("accountSettings.saving"));
    try {
      await updateMyProfile(form);
      if (password) {
        await changeMyPassword(null, password);
        setPassword("");
        setPassword2("");
      }
      await refreshProfile();
      setStatus(t("accountSettings.saved"));
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Something went wrong.";
      setError(`${t("accountSettings.couldntSave")} ${message}`);
      setStatus("");
      console.error("saveChanges failed:", err);
    }
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-4">{t("accountSettings.myProfile")}</h2>

      <div className="bg-surface border border-line rounded-2xl p-5 max-w-xl">
        <div className="flex items-center gap-3.5 mb-5">
          <Avatar name={profile?.fullName} size={56} className="!rounded-xl" textClassName="text-lg" />
          <div className="flex-1">
            <b className="block text-sm">{profile?.fullName}</b>
            <span className="text-[11.5px] text-muted capitalize">{role}</span>
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.fullName")}</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.email")}</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.phoneNumber")}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm"
            />
          </div>
        </div>

        <hr className="border-line my-4.5" />
        <p className="text-[11.5px] text-muted mb-2.5">{t("accountSettings.leavePasswordBlank")}</p>
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("accountSettings.newPassword")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("common.confirmPassword")}</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-surface-alt text-sm"
            />
          </div>
        </div>

        {error && <p className="text-xs text-alert font-semibold mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={saveChanges} className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold">
            {t("accountSettings.saveChanges")}
          </button>
          <button onClick={logout} className="px-5 py-2.5 rounded-lg border border-line text-sm font-semibold ml-auto">
            {t("signOut")}
          </button>
        </div>

        {status && <p className="text-xs text-muted mt-3">{status}</p>}

        {role === "doctor" && (
          <p className="text-xs text-muted mt-4 leading-relaxed">
            {t("accountSettings.doctorFieldsNotice")}
          </p>
        )}
      </div>
    </div>
  );
}
