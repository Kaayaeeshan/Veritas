import client from "./client";

export const listMyAppointments = () => client.get("/appointments/me").then((r) => r.data);
export const bookAppointment = ({ doctorId, date, time }) =>
  client.post("/appointments", { doctorId, date, time }).then((r) => r.data);
export const rescheduleAppointment = (appointmentId, { date, time }) =>
  client.put(`/appointments/${appointmentId}`, { date, time }).then((r) => r.data);
export const cancelAppointment = (appointmentId) =>
  client.delete(`/appointments/${appointmentId}`).then((r) => r.data);
export const checkInAppointment = (appointmentId) =>
  client.post(`/appointments/${appointmentId}/check-in`).then((r) => r.data);
