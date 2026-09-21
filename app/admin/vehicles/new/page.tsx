"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiImage,
  FiInfo,
  FiSave,
  FiStar,
  FiUpload,
  FiVideo,
  FiX,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

type VehicleStatus =
  | "available"
  | "reserved"
  | "sold"
  | "hidden";

const BRAND_OPTIONS = [
  "Toyota",
  "Lexus",
  "Mercedes-Benz",
  "BMW",
  "Range Rover",
  "Honda",
  "Audi",
  "Porsche",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
];

const TRANSMISSION_OPTIONS = [
  "Automatic",
  "Manual",
  "CVT",
  "Semi-Automatic",
];

const STATUS_OPTIONS: {
  value: VehicleStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "available",
    label: "Available",
    description: "Visible to customers and ready for sale.",
  },
  {
    value: "reserved",
    label: "Reserved",
    description: "Visible, but marked as reserved.",
  },
  {
    value: "sold",
    label: "Sold",
    description: "Visible, but clearly marked as sold.",
  },
  {
    value: "hidden",
    label: "Hidden",
    description: "Saved in admin but hidden from customers.",
  },
];

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function formatNaira(value: string) {
  const amount = Number(value);

  if (!value.trim() || Number.isNaN(amount)) {
    return "₦0";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function NewVehiclePage() {
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [uploadStage, setUploadStage] =
    useState("");

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");

  const [transmission, setTransmission] =
    useState("Automatic");

  const [color, setColor] = useState("");

  const [status, setStatus] =
    useState<VehicleStatus>("available");

  const [description, setDescription] =
    useState("");

  const [featured, setFeatured] =
    useState(false);

  const [images, setImages] =
    useState<File[]>([]);

  const [video, setVideo] =
    useState<File | null>(null);

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  const completedBasics = useMemo(() => {
    let count = 0;

    if (name.trim()) count++;
    if (brand.trim()) count++;
    if (model.trim()) count++;
    if (year.trim()) count++;
    if (price.trim()) count++;
    if (color.trim()) count++;

    return count;
  }, [name, brand, model, year, price, color]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    };
  }, [imagePreviews]);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc("is_admin");

      if (adminError || !isAdmin) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [router]);

  const handleImages = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setError("");

    const selected = Array.from(
      event.target.files || [],
    );

    if (!selected.length) {
      return;
    }

    const invalidType = selected.find(
      (file) => !file.type.startsWith("image/"),
    );

    if (invalidType) {
      setError(
        "Only image files can be added to the vehicle gallery.",
      );
      return;
    }

    const tooLarge = selected.find(
      (file) =>
        file.size > 10 * 1024 * 1024,
    );

    if (tooLarge) {
      setError(
        `${tooLarge.name} is larger than 10 MB. Please use a smaller image.`,
      );
      return;
    }

    const combined = [...images, ...selected];

    if (combined.length > 15) {
      setError(
        "You can upload a maximum of 15 photos per vehicle.",
      );
      return;
    }

    setImages(combined);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((current) =>
      current.filter(
        (_, currentIndex) =>
          currentIndex !== index,
      ),
    );
  };

  const makeCover = (index: number) => {
    if (index === 0) {
      return;
    }

    setImages((current) => {
      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  };

  const moveImage = (
    index: number,
    direction: "left" | "right",
  ) => {
    const targetIndex =
      direction === "left"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= images.length
    ) {
      return;
    }

    setImages((current) => {
      const next = [...current];

      [
        next[index],
        next[targetIndex],
      ] = [
        next[targetIndex],
        next[index],
      ];

      return next;
    });
  };

  const handleVideo = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setError("");

    const selected =
      event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (!selected.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    if (
      selected.size >
      100 * 1024 * 1024
    ) {
      setError(
        "The video is larger than 100 MB. Please compress it before uploading.",
      );

      return;
    }

    setVideo(selected);
  };

  const uploadFile = async (
    file: File,
    vehicleId: string,
    folder: "images" | "videos",
  ) => {
    const extensionSafeName =
      safeFileName(file.name);

    const path =
      `${vehicleId}/${folder}/` +
      `${crypto.randomUUID()}-${extensionSafeName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("vehicle-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload ${file.name}: ${uploadError.message}`,
      );
    }

    const { data } =
      supabase.storage
        .from("vehicle-media")
        .getPublicUrl(path);

    return {
      path,
      publicUrl: data.publicUrl,
    };
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setUploadStage("");
    setUploadProgress(0);

    if (!name.trim()) {
      setError(
        "Please enter the vehicle name.",
      );
      return;
    }

    if (!brand.trim()) {
      setError(
        "Please enter the vehicle brand.",
      );
      return;
    }

    if (!images.length) {
      setError(
        "Please upload at least one vehicle photo.",
      );
      return;
    }

    setSaving(true);

    const vehicleId =
      crypto.randomUUID();

    try {
      setUploadStage(
        "Creating vehicle record...",
      );
      setUploadProgress(8);

      const {
        error: vehicleError,
      } = await supabase
        .from("vehicles")
        .insert({
          id: vehicleId,

          name: name.trim(),
          brand: brand.trim(),

          model:
            model.trim() || null,

          year:
            year.trim()
              ? Number(year)
              : null,

          price:
            price.trim()
              ? Number(price)
              : null,

          currency: "NGN",

          mileage:
            mileage.trim()
              ? Number(mileage)
              : null,

          transmission:
            transmission.trim() || null,

          color:
            color.trim() || null,

          status,

          description:
            description.trim() || null,

          is_featured: featured,

          cover_image_url: null,
          video_url: null,
        });

      if (vehicleError) {
        throw new Error(
          vehicleError.message,
        );
      }

      const uploadedImages: {
        publicUrl: string;
        path: string;
      }[] = [];

      for (
        let index = 0;
        index < images.length;
        index++
      ) {
        const file = images[index];

        setUploadStage(
          `Uploading photo ${index + 1} of ${images.length}...`,
        );

        const uploaded =
          await uploadFile(
            file,
            vehicleId,
            "images",
          );

        uploadedImages.push(uploaded);

        setUploadProgress(
          Math.round(
            10 +
              ((index + 1) /
                Math.max(images.length, 1)) *
                60,
          ),
        );
      }

      setUploadStage(
        "Saving photo gallery...",
      );
      setUploadProgress(74);

      const imageRows =
        uploadedImages.map(
          (uploaded, index) => ({
            vehicle_id: vehicleId,

            image_url:
              uploaded.publicUrl,

            sort_order: index,
          }),
        );

      const {
        error: imageInsertError,
      } = await supabase
        .from("vehicle_images")
        .insert(imageRows);

      if (imageInsertError) {
        throw new Error(
          imageInsertError.message,
        );
      }

      let videoUrl: string | null =
        null;

      if (video) {
        setUploadStage(
          "Uploading walk-around video...",
        );
        setUploadProgress(82);

        const uploadedVideo =
          await uploadFile(
            video,
            vehicleId,
            "videos",
          );

        videoUrl =
          uploadedVideo.publicUrl;
      }

      setUploadStage(
        "Finishing vehicle listing...",
      );
      setUploadProgress(92);

      const coverImage =
        uploadedImages[0]?.publicUrl ||
        null;

      const {
        error: updateError,
      } = await supabase
        .from("vehicles")
        .update({
          cover_image_url: coverImage,
          video_url: videoUrl,
        })
        .eq("id", vehicleId);

      if (updateError) {
        throw new Error(
          updateError.message,
        );
      }

      setUploadProgress(100);
      setUploadStage("Vehicle published.");
      setSuccess(
        status === "hidden"
          ? "Vehicle saved successfully and hidden from customers."
          : "Vehicle published successfully.",
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 900);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing the vehicle.";

      setError(message);
      setSaving(false);
      setUploadStage("");
    }
  };

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d6a62b]/30 border-t-[#f2c857]" />

          <p className="text-sm text-[#8f7741]">
            Verifying administrator...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-5 md:px-8">
          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="flex items-center gap-2 text-xs font-bold text-[#c6a653] transition hover:text-[#f2c857]"
          >
            <FiArrowLeft />
            Dashboard
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-[12px] font-black italic tracking-[-0.06em] text-[#fff0b0]">
              BGG
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-[0.06em]">
                BLESSED GOD IS GREAT
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.18em] text-[#d6a62b]">
                ADD VEHICLE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[1280px] px-4 py-7 sm:px-5 md:px-8 md:py-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* MAIN FORM */}

          <form
            id="vehicle-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="rounded-[28px] border border-[#d6a62b]/15 bg-gradient-to-br from-[#0e0c08] to-[#080705] p-5 sm:p-7">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d6a62b]">
                Inventory Management
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Add a vehicle
              </h1>

              <p className="mt-3 max-w-[700px] text-sm leading-7 text-slate-400">
                Fill in the important details, add photos and publish. The first
                photo is the cover photo shown to customers.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <MiniStat
                  label="Details"
                  value={`${completedBasics}/6`}
                  complete={completedBasics >= 4}
                />

                <MiniStat
                  label="Photos"
                  value={`${images.length}/15`}
                  complete={images.length > 0}
                />

                <MiniStat
                  label="Status"
                  value={
                    STATUS_OPTIONS.find(
                      (item) =>
                        item.value === status,
                    )?.label || "Available"
                  }
                  complete
                />
              </div>
            </div>

            {/* BASIC DETAILS */}

            <Panel
              number="01"
              title="Vehicle details"
              subtitle="The main information customers will see."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Vehicle Name *">
                  <input
                    required
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="e.g. Lexus LX 570"
                    className="gz-input"
                  />
                </Field>

                <Field label="Brand *">
                  <input
                    required
                    list="vehicle-brands"
                    value={brand}
                    onChange={(e) =>
                      setBrand(e.target.value)
                    }
                    placeholder="Choose or type a brand"
                    className="gz-input"
                  />

                  <datalist id="vehicle-brands">
                    {BRAND_OPTIONS.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        />
                      ),
                    )}
                  </datalist>
                </Field>

                <Field label="Model">
                  <input
                    value={model}
                    onChange={(e) =>
                      setModel(e.target.value)
                    }
                    placeholder="e.g. LX 570"
                    className="gz-input"
                  />
                </Field>

                <Field label="Year">
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    value={year}
                    onChange={(e) =>
                      setYear(e.target.value)
                    }
                    placeholder="2024"
                    className="gz-input"
                  />
                </Field>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
                  Quick brand selection
                </p>

                <div className="flex flex-wrap gap-2">
                  {BRAND_OPTIONS.slice(
                    0,
                    8,
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setBrand(item)
                      }
                      className={`rounded-full border px-3.5 py-2 text-[10px] font-black transition ${
                        brand === item
                          ? "border-[#d6a62b] bg-[#d6a62b] text-black"
                          : "border-[#d6a62b]/15 bg-black/20 text-slate-400 hover:border-[#d6a62b]/35 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            {/* PRICE + SPECS */}

            <Panel
              number="02"
              title="Price & specifications"
              subtitle="Keep this simple and accurate for customers."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Price (NGN)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value)
                    }
                    placeholder="85000000"
                    className="gz-input"
                  />

                  <p className="mt-2 text-xs font-bold text-[#d6a62b]">
                    {formatNaira(price)}
                  </p>
                </Field>

                <Field label="Mileage (km)">
                  <input
                    type="number"
                    min="0"
                    value={mileage}
                    onChange={(e) =>
                      setMileage(
                        e.target.value,
                      )
                    }
                    placeholder="15000"
                    className="gz-input"
                  />
                </Field>

                <Field label="Transmission">
                  <select
                    value={transmission}
                    onChange={(e) =>
                      setTransmission(
                        e.target.value,
                      )
                    }
                    className="gz-input"
                  >
                    {TRANSMISSION_OPTIONS.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Colour">
                  <input
                    value={color}
                    onChange={(e) =>
                      setColor(e.target.value)
                    }
                    placeholder="e.g. Black"
                    className="gz-input"
                  />
                </Field>
              </div>
            </Panel>

            {/* DESCRIPTION */}

            <Panel
              number="03"
              title="Description"
              subtitle="Add condition, notable features and anything buyers should know."
            >
              <textarea
                rows={6}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value,
                  )
                }
                placeholder="Example: Clean 2024 Lexus LX 570, automatic transmission, excellent interior, low mileage, reverse camera, leather seats..."
                className="gz-input resize-none"
              />

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#d6a62b]/10 bg-[#d6a62b]/[0.04] px-4 py-3">
                <FiInfo className="mt-0.5 shrink-0 text-[#d6a62b]" />

                <p className="text-[11px] leading-5 text-slate-500">
                  Keep descriptions short and factual. Customers can contact you
                  for additional details.
                </p>
              </div>
            </Panel>

            {/* PUBLISH SETTINGS */}

            <Panel
              number="04"
              title="Publishing"
              subtitle="Choose how the vehicle should appear on the website."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {STATUS_OPTIONS.map(
                  (item) => {
                    const active =
                      status ===
                      item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setStatus(
                            item.value,
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-[#d6a62b]/60 bg-[#d6a62b]/10"
                            : "border-white/5 bg-black/20 hover:border-[#d6a62b]/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`text-sm font-black ${
                              active
                                ? "text-[#f2c857]"
                                : "text-white"
                            }`}
                          >
                            {item.label}
                          </span>

                          {active && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d6a62b] text-xs text-black">
                              <FiCheck />
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setFeatured(
                    (current) =>
                      !current,
                  )
                }
                className={`mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                  featured
                    ? "border-[#d6a62b]/55 bg-[#d6a62b]/10"
                    : "border-white/5 bg-black/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      featured
                        ? "bg-[#d6a62b] text-black"
                        : "bg-white/5 text-[#8f7741]"
                    }`}
                  >
                    <FiStar />
                  </span>

                  <div>
                    <p className="text-sm font-black">
                      Featured vehicle
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Featured vehicles appear before regular inventory.
                    </p>
                  </div>
                </div>

                <div
                  className={`relative h-7 w-12 rounded-full transition ${
                    featured
                      ? "bg-[#d6a62b]"
                      : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      featured
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </div>
              </button>
            </Panel>

            {/* PHOTOS */}

            <Panel
              number="05"
              title="Vehicle photos"
              subtitle="Upload up to 15 photos. Pick the strongest photo as the cover."
              icon={<FiImage />}
            >
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d6a62b]/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="text-xs font-black text-white">
                    Photo gallery
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    First photo = cover image
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                    images.length
                      ? "bg-[#d6a62b]/12 text-[#f2c857]"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {images.length}/15
                </span>
              </div>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/30 bg-black/25 px-5 py-9 text-center transition hover:border-[#d6a62b]/60 hover:bg-[#d6a62b]/5">
                <FiUpload className="text-3xl text-[#f2c857]" />

                <span className="mt-4 text-sm font-black">
                  Add vehicle photos
                </span>

                <span className="mt-2 max-w-[500px] text-xs leading-6 text-slate-500">
                  Select several photos at once. Maximum 10 MB each.
                </span>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImages}
                  className="hidden"
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {imagePreviews.map(
                    (
                      preview,
                      index,
                    ) => (
                      <article
                        key={`${preview.file.name}-${index}`}
                        className="overflow-hidden rounded-2xl border border-[#d6a62b]/15 bg-black/30"
                      >
                        <div className="group relative aspect-[4/3] overflow-hidden bg-black">
                          <img
                            src={
                              preview.url
                            }
                            alt={`Vehicle photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {index === 0 && (
                            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#d6a62b] px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-black">
                              <FiStar />
                              Cover
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index,
                              )
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur transition hover:bg-red-600"
                            aria-label="Remove photo"
                          >
                            <FiX />
                          </button>
                        </div>

                        <div className="p-2.5">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                makeCover(
                                  index,
                                )
                              }
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d6a62b]/15 bg-[#d6a62b]/5 px-2 py-2 text-[9px] font-black text-[#d6a62b] transition hover:bg-[#d6a62b]/10"
                            >
                              <FiStar />
                              Make Cover
                            </button>
                          )}

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={
                                index === 0
                              }
                              onClick={() =>
                                moveImage(
                                  index,
                                  "left",
                                )
                              }
                              className="flex items-center justify-center rounded-lg border border-white/5 py-2 text-xs text-slate-400 disabled:opacity-20"
                            >
                              <FiChevronLeft />
                            </button>

                            <button
                              type="button"
                              disabled={
                                index ===
                                images.length -
                                  1
                              }
                              onClick={() =>
                                moveImage(
                                  index,
                                  "right",
                                )
                              }
                              className="flex items-center justify-center rounded-lg border border-white/5 py-2 text-xs text-slate-400 disabled:opacity-20"
                            >
                              <FiChevronRight />
                            </button>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </Panel>

            {/* VIDEO */}

            <Panel
              number="06"
              title="Walk-around video"
              subtitle="Optional. Add one short vehicle video."
              icon={<FiVideo />}
            >
              {!video ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/30 bg-black/25 px-5 py-9 text-center transition hover:bg-[#d6a62b]/5">
                  <FiUpload className="text-2xl text-[#f2c857]" />

                  <span className="mt-3 text-sm font-black">
                    Select video
                  </span>

                  <span className="mt-2 text-xs text-slate-500">
                    Maximum 100 MB
                  </span>

                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideo}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d6a62b]/15 bg-black/30 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {video.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(
                        video.size /
                        1024 /
                        1024
                      ).toFixed(1)}{" "}
                      MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setVideo(null)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300"
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </Panel>

            {/* MESSAGES */}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm leading-6 text-red-300">
                <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm font-bold text-green-300">
                <FiCheck />
                {success}
              </div>
            )}

            {saving && (
              <div className="rounded-2xl border border-[#d6a62b]/20 bg-[#d6a62b]/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold text-[#f2c857]">
                    {uploadStage}
                  </p>

                  <span className="text-xs font-black text-[#f2c857]">
                    {uploadProgress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </form>

          {/* DESKTOP SUMMARY */}

          <aside className="hidden lg:block">
            <div className="sticky top-[96px] space-y-4">
              <div className="rounded-[24px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
                  Listing Preview
                </p>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-black/30">
                  <div className="aspect-[4/3] bg-black">
                    {imagePreviews[0] ? (
                      <img
                        src={
                          imagePreviews[0]
                            .url
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-[#55451f]">
                        <FiImage />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-lg font-black">
                      {name.trim() ||
                        "Vehicle name"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        brand.trim(),
                        model.trim(),
                        year.trim(),
                      ]
                        .filter(Boolean)
                        .join(" • ") ||
                        "Brand • Model • Year"}
                    </p>

                    <p className="mt-4 text-lg font-black text-[#f2c857]">
                      {price.trim()
                        ? formatNaira(
                            price,
                          )
                        : "Price on request"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <SummaryRow
                    icon={<FiImage />}
                    label="Photos"
                    value={`${images.length}/15`}
                  />

                  <SummaryRow
                    icon={
                      status ===
                      "hidden" ? (
                        <FiEyeOff />
                      ) : (
                        <FiEye />
                      )
                    }
                    label="Visibility"
                    value={
                      STATUS_OPTIONS.find(
                        (item) =>
                          item.value ===
                          status,
                      )?.label ||
                      "Available"
                    }
                  />

                  <SummaryRow
                    icon={<FiStar />}
                    label="Featured"
                    value={
                      featured
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5">
                <p className="text-xs font-black text-white">
                  Before publishing
                </p>

                <div className="mt-4 space-y-3">
                  <ChecklistItem
                    done={Boolean(
                      name.trim(),
                    )}
                    text="Vehicle name"
                  />

                  <ChecklistItem
                    done={Boolean(
                      brand.trim(),
                    )}
                    text="Brand"
                  />

                  <ChecklistItem
                    done={
                      images.length > 0
                    }
                    text="At least one photo"
                  />

                  <ChecklistItem
                    done={Boolean(
                      price.trim(),
                    )}
                    text="Price added"
                    optional
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* STICKY ACTION BAR */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d6a62b]/15 bg-[#050403]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              router.push("/admin")
            }
            className="rounded-full border border-[#d6a62b]/20 px-5 py-3 text-xs font-bold text-[#c7a954] transition hover:bg-[#d6a62b]/5 disabled:opacity-50 sm:px-7"
          >
            Cancel
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-black text-white">
              {images.length
                ? `${images.length} photo${images.length === 1 ? "" : "s"} selected`
                : "Add at least one photo"}
            </p>

            <p className="mt-1 text-[9px] text-slate-600">
              {status === "hidden"
                ? "This listing will stay hidden."
                : "This listing will be visible to customers."}
            </p>
          </div>

          <button
            type="submit"
            form="vehicle-form"
            disabled={saving}
            className="flex min-w-[165px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-xs font-black text-[#080603] shadow-[0_15px_45px_rgba(214,166,43,0.18)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[200px] sm:text-sm"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                Publishing...
              </>
            ) : status ===
              "hidden" ? (
              <>
                <FiSave />
                Save Hidden
              </>
            ) : (
              <>
                <FiUpload />
                Publish Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function Panel({
  number,
  title,
  subtitle,
  icon,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d6a62b]/20 bg-[#d6a62b]/8 text-xs font-black text-[#f2c857]">
          {icon || number}
        </div>

        <div>
          <h2 className="text-lg font-black">
            {title}
          </h2>

          <p className="mt-1.5 text-xs leading-6 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
        {label}
      </label>

      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
  complete,
}: {
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            complete
              ? "bg-green-400"
              : "bg-[#55451f]"
          }`}
        />

        <p className="truncate text-xs font-black text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-[#8f7741]">
          {icon}
        </span>

        <span className="text-[10px] font-bold">
          {label}
        </span>
      </div>

      <span className="text-[10px] font-black text-white">
        {value}
      </span>
    </div>
  );
}

function ChecklistItem({
  done,
  text,
  optional = false,
}: {
  done: boolean;
  text: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
          done
            ? "bg-green-500/15 text-green-300"
            : "bg-white/5 text-slate-700"
        }`}
      >
        {done ? <FiCheck /> : "•"}
      </span>

      <span
        className={`text-[11px] ${
          done
            ? "text-slate-300"
            : "text-slate-600"
        }`}
      >
        {text}
        {optional && (
          <span className="ml-1 text-[9px] text-slate-700">
            (optional)
          </span>
        )}
      </span>
    </div>
  );
}
