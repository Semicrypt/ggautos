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
  FiArrowLeft,
  FiCheck,
  FiImage,
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

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export default function NewVehiclePage() {
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.url)
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
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const selected = Array.from(
      event.target.files || []
    );

    if (!selected.length) {
      return;
    }

    const invalidType = selected.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidType) {
      setError(
        "Only image files can be added to the vehicle gallery."
      );
      return;
    }

    const tooLarge = selected.find(
      (file) =>
        file.size > 10 * 1024 * 1024
    );

    if (tooLarge) {
      setError(
        `${tooLarge.name} is larger than 10 MB. Please use a smaller image.`
      );
      return;
    }

    const combined = [...images, ...selected];

    if (combined.length > 15) {
      setError(
        "You can upload a maximum of 15 photos per vehicle."
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
          currentIndex !== index
      )
    );
  };

  const handleVideo = (
    event: ChangeEvent<HTMLInputElement>
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
        "The video is larger than 100 MB. Please compress it before uploading."
      );

      return;
    }

    setVideo(selected);
  };

  const uploadFile = async (
    file: File,
    vehicleId: string,
    folder: "images" | "videos"
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
        `Failed to upload ${file.name}: ${uploadError.message}`
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
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Please enter the vehicle name."
      );
      return;
    }

    if (!brand.trim()) {
      setError(
        "Please enter the vehicle brand."
      );
      return;
    }

    if (!images.length) {
      setError(
        "Please upload at least one vehicle photo."
      );
      return;
    }

    setSaving(true);

    const vehicleId =
      crypto.randomUUID();

    try {
      /*
       * Create vehicle first.
       * We deliberately supply our own UUID
       * so the same ID can be used for the
       * Storage folder.
       */

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
          vehicleError.message
        );
      }

      /*
       * Upload all images.
       */

      const uploadedImages: {
        publicUrl: string;
        path: string;
      }[] = [];

      for (const file of images) {
        const uploaded =
          await uploadFile(
            file,
            vehicleId,
            "images"
          );

        uploadedImages.push(uploaded);
      }

      /*
       * Store gallery records.
       */

      const imageRows =
        uploadedImages.map(
          (uploaded, index) => ({
            vehicle_id: vehicleId,

            image_url:
              uploaded.publicUrl,

            sort_order: index,
          })
        );

      const {
        error: imageInsertError,
      } = await supabase
        .from("vehicle_images")
        .insert(imageRows);

      if (imageInsertError) {
        throw new Error(
          imageInsertError.message
        );
      }

      /*
       * Optional walk-around video.
       */

      let videoUrl: string | null =
        null;

      if (video) {
        const uploadedVideo =
          await uploadFile(
            video,
            vehicleId,
            "videos"
          );

        videoUrl =
          uploadedVideo.publicUrl;
      }

      /*
       * The first photo becomes
       * the cover image.
       */

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
          updateError.message
        );
      }

      setSuccess(
        "Vehicle published successfully."
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing the vehicle.";

      setError(message);
      setSaving(false);
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
    <main className="min-h-screen bg-[#050403] text-white">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-sm font-black italic text-[#fff0b0]">
              GZ
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-[0.07em]">
                GREAT ZUBY
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.2em] text-[#d6a62b]">
                ADD VEHICLE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-5 md:px-8 md:py-12">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d6a62b]">
            Inventory Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
            Add New Vehicle
          </h1>

          <p className="mt-3 max-w-[650px] text-sm leading-7 text-slate-500">
            Add the vehicle information,
            photographs and optional
            walk-around video. The first
            uploaded photo becomes the
            vehicle cover image.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-7"
        >
          {/* BASIC INFORMATION */}

          <section className="rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-black">
                Vehicle Information
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Main information customers
                will see.
              </p>
            </div>

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
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value)
                  }
                  placeholder="e.g. Lexus"
                  className="gz-input"
                />
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
              </Field>

              <Field label="Mileage">
                <input
                  type="number"
                  min="0"
                  value={mileage}
                  onChange={(e) =>
                    setMileage(
                      e.target.value
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
                      e.target.value
                    )
                  }
                  className="gz-input"
                >
                  <option>
                    Automatic
                  </option>
                  <option>
                    Manual
                  </option>
                  <option>
                    CVT
                  </option>
                  <option>
                    Semi-Automatic
                  </option>
                </select>
              </Field>

              <Field label="Colour">
                <input
                  value={color}
                  onChange={(e) =>
                    setColor(e.target.value)
                  }
                  placeholder="Black"
                  className="gz-input"
                />
              </Field>

              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target
                        .value as VehicleStatus
                    )
                  }
                  className="gz-input"
                >
                  <option value="available">
                    Available
                  </option>

                  <option value="reserved">
                    Reserved
                  </option>

                  <option value="sold">
                    Sold
                  </option>

                  <option value="hidden">
                    Hidden
                  </option>
                </select>
              </Field>

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#d6a62b]/15 bg-black/25 px-4 py-[14px]">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) =>
                      setFeatured(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 accent-[#d6a62b]"
                  />

                  <span className="text-sm font-bold text-slate-300">
                    Feature this vehicle
                  </span>
                </label>
              </div>
            </div>

            <Field
              label="Description"
              className="mt-5"
            >
              <textarea
                rows={6}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Describe the vehicle, condition, specifications, features, etc."
                className="gz-input resize-none"
              />
            </Field>
          </section>

          {/* PHOTOS */}

          <section className="rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <FiImage className="text-xl text-[#f2c857]" />

                  <h2 className="text-lg font-black">
                    Vehicle Photos
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Upload up to 15 photos.
                  The first photo becomes the
                  main cover image.
                </p>
              </div>

              <span className="text-xs font-bold text-[#8f7741]">
                {images.length}/15
              </span>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/30 bg-black/25 px-5 py-10 text-center transition hover:border-[#d6a62b]/60 hover:bg-[#d6a62b]/5">
              <FiUpload className="text-3xl text-[#f2c857]" />

              <span className="mt-4 text-sm font-black">
                Select vehicle photos
              </span>

              <span className="mt-2 text-xs text-slate-500">
                JPG, PNG, WEBP and other
                image formats — maximum 10 MB
                each
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
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {imagePreviews.map(
                  (preview, index) => (
                    <div
                      key={`${preview.file.name}-${index}`}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#d6a62b]/15 bg-black"
                    >
                      <img
                        src={preview.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />

                      {index === 0 && (
                        <div className="absolute left-2 top-2 rounded-full bg-[#d6a62b] px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-black">
                          Cover
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(index)
                        }
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur transition hover:bg-red-600"
                      >
                        <FiX />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* VIDEO */}

          <section className="rounded-[26px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <FiVideo className="text-xl text-[#f2c857]" />

              <h2 className="text-lg font-black">
                Walk-around Video
              </h2>
            </div>

            <p className="mt-2 text-xs leading-6 text-slate-500">
              Optional. Upload one video of
              the vehicle. Maximum size for
              this form is 100 MB.
            </p>

            {!video ? (
              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/30 bg-black/25 px-5 py-9 text-center transition hover:bg-[#d6a62b]/5">
                <FiUpload className="text-2xl text-[#f2c857]" />

                <span className="mt-3 text-sm font-black">
                  Select video
                </span>

                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideo}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-[#d6a62b]/15 bg-black/30 p-4">
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
          </section>

          {/* MESSAGES */}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm leading-6 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm font-bold text-green-300">
              <FiCheck />
              {success}
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 pb-10 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                router.push("/admin")
              }
              className="rounded-full border border-[#d6a62b]/20 px-7 py-4 text-sm font-bold text-[#c7a954] transition hover:bg-[#d6a62b]/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-8 py-4 text-sm font-black text-[#080603] shadow-[0_15px_45px_rgba(214,166,43,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />

                  Publishing...
                </>
              ) : (
                <>
                  <FiUpload />
                  Publish Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
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