"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import Modal from "@/components/ui/Modal";
import { ADMIN_TOKEN_KEY } from "@/lib/auth";

type HomepagePayload = {
  heroImage?: string | null;
  heroTextPrimary?: string | null;
  heroTextSecondary?: string | null;
  showNewCollection?: boolean | null;
};

type HeroStat = {
  id: number;
  value: string;
  text: string;
  order: number;
  isActive: boolean;
};

type WhyShopCard = {
  id: number;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
};

type SocialLink = {
  platform: string;
  url: string | null;
  isActive: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "snapchat", label: "Snapchat" },
] as const;

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const adminFetch = async <T,>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;
  const headers = new Headers(options.headers ?? {});
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  const response = await fetch(path, {
    ...options,
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    throw { response: { data } };
  }
  return data;
};

export default function HomepageControlPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [heroImage, setHeroImage] = useState<string>("");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [heroTextPrimary, setHeroTextPrimary] = useState("");
  const [heroTextSecondary, setHeroTextSecondary] = useState("");

  const [initialState, setInitialState] = useState<HomepagePayload | null>(null);
  const [heroStats, setHeroStats] = useState<HeroStat[]>([]);
  const [heroStatsLoading, setHeroStatsLoading] = useState(true);
  const [heroStatsError, setHeroStatsError] = useState("");
  const [isHeroStatModalOpen, setIsHeroStatModalOpen] = useState(false);
  const [isDeleteHeroStatOpen, setIsDeleteHeroStatOpen] = useState(false);
  const [editingHeroStat, setEditingHeroStat] = useState<HeroStat | null>(null);
  const [heroStatValue, setHeroStatValue] = useState("");
  const [heroStatText, setHeroStatText] = useState("");
  const [heroStatOrder, setHeroStatOrder] = useState("");
  const [heroStatActive, setHeroStatActive] = useState(true);
  const [whyShopCards, setWhyShopCards] = useState<WhyShopCard[]>([]);
  const [whyShopLoading, setWhyShopLoading] = useState(true);
  const [whyShopError, setWhyShopError] = useState("");
  const [isWhyShopModalOpen, setIsWhyShopModalOpen] = useState(false);
  const [isWhyShopDeleteOpen, setIsWhyShopDeleteOpen] = useState(false);
  const [editingWhyShop, setEditingWhyShop] = useState<WhyShopCard | null>(null);
  const [whyShopTitle, setWhyShopTitle] = useState("");
  const [whyShopDescription, setWhyShopDescription] = useState("");
  const [whyShopOrder, setWhyShopOrder] = useState("");
  const [whyShopActive, setWhyShopActive] = useState(true);
  const [whyShopSaving, setWhyShopSaving] = useState<Record<number, boolean>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialError, setSocialError] = useState("");
  const [socialSaving, setSocialSaving] = useState<Record<string, boolean>>({});

  const previewUrl = useMemo(() => {
    if (heroImageFile) {
      return URL.createObjectURL(heroImageFile);
    }
    return heroImage;
  }, [heroImage, heroImageFile]);

  useEffect(() => {
    const loadHomepage = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await adminFetch<ApiResponse<HomepagePayload>>(
          "/api/homepage"
        );
        const payload = response.data ?? {};
        setHeroImage(payload.heroImage ?? "");
        setHeroTextPrimary(payload.heroTextPrimary ?? "");
        setHeroTextSecondary(payload.heroTextSecondary ?? "");
        setShowNewCollection(Boolean(payload.showNewCollection));
        setInitialState(payload);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadHomepage();
  }, []);

  useEffect(() => {
    const loadHeroStats = async () => {
      setHeroStatsLoading(true);
      setHeroStatsError("");
      try {
        const response = await adminFetch<ApiResponse<HeroStat[]>>(
          "/api/admin/homepage/hero-stats"
        );
        const normalized = (response.data ?? [])
          .map((stat) => ({ ...stat, id: Number(stat.id) }))
          .filter((stat) => Number.isFinite(stat.id));
        setHeroStats(normalized);
      } catch (err) {
        setHeroStatsError(getErrorMessage(err));
      } finally {
        setHeroStatsLoading(false);
      }
    };

    loadHeroStats();
  }, []);

  useEffect(() => {
    const loadWhyShop = async () => {
      setWhyShopLoading(true);
      setWhyShopError("");
      try {
        const response = await adminFetch<ApiResponse<WhyShopCard[]>>(
          "/api/admin/homepage/why-shop"
        );
        const normalized = (response.data ?? [])
          .map((card) => ({ ...card, id: Number(card.id) }))
          .filter((card) => Number.isFinite(card.id));
        setWhyShopCards(normalized);
      } catch (err) {
        setWhyShopError(getErrorMessage(err));
      } finally {
        setWhyShopLoading(false);
      }
    };

    loadWhyShop();
  }, []);

  useEffect(() => {
    const loadSocialLinks = async () => {
      setSocialLoading(true);
      setSocialError("");
      try {
        const response = await api.get<ApiResponse<SocialLink[]>>(
          "/admin/social-links"
        );
        const data = response.data?.data ?? [];
        const normalized = SOCIAL_PLATFORMS.map((platform) => {
          const match = data.find(
            (item) => item.platform?.toLowerCase() === platform.key
          );
          return {
            platform: platform.key,
            url: match?.url ?? "",
            isActive: Boolean(match?.isActive),
          };
        });
        setSocialLinks(normalized);
      } catch (err) {
        setSocialError(getErrorMessage(err));
        setSocialLinks(
          SOCIAL_PLATFORMS.map((platform) => ({
            platform: platform.key,
            url: "",
            isActive: false,
          }))
        );
      } finally {
        setSocialLoading(false);
      }
    };

    loadSocialLinks();
  }, []);

  const resetHeroStatForm = () => {
    setHeroStatValue("");
    setHeroStatText("");
    setHeroStatOrder("");
    setHeroStatActive(true);
    setEditingHeroStat(null);
  };

  const resetWhyShopForm = () => {
    setWhyShopTitle("");
    setWhyShopDescription("");
    setWhyShopOrder("");
    setWhyShopActive(true);
    setEditingWhyShop(null);
  };

  const openAddHeroStat = () => {
    resetHeroStatForm();
    setIsHeroStatModalOpen(true);
  };

  const openEditHeroStat = (stat: HeroStat) => {
    setEditingHeroStat(stat);
    setHeroStatValue(stat.value);
    setHeroStatText(stat.text);
    setHeroStatOrder(String(stat.order));
    setHeroStatActive(stat.isActive);
    setIsHeroStatModalOpen(true);
  };

  const openDeleteHeroStat = (stat: HeroStat) => {
    setEditingHeroStat(stat);
    setIsDeleteHeroStatOpen(true);
  };

  const openAddWhyShop = () => {
    resetWhyShopForm();
    setIsWhyShopModalOpen(true);
  };

  const openEditWhyShop = (card: WhyShopCard) => {
    setEditingWhyShop(card);
    setWhyShopTitle(card.title);
    setWhyShopDescription(card.description);
    setWhyShopOrder(String(card.order));
    setWhyShopActive(card.isActive);
    setIsWhyShopModalOpen(true);
  };

  const openDeleteWhyShop = (card: WhyShopCard) => {
    setEditingWhyShop(card);
    setIsWhyShopDeleteOpen(true);
  };

  const saveHeroStat = async () => {
    setIsSubmitting(true);
    setHeroStatsError("");
    try {
      if (!heroStatValue.trim() || !heroStatText.trim()) {
        setHeroStatsError("Value and text are required.");
        return;
      }
      const payload: Partial<HeroStat> & {
        value?: string;
        text?: string;
        order?: number;
        isActive?: boolean;
      } = {};

      if (editingHeroStat) {
        const editId = Number(editingHeroStat.id);
        if (!Number.isFinite(editId) || editId <= 0) {
          setHeroStatsError("Invalid hero data id.");
          return;
        }
        if (heroStatValue.trim() !== editingHeroStat.value) {
          payload.value = heroStatValue.trim();
        }
        if (heroStatText.trim() !== editingHeroStat.text) {
          payload.text = heroStatText.trim();
        }
        if (
          heroStatOrder.trim() !== "" &&
          Number(heroStatOrder) !== editingHeroStat.order
        ) {
          const orderValue = Number(heroStatOrder);
          if (Number.isNaN(orderValue)) {
            setHeroStatsError("Order must be a number.");
            return;
          }
          payload.order = orderValue;
        }
        if (heroStatActive !== editingHeroStat.isActive) {
          payload.isActive = heroStatActive;
        }
        if (Object.keys(payload).length === 0) {
          setHeroStatsError("No changes to save.");
          return;
        }
        await api.put(`/admin/homepage/hero-stats/${editId}`, payload);
      } else {
        payload.value = heroStatValue.trim();
        payload.text = heroStatText.trim();
        payload.isActive = heroStatActive;
        if (heroStatOrder.trim() !== "") {
          const orderValue = Number(heroStatOrder);
          if (Number.isNaN(orderValue)) {
            setHeroStatsError("Order must be a number.");
            return;
          }
          payload.order = orderValue;
        }
        await adminFetch("/api/admin/homepage/hero-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsHeroStatModalOpen(false);
      resetHeroStatForm();
      const response = await adminFetch<ApiResponse<HeroStat[]>>(
        "/api/admin/homepage/hero-stats"
      );
      const normalized = (response.data ?? [])
        .map((stat) => ({ ...stat, id: Number(stat.id) }))
        .filter((stat) => Number.isFinite(stat.id));
      setHeroStats(normalized);
    } catch (err) {
      setHeroStatsError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteHeroStat = async () => {
    if (!editingHeroStat) {
      return;
    }
    setIsSubmitting(true);
    setHeroStatsError("");
    try {
      const deleteId = Number(editingHeroStat.id);
      if (!Number.isFinite(deleteId) || deleteId <= 0) {
        setHeroStatsError("Invalid hero data id.");
        return;
      }
      await api.delete(`/admin/homepage/hero-stats/${deleteId}`);
      setIsDeleteHeroStatOpen(false);
      setEditingHeroStat(null);
      const response = await adminFetch<ApiResponse<HeroStat[]>>(
        "/api/admin/homepage/hero-stats"
      );
      const normalized = (response.data ?? [])
        .map((stat) => ({ ...stat, id: Number(stat.id) }))
        .filter((stat) => Number.isFinite(stat.id));
      setHeroStats(normalized);
    } catch (err) {
      setHeroStatsError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveWhyShop = async () => {
    setIsSubmitting(true);
    setWhyShopError("");
    try {
      if (!whyShopTitle.trim() || !whyShopDescription.trim()) {
        setWhyShopError("Title and description are required.");
        return;
      }
      const payload: Partial<WhyShopCard> & {
        title?: string;
        description?: string;
        order?: number;
        isActive?: boolean;
      } = {};

      if (editingWhyShop) {
        const editId = Number(editingWhyShop.id);
        if (!Number.isFinite(editId) || editId <= 0) {
          setWhyShopError("Invalid card id.");
          return;
        }
        if (whyShopTitle.trim() !== editingWhyShop.title) {
          payload.title = whyShopTitle.trim();
        }
        if (whyShopDescription.trim() !== editingWhyShop.description) {
          payload.description = whyShopDescription.trim();
        }
        if (
          whyShopOrder.trim() !== "" &&
          Number(whyShopOrder) !== editingWhyShop.order
        ) {
          const orderValue = Number(whyShopOrder);
          if (Number.isNaN(orderValue)) {
            setWhyShopError("Order must be a number.");
            return;
          }
          payload.order = orderValue;
        }
        if (whyShopActive !== editingWhyShop.isActive) {
          payload.isActive = whyShopActive;
        }
        if (Object.keys(payload).length === 0) {
          setWhyShopError("No changes to save.");
          return;
        }
        await api.put(`/admin/homepage/why-shop/${editId}`, payload);
      } else {
        payload.title = whyShopTitle.trim();
        payload.description = whyShopDescription.trim();
        payload.isActive = whyShopActive;
        if (whyShopOrder.trim() !== "") {
          const orderValue = Number(whyShopOrder);
          if (Number.isNaN(orderValue)) {
            setWhyShopError("Order must be a number.");
            return;
          }
          payload.order = orderValue;
        }
        await adminFetch("/api/admin/homepage/why-shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsWhyShopModalOpen(false);
      resetWhyShopForm();
      const response = await adminFetch<ApiResponse<WhyShopCard[]>>(
        "/api/admin/homepage/why-shop"
      );
      const normalized = (response.data ?? [])
        .map((card) => ({ ...card, id: Number(card.id) }))
        .filter((card) => Number.isFinite(card.id));
      setWhyShopCards(normalized);
    } catch (err) {
      setWhyShopError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteWhyShop = async () => {
    if (!editingWhyShop) {
      return;
    }
    setIsSubmitting(true);
    setWhyShopError("");
    try {
      const deleteId = Number(editingWhyShop.id);
      if (!Number.isFinite(deleteId) || deleteId <= 0) {
        setWhyShopError("Invalid card id.");
        return;
      }
      await api.delete(`/admin/homepage/why-shop/${deleteId}`);
      setIsWhyShopDeleteOpen(false);
      setEditingWhyShop(null);
      const response = await adminFetch<ApiResponse<WhyShopCard[]>>(
        "/api/admin/homepage/why-shop"
      );
      const normalized = (response.data ?? [])
        .map((card) => ({ ...card, id: Number(card.id) }))
        .filter((card) => Number.isFinite(card.id));
      setWhyShopCards(normalized);
    } catch (err) {
      setWhyShopError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWhyShopOrder = async (card: WhyShopCard, value: string) => {
    const orderValue = Number(value);
    if (Number.isNaN(orderValue)) {
      return;
    }
    const cardId = Number(card.id);
    if (!Number.isFinite(cardId) || cardId <= 0) {
      setWhyShopError("Invalid card id.");
      return;
    }
    setWhyShopSaving((prev) => ({ ...prev, [card.id]: true }));
    try {
      await adminFetch(`/api/admin/homepage/why-shop/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, order: orderValue }),
      });
      setWhyShopCards((prev) =>
        prev.map((item) =>
          item.id === card.id ? { ...item, order: orderValue } : item
        )
      );
    } catch (err) {
      setWhyShopError(getErrorMessage(err));
    } finally {
      setWhyShopSaving((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  const updateSocialLink = (
    platform: string,
    field: "url" | "isActive",
    value: string | boolean
  ) => {
    setSocialLinks((prev) =>
      prev.map((link) =>
        link.platform === platform ? { ...link, [field]: value } : link
      )
    );
  };

  const saveSocialLink = async (platform: string) => {
    const link = socialLinks.find((item) => item.platform === platform);
    if (!link) {
      return;
    }
    const normalizedPlatform = platform.trim().toLowerCase();
    setSocialSaving((prev) => ({ ...prev, [platform]: true }));
    setSocialError("");
    try {
      await api.put(`/admin/social-links/${normalizedPlatform}`, {
        url: link.url ?? "",
        isActive: Boolean(link.isActive),
      });
    } catch (err) {
      setSocialError(getErrorMessage(err));
    } finally {
      setSocialSaving((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M13.5 9H16l-.5 3h-2v9h-3v-9H8V9h2.5V7.5C10.5 5.6 11.4 4 14 4h2v3h-2c-.7 0-1 .3-1 1V9z"
            />
          </svg>
        );
      case "instagram":
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm6-1.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
            />
          </svg>
        );
      case "snapchat":
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M12 3c2.4 0 4.4 1.9 4.4 4.2v4.4c0 .5.4.9.9 1.1l1.7.6a1 1 0 0 1 0 1.9l-1.7.6c-.6.2-1.1.7-1.3 1.3-.4 1.2-1.6 2-3 2h-1.9c-1.4 0-2.6-.8-3-2-.2-.6-.7-1.1-1.3-1.3l-1.7-.6a1 1 0 0 1 0-1.9l1.7-.6c.5-.2.9-.6.9-1.1V7.2C7.6 4.9 9.6 3 12 3z"
            />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M3 4l7.5 8.8L3 20h3.3l5.2-5.9L16.7 20H21l-7.9-9.2L21 4h-3.3l-5 5.7L7.3 4H3z"
            />
          </svg>
        );
    }
  };

  const handleReset = () => {
    if (!initialState) {
      return;
    }
    setHeroImage(initialState.heroImage ?? "");
    setHeroTextPrimary(initialState.heroTextPrimary ?? "");
    setHeroTextSecondary(initialState.heroTextSecondary ?? "");
    setShowNewCollection(Boolean(initialState.showNewCollection));
    setHeroImageFile(null);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (!heroTextPrimary.trim() || !heroTextSecondary.trim()) {
        setError("Hero text fields are required.");
        return;
      }

      const formData = new FormData();
      if (heroImageFile) {
        formData.append("heroImage", heroImageFile);
      }

      if (initialState?.heroTextPrimary !== heroTextPrimary.trim()) {
        formData.append("heroTextPrimary", heroTextPrimary.trim());
      }
      if (initialState?.heroTextSecondary !== heroTextSecondary.trim()) {
        formData.append("heroTextSecondary", heroTextSecondary.trim());
      }
      if (Boolean(initialState?.showNewCollection) !== showNewCollection) {
        formData.append("showNewCollection", String(showNewCollection));
      }

      if (!heroImageFile && formData.entries().next().done) {
        setError("No changes to save.");
        return;
      }

      await api.put("/admin/homepage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Homepage updated successfully.");
      setHeroImageFile(null);
      setInitialState({
        heroImage,
        heroTextPrimary: heroTextPrimary.trim(),
        heroTextSecondary: heroTextSecondary.trim(),
        showNewCollection,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (heroImageFile && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [heroImageFile, previewUrl]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            HomePage Control
          </h1>
          <p className="text-sm text-slate-500">
            Manage the hero section content shown on the website.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-40 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Hero Section Control
                </h2>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Hero preview"
                      className="h-48 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Hero Banner Image
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) =>
                      setHeroImageFile(event.target.files?.[0] ?? null)
                    }
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                  New Collection Icon
                  <input
                    type="checkbox"
                    checked={showNewCollection}
                    onChange={(event) => setShowNewCollection(event.target.checked)}
                    className="h-5 w-5 accent-slate-900"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Hero Text 1 (Main Header)
                  </label>
                  <textarea
                    value={heroTextPrimary}
                    onChange={(event) => setHeroTextPrimary(event.target.value)}
                    className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Hero Text 2 (Sub Header)
                  </label>
                  <textarea
                    value={heroTextSecondary}
                    onChange={(event) => setHeroTextSecondary(event.target.value)}
                    className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {success}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Hero Data Control
              </h2>
              <p className="text-sm text-slate-500">
                Manage hero statistics displayed on the homepage.
              </p>
            </div>
            <Button onClick={openAddHeroStat}>Add Hero Data</Button>
          </div>

          {heroStatsLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : heroStatsError ? (
            <p className="mt-4 text-sm text-rose-600">{heroStatsError}</p>
          ) : heroStats.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No hero data items found.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Value</th>
                    <th className="py-2 pr-4 font-medium">Text</th>
                    <th className="py-2 pr-4 font-medium">Order</th>
                    <th className="py-2 pr-4 font-medium">Active</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {heroStats
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((stat) => (
                      <tr key={stat.id} className="text-slate-700">
                        <td className="py-3 pr-4">{stat.value}</td>
                        <td className="py-3 pr-4">{stat.text}</td>
                        <td className="py-3 pr-4">{stat.order}</td>
                        <td className="py-3 pr-4">
                          {stat.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEditHeroStat(stat)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => openDeleteHeroStat(stat)}
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

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Social Media Links
              </h2>
              <p className="text-sm text-slate-500">
                Control the social icons shown in the website footer.
              </p>
            </div>
          </div>

          {socialLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {socialLinks.map((link) => {
                const label =
                  SOCIAL_PLATFORMS.find((item) => item.key === link.platform)
                    ?.label ?? link.platform;
                return (
                  <div
                    key={link.platform}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                        {renderSocialIcon(link.platform)}
                      </span>
                      {label}
                    </div>
                    <input
                      type="url"
                      value={link.url ?? ""}
                      onChange={(event) =>
                        updateSocialLink(
                          link.platform,
                          "url",
                          event.target.value
                        )
                      }
                      placeholder="https://"
                      disabled={!link.isActive}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={link.isActive}
                        onChange={(event) =>
                          updateSocialLink(
                            link.platform,
                            "isActive",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 accent-slate-900"
                      />
                      Active
                    </label>
                    <Button
                      variant="secondary"
                      onClick={() => saveSocialLink(link.platform)}
                      disabled={socialSaving[link.platform]}
                    >
                      {socialSaving[link.platform] ? "Saving..." : "Save"}
                    </Button>
                  </div>
                );
              })}
              {socialError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {socialError}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Why Shop With Us
              </h2>
              <p className="text-sm text-slate-500">
                Manage the cards shown in the “Why Shop With Us” section.
              </p>
            </div>
            <Button onClick={openAddWhyShop}>Add Card</Button>
          </div>

          {whyShopLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : whyShopError ? (
            <p className="mt-4 text-sm text-rose-600">{whyShopError}</p>
          ) : whyShopCards.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No cards found.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Description</th>
                    <th className="py-2 pr-4 font-medium">Order</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {whyShopCards
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((card) => (
                      <tr key={card.id} className="text-slate-700">
                        <td className="py-3 pr-4">{card.title}</td>
                        <td className="py-3 pr-4">{card.description}</td>
                        <td className="py-3 pr-4">
                          <input
                            type="number"
                            defaultValue={card.order}
                            onBlur={(event) =>
                              updateWhyShopOrder(card, event.target.value)
                            }
                            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                          {whyShopSaving[card.id] ? (
                            <span className="ml-2 text-xs text-slate-500">
                              Saving...
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          {card.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEditWhyShop(card)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => openDeleteWhyShop(card)}
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
      </div>

      <Modal
        title={editingHeroStat ? "Edit Hero Data" : "Add Hero Data"}
        isOpen={isHeroStatModalOpen}
        onClose={() => setIsHeroStatModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Value</label>
            <Input
              value={heroStatValue}
              onChange={(event) => setHeroStatValue(event.target.value)}
              placeholder="Enter value"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Text</label>
            <Input
              value={heroStatText}
              onChange={(event) => setHeroStatText(event.target.value)}
              placeholder="Enter text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Order</label>
            <Input
              type="number"
              value={heroStatOrder}
              onChange={(event) => setHeroStatOrder(event.target.value)}
              placeholder="Order"
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Active
            <input
              type="checkbox"
              checked={heroStatActive}
              onChange={(event) => setHeroStatActive(event.target.checked)}
              className="h-5 w-5 accent-slate-900"
            />
          </label>
          {heroStatsError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {heroStatsError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsHeroStatModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={saveHeroStat} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={editingWhyShop ? "Edit Card" : "Add Card"}
        isOpen={isWhyShopModalOpen}
        onClose={() => setIsWhyShopModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input
              value={whyShopTitle}
              onChange={(event) => setWhyShopTitle(event.target.value)}
              placeholder="Enter title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={whyShopDescription}
              onChange={(event) => setWhyShopDescription(event.target.value)}
              className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Order</label>
            <Input
              type="number"
              value={whyShopOrder}
              onChange={(event) => setWhyShopOrder(event.target.value)}
              placeholder="Order"
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Active
            <input
              type="checkbox"
              checked={whyShopActive}
              onChange={(event) => setWhyShopActive(event.target.checked)}
              className="h-5 w-5 accent-slate-900"
            />
          </label>
          {whyShopError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {whyShopError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsWhyShopModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={saveWhyShop} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete Card"
        isOpen={isWhyShopDeleteOpen}
        onClose={() => setIsWhyShopDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this card?
          </p>
          {whyShopError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {whyShopError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsWhyShopDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteWhyShop}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete Hero Data"
        isOpen={isDeleteHeroStatOpen}
        onClose={() => setIsDeleteHeroStatOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this hero data item?
          </p>
          {heroStatsError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {heroStatsError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteHeroStatOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteHeroStat}
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
