import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { IconMenu } from "./icons";
import { useLanguage } from "../context/LanguageContext";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-canvas flex font-body text-ink">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 bg-primary-dark text-white px-4 py-3 sticky top-0 z-20 flex-shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10"
            aria-label={t("common.openMenu")}
          >
            <IconMenu />
          </button>
          <span className="font-display font-bold text-sm">{t("clinicName")}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}