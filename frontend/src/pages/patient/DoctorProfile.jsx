import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoctor } from "../../api/doctors";
import { listDoctorReviews } from "../../api/doctors";
import { useLanguage } from "../../context/LanguageContext";
import TrustRing from "../../components/TrustRing";

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    getDoctor(doctorId).then(setDoctor);
    listDoctorReviews(doctorId).then(setReviews);
  }, [doctorId]);

  if (!doctor) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted mb-4">
        ← {t("common.back")}
      </button>

      <div className="bg-surface-alt rounded-2xl p-6 text-center max-w-lg">
        <h2 className="font-display font-bold text-lg">{doctor.fullName}</h2>
        <p className="text-xs text-muted mt-0.5">{doctor.specialty}</p>
        <div className="flex justify-center mt-4">
          <TrustRing score={doctor.credibilityScore} size={110} showLabel />
        </div>
        <div className="grid grid-cols-3 mt-4 pt-4 border-t border-line text-center">
          <div>
            <b className="block font-display font-bold">{doctor.verifiedReviewCount || 0}</b>
            <span className="text-[10px] font-mono uppercase text-muted">{t("doctorProfile.verifiedReviews")}</span>
          </div>
          <div>
            <b className="block font-display font-bold">{doctor.responseRate || 0}%</b>
            <span className="text-[10px] font-mono uppercase text-muted">{t("doctorProfile.responseRate")}</span>
          </div>
          <div>
            <b className="block font-display font-bold">{doctor.flaggedFilteredCount || 0}</b>
            <span className="text-[10px] font-mono uppercase text-muted">{t("doctorProfile.flaggedFiltered")}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 max-w-lg">
        <h4 className="font-display font-bold text-sm mb-2">{t("doctorProfile.verifiedPatientReviews")}</h4>
        {reviews.length === 0 && <p className="text-xs text-muted">{t("doctorProfile.noVerifiedReviews")}</p>}
        <div className="space-y-2.5">
          {reviews.map((r) => (
            <div key={r.id} className="bg-surface-alt rounded-xl p-3.5">
              <div className="flex justify-between items-center mb-1">
                <b className="text-sm">{r.patientDisplayName}</b>
                <span className="inline-flex items-center gap-1 bg-primary-light text-primary-dark text-[9px] font-bold px-2 py-1 rounded-full font-mono uppercase">
                  ✓ {t("doctorProfile.verifiedVisit")}
                </span>
              </div>
              <div className="text-gold text-xs mb-1">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p className="text-xs text-ink">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 max-w-lg mt-5">
        <button
          onClick={() => navigate(`/patient/doctors/${doctorId}/book`)}
          className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm"
        >
          {t("doctorProfile.bookAppointment")}
        </button>
        <button
          onClick={() => navigate(`/patient/doctors/${doctorId}/review`)}
          className="flex-1 py-3 rounded-lg border border-line text-sm font-semibold"
        >
          {t("doctorProfile.submitReview")}
        </button>
      </div>
    </div>
  );
}
