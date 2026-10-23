import client from "./client";

export const submitReview = ({ doctorId, rating, text, language }) =>
  client.post("/reviews", { doctorId, rating, text, language }).then((r) => r.data);
export const listFlaggedReviews = () => client.get("/admin/reviews/flagged").then((r) => r.data);
export const resolveFlaggedReview = (reviewId, decision) =>
  client.post(`/admin/reviews/${reviewId}/resolve`, { decision }).then((r) => r.data);
