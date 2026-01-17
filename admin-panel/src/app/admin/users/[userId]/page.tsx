"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";

type Address = {
  city?: string | null;
  area?: string | null;
  street?: string | null;
  phone?: string | null;
  isPrimary?: boolean | null;
};

type Order = {
  id?: number | string;
  totalAmount?: number | string | null;
  totalPrice?: number | string | null;
  paymentMethod?: string | null;
  paymentType?: string | null;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

type UserDetail = {
  id?: number | string;
  fullName?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
  address?: Address | string | null;
  addresses?: Address[] | null;
  orders?: Order[] | null;
  recentOrders?: Order[] | null;
  ordersSummary?: {
    totalOrdersCount?: number | null;
    totalSpent?: number | string | null;
    lastOrderDate?: string | null;
  } | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
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

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EGP`;

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

const resolveName = (user: UserDetail) =>
  user.fullName || user.full_name || user.name || "Unknown";

const resolveStatus = (user: UserDetail) => {
  if (user.status) {
    return String(user.status).toUpperCase();
  }
  if (typeof user.isActive === "boolean") {
    return user.isActive ? "ACTIVE" : "SUSPENDED";
  }
  return "ACTIVE";
};

const getStatusBadgeClass = (status: string) => {
  if (status === "ACTIVE") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "SUSPENDED") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-100 text-slate-700";
};

const getRoleBadgeClass = (role: string) => {
  if (role === "ADMIN") {
    return "bg-slate-900 text-white";
  }
  return "bg-slate-100 text-slate-700";
};

const parseAddress = (address: UserDetail["address"]) => {
  if (!address) {
    return null;
  }
  if (typeof address === "string") {
    try {
      return JSON.parse(address) as Address;
    } catch {
      return null;
    }
  }
  return address;
};

const resolvePrimaryAddress = (
  user: UserDetail,
  rootAddress?: Address | null
) => {
  const direct = rootAddress ?? parseAddress(user.address);
  if (direct) {
    return direct;
  }
  const addresses = Array.isArray(user.addresses) ? user.addresses : [];
  const primary = addresses.find((item) => item?.isPrimary);
  return primary ?? addresses[0] ?? null;
};

const resolveOrders = (user: UserDetail, rootOrders?: Order[] | null) => {
  const list = rootOrders ?? user.recentOrders ?? user.orders ?? [];
  return Array.isArray(list) ? list : [];
};

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Array.isArray(params?.userId)
    ? params?.userId[0]
    : params?.userId;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("USER");
  const [passwordInput, setPasswordInput] = useState("");
  const [actionError, setActionError] = useState("");

  const [rootAddress, setRootAddress] = useState<Address | null>(null);
  const [rootOrders, setRootOrders] = useState<Order[] | null>(null);
  const [ordersSummary, setOrdersSummary] = useState<UserDetail["ordersSummary"]>(
    null
  );

  const address = useMemo(
    () => resolvePrimaryAddress(user ?? {}, rootAddress),
    [user, rootAddress]
  );
  const orders = useMemo(
    () => resolveOrders(user ?? {}, rootOrders),
    [user, rootOrders]
  );

  useEffect(() => {
    if (!userId) {
      setError("Invalid user id.");
      setIsLoading(false);
      return;
    }
    const loadUser = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<UserDetail>>(
          `/admin/users/${userId}`
        );
        const payload =
          response.data?.data?.user ??
          response.data?.user ??
          response.data?.data ??
          response.data;
        setUser(payload ?? null);
        setRootAddress(response.data?.data?.address ?? null);
        setRootOrders(response.data?.data?.recentOrders ?? null);
        setOrdersSummary(response.data?.data?.ordersSummary ?? null);
        if (payload) {
          setNameInput(resolveName(payload));
          setEmailInput(payload.email ?? "");
          setRoleInput(String(payload.role ?? "USER").toUpperCase());
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId]);

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

  const totalOrders =
    ordersSummary?.totalOrdersCount ?? orders.length;
  const totalSpent =
    toNumberValue(ordersSummary?.totalSpent) ??
    orders.reduce((sum, order) => {
      const value = toNumberValue(order.totalAmount ?? order.totalPrice ?? 0);
      return sum + (value ?? 0);
    }, 0);
  const lastOrderDate =
    ordersSummary?.lastOrderDate ??
    orders
      .map((order) => order.createdAt ?? order.created_at ?? "")
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const openEditModal = () => {
    if (!user) {
      return;
    }
    setActionError("");
    setPasswordInput("");
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!user) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      const payload: Record<string, unknown> = {
        name: nameInput.trim(),
        email: emailInput.trim(),
        role: roleInput,
      };
      if (passwordInput.trim()) {
        payload.password = passwordInput;
      }
      await api.put(`/admin/users/${userId}`, payload);
      setUser((prev) => (prev ? { ...prev, ...payload } : prev));
      setIsEditOpen(false);
      setToastMessage("User updated successfully.");
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!user) {
      return;
    }
    const currentStatus = resolveStatus(user);
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setUser((prev) =>
        prev ? { ...prev, status: nextStatus, isActive: nextStatus === "ACTIVE" } : prev
      );
      setIsSuspendOpen(false);
      setToastMessage(
        nextStatus === "ACTIVE" ? "User activated." : "User suspended."
      );
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.delete(`/admin/users/${userId}`);
      router.push("/admin/users");
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">
              <Link href="/admin/users" className="hover:text-slate-700">
                Users
              </Link>{" "}
              / User Details
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {user ? resolveName(user) : "User Details"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/users"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Back to Users
            </Link>
            <Button variant="secondary" onClick={openEditModal} disabled={!user}>
              Edit User
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsSuspendOpen(true)}
              disabled={!user || isSubmitting}
            >
              {resolveStatus(user ?? {}) === "ACTIVE"
                ? "Suspend User"
                : "Activate User"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              disabled={!user || isSubmitting}
            >
              Delete User
            </Button>
          </div>
        </div>

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

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : !user ? (
          <p className="text-sm text-slate-500">User not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  User Overview
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="font-medium text-slate-900">
                      {resolveName(user)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    <span className="text-slate-900">{user.email ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone</span>
                    <span className="text-slate-900">{user.phone ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Role</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                        String(user.role ?? "USER").toUpperCase()
                      )}`}
                    >
                      {String(user.role ?? "USER").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                        resolveStatus(user)
                      )}`}
                    >
                      {resolveStatus(user)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created At</span>
                    <span className="text-slate-900">
                      {formatDate(user.createdAt ?? user.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Primary Address
                </h2>
                {address ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>City</span>
                      <span className="text-slate-900">
                        {address.city ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Area</span>
                      <span className="text-slate-900">
                        {address.area ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Street</span>
                      <span className="text-slate-900">
                        {address.street ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Phone</span>
                      <span className="text-slate-900">
                        {address.phone ?? "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No address available.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Orders Summary
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Total Orders</span>
                    <span className="text-slate-900">{totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Spent</span>
                    <span className="text-slate-900">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Order Date</span>
                    <span className="text-slate-900">
                      {formatDate(lastOrderDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Orders
                </h2>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Order ID</th>
                        <th className="py-2 pr-4 font-medium">Total Amount</th>
                        <th className="py-2 pr-4 font-medium">
                          Payment Method
                        </th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Created At</th>
                        <th className="py-2 font-medium">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orders.slice(0, 5).map((order) => {
                        const total = toNumberValue(
                          order.totalAmount ?? order.totalPrice
                        );
                        return (
                          <tr
                            key={String(order.id ?? Math.random())}
                            className="text-slate-700"
                          >
                            <td className="py-3 pr-4">
                              {order.id ? (
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="text-slate-900 hover:underline"
                                >
                                  {order.id}
                                </Link>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              {total !== null ? formatCurrency(total) : "-"}
                            </td>
                            <td className="py-3 pr-4">
                              {order.paymentMethod ?? order.paymentType ?? "-"}
                            </td>
                            <td className="py-3 pr-4">
                              {order.status ?? "-"}
                            </td>
                            <td className="py-3 pr-4">
                              {formatDate(order.createdAt ?? order.created_at)}
                            </td>
                            <td className="py-3">
                              {order.id ? (
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                >
                                  View
                                </Link>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Edit User"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Enter name"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Enter email"
              type="email"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Password (optional)
            </label>
            <input
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Leave blank to keep current password"
              type="password"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={roleInput}
              onChange={(event) => setRoleInput(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          resolveStatus(user ?? {}) === "ACTIVE"
            ? "Suspend User"
            : "Activate User"
        }
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {resolveStatus(user ?? {}) === "ACTIVE"
              ? "Are you sure you want to suspend this user?"
              : "Are you sure you want to activate this user?"}
          </p>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsSuspendOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSuspendToggle} disabled={isSubmitting}>
              {resolveStatus(user ?? {}) === "ACTIVE"
                ? "Suspend"
                : "Activate"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete User"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This action will permanently remove the user and cannot be undone.
            Only admins should perform this action.
          </p>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
