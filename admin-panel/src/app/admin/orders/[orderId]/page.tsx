"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import api from "@/services/api";

type OrderItem = {
  id?: number | string;
  productId?: number | string;
  product_id?: number | string;
  quantity?: number | string;
  qty?: number | string;
  count?: number | string;
  price?: number | string;
  unit_price?: number | string;
  unitPrice?: number | string;
  itemPrice?: number | string;
  productPrice?: number | string;
  priceAfterDiscount?: number | string;
  priceBeforeDiscount?: number | string;
  productImage?: string | null;
  subtotal?: number | string;
  subTotal?: number | string;
  total?: number | string;
  totalPrice?: number | string;
  total_price?: number | string;
  productName?: string | null;
  name?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  imagePath?: string | null;
  image_path?: string | null;
  images?: string[] | string | null;
  product?: {
    name?: string | null;
    title?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    imagePath?: string | null;
    image_path?: string | null;
    images?: string[] | string | null;
    imagesUrl?: string[] | string | null;
    images_url?: string[] | string | null;
    price?: number | string | null;
    priceAfterDiscount?: number | string | null;
  } | null;
  variant?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
  attributes?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
};

type OrderDetail = {
  id?: number | string;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  paymentType?: string | null;
  paymentMethod?: string | null;
  totalAmount?: number | string | null;
  totalPrice?: number | string | null;
  user?: {
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  customer?: {
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  address?: {
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
    phone?: string | null;
    area?: string | null;
    city?: string | null;
    street?: string | null;
    notes?: string | null;
  } | string | null;
  shippingAddress?: {
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
    phone?: string | null;
    area?: string | null;
    city?: string | null;
    street?: string | null;
    notes?: string | null;
  } | null;
  items?: OrderItem[] | null;
  orderItems?: OrderItem[] | null;
  products?: OrderItem[] | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const STATUS_OPTIONS = [
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

const getStatusBadgeClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("pending")) {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized.includes("cancel") || normalized.includes("fail")) {
    return "bg-rose-100 text-rose-700";
  }
  if (normalized.includes("complete") || normalized.includes("deliver")) {
    return "bg-emerald-100 text-emerald-700";
  }
  return "bg-slate-100 text-slate-700";
};

const parseAddress = (address: OrderDetail["address"]) => {
  if (!address) {
    return null;
  }
  if (typeof address === "string") {
    try {
      return JSON.parse(address) as OrderDetail["shippingAddress"];
    } catch {
      return null;
    }
  }
  return address;
};

const resolveCustomerName = (order: OrderDetail) =>
  order.user?.fullName ||
  order.user?.full_name ||
  order.user?.name ||
  order.customer?.fullName ||
  order.customer?.full_name ||
  order.customer?.name ||
  parseAddress(order.address)?.fullName ||
  parseAddress(order.address)?.full_name ||
  parseAddress(order.address)?.name ||
  "Unknown";

const resolveCustomerEmail = (order: OrderDetail) =>
  order.user?.email || order.customer?.email || "-";

const resolveCustomerPhone = (order: OrderDetail) =>
  order.user?.phone ||
  order.customer?.phone ||
  parseAddress(order.address)?.phone ||
  parseAddress(order.shippingAddress)?.phone ||
  "-";

const resolveShippingAddress = (order: OrderDetail) =>
  order.shippingAddress || parseAddress(order.address);

const resolveItems = (order: OrderDetail) => {
  const items = order.items || order.orderItems || order.products || [];
  return Array.isArray(items) ? items : [];
};

const resolveImageUrl = (item: OrderItem) => {
  const raw =
    item.productImage ||
    item.image ||
    item.imageUrl ||
    item.image_url ||
    item.imagePath ||
    item.image_path ||
    (Array.isArray(item.images) ? item.images[0] : item.images) ||
    item.product?.imageUrl ||
    item.product?.image ||
    item.product?.image_url ||
    item.product?.imagePath ||
    item.product?.image_path ||
    (Array.isArray(item.product?.images)
      ? item.product?.images[0]
      : item.product?.images) ||
    (Array.isArray(item.product?.imagesUrl)
      ? item.product?.imagesUrl[0]
      : item.product?.imagesUrl) ||
    (Array.isArray(item.product?.images_url)
      ? item.product?.images_url[0]
      : item.product?.images_url) ||
    "";
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const resolveVariantLabel = (item: OrderItem) => {
  const variant = item.variant || item.attributes || {};
  const parts = [variant.size, variant.color, variant.material].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "-";
};

const resolveItemName = (item: OrderItem) =>
  item.productName ||
  item.name ||
  item.product?.name ||
  item.product?.title ||
  "Product";

const resolveProductId = (item: OrderItem) =>
  item.productId ??
  item.product_id ??
  item.product?.id ??
  null;

const resolveQuantity = (item: OrderItem) => {
  const raw = item.quantity ?? item.qty ?? item.count ?? 1;
  return typeof raw === "string" ? Number(raw) : raw;
};

const resolvePrice = (item: OrderItem) =>
  toNumberValue(
    item.price ??
      item.unit_price ??
      item.unitPrice ??
      item.itemPrice ??
      item.productPrice ??
      item.priceAfterDiscount ??
      item.priceBeforeDiscount ??
      item.product?.priceAfterDiscount ??
      item.product?.price
  ) ?? 0;

const resolveSubtotal = (item: OrderItem) => {
  const value = toNumberValue(
    item.subtotal ??
      item.subTotal ??
      item.total ??
      item.totalPrice ??
      item.total_price
  );
  if (value !== null) {
    return value;
  }
  const price = resolvePrice(item);
  const quantity = resolveQuantity(item);
  return price * (Number.isFinite(quantity) ? Number(quantity) : 1);
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = Array.isArray(params?.orderId)
    ? params?.orderId[0]
    : params?.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [statusInput, setStatusInput] = useState<string>("");

  const items = useMemo(() => resolveItems(order ?? {}), [order]);
  const shippingAddress = useMemo(
    () => resolveShippingAddress(order ?? {}),
    [order]
  );
  useEffect(() => {
    if (!orderId) {
      setError("Invalid order id.");
      setIsLoading(false);
      return;
    }
    const loadOrder = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<OrderDetail>>(
          `/admin/orders/${orderId}`
        );
        const payload =
          response.data?.data?.order ??
          response.data?.order ??
          response.data?.data ??
          response.data;
        setOrder(payload ?? null);
        setStatusInput(payload?.status ?? "");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

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

  const handleStatusUpdate = async () => {
    if (!order || !statusInput) {
      return;
    }
    setIsUpdating(true);
    setToastMessage("");
    setToastError("");
    try {
      if (statusInput === "CONFIRMED") {
        await api.put(`/orders/${orderId}/confirm`);
      } else if (statusInput === "OUT_FOR_DELIVERY") {
        await api.put(`/orders/${orderId}/out-for-delivery`);
      } else if (statusInput === "DELIVERED") {
        await api.put(`/orders/${orderId}/delivered`);
      } else if (statusInput === "COMPLETED") {
        await api.put(`/orders/${orderId}/complete`);
      } else {
        await api.patch(`/orders/${orderId}/status`, {
          status: statusInput,
        });
      }
      setOrder((prev) => (prev ? { ...prev, status: statusInput } : prev));
      setToastMessage("Order status updated.");
    } catch (err) {
      setToastError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const totalAmountValue = toNumberValue(
    order?.totalAmount ?? order?.totalPrice
  );
  const statusLabel = order?.status ?? "UNKNOWN";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">
              <Link href="/admin/orders" className="hover:text-slate-700">
                Orders
              </Link>{" "}
              / Order #{orderId}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Order #{orderId}
            </h1>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Back to Orders
          </Link>
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
        ) : !order ? (
          <p className="text-sm text-slate-500">Order not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Order Summary
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Order ID</span>
                    <span className="font-medium text-slate-900">{orderId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                        statusLabel
                      )}`}
                    >
                      {statusLabel.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created At</span>
                    <span className="text-slate-900">
                      {formatDate(order.createdAt ?? order.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment Method</span>
                    <span className="text-slate-900">
                      {order.paymentType ?? order.paymentMethod ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Amount</span>
                    <span className="font-medium text-slate-900">
                      {totalAmountValue !== null
                        ? formatCurrency(Number(totalAmountValue))
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Customer Information
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-slate-900">
                      {resolveCustomerName(order)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    <span className="text-slate-900">
                      {resolveCustomerEmail(order)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone</span>
                    <span className="text-slate-900">
                      {resolveCustomerPhone(order)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Shipping Address
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Area</span>
                    <span className="text-slate-900">
                      {shippingAddress?.area ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>City</span>
                    <span className="text-slate-900">
                      {shippingAddress?.city ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Street</span>
                    <span className="text-slate-900">
                      {shippingAddress?.street ?? "-"}
                    </span>
                  </div>
                  {shippingAddress?.notes ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      Notes: {shippingAddress.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Order Items
                </h2>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">No items found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Product Image</th>
                        <th className="py-2 pr-4 font-medium">Product Name</th>
                        <th className="py-2 pr-4 font-medium">Variant</th>
                        <th className="py-2 pr-4 font-medium">Quantity</th>
                        <th className="py-2 pr-4 font-medium">Price</th>
                        <th className="py-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, index) => {
                        const imageUrl = resolveImageUrl(item);
                        return (
                          <tr
                            key={String(item.id ?? index)}
                            className="text-slate-700"
                          >
                            <td className="py-3 pr-4">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={resolveItemName(item)}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50" />
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              {resolveProductId(item) ? (
                                <Link
                                  href={`/admin/products/${resolveProductId(item)}`}
                                  className="text-slate-900 hover:underline"
                                >
                                  {resolveItemName(item)}
                                </Link>
                              ) : (
                                resolveItemName(item)
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              {resolveVariantLabel(item)}
                            </td>
                            <td className="py-3 pr-4">
                              {resolveQuantity(item)}
                            </td>
                            <td className="py-3 pr-4">
                              {formatCurrency(resolvePrice(item))}
                            </td>
                            <td className="py-3">
                              {formatCurrency(resolveSubtotal(item))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Order Actions
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  value={statusInput}
                  onChange={(event) => setStatusInput(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!statusInput || isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
