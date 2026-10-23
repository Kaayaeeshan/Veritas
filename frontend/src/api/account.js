import client from "./client";

export const getMyProfile = () => client.get("/account/me").then((r) => r.data);
export const updateMyProfile = (payload) => client.put("/account/me", payload).then((r) => r.data);
export const changeMyPassword = (currentPassword, newPassword) =>
  client.post("/account/change-password", { currentPassword, newPassword }).then((r) => r.data);
