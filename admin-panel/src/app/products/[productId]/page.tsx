"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/services/api";

type Product = {
  id?: number | string;
  name?: string | null;
  price?: number | string | null;
  priceBeforeDiscount?: number | string | null;
  priceAfterDiscount?: number | string | null;
  description?: string | null;
  images?: string[] | string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  imageUrls?: string[] | string | null;
  imagesUrl?: string[] | string | null;
  images_url?: string[] | string | null;
  variant?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
    attributes?: {
      size?: string | null;
      color?: string | null;
      material?: string | null;
    } | null;
  } | null;
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

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EGP`;

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

const normalizeSizeLabel = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "small" || normalized === "s") {
    return "S";
  }
  if (normalized === "medium" || normalized === "m") {
    return "M";
  }
  if (normalized === "large" || normalized === "l") {
    return "L";
  }
  return value.toUpperCase();
};

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = Array.isArray(params?.productId)
    ? params?.productId[0]
    : params?.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError("Missing product id.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<Product>>(
          `/products/${productId}`
        );
        setProduct(response.data?.data ?? null);
      } catch (err) {
        setError("Unable to load product details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const images = useMemo(() => {
    if (!product) {
      return [];
    }
    const list = [
      ...extractImagesList(product.images),
      ...extractImagesList(product.imageUrls),
      ...extractImagesList(product.imagesUrl),
      ...extractImagesList(product.images_url),
    ];
    const fallback = [
      product.imageUrl,
      product.image_url,
      product.image,
    ].filter(Boolean) as string[];
    const combined = [...list, ...fallback].filter(Boolean);
    return combined.map(resolveImageUrl).filter(Boolean);
  }, [product]);

  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]);
    }
  }, [images]);

  const priceBefore = toNumberValue(product?.priceBeforeDiscount);
  const priceAfter =
    toNumberValue(product?.priceAfterDiscount) ??
    toNumberValue(product?.price);

  const variant = product?.variant ?? {};
  const attributes = variant.attributes ?? product?.variantAttributes ?? {};
  const size = normalizeSizeLabel(attributes.size ?? variant.size);
  const color = attributes.color ?? variant.color ?? "";
  const material = attributes.material ?? variant.material ?? "";

  const sizeOptions = ["S", "M", "L"];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <style jsx global>{`
        @import url("https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap");
        .product-details {
          font-family: "General Sans", "Segoe UI", Arial, sans-serif;
        }
      `}</style>
      <div className="mx-auto w-full max-w-[390px]">
        <div className="product-details relative min-h-[844px] w-full rounded-[20px] bg-white pb-[140px] shadow-xl ring-1 ring-slate-200">
          <header className="flex items-center justify-between px-6 pt-6">
            <Link
              href="/products"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-900 transition hover:border-slate-400"
              aria-label="Back to products"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Details</h1>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-900 transition hover:border-slate-400"
              aria-label="Notifications"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
          </header>

          <div className="px-6 pt-6">
            <div className="relative overflow-hidden rounded-[12px] bg-slate-50">
              {isLoading ? (
                <div className="h-[368px] w-full animate-pulse bg-slate-200" />
              ) : images.length > 0 ? (
                <img
                  src={selectedImage ?? images[0]}
                  alt={product?.name ?? "Product"}
                  className="h-[368px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[368px] items-center justify-center text-sm text-slate-500">
                  No images available
                </div>
              )}

              <button
                type="button"
                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-white shadow-lg"
                aria-label="Add to favorites"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-slate-900"
                  fill="currentColor"
                >
                  <path d="M12 21s-6.7-4.35-9.33-7.36C.8 11.58 1.4 7.5 4.5 6.1c2.1-.95 4.3.16 5.5 1.64 1.2-1.48 3.4-2.6 5.5-1.64 3.1 1.4 3.7 5.48 1.83 7.54C18.7 16.65 12 21 12 21z" />
                </svg>
              </button>
            </div>

            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border ${
                      selectedImage === image
                        ? "border-slate-900"
                        : "border-slate-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={product?.name ?? "Product"}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="px-6 pt-6">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-6 w-3/5 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              </div>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : !product ? (
              <p className="text-sm text-slate-500">Product not found.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {product.name ?? "Product Name"}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-900">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-400 text-white">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="currentColor"
                      >
                        <path d="M12 17.3l-6.18 3.25 1.18-6.88L2 8.9l6.9-1 3.1-6.25 3.1 6.25 6.9 1-4.99 4.77 1.18 6.88z" />
                      </svg>
                    </span>
                    <span className="underline">4.0/5 (45 reviews)</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-500">
                  {product.description ??
                    "The name says it all, the right size slightly snugs the body leaving enough room for comfort in the sleeves and waist."}
                </p>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Choose size
                  </h3>
                  <div className="flex gap-2">
                    {sizeOptions.map((option) => {
                      const isSelected = option === size;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`flex h-12 w-12 items-center justify-center rounded-[10px] border text-lg font-medium ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-900"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold uppercase tracking-tight text-slate-900">
                  <div>
                    <p>{color ? `${color} color` : "Color"}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {color || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p>{material ? `${material} material` : "Material"}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {material || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {priceAfter !== null ? formatCurrency(priceAfter) : "-"}
                </p>
                {priceBefore !== null ? (
                  <p className="text-xs font-medium text-slate-400 line-through">
                    {formatCurrency(priceBefore)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="flex h-14 items-center gap-2 rounded-[10px] bg-slate-900 px-6 text-sm font-medium text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6h15l-1.5 9h-12z" />
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="18" cy="21" r="1" />
                </svg>
                Add to bag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
