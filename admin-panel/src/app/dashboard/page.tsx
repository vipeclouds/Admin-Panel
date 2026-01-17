"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type StatsResponse = {
  products: number;
  categories: number;
  orders: number;
  users: number;
};

type RecentOrder = {
  id: number | string;
  userName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
};

type LowStockProduct = {
  id: number | string;
  name: string;
  stock: number;
};

const statsConfig = [
  { key: "products", label: "Total Products" },
  { key: "categories", label: "Total Categories" },
  { key: "orders", label: "Total Orders" },
  { key: "users", label: "Total Users" },
] as const;

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EGP`;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusStyles = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("pending")) {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized.includes("cancel")) {
    return "bg-rose-100 text-rose-700";
  }
  if (normalized.includes("complete") || normalized.includes("delivered")) {
    return "bg-emerald-100 text-emerald-700";
  }
  return "bg-slate-100 text-slate-700";
};

const formatStatusLabel = (status: string) => {
  if (status === "OUT_FOR_DELIVERY") {
    return "OUT FOR DDELIVERY";
  }
  return status.replace(/_/g, " ");
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const extractFullNameFromOrder = (order: any) => {
  const fullNameFromUser = [
    order?.user?.firstName,
    order?.user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const fullNameFromUserSnake = [
    order?.user?.first_name,
    order?.user?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const fullNameFromOrder = [order?.firstName, order?.lastName]
    .filter(Boolean)
    .join(" ");
  const fullNameFromOrderSnake = [order?.first_name, order?.last_name]
    .filter(Boolean)
    .join(" ");
  const fullName =
    fullNameFromUser ||
    fullNameFromUserSnake ||
    order?.address?.fullName ||
    order?.address?.full_name ||
    order?.shippingAddress?.fullName ||
    order?.shippingAddress?.full_name ||
    order?.billingAddress?.fullName ||
    order?.billingAddress?.full_name ||
    order?.customer?.fullName ||
    order?.customer?.full_name ||
    order?.customer?.name ||
    order?.customer?.firstName ||
    order?.user?.fullName ||
    order?.user?.full_name ||
    order?.user?.fullname ||
    order?.user?.name ||
    order?.user?.username ||
    order?.user?.userName ||
    fullNameFromOrder ||
    fullNameFromOrderSnake ||
    order?.fullName ||
    order?.full_name ||
    order?.name ||
    order?.username ||
    order?.userName ||
    "Unknown";

  return fullName;
};

const normalizeRecentOrder = (order: any): RecentOrder => {
  const userName = extractFullNameFromOrder(order);

  return {
    id: order?.id ?? order?._id ?? "—",
    userName,
    totalPrice: toNumber(
      order?.totalPrice ?? order?.total ?? order?.amount ?? order?.price
    ),
    status: order?.status ?? "UNKNOWN",
    createdAt: order?.createdAt ?? order?.created_at ?? order?.date ?? "",
  };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const [lowStockError, setLowStockError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const response = await api.get("/api/admin/dashboard/stats");
        const payload = (response.data?.data ?? response.data) as StatsResponse;
        setStats(payload);
      } catch (err) {
        setStatsError("Unable to load stats.");
      } finally {
        setStatsLoading(false);
      }
    };

    const loadRecentOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const response = await api.get("/api/admin/dashboard/recent-orders");
        const raw = (response.data?.data ?? response.data) as any[];
        const normalized = Array.isArray(raw)
          ? raw.map(normalizeRecentOrder)
          : [];
        const missingNameIds = normalized
          .filter((order) => order.userName === "Unknown" && order.id !== "—")
          .map((order) => order.id);

        if (missingNameIds.length > 0) {
          const detailResponses = await Promise.allSettled(
            missingNameIds.map((id) => api.get(`/orders/${id}`))
          );
          const nameById = new Map<string, string>();

          detailResponses.forEach((result, index) => {
            if (result.status !== "fulfilled") {
              return;
            }
            const detail = result.value.data?.data ?? result.value.data;
            const fullName = extractFullNameFromOrder(detail);
            if (fullName && fullName !== "Unknown") {
              nameById.set(String(missingNameIds[index]), fullName);
            }
          });

          const enriched = normalized.map((order) => {
            const resolvedName = nameById.get(String(order.id));
            if (!resolvedName) {
              return order;
            }
            return { ...order, userName: resolvedName };
          });
          setRecentOrders(enriched);
          return;
        }

        setRecentOrders(normalized);
      } catch (err) {
        setOrdersError("Unable to load recent orders.");
      } finally {
        setOrdersLoading(false);
      }
    };

    const loadLowStock = async () => {
      setLowStockLoading(true);
      setLowStockError("");
      try {
        const response = await api.get("/api/admin/dashboard/low-stock");
        const payload = (response.data?.data ?? response.data) as LowStockProduct[];
        setLowStock(payload);
      } catch (err) {
        setLowStockError("Unable to load low stock products.");
      } finally {
        setLowStockLoading(false);
      }
    };

    loadStats();
    loadRecentOrders();
    loadLowStock();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Admin Overview</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsConfig.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              {statsLoading ? (
                <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-200" />
              ) : statsError ? (
                <p className="mt-3 text-sm text-rose-600">{statsError}</p>
              ) : (
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {stats ? stats[item.key] : 0}
                </p>
              )}
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Orders
              </h2>
            </div>
            {ordersLoading ? (
              <div className="space-y-3">
                <div className="h-10 rounded bg-slate-200 animate-pulse" />
                <div className="h-10 rounded bg-slate-200 animate-pulse" />
                <div className="h-10 rounded bg-slate-200 animate-pulse" />
              </div>
            ) : ordersError ? (
              <p className="text-sm text-rose-600">{ordersError}</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No recent orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Order ID</th>
                      <th className="py-2 pr-4 font-medium">User Name</th>
                      <th className="py-2 pr-4 font-medium">Total Price</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-3 pr-4">{order.id}</td>
                        <td className="py-3 pr-4">{order.userName}</td>
                        <td className="py-3 pr-4">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusStyles(
                              order.status
                            )}`}
                          >
                            {formatStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Low Stock Products
              </h2>
            </div>
            {lowStockLoading ? (
              <div className="space-y-3">
                <div className="h-8 rounded bg-slate-200 animate-pulse" />
                <div className="h-8 rounded bg-slate-200 animate-pulse" />
                <div className="h-8 rounded bg-slate-200 animate-pulse" />
              </div>
            ) : lowStockError ? (
              <p className="text-sm text-rose-600">{lowStockError}</p>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">No low stock products.</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {product.name}
                    </span>
                    <span className="text-sm text-slate-500">
                      Stock: {product.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
