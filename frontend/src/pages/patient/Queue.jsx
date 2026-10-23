import React, { useEffect, useState } from "react";
import { listMyAppointments, checkInAppointment, cancelAppointment } from "../../api/appointments";
import { getMyQueueStatus, setNotifyBeforeTurn } from "../../api/queue";
import { useLanguage } from "../../context/LanguageContext";

export default function Queue() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [notify, setNotify] = useState(true);

  const [checkingIn, setCheckingIn] = useState({});
  const [checkInError, setCheckInError] = useState({});
  const [cancelling, setCancelling] = useState({});
  const [cancelError, setCancelError] = useState({});

  function poll() {
    getMyQueueStatus()
      .then((s) => {
        setStatus(s);
        setNotFound(false);
      })
      .catch(() => {
        setNotFound(true);
        // Not in a live queue — show every booked appointment, not just the first.
        listMyAppointments().then((appts) => {
          setUpcomingAppts(appts.filter((a) => a.status === "booked"));
        });
      });
  }

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 20000);
    return () => clearInterval(interval);
  }, []);

  async function handleCheckIn(apptId) {
    setCheckingIn((prev) => ({ ...prev, [apptId]: true }));
    setCheckInError((prev) => ({ ...prev, [apptId]: "" }));
    try {
      await checkInAppointment(apptId);
      poll();
    } catch (err) {
      setCheckInError((prev) => ({
        ...prev,
        [apptId]: err?.response?.data?.message || t("queue.checkInError"),
      }));
    } finally {
      setCheckingIn((prev) => ({ ...prev, [apptId]: false }));
    }
  }

  async function handleCancel(apptId) {
    if (!window.confirm(t("queue.cancelConfirm"))) return;
    setCancelling((prev) => ({ ...prev, [apptId]: true }));
    setCancelError((prev) => ({ ...prev, [apptId]: "" }));
    try {
      await cancelAppointment(apptId);
      setUpcomingAppts((prev) => prev.filter((a) => a.id !== apptId));
    } catch (err) {
      setCancelError((prev) => ({
        ...prev,
        [apptId]: err?.response?.data?.message || t("queue.cancelError"),
      }));
    } finally {
      setCancelling((prev) => ({ ...prev, [apptId]: false }));
    }
  }

  if (notFound && upcomingAppts.length === 0) {
    return <p className="text-sm text-muted">{t("queue.noUpcoming")}</p>;
  }

  if (notFound && upcomingAppts.length > 0) {
    return (
      <div className="max-w-md space-y-4">
        <h2 className="font-display font-bold text-2xl mb-2">
          {upcomingAppts.length > 1 ? t("queue.yourAppointments") : t("queue.yourAppointment")}
        </h2>
        {upcomingAppts.length > 1 && (
          <p className="text-xs text-muted -mt-2">
            {t("queue.youHave")} {upcomingAppts.length} {t("queue.multipleNotice")}
          </p>
        )}
        {upcomingAppts.map((appt) => (
          <div key={appt.id} className="bg-surface-alt rounded-2xl p-5">
            <b className="block">{appt.doctorName}</b>
            <span className="text-sm text-muted">{appt.date} at {appt.time}</span>

            <button
              onClick={() => handleCheckIn(appt.id)}
              disabled={checkingIn[appt.id]}
              className="w-full mt-4 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm disabled:opacity-60"
            >
              {checkingIn[appt.id] ? "…" : t("queue.checkInButton")}
            </button>
            {checkInError[appt.id] && <p className="text-alert text-sm mt-3">{checkInError[appt.id]}</p>}

            <button
              onClick={() => handleCancel(appt.id)}
              disabled={cancelling[appt.id]}
              className="w-full mt-3 py-3 rounded-lg border border-alert text-alert font-semibold text-sm disabled:opacity-60"
            >
              {cancelling[appt.id] ? "…" : t("queue.cancelAppointment")}
            </button>
            {cancelError[appt.id] && <p className="text-alert text-sm mt-3">{cancelError[appt.id]}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (!status) return <p className="text-sm text-muted">{t("queue.loadingStatus")}</p>;

  const progressPct = Math.max(5, 100 - status.position * 12);

  const steps = [
    { key: "checkedIn", label: t("queue.checkedIn"), done: !!status.stepTimestamps?.checkedIn, time: status.stepTimestamps?.checkedIn },
    { key: "calledIn", label: t("queue.calledIn"), done: !!status.stepTimestamps?.calledIn, time: status.stepTimestamps?.calledIn },
    { key: "inConsultation", label: t("queue.inConsultation"), done: status.status === "in_consultation", time: status.status === "in_consultation" ? status.stepTimestamps?.calledIn : null },
  ];

  return (
    <div>
      <div className="bg-primary-dark text-white rounded-2xl p-7 text-center max-w-md">
        <div className="font-mono text-[10px] uppercase tracking-wide opacity-70">
          {status.clinicName} · {status.doctorName}
        </div>
        <div className="font-display font-bold text-5xl mt-2">{status.position - 1}</div>
        <div className="font-mono text-[11px] uppercase opacity-70 mt-1">{t("queue.patientsAhead")}</div>
        <div className="h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-gold rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs opacity-80 mt-2">
          {t("queue.estimatedWait")} {status.estimatedWaitMinutes} {t("queue.minAiPredicted")}
        </p>
      </div>

      <div className="mt-6 space-y-5 max-w-md">
        {steps.map((step) => {
          return (
            <div key={step.key} className="flex gap-3">
              <div className={`w-5 h-5 rounded-full flex-shrink-0 ${step.done ? "bg-success" : "bg-line"}`} />
              <div>
                <b className="text-sm block">{step.label}</b>
                <span className="text-xs text-muted">{step.time || t("queue.pending")}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 mt-4 border-t border-line max-w-md">
        <span className="text-sm font-semibold">{t("queue.notifyMe")}</span>
        <button
          onClick={() => {
            const next = !notify;
            setNotify(next);
            setNotifyBeforeTurn(next);
          }}
          className={`w-10 h-6 rounded-full relative transition-colors ${notify ? "bg-primary" : "bg-line"}`}
        >
          <span
            className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
              notify ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
