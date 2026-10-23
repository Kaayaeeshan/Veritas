import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoctor, getAvailableSlots } from "../../api/doctors";
import { bookAppointment } from "../../api/appointments";
import { useLanguage } from "../../context/LanguageContext";


function weekStartingFrom(weekOffset) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7 + i);
    return d;
  });
}


function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [doctor, setDoctor] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const days = weekStartingFrom(weekOffset);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getDoctor(doctorId).then(setDoctor);
  }, [doctorId]);

  useEffect(() => {
    const dateStr = toLocalDateStr(selectedDate);
    getAvailableSlots(doctorId, dateStr).then(setSlots);
    setSelectedSlot(null);
  }, [doctorId, selectedDate]);

  function goToWeek(newOffset) {
    if (newOffset < 0) return; // can't book in the past
    setWeekOffset(newOffset);
    const newDays = weekStartingFrom(newOffset);
    setSelectedDate(newDays[0]);
  }

  async function confirm() {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await bookAppointment({
        doctorId,
        date: toLocalDateStr(selectedDate),
        time: selectedSlot,
      });
      navigate("/patient/queue");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted mb-4">
        ← {t("common.back")}
      </button>
      <div className="font-mono text-[10px] uppercase tracking-wide text-primary">{t("bookAppointment.label")}</div>
      <h2 className="font-display font-bold text-xl mt-1">{doctor?.fullName}</h2>

      <div className="flex items-center justify-between mt-6 mb-2 max-w-lg">
        <h4 className="font-display font-bold text-sm">{t("bookAppointment.selectDate")}</h4>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-medium">
            {days[0].toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </span>
          <button
            onClick={() => goToWeek(weekOffset - 1)}
            disabled={weekOffset === 0}
            className="w-7 h-7 rounded-lg border border-line text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <button
            onClick={() => goToWeek(weekOffset + 1)}
            className="w-7 h-7 rounded-lg border border-line text-sm"
          >
            ›
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 max-w-lg">
        {days.map((d) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 w-14 py-2.5 rounded-xl border text-center ${
                isSelected ? "bg-primary border-primary text-white" : "border-line"
              }`}
            >
              <div className="text-[10px] font-mono uppercase opacity-70">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="font-display font-bold text-sm mt-0.5">{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      <h4 className="font-display font-bold text-sm mt-5 mb-2">{t("bookAppointment.availableSlots")}</h4>
      <div className="grid grid-cols-3 gap-2 max-w-lg">
        {slots.map((s) => (
          <button
            key={s.time}
            disabled={!s.available}
            onClick={() => setSelectedSlot(s.time)}
            className={`py-2.5 rounded-lg border text-xs font-semibold
              ${!s.available ? "text-line line-through cursor-not-allowed border-line" :
                s.time === selectedSlot ? "bg-gold-soft border-gold text-[#8A6817]" : "border-line"}`}
          >
            {s.time}
          </button>
        ))}
      </div>

      <button
        onClick={confirm}
        disabled={!selectedSlot || booking}
        className="w-full max-w-lg mt-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm disabled:opacity-50"
      >
        {booking ? "…" : `${t("bookAppointment.confirm")}${selectedSlot ? ` · ${selectedSlot}` : ""}`}
      </button>
    </div>
  );
}
