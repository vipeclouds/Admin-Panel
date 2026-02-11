"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export type PromoCodeFormValues = {
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: string;
  minimum_order_price: string;
  max_discount_amount: string;
  expire_date: string;
  max_usage_per_user: string;
  max_total_usage: string;
  is_active: boolean;
};

type PromoCodeFormErrors = {
  code?: string;
  type?: string;
  value?: string;
  minimum_order_price?: string;
  max_discount_amount?: string;
  expire_date?: string;
  max_usage_per_user?: string;
  max_total_usage?: string;
};

type PromoCodeFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialValues?: PromoCodeFormValues;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: PromoCodeFormValues) => Promise<void>;
};

const emptyForm: PromoCodeFormValues = {
  code: "",
  type: "FIXED",
  value: "",
  minimum_order_price: "",
  max_discount_amount: "",
  expire_date: "",
  max_usage_per_user: "",
  max_total_usage: "",
  is_active: true,
};

const isValidDate = (value: string) => {
  const date = new Date(value);
  if (
    value.trim().length === 0 ||
    Number.isNaN(date.getTime()) ||
    value !== date.toISOString().split("T")[0]
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export default function PromoCodeFormModal({
  isOpen,
  mode,
  initialValues,
  isSubmitting,
  onClose,
  onSubmit,
}: PromoCodeFormModalProps) {
  const [form, setForm] = useState<PromoCodeFormValues>(emptyForm);
  const [errors, setErrors] = useState<PromoCodeFormErrors>({});

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialValues, isOpen]);

  const title = mode === "create" ? "Add Promo Code" : "Edit Promo Code";

  const validate = () => {
    const nextErrors: PromoCodeFormErrors = {};
    const trimmedCode = form.code.trim();
    if (!trimmedCode) {
      nextErrors.code = "Code is required.";
    }
    if (!form.type) {
      nextErrors.type = "Type is required.";
    }
    const parsedValue = Number(form.value);
    if (!form.value.trim()) {
      nextErrors.value = "Value is required.";
    } else if (Number.isNaN(parsedValue)) {
      nextErrors.value = "Value must be a number.";
    } else if (form.type === "FIXED" && parsedValue <= 0) {
      nextErrors.value = "Fixed value must be greater than zero.";
    } else if (
      form.type === "PERCENTAGE" &&
      (parsedValue < 1 || parsedValue > 100)
    ) {
      nextErrors.value = "Percentage must be between 1 and 100.";
    }
    const minOrder = Number(form.minimum_order_price);
    if (!form.minimum_order_price.trim()) {
      nextErrors.minimum_order_price = "Minimum order price is required.";
    } else if (Number.isNaN(minOrder) || minOrder < 0) {
      nextErrors.minimum_order_price = "Must be a number >= 0.";
    }
    const maxDiscount = Number(form.max_discount_amount);
    if (!form.max_discount_amount.trim()) {
      nextErrors.max_discount_amount = "Max discount amount is required.";
    } else if (Number.isNaN(maxDiscount) || maxDiscount < 0) {
      nextErrors.max_discount_amount = "Must be a number >= 0.";
    }
    if (!form.expire_date.trim()) {
      nextErrors.expire_date = "Expire date is required.";
    } else if (!isValidDate(form.expire_date)) {
      nextErrors.expire_date = "Expire date must be a valid YYYY-MM-DD.";
    }
    const perUser = Number(form.max_usage_per_user);
    if (!form.max_usage_per_user.trim()) {
      nextErrors.max_usage_per_user = "Max usage per user is required.";
    } else if (Number.isNaN(perUser) || perUser < 1) {
      nextErrors.max_usage_per_user = "Must be a number >= 1.";
    }
    const totalUsage = Number(form.max_total_usage);
    if (!form.max_total_usage.trim()) {
      nextErrors.max_total_usage = "Max total usage is required.";
    } else if (Number.isNaN(totalUsage) || totalUsage < 1) {
      nextErrors.max_total_usage = "Must be a number >= 1.";
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    await onSubmit({
      ...form,
      code: form.code.trim().toUpperCase(),
    });
  };

  const numericInputProps = {
    inputMode: "decimal" as const,
    pattern: "[0-9]*",
  };

  const expireMin = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Code</label>
          <Input
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, code: event.target.value }))
            }
            placeholder="Enter promo code"
          />
          {errors.code ? (
            <p className="mt-1 text-xs text-rose-600">{errors.code}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Type</label>
          <select
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                type: event.target.value as PromoCodeFormValues["type"],
              }))
            }
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="FIXED">Fixed</option>
            <option value="PERCENTAGE">Percentage</option>
          </select>
          {errors.type ? (
            <p className="mt-1 text-xs text-rose-600">{errors.type}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Value</label>
          <Input
            value={form.value}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, value: event.target.value }))
            }
            placeholder="Numeric value"
            {...numericInputProps}
          />
          {errors.value ? (
            <p className="mt-1 text-xs text-rose-600">{errors.value}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Minimum order price
            </label>
            <Input
              value={form.minimum_order_price}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  minimum_order_price: event.target.value,
                }))
              }
              placeholder="0"
              {...numericInputProps}
            />
            {errors.minimum_order_price ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.minimum_order_price}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Max discount amount
            </label>
            <Input
              value={form.max_discount_amount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  max_discount_amount: event.target.value,
                }))
              }
              placeholder="0"
              {...numericInputProps}
            />
            {errors.max_discount_amount ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.max_discount_amount}
              </p>
            ) : null}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Expire date</label>
          <Input
            type="date"
            value={form.expire_date}
            min={expireMin}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, expire_date: event.target.value }))
            }
          />
          {errors.expire_date ? (
            <p className="mt-1 text-xs text-rose-600">{errors.expire_date}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Max usage / user
            </label>
            <Input
              value={form.max_usage_per_user}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  max_usage_per_user: event.target.value,
                }))
              }
              placeholder="1"
              {...numericInputProps}
            />
            {errors.max_usage_per_user ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.max_usage_per_user}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Max total usage
            </label>
            <Input
              value={form.max_total_usage}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  max_total_usage: event.target.value,
                }))
              }
              placeholder="1"
              {...numericInputProps}
            />
            {errors.max_total_usage ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.max_total_usage}
              </p>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-slate-900"
            checked={form.is_active}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_active: event.target.checked }))
            }
          />
          Active
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
