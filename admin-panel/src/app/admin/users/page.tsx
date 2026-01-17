"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";

type User = {
  id: number;
  name?: string | null;
  fullName?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  phone_number?: string | null;
  role?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
};

type ApiListResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

type UsersPayload = {
  users?: User[];
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  };
};

const ROLE_OPTIONS = ["USER", "ADMIN"] as const;

const formatDate = (value: string | null | undefined) => {
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

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const resolveName = (user: User) =>
  user.fullName ||
  user.full_name ||
  user.name ||
  user.username ||
  "Unknown";

const resolvePhone = (user: User) =>
  user.phoneNumber || user.phone_number || user.phone || "-";

const resolveRole = (user: User) => {
  const raw = user.role ?? "USER";
  return String(raw).toUpperCase();
};

const resolveStatus = (user: User) => {
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  const [filterId, setFilterId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<(typeof ROLE_OPTIONS)[number]>(
    "USER"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.id - b.id),
    [users]
  );

  const fetchUsers = async (page: number, initial = false) => {
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
      if (filterId.trim()) {
        params.set("id", filterId.trim());
      }
      if (filterName.trim()) {
        params.set("name", filterName.trim());
      }
      if (filterEmail.trim()) {
        params.set("email", filterEmail.trim());
      }
      if (filterPhone.trim()) {
        params.set("phone", filterPhone.trim());
      }
      const response = await api.get<ApiListResponse<UsersPayload | User[]>>(
        `/admin/users?${params.toString()}`
      );
      const payload = response.data?.data ?? response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.users ?? [];
      const filteredList = (list ?? []).filter(
        (user) => resolveStatus(user) !== "DELETED"
      );
      const pagination = Array.isArray(payload)
        ? response.data?.pagination
        : payload?.pagination ?? response.data?.pagination;

      setUsers(filteredList);
      setCurrentPage(pagination?.currentPage ?? safePage);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalItems(
        pagination?.totalItems ?? (Array.isArray(list) ? list.length : 0)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, true);
  }, []);

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

  const openAddModal = () => {
    setActionError("");
    setNameInput("");
    setEmailInput("");
    setRoleInput("USER");
    setPasswordInput("");
    setIsAddOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setActionError("");
    setNameInput(resolveName(user));
    setEmailInput(user.email ?? "");
    setRoleInput(resolveRole(user) as (typeof ROLE_OPTIONS)[number]);
    setPasswordInput("");
    setIsEditOpen(true);
  };

  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setActionError("");
    setIsSuspendOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setActionError("");
    setIsDeleteOpen(true);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers(1);
  };

  const handleResetFilters = () => {
    setFilterId("");
    setFilterName("");
    setFilterEmail("");
    setFilterPhone("");
    setCurrentPage(1);
    fetchUsers(1);
  };

  const handleAdd = async () => {
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.post("/admin/users", {
        name: nameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput,
        role: roleInput,
      });
      setIsAddOpen(false);
      setToastMessage("User created successfully.");
      await fetchUsers(currentPage);
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) {
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
      await api.put(`/admin/users/${selectedUser.id}`, payload);
      setIsEditOpen(false);
      setSelectedUser(null);
      setToastMessage("User updated successfully.");
      await fetchUsers(currentPage);
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!selectedUser) {
      return;
    }
    const userId = selectedUser.id;
    const currentStatus = resolveStatus(selectedUser);
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    setIsSubmitting(true);
    setRowLoading((prev) => ({ ...prev, [userId]: true }));
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: nextStatus } : user
      )
    );
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setIsSuspendOpen(false);
      setSelectedUser(null);
      setToastMessage(
        nextStatus === "ACTIVE" ? "User activated." : "User suspended."
      );
    } catch (err) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: currentStatus } : user
        )
      );
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
      setRowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setIsDeleteOpen(false);
      setSelectedUser(null);
      setToastMessage("User deleted.");
      await fetchUsers(currentPage);
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getToggleLabel = (user: User) =>
    resolveStatus(user) === "ACTIVE" ? "Suspend" : "Activate";

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
            <p className="text-sm text-slate-500">
              Manage user access, roles, and status.
            </p>
          </div>
          <Button onClick={openAddModal}>Add User</Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ID</label>
              <Input
                value={filterId}
                onChange={(event) => setFilterId(event.target.value)}
                placeholder="User ID"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <Input
                value={filterName}
                onChange={(event) => setFilterName(event.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                value={filterEmail}
                onChange={(event) => setFilterEmail(event.target.value)}
                placeholder="Email"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <Input
                value={filterPhone}
                onChange={(event) => setFilterPhone(event.target.value)}
                placeholder="Phone"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={isLoading || isPageLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPageLoading ? "Loading..." : "Apply Filters"}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={isLoading || isPageLoading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
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
          ) : sortedUsers.length === 0 ? (
            <p className="text-sm text-slate-500">No users found.</p>
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
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Full Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Created At</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedUsers.map((user) => {
                    const status = resolveStatus(user);
                    return (
                      <tr key={user.id} className="text-slate-700">
                        <td className="py-3 pr-4">{user.id}</td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-slate-900 hover:underline"
                          >
                            {resolveName(user)}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{user.email ?? "-"}</td>
                        <td className="py-3 pr-4">{resolvePhone(user)}</td>
                        <td className="py-3 pr-4">{resolveRole(user)}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(user.createdAt ?? user.created_at)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              View
                            </Link>
                            <Button
                              variant="secondary"
                              onClick={() => openEditModal(user)}
                              disabled={rowLoading[user.id]}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => openSuspendModal(user)}
                              disabled={rowLoading[user.id]}
                            >
                              {getToggleLabel(user)}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => openDeleteModal(user)}
                              disabled={rowLoading[user.id]}
                            >
                              Delete
                            </Button>
                          </div>
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
              onClick={() => fetchUsers(currentPage - 1)}
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
                    onClick={() => fetchUsers(page)}
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
              onClick={() => fetchUsers(currentPage + 1)}
              disabled={currentPage === totalPages || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        title="Add User"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Enter email"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Enter password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={roleInput}
              onChange={(event) =>
                setRoleInput(event.target.value as (typeof ROLE_OPTIONS)[number])
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
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
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                isSubmitting ||
                !nameInput.trim() ||
                !emailInput.trim() ||
                !passwordInput.trim()
              }
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Edit User"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Enter email"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Password (optional)
            </label>
            <Input
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Leave blank to keep current password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={roleInput}
              onChange={(event) =>
                setRoleInput(event.target.value as (typeof ROLE_OPTIONS)[number])
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
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
            <Button
              onClick={handleEdit}
              disabled={isSubmitting || !nameInput.trim() || !emailInput.trim()}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          selectedUser && resolveStatus(selectedUser) === "ACTIVE"
            ? "Suspend User"
            : "Activate User"
        }
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {selectedUser && resolveStatus(selectedUser) === "ACTIVE"
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
            <Button
              onClick={handleSuspendToggle}
              disabled={isSubmitting}
            >
              {selectedUser && resolveStatus(selectedUser) === "ACTIVE"
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
