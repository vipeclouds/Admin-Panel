"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";

type Variant = {
  id: number;
  sku: string;
  attributes?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
  isActive?: boolean | null;
  createdAt?: string | null;
};

const COLOR_OPTIONS = [
  { name: "Black", value: "black", hex: "#000000" },
  { name: "White", value: "white", hex: "#FFFFFF" },
  { name: "Red", value: "red", hex: "#FF0000" },
  { name: "Blue", value: "blue", hex: "#0000FF" },
  { name: "Green", value: "green", hex: "#008000" },
  { name: "Yellow", value: "yellow", hex: "#FFD700" },
  { name: "Brown", value: "brown", hex: "#8B4513" },
  { name: "Gray", value: "gray", hex: "#808080" },
  { name: "Beige", value: "beige", hex: "#F5F5DC" },
  { name: "Navy", value: "navy", hex: "#001F3F" },
];

const SIZE_OPTIONS = [
  { label: "XXS", value: "XXS" },
  { label: "XS", value: "XS" },
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
  { label: "XL", value: "XL" },
  { label: "XXL", value: "XXL" },
  { label: "XXXL", value: "XXXL" },
];

const MATERIAL_OPTIONS = [
  { label: "Cotton", value: "Cotton" },
  { label: "Polyester", value: "Polyester" },
  { label: "Cotton Blend", value: "Cotton Blend" },
  { label: "Linen", value: "Linen" },
  { label: "Wool", value: "Wool" },
  { label: "Silk", value: "Silk" },
  { label: "Denim", value: "Denim" },
  { label: "Leather", value: "Leather" },
  { label: "Faux Leather", value: "Faux Leather" },
  { label: "Nylon", value: "Nylon" },
  { label: "Viscose", value: "Viscose" },
  { label: "Rayon", value: "Rayon" },
  { label: "Elastane (Spandex)", value: "Elastane" },
];

const getColorLabel = (value: string) => {
  const match = COLOR_OPTIONS.find((color) => color.value === value);
  return match?.name ?? value;
};

const getColorHex = (value: string) => {
  const match = COLOR_OPTIONS.find((color) => color.value === value);
  return match?.hex ?? "#000000";
};

type ApiListResponse<T> = {
  success: boolean;
  data: T;
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

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as {
      response?: { status?: number; data?: { message?: string } };
    };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

export default function VariantsPage() {
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [skuInput, setSkuInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [materialInput, setMaterialInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterId, setFilterId] = useState("");
  const [filterSku, setFilterSku] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");

  const sortedVariants = useMemo(
    () => [...variants].sort((a, b) => a.id - b.id),
    [variants]
  );

  const fetchVariants = async (params?: URLSearchParams) => {
    setIsLoading(true);
    setError("");
    try {
      const query = params?.toString() ?? "";
      const response = await api.get<ApiListResponse<Variant[]>>(
        `/variants${query ? `?${query}` : ""}`
      );
      setVariants(response.data?.data ?? []);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const resetForm = () => {
    setSkuInput("");
    setSizeInput("");
    setColorInput("");
    setMaterialInput("");
    setStatusInput("active");
    setActionError("");
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (filterId.trim()) {
      params.set("id", filterId.trim());
    }
    if (filterSku.trim()) {
      params.set("sku", filterSku.trim());
    }
    if (filterSize) {
      params.set("size", filterSize);
    }
    if (filterColor) {
      params.set("color", filterColor);
    }
    if (filterMaterial) {
      params.set("material", filterMaterial);
    }
    fetchVariants(params);
  };

  const handleResetFilters = () => {
    setFilterId("");
    setFilterSku("");
    setFilterSize("");
    setFilterColor("");
    setFilterMaterial("");
    fetchVariants();
  };

  const openAddModal = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (variant: Variant) => {
    setSelectedVariant(variant);
    setSkuInput(variant.sku ?? "");
    setSizeInput(variant.attributes?.size ?? "");
    setColorInput(variant.attributes?.color ?? "");
    setMaterialInput(variant.attributes?.material ?? "");
    setStatusInput(variant.isActive ? "active" : "inactive");
    setActionError("");
    setIsEditOpen(true);
  };

  const openDeleteModal = (variant: Variant) => {
    setSelectedVariant(variant);
    setActionError("");
    setIsDeleteOpen(true);
  };

  const handleAdd = async () => {
    setIsSubmitting(true);
    setActionError("");
    try {
      const payload = {
        sku: skuInput.trim(),
        attributes: {
          size: sizeInput.trim(),
          color: colorInput.trim(),
          material: materialInput.trim(),
        },
        isActive: statusInput === "active",
      };
      if (!payload.sku) {
        setActionError("SKU is required.");
        return;
      }
      if (!payload.attributes.size || !payload.attributes.color || !payload.attributes.material) {
        setActionError("All attributes are required.");
        return;
      }
      await api.post("/variants", payload);
      setIsAddOpen(false);
      await fetchVariants();
    } catch (err) {
      setActionError(getErrorMessage(err));
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        router.replace("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sanitizeSkuPart = (value: string) =>
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const handleAutoGenerateSku = () => {
    if (!sizeInput || !colorInput || !materialInput) {
      setActionError("You need to choose all options to use Auto Generate");
      return;
    }
    const sku = `${sanitizeSkuPart(materialInput)}-${sanitizeSkuPart(
      sizeInput
    )}-${sanitizeSkuPart(colorInput)}`;
    setSkuInput(sku);
    setActionError("");
  };

  const handleEdit = async () => {
    if (!selectedVariant) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    try {
      const payload: Record<string, unknown> = {};
      const nextSku = skuInput.trim();
      if (nextSku && nextSku !== selectedVariant.sku) {
        payload.sku = nextSku;
      }
      const nextSize = sizeInput.trim();
      const nextColor = colorInput.trim();
      const nextMaterial = materialInput.trim();
      if (
        nextSize !== (selectedVariant.attributes?.size ?? "") ||
        nextColor !== (selectedVariant.attributes?.color ?? "") ||
        nextMaterial !== (selectedVariant.attributes?.material ?? "")
      ) {
        payload.attributes = {
          size: nextSize,
          color: nextColor,
          material: nextMaterial,
        };
      }
      const nextStatus = statusInput === "active";
      if (nextStatus !== Boolean(selectedVariant.isActive)) {
        payload.isActive = nextStatus;
      }
      if (Object.keys(payload).length === 0) {
        setActionError("No changes to update.");
        return;
      }
      await api.put(`/variants/${selectedVariant.id}`, payload);
      setIsEditOpen(false);
      setSelectedVariant(null);
      await fetchVariants();
    } catch (err) {
      setActionError(getErrorMessage(err));
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        router.replace("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVariant) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.delete(`/variants/${selectedVariant.id}`);
      setIsDeleteOpen(false);
      setSelectedVariant(null);
      await fetchVariants();
    } catch (err) {
      setActionError(getErrorMessage(err));
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        router.replace("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Variants</h1>
            <p className="text-sm remember text-slate-500">
              Manage product variants and attributes.
            </p>
          </div>
          <Button onClick={openAddModal}>Add Variant</Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ID</label>
              <input
                value={filterId}
                onChange={(event) => setFilterId(event.target.value)}
                placeholder="ID"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">SKU</label>
              <input
                value={filterSku}
                onChange={(event) => setFilterSku(event.target.value)}
                placeholder="SKU"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Size</label>
              <select
                value={filterSize}
                onChange={(event) => setFilterSize(event.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All</option>
                {SIZE_OPTIONS.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Color</label>
              <select
                value={filterColor}
                onChange={(event) => setFilterColor(event.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All</option>
                {COLOR_OPTIONS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Material
              </label>
              <select
                value={filterMaterial}
                onChange={(event) => setFilterMaterial(event.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All</option>
                {MATERIAL_OPTIONS.map((material) => (
                  <option key={material.value} value={material.value}>
                    {material.label}
                  </option>
                ))}
              </select>
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
              onClick={handleResetFilters}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Reset Filters
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
          ) : sortedVariants.length === 0 ? (
            <p className="text-sm text-slate-500">No variants found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">SKU</th>
                    <th className="py-2 pr-4 font-medium">Size</th>
                    <th className="py-2 pr-4 font-medium">Color</th>
                    <th className="py-2 pr-4 font-medium">Material</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Created At</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedVariants.map((variant) => (
                    <tr key={variant.id} className="text-slate-700">
                      <td className="py-3 pr-4">{variant.id}</td>
                      <td className="py-3 pr-4">{variant.sku}</td>
                      <td className="py-3 pr-4">
                        {variant.attributes?.size ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {variant.attributes?.color ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {variant.attributes?.material ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {variant.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="py-3 pr-4">
                        {formatDate(variant.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => openEditModal(variant)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => openDeleteModal(variant)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          title="Add Variant"
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">SKU</label>
              <div className="flex flex-wrap gap-2">
                <div className="flex-1">
                  <Input
                    value={skuInput}
                    onChange={(event) => setSkuInput(event.target.value)}
                    placeholder="Enter SKU"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10"
                  onClick={handleAutoGenerateSku}
                  title="Generate SKU based on selected attributes"
                >
                  Auto Generate
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Size
                </label>
                <div className="relative">
                  <select
                    value={sizeInput}
                    onChange={(event) => setSizeInput(event.target.value)}
                    className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select size</option>
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    ▾
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Color
                </label>
                <div className="relative">
                  <select
                    value={colorInput}
                    onChange={(event) => setColorInput(event.target.value)}
                    className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select color</option>
                    {COLOR_OPTIONS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    ▾
                  </span>
                  {colorInput ? (
                    <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-xs text-slate-600">
                      <span
                        className={`h-3 w-3 rounded-full border ${colorInput === "white" ? "border-slate-300" : "border-transparent"}`}
                        style={{ backgroundColor: getColorHex(colorInput) }}
                      />
                      {getColorLabel(colorInput)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Material
              </label>
              <div className="relative">
                <select
                  value={materialInput}
                  onChange={(event) => setMaterialInput(event.target.value)}
                  className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Select material</option>
                  {MATERIAL_OPTIONS.map((material) => (
                    <option key={material.value} value={material.value}>
                      {material.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  ▾
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="status-add"
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
                    name="status-add"
                    value="inactive"
                    checked={statusInput === "inactive"}
                    onChange={(event) => setStatusInput(event.target.value)}
                    className="h-4 w-4 accent-slate-900"
                  />
                  Inactive
                </label>
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
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isSubmitting || skuInput.trim().length === 0}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="Edit Variant"
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">SKU</label>
              <div className="flex flex-wrap gap-2">
                <div className="flex-1">
                  <Input
                    value={skuInput}
                    onChange={(event) => setSkuInput(event.target.value)}
                    placeholder="Enter SKU"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10"
                  onClick={handleAutoGenerateSku}
                  title="Generate SKU based on selected attributes"
                >
                  Auto Generate
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Size
                </label>
                <div className="relative">
                  <select
                    value={sizeInput}
                    onChange={(event) => setSizeInput(event.target.value)}
                    className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select size</option>
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    ▾
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Color
                </label>
                <div className="relative">
                  <select
                    value={colorInput}
                    onChange={(event) => setColorInput(event.target.value)}
                    className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select color</option>
                    {COLOR_OPTIONS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    ▾
                  </span>
                  {colorInput ? (
                    <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-xs text-slate-600">
                      <span
                        className={`h-3 w-3 rounded-full border ${colorInput === "white" ? "border-slate-300" : "border-transparent"}`}
                        style={{ backgroundColor: getColorHex(colorInput) }}
                      />
                      {getColorLabel(colorInput)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Material
              </label>
              <div className="relative">
                <select
                  value={materialInput}
                  onChange={(event) => setMaterialInput(event.target.value)}
                  className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Select material</option>
                  {MATERIAL_OPTIONS.map((material) => (
                    <option key={material.value} value={material.value}>
                      {material.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  ▾
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
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
                  Inactive
                </label>
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
              <Button
                onClick={handleEdit}
                disabled={isSubmitting || skuInput.trim().length === 0}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="Delete Variant"
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this variant?
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
      </div>
    </AdminLayout>
  );
}
