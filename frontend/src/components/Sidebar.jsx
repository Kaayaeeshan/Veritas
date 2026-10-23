import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";
import {
  IconHome, IconSearch, IconClock, IconUser, IconClipboard,
  IconShield, IconBarChart, IconSparkles, IconPower, IconStethoscope, IconX,
} from "./icons";

const NAV_ITEMS = {
  patient: [
    { to: "/patient", labelKey: "nav.home", Icon: IconHome, end: true },
    { to: "/patient/find-a-doctor", labelKey: "nav.findDoctor", Icon: IconSearch },
    { to: "/patient/queue", labelKey: "nav.myQueue", Icon: IconClock },
    { to: "/account", labelKey: "nav.profile", Icon: IconUser },
  ],
  doctor: [
    { to: "/doctor", labelKey: "nav.schedule", Icon: IconClipboard, end: true },
    { to: "/doctor/credibility", labelKey: "nav.myCredibility", Icon: IconShield },
    { to: "/account", labelKey: "nav.profile", Icon: IconUser },
  ],
  admin: [
    { to: "/admin", labelKey: "nav.overview", Icon: IconBarChart, end: true },
    { to: "/admin/queue", labelKey: "nav.queueManagement", Icon: IconClock },
    { to: "/admin/doctors", labelKey: "nav.manageDoctors", Icon: IconStethoscope },
    { to: "/admin/credibility", labelKey: "nav.credibilityReviews", Icon: IconShield },
    { to: "/admin/analytics", labelKey: "nav.analytics", Icon: IconBarChart },
    { to: "/admin/ai-models", labelKey: "nav.aiModels", Icon: IconSparkles },
  ],
};

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { role, profile, logout } = useAuth();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const items = NAV_ITEMS[role] || [];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`w-72 sm:w-64 bg-primary-dark text-white flex flex-col p-5 flex-shrink-0 min-h-screen
          fixed inset-y-0 left-0 z-40 transition-transform duration-200
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center font-display font-bold flex-shrink-0">V</div>
            <div>
              <b className="font-display font-bold text-sm block">Veritas</b>
              <span className="text-[11px] opacity-70">{t("clinicName")}</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white p-1" aria-label="Close menu">
            <IconX />
          </button>
        </div>

        <div className="mb-5 px-1">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/15 focus:outline-none"
            aria-label="Language"
          >
            {supportedLanguages.map((code) => (
              <option key={code} value={code} className="text-black">
                {translationsLabel(code)}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map(({ to, labelKey, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive ? "bg-white/15 font-semibold" : "text-white/75 hover:bg-white/5"
                }`
              }
            >
              <Icon />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <Avatar name={profile?.fullName} size={34} className="!rounded-lg" textClassName="text-xs" />
          <div className="flex-1 text-xs min-w-0">
            <b className="block truncate">{profile?.fullName}</b>
            <span className="opacity-60 capitalize">{role}</span>
          </div>
          <button onClick={logout} className="text-white/60 hover:text-white transition flex-shrink-0" title={t("signOut")}>
            <IconPower />
          </button>
        </div>
      </aside>
    </>
  );
}

function translationsLabel(code) {
  const names = { en: "English", si: "සිංහල", ta: "தமிழ்" };
  return names[code] || code;
}