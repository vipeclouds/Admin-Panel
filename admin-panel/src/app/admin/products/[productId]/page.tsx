"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";

type Product = {
  id?: number | string;
  name?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
  category?: { id?: number | null; name?: string | null } | null;
  categoryId?: number | null;
  price?: number | string | null;
  priceBeforeDiscount?: number | string | null;
  priceAfterDiscount?: number | string | null;
  stock?: number | string | null;
  description?: string | null;
  images?: string[] | string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  imageUrls?: string[] | string | null;
  imagesUrl?: string[] | string | null;
  images_url?: string[] | string | null;
  variant?: {
    sku?: string | null;
    name?: string | null;
    status?: string | null;
    isActive?: boolean | null;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    attributes?: {
      size?: string | null;
      color?: string | null;
      material?: string | null;
    } | null;
  } | null;
  variantId?: number | null;
  variantAttributes?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type Category = {
  id: number;
  name: string;
};

type Variant = {
  id: number;
  sku?: string | null;
  name?: string | null;
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

const toNumber = (value: string) => {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const extractImagesList = (images: unknown) => {
  if (!images) {
    return [];
  }
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return (
            (record.url as string) ||
            (record.imageUrl as string) ||
            (record.image_url as string) ||
            (record.path as string) ||
            (record.image as string) ||
            ""
          );
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof images === "string") {
    if (images.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(images);
        return extractImagesList(parsed);
      } catch {
        return images ? [images] : [];
      }
    }
    return images ? [images] : [];
  }
  if (typeof images === "object") {
    const record = images as Record<string, unknown>;
    const candidate =
      (record.url as string) ||
      (record.imageUrl as string) ||
      (record.image_url as string) ||
      (record.path as string) ||
      (record.image as string);
    return candidate ? [candidate] : [];
  }
  return [];
};

const resolveImageUrl = (raw: string) => {
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const resolveStatusLabel = (product: Product) => {
  if (typeof product.isActive === "boolean") {
    return product.isActive ? "Active" : "Inactive";
  }
  if (product.status) {
    return product.status.toLowerCase() === "active" ? "Active" : "Inactive";
  }
  return "Inactive";
};

const resolveStatusBadge = (product: Product) => {
  const active =
    typeof product.isActive === "boolean"
      ? product.isActive
      : product.status?.toLowerCase() === "active";
  return active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
};

const resolveVariantDetails = (product: Product) => {
  const variant = product.variant ?? {};
  const attributes = variant.attributes ?? product.variantAttributes ?? {};
  return {
    sku: variant.sku || variant.name || (product.variantId ? `Variant #${product.variantId}` : "-"),
    size: attributes.size ?? variant.size ?? "-",
    color: attributes.color ?? variant.color ?? "-",
    material: attributes.material ?? variant.material ?? "-",
    status:
      typeof variant.isActive === "boolean"
        ? variant.isActive
          ? "Active"
          : "Inactive"
        : variant.status ?? "-",
  };
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.productId)
    ? params?.productId[0]
    : params?.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState("");
  const [priceBeforeInput, setPriceBeforeInput] = useState("");
  const [priceAfterInput, setPriceAfterInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [categoryIdInput, setCategoryIdInput] = useState("");
  const [variantIdInput, setVariantIdInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [editImageInputs, setEditImageInputs] = useState<Array<File | null>>([]);
  const [existingEditImages, setExistingEditImages] = useState<string[]>([]);
  const [imagesTouched, setImagesTouched] = useState(false);

  const images = useMemo(() => {
    if (!product) {
      return [];
    }
    const list = [
      ...extractImagesList(product.images),
      ...extractImagesList(product.imageUrls),
      ...extractImagesList(product.imagesUrl),
      ...extractImagesList(product.images_url),
      ...extractImagesList(product.imageUrl),
      ...extractImagesList(product.image_url),
      ...extractImagesList(product.image),
    ];
    const unique = Array.from(new Set(list.filter(Boolean)));
    return unique.slice(0, 5).map(resolveImageUrl);
  }, [product]);

  const variantDetails = useMemo(
    () => resolveVariantDetails(product ?? {}),
    [product]
  );

  useEffect(() => {
    if (!productId) {
      setError("Invalid product id.");
      setIsLoading(false);
      return;
    }
    const loadProduct = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<Product>>(
          `/admin/products/${productId}`
        );
        const payload =
          response.data?.data?.product ??
          response.data?.product ??
          response.data?.data ??
          response.data;
        setProduct(payload ?? null);
        if (payload) {
          setNameInput(payload.name ?? "");
          setPriceBeforeInput(
            payload.priceBeforeDiscount?.toString() ??
              payload.price?.toString() ??
              ""
          );
          setPriceAfterInput(payload.priceAfterDiscount?.toString() ?? "");
          setStockInput(payload.stock?.toString() ?? "");
          const isActive =
            typeof payload.isActive === "boolean"
              ? payload.isActive
              : payload.status?.toLowerCase() === "active";
          setStatusInput(isActive ? "active" : "inactive");
          setCategoryIdInput(
            payload.categoryId?.toString() ?? payload.category?.id?.toString() ?? ""
          );
          setVariantIdInput(payload.variantId?.toString() ?? "");
          setDescriptionInput(payload.description ?? "");
          const existingImages = extractImagesList(payload.images)
            .concat(extractImagesList(payload.imageUrls))
            .concat(extractImagesList(payload.imagesUrl))
            .concat(extractImagesList(payload.images_url))
            .concat(extractImagesList(payload.imageUrl))
            .concat(extractImagesList(payload.image_url))
            .concat(extractImagesList(payload.image))
            .filter(Boolean);
          setExistingEditImages(Array.from(new Set(existingImages)));
          setEditImageInputs([]);
          setImagesTouched(false);
          setSelectedImage(
            existingImages.length > 0
              ? resolveImageUrl(existingImages[0])
              : null
          );
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (images.length === 0) {
      setSelectedImage(null);
      return;
    }
    setSelectedImage((prev) => prev ?? images[0]);
  }, [images]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [categoriesResponse, variantsResponse] = await Promise.all([
          api.get<ApiResponse<Category[]>>("/categories"),
          api.get<ApiResponse<Variant[]>>("/variants"),
        ]);
        setCategories(categoriesResponse.data?.data ?? []);
        setVariants(variantsResponse.data?.data ?? []);
      } catch {
        setCategories([]);
        setVariants([]);
      }
    };

    loadMeta();
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

  const handleToggleStatus = async () => {
    if (!product) {
      return;
    }
    const nextStatus =
      typeof product.isActive === "boolean"
        ? !product.isActive
        : product.status?.toLowerCase() !== "active";
    setIsSubmitting(true);
    setToastMessage("");
    setToastError("");
    try {
      await api.put(`/products/${productId}`, { isActive: nextStatus });
      setProduct((prev) =>
        prev ? { ...prev, isActive: nextStatus, status: nextStatus ? "active" : "inactive" } : prev
      );
      setToastMessage(nextStatus ? "Product activated." : "Product deactivated.");
    } catch (err) {
      setToastError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) {
      return;
    }
    setIsSubmitting(true);
    setToastMessage("");
    setToastError("");
    try {
      await api.delete(`/products/${productId}`);
      router.push("/admin/products");
    } catch (err) {
      setToastError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setIsDeleteOpen(false);
    }
  };

  const openEditModal = () => {
    if (!product) {
      return;
    }
    setActionError("");
    setEditImageInputs([]);
    setImagesTouched(false);
    setIsEditOpen(true);
  };

  const uploadImages = async (files: File[]) => {
    if (files.length === 0) {
      return [];
    }
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    const response = await api.post("/upload/product-images", formData);
    const urls = response.data?.data?.urls ?? response.data?.urls ?? [];
    return Array.isArray(urls) ? urls : [];
  };

  const handleEdit = async () => {
    if (!product) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      const filesToUpload = editImageInputs.filter(
        (file): file is File => file instanceof File
      );
      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadImages(filesToUpload);
        if (uploadedUrls.length === 0) {
          setActionError("Image upload failed.");
          return;
        }
      }
      const payload: Record<string, unknown> = {};
      const nextName = nameInput.trim();
      if (nextName && nextName !== product.name) {
        payload.name = nextName;
      }
      const nextPriceBefore = toNumber(priceBeforeInput);
      if (
        nextPriceBefore !== null &&
        nextPriceBefore !== toNumberValue(product.priceBeforeDiscount)
      ) {
        payload.priceBeforeDiscount = nextPriceBefore;
      }
      const nextPriceAfter = toNumber(priceAfterInput);
      if (
        nextPriceAfter !== null &&
        nextPriceAfter !== toNumberValue(product.priceAfterDiscount)
      ) {
        payload.priceAfterDiscount = nextPriceAfter;
      }
      const nextStock = toNumber(stockInput);
      if (nextStock !== null && nextStock !== toNumberValue(product.stock)) {
        payload.stock = nextStock;
      }
      const nextCategoryId = toNumber(categoryIdInput);
      if (
        nextCategoryId !== null &&
        nextCategoryId !== product.categoryId
      ) {
        payload.categoryId = nextCategoryId;
      }
      const nextVariantId = toNumber(variantIdInput);
      if (
        nextVariantId !== null &&
        nextVariantId !== product.variantId
      ) {
        payload.variantId = nextVariantId;
      }
      const nextDescription = descriptionInput.trim();
      if (nextDescription !== (product.description ?? "")) {
        payload.description = nextDescription;
      }
      const nextIsActive = statusInput.trim().toLowerCase() === "active";
      const currentIsActive =
        typeof product.isActive === "boolean"
          ? product.isActive
          : product.status?.toLowerCase() === "active";
      if (nextIsActive !== currentIsActive) {
        payload.isActive = nextIsActive;
      }
      if (imagesTouched) {
        payload.images = [...existingEditImages, ...uploadedUrls];
      }
      if (Object.keys(payload).length === 0) {
        setActionError("No changes to update.");
        return;
      }
      await api.put(`/products/${productId}`, payload);
      setProduct((prev) => (prev ? { ...prev, ...payload } : prev));
      if (imagesTouched) {
        const nextImages = payload.images as string[] | undefined;
        if (nextImages) {
          setExistingEditImages(nextImages);
        }
        setEditImageInputs([]);
        setImagesTouched(false);
      }
      setIsEditOpen(false);
      setToastMessage("Product updated successfully.");
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceBefore = toNumberValue(
    product?.priceBeforeDiscount ?? product?.price
  );
  const priceAfter = toNumberValue(product?.priceAfterDiscount);
  const stockValue = toNumberValue(product?.stock);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">
              <Link href="/admin/products" className="hover:text-slate-700">
                Products
              </Link>{" "}
              / Product Details
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {product?.name ?? "Product Details"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Back to Products
            </Link>
            <Button variant="secondary" onClick={openEditModal} disabled={!product}>
              Edit Product
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleStatus}
              disabled={isSubmitting || !product}
            >
              {resolveStatusLabel(product ?? {}) === "Active"
                ? "Deactivate Product"
                : "Activate Product"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isSubmitting || !product}
            >
              Delete Product
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
        ) : !product ? (
          <p className="text-sm text-slate-500">Product not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Product Overview
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Product Name</span>
                    <span className="font-medium text-slate-900">
                      {product.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${resolveStatusBadge(
                        product
                      )}`}
                    >
                      {resolveStatusLabel(product)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Category</span>
                    <span className="text-slate-900">
                      {product.category?.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created At</span>
                    <span className="text-slate-900">
                      {formatDate(product.createdAt ?? product.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Pricing & Stock
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Price Before Discount</span>
                    <span className="text-slate-900">
                      {priceBefore !== null ? formatCurrency(priceBefore) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Price After Discount</span>
                    <span className="text-slate-900">
                      {priceAfter !== null ? formatCurrency(priceAfter) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stock</span>
                    <span className="text-slate-900">
                      {stockValue !== null ? stockValue : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Variant Details
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>SKU</span>
                    <span className="text-slate-900">{variantDetails.sku}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Size</span>
                    <span className="text-slate-900">{variantDetails.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Color</span>
                    <span className="flex items-center gap-2 text-slate-900">
                      <span
                        className="h-3 w-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: variantDetails.color ?? "#000000" }}
                      />
                      {variantDetails.color}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Material</span>
                    <span className="text-slate-900">
                      {variantDetails.material}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Variant Status</span>
                    <span className="text-slate-900">
                      {variantDetails.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Product Images
                </h2>
                {images.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No images available.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <img
                      src={selectedImage ?? images[0]}
                      alt={product.name ?? "Product"}
                      className="h-64 w-full rounded-lg object-contain bg-slate-50"
                    />
                    {images.length > 1 ? (
                      <div className="flex flex-wrap gap-2">
                        {images.map((image) => (
                          <button
                            key={image}
                            type="button"
                            onClick={() => setSelectedImage(image)}
                            className={`rounded-md border px-1 py-1 transition ${
                              selectedImage === image
                                ? "border-slate-900"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            <img
                              src={image}
                              alt={product.name ?? "Product"}
                              className="h-16 w-16 rounded-md object-contain bg-slate-50"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Product Description
                </h2>
                <p className="mt-3 text-sm text-slate-600">
                  {product.description ?? "No description provided."}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      <Modal
        title="Edit Product"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Product Name
            </label>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Enter product name"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Price Before
              </label>
              <input
                type="number"
                value={priceBeforeInput}
                onChange={(event) => setPriceBeforeInput(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Price After
              </label>
              <input
                type="number"
                value={priceAfterInput}
                onChange={(event) => setPriceAfterInput(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Stock</label>
              <input
                type="number"
                value={stockInput}
                onChange={(event) => setStockInput(event.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={categoryIdInput}
                onChange={(event) => setCategoryIdInput(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Variant
              </label>
              <select
                value={variantIdInput}
                onChange={(event) => setVariantIdInput(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select variant</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={String(variant.id)}>
                    {variant.sku || variant.name || `Variant #${variant.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="status-edit"
                    value="active"
                    checked={statusInput === "active"}
                    onChange={(event) => setStatusInput(event.target.value)}
                    className="h-4 w-4 accent-slate-900"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="status-edit"
                    value="inactive"
                    checked={statusInput === "inactive"}
                    onChange={(event) => setStatusInput(event.target.value)}
                    className="h-4 w-4 accent-slate-900"
                  />
                  Not Active
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={descriptionInput}
              onChange={(event) => setDescriptionInput(event.target.value)}
              placeholder="Optional description"
              className="min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Product Images
            </label>
            <div className="space-y-3">
              {existingEditImages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {existingEditImages.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1"
                    >
                      <img
                        src={resolveImageUrl(url)}
                        alt={`Existing ${index + 1}`}
                        className="h-8 w-8 rounded object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setExistingEditImages((prev) =>
                            prev.filter((_, idx) => idx !== index)
                          );
                          setImagesTouched(true);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {editImageInputs.map((file, index) => (
                <div key={`edit-image-${index}`} className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    {`Product Image ${existingEditImages.length + index + 1}`}
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setEditImageInputs((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? nextFile : item
                        )
                      );
                      if (nextFile) {
                        setImagesTouched(true);
                      }
                    }}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  />
                  {file ? (
                    <p className="text-xs text-slate-500">{file.name}</p>
                  ) : null}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditImageInputs((prev) =>
                      prev.length + existingEditImages.length < 5
                        ? [...prev, null]
                        : prev
                    )
                  }
                  disabled={
                    existingEditImages.length + editImageInputs.length >= 5 ||
                    (editImageInputs.length > 0 &&
                      !editImageInputs[editImageInputs.length - 1])
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add New Image
                </button>
                {existingEditImages.length + editImageInputs.length >= 5 ? (
                  <span className="text-xs text-slate-500">
                    Maximum 5 images allowed
                  </span>
                ) : null}
              </div>
            </div>
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
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete Product"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this product? This action cannot be
            undone.
          </p>
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
