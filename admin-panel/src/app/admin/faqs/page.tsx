"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";
import type { ApiResponse } from "@/types";

type FaqRecord = {
  id: number;
  question: string;
  answer: string;
  order?: number | null;
  isActive?: boolean | null;
  categoryId?: number | null;
};

type FaqCategory = {
  id: number;
  name: string;
  order?: number | null;
  isActive?: boolean | null;
  faqs?: FaqRecord[] | null;
};

type AlertState = {
  type: "success" | "error";
  text: string;
};

type CategoryFormState = {
  name: string;
  order: string;
  isActive: boolean;
};

type FaqFormState = {
  question: string;
  answer: string;
  order: string;
  categoryId: string;
  isActive: boolean;
};

type CategoryValidationErrors = {
  name?: string;
  order?: string;
};

type FaqValidationErrors = {
  question?: string;
  answer?: string;
  order?: string;
  categoryId?: string;
};

const initialCategoryForm: CategoryFormState = {
  name: "",
  order: "",
  isActive: true,
};

const initialFaqForm: FaqFormState = {
  question: "",
  answer: "",
  order: "",
  categoryId: "",
  isActive: true,
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const responseError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      responseError.response?.data?.message ??
      responseError.message ??
      "Something went wrong."
    );
  }
  return "Something went wrong.";
};

const formatStatusClass = (isActive?: boolean | null) =>
  isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";

const resolveActiveValue = (value?: boolean | null) =>
  typeof value === "boolean" ? value : true;

const validateCategoryForm = (values: CategoryFormState) => {
  const errors: CategoryValidationErrors = {};
  if (!values.name.trim()) {
    errors.name = "Category name is required.";
  }
  if (values.order.trim()) {
    const parsed = Number(values.order.trim());
    if (!Number.isInteger(parsed)) {
      errors.order = "Order must be an integer.";
    }
  }
  return errors;
};

const validateFaqForm = (values: FaqFormState) => {
  const errors: FaqValidationErrors = {};
  if (!values.question.trim()) {
    errors.question = "Question is required.";
  }
  if (!values.answer.trim()) {
    errors.answer = "Answer is required.";
  }
  if (!values.categoryId.trim()) {
    errors.categoryId = "Category selection is required.";
  }
  if (values.order.trim()) {
    const parsed = Number(values.order.trim());
    if (!Number.isInteger(parsed)) {
      errors.order = "Order must be an integer.";
    }
  }
  return errors;
};

export default function AdminFaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(initialCategoryForm);
  const [categoryErrors, setCategoryErrors] =
    useState<CategoryValidationErrors>({});
  const [categoryServerError, setCategoryServerError] = useState("");
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState<FaqFormState>(initialFaqForm);
  const [faqErrors, setFaqErrors] = useState<FaqValidationErrors>({});
  const [faqServerError, setFaqServerError] = useState("");
  const [isFaqSubmitting, setIsFaqSubmitting] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqRecord | null>(null);

  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null
  );
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response = await api.get<ApiResponse<FaqCategory[]>>(
        "/admin/faq-categories"
      );
      const payload = response.data?.data;
      setCategories(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setFetchError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategoryId(null);
      return;
    }
    setActiveCategoryId((prev) =>
      prev && categories.some((category) => category.id === prev)
        ? prev
        : categories[0].id
    );
  }, [categories]);

  const openCategoryModal = () => {
    setCategoryForm(initialCategoryForm);
    setCategoryErrors({});
    setCategoryServerError("");
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryErrors({});
    setCategoryServerError("");
  };

  const openFaqModal = (mode: "create" | "edit", faq?: FaqRecord) => {
    if (mode === "create") {
      setSelectedFaq(null);
      setFaqForm({
        ...initialFaqForm,
        categoryId:
          (activeCategoryId !== null && activeCategoryId !== undefined
            ? String(activeCategoryId)
            : null) ??
          (categories[0]?.id ? String(categories[0].id) : "") ??
          "",
      });
    } else if (faq) {
      setSelectedFaq(faq);
      setFaqForm({
        question: faq.question ?? "",
        answer: faq.answer ?? "",
        order:
          faq.order !== null && faq.order !== undefined ? String(faq.order) : "",
        categoryId:
          faq.categoryId !== null && faq.categoryId !== undefined
            ? String(faq.categoryId)
            : "",
        isActive: resolveActiveValue(faq.isActive),
      });
    }
    setFaqErrors({});
    setFaqServerError("");
    setIsFaqModalOpen(true);
  };

  const closeFaqModal = () => {
    setIsFaqModalOpen(false);
    setFaqErrors({});
    setFaqServerError("");
    setSelectedFaq(null);
  };

  const handleCategorySubmit = async () => {
    const errors = validateCategoryForm(categoryForm);
    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    setCategoryErrors({});
    setCategoryServerError("");
    setIsCategorySubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: categoryForm.name.trim(),
        isActive: categoryForm.isActive,
      };
      if (categoryForm.order.trim()) {
        payload.order = Number(categoryForm.order.trim());
      }
      await api.post("/admin/faq-categories", payload);
      setAlert({ type: "success", text: "Category created successfully." });
      closeCategoryModal();
      await fetchCategories();
    } catch (error) {
      const message = getErrorMessage(error);
      setCategoryServerError(message);
      setAlert({ type: "error", text: message });
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleFaqSubmit = async () => {
    const errors = validateFaqForm(faqForm);
    if (Object.keys(errors).length > 0) {
      setFaqErrors(errors);
      return;
    }
    setFaqErrors({});
    setFaqServerError("");
    setIsFaqSubmitting(true);
    const payload: Record<string, unknown> = {
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      categoryId: Number(faqForm.categoryId),
      isActive: faqForm.isActive,
    };
    if (faqForm.order.trim()) {
      payload.order = Number(faqForm.order.trim());
    }
    try {
      if (selectedFaq) {
        await api.put(`/admin/faqs/${selectedFaq.id}`, payload);
        setAlert({ type: "success", text: "FAQ updated successfully." });
      } else {
        await api.post("/admin/faqs", payload);
        setAlert({ type: "success", text: "FAQ created successfully." });
      }
      closeFaqModal();
      await fetchCategories();
    } catch (error) {
      const message = getErrorMessage(error);
      setFaqServerError(message);
      setAlert({ type: "error", text: message });
    } finally {
      setIsFaqSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: FaqCategory) => {
    const faqs = Array.isArray(category.faqs) ? category.faqs : [];
    if (faqs.length > 0) {
      setAlert({
        type: "error",
        text: "Remove all FAQs from this category before deletion.",
      });
      return;
    }
    if (!window.confirm("Delete this category?")) {
      return;
    }
    setDeletingCategoryId(category.id);
    try {
      await api.delete(`/admin/faq-categories/${category.id}`);
      setAlert({ type: "success", text: "Category deleted successfully." });
      await fetchCategories();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error) });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteFaq = async (faq: FaqRecord) => {
    if (!window.confirm("Delete this FAQ?")) {
      return;
    }
    setDeletingFaqId(faq.id);
    try {
      await api.delete(`/admin/faqs/${faq.id}`);
      setAlert({ type: "success", text: "FAQ deleted successfully." });
      await fetchCategories();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error) });
    } finally {
      setDeletingFaqId(null);
    }
  };

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? null;
  const activeFaqs = Array.isArray(activeCategory?.faqs)
    ? activeCategory.faqs
    : [];
  const hasActiveFaqs = activeFaqs.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              FAQ Categories
            </h1>
            <p className="text-sm text-slate-600">
              Organize questions into sections and keep the catalog up to date.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCategoryModal}>Add Category</Button>
            <Button
              onClick={() => openFaqModal("create")}
              disabled={categories.length === 0}
            >
              Add FAQ
            </Button>
          </div>
        </div>

        {alert ? (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              alert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {alert.text}
          </div>
        ) : null}

        {fetchError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {fetchError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-slate-600">Loading FAQ categories...</p>
        ) : categories.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No categories yet. Create one to start organizing FAQs.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <div className="inline-flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      activeCategoryId === category.id
                        ? "bg-slate-900 text-white shadow"
                        : "bg-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="ml-2 text-[11px] font-normal uppercase tracking-wider text-slate-400">
                      {category.order ?? "-"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeCategory ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-slate-900">
                        {activeCategory.name}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${formatStatusClass(
                          resolveActiveValue(activeCategory.isActive)
                        )}`}
                      >
                        {resolveActiveValue(activeCategory.isActive)
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Order {activeCategory.order ?? "-"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteCategory(activeCategory)}
                      disabled={
                        deletingCategoryId === activeCategory.id ||
                        hasActiveFaqs
                      }
                      title={
                        hasActiveFaqs
                          ? "Remove all FAQs before deleting"
                          : undefined
                      }
                    >
                      {deletingCategoryId === activeCategory.id
                        ? "Deleting..."
                        : "Delete category"}
                    </Button>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {hasActiveFaqs ? (
                    activeFaqs.map((faq) => (
                      <article
                        key={faq.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="max-w-3xl space-y-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {faq.question}
                            </p>
                            <p className="text-sm text-slate-600">
                              {faq.answer}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                              <span>Order {faq.order ?? "-"}</span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${formatStatusClass(
                                  resolveActiveValue(faq.isActive)
                                )}`}
                              >
                                {resolveActiveValue(faq.isActive)
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openFaqModal("edit", faq)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDeleteFaq(faq)}
                              disabled={deletingFaqId === faq.id}
                            >
                              {deletingFaqId === faq.id
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No FAQs in this category yet. Tap &quot;Add FAQ&quot; above
                      to create one.
                    </p>
                  )}
                </div>
              </section>
            ) : (
              <p className="text-sm text-slate-500">
                No categories available. Create a new one to get started.
              </p>
            )}
          </div>
        )}

        <Modal
          title="Create category"
          isOpen={isCategoryModalOpen}
          onClose={closeCategoryModal}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Name
              </label>
              <Input
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Category name"
              />
              {categoryErrors.name ? (
                <p className="mt-1 text-xs text-rose-600">
                  {categoryErrors.name}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Sort order
              </label>
              <Input
                type="number"
                value={categoryForm.order}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    order: event.target.value,
                  }))
                }
                placeholder="Optional integer"
              />
              {categoryErrors.order ? (
                <p className="mt-1 text-xs text-rose-600">
                  {categoryErrors.order}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-slate-900"
              />
              Active
            </label>
            {categoryServerError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {categoryServerError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={closeCategoryModal}
                disabled={isCategorySubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCategorySubmit} disabled={isCategorySubmitting}>
                {isCategorySubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal title="FAQ details" isOpen={isFaqModalOpen} onClose={closeFaqModal}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Question
              </label>
              <Input
                value={faqForm.question}
                onChange={(event) =>
                  setFaqForm((prev) => ({
                    ...prev,
                    question: event.target.value,
                  }))
                }
                placeholder="Enter the question"
              />
              {faqErrors.question ? (
                <p className="mt-1 text-xs text-rose-600">
                  {faqErrors.question}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Answer
              </label>
              <textarea
                value={faqForm.answer}
                onChange={(event) =>
                  setFaqForm((prev) => ({
                    ...prev,
                    answer: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Provide the answer"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              {faqErrors.answer ? (
                <p className="mt-1 text-xs text-rose-600">
                  {faqErrors.answer}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={faqForm.categoryId}
                onChange={(event) =>
                  setFaqForm((prev) => ({
                    ...prev,
                    categoryId: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {faqErrors.categoryId ? (
                <p className="mt-1 text-xs text-rose-600">
                  {faqErrors.categoryId}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Sort order
              </label>
              <Input
                type="number"
                value={faqForm.order}
                onChange={(event) =>
                  setFaqForm((prev) => ({
                    ...prev,
                    order: event.target.value,
                  }))
                }
                placeholder="Optional integer"
              />
              {faqErrors.order ? (
                <p className="mt-1 text-xs text-rose-600">
                  {faqErrors.order}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={faqForm.isActive}
                onChange={(event) =>
                  setFaqForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-slate-900"
              />
              Active
            </label>
            {faqServerError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {faqServerError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={closeFaqModal}
                disabled={isFaqSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleFaqSubmit} disabled={isFaqSubmitting}>
                {isFaqSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
