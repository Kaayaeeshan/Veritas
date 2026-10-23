import React, { useEffect, useState } from "react";
import { listDoctors } from "../../api/doctors";
import { listFlaggedReviews, resolveFlaggedReview } from "../../api/reviews";
import { useLanguage } from "../../context/LanguageContext";
import TrustRing from "../../components/TrustRing";

export default function CredibilityReviews() {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [flagged, setFlagged] = useState([]);

  function refresh() {
    listDoctors().then(setDoctors);
    listFlaggedReviews().then(setFlagged);
  }
  useEffect(refresh, []);

  async function resolve(id, decision) {
    await resolveFlaggedReview(id, decision);
    refresh();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">{t("pages.credibilityReviewsTitle")}</h2>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h4 className="font-display font-bold text-sm mb-3">{t("adminCredibilityReviews.doctorTrustScores")}</h4>
          {doctors.length === 0 && <p className="text-xs text-muted">{t("adminCredibilityReviews.noDoctorsYet")}</p>}
          <div className="space-y-3">
            {doctors.map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <TrustRing score={d.credibilityScore} size={38} />
                <div>
                  <b className="text-sm block">{d.fullName}</b>
                  <span className="text-xs text-muted">{d.verifiedReviewCount || 0} {t("adminCredibilityReviews.verifiedReviewsSuffix")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5">
          <h4 className="font-display font-bold text-sm mb-3">{t("adminCredibilityReviews.flaggedForReview")}</h4>
          <div className="space-y-3">
            {flagged.length === 0 && <p className="text-xs text-muted">{t("adminCredibilityReviews.nothingFlagged")}</p>}
            {flagged.map((f) => (
              <div key={f.id} className="border border-line rounded-xl p-3.5">
                <span className="text-[10px] font-bold font-mono uppercase bg-alert-soft text-alert px-2 py-1 rounded-full">
                  {f.reasonTag}
                </span>
                <p className="text-xs italic text-muted my-2">"{f.text}" — on {f.doctorName}</p>
                <span className="text-[11px] text-alert font-semibold">{f.reasonDetail}</span>
                <div className="flex gap-2 mt-2.5">
                  <button onClick={() => resolve(f.id, "reject")} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">
                    {t("adminCredibilityReviews.rejectReview")}
                  </button>
                  <button onClick={() => resolve(f.id, "keep")} className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold">
                    {t("adminCredibilityReviews.keep")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
