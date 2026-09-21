"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiChevronUp,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";

import { FaWhatsapp } from "react-icons/fa6";

import { supabase } from "@/lib/supabase";

type PublicVehicleStatus =
  | "available"
  | "reserved"
  | "sold";

type PublicVehicle = {
  id: string;
  name: string;
  brand: string;
  model: string | null;
  year: number | null;
  price: number | null;
  currency: string;
  mileage: number | null;
  transmission: string | null;
  color: string | null;
  status: PublicVehicleStatus;
  description: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
  created_at: string;
};

type SortOption =
  | "featured"
  | "newest"
  | "price-low"
  | "price-high"
  | "year-newest";

type StatusFilter =
  | "all"
  | PublicVehicleStatus;

function formatVehiclePrice(
  price: number | null,
  currency: string,
) {
  if (
    price === null ||
    price === undefined
  ) {
    return "Price on request";
  }

  if (currency === "NGN") {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      },
    ).format(price);
  }

  return `${currency} ${Number(
    price,
  ).toLocaleString()}`;
}

function formatMileage(
  mileage: number | null,
) {
  if (
    mileage === null ||
    mileage === undefined
  ) {
    return null;
  }

  return `${Number(
    mileage,
  ).toLocaleString()} km`;
}

export default function VehiclesInventoryPage() {
  const [vehicles, setVehicles] =
    useState<PublicVehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [brandFilter, setBrandFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [minYear, setMinYear] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [sortBy, setSortBy] =
    useState<SortOption>("featured");

  const [showMobileFilters, setShowMobileFilters] =
    useState(false);

  const [showScrollTop, setShowScrollTop] =
    useState(false);

  const loadVehicles = useCallback(
    async () => {
      setError("");

      const {
        data,
        error: queryError,
      } = await supabase
        .from("vehicles")
        .select(
          `
          id,
          name,
          brand,
          model,
          year,
          price,
          currency,
          mileage,
          transmission,
          color,
          status,
          description,
          cover_image_url,
          is_featured,
          created_at
        `,
        )
        .neq("status", "hidden")
        .order("is_featured", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (queryError) {
        setError(
          "Unable to load vehicle inventory right now.",
        );

        setLoading(false);
        return;
      }

      setVehicles(
        (data as PublicVehicle[]) ||
          [],
      );

      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(
        window.scrollY > 600,
      );
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  const refreshInventory =
    async () => {
      setRefreshing(true);

      await loadVehicles();

      setRefreshing(false);
    };

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        vehicles
          .map((vehicle) =>
            vehicle.brand.trim(),
          )
          .filter(Boolean),
      ),
    ).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [vehicles]);

  const filteredVehicles =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      let result = vehicles.filter(
        (vehicle) => {
          const searchMatches =
            !query ||
            [
              vehicle.name,
              vehicle.brand,
              vehicle.model || "",
              vehicle.year
                ? String(
                    vehicle.year,
                  )
                : "",
              vehicle.color || "",
              vehicle.transmission ||
                "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          const brandMatches =
            brandFilter ===
              "all" ||
            vehicle.brand
              .trim()
              .toLowerCase() ===
              brandFilter
                .toLowerCase();

          const statusMatches =
            statusFilter ===
              "all" ||
            vehicle.status ===
              statusFilter;

          const yearMatches =
            !minYear ||
            (vehicle.year !==
              null &&
              vehicle.year >=
                Number(minYear));

          const priceMatches =
            !maxPrice ||
            (vehicle.price !==
              null &&
              vehicle.price <=
                Number(maxPrice));

          return (
            searchMatches &&
            brandMatches &&
            statusMatches &&
            yearMatches &&
            priceMatches
          );
        },
      );

      result = [...result].sort(
        (a, b) => {
          switch (sortBy) {
            case "newest":
              return (
                new Date(
                  b.created_at,
                ).getTime() -
                new Date(
                  a.created_at,
                ).getTime()
              );

            case "price-low":
              return (
                (a.price ??
                  Number.MAX_SAFE_INTEGER) -
                (b.price ??
                  Number.MAX_SAFE_INTEGER)
              );

            case "price-high":
              return (
                (b.price ?? -1) -
                (a.price ?? -1)
              );

            case "year-newest":
              return (
                (b.year ?? 0) -
                (a.year ?? 0)
              );

            case "featured":
            default:
              if (
                a.is_featured !==
                b.is_featured
              ) {
                return a.is_featured
                  ? -1
                  : 1;
              }

              return (
                new Date(
                  b.created_at,
                ).getTime() -
                new Date(
                  a.created_at,
                ).getTime()
              );
          }
        },
      );

      return result;
    }, [
      vehicles,
      search,
      brandFilter,
      statusFilter,
      minYear,
      maxPrice,
      sortBy,
    ]);

  const activeFilterCount =
    useMemo(() => {
      let count = 0;

      if (brandFilter !== "all")
        count++;

      if (statusFilter !== "all")
        count++;

      if (minYear) count++;

      if (maxPrice) count++;

      return count;
    }, [
      brandFilter,
      statusFilter,
      minYear,
      maxPrice,
    ]);

  const clearFilters = () => {
    setSearch("");
    setBrandFilter("all");
    setStatusFilter("all");
    setMinYear("");
    setMaxPrice("");
    setSortBy("featured");
  };

  const availableCount =
    vehicles.filter(
      (vehicle) =>
        vehicle.status ===
        "available",
    ).length;

  const reservedCount =
    vehicles.filter(
      (vehicle) =>
        vehicle.status ===
        "reserved",
    ).length;

  return (
    <main className="min-h-screen bg-[#050403] text-white">
      {/* TRUST BAR */}

      <div className="border-b border-[#d6a62b]/15 bg-[#090704]">
        <div className="mx-auto flex min-h-[38px] max-w-[1440px] items-center justify-between gap-3 px-4 text-[8px] text-slate-400 sm:px-5 sm:text-[9px] lg:px-8">
          <div className="min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="font-black text-[#d6a62b]">
              Lagos
            </span>
            : Km 6, Ikeja Along
            Expressway
            <span className="mx-3 text-[#66552e]">
              •
            </span>
            <span className="font-black text-[#d6a62b]">
              Onitsha
            </span>
            : No. 2 Anam Street,
            Omagba Phase 2
            <span className="mx-3 text-[#66552e]">
              •
            </span>
            <span className="font-black text-[#d6a62b]">
              Cotonou
            </span>
            : Park Royale Mivvo
          </div>

          <a
            href="https://wa.me/2347032729753?text=Hello%20Blessed%20God%20Is%20Great%20Motor%20Autos%2C%20I%20would%20like%20to%20make%20an%20enquiry."
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 font-black text-white sm:flex"
          >
            <FaWhatsapp />
            WhatsApp
          </a>
        </div>
      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-8">
          <a
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-[13px] font-black italic tracking-[-0.06em] text-[#fff0b0]">
              BGG
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-[0.05em] sm:text-base">
                BLESSED GOD IS GREAT
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.13em] text-[#d6a62b] sm:text-[8px]">
                MOTOR AUTOS INT&apos;L
                VENTURES
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-300 md:flex">
            <a
              href="/"
              className="transition hover:text-[#f2c857]"
            >
              Home
            </a>

            <a
              href="/vehicles"
              className="text-[#f2c857]"
            >
              Vehicles
            </a>

            <a
              href="/#services"
              className="transition hover:text-[#f2c857]"
            >
              Services
            </a>

            <a
              href="/#contact"
              className="transition hover:text-[#f2c857]"
            >
              Contact
            </a>
          </nav>

          <a
            href="/"
            className="hidden items-center gap-2 rounded-full border border-[#d6a62b]/25 px-4 py-2.5 text-xs font-black text-[#d6a62b] transition hover:bg-[#d6a62b]/10 sm:flex"
          >
            <FiArrowLeft />
            Home
          </a>
        </div>
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-[#d6a62b]/10 bg-[#080604]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(214,166,43,0.12),transparent_28%),linear-gradient(to_bottom,#090704,#050403)]" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-5 md:py-20 lg:px-8">
          <p className="text-[9px] font-black uppercase tracking-[0.27em] text-[#d6a62b]">
            Live Vehicle Inventory
          </p>

          <h1 className="mt-4 max-w-[900px] text-4xl font-black tracking-[-0.05em] sm:text-5xl md:text-7xl">
            Find the right car
            <br />
            <span className="bg-gradient-to-r from-[#c99320] via-[#ffd76a] to-[#fff1b4] bg-clip-text text-transparent">
              for your next move.
            </span>
          </h1>

          <p className="mt-5 max-w-[700px] text-sm leading-7 text-slate-400 md:text-base">
            Search and filter our
            current vehicles by brand,
            status, year and price.
            Click any vehicle to view
            complete details and send an
            enquiry.
          </p>

          <div className="mt-8 grid max-w-[650px] grid-cols-3 gap-3">
            <StatCard
              value={vehicles.length}
              label="Listings"
            />

            <StatCard
              value={availableCount}
              label="Available"
            />

            <StatCard
              value={reservedCount}
              label="Reserved"
            />
          </div>
        </div>
      </section>

      {/* INVENTORY */}

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-5 md:py-14 lg:px-8">
        {/* SEARCH + FILTER HEADER */}

        <div className="rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#806c3c]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search Lexus, Camry, BMW, 2025, black..."
                className="gz-input pl-11 pr-11"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-white"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowMobileFilters(
                    (current) =>
                      !current,
                  )
                }
                className="relative flex items-center justify-center gap-2 rounded-full border border-[#d6a62b]/20 px-5 py-3 text-xs font-black text-[#d6a62b] lg:hidden"
              >
                <FiFilter />
                Filters

                {activeFilterCount >
                  0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6a62b] px-1 text-[9px] text-black">
                    {
                      activeFilterCount
                    }
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={
                  refreshInventory
                }
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6a62b]/20 text-[#d6a62b] transition hover:bg-[#d6a62b]/10 disabled:opacity-50"
              >
                <FiRefreshCw
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </div>

          {/* STATUS QUICK FILTERS */}

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {(
              [
                "all",
                "available",
                "reserved",
                "sold",
              ] as StatusFilter[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    item,
                  )
                }
                className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[10px] font-black capitalize transition ${
                  statusFilter === item
                    ? "border-[#d6a62b] bg-[#d6a62b] text-black"
                    : "border-[#d6a62b]/15 bg-black/20 text-slate-400 hover:border-[#d6a62b]/30 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* DESKTOP FILTERS */}

          <div className="mt-5 hidden grid-cols-4 gap-3 border-t border-[#d6a62b]/10 pt-5 lg:grid">
            <FilterField label="Brand">
              <select
                value={brandFilter}
                onChange={(event) =>
                  setBrandFilter(
                    event.target.value,
                  )
                }
                className="gz-input"
              >
                <option value="all">
                  All brands
                </option>

                {brands.map(
                  (brand) => (
                    <option
                      key={brand}
                      value={brand}
                    >
                      {brand}
                    </option>
                  ),
                )}
              </select>
            </FilterField>

            <FilterField label="Minimum Year">
              <input
                type="number"
                min="1950"
                max="2100"
                value={minYear}
                onChange={(event) =>
                  setMinYear(
                    event.target.value,
                  )
                }
                placeholder="e.g. 2020"
                className="gz-input"
              />
            </FilterField>

            <FilterField label="Max Price (NGN)">
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(
                    event.target.value,
                  )
                }
                placeholder="e.g. 50000000"
                className="gz-input"
              />
            </FilterField>

            <FilterField label="Sort By">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target
                      .value as SortOption,
                  )
                }
                className="gz-input"
              >
                <option value="featured">
                  Featured first
                </option>

                <option value="newest">
                  Newest added
                </option>

                <option value="price-low">
                  Price: low to high
                </option>

                <option value="price-high">
                  Price: high to low
                </option>

                <option value="year-newest">
                  Newest year
                </option>
              </select>
            </FilterField>
          </div>

          {/* MOBILE FILTERS */}

          {showMobileFilters && (
            <div className="mt-5 grid gap-4 border-t border-[#d6a62b]/10 pt-5 lg:hidden">
              <FilterField label="Brand">
                <select
                  value={
                    brandFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setBrandFilter(
                      event.target
                        .value,
                    )
                  }
                  className="gz-input"
                >
                  <option value="all">
                    All brands
                  </option>

                  {brands.map(
                    (brand) => (
                      <option
                        key={brand}
                        value={brand}
                      >
                        {brand}
                      </option>
                    ),
                  )}
                </select>
              </FilterField>

              <FilterField label="Minimum Year">
                <input
                  type="number"
                  min="1950"
                  max="2100"
                  value={minYear}
                  onChange={(
                    event,
                  ) =>
                    setMinYear(
                      event.target
                        .value,
                    )
                  }
                  placeholder="e.g. 2020"
                  className="gz-input"
                />
              </FilterField>

              <FilterField label="Max Price (NGN)">
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(
                    event,
                  ) =>
                    setMaxPrice(
                      event.target
                        .value,
                    )
                  }
                  placeholder="e.g. 50000000"
                  className="gz-input"
                />
              </FilterField>

              <FilterField label="Sort By">
                <select
                  value={sortBy}
                  onChange={(
                    event,
                  ) =>
                    setSortBy(
                      event.target
                        .value as SortOption,
                    )
                  }
                  className="gz-input"
                >
                  <option value="featured">
                    Featured first
                  </option>

                  <option value="newest">
                    Newest added
                  </option>

                  <option value="price-low">
                    Price: low to high
                  </option>

                  <option value="price-high">
                    Price: high to low
                  </option>

                  <option value="year-newest">
                    Newest year
                  </option>
                </select>
              </FilterField>
            </div>
          )}
        </div>

        {/* RESULTS HEADER */}

        <div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold text-slate-500">
              Showing{" "}
              <span className="text-[#f2c857]">
                {
                  filteredVehicles.length
                }
              </span>{" "}
              of {vehicles.length} vehicles
            </p>

            {activeFilterCount >
              0 && (
              <p className="mt-1 text-[10px] text-slate-600">
                {
                  activeFilterCount
                }{" "}
                additional filter
                {activeFilterCount ===
                1
                  ? ""
                  : "s"}{" "}
                active
              </p>
            )}
          </div>

          {(activeFilterCount >
            0 ||
            search ||
            statusFilter !==
              "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-xs font-black text-[#d6a62b] transition hover:text-[#f2c857]"
            >
              <FiSliders />
              Clear filters
            </button>
          )}
        </div>

        {/* ERRORS */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="grid gap-5 py-10 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[24px] border border-[#d6a62b]/10 bg-[#0d0b07]"
                >
                  <div className="h-[240px] animate-pulse bg-white/[0.04]" />

                  <div className="space-y-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />

                    <div className="h-6 w-2/3 animate-pulse rounded bg-white/[0.04]" />

                    <div className="h-5 w-32 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </div>
              ),
            )}
          </div>
        ) : filteredVehicles.length ===
          0 ? (
          <div className="mt-8 rounded-[28px] border border-[#d6a62b]/15 bg-[#0d0b07] p-10 text-center sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-3xl">
              🚘
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No matching vehicles
            </h2>

            <p className="mx-auto mt-3 max-w-[520px] text-sm leading-7 text-slate-500">
              Try changing your search,
              brand, price or year
              filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-full bg-[#d6a62b] px-6 py-3 text-sm font-black text-black"
            >
              Show All Vehicles
            </button>
          </div>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map(
              (vehicle) => (
                <a
                  key={vehicle.id}
                  href={`/vehicles/${vehicle.id}`}
                  className="group overflow-hidden rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07] shadow-[0_20px_55px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-[#d6a62b]/35"
                >
                  <div className="relative h-[250px] overflow-hidden bg-black">
                    {vehicle.cover_image_url ? (
                      <img
                        src={
                          vehicle.cover_image_url
                        }
                        alt={
                          vehicle.name
                        }
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        🚘
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent" />

                    <StatusBadge
                      status={
                        vehicle.status
                      }
                    />

                    {vehicle.is_featured && (
                      <span className="absolute right-4 top-4 rounded-full border border-[#d6a62b]/35 bg-black/70 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-[#f2c857] backdrop-blur">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
                      {vehicle.brand}
                    </p>

                    <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">
                      {vehicle.name}
                    </h2>

                    <p className="mt-3 text-lg font-black text-[#f2c857]">
                      {formatVehiclePrice(
                        vehicle.price,
                        vehicle.currency,
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {vehicle.year && (
                        <span>
                          {vehicle.year}
                        </span>
                      )}

                      {vehicle.transmission && (
                        <>
                          <span>•</span>
                          <span>
                            {
                              vehicle.transmission
                            }
                          </span>
                        </>
                      )}

                      {formatMileage(
                        vehicle.mileage,
                      ) && (
                        <>
                          <span>•</span>
                          <span>
                            {formatMileage(
                              vehicle.mileage,
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    {vehicle.color && (
                      <p className="mt-3 text-xs text-slate-600">
                        Colour:{" "}
                        <span className="font-bold text-slate-400">
                          {
                            vehicle.color
                          }
                        </span>
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-[#d6a62b]/10 pt-4">
                      <span className="text-[10px] font-black text-[#d6a62b]">
                        View Vehicle
                      </span>

                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d6a62b]/20 text-[#d6a62b] transition group-hover:bg-[#d6a62b] group-hover:text-black">
                        →
                      </span>
                    </div>
                  </div>
                </a>
              ),
            )}
          </div>
        )}
      </section>

      {/* FOOTER */}

      <footer className="border-t border-[#d6a62b]/15 bg-[#020201]">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-4 py-8 text-xs text-slate-600 sm:px-5 md:flex-row lg:px-8">
          <p>
            © 2026 Blessed God Is Great
            Motor Autos Int&apos;l
            Ventures.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="tel:+2347032729753"
              className="transition hover:text-[#d6a62b]"
            >
              +234 703 272 9753
            </a>

            <a
              href="mailto:godspowernwachukwu935@gmail.com"
              className="transition hover:text-[#d6a62b]"
            >
              Email
            </a>
          </div>
        </div>
      </footer>

      {/* FLOATING ACTIONS */}

      <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {showScrollTop && (
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            aria-label="Go to top"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6a62b]/30 bg-[#0b0906]/95 text-lg text-[#f2c857] shadow-[0_12px_35px_rgba(0,0,0,0.4)] backdrop-blur"
          >
            <FiChevronUp />
          </button>
        )}

        <a
          href="https://wa.me/2347032729753?text=Hello%20Blessed%20God%20Is%20Great%20Motor%20Autos%2C%20I%20would%20like%20to%20make%20an%20enquiry."
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-xs font-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:px-5"
        >
          <FaWhatsapp className="text-lg" />
          <span className="hidden sm:inline">
            Chat on WhatsApp
          </span>
        </a>
      </div>
    </main>
  );
}

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d6a62b]/15 bg-black/25 p-4">
      <p className="text-2xl font-black text-[#f2c857] sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.15em] text-slate-600 sm:text-[9px]">
        {label}
      </p>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.16em] text-[#8f7741]">
        {label}
      </label>

      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: PublicVehicleStatus;
}) {
  const styles = {
    available:
      "bg-green-500 text-black",
    reserved:
      "bg-amber-400 text-black",
    sold:
      "bg-red-500 text-white",
  };

  return (
    <span
      className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}
