"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiInbox,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import { FaWhatsapp } from "react-icons/fa6";

import { supabase } from "@/lib/supabase";

type VehicleStatus =
  | "available"
  | "reserved"
  | "sold"
  | "hidden";

type Vehicle = {
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
  status: VehicleStatus;
  cover_image_url: string | null;
  is_featured: boolean;
  created_at: string;
};

type EnquiryStatus =
  | "new"
  | "contacted"
  | "closed";

type VehicleEnquiry = {
  id: string;
  vehicle_id: string | null;
  vehicle_name: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: EnquiryStatus;
  created_at: string;
};

type DashboardTab =
  | "inventory"
  | "enquiries";

type InventoryFilter =
  | "all"
  | VehicleStatus;

type EnquiryFilter =
  | "all"
  | EnquiryStatus;

const inventoryFilters: {
  value: InventoryFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "hidden", label: "Hidden" },
];

const enquiryFilters: {
  value: EnquiryFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [email, setEmail] =
    useState("");

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [enquiries, setEnquiries] =
    useState<VehicleEnquiry[]>([]);

  const [activeTab, setActiveTab] =
    useState<DashboardTab>("inventory");

  const [inventoryError, setInventoryError] =
    useState("");

  const [enquiryError, setEnquiryError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [vehicleActionId, setVehicleActionId] =
    useState<string | null>(null);

  const [enquiryActionId, setEnquiryActionId] =
    useState<string | null>(null);

  const [inventorySearch, setInventorySearch] =
    useState("");

  const [inventoryFilter, setInventoryFilter] =
    useState<InventoryFilter>("all");

  const [enquirySearch, setEnquirySearch] =
    useState("");

  const [enquiryFilter, setEnquiryFilter] =
    useState<EnquiryFilter>("all");

  /* =========================================================
     LOAD VEHICLES
  ========================================================= */

  const loadVehicles = useCallback(
    async () => {
      setInventoryError("");

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
          cover_image_url,
          is_featured,
          created_at
        `,
        )
        .order("is_featured", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (queryError) {
        setInventoryError(
          queryError.message,
        );
        return;
      }

      setVehicles(
        (data as Vehicle[]) || [],
      );
    },
    [],
  );

  /* =========================================================
     LOAD ENQUIRIES
  ========================================================= */

  const loadEnquiries = useCallback(
    async () => {
      setEnquiryError("");

      const {
        data,
        error: queryError,
      } = await supabase
        .from("vehicle_enquiries")
        .select(
          `
          id,
          vehicle_id,
          vehicle_name,
          customer_name,
          phone,
          email,
          message,
          status,
          created_at
        `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (queryError) {
        setEnquiryError(
          queryError.message,
        );
        return;
      }

      setEnquiries(
        (data as VehicleEnquiry[]) ||
          [],
      );
    },
    [],
  );

  /* =========================================================
     INITIALIZE ADMIN
  ========================================================= */

  useEffect(() => {
    const initialize =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          router.replace(
            "/admin/login",
          );
          return;
        }

        const {
          data: isAdmin,
          error: adminError,
        } =
          await supabase.rpc(
            "is_admin",
          );

        if (
          adminError ||
          !isAdmin
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/admin/login",
          );

          return;
        }

        setEmail(
          user.email || "",
        );

        await Promise.all([
          loadVehicles(),
          loadEnquiries(),
        ]);

        setLoading(false);
      };

    initialize();
  }, [
    loadEnquiries,
    loadVehicles,
    router,
  ]);

  /* =========================================================
     REFRESH
  ========================================================= */

  const refreshDashboard =
    async () => {
      setRefreshing(true);

      await Promise.all([
        loadVehicles(),
        loadEnquiries(),
      ]);

      setRefreshing(false);
    };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = async () => {
    await supabase.auth.signOut();

    router.replace(
      "/admin/login",
    );

    router.refresh();
  };

  /* =========================================================
     STATS
  ========================================================= */

  const vehicleStats =
    useMemo(() => {
      return {
        total: vehicles.length,

        available:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "available",
          ).length,

        reserved:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "reserved",
          ).length,

        sold:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "sold",
          ).length,

        hidden:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              "hidden",
          ).length,
      };
    }, [vehicles]);

  const enquiryStats =
    useMemo(() => {
      return {
        total: enquiries.length,

        new:
          enquiries.filter(
            (enquiry) =>
              enquiry.status ===
              "new",
          ).length,

        contacted:
          enquiries.filter(
            (enquiry) =>
              enquiry.status ===
              "contacted",
          ).length,

        closed:
          enquiries.filter(
            (enquiry) =>
              enquiry.status ===
              "closed",
          ).length,
      };
    }, [enquiries]);

  /* =========================================================
     FILTERED RESULTS
  ========================================================= */

  const filteredVehicles =
    useMemo(() => {
      const query =
        inventorySearch
          .trim()
          .toLowerCase();

      return vehicles.filter(
        (vehicle) => {
          const statusMatches =
            inventoryFilter ===
              "all" ||
            vehicle.status ===
              inventoryFilter;

          if (!statusMatches) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
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
        },
      );
    }, [
      vehicles,
      inventorySearch,
      inventoryFilter,
    ]);

  const filteredEnquiries =
    useMemo(() => {
      const query =
        enquirySearch
          .trim()
          .toLowerCase();

      return enquiries.filter(
        (enquiry) => {
          const statusMatches =
            enquiryFilter ===
              "all" ||
            enquiry.status ===
              enquiryFilter;

          if (!statusMatches) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            enquiry.customer_name,
            enquiry.vehicle_name,
            enquiry.phone || "",
            enquiry.email || "",
            enquiry.message || "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        },
      );
    }, [
      enquiries,
      enquirySearch,
      enquiryFilter,
    ]);

  /* =========================================================
     VEHICLE ACTIONS
  ========================================================= */

  const updateVehicleStatus =
    async (
      vehicleId: string,
      nextStatus: VehicleStatus,
    ) => {
      setVehicleActionId(
        vehicleId,
      );

      setInventoryError("");

      const {
        error: updateError,
      } = await supabase
        .from("vehicles")
        .update({
          status: nextStatus,
        })
        .eq("id", vehicleId);

      if (updateError) {
        setInventoryError(
          updateError.message,
        );

        setVehicleActionId(
          null,
        );

        return;
      }

      setVehicles(
        (current) =>
          current.map(
            (vehicle) =>
              vehicle.id ===
              vehicleId
                ? {
                    ...vehicle,
                    status:
                      nextStatus,
                  }
                : vehicle,
          ),
      );

      setVehicleActionId(
        null,
      );
    };

  const toggleFeatured =
    async (
      vehicle: Vehicle,
    ) => {
      setVehicleActionId(
        vehicle.id,
      );

      setInventoryError("");

      const nextFeatured =
        !vehicle.is_featured;

      const {
        error: updateError,
      } = await supabase
        .from("vehicles")
        .update({
          is_featured:
            nextFeatured,
        })
        .eq("id", vehicle.id);

      if (updateError) {
        setInventoryError(
          updateError.message,
        );

        setVehicleActionId(
          null,
        );

        return;
      }

      setVehicles(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              vehicle.id
                ? {
                    ...item,
                    is_featured:
                      nextFeatured,
                  }
                : item,
          ),
      );

      setVehicleActionId(
        null,
      );
    };

  /* =========================================================
     ENQUIRY ACTIONS
  ========================================================= */

  const updateEnquiryStatus =
    async (
      enquiryId: string,
      nextStatus: EnquiryStatus,
    ) => {
      setEnquiryActionId(
        enquiryId,
      );

      setEnquiryError("");

      const {
        error: updateError,
      } = await supabase
        .from("vehicle_enquiries")
        .update({
          status: nextStatus,
        })
        .eq("id", enquiryId);

      if (updateError) {
        setEnquiryError(
          updateError.message,
        );

        setEnquiryActionId(
          null,
        );

        return;
      }

      setEnquiries(
        (current) =>
          current.map(
            (enquiry) =>
              enquiry.id ===
              enquiryId
                ? {
                    ...enquiry,
                    status:
                      nextStatus,
                  }
                : enquiry,
          ),
      );

      setEnquiryActionId(
        null,
      );
    };

  const deleteEnquiry =
    async (
      enquiry: VehicleEnquiry,
    ) => {
      const confirmed =
        window.confirm(
          `Delete the enquiry from ${enquiry.customer_name}?`,
        );

      if (!confirmed) {
        return;
      }

      setEnquiryActionId(
        enquiry.id,
      );

      setEnquiryError("");

      const {
        error: deleteError,
      } = await supabase
        .from("vehicle_enquiries")
        .delete()
        .eq("id", enquiry.id);

      if (deleteError) {
        setEnquiryError(
          deleteError.message,
        );

        setEnquiryActionId(
          null,
        );

        return;
      }

      setEnquiries(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              enquiry.id,
          ),
      );

      setEnquiryActionId(
        null,
      );
    };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatPrice = (
    value: number | null,
    currency: string,
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "Price on request";
    }

    if (
      currency === "NGN"
    ) {
      return new Intl.NumberFormat(
        "en-NG",
        {
          style: "currency",
          currency: "NGN",
          maximumFractionDigits: 0,
        },
      ).format(value);
    }

    return `${currency} ${Number(
      value,
    ).toLocaleString()}`;
  };

  const formatEnquiryDate = (
    value: string,
  ) => {
    const date = new Date(value);

    return date.toLocaleString(
      "en-NG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  };

  const normalizeWhatsApp =
    (value: string) =>
      value.replace(
        /[^0-9]/g,
        "",
      );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d6a62b]/30 border-t-[#f2c857]" />

          <p className="text-sm text-[#8f7741]">
            Loading dealership dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050403] text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-[13px] font-black italic tracking-[-0.06em] text-[#fff0b0]">
              BGG
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-[0.05em] sm:text-base">
                BLESSED GOD IS GREAT
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.18em] text-[#d6a62b] sm:text-[8px]">
                ADMIN PORTAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={
                refreshDashboard
              }
              disabled={
                refreshing
              }
              aria-label="Refresh dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6a62b]/20 text-[#d6a62b] transition hover:bg-[#d6a62b]/10 disabled:opacity-50"
            >
              <FiRefreshCw
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <button
              onClick={logout}
              className="rounded-full border border-[#d6a62b]/25 px-4 py-2 text-xs font-bold text-[#e7c764] transition hover:bg-[#d6a62b]/10 sm:px-5 sm:py-2.5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}

      <section className="mx-auto max-w-[1400px] px-4 py-7 sm:px-5 md:px-8 md:py-10">
        {/* INTRO */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d6a62b]">
              Dealership Management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 break-all text-xs text-slate-500 sm:break-normal sm:text-sm">
              Signed in as {email}
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                "/admin/vehicles/new",
              )
            }
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-sm font-black text-[#080603] shadow-[0_12px_35px_rgba(214,166,43,0.12)]"
          >
            <FiPlus />
            Add Vehicle
          </button>
        </div>

        {/* QUICK OVERVIEW */}

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            title="Available Vehicles"
            value={vehicleStats.available}
            note={`${vehicleStats.total} total listings`}
            icon="🚘"
          />

          <OverviewCard
            title="Reserved"
            value={vehicleStats.reserved}
            note={`${vehicleStats.sold} sold`}
            icon="🔑"
          />

          <OverviewCard
            title="New Enquiries"
            value={enquiryStats.new}
            note={`${enquiryStats.total} total enquiries`}
            icon="💬"
            alert={
              enquiryStats.new > 0
            }
          />

          <OverviewCard
            title="Hidden Listings"
            value={vehicleStats.hidden}
            note="Not visible to customers"
            icon="👁"
          />
        </div>

        {/* TABS */}

        <div className="mt-8 flex w-full gap-2 overflow-x-auto rounded-2xl border border-[#d6a62b]/15 bg-[#0a0906] p-2 sm:w-fit">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "inventory",
              )
            }
            className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition sm:px-5 ${
              activeTab ===
              "inventory"
                ? "bg-[#d6a62b] text-black"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            🚘
            Inventory
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "enquiries",
              )
            }
            className={`relative flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition sm:px-5 ${
              activeTab ===
              "enquiries"
                ? "bg-[#d6a62b] text-black"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <FiInbox />
            Enquiries

            {enquiryStats.new >
              0 && (
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-black ${
                  activeTab ===
                  "enquiries"
                    ? "bg-black text-[#f2c857]"
                    : "bg-[#d6a62b] text-black"
                }`}
              >
                {
                  enquiryStats.new
                }
              </span>
            )}
          </button>
        </div>

        {/* INVENTORY TAB */}

        {activeTab ===
          "inventory" && (
          <>
            <div className="mt-7 rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#806c3c]" />

                  <input
                    value={
                      inventorySearch
                    }
                    onChange={(event) =>
                      setInventorySearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search vehicle, brand, model, year, colour..."
                    className="gz-input pl-11 pr-11"
                  />

                  {inventorySearch && (
                    <button
                      type="button"
                      onClick={() =>
                        setInventorySearch(
                          "",
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-white"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                  {inventoryFilters.map(
                    (item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setInventoryFilter(
                            item.value,
                          )
                        }
                        className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[10px] font-black transition ${
                          inventoryFilter ===
                          item.value
                            ? "border-[#d6a62b] bg-[#d6a62b] text-black"
                            : "border-[#d6a62b]/15 bg-black/20 text-slate-400 hover:border-[#d6a62b]/30 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <p className="mt-4 text-[10px] text-slate-600">
                Showing{" "}
                <span className="font-black text-[#d6a62b]">
                  {
                    filteredVehicles.length
                  }
                </span>{" "}
                of {vehicles.length} vehicles
              </p>
            </div>

            {inventoryError && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {inventoryError}
              </div>
            )}

            {vehicles.length ===
            0 ? (
              <EmptyState
                title="No vehicles yet"
                text="Add your first vehicle to begin building the live dealership inventory."
                buttonText="Add First Vehicle"
                onClick={() =>
                  router.push(
                    "/admin/vehicles/new",
                  )
                }
              />
            ) : filteredVehicles.length ===
              0 ? (
              <EmptyState
                title="No matching vehicles"
                text="Try a different search or clear the current filter."
                buttonText="Clear Filters"
                onClick={() => {
                  setInventorySearch(
                    "",
                  );
                  setInventoryFilter(
                    "all",
                  );
                }}
              />
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map(
                  (vehicle) => {
                    const busy =
                      vehicleActionId ===
                      vehicle.id;

                    return (
                      <article
                        key={
                          vehicle.id
                        }
                        className="overflow-hidden rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07] shadow-[0_20px_55px_rgba(0,0,0,0.2)]"
                      >
                        <div className="relative h-[220px] bg-black">
                          {vehicle.cover_image_url ? (
                            <img
                              src={
                                vehicle.cover_image_url
                              }
                              alt={
                                vehicle.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl">
                              🚘
                            </div>
                          )}

                          <VehicleStatusBadge
                            status={
                              vehicle.status
                            }
                          />

                          {vehicle.is_featured && (
                            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-[#d6a62b]/35 bg-black/70 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-[#f2c857] backdrop-blur">
                              <FiStar />
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="p-5">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
                            {
                              vehicle.brand
                            }
                          </p>

                          <h2 className="mt-2 line-clamp-1 text-xl font-black">
                            {
                              vehicle.name
                            }
                          </h2>

                          <p className="mt-3 text-lg font-black text-[#f2c857]">
                            {formatPrice(
                              vehicle.price,
                              vehicle.currency,
                            )}
                          </p>

                          <div className="mt-4 flex min-h-[20px] flex-wrap items-center gap-2 text-xs text-slate-500">
                            {vehicle.year && (
                              <span>
                                {
                                  vehicle.year
                                }
                              </span>
                            )}

                            {vehicle.transmission && (
                              <>
                                <span>
                                  •
                                </span>

                                <span>
                                  {
                                    vehicle.transmission
                                  }
                                </span>
                              </>
                            )}

                            {vehicle.color && (
                              <>
                                <span>
                                  •
                                </span>

                                <span>
                                  {
                                    vehicle.color
                                  }
                                </span>
                              </>
                            )}
                          </div>

                          <div className="mt-5 rounded-2xl border border-white/5 bg-black/25 p-3">
                            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-600">
                              Quick Status
                            </p>

                            <div className="mt-2 grid grid-cols-4 gap-1.5">
                              {(
                                [
                                  "available",
                                  "reserved",
                                  "sold",
                                  "hidden",
                                ] as VehicleStatus[]
                              ).map(
                                (
                                  nextStatus,
                                ) => (
                                  <button
                                    key={
                                      nextStatus
                                    }
                                    type="button"
                                    disabled={
                                      busy
                                    }
                                    onClick={() =>
                                      updateVehicleStatus(
                                        vehicle.id,
                                        nextStatus,
                                      )
                                    }
                                    title={`Mark ${nextStatus}`}
                                    className={`rounded-lg border px-1 py-2 text-[8px] font-black capitalize transition disabled:opacity-40 ${
                                      vehicle.status ===
                                      nextStatus
                                        ? "border-[#d6a62b] bg-[#d6a62b] text-black"
                                        : "border-white/5 bg-white/[0.025] text-slate-500 hover:border-[#d6a62b]/20 hover:text-white"
                                    }`}
                                  >
                                    {
                                      nextStatus
                                    }
                                  </button>
                                ),
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              toggleFeatured(
                                vehicle,
                              )
                            }
                            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[10px] font-black transition disabled:opacity-40 ${
                              vehicle.is_featured
                                ? "border-[#d6a62b]/40 bg-[#d6a62b]/10 text-[#f2c857]"
                                : "border-white/5 bg-black/20 text-slate-500 hover:border-[#d6a62b]/20 hover:text-white"
                            }`}
                          >
                            <FiStar />
                            {vehicle.is_featured
                              ? "Remove Featured"
                              : "Feature Vehicle"}
                          </button>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <a
                              href={`/vehicles/${vehicle.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 rounded-full border border-white/5 px-4 py-3 text-[10px] font-black text-slate-400 transition hover:border-[#d6a62b]/20 hover:text-white"
                            >
                              <FiExternalLink />
                              View
                            </a>

                            <button
                              onClick={() =>
                                router.push(
                                  `/admin/vehicles/${vehicle.id}`,
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-full border border-[#d6a62b]/20 px-4 py-3 text-[10px] font-black text-[#e4bd58] transition hover:bg-[#d6a62b]/10"
                            >
                              <FiEdit3 />
                              Manage
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </>
        )}

        {/* ENQUIRIES TAB */}

        {activeTab ===
          "enquiries" && (
          <>
            <div className="mt-7 rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#806c3c]" />

                  <input
                    value={
                      enquirySearch
                    }
                    onChange={(event) =>
                      setEnquirySearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search customer, vehicle, phone or email..."
                    className="gz-input pl-11 pr-11"
                  />

                  {enquirySearch && (
                    <button
                      type="button"
                      onClick={() =>
                        setEnquirySearch(
                          "",
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-white"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                  {enquiryFilters.map(
                    (item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setEnquiryFilter(
                            item.value,
                          )
                        }
                        className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[10px] font-black transition ${
                          enquiryFilter ===
                          item.value
                            ? "border-[#d6a62b] bg-[#d6a62b] text-black"
                            : "border-[#d6a62b]/15 bg-black/20 text-slate-400 hover:border-[#d6a62b]/30 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <p className="mt-4 text-[10px] text-slate-600">
                Showing{" "}
                <span className="font-black text-[#d6a62b]">
                  {
                    filteredEnquiries.length
                  }
                </span>{" "}
                of {enquiries.length} enquiries
              </p>
            </div>

            {enquiryError && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {enquiryError}
              </div>
            )}

            {enquiries.length ===
            0 ? (
              <EmptyState
                title="No enquiries yet"
                text="Customer enquiries submitted from vehicle pages will appear here."
              />
            ) : filteredEnquiries.length ===
              0 ? (
              <EmptyState
                title="No matching enquiries"
                text="Try another search or clear the enquiry filter."
                buttonText="Clear Filters"
                onClick={() => {
                  setEnquirySearch(
                    "",
                  );
                  setEnquiryFilter(
                    "all",
                  );
                }}
              />
            ) : (
              <div className="mt-6 space-y-4">
                {filteredEnquiries.map(
                  (enquiry) => {
                    const busy =
                      enquiryActionId ===
                      enquiry.id;

                    return (
                      <article
                        key={
                          enquiry.id
                        }
                        className="overflow-hidden rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07]"
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <EnquiryStatusBadge
                                  status={
                                    enquiry.status
                                  }
                                />

                                <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                  <FiClock />
                                  {formatEnquiryDate(
                                    enquiry.created_at,
                                  )}
                                </span>
                              </div>

                              <h2 className="mt-4 text-xl font-black sm:text-2xl">
                                {
                                  enquiry.customer_name
                                }
                              </h2>

                              <p className="mt-1 text-sm font-bold text-[#d6a62b]">
                                Enquiry about{" "}
                                {
                                  enquiry.vehicle_name
                                }
                              </p>
                            </div>

                            {enquiry.vehicle_id && (
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`/vehicles/${enquiry.vehicle_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 rounded-full border border-[#d6a62b]/20 px-4 py-2.5 text-[10px] font-black text-[#d9b755] transition hover:bg-[#d6a62b]/10"
                                >
                                  <FiExternalLink />
                                  View Vehicle
                                </a>

                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/admin/vehicles/${enquiry.vehicle_id}`,
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-full border border-[#d6a62b]/20 px-4 py-2.5 text-[10px] font-black text-[#d9b755] transition hover:bg-[#d6a62b]/10"
                                >
                                  <FiEdit3 />
                                  Manage
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {enquiry.phone && (
                              <a
                                href={`tel:${enquiry.phone}`}
                                className="flex items-center gap-3 rounded-2xl border border-[#d6a62b]/10 bg-black/25 p-4 transition hover:border-[#d6a62b]/25"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d6a62b]/10 text-[#f2c857]">
                                  <FiPhone />
                                </span>

                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-600">
                                    Call
                                  </p>

                                  <p className="mt-1 truncate text-sm font-bold text-white">
                                    {
                                      enquiry.phone
                                    }
                                  </p>
                                </div>
                              </a>
                            )}

                            {enquiry.phone && (
                              <a
                                href={`https://wa.me/${normalizeWhatsApp(
                                  enquiry.phone,
                                )}?text=${encodeURIComponent(
                                  `Hello ${enquiry.customer_name}, this is Blessed God Is Great Motor Autos regarding your enquiry about ${enquiry.vehicle_name}.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 rounded-2xl border border-green-500/15 bg-green-500/[0.05] p-4 transition hover:border-green-500/30"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-300">
                                  <FaWhatsapp />
                                </span>

                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-green-500/60">
                                    WhatsApp
                                  </p>

                                  <p className="mt-1 text-sm font-bold text-green-300">
                                    Message Customer
                                  </p>
                                </div>
                              </a>
                            )}

                            {enquiry.email && (
                              <a
                                href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
                                  `Blessed God Is Great - ${enquiry.vehicle_name} enquiry`,
                                )}`}
                                className="flex items-center gap-3 rounded-2xl border border-[#d6a62b]/10 bg-black/25 p-4 transition hover:border-[#d6a62b]/25"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d6a62b]/10 text-[#f2c857]">
                                  <FiMail />
                                </span>

                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-600">
                                    Email
                                  </p>

                                  <p className="mt-1 truncate text-sm font-bold text-white">
                                    {
                                      enquiry.email
                                    }
                                  </p>
                                </div>
                              </a>
                            )}
                          </div>

                          {enquiry.message && (
                            <div className="mt-4 rounded-2xl border border-[#d6a62b]/10 bg-black/25 p-4 sm:p-5">
                              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-600">
                                Customer Message
                              </p>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                                {
                                  enquiry.message
                                }
                              </p>
                            </div>
                          )}

                          <div className="mt-5 flex flex-col gap-2 border-t border-[#d6a62b]/10 pt-5 sm:flex-row sm:flex-wrap">
                            {enquiry.status !==
                              "contacted" && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  updateEnquiryStatus(
                                    enquiry.id,
                                    "contacted",
                                  )
                                }
                                className="flex items-center justify-center gap-2 rounded-full border border-green-500/20 bg-green-500/[0.06] px-5 py-3 text-xs font-black text-green-300 transition hover:bg-green-500/10 disabled:opacity-50"
                              >
                                <FiCheckCircle />
                                Mark Contacted
                              </button>
                            )}

                            {enquiry.status !==
                              "closed" && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  updateEnquiryStatus(
                                    enquiry.id,
                                    "closed",
                                  )
                                }
                                className="flex items-center justify-center gap-2 rounded-full border border-slate-500/20 bg-slate-500/[0.06] px-5 py-3 text-xs font-black text-slate-300 transition hover:bg-slate-500/10 disabled:opacity-50"
                              >
                                <FiXCircle />
                                Close Enquiry
                              </button>
                            )}

                            {enquiry.status ===
                              "closed" && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  updateEnquiryStatus(
                                    enquiry.id,
                                    "new",
                                  )
                                }
                                className="flex items-center justify-center gap-2 rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/5 px-5 py-3 text-xs font-black text-[#d9b755] transition hover:bg-[#d6a62b]/10 disabled:opacity-50"
                              >
                                Reopen
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                deleteEnquiry(
                                  enquiry,
                                )
                              }
                              className="flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.05] px-5 py-3 text-xs font-black text-red-300 transition hover:bg-red-500/10 disabled:opacity-50 sm:ml-auto"
                            >
                              <FiTrash2 />
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function OverviewCard({
  title,
  value,
  note,
  icon,
  alert = false,
}: {
  title: string;
  value: number;
  note: string;
  icon: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-5 ${
        alert
          ? "border-[#d6a62b]/35 bg-[#d6a62b]/[0.07]"
          : "border-[#d6a62b]/15 bg-[#0d0b07]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black text-[#f2c857]">
            {value}
          </p>
        </div>

        <span className="text-2xl">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-[10px] text-slate-600">
        {note}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  text,
  buttonText,
  onClick,
}: {
  title: string;
  text: string;
  buttonText?: string;
  onClick?: () => void;
}) {
  return (
    <div className="mt-6 rounded-[28px] border border-[#d6a62b]/15 bg-[#0d0b07]/70 p-8 sm:p-12">
      <div className="mx-auto max-w-[500px] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-2xl">
          🚘
        </div>

        <h2 className="mt-5 text-xl font-black">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-500">
          {text}
        </p>

        {buttonText &&
          onClick && (
            <button
              type="button"
              onClick={onClick}
              className="mt-6 rounded-full bg-[#d6a62b] px-6 py-3 text-sm font-black text-black"
            >
              {buttonText}
            </button>
          )}
      </div>
    </div>
  );
}

function VehicleStatusBadge({
  status,
}: {
  status: VehicleStatus;
}) {
  const styles = {
    available:
      "bg-green-500/90 text-black",

    reserved:
      "bg-amber-400 text-black",

    sold:
      "bg-red-500 text-white",

    hidden:
      "bg-slate-700 text-white",
  };

  return (
    <span
      className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function EnquiryStatusBadge({
  status,
}: {
  status: EnquiryStatus;
}) {
  const styles = {
    new:
      "border-[#d6a62b]/30 bg-[#d6a62b]/10 text-[#f2c857]",

    contacted:
      "border-green-500/25 bg-green-500/10 text-green-300",

    closed:
      "border-slate-500/25 bg-slate-500/10 text-slate-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}
