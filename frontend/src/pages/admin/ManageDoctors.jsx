import React, { useEffect, useState } from "react";
import { listDoctors, adminCreateDoctor, adminUpdateDoctor, adminResetDoctorPassword, adminDeactivateDoctor } from "../../api/doctors";
import { useLanguage } from "../../context/LanguageContext";
import TrustRing from "../../components/TrustRing";

function Modal({ title, sub, children, onClose, closeLabel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl p-6 w-[420px] max-w-[90vw]">
        <h3 className="font-display font-bold text-lg">{title}</h3>
        <p className="text-xs text-muted mb-4">{sub}</p>
        {children}
        <button onClick={onClose} className="mt-4 text-xs text-muted">{closeLabel}</button>
      </div>
    </div>
  );
}

export default function ManageDoctors() {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: "", specialty: "", email: "" });
  const [inviteLink, setInviteLink] = useState(null);

  function refresh() {
    listDoctors().then(setDoctors);
  }
  useEffect(refresh, []);

  async function handleAdd() {
    const result = await adminCreateDoctor(form);
    setForm({ fullName: "", specialty: "", email: "" });
    setAddOpen(false);
    refresh();

    if (result?.resetLink) setInviteLink(result.resetLink);
  }

  async function handleSaveEdit() {
    await adminUpdateDoctor(editing.id, form);
    setEditing(null);
    refresh();
  }

  function openEdit(d) {
    setForm({ fullName: d.fullName, specialty: d.specialty, email: d.email });
    setEditing(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl">{t("pages.manageDoctorsTitle")}</h2>
          <p className="text-sm text-muted mt-1">{t("adminManageDoctors.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            setForm({ fullName: "", specialty: "", email: "" });
            setAddOpen(true);
          }}
          className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
        >
          + {t("adminManageDoctors.addDoctor")}
        </button>
      </div>

      {doctors.length === 0 ? (
        <p className="text-sm text-muted">{t("adminManageDoctors.noDoctorsYet")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((d) => (
            <div key={d.id} className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-4">
              <TrustRing score={d.credibilityScore} size={54} />
              <div className="flex-1">
                <b className="block">{d.fullName}</b>
                <span className="text-xs text-muted">
                  {d.specialty} · {d.verifiedReviewCount || 0} {t("adminManageDoctors.verifiedReviewsSuffix")}
                </span>
              </div>
              <button onClick={() => openEdit(d)} className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold">
                {t("common.edit")}
              </button>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <Modal
          title={t("adminManageDoctors.addModalTitle")}
          sub={t("adminManageDoctors.addModalSub")}
          onClose={() => setAddOpen(false)}
          closeLabel={t("common.close")}
        >
          <div className="space-y-3">
            <input placeholder={t("adminManageDoctors.fullNamePlaceholder")} value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-sm" />
            <input placeholder={t("adminManageDoctors.specialtyPlaceholder")} value={form.specialty}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-sm" />
            <input placeholder={t("adminManageDoctors.workEmailPlaceholder")} value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setAddOpen(false)} className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold">
              {t("common.cancel")}
            </button>
            <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold">
              {t("adminManageDoctors.sendInvite")}
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={t("adminManageDoctors.editModalTitle")} sub={t("adminManageDoctors.editModalSub")} onClose={() => setEditing(null)} closeLabel={t("common.close")}>
          <div className="space-y-3">
            <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-sm" />
            <input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-sm" />
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-sm" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold">{t("common.cancel")}</button>
            <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold">{t("accountSettings.saveChanges")}</button>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-line">
            <button
              onClick={() => adminResetDoctorPassword(editing.id).then((r) => { if (r?.resetLink) setInviteLink(r.resetLink); })}
              className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold"
            >
              {t("adminManageDoctors.resetPassword")}
            </button>
          </div>
          <button
            onClick={() => adminDeactivateDoctor(editing.id).then(() => { setEditing(null); refresh(); })}
            className="w-full mt-2 py-2.5 rounded-lg border border-alert-soft text-alert text-sm font-semibold"
          >
            {t("adminManageDoctors.deactivateAccount")}
          </button>
        </Modal>
      )}

      {inviteLink && (
        <Modal
          title={t("adminManageDoctors.shareLinkTitle")}
          sub={t("adminManageDoctors.shareLinkSub")}
          onClose={() => setInviteLink(null)}
          closeLabel={t("common.close")}
        >
          <textarea
            readOnly
            value={inviteLink}
            onClick={(e) => e.target.select()}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-surface-alt text-xs font-mono"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(inviteLink); }}
            className="w-full mt-3 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
          >
            {t("adminManageDoctors.copyLink")}
          </button>
        </Modal>
      )}
    </div>
  );
}
