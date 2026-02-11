"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type SalesSnapshotData = {
  totalSales: number;
  rangeLabel: string;
};

type BestSellerData = {
  productName: string | null;
  quantity: number;
};

type TopProduct = {
  id: string;
  name: string;
  quantity: number;
};

type SnapshotState = {
  data: SalesSnapshotData | null;
  loading: boolean;
  error: string;
};

type BestSellerState = {
  data: BestSellerData | null;
  loading: boolean;
  error: string;
};

type TopProductsState = {
  data: TopProduct[];
  loading: boolean;
  error: string;
};

type KpiFrame = {
  key: string;
  title: string;
  endpoint: string;
  fallbackLabel: string;
};

type BestSellerFrame = {
  key: string;
  label: string;
  endpoint: string;
};

const TOP_PRODUCTS_PER_PAGE = 10;

const safeNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} EGP`;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

const formatShortDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const deduceRangeLabel = (payload: any, fallback: string) => {
  if (!payload) {
    return fallback;
  }

  const stringCandidate = [
    payload?.rangeLabel,
    payload?.label,
    payload?.period,
    payload?.periodLabel,
    payload?.monthLabel,
    payload?.month,
  ].find(
    (value) => typeof value === "string" && value.trim().length > 0
  ) as string | undefined;

  if (stringCandidate) {
    return stringCandidate;
  }

  const yearValue = payload?.year ?? payload?.yearLabel;
  if (typeof yearValue === "number" || typeof yearValue === "string") {
    const normalizedYear =
      typeof yearValue === "number" ? yearValue.toString() : yearValue;
    if (payload?.month && typeof payload.month === "string") {
      return `${payload.month} ${normalizedYear}`;
    }
    return normalizedYear;
  }

  const startDate = payload?.startDate ?? payload?.start_date;
  const endDate = payload?.endDate ?? payload?.end_date;

  if (startDate && endDate) {
    const startLabel = formatShortDate(startDate);
    const endLabel = formatShortDate(endDate);
    if (startLabel && endLabel && startLabel !== endLabel) {
      return `${startLabel} — ${endLabel}`;
    }
    return startLabel;
  }

  if (startDate) {
    return formatShortDate(startDate);
  }

  if (endDate) {
    return formatShortDate(endDate);
  }

  return fallback;
};

const createSnapshotState = (frames: KpiFrame[]) =>
  frames.reduce((acc, frame) => {
    acc[frame.key] = { data: null, loading: true, error: "" };
    return acc;
  }, {} as Record<string, SnapshotState>);

const createBestSellerState = (frames: BestSellerFrame[]) =>
  frames.reduce((acc, frame) => {
    acc[frame.key] = { data: null, loading: true, error: "" };
    return acc;
  }, {} as Record<string, BestSellerState>);

const normalizeSnapshotPayload = (
  payload: any,
  fallbackLabel: string
): SalesSnapshotData => ({
  totalSales: safeNumber(
    payload?.totalSales ??
      payload?.total ??
      payload?.amount ??
      payload?.sum ??
      payload?.sales ??
      payload?.value ??
      payload?.grandTotal ??
      payload?.totalAmount
  ),
  rangeLabel: deduceRangeLabel(payload, fallbackLabel),
});

const normalizeBestSellerPayload = (payload: any): BestSellerData => ({
  productName:
    payload?.product?.name ??
    payload?.name ??
    payload?.title ??
    payload?.productName ??
    payload?.product_title ??
    null,
  quantity: safeNumber(
    payload?.quantity ??
      payload?.qty ??
      payload?.soldQuantity ??
      payload?.totalQuantity ??
      payload?.total ??
      payload?.count ??
      payload?.amount ??
      payload?.value
  ),
});

const normalizeTopProductItem = (item: any, index: number): TopProduct => ({
  id: String(item?.id ?? item?.productId ?? item?.sku ?? index),
  name:
    item?.name ??
    item?.productName ??
    item?.title ??
    item?.label ??
    item?.product_title ??
    "Unnamed product",
  quantity: safeNumber(
    item?.quantity ??
      item?.qty ??
      item?.soldQuantity ??
      item?.totalQuantity ??
      item?.total ??
      item?.count ??
      item?.amount ??
      item?.value
  ),
});

export default function SalesDashboardPage() {
  const kpiTimeframes = useMemo<KpiFrame[]>(() => {
    const now = new Date();
    const thisMonthLabel = formatMonthLabel(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const lastMonthLabel = formatMonthLabel(
      new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );
    const thisYearLabel = now.getFullYear().toString();

    return [
      {
        key: "today",
        title: "Today",
        endpoint: "/sales/today",
        fallbackLabel: "Today",
      },
      {
        key: "thisMonth",
        title: "This Month",
        endpoint: "/sales/this-month",
        fallbackLabel: thisMonthLabel,
      },
      {
        key: "lastMonth",
        title: "Last Month",
        endpoint: "/sales/last-month",
        fallbackLabel: lastMonthLabel,
      },
      {
        key: "thisYear",
        title: "This Year",
        endpoint: "/sales/this-year",
        fallbackLabel: thisYearLabel,
      },
    ];
  }, []);

  const bestSellerTimeframes = useMemo<BestSellerFrame[]>(() => {
    return [
      {
        key: "today",
        label: "Today",
        endpoint: "/sales/best-seller/today",
      },
      {
        key: "thisMonth",
        label: "This Month",
        endpoint: "/sales/best-seller/this-month",
      },
      {
        key: "lastMonth",
        label: "Last Month",
        endpoint: "/sales/best-seller/last-month",
      },
      {
        key: "thisYear",
        label: "This Year",
        endpoint: "/sales/best-seller/this-year",
      },
    ];
  }, []);

  const lastYearLabel = useMemo(
    () => (new Date().getFullYear() - 1).toString(),
    []
  );

  const [kpiState, setKpiState] = useState<Record<string, SnapshotState>>(() =>
    createSnapshotState(kpiTimeframes)
  );
  const [bestSellerState, setBestSellerState] = useState<
    Record<string, BestSellerState>
  >(() => createBestSellerState(bestSellerTimeframes));

  const [lastYearState, setLastYearState] = useState<{
    data: SalesSnapshotData | null;
    loading: boolean;
    error: string;
  }>({ data: null, loading: true, error: "" });

  const [topProductsState, setTopProductsState] = useState<TopProductsState>({
    data: [],
    loading: true,
    error: "",
  });

  const [sortKey, setSortKey] = useState<"name" | "quantity">("quantity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    kpiTimeframes.forEach((frame) => {
      (async () => {
        if (!isMounted) {
          return;
        }
        setKpiState((prev) => ({
          ...prev,
          [frame.key]: {
            ...prev[frame.key],
            loading: true,
            error: "",
          },
        }));

        try {
          const response = await api.get(frame.endpoint);
          if (!isMounted) {
            return;
          }
          const payload = response.data?.data ?? response.data;
          const normalized = normalizeSnapshotPayload(
            payload,
            frame.fallbackLabel
          );

          if (!isMounted) {
            return;
          }

          setKpiState((prev) => ({
            ...prev,
            [frame.key]: {
              data: normalized,
              loading: false,
              error: "",
            },
          }));
        } catch (error) {
          if (!isMounted) {
            return;
          }
          setKpiState((prev) => ({
            ...prev,
            [frame.key]: {
              ...prev[frame.key],
              loading: false,
              error: "Unable to load totals.",
            },
          }));
        }
      })();
    });

    return () => {
      isMounted = false;
    };
  }, [kpiTimeframes]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLastYearState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));
      try {
        const response = await api.get("/sales/last-year");
        if (!isMounted) {
          return;
        }
        const payload = response.data?.data ?? response.data;
        const normalized = normalizeSnapshotPayload(payload, lastYearLabel);

        if (!isMounted) {
          return;
        }
        setLastYearState({ data: normalized, loading: false, error: "" });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setLastYearState({
          data: null,
          loading: false,
          error: "Unable to load last year totals.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [lastYearLabel]);

  useEffect(() => {
    let isMounted = true;

    bestSellerTimeframes.forEach((frame) => {
      (async () => {
        if (!isMounted) {
          return;
        }
        setBestSellerState((prev) => ({
          ...prev,
          [frame.key]: {
            ...prev[frame.key],
            loading: true,
            error: "",
          },
        }));

        try {
          const response = await api.get(frame.endpoint);
          if (!isMounted) {
            return;
          }
          const payload = response.data?.data ?? response.data;
          const normalized = normalizeBestSellerPayload(payload);

          if (!isMounted) {
            return;
          }

          setBestSellerState((prev) => ({
            ...prev,
            [frame.key]: {
              data: normalized,
              loading: false,
              error: "",
            },
          }));
        } catch (error) {
          if (!isMounted) {
            return;
          }
          setBestSellerState((prev) => ({
            ...prev,
            [frame.key]: {
              ...prev[frame.key],
              loading: false,
              error: "Unable to load best sellers.",
            },
          }));
        }
      })();
    });

    return () => {
      isMounted = false;
    };
  }, [bestSellerTimeframes]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setTopProductsState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const response = await api.get("/sales/top-products");
        if (!isMounted) {
          return;
        }
        const payload = response.data?.data ?? response.data;
        let rawList: any[] = [];

        if (Array.isArray(payload)) {
          rawList = payload;
        } else if (Array.isArray(payload?.items)) {
          rawList = payload.items;
        } else if (Array.isArray(payload?.products)) {
          rawList = payload.products;
        } else if (Array.isArray(payload?.data)) {
          rawList = payload.data;
        }

        const normalizedList = rawList.map((item, index) =>
          normalizeTopProductItem(item, index)
        );

        if (!isMounted) {
          return;
        }

        setTopProductsState({
          data: normalizedList,
          loading: false,
          error: "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setTopProductsState({
          data: [],
          loading: false,
          error: "Unable to load top products.",
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedProducts = useMemo(() => {
    const list = [...topProductsState.data];
    list.sort((a, b) => {
      if (sortKey === "quantity") {
        return sortDirection === "asc"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      }
      return sortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    return list;
  }, [topProductsState.data, sortDirection, sortKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [topProductsState.data]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / TOP_PRODUCTS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * TOP_PRODUCTS_PER_PAGE,
    currentPage * TOP_PRODUCTS_PER_PAGE
  );

  const maxQuantity = sortedProducts.reduce(
    (max, product) => Math.max(max, product.quantity),
    0
  );

  const handleSort = (key: "name" | "quantity") => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Insights
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Sales Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Live snapshot of revenue, best sellers, and product momentum.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiTimeframes.map((frame) => {
            const state = kpiState[frame.key];
            const total = state?.data?.totalSales ?? 0;
            const rangeLabel = state?.data?.rangeLabel ?? frame.fallbackLabel;

            return (
              <article
                key={frame.key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    {frame.title}
                  </p>
                  <span
                    className="text-xs text-slate-400"
                    title={`Total sales for ${frame.title}`}
                  >
                    ℹ
                  </span>
                </div>

                {state?.loading ? (
                  <div className="mt-4 h-10 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <p className="mt-4 text-3xl font-semibold text-emerald-600">
                    {formatCurrency(total)}
                  </p>
                )}

                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  {rangeLabel}
                </p>

                {state?.error && (
                  <p className="mt-3 text-xs text-rose-600">
                    {state.error}
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Last Year</p>
                <p className="text-xs text-slate-500">
                  Jan 1 — Dec 31 {lastYearLabel}
                </p>
              </div>
              <span
                className="text-xs text-slate-400"
                title="Historical total sales for reference"
              >
                ℹ
              </span>
            </div>
            <div className="mt-4">
              {lastYearState.loading ? (
                <div className="h-12 w-32 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="text-3xl font-semibold text-emerald-600">
                  {formatCurrency(lastYearState.data?.totalSales ?? 0)}
                </p>
              )}
              {lastYearState.error && (
                <p className="mt-2 text-xs text-rose-600">
                  {lastYearState.error}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Best Sellers
              </h2>
              <p className="text-sm text-slate-500">
                Top-performing product for each timeframe
              </p>
            </div>
            <span
              className="text-xs text-slate-400"
              title="Best seller ecommerce performance using fulfillment data"
            >
              ℹ
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bestSellerTimeframes.map((frame) => {
              const state = bestSellerState[frame.key];
              const product = state?.data;
              const hasProduct = Boolean(product?.productName);

              return (
                <article
                  key={frame.key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">
                      {frame.label}
                    </p>
                    <span
                      className="text-xs text-slate-400"
                      title={`Quantity sold for best seller during ${frame.label}`}
                    >
                      ℹ
                    </span>
                  </div>

                  <div className="mt-5 space-y-1">
                    {state?.loading ? (
                      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
                    ) : state?.error ? (
                      <p className="text-xs text-rose-600">{state.error}</p>
                    ) : hasProduct ? (
                      <>
                        <p className="text-lg font-semibold text-slate-900">
                          {product?.productName}
                        </p>
                        <p className="text-sm text-slate-500">
                          Quantity:{" "}
                          <span className="text-emerald-600">
                            {product?.quantity ?? 0}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No best seller yet
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Top Products
              </h2>
              <p className="text-sm text-slate-500">
                Top 10 products sorted by units shipped
              </p>
            </div>
            <span
              className="text-xs text-slate-400"
              title="Hover the headers to change the sort direction"
            >
              ℹ
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {topProductsState.loading ? (
              <div className="space-y-4 p-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No top-selling products yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            type="button"
                            className="flex items-center gap-1 font-semibold"
                            onClick={() => handleSort("name")}
                            title="Sort products alphabetically"
                          >
                            Product
                            {sortKey === "name" && (
                              <span className="text-slate-400">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            type="button"
                            className="flex items-center gap-1 font-semibold"
                            onClick={() => handleSort("quantity")}
                            title="Sort by total quantity sold"
                          >
                            Quantity
                            {sortKey === "quantity" && (
                              <span className="text-slate-400">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-900">
                      {paginatedProducts.map((product) => {
                        const barWidth =
                          maxQuantity > 0
                            ? Math.round((product.quantity / maxQuantity) * 100)
                            : 0;

                        return (
                          <tr key={product.id}>
                            <td className="px-6 py-4">
                              <p className="font-medium">{product.name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-slate-900">
                                {product.quantity}
                              </div>
                              <div
                                className="mt-2 h-2 rounded-full bg-slate-100"
                                aria-hidden="true"
                              >
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}

            {topProductsState.error && (
              <p className="px-6 py-3 text-xs text-rose-600">
                {topProductsState.error}
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
