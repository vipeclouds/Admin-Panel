"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import api from "@/services/api";
import type { ApiResponse } from "@/types";

type TermRecord = {
  id: number;
  question: string;
  answer: string;
  isActive?: boolean | null;
};

type AlertState = {
  type: "success" | "error";
  text: string;
};

type TermFormState = {
  question: string;
  answer: string;
  isActive: boolean;
};

type TermValidationErrors = {
  question?: string;
  answer?: string;
};

const initialTermForm: TermFormState = {
  question: "",
  answer: "",
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

const validateTermForm = (values: TermFormState) => {
  const errors: TermValidationErrors = {};
  if (values.question.trim().length < 3) {
    errors.question = "Question must be at least 3 characters.";
  }
  if (values.answer.trim().length < 3) {
    errors.answer = "Answer must be at least 3 characters.";
  }
  return errors;
};

const formatStatusClass = (isActive?: boolean | null) =>
  isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

const resolveActiveValue = (isActive?: boolean | null) =>
  typeof isActive === "boolean" ? isActive : true;

export default function AdminTermsConditionsPage() {
  const [terms, setTerms] = useState<TermRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TermFormState>(initialTermForm);
  const [createErrors, setCreateErrors] = useState<TermValidationErrors>({});
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<TermFormState>(initialTermForm);
  const [editErrors, setEditErrors] = useState<TermValidationErrors>({});
  const [selectedTerm, setSelectedTerm] = useState<TermRecord | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTerms = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response = await api.get<ApiResponse<TermRecord[]>>(
        "/admin/terms-conditions"
      );
      const payload = response.data?.data;
      setTerms(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setFetchError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const openCreateModal = () => {
    setCreateForm(initialTermForm);
    setCreateErrors({});
    setIsCreateOpen(true);
  };

  const openEditModal = (term: TermRecord) => {
    setSelectedTerm(term);
    setEditForm({
      question: term.question ?? "",
      answer: term.answer ?? "",
      isActive: resolveActiveValue(term.isActive),
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    const errors = validateTermForm(createForm);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }
    setCreateErrors({});
    setIsCreateSubmitting(true);
    try {
      await api.post("/admin/terms-conditions", {
        question: createForm.question.trim(),
        answer: createForm.answer.trim(),
        isActive: createForm.isActive,
      });
      setAlert({ type: "success", text: "Term created successfully." });
      setIsCreateOpen(false);
      await fetchTerms();
    } catch (error) {
      const message = getErrorMessage(error);
      setAlert({ type: "error", text: message });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTerm) {
      return;
    }
    const errors = validateTermForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});
    setIsEditSubmitting(true);
    try {
      await api.put(`/admin/terms-conditions/${selectedTerm.id}`, {
        question: editForm.question.trim(),
        answer: editForm.answer.trim(),
        isActive: editForm.isActive,
      });
      setAlert({ type: "success", text: "Term updated successfully." });
      setIsEditOpen(false);
      setSelectedTerm(null);
      await fetchTerms();
    } catch (error) {
      const message = getErrorMessage(error);
      setAlert({ type: "error", text: message });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (term: TermRecord) => {
    if (!window.confirm("Disable this entry?")) {
      return;
    }
    setDeletingId(term.id);
    try {
      await api.delete(`/admin/terms-conditions/${term.id}`);
      setAlert({ type: "success", text: "Term disabled successfully." });
      await fetchTerms();
    } catch (error) {
      setAlert({ type: "error", text: getErrorMessage(error) });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Terms & Conditions
            </h1>
            <p className="text-sm text-slate-600">
              Manage the legal content that is shown to users.
            </p>
          </div>
          <Button onClick={openCreateModal}>Add Term</Button>
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
          <p className="text-sm text-slate-600">Loading terms...</p>
        ) : terms.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No terms found yet. Use “Add Term” to publish the first section.
          </p>
        ) : (
          <div className="space-y-4">
            {terms.map((term) => (
              <article
                key={term.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900">
                      {term.question}
                    </p>
                    <p className="text-sm text-slate-600">{term.answer}</p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                        resolveActiveValue(term.isActive)
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {resolveActiveValue(term.isActive) ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openEditModal(term)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(term)}
                      disabled={deletingId === term.id}
                    >
                      {deletingId === term.id ? "Disabling..." : "Disable"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Modal
          title="Add Term"
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Question
              </label>
              <Input
                value={createForm.question}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    question: event.target.value,
                  }))
                }
                placeholder="Enter the term title"
              />
              {createErrors.question ? (
                <p className="mt-1 text-xs text-rose-600">
                  {createErrors.question}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Answer
              </label>
              <textarea
                value={createForm.answer}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    answer: event.target.value,
                  }))
                }
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Describe the policy"
              />
              {createErrors.answer ? (
                <p className="mt-1 text-xs text-rose-600">
                  {createErrors.answer}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={createForm.isActive}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreateSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreateSubmitting}>
                {isCreateSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="Edit Term"
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedTerm(null);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Question
              </label>
              <Input
                value={editForm.question}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    question: event.target.value,
                  }))
                }
                placeholder="Enter the term title"
              />
              {editErrors.question ? (
                <p className="mt-1 text-xs text-rose-600">
                  {editErrors.question}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Answer
              </label>
              <textarea
                value={editForm.answer}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    answer: event.target.value,
                  }))
                }
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Describe the policy"
              />
              {editErrors.answer ? (
                <p className="mt-1 text-xs text-rose-600">
                  {editErrors.answer}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={editForm.isActive}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedTerm(null);
                }}
                disabled={isEditSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isEditSubmitting}>
                {isEditSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
