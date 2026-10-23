import client from "./client";

export const getMyQueueStatus = () => client.get("/queue/me").then((r) => r.data);
export const getDoctorQueue = (doctorId) => client.get(`/queue/doctor/${doctorId}`).then((r) => r.data);
export const callNextPatient = (doctorId) => client.post(`/queue/doctor/${doctorId}/call-next`).then((r) => r.data);
export const markVisitComplete = (queueEntryId) => client.post(`/queue/${queueEntryId}/complete`).then((r) => r.data);
export const setNotifyBeforeTurn = (enabled) =>
  client.post("/queue/me/notify-preference", { enabled }).then((r) => r.data);
