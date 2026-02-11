"use client";

import Button from "@/components/ui/Button";
import type { PromoCodeRecord } from "@/services/promoCodesApi";

type PromoCodesTableProps = {
  promoCodes: PromoCodeRecord[];
  isLoading: boolean;
  onEdit: (item: PromoCodeRecord) => void;
  onDelete: (item: PromoCodeRecord) => void;
  onToggleStatus: (item: PromoCodeRecord) => void;
  rowLoading: Record<number, boolean>;
  emptyText?: string;
};

const formatValue = (item: PromoCodeRecord) =>
  item.type === "PERCENTAGE" ? `${item.value}%` : `${item.value}`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().split("T")[0];
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const selectNumber = (
  first: number | null | undefined,
  second: number | null | undefined
) => {
  if (first !== undefined && first !== null) {
    return first;
  }
  if (second !== undefined && second !== null) {
    return second;
  }
  return null;
};

const selectBoolean = (first?: boolean, second?: boolean) =>
  first ?? second ?? false;

export default function PromoCodesTable({
  promoCodes,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  rowLoading,
  emptyText,
}: PromoCodesTableProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading promo codes...</p>;
  }
  if (promoCodes.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        {emptyText ?? "No promo codes yet. Create your first promo code."}
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3">ID</th>
            <th className="px-3 py-3">Code</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Value</th>
            <th className="px-3 py-3">Minimum Order</th>
            <th className="px-3 py-3">Max Discount</th>
            <th className="px-3 py-3">Expire Date</th>
            <th className="px-3 py-3">Usage/User</th>
            <th className="px-3 py-3">Total Usage</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {promoCodes.map((item) => {
            const loading = rowLoading[item.id] ?? false;
            return (
              <tr key={item.id}>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {item.id}
                </td>
                <td className="px-3 py-2">{item.code}</td>
                <td className="px-3 py-2">{item.type}</td>
                <td className="px-3 py-2">{formatValue(item)}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const value = selectNumber(
                      item.minimum_order_price,
                      item.minimumOrderPrice
                    );
                    return value !== null ? formatNumber(value) : "-";
                  })()}
                </td>
                <td className="px-3 py-2">
                  {(() => {
                    const value = selectNumber(
                      item.max_discount_amount,
                      item.maxDiscountAmount
                    );
                    return value !== null ? formatNumber(value) : "-";
                  })()}
                </td>
                <td className="px-3 py-2">
                  {formatDate(item.expire_date ?? item.expireDate)}
                </td>
                <td className="px-3 py-2">
                  {selectNumber(item.max_usage_per_user, item.maxUsagePerUser) ??
                    "-"}
                </td>
                <td className="px-3 py-2">
                  {selectNumber(item.max_total_usage, item.maxTotalUsage) ?? "-"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                      selectBoolean(item.is_active, item.isActive)
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {selectBoolean(item.is_active, item.isActive)
                      ? "Active"
                      : "Suspended"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onEdit(item)}
                      disabled={loading}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => onDelete(item)}
                      disabled={loading}
                      className="text-xs"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => onToggleStatus(item)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {selectBoolean(item.is_active, item.isActive)
                        ? "Suspend"
                        : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
