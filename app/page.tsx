"use client";

/* eslint-disable @next/next/no-img-element */

import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiMail,
  FiMapPin,
  FiMenu,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiTruck,
  FiX,
} from "react-icons/fi";

import {
  PiCarProfileFill,
  PiEngineFill,
  PiRoadHorizonFill,
} from "react-icons/pi";

import {
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/* =========================================================
   LIVE INVENTORY TYPES + HELPERS
========================================================= */

type PublicVehicleStatus = "available" | "reserved" | "sold";

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

function formatVehiclePrice(price: number | null, currency: string) {
  if (price === null || price === undefined) {
    return "Price on request";
  }

  if (currency === "NGN") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return `${currency} ${Number(price).toLocaleString()}`;
}

function formatVehicleMileage(mileage: number | null) {
  if (mileage === null || mileage === undefined) {
    return null;
  }

  return `${Number(mileage).toLocaleString()} km`;
}


/* =========================================================
   SERVICES
========================================================= */

const services = [
  {
    icon: PiCarProfileFill,
    number: "01",
    title: "Vehicle Sales",
    description:
      "A carefully selected collection of premium vehicles for customers who value reliability, comfort and class.",
  },
  {
    icon: FiTruck,
    number: "02",
    title: "Auto Logistics",
    description:
      "Professional vehicle transportation designed to move automobiles efficiently from origin to destination.",
  },
  {
    icon: FiPackage,
    number: "03",
    title: "Vehicle Sourcing",
    description:
      "Tell us the vehicle specification you need and our team can help source suitable options.",
  },
  {
    icon: PiRoadHorizonFill,
    number: "04",
    title: "Vehicle Delivery",
    description:
      "A streamlined delivery process that keeps vehicle movement simple, organized and dependable.",
  },
];

/* =========================================================
   BENEFITS
========================================================= */

const benefits = [
  "Carefully selected vehicles",
  "Professional logistics support",
  "Transparent customer experience",
  "Reliable vehicle sourcing",
];

const premiumShowcase = [
  {
    brand: "LEXUS",
    label: "RX",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lexus_RX_300_%28front%29_24_September_2024.jpg?width=1600",
    credit: "メイド理世",
    source:
      "https://commons.wikimedia.org/wiki/File:Lexus_RX_300_(front)_24_September_2024.jpg",
  },
  {
    brand: "MERCEDES-BENZ",
    label: "G-Class",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/2024_Mercedes-Benz_G-Class_G450d.jpg?width=1600",
    credit: "Chanokchon",
    source:
      "https://commons.wikimedia.org/wiki/File:2024_Mercedes-Benz_G-Class_G450d.jpg",
  },
  {
    brand: "RANGE ROVER",
    label: "Evoque",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Range_Rover_Evoque_%28L551%29_IMG_9465_%28cropped%29.jpg?width=1600",
    credit: "Alexander-93",
    source:
      "https://commons.wikimedia.org/wiki/File:Range_Rover_Evoque_(L551)_IMG_9465_(cropped).jpg",
  },
  {
    brand: "BMW",
    label: "7 Series",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/BMW_7-Series_%28G70%29_750e_1X7A2461.jpg?width=1600",
    credit: "Alexander-93",
    source:
      "https://commons.wikimedia.org/wiki/File:BMW_7-Series_(G70)_750e_1X7A2461.jpg",
  },
  {
    brand: "TOYOTA",
    label: "Camry",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/2025_Toyota_Camry.jpg?width=1600",
    credit: "Clock38030",
    source:
      "https://commons.wikimedia.org/wiki/File:2025_Toyota_Camry.jpg",
  },
  {
    brand: "TOYOTA",
    label: "Corolla",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Toyota_Corolla_2025%2B_For_Guangzhou_Auto_Show_2025.jpg?width=1600",
    credit: "Nissangeniss",
    source:
      "https://commons.wikimedia.org/wiki/File:Toyota_Corolla_2025%2B_For_Guangzhou_Auto_Show_2025.jpg",
  },
];

/* =========================================================
   BRANDS
========================================================= */

const brandLogos = [
  {
    name: "TOYOTA",
    short: "T",
    logo:
      "https://cdn.jsdelivr.net/npm/car-brand-logos@1.0.0/toyota-logo.svg",
  },
  {
    name: "LEXUS",
    short: "L",
    logo:
      "https://cdn.jsdelivr.net/npm/car-brand-logos@1.0.0/lexus-logo.png",
  },
  {
    name: "MERCEDES-BENZ",
    short: "MB",
    logo:
      "https://cdn.jsdelivr.net/npm/car-brand-logos@1.0.0/mercedes-benz-logo.svg",
  },
  {
    name: "BMW",
    short: "BMW",
    logo:
      "https://cdn.jsdelivr.net/npm/car-brand-logos@1.0.0/bmw-logo.svg",
  },
  {
    name: "RANGE ROVER",
    short: "RR",
    logo:
      "https://cdn.jsdelivr.net/npm/car-brand-logos@1.0.0/land-rover-logo.svg",
  },
  {
    name: "AUDI",
    short: "AUDI",
    logo:
      "https://cdn.jsdelivr.net/npm/car-brand-logos@1.0.0/audi-logo.svg",
  },
];

/* =========================================================
   SAFE BRAND LOGO
========================================================= */

function BrandLogo({
  name,
  short,
  logo,
}: {
  name: string;
  short: string;
  logo: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-[70px] w-[110px] items-center justify-center rounded-2xl border border-[#d6a62b]/20 bg-[#f3ecdc] p-3 shadow-[inset_0_0_25px_rgba(255,255,255,0.65),0_10px_30px_rgba(0,0,0,0.25)] sm:h-[76px] sm:w-[120px]">
      {failed ? (
        <span className="text-center text-lg font-black tracking-tight text-[#17130a]">
          {short}
        </span>
      ) : (
        <img
          src={logo}
          alt={`${name} logo`}
          onError={() => setFailed(true)}
          className="max-h-full max-w-full object-contain"
        />
      )}
    </div>
  );
}

/* =========================================================
   BLACK + GOLD BACKGROUND
========================================================= */

function BlackGoldAtmosphere() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 52%, rgba(255,177,0,0.10), transparent 30%), radial-gradient(circle at 15% 20%, rgba(255,215,106,0.05), transparent 22%), radial-gradient(circle at 85% 22%, rgba(255,174,0,0.05), transparent 22%), linear-gradient(to bottom, #090805, #030303 58%, #080604)",
        }}
      />

      <div className="pointer-events-none absolute left-[-5%] top-[7%] h-[300px] w-[300px] rounded-full bg-[#ffb000]/7 blur-[90px]" />
      <div className="pointer-events-none absolute right-[-4%] top-[12%] h-[300px] w-[300px] rounded-full bg-[#ffd76a]/7 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[2%] left-1/2 h-[30px] w-[62%] -translate-x-1/2 rounded-[100%] bg-[#ffb000]/7 blur-[24px]" />

      <div className="pointer-events-none absolute left-1/2 top-[52%] h-px w-[85%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d6a62b]/20 to-transparent" />

      <span className="pointer-events-none absolute left-[8%] top-[30%] h-[3px] w-[3px] rounded-full bg-[#ffd15a]/70 shadow-[0_0_10px_3px_rgba(255,195,50,0.2)]" />
      <span className="pointer-events-none absolute right-[20%] top-[28%] h-[3px] w-[3px] rounded-full bg-[#ffd76a]/60 shadow-[0_0_10px_3px_rgba(255,215,106,0.18)]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,193,55,0.5) 1px, transparent 1px)",
          backgroundSize: "105px 105px",
        }}
      />
    </>
  );
}

/* =========================================================
   FEATURED PUBLIC INVENTORY
========================================================= */

function PublicInventory() {
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");

  const loadVehicles = useCallback(async () => {
    setInventoryError("");

    const { data, error } = await supabase
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
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Unable to load featured vehicles:", error);
      setInventoryError("Unable to load featured vehicles right now.");
      setLoading(false);
      return;
    }

    setVehicles((data as PublicVehicle[]) || []);
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
      <BlackGoldAtmosphere />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 xl:px-12">
        {/* SECTION HEADER */}

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-[#e5b53c]" />

              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f2c857] sm:text-[10px]">
                Owner&apos;s Selection
              </span>
            </div>

            <h2 className="max-w-[760px] text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
              Featured cars.
              <br />

              <span className="bg-gradient-to-r from-[#c99320] via-[#ffd76a] to-[#fff1b4] bg-clip-text text-transparent">
                Chosen to stand out.
              </span>
            </h2>

            <p className="mt-5 max-w-[620px] text-sm leading-7 text-slate-400">
              A curated selection personally highlighted by the dealership.
              Explore these picks here, or browse the complete inventory to
              compare every available vehicle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/vehicles"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#080603] shadow-[0_14px_40px_rgba(214,166,43,0.16)] transition hover:-translate-y-0.5"
            >
              Explore All Vehicles
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </a>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadVehicles();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6a62b]/20 text-[#d6a62b] transition hover:bg-[#d6a62b]/10"
              aria-label="Refresh featured vehicles"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="mt-14 grid gap-5 lg:grid-cols-12">
            <div className="overflow-hidden rounded-[30px] border border-[#d6a62b]/15 bg-[#0c0b08]/70 lg:col-span-8">
              <div className="h-[390px] animate-pulse bg-white/[0.04] md:h-[520px]" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08]/70"
                >
                  <div className="h-[210px] animate-pulse bg-white/[0.04]" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-white/[0.05]" />
                    <div className="h-6 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}

        {!loading && inventoryError && (
          <div className="mt-14 rounded-[24px] border border-red-500/20 bg-red-500/[0.05] px-6 py-10 text-center">
            <p className="text-sm text-red-300">{inventoryError}</p>

            <button
              type="button"
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

        {/* EMPTY */}

        {!loading && !inventoryError && vehicles.length === 0 && (
          <div className="mt-14 rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08]/65 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-2xl">
              🚘
            </div>

            <h3 className="mt-5 text-xl font-black">
              No featured vehicles selected yet.
            </h3>

            <p className="mx-auto mt-3 max-w-[520px] text-sm leading-7 text-slate-500">
              The owner can choose featured vehicles from the admin dashboard.
              All public vehicles remain available in the full inventory.
            </p>

            <a
              href="/vehicles"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d6a62b] px-6 py-3 text-xs font-black text-black transition hover:bg-[#f2c857]"
            >
              Browse Full Inventory
              <FiArrowRight />
            </a>
          </div>
        )}

        {/* CURATED FEATURED LAYOUT */}

        {!loading && !inventoryError && vehicles.length > 0 && (
          <>
            <div className="mt-14 grid gap-5 lg:grid-cols-12">
              {/* MAIN SPOTLIGHT */}

              {vehicles[0] && (
                <a
                  href={`/vehicles/${vehicles[0].id}`}
                  className="group relative min-h-[430px] overflow-hidden rounded-[30px] border border-[#d6a62b]/20 bg-black shadow-[0_35px_90px_rgba(0,0,0,0.5)] sm:min-h-[500px] lg:col-span-8 lg:min-h-[610px]"
                  aria-label={`View ${vehicles[0].name}`}
                >
                  {vehicles[0].cover_image_url ? (
                    <img
                      src={vehicles[0].cover_image_url}
                      alt={vehicles[0].name}
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025] ${
                        vehicles[0].status === "sold"
                          ? "opacity-60 grayscale-[20%]"
                          : ""
                      }`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">
                      🚘
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />

                  <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2 sm:left-7 sm:top-7">
                    <span className="rounded-full bg-[#d6a62b] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-black">
                      Spotlight
                    </span>

                    <PublicStatusBadge status={vehicles[0].status} />
                  </div>

                  {vehicles[0].status === "sold" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="-rotate-6 rounded-xl border-2 border-red-400/80 bg-black/70 px-7 py-3 text-xl font-black uppercase tracking-[0.25em] text-red-300 backdrop-blur-sm">
                        Sold
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#e8bd51]">
                      {vehicles[0].brand}
                    </p>

                    <div className="mt-3 flex items-end justify-between gap-5">
                      <div>
                        <h3 className="max-w-[700px] text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl md:text-5xl">
                          {vehicles[0].name}
                        </h3>

                        <p className="mt-4 text-xl font-black text-[#f2c857] sm:text-2xl">
                          {formatVehiclePrice(
                            vehicles[0].price,
                            vehicles[0].currency,
                          )}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-300">
                          {vehicles[0].year && (
                            <span>{vehicles[0].year}</span>
                          )}

                          {vehicles[0].transmission && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-[#d6a62b]" />
                              <span>{vehicles[0].transmission}</span>
                            </>
                          )}

                          {vehicles[0].color && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-[#d6a62b]" />
                              <span>{vehicles[0].color}</span>
                            </>
                          )}

                          {formatVehicleMileage(vehicles[0].mileage) && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-[#d6a62b]" />
                              <span>
                                {formatVehicleMileage(vehicles[0].mileage)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#d6a62b]/30 bg-black/40 text-xl text-[#f2c857] backdrop-blur transition group-hover:bg-[#d6a62b] group-hover:text-black sm:flex">
                        <FiArrowUpRight />
                      </span>
                    </div>
                  </div>
                </a>
              )}

              {/* SECONDARY PICKS */}

              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
                {vehicles.slice(1, 3).map((vehicle) => (
                  <FeaturedCompactCard
                    key={vehicle.id}
                    vehicle={vehicle}
                  />
                ))}
              </div>
            </div>

            {/* MORE OWNER PICKS */}

            {vehicles.length > 3 && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {vehicles.slice(3, 5).map((vehicle) => (
                  <FeaturedWideCard
                    key={vehicle.id}
                    vehicle={vehicle}
                  />
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[22px] border border-[#d6a62b]/10 bg-[#0a0805] px-5 py-5 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-xs font-black text-white">
                  Looking for something else?
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Search the complete inventory by brand, year, price and
                  availability.
                </p>
              </div>

              <a
                href="/vehicles"
                className="flex shrink-0 items-center gap-2 rounded-full border border-[#d6a62b]/25 px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#e6c15b] transition hover:bg-[#d6a62b]/10"
              >
                Full Inventory
                <FiArrowRight />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FeaturedCompactCard({
  vehicle,
}: {
  vehicle: PublicVehicle;
}) {
  return (
    <a
      href={`/vehicles/${vehicle.id}`}
      className="group overflow-hidden rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] transition hover:-translate-y-1 hover:border-[#d6a62b]/30"
    >
      <div className="relative h-[220px] overflow-hidden bg-black lg:h-[230px]">
        {vehicle.cover_image_url ? (
          <img
            src={vehicle.cover_image_url}
            alt={vehicle.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition duration-600 group-hover:scale-[1.03] ${
              vehicle.status === "sold" ? "opacity-60 grayscale-[20%]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            🚘
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        <div className="absolute left-4 top-4">
          <PublicStatusBadge status={vehicle.status} />
        </div>

        <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d6a62b]/25 bg-black/50 text-[#f2c857] backdrop-blur transition group-hover:bg-[#d6a62b] group-hover:text-black">
          <FiArrowUpRight />
        </span>
      </div>

      <div className="p-5">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
          {vehicle.brand}
        </p>

        <h3 className="mt-2 line-clamp-1 text-xl font-black text-white">
          {vehicle.name}
        </h3>

        <p className="mt-3 text-base font-black text-[#f2c857]">
          {formatVehiclePrice(vehicle.price, vehicle.currency)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          {vehicle.year && <span>{vehicle.year}</span>}

          {vehicle.transmission && (
            <>
              <span>•</span>
              <span>{vehicle.transmission}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

function FeaturedWideCard({
  vehicle,
}: {
  vehicle: PublicVehicle;
}) {
  return (
    <a
      href={`/vehicles/${vehicle.id}`}
      className="group grid overflow-hidden rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] transition hover:-translate-y-1 hover:border-[#d6a62b]/30 sm:grid-cols-[1.15fr_0.85fr]"
    >
      <div className="relative min-h-[230px] overflow-hidden bg-black">
        {vehicle.cover_image_url ? (
          <img
            src={vehicle.cover_image_url}
            alt={vehicle.name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition duration-600 group-hover:scale-[1.03] ${
              vehicle.status === "sold" ? "opacity-60 grayscale-[20%]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full min-h-[230px] items-center justify-center text-5xl">
            🚘
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="absolute left-4 top-4">
          <PublicStatusBadge status={vehicle.status} />
        </div>
      </div>

      <div className="flex flex-col justify-center p-5 sm:p-6">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
          {vehicle.brand}
        </p>

        <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
          {vehicle.name}
        </h3>

        <p className="mt-3 text-lg font-black text-[#f2c857]">
          {formatVehiclePrice(vehicle.price, vehicle.currency)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          {vehicle.year && <span>{vehicle.year}</span>}

          {vehicle.transmission && (
            <>
              <span>•</span>
              <span>{vehicle.transmission}</span>
            </>
          )}

          {vehicle.color && (
            <>
              <span>•</span>
              <span>{vehicle.color}</span>
            </>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#d6a62b]">
          View Vehicle
          <FiArrowRight className="transition group-hover:translate-x-1" />
        </div>
      </div>
    </a>
  );
}

function PublicStatusBadge({ status }: { status: PublicVehicleStatus }) {
  if (status === "available") {
    return (
      <span className="rounded-full border border-green-400/25 bg-green-500/90 px-3 py-2 text-[8px] font-black uppercase tracking-[0.15em] text-black shadow-lg">
        Available
      </span>
    );
  }

  if (status === "reserved") {
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

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 650);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="overflow-x-hidden bg-[#030303] text-white">
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="fixed left-0 top-0 z-50 w-full">
        {/* TOP TRUST / LOCATION BAR */}
        <div className="border-b border-[#d6a62b]/15 bg-[#090704]/98 text-white">
          <div className="mx-auto flex min-h-[38px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-5 lg:px-8 xl:px-12">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <FiMapPin className="shrink-0 text-[13px] text-[#f0c458]" />

              <div className="min-w-0 overflow-x-auto whitespace-nowrap text-[8px] font-semibold tracking-[0.02em] text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:text-[9px] lg:text-[10px]">
                <span className="font-black text-[#e8c35f]">Lagos:</span>{" "}
                Km 6, Ikeja Along Expressway, Lagos State
                <span className="mx-3 text-[#6e5a2b]">•</span>
                <span className="font-black text-[#e8c35f]">Onitsha:</span>{" "}
                No. 2 Anam Street, Omagba Phase 2 Estate, Onitsha
                <span className="mx-3 text-[#6e5a2b]">•</span>
                <span className="font-black text-[#e8c35f]">Cotonou:</span>{" "}
                Park Royale Mivvo, Cotonou, Benin Republic
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href="tel:+2347032729753"
                className="hidden items-center gap-1.5 text-[9px] font-black text-slate-300 transition hover:text-[#f2c857] md:flex"
              >
                <FiPhone />
                +234 703 272 9753
              </a>

              <a
                href="https://wa.me/2347032729753?text=Hello%20Blessed%20God%20Is%20Great%20Motor%20Autos%2C%20I%20would%20like%20to%20make%20an%20enquiry."
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[8px] font-black text-white shadow-[0_6px_20px_rgba(37,211,102,0.2)] transition hover:brightness-110 sm:text-[9px]"
              >
                <FaWhatsapp className="text-[12px]" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
          <nav className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-4 sm:px-5 lg:h-[82px] lg:px-8 xl:px-12">
            {/* BRAND */}

            <a href="#home" className="flex min-w-0 items-center gap-2.5 lg:gap-3">
              <motion.div
                whileHover={{
                  scale: 1.05,
                  rotate: -2,
                }}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e7b33f]/40 bg-gradient-to-br from-[#171109] via-[#6d4c0b] to-[#d7a72c] shadow-[0_0_25px_rgba(214,166,43,0.22)] lg:h-12 lg:w-12 lg:rounded-xl"
              >
                <span className="relative z-10 text-[13px] font-black italic tracking-[-0.08em] text-[#fff2bd] lg:text-[15px]">
                  BGG
                </span>

                <div className="absolute inset-x-2 bottom-[6px] h-[1px] bg-gradient-to-r from-transparent via-[#ffe08a] to-transparent lg:bottom-2 lg:h-[2px]" />
              </motion.div>

              <div className="min-w-0">
                <div className="whitespace-nowrap text-[10px] font-black leading-none tracking-[0.045em] text-white min-[370px]:text-[11px] sm:text-[13px] lg:text-[15px]">
                  BLESSED GOD IS GREAT
                </div>

                <div className="mt-1 whitespace-nowrap text-[5px] font-semibold tracking-[0.08em] text-[#e6bd57] min-[370px]:text-[6px] sm:text-[7px] lg:text-[8px] lg:tracking-[0.13em]">
                  MOTOR AUTOS INT&apos;L VENTURES
                </div>
              </div>
            </a>

            {/* DESKTOP NAV */}

            <div className="hidden items-center gap-8 lg:flex">
              {[
                ["Home", "#home"],
                ["Vehicles", "#vehicles"],
                ["Services", "#services"],
                ["About", "#about"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="group relative text-[13px] font-semibold text-slate-300 transition hover:text-[#f2c857]"
                >
                  {label}

                  <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#d6a62b] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <a
              href="#contact"
              className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-[#b98311] via-[#d6a62b] to-[#f0c85d] px-6 py-3 text-[13px] font-black text-[#090704] shadow-[0_10px_35px_rgba(214,166,43,0.2)] lg:flex"
            >
              Make an Enquiry
              <FiArrowUpRight />
            </a>

            {/* MOBILE BUTTON */}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d6a62b]/30 bg-[#d6a62b]/5 text-lg text-[#f0c85d] lg:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </nav>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="border-b border-[#d6a62b]/20 bg-[#070604]/95 px-4 py-3 backdrop-blur-xl lg:hidden"
            >
              <div className="flex flex-col gap-1">
                {[
                  ["Home", "#home"],
                  ["Vehicles", "#vehicles"],
                  ["Services", "#services"],
                  ["About", "#about"],
                  ["Contact", "#contact"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-[#d6a62b]/10 hover:text-[#f0c85d]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =====================================================
          HERO - MOBILE OPTIMIZED + BRIGHT CAR
      ====================================================== */}

      <section
        id="home"
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#040403] pt-[102px] lg:pt-[120px]"
      >
        {/* CAR BACKGROUND - KEPT VERY VISIBLE */}

        <div className="absolute inset-0">
          <img
            src="/images/great-zuby-lexus-hero.png"
            alt="Premium Lexus SUV"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[69%_center] opacity-[0.96] brightness-[1.08] contrast-[1.04] saturate-[1.08] min-[430px]:object-[66%_center] sm:object-[64%_center] sm:opacity-[0.98] md:object-[62%_center] md:opacity-100 lg:object-center"
          />
        </div>

        {/* DARKNESS ONLY BEHIND THE TEXT.
            THE RIGHT SIDE OF THE CAR IS LEFT ALMOST UNTOUCHED. */}

        <div className="pointer-events-none absolute inset-y-0 left-0 w-[76%] bg-gradient-to-r from-[#020201]/95 via-[#020201]/72 to-transparent sm:w-[72%] md:w-[64%] lg:w-[54%]" />

        {/* VERY LIGHT TOP + BOTTOM FADES */}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-black/20 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/30 to-transparent" />

        {/* STATIC SHOWROOM LIGHTING - PERFORMANCE OPTIMIZED */}

        <div className="pointer-events-none absolute right-[-4%] top-[22%] h-[360px] w-[430px] rounded-full bg-[#ffd76a]/7 blur-[85px] sm:h-[400px] sm:w-[500px] md:right-[2%] md:h-[450px] md:w-[560px]" />

        <div className="pointer-events-none absolute right-[10%] top-[3%] h-[120px] w-[42%] rounded-full bg-[#ffb000]/6 blur-[55px]" />

        <div className="pointer-events-none absolute bottom-[4%] right-[4%] hidden h-[30px] w-[48%] rounded-[100%] bg-[#e7b33f]/8 blur-[24px] md:block" />

        {/* HERO CONTENT */}

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-10 md:px-8 md:py-16 lg:py-24 xl:px-12">
          <div className="max-w-[620px] lg:max-w-[650px]">
            {/* LABEL */}

            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              className="mb-3 flex items-center gap-2.5 sm:mb-4 md:mb-5"
            >
              <span className="h-px w-6 bg-[#e0ad35] sm:w-8 md:w-10" />

              <span className="text-[7px] font-bold uppercase tracking-[0.17em] text-[#e9c35d] min-[370px]:text-[8px] sm:text-[9px] md:text-[11px] md:tracking-[0.22em]">
                Auto Sales • Sourcing • Logistics
              </span>
            </motion.div>

            {/* HERO TITLE */}

            <motion.h1
              initial={{
                opacity: 0,
                y: 24,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                delay: 0.08,
              }}
              className="drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)] text-[38px] font-black leading-[0.9] tracking-[-0.055em] text-white min-[360px]:text-[42px] min-[400px]:text-[46px] sm:text-[58px] md:text-[72px] lg:text-[84px] xl:text-[91px]"
            >
              DRIVE
              <br />

              <span className="bg-gradient-to-r from-[#bd8714] via-[#ffd76a] to-[#fff0b0] bg-clip-text text-transparent">
                WITHOUT
              </span>

              <br />
              LIMITS.
            </motion.h1>

            {/* COPY */}

            <motion.p
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.2,
              }}
              className="hero-mobile-copy mt-4 max-w-[560px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-[11px] leading-5 text-slate-200 min-[380px]:text-[12px] sm:mt-5 sm:text-[13px] sm:leading-6 md:mt-7 md:text-[17px] md:leading-7"
            >
              BLESSED GOD IS GREAT MOTOR AUTOS INT'L VENTURES brings premium vehicle sales, sourcing and automotive
              logistics together in one dependable experience across Nigeria
              and Benin Republic.
            </motion.p>

            {/* ACTIONS */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.3,
              }}
              className="hero-mobile-actions mt-5 flex flex-col gap-2.5 min-[360px]:flex-row sm:mt-7 sm:gap-3 md:mt-9 md:gap-4"
            >
              <a
                href="/vehicles"
                className="group flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#b98311] via-[#d6a62b] to-[#f0c85d] px-5 py-3 text-[12px] font-black text-[#080603] shadow-[0_12px_35px_rgba(214,166,43,0.22)] transition hover:-translate-y-1 sm:px-6 sm:py-3.5 sm:text-sm md:py-4"
              >
                Browse Inventory

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[12px] text-[#ffd76a] transition group-hover:translate-x-1 sm:h-7 sm:w-7">
                  <FiArrowRight />
                </span>
              </a>

              <a
                href="#services"
                className="flex items-center justify-center rounded-full border border-[#d6a62b]/40 bg-black/20 px-5 py-3 text-[12px] font-bold text-[#f4dea0] shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:bg-[#d6a62b]/10 sm:px-6 sm:py-3.5 sm:text-sm md:px-7 md:py-4"
              >
                Our Services
              </a>
            </motion.div>

            {/* HERO STATS */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.55,
              }}
              className="hero-mobile-stats mt-6 grid max-w-[560px] grid-cols-3 border-t border-[#d6a62b]/20 pt-4 sm:mt-8 sm:pt-5 md:mt-12 lg:mt-14"
            >
              <div>
                <div className="text-[13px] font-black text-white min-[380px]:text-[14px] sm:text-lg md:text-xl">
                  Premium
                </div>

                <div className="mt-1 text-[6px] uppercase tracking-[0.12em] text-[#aa8c4a] sm:text-[8px] md:text-[10px]">
                  Vehicles
                </div>
              </div>

              <div className="border-l border-[#d6a62b]/20 pl-3 min-[380px]:pl-4 sm:pl-5">
                <div className="text-[13px] font-black text-white min-[380px]:text-[14px] sm:text-lg md:text-xl">
                  Secure
                </div>

                <div className="mt-1 text-[6px] uppercase tracking-[0.12em] text-[#aa8c4a] sm:text-[8px] md:text-[10px]">
                  Logistics
                </div>
              </div>

              <div className="border-l border-[#d6a62b]/20 pl-3 min-[380px]:pl-4 sm:pl-5">
                <div className="text-[13px] font-black text-white min-[380px]:text-[14px] sm:text-lg md:text-xl">
                  Reliable
                </div>

                <div className="mt-1 text-[6px] uppercase tracking-[0.12em] text-[#aa8c4a] sm:text-[8px] md:text-[10px]">
                  Service
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM GOLD LINE */}

        <div className="absolute bottom-0 left-1/2 z-20 h-px w-[90%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d6a62b]/35 to-transparent" />
      </section>

      {/* =====================================================
          MOVING BRANDS
      ====================================================== */}

      <section className="relative overflow-hidden border-y border-[#d6a62b]/20 bg-[#050403] py-10 sm:py-12 md:py-16">
        <BlackGoldAtmosphere />

        <div className="relative z-10 mx-auto mb-6 max-w-[1440px] px-4 sm:mb-8 sm:px-6 md:px-8 xl:px-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#e7b33f] sm:w-8" />

              <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#f2c857] sm:text-[9px] md:text-[10px]">
                Premium Automotive Brands
              </span>
            </div>

            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a98d4b] sm:block">
              Selected Marques
            </span>
          </div>
        </div>

        {/* EDGE FADES */}

        <div className="pointer-events-none absolute bottom-0 left-0 top-[60px] z-20 w-8 bg-gradient-to-r from-[#050403] to-transparent sm:w-14 md:w-28" />

        <div className="pointer-events-none absolute bottom-0 right-0 top-[60px] z-20 w-8 bg-gradient-to-l from-[#050403] to-transparent sm:w-14 md:w-28" />

        {/* CONTINUOUS TRACK */}

        <div className="relative z-10 overflow-hidden">
          <motion.div
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              duration: 32,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex w-max"
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4 md:gap-6 md:pr-6"
              >
                {brandLogos.map((brand, index) => (
                  <motion.div
                    key={`${copy}-${brand.name}`}
                    whileHover={{
                      y: -6,
                      scale: 1.025,
                    }}
                    className="group relative flex h-[145px] w-[145px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[20px] border border-[#d6a62b]/25 bg-[#0e0c08]/80 px-3 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:h-[165px] sm:w-[180px] sm:rounded-[24px] md:h-[185px] md:w-[225px] md:px-5 md:py-6"
                  >
                    <div className="pointer-events-none absolute top-[-45px] h-[100px] w-[130px] rounded-full bg-[#ffb000]/12 blur-[38px]" />

                    <div className="absolute left-1/2 top-0 h-[2px] w-[65%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ffd05a] to-transparent" />

                    {/* NAME */}

                    <span className="relative z-10 text-center text-[8px] font-black tracking-[0.14em] text-[#f2c857] sm:text-[9px] md:text-[11px] md:tracking-[0.18em]">
                      {brand.name}
                    </span>

                    {/* NATURAL LOGO - NO GOLD FILTER */}

                    <div className="relative z-10 mt-4 flex items-center justify-center">
                      <BrandLogo
                        name={brand.name}
                        short={brand.short}
                        logo={brand.logo}
                      />
                    </div>

                    {/* GOLD FLOOR */}

                    <div className="absolute bottom-2 left-1/2 h-[5px] w-[60px] -translate-x-1/2 rounded-full bg-[#ffbd32]/12 blur-[6px]" />
                  </motion.div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          PREMIUM VEHICLE SHOWCASE
      ====================================================== */}

      <section
        className="relative overflow-hidden border-y border-[#d6a62b]/10 bg-[#060504] py-20 md:py-28"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "900px",
        }}
      >
        <BlackGoldAtmosphere />

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-[#d6a62b]" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f0c458]">
                  Premium Selection
                </span>
              </div>

              <h2 className="max-w-[760px] text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
                Luxury presence.
                <br />
                <span className="bg-gradient-to-r from-[#c99320] via-[#ffd76a] to-[#fff1b4] bg-clip-text text-transparent">
                  Everyday confidence.
                </span>
              </h2>
            </div>

            <p className="max-w-[470px] text-sm leading-7 text-slate-400">
              From executive sedans to premium SUVs, we source desirable
              vehicles across leading global marques. Actual available stock is
              shown in our live inventory below.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {premiumShowcase.map((car) => (
              <article
                key={`${car.brand}-${car.label}`}
                className="group overflow-hidden rounded-[26px] border border-[#d6a62b]/18 bg-[#0b0906] shadow-[0_22px_60px_rgba(0,0,0,0.28)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#2b2923_0%,#11100d_48%,#050403_100%)]">
                  <img
                    src={car.image}
                    alt={`${car.brand} ${car.label}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain p-2 brightness-[1.12] contrast-[1.03] saturate-[1.08] transition duration-500 group-hover:scale-[1.015] group-hover:brightness-[1.18] sm:p-3"
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-black/35 to-transparent" />
                </div>

                <div className="border-t border-[#d6a62b]/10 bg-gradient-to-b from-[#0d0b07] to-[#070604] p-5 md:p-6">
                  <span className="inline-flex rounded-full border border-[#d6a62b]/25 bg-[#d6a62b]/7 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#e7bd54]">
                    {car.brand}
                  </span>

                  <h3 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white">
                    {car.label}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    Available through sourcing and dealership inventory.
                  </p>

                  <a
                    href={car.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-[9px] font-semibold text-[#75623b] transition hover:text-[#d6a62b]"
                  >
                    Photo: {car.credit} / Wikimedia Commons
                  </a>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-[10px] leading-5 text-[#7c6a43]">
            Representative model photography. Vehicle specifications,
            colours and availability vary by stock and sourcing request.
          </p>
        </div>
      </section>

      {/* =====================================================
          FEATURED VEHICLES
      ====================================================== */}

      <PublicInventory />

      {/* =====================================================
          LOGISTICS
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#050403] py-20 md:py-32">
        <BlackGoldAtmosphere />

        <div className="absolute right-0 top-0 h-full w-full opacity-[0.16] lg:w-[58%]">
          <img
            src="/images/great-zuby-lexus-hero.png"
            alt=""
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#050403] via-[#050403]/75 to-black/20" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1440px] gap-16 px-5 md:px-8 lg:grid-cols-2 xl:px-12">
          <motion.div
            initial={{
              opacity: 0,
              x: -30,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <FiTruck className="text-[#f0c458]" />

              <span className="text-[10px] font-black uppercase tracking-[0.27em] text-[#e7bd54]">
                Auto Logistics
              </span>
            </div>

            <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
              From point A
              <br />

              <span className="bg-gradient-to-r from-[#d6a62b] via-[#ffe08a] to-[#c69119] bg-clip-text text-transparent">
                to wherever&apos;s next.
              </span>
            </h2>

            <p className="mt-7 max-w-[560px] text-[15px] leading-8 text-slate-300">
              Beyond selling vehicles, Blessed God Is Great provides automotive
              logistics support designed to simplify sourcing, transportation
              and delivery across its Lagos, Onitsha and Cotonou operations.
            </p>

            <div className="relative mt-12 max-w-[560px]">
              <div className="absolute left-[11px] top-2 h-[calc(100%-20px)] w-px bg-[#d6a62b]/25" />

              {[
                ["01", "Vehicle received"],
                ["02", "Transportation coordinated"],
                ["03", "Vehicle dispatched"],
                ["04", "Delivery completed"],
              ].map(([num, label], index) => (
                <motion.div
                  key={label}
                  initial={{
                    opacity: 0,
                    x: -15,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.1,
                  }}
                  className="relative flex items-center gap-5 pb-7"
                >
                  <div className="relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border border-[#d6a62b] bg-[#050403]">
                    <div className="h-[5px] w-[5px] rounded-full bg-[#f2c857]" />
                  </div>

                  <span className="text-[10px] font-black tracking-widest text-[#d6a62b]">
                    {num}
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          SERVICES
      ====================================================== */}

      <section
        id="services"
        className="relative overflow-hidden bg-[#050403] py-20 md:py-32"
      >
        <BlackGoldAtmosphere />

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-7 bg-[#e1b139]" />

              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f2c857]">
                What We Do
              </span>

              <span className="h-px w-7 bg-[#e1b139]" />
            </div>

            <h2 className="mx-auto mt-5 max-w-[800px] text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
              More than a dealership.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <motion.div
                  key={service.title}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    y: -7,
                  }}
                  className="group relative min-h-[350px] overflow-hidden rounded-[26px] border border-[#d6a62b]/20 bg-[#0c0b08]/70 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <div className="absolute -right-20 -top-20 h-[180px] w-[180px] rounded-full bg-[#ffb000]/0 blur-[55px] transition duration-500 group-hover:bg-[#ffb000]/12" />

                  <div className="absolute left-1/2 top-0 h-[2px] w-[65%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d6a62b]/70 to-transparent" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6a62b]/25 bg-[#d6a62b]/10 text-2xl text-[#f1c75b] transition group-hover:bg-[#d6a62b] group-hover:text-black">
                      <Icon />
                    </div>

                    <span className="text-xs font-black tracking-widest text-[#6e5a2b]">
                      {service.number}
                    </span>
                  </div>

                  <h3 className="relative mt-16 text-2xl font-black text-white">
                    {service.title}
                  </h3>

                  <p className="relative mt-4 text-sm leading-7 text-slate-400">
                    {service.description}
                  </p>

                  <FiArrowUpRight className="absolute bottom-8 right-8 text-xl text-[#e0b343] opacity-0 transition group-hover:opacity-100" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ====================================================== */}

      <section
        id="about"
        className="relative overflow-hidden bg-[#050403] py-20 md:py-32"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=78&w=1800"
            alt="Illuminated city skyline"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-[#050403]/78" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#050403]/92 via-[#120d04]/55 to-[#050403]/85" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#030302]/95 via-transparent to-[#050403]/60" />

        <div className="pointer-events-none absolute right-[3%] top-[15%] h-[340px] w-[380px] rounded-full bg-[#ffc54d]/10 blur-[90px]" />

        <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-12 px-5 md:px-8 lg:grid-cols-2 xl:px-12">
          {/* IMAGE */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              x: -25,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            className="relative min-h-[400px] overflow-hidden rounded-[30px] border border-[#d6a62b]/25 shadow-[0_35px_100px_rgba(0,0,0,0.55)] sm:min-h-[520px]"
          >
            <img
              src="/images/great-zuby-lexus-hero.png"
              alt="Blessed God Is Great premium Lexus"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050403]/95 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 md:p-10">
              <div className="max-w-[380px] rounded-2xl border border-[#d6a62b]/25 bg-black/55 p-5 backdrop-blur-xl">
                <FiShield className="text-2xl text-[#f0c458]" />

                <p className="mt-3 text-sm font-bold leading-6 text-white">
                  Quality, professionalism and dependable service at every
                  stage.
                </p>
              </div>
            </div>
          </motion.div>

          {/* TEXT */}

          <motion.div
            initial={{
              opacity: 0,
              x: 35,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[#d6a62b]" />

              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f0c458]">
                About Blessed God Is Great
              </span>
            </div>

            <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
              Automotive service
              <br />
              built around
              <br />

              <span className="bg-gradient-to-r from-[#c99320] via-[#ffd76a] to-[#fff1b4] bg-clip-text text-transparent">
                confidence.
              </span>
            </h2>

            <p className="mt-7 max-w-[600px] text-[15px] leading-8 text-slate-300">
              BLESSED GOD IS GREAT MOTOR AUTOS INT'L VENTURES provides customers with a professional destination for
              vehicle sales, sourcing and automotive logistics, with offices in
              Lagos, Onitsha and Cotonou.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className="flex items-center gap-3 rounded-xl border border-[#d6a62b]/20 bg-black/45 px-4 py-4 backdrop-blur-xl"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6a62b]/15 text-sm text-[#f0c458]">
                    <FiCheck />
                  </span>

                  <span className="text-sm font-bold text-white">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          ADVANTAGES
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#050403] py-20">
        <BlackGoldAtmosphere />

        <div className="relative z-10 mx-auto grid max-w-[1440px] gap-4 px-5 md:grid-cols-3 md:px-8 xl:px-12">
          {[
            {
              icon: PiEngineFill,
              title: "Quality Selection",
              text: "Vehicles chosen with quality and customer expectations in mind.",
            },
            {
              icon: FiClock,
              title: "Responsive Service",
              text: "A straightforward process designed around clear communication.",
            },
            {
              icon: FiShield,
              title: "Trusted Process",
              text: "Professional attention from vehicle enquiry through delivery.",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                whileHover={{
                  y: -6,
                }}
                className="group relative overflow-hidden rounded-[24px] border border-[#d6a62b]/20 bg-[#0d0b07]/75 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl"
              >
                <Icon className="relative text-2xl text-[#f0c458]" />

                <h3 className="relative mt-5 text-lg font-black text-white">
                  {item.title}
                </h3>

                <p className="relative mt-3 text-sm leading-7 text-slate-400">
                  {item.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ====================================================== */}

      <section
        id="contact"
        className="relative overflow-hidden bg-[#050403] py-20 text-white md:py-28"
      >
        <BlackGoldAtmosphere />

        <div className="absolute left-1/2 top-0 h-[2px] w-[75%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ffd05a]/80 to-transparent" />

        <div className="relative z-10 mx-auto max-w-[1200px] px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-flex rounded-full border border-[#d6a62b]/30 bg-[#d6a62b]/10 px-5 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#f0c458] backdrop-blur sm:text-[9px] sm:tracking-[0.3em]">
              Blessed God Is Great Motor Autos Int&apos;l Ventures
            </span>

            <h2 className="mt-7 text-4xl font-black leading-[1] tracking-[-0.05em] sm:text-5xl md:text-7xl">
              Your next vehicle
              <br />
              <span className="bg-gradient-to-r from-[#bd8714] via-[#ffd76a] to-[#fff0b0] bg-clip-text text-transparent">
                starts here.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-[650px] text-sm leading-7 text-slate-400 md:text-base">
              Contact our team for vehicle availability, sourcing, delivery and
              automotive logistics enquiries.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a
              href="tel:+2347032729753"
              className="group rounded-[22px] border border-[#d6a62b]/18 bg-[#0d0b07]/80 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#d6a62b]/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6a62b]/10 text-xl text-[#f2c857]">
                <FiPhone />
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#8f7741]">
                Call
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                +234 703 272 9753
              </p>
            </a>

            <a
              href="mailto:godspowernwachukwu935@gmail.com"
              className="group rounded-[22px] border border-[#d6a62b]/18 bg-[#0d0b07]/80 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#d6a62b]/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6a62b]/10 text-xl text-[#f2c857]">
                <FiMail />
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#8f7741]">
                Email
              </p>
              <p className="mt-2 break-all text-sm font-bold text-white">
                godspowernwachukwu935@gmail.com
              </p>
            </a>

            <div className="rounded-[22px] border border-[#d6a62b]/18 bg-[#0d0b07]/80 p-5 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6a62b]/10 text-xl text-[#f2c857]">
                <FaWhatsapp />
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#8f7741]">
                WhatsApp
              </p>
              <div className="mt-2 flex flex-col gap-2 text-sm font-bold">
                <a
                  href="https://wa.me/2347032729753"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white transition hover:text-[#f2c857]"
                >
                  +234 703 272 9753
                </a>
                <a
                  href="https://wa.me/22957804416"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white transition hover:text-[#f2c857]"
                >
                  +229 57 80 44 16
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              [
                "Lagos Branch",
                "Kilometre 6, Ikeja Along Expressway, Lagos State, Nigeria",
              ],
              [
                "Onitsha Branch",
                "No. 2 Anam Street, Omagba Phase 2 Estate, Onitsha, Anambra State",
              ],
              [
                "Cotonou Office",
                "Park Royale Mivvo, Cotonou, Benin Republic",
              ],
            ].map(([branch, address]) => (
              <div
                key={branch}
                className="rounded-[22px] border border-[#d6a62b]/15 bg-black/30 p-5 backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-1 shrink-0 text-[#f2c857]" />
                  <div>
                    <p className="text-xs font-black text-white">{branch}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.instagram.com/godspowernwachukwumotors?stkn=MXJ5eTZoeDJuNzB0NQ=="
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-[#d6a62b]/25 bg-[#d6a62b]/5 px-5 py-3 text-xs font-black text-[#f0c458] transition hover:bg-[#d6a62b]/10"
            >
              <FaInstagram className="text-base" />
              Instagram
            </a>

            <a
              href="https://www.tiktok.com/@blessedgreatautos685?_r=1&_t=ZS-99v5JW59l8T"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-[#d6a62b]/25 bg-[#d6a62b]/5 px-5 py-3 text-xs font-black text-[#f0c458] transition hover:bg-[#d6a62b]/10"
            >
              <FaTiktok className="text-base" />
              TikTok
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      {/* FLOATING ACTIONS */}
      <div className="fixed bottom-5 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              onClick={scrollToTop}
              aria-label="Go back to the top"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6a62b]/30 bg-[#0b0906]/95 text-lg text-[#f2c857] shadow-[0_12px_35px_rgba(0,0,0,0.4)] backdrop-blur-md transition hover:-translate-y-1 hover:border-[#d6a62b]/60"
            >
              <FiChevronUp />
            </motion.button>
          )}
        </AnimatePresence>

        <a
          href="https://wa.me/2347032729753?text=Hello%20Blessed%20God%20Is%20Great%20Motor%20Autos%2C%20I%20would%20like%20to%20make%20an%20enquiry."
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Blessed God Is Great Motor Autos on WhatsApp"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-[#25D366] px-4 py-3 text-xs font-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition hover:-translate-y-1 hover:brightness-110 sm:px-5"
        >
          <FaWhatsapp className="text-xl" />
          <span className="hidden sm:inline">Chat on WhatsApp</span>
        </a>
      </div>

      <footer className="border-t border-[#d6a62b]/15 bg-[#020201] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-8 xl:px-12">
          <div className="grid gap-12 border-b border-[#d6a62b]/15 pb-14 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d6a62b]/35 bg-gradient-to-br from-[#171109] to-[#c7921e] text-[13px] font-black italic tracking-[-0.08em] text-[#fff0b0]">
                  BGG
                </div>

                <div>
                  <div className="font-black tracking-[0.05em]">
                    BLESSED GOD IS GREAT
                  </div>

                  <div className="mt-1 text-[7px] font-semibold tracking-[0.12em] text-[#d6a62b]">
                    MOTOR AUTOS INT&apos;L VENTURES
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-[440px] text-sm leading-7 text-slate-400">
                Premium vehicle sales, sourcing and automotive logistics across
                Lagos, Onitsha and Cotonou.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8f7741]">
                Navigation
              </p>

              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <a href="#home" className="transition hover:text-[#f0c458]">
                  Home
                </a>

                <a
                  href="/vehicles"
                  className="transition hover:text-[#f0c458]"
                >
                  Vehicles
                </a>

                <a
                  href="#services"
                  className="transition hover:text-[#f0c458]"
                >
                  Services
                </a>

                <a href="#about" className="transition hover:text-[#f0c458]">
                  About
                </a>

                <a
                  href="#contact"
                  className="transition hover:text-[#f0c458]"
                >
                  Contact
                </a>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8f7741]">
                Services
              </p>

              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <span>Vehicle Sales</span>
                <span>Vehicle Sourcing</span>
                <span>Auto Logistics</span>
                <span>Vehicle Delivery</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 pt-7 text-[11px] text-[#746442] md:flex-row">
            <p>
              © 2026 BLESSED GOD IS GREAT MOTOR AUTOS INT'L VENTURES All rights reserved.
            </p>

            <p>Automotive excellence in motion.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}