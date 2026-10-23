import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorQueue, callNextPatient, markVisitComplete } from "../../api/queue";
import { getDoctorCredibility } from "../../api/doctors";
import { useLanguage } from "../../context/LanguageContext";

function Kpi({ label, value, delta }) {
  return (
    <div className="bg-surface-alt rounded-2xl p-4">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-display font-bold text-2xl mt-1">{value}</div>
      {delta && <div className="text-xs font-semibold mt-1 text-success">{delta}</div>}
    </div>
  );
}

export default function Schedule() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credibility, setCredibility] = useState(null);

  function refresh() {
    if (!profile?.doctorId) return;
    getDoctorQueue(profile.doctorId).then(setQueue).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (profile?.doctorId) {
      refresh();
      getDoctorCredibility(profile.doctorId).then(setCredibility);
    }
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">{t("pages.scheduleTitle")}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label={t("doctorSchedule.patientsToday")} value={queue.length} />
        <Kpi label={t("doctorSchedule.inQueueNow")} value={queue.filter((q) => q.status === "waiting").length} />
        <Kpi label={t("doctorSchedule.avgConsult")} value="14m" />
        <Kpi label={t("doctorSchedule.trustScore")} value={credibility?.score ?? "—"} />
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5">
        <h4 className="font-display font-bold text-sm mb-4">{t("doctorSchedule.queue")}</h4>
        {loading ? (
          <p className="text-sm text-muted">{t("common.loading")}</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-muted">{t("doctorSchedule.noOneInQueue")}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-muted font-mono text-[10px] uppercase border-b border-line">
                  <th className="py-2">{t("common.patient")}</th>
                  <th>{t("common.checkIn")}</th>
                  <th>{t("common.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id} className="border-b border-line/60">
                    <td className="py-3">{q.patientName}</td>
                    <td>{q.checkInTime}</td>
                    <td className="capitalize">{q.status}</td>
                    <td className="text-right">
                      {q.status === "in_consultation" ? (
                        <button
                          onClick={() => markVisitComplete(q.id).then(refresh)}
                          className="px-3 py-1.5 rounded-lg border border-alert-soft text-alert text-xs font-semibold"
                        >
                          {t("doctorSchedule.endVisit")}
                        </button>
                      ) : q.status === "waiting" ? (
                        <button
                          onClick={() => callNextPatient(profile.doctorId).then(refresh)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                        >
                          {t("doctorSchedule.callNext")}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}