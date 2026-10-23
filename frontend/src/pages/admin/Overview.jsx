import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAdminOverview } from "../../api/admin";
import { useLanguage } from "../../context/LanguageContext";
import Avatar from "../../components/Avatar";

function Kpi({ label, value, delta, up }) {
  return (
    <div className="bg-surface-alt rounded-2xl p-4">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-display font-bold text-2xl mt-1">{value}</div>
      {delta && <div className={`text-xs font-semibold mt-1 ${up ? "text-success" : "text-alert"}`}>{delta}</div>}
    </div>
  );
}

export default function Overview() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAdminOverview().then(setData);
  }, []);

  if (!data) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">{t("pages.overviewTitle")}</h2>

      <div className="grid grid-cols-4 gap-4">
        <Kpi label={t("pages.patientsInQueue")} value={data.patientsInQueue} up />
        <Kpi label={t("pages.avgWaitTime")} value={`${data.avgWaitMinutes}m`} />
        <Kpi label={t("pages.appointmentsToday")} value={data.appointmentsToday} up />
        <Kpi label={t("pages.flaggedReviews")} value={data.flaggedReviews} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-surface border border-line rounded-2xl p-5">
          <h4 className="font-display font-bold text-sm mb-3">{t("pages.trustScoreTrend")}</h4>
          {data.trustTrend.length === 0 ? (
            <p className="text-xs text-muted">
              {t("pages.trustScoreEmpty")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.trustTrend}>
                <CartesianGrid stroke="#DCE3EA" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#14538C" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h4 className="font-display font-bold text-sm mb-3">{t("pages.liveQueueSnapshot")}</h4>
          {data.liveQueueSnapshot.length === 0 ? (
            <p className="text-xs text-muted">{t("adminCredibilityReviews.noDoctorsYet")}</p>
          ) : (
            <div className="space-y-3">
              {data.liveQueueSnapshot.map((d) => (
                <div key={d.doctorId} className="flex items-center gap-3">
                  <Avatar name={d.doctorName} size={36} className="!rounded-lg" textClassName="text-xs" />
                  <div>
                    <b className="text-sm block">{d.doctorName}</b>
                    <span className="text-xs text-muted">
                      {d.waiting} {t("common.waiting")} · ≈{d.estimatedWaitMinutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
