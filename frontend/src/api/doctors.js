import client from "./client";

export const listDoctors = (params = {}) => client.get("/doctors", { params }).then((r) => r.data);
export const getDoctor = (doctorId) => client.get(`/doctors/${doctorId}`).then((r) => r.data);
export const getAvailableSlots = (doctorId, date) =>
  client.get(`/doctors/${doctorId}/slots`, { params: { date } }).then((r) => r.data);
export const listDoctorReviews = (doctorId) =>
  client.get(`/doctors/${doctorId}/reviews`).then((r) => r.data);
export const getDoctorCredibility = (doctorId) =>
  client.get(`/doctors/${doctorId}/credibility`).then((r) => r.data);

// Admin-only
export const adminCreateDoctor = (payload) => client.post("/admin/doctors", payload).then((r) => r.data);
export const adminUpdateDoctor = (doctorId, payload) =>
  client.put(`/admin/doctors/${doctorId}`, payload).then((r) => r.data);
export const adminResetDoctorPassword = (doctorId) =>
  client.post(`/admin/doctors/${doctorId}/reset-password`).then((r) => r.data);
export const adminDeactivateDoctor = (doctorId) =>
  client.post(`/admin/doctors/${doctorId}/deactivate`).then((r) => r.data);
