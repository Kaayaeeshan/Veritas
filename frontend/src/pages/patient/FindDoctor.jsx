import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDoctors } from "../../api/doctors";
import { useLanguage } from "../../context/LanguageContext";
import TrustRing from "../../components/TrustRing";

export default function FindDoctor() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDoctors({ search: query || undefined })
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-4">{t("pages.findDoctorTitle")}</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("findDoctor.searchPlaceholder")}
        className="w-full max-w-md px-4 py-3 rounded-xl border border-line bg-surface-alt text-sm mb-6"
      />
      {loading ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {doctors.map((d) => (
            <div
              key={d.id}
              onClick={() => navigate(`/patient/doctors/${d.id}`)}
              className="bg-surface border border-line rounded-2xl p-4 cursor-pointer flex items-center gap-3"
            >
              <TrustRing score={d.credibilityScore} size={44} />
              <div>
                <b className="text-sm block">{d.fullName}</b>
                <span className="text-xs text-muted">{d.specialty}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
