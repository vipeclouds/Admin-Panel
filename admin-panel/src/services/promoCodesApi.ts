import api from "./api";

type PromoCodePayload = {
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minimum_order_price: number;
  max_discount_amount: number;
  expire_date: string;
  max_usage_per_user: number;
  max_total_usage: number;
  is_active: boolean;
};

export type PromoCodeRecord = {
  id: number;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minimum_order_price: number;
  max_discount_amount: number;
  expire_date: string;
  max_usage_per_user: number;
  max_total_usage: number;
  is_active: boolean;
  minimumOrderPrice?: number | null;
  maxDiscountAmount?: number | null;
  expireDate?: string;
  maxUsagePerUser?: number | null;
  maxTotalUsage?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const getAllPromoCodes = () =>
  api.get<{ success?: boolean; data?: PromoCodeRecord[] }>("/promo-codes");

const getValidPromoCodes = () =>
  api.get<{ success?: boolean; data?: PromoCodeRecord[] }>("/promo-codes/valid");

const getExpiredPromoCodes = () =>
  api.get<{ success?: boolean; data?: PromoCodeRecord[] }>(
    "/promo-codes/expired"
  );

const getSuspendedPromoCodes = () =>
  api.get<{ success?: boolean; data?: PromoCodeRecord[] }>(
    "/promo-codes/suspended"
  );

const createPromoCode = (payload: PromoCodePayload) =>
  api.post("/promo-codes", payload);

const updatePromoCode = (id: number, payload: Partial<PromoCodePayload>) =>
  api.put(`/promo-codes/${id}`, payload);

const deletePromoCode = (id: number) => api.delete(`/promo-codes/${id}`);

export default {
  getAllPromoCodes,
  getValidPromoCodes,
  getExpiredPromoCodes,
  getSuspendedPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
