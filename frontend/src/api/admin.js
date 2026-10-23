import client from "./client";

export const getModelStatus = () => client.get("/admin/ai-models/status").then((r) => r.data);
export const getAdminOverview = () => client.get("/admin/overview").then((r) => r.data);
export const getAdminQueue = () => client.get("/admin/queue").then((r) => r.data);
export const notifyQueueEntry = (id) => client.post(`/admin/queue/${id}/notify`).then((r) => r.data);
export const getAdminAnalytics = () => client.get("/admin/analytics").then((r) => r.data);
