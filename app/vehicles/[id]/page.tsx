"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiImage,
  FiMail,
  FiPhone,
  FiPlay,
  FiShield,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

type VehicleStatus = "available" | "reserved" | "sold";

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
  video_url: string | null;
  is_featured: boolean;
  created_at: string;
};

type VehicleImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

function formatPrice(price: number | null, currency: string) {
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

function formatMileage(mileage: number | null) {
  if (mileage === null || mileage === undefined) {
    return "Not specified";
  }

  return `${Number(mileage).toLocaleString()} km`;
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  if (status === "available") {
    return (
      <span className="inline-flex rounded-full border border-green-400/25 bg-green-500/90 px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-black shadow-lg">
        Available
      </span>
    );
  }

  if (status === "reserved") {
    return (
      <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-400/90 px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-black shadow-lg">
        Reserved
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-red-400/30 bg-red-500/90 px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-lg">
      Sold
    </span>
  );
}

function GoldAtmosphere() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 15%, rgba(255,190,65,0.09), transparent 24%), radial-gradient(circle at 15% 75%, rgba(214,166,43,0.07), transparent 24%), linear-gradient(to bottom, #080705, #030303 58%, #070503)",
        }}
      />

      <div className="pointer-events-none absolute right-[-180px] top-[8%] h-[520px] w-[520px] rounded-full bg-[#ffb000]/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-180px] left-[-120px] h-[440px] w-[440px] rounded-full bg-[#d6a62b]/10 blur-[140px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,193,55,0.5) 1px, transparent 1px)",
          backgroundSize: "95px 95px",
        }}
      />
    </>
  );
}

export default function VehicleDetailPage() {
  const params = useParams();

  const vehicleId = typeof params.id === "string" ? params.id : "";

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquiryWebsite, setEnquiryWebsite] = useState("");
  const [enquirySending, setEnquirySending] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryError, setEnquiryError] = useState("");

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    const { data: vehicleData, error: vehicleError } = await supabase
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
        video_url,
        is_featured,
        created_at
      `,
      )
      .eq("id", vehicleId)
      .neq("status", "hidden")
      .maybeSingle();

    if (vehicleError) {
      console.error("Unable to load vehicle:", vehicleError);
      setError("Unable to load this vehicle right now.");
      setLoading(false);
      return;
    }

    if (!vehicleData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadedVehicle = vehicleData as Vehicle;

    const { data: imageData, error: imageError } = await supabase
      .from("vehicle_images")
      .select("id, image_url, sort_order")
      .eq("vehicle_id", vehicleId)
      .order("sort_order", { ascending: true });

    if (imageError) {
      console.error("Unable to load vehicle images:", imageError);
    }

    const loadedImages = (imageData as VehicleImage[]) || [];

    setVehicle(loadedVehicle);
    setImages(loadedImages);

    const coverIndex = loadedImages.findIndex(
      (image) => image.image_url === loadedVehicle.cover_image_url,
    );

    setActiveImage(coverIndex >= 0 ? coverIndex : 0);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const gallery = useMemo(() => {
    if (images.length > 0) {
      return images;
    }

    if (vehicle?.cover_image_url) {
      return [
        {
          id: "cover-image",
          image_url: vehicle.cover_image_url,
          sort_order: 0,
        },
      ];
    }

    return [];
  }, [images, vehicle]);

  useEffect(() => {
    if (activeImage >= gallery.length && gallery.length > 0) {
      setActiveImage(0);
    }
  }, [activeImage, gallery.length]);

  const previousImage = () => {
    if (gallery.length <= 1) return;

    setActiveImage((current) =>
      current === 0 ? gallery.length - 1 : current - 1,
    );
  };

  const nextImage = () => {
    if (gallery.length <= 1) return;

    setActiveImage((current) =>
      current === gallery.length - 1 ? 0 : current + 1,
    );
  };

  const submitEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!vehicle) {
      return;
    }

    setEnquiryError("");

    if (!enquiryName.trim()) {
      setEnquiryError("Please enter your name.");
      return;
    }

    if (!enquiryPhone.trim() && !enquiryEmail.trim()) {
      setEnquiryError("Please provide a phone number or email address.");
      return;
    }

    // Honeypot field. Real visitors never see or fill this.
    if (enquiryWebsite.trim()) {
      setEnquirySent(true);
      return;
    }

    setEnquirySending(true);

    const { error: insertError } = await supabase
      .from("vehicle_enquiries")
      .insert({
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name,
        customer_name: enquiryName.trim(),
        phone: enquiryPhone.trim() || null,
        email: enquiryEmail.trim() || null,
        message: enquiryMessage.trim() || null,
      });

    if (insertError) {
      console.error("Unable to submit vehicle enquiry:", insertError);
      setEnquiryError(
        "We could not submit your enquiry right now. Please try again.",
      );
      setEnquirySending(false);
      return;
    }

    setEnquirySending(false);
    setEnquirySent(true);
  };

  const closeEnquiry = () => {
    setEnquiryOpen(false);

    window.setTimeout(() => {
      setEnquirySent(false);
      setEnquiryError("");
    }, 250);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-[#d6a62b]/30 border-t-[#f2c857]" />
          <p className="text-sm text-[#8f7741]">Loading vehicle...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030303] px-5 text-white">
        <GoldAtmosphere />

        <div className="relative z-10 max-w-[520px] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/10 text-2xl">
            🚘
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Vehicle unavailable
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-500">
            This vehicle may have been removed from the public inventory or the
            link may no longer be valid.
          </p>

          <Link
            href="/#vehicles"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-sm font-black text-black"
          >
            <FiArrowLeft />
            Back to Inventory
          </Link>
        </div>
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] px-5 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black">Unable to load vehicle</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            {error || "Something went wrong while loading this vehicle."}
          </p>
          <button
            type="button"
            onClick={loadVehicle}
            className="mt-7 rounded-full bg-[#d6a62b] px-6 py-3 text-sm font-black text-black"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const currentImage = gallery[activeImage]?.image_url || null;
  const isSold = vehicle.status === "sold";

  const specs = [
    {
      label: "Year",
      value: vehicle.year ? String(vehicle.year) : "Not specified",
    },
    {
      label: "Transmission",
      value: vehicle.transmission || "Not specified",
    },
    {
      label: "Colour",
      value: vehicle.color || "Not specified",
    },
    {
      label: "Mileage",
      value: formatMileage(vehicle.mileage),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] text-white">
      <GoldAtmosphere />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8 xl:px-12">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e7b33f]/40 bg-gradient-to-br from-[#171109] via-[#6d4c0b] to-[#d7a72c] text-[16px] font-black italic text-[#fff2bd] shadow-[0_0_25px_rgba(214,166,43,0.22)]">
              BGG
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[13px] font-black leading-none tracking-[0.07em] sm:text-[15px]">
                BLESSED GOD IS GREAT
              </p>
              <p className="mt-1 whitespace-nowrap text-[6px] font-semibold tracking-[0.14em] text-[#e6bd57] sm:text-[8px]">
                MOTOR AUTOS INT'L VENTURES
              </p>
            </div>
          </Link>

          <Link
            href="/#vehicles"
            className="flex items-center gap-2 rounded-full border border-[#d6a62b]/25 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#e5c35c] transition hover:bg-[#d6a62b]/10 sm:px-5 sm:text-xs"
          >
            <FiArrowLeft />
            <span className="hidden min-[360px]:inline">Inventory</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-10 md:px-8 md:py-14 xl:px-12">
        {/* BREADCRUMB */}
        <div className="mb-7 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#766741]">
          <Link href="/" className="transition hover:text-[#f2c857]">
            Home
          </Link>
          <span>/</span>
          <Link href="/#vehicles" className="transition hover:text-[#f2c857]">
            Vehicles
          </Link>
          <span>/</span>
          <span className="text-[#b99a4d]">{vehicle.name}</span>
        </div>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)] lg:items-start xl:gap-12">
          {/* GALLERY */}
          <div>
            <div className="relative overflow-hidden rounded-[26px] border border-[#d6a62b]/20 bg-[#080705] shadow-[0_35px_100px_rgba(0,0,0,0.55)] sm:rounded-[30px]">
              <div className="relative aspect-[4/3] min-h-[290px] overflow-hidden sm:aspect-[16/11] lg:aspect-[4/3] xl:aspect-[16/11]">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={`${vehicle.name} photo ${activeImage + 1}`}
                    className={`h-full w-full object-cover transition duration-500 ${
                      isSold ? "opacity-65 grayscale-[15%]" : ""
                    }`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">
                    🚘
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-5 sm:top-5">
                  {vehicle.is_featured && (
                    <span className="rounded-full bg-[#d6a62b] px-3.5 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-black">
                      Featured
                    </span>
                  )}

                  <StatusBadge status={vehicle.status} />
                </div>

                {isSold && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="-rotate-6 rounded-xl border-2 border-red-400/80 bg-black/70 px-7 py-3 text-xl font-black uppercase tracking-[0.25em] text-red-300 backdrop-blur sm:text-2xl">
                      Sold
                    </span>
                  </div>
                )}

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousImage}
                      aria-label="Previous vehicle photo"
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur transition hover:bg-[#d6a62b] hover:text-black sm:left-4 sm:h-12 sm:w-12"
                    >
                      <FiChevronLeft />
                    </button>

                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next vehicle photo"
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur transition hover:bg-[#d6a62b] hover:text-black sm:right-4 sm:h-12 sm:w-12"
                    >
                      <FiChevronRight />
                    </button>
                  </>
                )}

                {gallery.length > 0 && (
                  <span className="absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1.5 text-[9px] font-black tracking-[0.12em] text-white backdrop-blur">
                    {activeImage + 1} / {gallery.length}
                  </span>
                )}
              </div>
            </div>

            {/* THUMBNAILS */}
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {gallery.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View photo ${index + 1}`}
                    className={`relative h-[78px] w-[105px] shrink-0 overflow-hidden rounded-xl border transition sm:h-[92px] sm:w-[125px] ${
                      index === activeImage
                        ? "border-[#f2c857] shadow-[0_0_24px_rgba(214,166,43,0.18)]"
                        : "border-[#d6a62b]/15 opacity-65 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <aside className="lg:sticky lg:top-[92px]">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d6a62b]">
              {vehicle.brand}
            </p>

            <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-[54px]">
              {vehicle.name}
            </h1>

            {vehicle.model && vehicle.model.toLowerCase() !== vehicle.name.toLowerCase() && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {vehicle.model}
              </p>
            )}

            <p className="mt-7 bg-gradient-to-r from-[#d6a62b] via-[#ffe08a] to-[#c69119] bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
              {formatPrice(vehicle.price, vehicle.currency)}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-2xl border border-[#d6a62b]/15 bg-[#0c0b08]/85 p-4 backdrop-blur"
                >
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#806d3d]">
                    {spec.label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-200 sm:text-base">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#d6a62b]/15 bg-[#0c0b08]/75 p-5">
              <div className="flex items-start gap-3">
                <FiShield className="mt-0.5 shrink-0 text-xl text-[#f2c857]" />
                <div>
                  <p className="text-sm font-black text-white">Blessed God Is Great Inventory</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    Vehicle availability and specifications are managed directly
                    through the Blessed God Is Great inventory system.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {!isSold ? (
                <button
                  type="button"
                  onClick={() => setEnquiryOpen(true)}
                  className="group flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-4 text-sm font-black text-black shadow-[0_15px_45px_rgba(214,166,43,0.18)] transition hover:-translate-y-0.5"
                >
                  Make an Enquiry
                  <FiArrowRight className="transition group-hover:translate-x-1" />
                </button>
              ) : (
                <Link
                  href="/#vehicles"
                  className="group flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-4 text-sm font-black text-black"
                >
                  View Available Vehicles
                  <FiArrowRight />
                </Link>
              )}

              <Link
                href="/#vehicles"
                className="flex items-center justify-center gap-2 rounded-full border border-[#d6a62b]/25 px-6 py-4 text-sm font-bold text-[#d3b35e] transition hover:bg-[#d6a62b]/8"
              >
                <FiArrowLeft />
                Back to Inventory
              </Link>
            </div>
          </aside>
        </div>

        {/* DESCRIPTION */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8">
          <div className="rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08]/75 p-5 backdrop-blur sm:p-7 md:p-9">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d6a62b]" />
              <p className="text-[9px] font-black uppercase tracking-[0.23em] text-[#f2c857]">
                Vehicle Details
              </p>
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
              About this {vehicle.brand}
            </h2>

            {vehicle.description ? (
              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-400 sm:text-[15px]">
                {vehicle.description}
              </p>
            ) : (
              <p className="mt-5 text-sm leading-8 text-slate-500">
                Additional vehicle information will be added by the Blessed God Is Great
                inventory team.
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08]/75 p-5 backdrop-blur sm:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#d6a62b]">
              Vehicle Summary
            </p>

            <div className="mt-6 space-y-4">
              {[
                ["Brand", vehicle.brand],
                ["Model", vehicle.model || vehicle.name],
                ["Status", vehicle.status],
                ["Year", vehicle.year ? String(vehicle.year) : "Not specified"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-5 border-b border-[#d6a62b]/10 pb-4 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-bold capitalize text-slate-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-500/15 bg-green-500/[0.04] p-4">
              <FiCheck className="shrink-0 text-green-300" />
              <p className="text-xs leading-6 text-slate-400">
                Inventory information is updated from the dealership dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* VIDEO */}
        {vehicle.video_url && (
          <section className="mt-8 rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08]/75 p-5 sm:p-7 md:p-9">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6a62b]/10 text-[#f2c857]">
                <FiPlay />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#d6a62b]">
                  Vehicle Video
                </p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                  Walk-around video
                </h2>
              </div>
            </div>

            <video
              src={vehicle.video_url}
              controls
              playsInline
              preload="metadata"
              className="mt-6 max-h-[720px] w-full rounded-[22px] bg-black shadow-[0_25px_70px_rgba(0,0,0,0.4)]"
            />
          </section>
        )}

        {/* SERVICE STRIP */}
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: FiImage,
              title: "Real Inventory",
              text: "Photos uploaded from the dealership dashboard.",
            },
            {
              icon: FiTruck,
              title: "Auto Logistics",
              text: "Vehicle movement and delivery support.",
            },
            {
              icon: FiClock,
              title: "Live Availability",
              text: "Status can be updated as vehicles are reserved or sold.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[22px] border border-[#d6a62b]/15 bg-[#0c0b08]/65 p-5"
              >
                <Icon className="text-xl text-[#f2c857]" />
                <p className="mt-4 text-sm font-black">{item.title}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </section>
      </section>

      {/* ENQUIRY MODAL */}
      {enquiryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEnquiry();
            }
          }}
        >
          <div className="relative max-h-[94svh] w-full overflow-y-auto rounded-t-[28px] border border-[#d6a62b]/20 bg-[#090806] shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:max-w-[620px] sm:rounded-[28px]">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d6a62b] to-transparent" />

            <button
              type="button"
              onClick={closeEnquiry}
              aria-label="Close enquiry form"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#d6a62b]/15 bg-black/50 text-slate-300 transition hover:border-[#d6a62b]/40 hover:text-[#f2c857]"
            >
              <FiX />
            </button>

            <div className="p-5 sm:p-7 md:p-8">
              {!enquirySent ? (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d6a62b]">
                    Vehicle Enquiry
                  </p>

                  <h2 className="mt-3 pr-12 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
                    Enquire about {vehicle.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Send your details to Blessed God Is Great. This enquiry is linked
                    directly to this vehicle in the dealership system.
                  </p>

                  <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[#d6a62b]/15 bg-black/30 p-3">
                    {vehicle.cover_image_url ? (
                      <img
                        src={vehicle.cover_image_url}
                        alt=""
                        className="h-16 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-[#d6a62b]/10 text-2xl">
                        🚘
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {vehicle.name}
                      </p>
                      <p className="mt-1 text-sm font-black text-[#f2c857]">
                        {formatPrice(vehicle.price, vehicle.currency)}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={submitEnquiry} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-[#9f874d]">
                        Your name *
                      </label>

                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7741]" />
                        <input
                          type="text"
                          required
                          value={enquiryName}
                          onChange={(event) =>
                            setEnquiryName(event.target.value)
                          }
                          placeholder="Your full name"
                          className="w-full rounded-2xl border border-[#d6a62b]/15 bg-black/35 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-[#d6a62b]/55 focus:ring-2 focus:ring-[#d6a62b]/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-[#9f874d]">
                          Phone number
                        </label>

                        <div className="relative">
                          <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7741]" />
                          <input
                            type="tel"
                            value={enquiryPhone}
                            onChange={(event) =>
                              setEnquiryPhone(event.target.value)
                            }
                            placeholder="+234..."
                            className="w-full rounded-2xl border border-[#d6a62b]/15 bg-black/35 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-[#d6a62b]/55 focus:ring-2 focus:ring-[#d6a62b]/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-[#9f874d]">
                          Email address
                        </label>

                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f7741]" />
                          <input
                            type="email"
                            value={enquiryEmail}
                            onChange={(event) =>
                              setEnquiryEmail(event.target.value)
                            }
                            placeholder="you@example.com"
                            className="w-full rounded-2xl border border-[#d6a62b]/15 bg-black/35 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-[#d6a62b]/55 focus:ring-2 focus:ring-[#d6a62b]/10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-[#9f874d]">
                        Message
                      </label>

                      <textarea
                        rows={4}
                        value={enquiryMessage}
                        onChange={(event) =>
                          setEnquiryMessage(event.target.value)
                        }
                        placeholder={`I'm interested in the ${vehicle.name}. Please contact me with more information.`}
                        className="w-full resize-none rounded-2xl border border-[#d6a62b]/15 bg-black/35 px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-700 focus:border-[#d6a62b]/55 focus:ring-2 focus:ring-[#d6a62b]/10"
                      />
                    </div>

                    {/* Invisible honeypot to reduce simple bot spam */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="website">Website</label>
                      <input
                        id="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={enquiryWebsite}
                        onChange={(event) =>
                          setEnquiryWebsite(event.target.value)
                        }
                      />
                    </div>

                    {enquiryError && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                        {enquiryError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={enquirySending}
                      className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-4 text-sm font-black text-black shadow-[0_15px_45px_rgba(214,166,43,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {enquirySending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                          Sending Enquiry...
                        </>
                      ) : (
                        <>
                          Send Enquiry
                          <FiArrowRight />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] leading-5 text-slate-600">
                      Please provide either a phone number or an email address
                      so the dealership can respond.
                    </p>
                  </form>
                </>
              ) : (
                <div className="py-8 text-center sm:py-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10 text-2xl text-green-300">
                    <FiCheck />
                  </div>

                  <p className="mt-6 text-[9px] font-black uppercase tracking-[0.24em] text-[#d6a62b]">
                    Enquiry Received
                  </p>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                    Thank you, {enquiryName || "your enquiry has been sent"}.
                  </h2>

                  <p className="mx-auto mt-4 max-w-[430px] text-sm leading-7 text-slate-500">
                    Your enquiry about <strong className="text-slate-300">{vehicle.name}</strong>{" "}
                    has been recorded for the Blessed God Is Great team.
                  </p>

                  <button
                    type="button"
                    onClick={closeEnquiry}
                    className="mt-7 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-7 py-3.5 text-sm font-black text-black"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 border-t border-[#d6a62b]/15 bg-[#020201]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 text-[10px] text-[#746442] sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 xl:px-12">
          <p>© 2026 BLESSED GOD IS GREAT MOTOR AUTOS INT'L VENTURES</p>
          <Link href="/" className="font-bold text-[#b99b53] hover:text-[#f2c857]">
            Back to Blessed God Is Great
          </Link>
        </div>
      </footer>
    </main>
  );
}
