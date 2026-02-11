import api from "./api";

export type PrivacyPolicyRecord = {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
};

type PrivacyPolicyPayload = {
  question: string;
  answer: string;
  isActive: boolean;
};

const getPrivacyPolicies = (params: ListParams = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (typeof params.isActive === "boolean") {
    query.set("isActive", params.isActive ? "true" : "false");
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return api.get<{ success?: boolean; data?: PrivacyPolicyRecord[] }>(
    `/privacy-policy${suffix}`
  );
};

const createPrivacyPolicy = (payload: PrivacyPolicyPayload) =>
  api.post("/privacy-policy", payload);

const updatePrivacyPolicy = (id: number, payload: PrivacyPolicyPayload) =>
  api.put(`/privacy-policy/${id}`, payload);

const deletePrivacyPolicy = (id: number) =>
  api.delete(`/privacy-policy/${id}`);

export default {
  getPrivacyPolicies,
  createPrivacyPolicy,
  updatePrivacyPolicy,
  deletePrivacyPolicy,
};
