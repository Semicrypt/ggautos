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
  FiInbox,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

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

  const [enquiryActionId, setEnquiryActionId] =
    useState<string | null>(null);

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
          created_at
        `,
        )
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
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-lg font-black italic text-[#fff0b0]">
              BGG
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-[0.07em] sm:text-base">
                BLESSED GOD IS GREAT
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.2em] text-[#d6a62b] sm:text-[8px]">
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

      {/* =====================================================
          PAGE
      ====================================================== */}

      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-5 md:px-8 md:py-14">
        {/* INTRO */}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d6a62b]">
              Dealership Management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Blessed God Is Great Dashboard
            </h1>

            <p className="mt-3 break-all text-sm text-slate-500 sm:break-normal">
              Signed in as {email}
            </p>
          </div>

          {activeTab ===
            "inventory" && (
            <button
              onClick={() =>
                router.push(
                  "/admin/vehicles/new",
                )
              }
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-sm font-black text-[#080603]"
            >
              <FiPlus />
              Add New Vehicle
            </button>
          )}
        </div>

        {/* =====================================================
            TABS
        ====================================================== */}

        <div className="mt-9 flex w-full gap-2 overflow-x-auto rounded-2xl border border-[#d6a62b]/15 bg-[#0a0906] p-2 sm:w-fit">
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

        {/* =====================================================
            INVENTORY TAB
        ====================================================== */}

        {activeTab ===
          "inventory" && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[
                [
                  vehicleStats.total,
                  "Total Vehicles",
                ],

                [
                  vehicleStats.available,
                  "Available",
                ],

                [
                  vehicleStats.reserved,
                  "Reserved",
                ],

                [
                  vehicleStats.sold,
                  "Sold",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <div
                    key={String(
                      label,
                    )}
                    className="rounded-[20px] border border-[#d6a62b]/15 bg-[#0d0b07] p-4 sm:rounded-[22px] sm:p-6"
                  >
                    <p className="text-2xl font-black text-[#f2c857] sm:text-3xl">
                      {value}
                    </p>

                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                      {label}
                    </p>
                  </div>
                ),
              )}
            </div>

            {inventoryError && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {inventoryError}
              </div>
            )}

            {vehicles.length ===
            0 ? (
              <div className="mt-8 rounded-[28px] border border-[#d6a62b]/15 bg-[#0d0b07]/70 p-8 sm:p-12">
                <div className="mx-auto max-w-[500px] text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-2xl">
                    🚘
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    No vehicles yet
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Add the first
                    Blessed God Is Great
                    vehicle to begin
                    building the live
                    dealership
                    inventory.
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        "/admin/vehicles/new",
                      )
                    }
                    className="mt-6 rounded-full bg-[#d6a62b] px-6 py-3 text-sm font-black text-black"
                  >
                    Add First Vehicle
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {vehicles.map(
                  (vehicle) => (
                    <article
                      key={
                        vehicle.id
                      }
                      className="overflow-hidden rounded-[24px] border border-[#d6a62b]/15 bg-[#0d0b07]"
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
                      </div>

                      <div className="p-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
                          {
                            vehicle.brand
                          }
                        </p>

                        <h2 className="mt-2 text-xl font-black">
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

                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
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

                        <button
                          onClick={() =>
                            router.push(
                              `/admin/vehicles/${vehicle.id}`,
                            )
                          }
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#d6a62b]/20 px-5 py-3 text-sm font-bold text-[#e4bd58] transition hover:bg-[#d6a62b]/10"
                        >
                          <FiEdit3 />
                          Manage Vehicle
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </>
        )}

        {/* =====================================================
            ENQUIRIES TAB
        ====================================================== */}

        {activeTab ===
          "enquiries" && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[
                [
                  enquiryStats.total,
                  "Total Enquiries",
                ],

                [
                  enquiryStats.new,
                  "New",
                ],

                [
                  enquiryStats.contacted,
                  "Contacted",
                ],

                [
                  enquiryStats.closed,
                  "Closed",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <div
                    key={String(
                      label,
                    )}
                    className="rounded-[20px] border border-[#d6a62b]/15 bg-[#0d0b07] p-4 sm:rounded-[22px] sm:p-6"
                  >
                    <p className="text-2xl font-black text-[#f2c857] sm:text-3xl">
                      {value}
                    </p>

                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                      {label}
                    </p>
                  </div>
                ),
              )}
            </div>

            {enquiryError && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {enquiryError}
              </div>
            )}

            {enquiries.length ===
            0 ? (
              <div className="mt-8 rounded-[28px] border border-[#d6a62b]/15 bg-[#0d0b07]/70 p-8 sm:p-12">
                <div className="mx-auto max-w-[500px] text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-2xl text-[#f2c857]">
                    <FiInbox />
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    No enquiries yet
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Customer
                    enquiries submitted
                    from vehicle pages
                    will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {enquiries.map(
                  (enquiry) => {
                    const busy =
                      enquiryActionId ===
                      enquiry.id;

                    return (
                      <article
                        key={
                          enquiry.id
                        }
                        className={`overflow-hidden rounded-[24px] border bg-[#0d0b07] ${
                          enquiry.status ===
                          "new"
                            ? "border-[#d6a62b]/40 shadow-[0_0_35px_rgba(214,166,43,0.06)]"
                            : "border-[#d6a62b]/15"
                        }`}
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                            <div className="min-w-0">
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

                          <div className="mt-6 grid gap-3 md:grid-cols-2">
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
                                    Phone
                                  </p>

                                  <p className="mt-1 truncate text-sm font-bold text-white">
                                    {
                                      enquiry.phone
                                    }
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

/* =========================================================
   VEHICLE STATUS
========================================================= */

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

/* =========================================================
   ENQUIRY STATUS
========================================================= */

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
