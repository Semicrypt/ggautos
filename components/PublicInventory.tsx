"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";

import {
  FiArrowUpRight,
  FiRefreshCw,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

type VehicleStatus =
  | "available"
  | "reserved"
  | "sold";

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

  description: string | null;

  cover_image_url: string | null;

  is_featured: boolean;

  created_at: string;
};

function formatPrice(
  price: number | null,
  currency: string
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
      }
    ).format(price);
  }

  return `${currency} ${Number(
    price
  ).toLocaleString()}`;
}

function formatMileage(
  mileage: number | null
) {
  if (
    mileage === null ||
    mileage === undefined
  ) {
    return null;
  }

  return `${Number(
    mileage
  ).toLocaleString()} km`;
}

export default function PublicInventory() {
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadVehicles =
    useCallback(async () => {
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
        `
        )
        .neq(
          "status",
          "hidden"
        )
        .order(
          "is_featured",
          {
            ascending: false,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (queryError) {
        console.error(
          queryError
        );

        setError(
          "Unable to load vehicle inventory right now."
        );

        setLoading(false);
        return;
      }

      setVehicles(
        (data as Vehicle[]) ||
          []
      );

      setLoading(false);
    }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  return (
    <section
      id="vehicles"
      className="relative overflow-hidden bg-[#050403] py-20 text-white md:py-32"
    >
      {/* =====================================================
          BLACK + GOLD BACKGROUND
      ====================================================== */}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,177,0,0.11), transparent 28%), radial-gradient(circle at 15% 20%, rgba(255,215,106,0.06), transparent 22%), radial-gradient(circle at 85% 24%, rgba(255,174,0,0.07), transparent 22%), linear-gradient(to bottom, #090805, #030303 58%, #080604)",
        }}
      />

      <div className="pointer-events-none absolute left-[-150px] top-[5%] h-[420px] w-[420px] rounded-full bg-[#ffb000]/10 blur-[130px]" />

      <div className="pointer-events-none absolute right-[-100px] top-[20%] h-[400px] w-[400px] rounded-full bg-[#ffd76a]/10 blur-[130px]" />

      <div className="pointer-events-none absolute left-1/2 top-[45%] h-px w-[85%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d6a62b]/20 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,193,55,0.55) 1px, transparent 1px)",
          backgroundSize:
            "95px 95px",
        }}
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 xl:px-12">
        {/* HEADER */}

        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-[#e5b53c]" />

              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f2c857] sm:text-[10px]">
                Live Inventory
              </span>
            </div>

            <h2 className="max-w-[750px] text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
              Built for the road.
              <br />

              <span className="bg-gradient-to-r from-[#d6a62b] via-[#ffe08a] to-[#c69119] bg-clip-text text-transparent">
                Selected for you.
              </span>
            </h2>
          </div>

          <div className="max-w-[430px]">
            <p className="text-sm leading-7 text-slate-400">
              Explore the current Great
              Zuby vehicle collection.
              Availability and vehicle
              information are updated
              directly by our inventory
              team.
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadVehicles();
              }}
              className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#c8a550] transition hover:text-[#f2c857]"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh Inventory
            </button>
          </div>
        </div>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08]/70"
                >
                  <div className="h-[280px] animate-pulse bg-white/[0.04] sm:h-[320px]" />

                  <div className="p-6">
                    <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />

                    <div className="mt-4 h-7 w-[65%] animate-pulse rounded bg-white/[0.06]" />

                    <div className="mt-5 h-5 w-[45%] animate-pulse rounded bg-white/[0.05]" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {!loading && error && (
          <div className="mt-14 rounded-[24px] border border-red-500/20 bg-red-500/[0.05] px-6 py-10 text-center">
            <p className="text-sm text-red-300">
              {error}
            </p>

            <button
              onClick={() => {
                setLoading(true);
                loadVehicles();
              }}
              className="mt-5 rounded-full border border-[#d6a62b]/25 px-6 py-3 text-xs font-black text-[#e2ba51]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =====================================================
            EMPTY INVENTORY
        ====================================================== */}

        {!loading &&
          !error &&
          vehicles.length === 0 && (
            <div className="mt-14 rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08]/65 px-6 py-16 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-2xl">
                🚘
              </div>

              <h3 className="mt-5 text-xl font-black">
                New inventory coming
                soon.
              </h3>

              <p className="mx-auto mt-3 max-w-[500px] text-sm leading-7 text-slate-500">
                Our vehicle collection
                is currently being
                updated. Please check
                back soon.
              </p>
            </div>
          )}

        {/* =====================================================
            VEHICLES
        ====================================================== */}

        {!loading &&
          !error &&
          vehicles.length > 0 && (
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map(
                (vehicle) => (
                  <article
                    key={
                      vehicle.id
                    }
                    className="group relative overflow-hidden rounded-[28px] border border-[#d6a62b]/20 bg-[#0c0b08]/80 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                  >
                    {/* IMAGE */}

                    <div className="relative h-[280px] overflow-hidden bg-black sm:h-[320px] lg:h-[330px]">
                      {vehicle.cover_image_url ? (
                        <img
                          src={
                            vehicle.cover_image_url
                          }
                          alt={
                            vehicle.name
                          }
                          className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
                            vehicle.status ===
                            "sold"
                              ? "opacity-55 grayscale-[20%]"
                              : ""
                          }`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          🚘
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#050403] via-transparent to-black/15" />

                      {/* FEATURED */}

                      {vehicle.is_featured && (
                        <span className="absolute left-5 top-5 rounded-full border border-[#f2c857]/25 bg-[#d6a62b]/90 px-4 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-black shadow-[0_8px_30px_rgba(214,166,43,0.2)]">
                          Featured
                        </span>
                      )}

                      {/* STATUS */}

                      <div className="absolute right-5 top-5">
                        <PublicStatusBadge
                          status={
                            vehicle.status
                          }
                        />
                      </div>

                      {/* SOLD OVERLAY */}

                      {vehicle.status ===
                        "sold" && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="-rotate-6 rounded-xl border-2 border-red-400/80 bg-black/70 px-7 py-3 text-xl font-black uppercase tracking-[0.25em] text-red-300 backdrop-blur-sm">
                            Sold
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}

                    <div className="p-5 sm:p-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d9ad41]">
                        {
                          vehicle.brand
                        }
                      </p>

                      <div className="mt-2 flex items-start justify-between gap-5">
                        <div>
                          <h3 className="text-xl font-black text-white sm:text-2xl">
                            {
                              vehicle.name
                            }
                          </h3>

                          {vehicle.model &&
                            vehicle.model.toLowerCase() !==
                              vehicle.name.toLowerCase() && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  vehicle.model
                                }
                              </p>
                            )}
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d6a62b]/25 bg-[#d6a62b]/10 text-[#f0c65c] transition group-hover:bg-[#d6a62b] group-hover:text-black">
                          <FiArrowUpRight />
                        </div>
                      </div>

                      {/* PRICE */}

                      <p className="mt-5 text-xl font-black text-[#f2c857] sm:text-2xl">
                        {formatPrice(
                          vehicle.price,
                          vehicle.currency
                        )}
                      </p>

                      {/* DETAILS */}

                      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#d6a62b]/15 pt-5 text-xs text-slate-400">
                        {vehicle.year && (
                          <span>
                            {
                              vehicle.year
                            }
                          </span>
                        )}

                        {vehicle.transmission && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#d6a62b]" />

                            <span>
                              {
                                vehicle.transmission
                              }
                            </span>
                          </>
                        )}

                        {vehicle.color && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#d6a62b]" />

                            <span>
                              {
                                vehicle.color
                              }
                            </span>
                          </>
                        )}

                        {formatMileage(
                          vehicle.mileage
                        ) && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#d6a62b]" />

                            <span>
                              {formatMileage(
                                vehicle.mileage
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {/* DESCRIPTION */}

                      {vehicle.description && (
                        <p className="mt-5 line-clamp-3 text-sm leading-7 text-slate-500">
                          {
                            vehicle.description
                          }
                        </p>
                      )}

                      {/* AVAILABILITY MESSAGE */}

                      <div
                        className={`mt-6 rounded-xl border px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.16em] ${
                          vehicle.status ===
                          "available"
                            ? "border-green-500/20 bg-green-500/[0.05] text-green-300"
                            : vehicle.status ===
                                "reserved"
                              ? "border-amber-400/20 bg-amber-400/[0.05] text-amber-300"
                              : "border-red-500/20 bg-red-500/[0.05] text-red-300"
                        }`}
                      >
                        {vehicle.status ===
                        "available"
                          ? "Available Now"
                          : vehicle.status ===
                              "reserved"
                            ? "Currently Reserved"
                            : "Vehicle Sold"}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}

        {!loading &&
          vehicles.length >
            0 && (
            <p className="mt-10 text-center text-[10px] uppercase tracking-[0.2em] text-[#6f603d]">
              Inventory updated by
              Blessed God Is Great Motor Autos Int'l Ventures
              Logistics Ltd.
            </p>
          )}
      </div>
    </section>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function PublicStatusBadge({
  status,
}: {
  status: VehicleStatus;
}) {
  if (
    status === "available"
  ) {
    return (
      <span className="rounded-full border border-green-400/25 bg-green-500/90 px-3 py-2 text-[8px] font-black uppercase tracking-[0.15em] text-black shadow-lg">
        Available
      </span>
    );
  }

  if (
    status === "reserved"
  ) {
    return (
      <span className="rounded-full border border-amber-300/30 bg-amber-400/90 px-3 py-2 text-[8px] font-black uppercase tracking-[0.15em] text-black shadow-lg">
        Reserved
      </span>
    );
  }

  return (
    <span className="rounded-full border border-red-400/30 bg-red-500/90 px-3 py-2 text-[8px] font-black uppercase tracking-[0.15em] text-white shadow-lg">
      Sold
    </span>
  );
}