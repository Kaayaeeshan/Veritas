import React, { useEffect, useState } from "react";
import { getAdminQueue, notifyQueueEntry } from "../../api/admin";
import { useLanguage } from "../../context/LanguageContext";

export default function QueueManagement() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [notifying, setNotifying] = useState({});
  const [notifyResult, setNotifyResult] = useState({});

  function refresh() {
    getAdminQueue().then(setRows);
  }

  useEffect(refresh, []);

  async function handleNotify(id) {
    setNotifying((prev) => ({ ...prev, [id]: true }));
    setNotifyResult((prev) => ({ ...prev, [id]: null }));
    try {
      const result = await notifyQueueEntry(id);
      
      if (!result.notified) {
        setNotifyResult((prev) => ({ ...prev, [id]: { ok: false, text: t("adminQueueManagement.noPhoneNumber") } }));
      } else if (result.simulated) {
        setNotifyResult((prev) => ({ ...prev, [id]: { ok: true, text: t("adminQueueManagement.simulated") } }));
      } else {
        setNotifyResult((prev) => ({ ...prev, [id]: { ok: true, text: t("adminQueueManagement.notified") } }));
      }
      refresh();
    } catch (err) {
      setNotifyResult((prev) => ({
        ...prev,
        [id]: { ok: false, text: err?.response?.data?.message || t("adminQueueManagement.notifyError") },
      }));
    } finally {
      setNotifying((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl">{t("pages.queueManagementTitle")}</h2>
      <div className="bg-surface border border-line rounded-2xl p-5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">{t("adminQueueManagement.noOneInQueue")}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-muted font-mono text-[10px] uppercase border-b border-line">
                  <th className="py-2">{t("common.patient")}</th>
                  <th>{t("common.doctor")}</th>
                  <th>{t("common.checkIn")}</th>
                  <th>{t("common.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-3">{r.patientName}</td>
                    <td>{r.doctorName}</td>
                    <td>{r.checkInTime}</td>
                    <td className="capitalize">{r.status}</td>
                    <td className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => handleNotify(r.id)}
                          disabled={notifying[r.id]}
                          className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold disabled:opacity-60"
                        >
                          {notifying[r.id] ? "…" : t("adminQueueManagement.notify")}
                        </button>
                        {notifyResult[r.id] && (
                          <span className={`text-[11px] ${notifyResult[r.id].ok ? "text-success" : "text-alert"}`}>
                            {notifyResult[r.id].text}
                          </span>
                        )}
                      </div>
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