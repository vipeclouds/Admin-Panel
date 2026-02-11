"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import privacyPolicyApi, {
  PrivacyPolicyRecord,
} from "@/services/privacyPolicyApi";

type AlertState = { type: "success" | "error"; text: string };

type PolicyForm = {
  question: string;
  answer: string;
  isActive: boolean;
};

type ValidationErrors = {
  question?: string;
  answer?: string;
};

const initialForm: PolicyForm = {
  question: "",
  answer: "",
  isActive: true,
};

const validateForm = (values: PolicyForm): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (values.question.trim().length < 3) {
    errors.question = "Question must be at least 3 characters.";
  } else if (values.question.trim().length > 500) {
    errors.question = "Question cannot exceed 500 characters.";
  }
  if (values.answer.trim().length < 3) {
    errors.answer = "Answer must be at least 3 characters.";
  } else if (values.answer.trim().length > 5000) {
    errors.answer = "Answer cannot exceed 5000 characters.";
  }
  return errors;
};

export default function AdminPrivacyPolicyPage() {
  const [policies, setPolicies] = useState<PrivacyPolicyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<PolicyForm>(initialForm);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [selectedPolicy, setSelectedPolicy] =
    useState<PrivacyPolicyRecord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PrivacyPolicyRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const response = await privacyPolicyApi.getPrivacyPolicies({
        page,
        limit,
      });
      const raw = response.data?.data;
      const items =
        raw?.items ??
        raw ??
        (Array.isArray(raw) ? raw : null);
      setPolicies(Array.isArray(items) ? items : []);
    } catch (error) {
      setFetchError("Failed to load privacy policies.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const hasPrev = page > 1;
  const hasNext = policies.length === limit;

  const openCreate = () => {
    setSelectedPolicy(null);
    setFormMode("create");
    setFormValues(initialForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (policy: PrivacyPolicyRecord) => {
    setSelectedPolicy(policy);
    setFormMode("edit");
    setFormValues({
      question: policy.question,
      answer: policy.answer,
      isActive: policy.isActive,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async () => {
    const errors = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsFormSubmitting(true);
    try {
      const payload = {
        question: formValues.question.trim(),
        answer: formValues.answer.trim(),
        isActive: formValues.isActive,
      };
      const response =
        formMode === "create"
          ? await privacyPolicyApi.createPrivacyPolicy(payload)
          : selectedPolicy
          ? await privacyPolicyApi.updatePrivacyPolicy(selectedPolicy.id, payload)
          : null;
      setAlert({
        type: "success",
        text: response?.data?.message ?? "Privacy policy saved successfully.",
      });
      setIsFormOpen(false);
      setPage(1);
      await fetchPolicies();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setAlert({ type: "error", text: message });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await privacyPolicyApi.deletePrivacyPolicy(
        deleteTarget.id
      );
      setAlert({
        type: "success",
        text: response.data?.message ?? "Privacy policy deleted.",
      });
      setDeleteTarget(null);
      await fetchPolicies();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setAlert({ type: "error", text: message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-600">
              Browse questions via GET /privacy-policy and manage entries with
              POST/PUT/DELETE.
            </p>
          </div>
          <Button onClick={openCreate}>Add Policy</Button>
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

        <div className="text-sm text-slate-600">
          Browse the privacy policy list (paginated via GET /privacy-policy).
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-600">Loading privacy policies…</p>
        ) : policies.length === 0 ? (
          <p className="text-sm text-slate-600">
            No policies found. Use “Add Policy” to create the first entry.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Question</th>
                  <th className="px-3 py-3">Answer</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">
                        {policy.question}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-slate-600">
                        {policy.answer.length > 120
                          ? `${policy.answer.slice(0, 120)}…`
                          : policy.answer}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                          policy.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(policy)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget(policy)}
                          className="text-xs"
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

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!hasPrev}
            className="text-xs"
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNext}
            className="text-xs"
          >
            Next
          </Button>
        </div>

        <Modal
          title={formMode === "create" ? "Add Policy" : "Edit Policy"}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Question
              </label>
              <Input
                value={formValues.question}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    question: event.target.value,
                  }))
                }
                placeholder="Enter question"
              />
              {formErrors.question ? (
                <p className="mt-1 text-xs text-rose-600">
                  {formErrors.question}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Answer
              </label>
              <textarea
                value={formValues.answer}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    answer: event.target.value,
                  }))
                }
                rows={6}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter answer"
              />
              {formErrors.answer ? (
                <p className="mt-1 text-xs text-rose-600">
                  {formErrors.answer}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formValues.isActive}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-slate-900"
              />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
                disabled={isFormSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={submitForm} disabled={isFormSubmitting}>
                {isFormSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="Confirm delete"
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this privacy policy?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
