import React, { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAdminAnalytics } from "../../api/admin";
import { useLanguage } from "../../context/LanguageContext";

const PIE_COLORS = ["#14538C", "#c9962e", "#dce3ea"];

export default function Analytics() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAdminAnalytics().then(setData);
  }, []);

  if (!data) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">{t("pages.analyticsTitle")}</h2>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h4 className="font-display font-bold text-sm mb-3">{t("adminAnalytics.appointmentsPerDay")}</h4>
          {data.appointmentsPerDay.length === 0 ? (
            <p className="text-xs text-muted">{t("adminAnalytics.noAppointmentData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.appointmentsPerDay}>
                <CartesianGrid stroke="#DCE3EA" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#14538C" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h4 className="font-display font-bold text-sm mb-3">{t("adminAnalytics.reviewBreakdown")}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.reviewBreakdown} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.reviewBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
