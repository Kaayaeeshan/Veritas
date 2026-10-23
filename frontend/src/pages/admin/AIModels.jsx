import React, { useEffect, useState } from "react";
import { getModelStatus } from "../../api/admin";
import { useLanguage } from "../../context/LanguageContext";

function ModelCard({ title, status, statusLabel, description, metrics }) {
  return (
    <div className="border border-line rounded-2xl p-4 mb-4">
      <div className="flex justify-between items-center mb-2.5">
        <b className="font-display font-bold text-[15px]">{title}</b>
        <span
          className={`text-[11px] font-bold font-mono uppercase px-2.5 py-1 rounded-full ${
            status === "active" ? "bg-primary-light text-primary-dark" : "bg-gold-soft text-[#8A6817]"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="text-xs text-muted">{description}</p>
      <div className="grid grid-cols-3 gap-3.5 mt-3">
        {metrics.map((m) => (
          <div key={m.label}>
            <b className="block font-display font-bold text-lg">{m.value}</b>
            <span className="text-[10px] font-mono uppercase text-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIModels() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getModelStatus().then(setStatus);
  }, []);

  if (!status) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-1">{t("pages.aiModelsTitle")}</h2>
      <p className="text-sm text-muted mb-5">{t("pages.aiModelsSubtitle")}</p>

      <ModelCard
        title={t("adminAIModels.waitingTimeModel")}
        status={status.waitingTime.status}
        statusLabel={status.waitingTime.status === "active" ? t("adminAIModels.active") : status.waitingTime.status}
        description={t("adminAIModels.waitingTimeDescription")}
        metrics={[
          { label: t("adminAIModels.maeMinutes"), value: status.waitingTime.maeMinutes?.toFixed(1) ?? "—" },
          { label: "R²", value: status.waitingTime.r2?.toFixed(2) ?? "—" },
          { label: t("adminAIModels.lastRetrained"), value: status.waitingTime.lastRetrained },
        ]}
      />
      <ModelCard
        title={t("adminAIModels.credibilityModel")}
        status={status.credibility.status}
        statusLabel={status.credibility.status === "active" ? t("adminAIModels.active") : status.credibility.status}
        description={t("adminAIModels.credibilityDescription")}
        metrics={[
          { label: t("adminAIModels.doctorsScored"), value: status.credibility.doctorsScored },
          { label: t("adminAIModels.lastRetrained"), value: status.credibility.lastRetrained },
          { label: t("adminAIModels.languages"), value: "EN" },
        ]}
      />
      <ModelCard
        title={t("adminAIModels.feedbackModel")}
        status={status.fakeReview.needsReviewCount > 0 ? "needs-review" : "active"}
        statusLabel={status.fakeReview.needsReviewCount > 0 ? `${status.fakeReview.needsReviewCount} ${t("adminAIModels.needReview")}` : t("adminAIModels.active")}
        description={t("adminAIModels.feedbackDescription")}
        metrics={[
          { label: t("adminAIModels.reviewsScanned"), value: status.fakeReview.reviewsScanned },
          { label: t("adminAIModels.flaggedThisWeek"), value: status.fakeReview.flaggedThisWeek },
          { label: t("adminAIModels.lastRetrained"), value: status.fakeReview.lastRetrained },
        ]}
      />
    </div>
  );
}
