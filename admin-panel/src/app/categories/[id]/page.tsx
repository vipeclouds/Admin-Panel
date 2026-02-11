"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";

type Category = {
  id: number;
  name?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_path?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
};

type Product = {
  id: number;
  name?: string | null;
  slug?: string | null;
  priceAfterDiscount?: number | string | null;
  stock?: number | string | null;
  status?: string | null;
  isActive?: boolean | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  imageUrls?: string[] | null;
  imagesUrl?: string[] | null;
  images_url?: string[] | null;
};

type CategoryPayload = {
  category?: Category | null;
  products?: Product[] | null;
} & Category;

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

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const toNumber = (value?: number | string | null) => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const resolveImageUrl = (raw?: string | null) => {
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const resolveCategoryImage = (category: Category | null) => {
  if (!category) {
    return "";
  }
  const raw =
    category.imageUrl || category.image || category.image_path || "";
  return resolveImageUrl(raw);
};

const resolveProductImage = (product: Product) => {
  const candidates =
    product.images ||
    product.imageUrls ||
    product.imagesUrl ||
    product.images_url ||
    [];
  const image =
    (Array.isArray(candidates) ? candidates.find(Boolean) : "") ||
    product.imageUrl ||
    product.image_url ||
    product.image ||
    "";
  return resolveImageUrl(image);
};

const resolveCategoryStatus = (category: Category | null) => {
  if (!category) {
    return "ACTIVE";
  }
  if (category.status) {
    return String(category.status).toUpperCase();
  }
  if (typeof category.isActive === "boolean") {
    return category.isActive ? "ACTIVE" : "INACTIVE";
  }
  return "ACTIVE";
};

const resolveProductStatus = (product: Product) => {
  const stockValue = toNumber(product.stock);
  if (stockValue !== null) {
    return stockValue > 0 ? "ACTIVE" : "OUT OF STOCK";
  }
  return "ACTIVE";
};

const getStatusBadgeClass = (status: string) => {
  if (status === "ACTIVE") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "INACTIVE") {
    return "bg-slate-100 text-slate-700";
  }
  return "bg-rose-100 text-rose-700";
};

export default function CategoryDetailsPage() {
  const params = useParams();
  const categoryId = Array.isArray(params?.id)
    ? Number(params?.id[0])
    : Number(params?.id);

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const visibleProducts = useMemo(
    () => products.filter((product) => product.slug),
    [products]
  );

  const fetchCategory = async () => {
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setError("Invalid category id.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get<ApiResponse<CategoryPayload>>(
        `/categories/${categoryId}`
      );
      const payload = response.data?.data ?? {};
      const resolvedCategory = payload.category ?? payload;
      const resolvedProducts =
        payload.products ??
        (payload as CategoryPayload).products ??
        (resolvedCategory as CategoryPayload).products ??
        [];

      setCategory(resolvedCategory ?? null);
      setProducts(Array.isArray(resolvedProducts) ? resolvedProducts : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

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

  const openEditModal = () => {
    if (!category) {
      return;
    }
    setNameInput(category.name ?? "");
    setEditImageFile(null);
    setIsEditOpen(true);
  };

  const openDeleteModal = () => {
    setDeleteError("");
    setDeleteBlocked(false);
    setIsDeleteOpen(true);
  };

  const handleEdit = async () => {
    if (!category) {
      return;
    }
    setIsSubmitting(true);
    setToastMessage("");
    setToastError("");
    try {
      const trimmedName = nameInput.trim();
      if (editImageFile) {
        const formData = new FormData();
        formData.append("name", trimmedName);
        formData.append("image", editImageFile);
        await api.put(`/categories/${category.id}`, formData);
      } else {
        await api.put(`/categories/${category.id}`, { name: trimmedName });
      }
      setIsEditOpen(false);
      setToastMessage("Category updated successfully.");
      await fetchCategory();
    } catch (err) {
      const message = getErrorMessage(err);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!category) {
      return;
    }
    const currentStatus = resolveCategoryStatus(category);
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setIsSubmitting(true);
    setToastMessage("");
    setToastError("");
    try {
      const payload =
        typeof category.isActive === "boolean"
          ? { isActive: nextStatus === "ACTIVE" }
          : { status: nextStatus };
      await api.put(`/categories/${category.id}`, payload);
      setToastMessage(
        nextStatus === "ACTIVE"
          ? "Category activated."
          : "Category deactivated."
      );
      await fetchCategory();
    } catch (err) {
      setToastError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!category) {
      return;
    }
    setIsSubmitting(true);
    setDeleteError("");
    setToastMessage("");
    setToastError("");
    try {
      await api.delete(`/categories/${category.id}`);
      setToastMessage("Category deleted.");
      setIsDeleteOpen(false);
    } catch (err) {
      const message = getErrorMessage(err);
      setDeleteError(message);
      setToastError(message);
      setDeleteBlocked(true);
    } finally {
      setIsSubmitting(false);
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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Category Details
            </h1>
            <p className="text-sm text-slate-500">
              View category information and assigned products.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={openEditModal}
              disabled={!category || isSubmitting}
            >
              Edit
            </Button>
            <Button onClick={handleToggleStatus} disabled={!category || isSubmitting}>
              {resolveCategoryStatus(category) === "ACTIVE"
                ? "Deactivate"
                : "Activate"}
            </Button>
            <Button
              variant="danger"
              onClick={openDeleteModal}
              disabled={!category || isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-32 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : category ? (
            <div className="grid gap-6 md:grid-cols-[160px_1fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {resolveCategoryImage(category) ? (
                  <img
                    src={resolveCategoryImage(category)}
                    alt={category.name ?? "Category"}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Category Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {category.name ?? "Untitled Category"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                      resolveCategoryStatus(category)
                    )}`}
                  >
                    {resolveCategoryStatus(category)}
                  </span>
                  <span>
                    Created: {formatDate(category.createdAt ?? category.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Category not found.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Assigned Products
            </h2>
            <p className="text-sm text-slate-500">
              Products currently assigned to this category.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No products assigned.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const status = resolveProductStatus(product);
                const price = toNumber(product.priceAfterDiscount);
                return (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 rounded-md bg-slate-100">
                        {resolveProductImage(product) ? (
                          <img
                            src={resolveProductImage(product)}
                            alt={product.name ?? "Product"}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-md text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {product.name ?? `Product #${product.id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          Price: {price !== null ? formatCurrency(price) : "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Stock: {toNumber(product.stock) ?? "-"}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Edit Category"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Category Name
            </label>
            <Input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Enter category name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Category Image
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) =>
                setEditImageFile(event.target.files?.[0] ?? null)
              }
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
            {editImageFile ? (
              <p className="text-xs text-slate-500">{editImageFile.name}</p>
            ) : null}
          </div>
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
              disabled={isSubmitting || nameInput.trim().length === 0}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete Category"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this category? This action cannot be
            undone.
          </p>
          {deleteError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {deleteError}
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
              disabled={isSubmitting || deleteBlocked}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
