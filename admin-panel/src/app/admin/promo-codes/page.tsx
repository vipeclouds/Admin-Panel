"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import promoCodesApi, {
  PromoCodeRecord,
} from "@/services/promoCodesApi";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import PromoCodeFormModal, {
  PromoCodeFormValues,
} from "./components/PromoCodeFormModal";
import PromoCodesTable from "./components/PromoCodesTable";

type AlertState = { type: "success" | "error"; text: string };

const buildPayload = (values: PromoCodeFormValues) => ({
  code: values.code.trim(),
  type: values.type,
  value: Number(values.value),
  minimum_order_price: Number(values.minimum_order_price),
  max_discount_amount: Number(values.max_discount_amount),
  expire_date: values.expire_date,
  max_usage_per_user: Number(values.max_usage_per_user),
  max_total_usage: Number(values.max_total_usage),
  is_active: values.is_active,
});

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [activeTab, setActiveTab] = useState<"valid" | "expired" | "suspended">(
    "valid"
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRecord, setSelectedRecord] = useState<PromoCodeRecord | null>(
    null
  );
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PromoCodeRecord | null>(
    null
  );
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});

  const fetchPromoCodes = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response =
        activeTab === "valid"
          ? await promoCodesApi.getValidPromoCodes()
          : activeTab === "expired"
          ? await promoCodesApi.getExpiredPromoCodes()
          : await promoCodesApi.getSuspendedPromoCodes();
      const payload = response.data?.data;
      setPromoCodes(Array.isArray(payload) ? payload : []);
    } catch (error) {
        setFetchError(
        `Failed to load ${
          activeTab === "valid"
            ? "valid"
            : activeTab === "expired"
            ? "expired"
            : "suspended"
        } promo codes.`
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const startRowLoading = (id: number, value: boolean) => {
    setRowLoading((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async (values: PromoCodeFormValues) => {
    setFormSubmitting(true);
    try {
      if (formMode === "create") {
        await promoCodesApi.createPromoCode(buildPayload(values));
        setAlert({ type: "success", text: "Promo code created successfully." });
      } else if (selectedRecord) {
        await promoCodesApi.updatePromoCode(
          selectedRecord.id,
          buildPayload(values)
        );
        setAlert({ type: "success", text: "Promo code updated successfully." });
      }
      setIsFormOpen(false);
      await fetchPromoCodes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setAlert({ type: "error", text: message });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = (record: PromoCodeRecord) => {
    setSelectedRecord(record);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (record: PromoCodeRecord) => {
    const currentActive =
      record.is_active ?? record.isActive ?? false;
    startRowLoading(record.id, true);
    try {
      await promoCodesApi.updatePromoCode(record.id, {
        is_active: !currentActive,
      });
      setAlert({
        type: "success",
        text: currentActive
          ? "Promo code suspended."
          : "Promo code activated.",
      });
      await fetchPromoCodes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setAlert({ type: "error", text: message });
    } finally {
      startRowLoading(record.id, false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    startRowLoading(deleteTarget.id, true);
    try {
      await promoCodesApi.deletePromoCode(deleteTarget.id);
      setAlert({ type: "success", text: "Promo code deleted." });
      setDeleteTarget(null);
      await fetchPromoCodes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setAlert({ type: "error", text: message });
    } finally {
      startRowLoading(deleteTarget.id, false);
    }
  };

  const initialFormValues = selectedRecord
    ? {
        code: selectedRecord.code,
        type: selectedRecord.type,
        value: String(selectedRecord.value),
        minimum_order_price: String(
          selectedRecord.minimum_order_price ??
            selectedRecord.minimumOrderPrice ??
            ""
        ),
        max_discount_amount: String(
          selectedRecord.max_discount_amount ??
            selectedRecord.maxDiscountAmount ??
            ""
        ),
        expire_date: selectedRecord.expire_date ?? selectedRecord.expireDate ?? "",
        max_usage_per_user: String(
          selectedRecord.max_usage_per_user ??
            selectedRecord.maxUsagePerUser ??
            ""
        ),
        max_total_usage: String(
          selectedRecord.max_total_usage ??
            selectedRecord.maxTotalUsage ??
            ""
        ),
        is_active:
          selectedRecord.is_active ?? selectedRecord.isActive ?? false,
      }
    : undefined;

  const handleOpenCreate = () => {
    setSelectedRecord(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Promo Codes
            </h1>
            <p className="text-sm text-slate-600">
              Pull valid codes via GET /promo-codes/valid, expired via
              GET /promo-codes/expired, and suspended via
              GET /promo-codes/suspended.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>+ Add Promo Code</Button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("valid")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "valid"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Valid promo codes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expired")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "expired"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Expired promo codes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suspended")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === "suspended"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Suspended promo codes
          </button>
        </div>

        {alert ? (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              alert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {alert.text}
          </div>
        ) : null}

        {fetchError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {fetchError}
          </p>
        ) : null}

        <PromoCodesTable
          promoCodes={promoCodes}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={(record) => setDeleteTarget(record)}
          onToggleStatus={handleToggleStatus}
          rowLoading={rowLoading}
          emptyText={
            activeTab === "valid"
              ? "No valid promo codes yet. Create one."
              : activeTab === "expired"
              ? "No expired promo codes yet."
              : "No suspended promo codes yet."
          }
        />

        <PromoCodeFormModal
          isOpen={isFormOpen}
          mode={formMode}
          initialValues={initialFormValues}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          isSubmitting={formSubmitting}
        />

        <ConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isLoading={deleteTarget ? rowLoading[deleteTarget.id] ?? false : false}
        />
      </div>
    </AdminLayout>
  );
}
