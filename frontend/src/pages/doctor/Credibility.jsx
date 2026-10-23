import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorCredibility } from "../../api/doctors";
import { listDoctorReviews } from "../../api/doctors";
import { useLanguage } from "../../context/LanguageContext";
import TrustRing from "../../components/TrustRing";

export default function Credibility() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!profile?.doctorId) return;
    getDoctorCredibility(profile.doctorId).then(setData);
    listDoctorReviews(profile.doctorId).then(setReviews);
  }, [profile]);

  if (!data) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">{t("pages.myCredibilityTitle")}</h2>

      <div className="bg-surface border border-line rounded-2xl p-5 max-w-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <TrustRing score={data.score} size={110} showLabel />
          <div className="grid grid-cols-3 gap-4 sm:gap-6 flex-1 text-center sm:text-left">
            <div>
              <b className="block font-display font-bold text-xl">{data.verifiedReviewCount}</b>
              <span className="text-[10px] font-mono uppercase text-muted">{t("doctorCredibility.verifiedReviews")}</span>
            </div>
            <div>
              <b className="block font-display font-bold text-xl">{data.responseRate}%</b>
              <span className="text-[10px] font-mono uppercase text-muted">{t("doctorCredibility.responseRate")}</span>
            </div>
            <div>
              <b className="block font-display font-bold text-xl">{data.flaggedFilteredCount}</b>
              <span className="text-[10px] font-mono uppercase text-muted">{t("doctorCredibility.flaggedFiltered")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <h4 className="font-display font-bold text-sm mb-2">{t("doctorCredibility.recentReviews")}</h4>
        {reviews.length === 0 && <p className="text-xs text-muted">{t("doctorCredibility.noVerifiedReviews")}</p>}
        <div className="space-y-2.5">
          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="bg-surface-alt rounded-xl p-3.5">
              <b className="text-sm block">{r.patientDisplayName}</b>
              <p className="text-xs text-ink mt-1">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
