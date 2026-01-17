"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type Order = {
  id: number;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    fullName?: string | null;
    full_name?: string | null;
    username?: string | null;
  } | null;
  address?: {
    fullName?: string | null;
    full_name?: string | null;
    fullname?: string | null;
    name?: string | null;
    area?: string | null;
    city?: string | null;
    phone?: string | null;
  } | null;
  customer?: {
    name?: string | null;
    fullName?: string | null;
    full_name?: string | null;
  } | null;
  totalAmount?: number | string | null;
  totalPrice?: number | string | null;
  paymentType?: string | null;
  status: string;
  createdAt: string;
};

type ApiListResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type OrdersResponse = {
  orders: Order[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
};

type Category = {
  id: number;
  name: string;
};

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
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

const toNumberValue = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const getAddressObject = (address: Order["address"]) => {
  if (!address) {
    return null;
  }
  if (typeof address === "string") {
    try {
      return JSON.parse(address) as Order["address"];
    } catch {
      return null;
    }
  }
  return address;
};

const getAddressValue = (order: Order, field: "phone" | "area") => {
  const address = getAddressObject(order.address);
  return address?.[field] ?? "-";
};

const getCustomerName = (order: Order) => {
  const address = getAddressObject(order.address);
  return (
    order.user?.name ||
    order.user?.fullName ||
    order.user?.full_name ||
    order.user?.username ||
    order.customer?.name ||
    order.customer?.fullName ||
    order.customer?.full_name ||
    address?.fullName ||
    address?.full_name ||
    address?.fullname ||
    address?.name ||
    "Unknown"
  );
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");

  useEffect(() => {
    fetchOrders(1, true);
    fetchCategories();
  }, []);

  const fetchOrders = async (page: number, initial = false) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }
    setError("");
    try {
      const params = new URLSearchParams();
      const safePage = Math.max(1, page);
      params.set("page", String(safePage));
      params.set("limit", String(limit));
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (categoryFilter) {
        params.set("categoryId", categoryFilter);
      }
      if (orderIdFilter.trim()) {
        params.set("orderId", orderIdFilter.trim());
      }
      if (customerNameFilter.trim()) {
        params.set("customerName", customerNameFilter.trim());
      }
      const response = await api.get<ApiListResponse<OrdersResponse>>(
        `/orders?${params.toString()}`
      );
      const payload = response.data?.data;
      setOrders(payload?.orders ?? []);
      setCurrentPage(payload?.pagination?.currentPage ?? safePage);
      setTotalPages(payload?.pagination?.totalPages ?? 1);
      setTotalItems(payload?.pagination?.totalItems ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<ApiListResponse<Category[]>>(
        "/categories"
      );
      setCategories(response.data?.data ?? []);
    } catch {
      setCategories([]);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setCategoryFilter("");
    setOrderIdFilter("");
    setCustomerNameFilter("");
    setCurrentPage(1);
    fetchOrders(1);
  };

  useEffect(() => {
    if (!toastMessage && !toastError) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setToastMessage("");
      setToastError("");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage, toastError]);

  const handleStatusChange = async (order: Order, nextStatus: string) => {
    if (order.status === nextStatus) {
      return;
    }
    const previousStatus = order.status;
    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item
      )
    );
    setRowLoading((prev) => ({ ...prev, [order.id]: true }));
    setToastMessage("");
    setToastError("");
    try {
      if (nextStatus === "CONFIRMED") {
        await api.put(`/orders/${order.id}/confirm`);
      } else if (nextStatus === "OUT_FOR_DELIVERY") {
        await api.put(`/orders/${order.id}/out-for-delivery`);
      } else if (nextStatus === "DELIVERED") {
        await api.put(`/orders/${order.id}/delivered`);
      } else if (nextStatus === "COMPLETED") {
        await api.put(`/orders/${order.id}/complete`);
      } else {
        await api.patch(`/orders/${order.id}/status`, { status: nextStatus });
      }
      setToastMessage("Order status updated.");
      await fetchOrders(currentPage);
    } catch (err) {
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: previousStatus } : item
        )
      );
      setToastError(getErrorMessage(err));
    } finally {
      setRowLoading((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toastMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {toastMessage}
          </div>
        ) : null}
        {toastError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {toastError}
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">
            Track and manage customer orders.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Order ID
              </label>
              <input
                type="number"
                value={orderIdFilter}
                onChange={(event) => setOrderIdFilter(event.target.value)}
                placeholder="Order ID"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Customer Name
              </label>
              <input
                value={customerNameFilter}
                onChange={(event) => setCustomerNameFilter(event.target.value)}
                placeholder="Customer name"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              {isPageLoading ? (
                <div className="mb-3 text-xs text-slate-500">Loading...</div>
              ) : null}
              {totalItems > 0 ? (
                <div className="mb-3 text-xs text-slate-500">
                  {`Showing ${
                    (currentPage - 1) * limit + 1
                  }-${Math.min(currentPage * limit, totalItems)} of ${totalItems}`}
                </div>
              ) : null}
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Order ID</th>
                    <th className="py-2 pr-4 font-medium">Customer Name</th>
                    <th className="py-2 pr-4 font-medium">Mobile</th>
                    <th className="py-2 pr-4 font-medium">Area</th>
                    <th className="py-2 pr-4 font-medium">Total Amount</th>
                    <th className="py-2 pr-4 font-medium">Payment Method</th>
                    <th className="py-2 pr-4 font-medium">Current Status</th>
                    <th className="py-2 pr-4 font-medium">Created At</th>
                    <th className="py-2 pr-4 font-medium">View</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => {
                    const orderPath = `/admin/orders/${order.id}`;
                    return (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-3 pr-4">
                          <Link
                            href={orderPath}
                            className="text-slate-900 hover:underline"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={orderPath}
                            className="text-slate-900 hover:underline"
                          >
                            {getCustomerName(order)}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          {getAddressValue(order, "phone")}
                        </td>
                        <td className="py-3 pr-4">
                          {getAddressValue(order, "area")}
                        </td>
                        <td className="py-3 pr-4">
                          {toNumberValue(
                            order.totalAmount ?? order.totalPrice
                          ) !== null
                            ? formatCurrency(
                                Number(order.totalAmount ?? order.totalPrice)
                              )
                            : "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {order.paymentType ?? "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {order.status.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          >
                            View
                          </Link>
                        </td>
                        <td className="py-3">
                          <select
                            value={order.status}
                            onChange={(event) =>
                              handleStatusChange(order, event.target.value)
                            }
                            disabled={rowLoading[order.id]}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fetchOrders(currentPage - 1)}
              disabled={currentPage === 1 || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => fetchOrders(page)}
                    disabled={isPageLoading}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      page === currentPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchOrders(currentPage + 1)}
              disabled={currentPage === totalPages || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
