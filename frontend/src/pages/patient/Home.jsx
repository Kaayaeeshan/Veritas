import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDoctors } from "../../api/doctors";
import { getMyQueueStatus } from "../../api/queue";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import TrustRing from "../../components/TrustRing";
import Avatar from "../../components/Avatar";

export default function Home() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listDoctors(), getMyQueueStatus().catch(() => null)])
      .then(([doctorList, status]) => {
        setDoctors(doctorList);
        setQueueStatus(status);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink">
          {t("home.goodMorning")}, {profile?.fullName?.split(" ")[0] || ""}
        </h2>
      </div>

      <div
        onClick={() => navigate("/patient/find-a-doctor")}
        className="relative flex items-center gap-2 bg-surface-alt rounded-xl px-4 py-3 text-muted text-sm cursor-pointer"
      >
        🔍 {t("home.searchPlaceholder")}
      </div>

      {queueStatus && (
        <div
          onClick={() => navigate("/patient/queue")}
          className="cursor-pointer rounded-2xl bg-primary-dark text-white p-5"
        >
          <div className="font-mono text-[10px] uppercase tracking-wide opacity-70">{t("home.todayUpcoming")}</div>
          <h3 className="font-display font-bold text-lg mt-1">{queueStatus.doctorName}</h3>
          <p className="text-sm opacity-80">{queueStatus.specialty}</p>
          <div className="flex justify-between items-end mt-4">
            <div>
              <div className="font-display font-bold text-2xl">{queueStatus.position}</div>
              <div className="font-mono text-[10px] uppercase opacity-70">{t("home.inLine")}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-2xl">≈{queueStatus.estimatedWaitMinutes}m</div>
              <div className="font-mono text-[10px] uppercase opacity-70">{t("home.aiEstWait")}</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-display font-bold text-sm mb-2">{t("home.doctorsNearYou")}</h4>
        {loading ? (
          <p className="text-sm text-muted">{t("home.loadingDoctors")}</p>
        ) : doctors.length === 0 ? (
          <p className="text-sm text-muted">
            {t("home.noDoctorsYet")}
          </p>
        ) : (
          <div className="divide-y divide-line">
            {doctors.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/patient/doctors/${d.id}`)}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Avatar name={d.fullName} size={44} className="!rounded-xl" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold">{d.fullName}</h5>
                  <p className="text-xs text-muted">{d.specialty}</p>
                </div>
                <TrustRing score={d.credibilityScore} size={40} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
