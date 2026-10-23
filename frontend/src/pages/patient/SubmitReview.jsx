import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submitReview } from "../../api/reviews";
import { useLanguage } from "../../context/LanguageContext";

export default function SubmitReview() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      // Tags the review with the reviewer's current UI language, not
      // hardcoded "en" — lets the fake-review model apply the right
      // language-specific text processing later.
      await submitReview({ doctorId, rating, text, language });
      navigate("/patient");
    } catch (err) {
      setError(err?.response?.data?.message || t("submitReview.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="font-mono text-[10px] uppercase tracking-wide text-primary">{t("submitReview.postVisit")}</div>
      <h2 className="font-display font-bold text-xl mt-1">{t("submitReview.rateYourVisit")}</h2>

      <div className="text-center mt-4">
        <span className="inline-flex items-center gap-1 bg-primary-light text-primary-dark text-[10px] font-bold px-3 py-1.5 rounded-full font-mono uppercase">
          ✓ {t("submitReview.verifiedVisit")}
        </span>
        <div className="text-gold text-3xl my-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} onClick={() => setRating(n)} className="cursor-pointer">
              {n <= rating ? "★" : "☆"}
            </span>
          ))}
        </div>
        {rating === 0 && <p className="text-xs text-muted -mt-2 mb-2">{t("submitReview.tapStarToRate")}</p>}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t("submitReview.placeholder")}
        className="w-full rounded-lg border border-line bg-surface-alt p-3 text-sm"
      />

      {error && <p className="text-alert text-sm mt-2">{error}</p>}

      <div className="flex gap-2 bg-gold-soft rounded-lg p-3 mt-4">
        <div>🔒</div>
        <p className="text-xs text-[#7A5D14] leading-relaxed">
          {t("submitReview.onlyVerifiedNotice")}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !text.trim() || rating === 0}
        className="w-full mt-5 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm disabled:opacity-50"
      >
        {submitting ? "…" : t("submitReview.submitButton")}
      </button>
    </div>
  );
}
