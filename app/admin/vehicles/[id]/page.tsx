"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEyeOff,
  FiImage,
  FiSave,
  FiStar,
  FiTrash2,
  FiUpload,
  FiX,
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

  description: string | null;

  cover_image_url: string | null;
  video_url: string | null;

  is_featured: boolean;
};

type VehicleImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

/* =========================================================
   HELPERS
========================================================= */

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function getStoragePathFromPublicUrl(
  publicUrl: string
) {
  const marker =
    "/storage/v1/object/public/vehicle-media/";

  const index =
    publicUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(
    publicUrl.slice(
      index + marker.length
    )
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ManageVehiclePage() {
  const router = useRouter();
  const params = useParams();

  const vehicleId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [uploadingImages, setUploadingImages] =
    useState(false);

  const [imageActionId, setImageActionId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);

  const [images, setImages] =
    useState<VehicleImage[]>([]);

  const [name, setName] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [model, setModel] =
    useState("");

  const [year, setYear] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [mileage, setMileage] =
    useState("");

  const [
    transmission,
    setTransmission,
  ] = useState("Automatic");

  const [color, setColor] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<VehicleStatus>(
      "available"
    );

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    featured,
    setFeatured,
  ] = useState(false);

  /* =========================================================
     LOAD VEHICLE
  ========================================================= */

  const loadVehicle =
    useCallback(async () => {
      if (!vehicleId) {
        setError(
          "Invalid vehicle ID."
        );

        setLoading(false);
        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/admin/login"
        );

        return;
      }

      const {
        data: isAdmin,
        error: adminError,
      } =
        await supabase.rpc(
          "is_admin"
        );

      if (
        adminError ||
        !isAdmin
      ) {
        await supabase.auth.signOut();

        router.replace(
          "/admin/login"
        );

        return;
      }

      const {
        data: vehicleData,
        error: vehicleError,
      } =
        await supabase
          .from("vehicles")
          .select("*")
          .eq(
            "id",
            vehicleId
          )
          .single();

      if (vehicleError) {
        setError(
          `Unable to load vehicle: ${vehicleError.message}`
        );

        setLoading(false);
        return;
      }

      const loaded =
        vehicleData as Vehicle;

      setVehicle(loaded);

      setName(
        loaded.name || ""
      );

      setBrand(
        loaded.brand || ""
      );

      setModel(
        loaded.model || ""
      );

      setYear(
        loaded.year
          ? String(
              loaded.year
            )
          : ""
      );

      setPrice(
        loaded.price !== null
          ? String(
              loaded.price
            )
          : ""
      );

      setMileage(
        loaded.mileage !== null
          ? String(
              loaded.mileage
            )
          : ""
      );

      setTransmission(
        loaded.transmission ||
          "Automatic"
      );

      setColor(
        loaded.color || ""
      );

      setStatus(
        loaded.status
      );

      setDescription(
        loaded.description ||
          ""
      );

      setFeatured(
        loaded.is_featured
      );

      const {
        data: imageData,
        error: imageError,
      } =
        await supabase
          .from(
            "vehicle_images"
          )
          .select(
            `
            id,
            image_url,
            sort_order
          `
          )
          .eq(
            "vehicle_id",
            vehicleId
          )
          .order(
            "sort_order",
            {
              ascending: true,
            }
          );

      if (imageError) {
        setError(
          `Vehicle loaded, but gallery could not be loaded: ${imageError.message}`
        );
      }

      setImages(
        (imageData as VehicleImage[]) ||
          []
      );

      setLoading(false);
    }, [
      router,
      vehicleId,
    ]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  /* =========================================================
     SAVE VEHICLE INFO
  ========================================================= */

  const handleSave =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!vehicleId) {
        return;
      }

      setError("");
      setSuccess("");
      setSaving(true);

      const {
        error: updateError,
      } =
        await supabase
          .from("vehicles")
          .update({
            name:
              name.trim(),

            brand:
              brand.trim(),

            model:
              model.trim() ||
              null,

            year:
              year.trim()
                ? Number(year)
                : null,

            price:
              price.trim()
                ? Number(price)
                : null,

            mileage:
              mileage.trim()
                ? Number(
                    mileage
                  )
                : null,

            transmission:
              transmission ||
              null,

            color:
              color.trim() ||
              null,

            status,

            description:
              description.trim() ||
              null,

            is_featured:
              featured,
          })
          .eq(
            "id",
            vehicleId
          );

      if (updateError) {
        setError(
          updateError.message
        );

        setSaving(false);
        return;
      }

      setSuccess(
        "Vehicle updated successfully."
      );

      setSaving(false);

      await loadVehicle();
    };

  /* =========================================================
     MARK SOLD
  ========================================================= */

  const markSold =
    async () => {
      setError("");
      setSuccess("");

      const {
        error: soldError,
      } =
        await supabase
          .from("vehicles")
          .update({
            status:
              "sold",
          })
          .eq(
            "id",
            vehicleId
          );

      if (soldError) {
        setError(
          soldError.message
        );

        return;
      }

      setStatus("sold");

      setSuccess(
        "Vehicle marked as sold."
      );
    };

  /* =========================================================
     HIDE VEHICLE
  ========================================================= */

  const hideVehicle =
    async () => {
      const confirmed =
        window.confirm(
          "Hide this vehicle from the public website?"
        );

      if (!confirmed) {
        return;
      }

      const {
        error: hideError,
      } =
        await supabase
          .from("vehicles")
          .update({
            status:
              "hidden",
          })
          .eq(
            "id",
            vehicleId
          );

      if (hideError) {
        setError(
          hideError.message
        );

        return;
      }

      setStatus(
        "hidden"
      );

      setSuccess(
        "Vehicle is now hidden from customers."
      );
    };

  /* =========================================================
     UPLOAD MORE IMAGES
  ========================================================= */

  const uploadMoreImages =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      setError("");
      setSuccess("");

      const selected =
        Array.from(
          event.target.files ||
            []
        );

      event.target.value =
        "";

      if (!selected.length) {
        return;
      }

      if (
        images.length +
          selected.length >
        15
      ) {
        setError(
          `You currently have ${images.length} photos. A vehicle can have a maximum of 15 photos.`
        );

        return;
      }

      const invalid =
        selected.find(
          (file) =>
            !file.type.startsWith(
              "image/"
            )
        );

      if (invalid) {
        setError(
          `${invalid.name} is not a valid image file.`
        );

        return;
      }

      const tooLarge =
        selected.find(
          (file) =>
            file.size >
            10 *
              1024 *
              1024
        );

      if (tooLarge) {
        setError(
          `${tooLarge.name} is larger than 10 MB.`
        );

        return;
      }

      setUploadingImages(
        true
      );

      try {
        let nextSortOrder =
          images.length > 0
            ? Math.max(
                ...images.map(
                  (image) =>
                    image.sort_order
                )
              ) + 1
            : 0;

        const newRows: {
          vehicle_id: string;
          image_url: string;
          sort_order: number;
        }[] = [];

        for (const file of selected) {
          const fileName =
            `${crypto.randomUUID()}-${safeFileName(
              file.name
            )}`;

          const path =
            `${vehicleId}/images/${fileName}`;

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                "vehicle-media"
              )
              .upload(
                path,
                file,
                {
                  cacheControl:
                    "3600",

                  upsert:
                    false,

                  contentType:
                    file.type,
                }
              );

          if (uploadError) {
            throw new Error(
              `${file.name}: ${uploadError.message}`
            );
          }

          const {
            data: publicUrlData,
          } =
            supabase.storage
              .from(
                "vehicle-media"
              )
              .getPublicUrl(
                path
              );

          newRows.push({
            vehicle_id:
              vehicleId,

            image_url:
              publicUrlData.publicUrl,

            sort_order:
              nextSortOrder,
          });

          nextSortOrder++;
        }

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "vehicle_images"
            )
            .insert(
              newRows
            );

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        /*
         * If somehow the car has
         * no cover image, make the
         * first new upload the cover.
         */

        if (
          !vehicle?.cover_image_url &&
          newRows[0]
        ) {
          const {
            error:
              coverError,
          } =
            await supabase
              .from(
                "vehicles"
              )
              .update({
                cover_image_url:
                  newRows[0]
                    .image_url,
              })
              .eq(
                "id",
                vehicleId
              );

          if (coverError) {
            throw new Error(
              coverError.message
            );
          }
        }

        setSuccess(
          `${selected.length} photo${
            selected.length ===
            1
              ? ""
              : "s"
          } uploaded successfully.`
        );

        await loadVehicle();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to upload photos."
        );
      } finally {
        setUploadingImages(
          false
        );
      }
    };

  /* =========================================================
     SET COVER IMAGE
  ========================================================= */

  const setCoverImage =
    async (
      image: VehicleImage
    ) => {
      setError("");
      setSuccess("");

      setImageActionId(
        image.id
      );

      const {
        error:
          updateError,
      } =
        await supabase
          .from("vehicles")
          .update({
            cover_image_url:
              image.image_url,
          })
          .eq(
            "id",
            vehicleId
          );

      if (updateError) {
        setError(
          updateError.message
        );

        setImageActionId(
          null
        );

        return;
      }

      setVehicle(
        (current) =>
          current
            ? {
                ...current,

                cover_image_url:
                  image.image_url,
              }
            : current
      );

      setSuccess(
        "Cover photo updated."
      );

      setImageActionId(
        null
      );
    };

  /* =========================================================
     DELETE IMAGE
  ========================================================= */

  const deleteImage =
    async (
      image: VehicleImage
    ) => {
      const confirmed =
        window.confirm(
          "Remove this photo from the vehicle?"
        );

      if (!confirmed) {
        return;
      }

      setError("");
      setSuccess("");

      setImageActionId(
        image.id
      );

      try {
        /*
         * Remove file from
         * Supabase Storage.
         */

        const storagePath =
          getStoragePathFromPublicUrl(
            image.image_url
          );

        if (storagePath) {
          const {
            error:
              storageError,
          } =
            await supabase.storage
              .from(
                "vehicle-media"
              )
              .remove([
                storagePath,
              ]);

          if (storageError) {
            throw new Error(
              storageError.message
            );
          }
        }

        /*
         * Remove image record.
         */

        const {
          error:
            deleteError,
        } =
          await supabase
            .from(
              "vehicle_images"
            )
            .delete()
            .eq(
              "id",
              image.id
            );

        if (deleteError) {
          throw new Error(
            deleteError.message
          );
        }

        const remaining =
          images.filter(
            (item) =>
              item.id !==
              image.id
          );

        /*
         * If deleted image was
         * the current cover,
         * choose the next photo.
         */

        if (
          vehicle
            ?.cover_image_url ===
          image.image_url
        ) {
          const nextCover =
            remaining[0]
              ?.image_url ||
            null;

          const {
            error:
              coverError,
          } =
            await supabase
              .from(
                "vehicles"
              )
              .update({
                cover_image_url:
                  nextCover,
              })
              .eq(
                "id",
                vehicleId
              );

          if (coverError) {
            throw new Error(
              coverError.message
            );
          }
        }

        setSuccess(
          "Photo removed successfully."
        );

        await loadVehicle();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove photo."
        );
      } finally {
        setImageActionId(
          null
        );
      }
    };

  /* =========================================================
     REORDER IMAGES
  ========================================================= */

  const moveImage =
    async (
      index: number,
      direction:
        | "left"
        | "right"
    ) => {
      const targetIndex =
        direction === "left"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >=
          images.length
      ) {
        return;
      }

      setError("");
      setSuccess("");

      const reordered =
        [...images];

      [
        reordered[index],
        reordered[
          targetIndex
        ],
      ] = [
        reordered[
          targetIndex
        ],
        reordered[index],
      ];

      /*
       * Immediately update UI.
       */

      const normalized =
        reordered.map(
          (image, order) => ({
            ...image,
            sort_order:
              order,
          })
        );

      setImages(normalized);

      const results =
        await Promise.all(
          normalized.map(
            (image) =>
              supabase
                .from(
                  "vehicle_images"
                )
                .update({
                  sort_order:
                    image.sort_order,
                })
                .eq(
                  "id",
                  image.id
                )
          )
        );

      const failed =
        results.find(
          (result) =>
            result.error
        );

      if (failed?.error) {
        setError(
          failed.error.message
        );

        await loadVehicle();

        return;
      }

      setSuccess(
        "Photo order updated."
      );
    };

  /* =========================================================
     DELETE VEHICLE
  ========================================================= */

  const deleteVehicle =
    async () => {
      const confirmed =
        window.confirm(
          "Permanently delete this vehicle? This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setError("");

      /*
       * Clean up vehicle storage.
       *
       * We remove the known
       * image/video folders first.
       */

      try {
        for (const image of images) {
          const path =
            getStoragePathFromPublicUrl(
              image.image_url
            );

          if (path) {
            await supabase.storage
              .from(
                "vehicle-media"
              )
              .remove([
                path,
              ]);
          }
        }

        if (
          vehicle?.video_url
        ) {
          const videoPath =
            getStoragePathFromPublicUrl(
              vehicle.video_url
            );

          if (videoPath) {
            await supabase.storage
              .from(
                "vehicle-media"
              )
              .remove([
                videoPath,
              ]);
          }
        }

        const {
          error:
            deleteError,
        } =
          await supabase
            .from("vehicles")
            .delete()
            .eq(
              "id",
              vehicleId
            );

        if (deleteError) {
          throw new Error(
            deleteError.message
          );
        }

        router.push(
          "/admin"
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete vehicle."
        );

        setDeleting(false);
      }
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
            Loading vehicle...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!vehicle) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] px-5 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black">
            Vehicle not found
          </h1>

          <p className="mt-4 text-sm text-slate-500">
            {error ||
              "This vehicle could not be loaded."}
          </p>

          <button
            onClick={() =>
              router.push(
                "/admin"
              )
            }
            className="mt-7 rounded-full bg-[#d6a62b] px-6 py-3 text-sm font-black text-black"
          >
            Return to Dashboard
          </button>
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
        <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-5 md:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin"
              )
            }
            className="flex items-center gap-2 text-xs font-bold text-[#c6a653] transition hover:text-[#f2c857]"
          >
            <FiArrowLeft />
            Dashboard
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6a62b]/40 bg-gradient-to-br from-[#171109] to-[#c7921e] text-sm font-black italic text-[#fff0b0]">
              BGG
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-[0.07em]">
                BLESSED GOD IS GREAT
              </p>

              <p className="mt-1 text-[7px] font-bold tracking-[0.2em] text-[#d6a62b]">
                MANAGE VEHICLE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-[1250px] px-4 py-8 sm:px-5 md:px-8 md:py-12">
        {/* TITLE */}

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d6a62b]">
              Inventory Management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
              {vehicle.name}
            </h1>

            <div className="mt-4">
              <StatusBadge
                status={
                  status
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={
                markSold
              }
              disabled={
                status ===
                "sold"
              }
              className="rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-xs font-black text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status ===
              "sold"
                ? "Sold"
                : "Mark Sold"}
            </button>

            <button
              type="button"
              onClick={
                hideVehicle
              }
              disabled={
                status ===
                "hidden"
              }
              className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-5 py-3 text-xs font-black text-slate-300 disabled:opacity-40"
            >
              <FiEyeOff />

              {status ===
              "hidden"
                ? "Hidden"
                : "Hide"}
            </button>
          </div>
        </div>

        {/* =====================================================
            PHOTO MANAGEMENT
        ====================================================== */}

        <section className="mt-9 rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-3">
                <FiImage className="text-xl text-[#f2c857]" />

                <h2 className="text-lg font-black">
                  Vehicle Photos
                </h2>
              </div>

              <p className="mt-2 max-w-[650px] text-xs leading-6 text-slate-500">
                Add, remove,
                reorder or choose
                the cover image.
                The cover photo is
                what customers see
                first.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#8f7741]">
                {images.length}
                /15
              </span>

              <label
                className={`flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-5 py-3 text-xs font-black text-black ${
                  uploadingImages
                    ? "pointer-events-none opacity-60"
                    : ""
                }`}
              >
                {uploadingImages ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />

                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    Add Photos
                  </>
                )}

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={
                    uploadMoreImages
                  }
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* GALLERY */}

          {images.length >
          0 ? (
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {images.map(
                (
                  image,
                  index
                ) => {
                  const isCover =
                    vehicle.cover_image_url ===
                    image.image_url;

                  const busy =
                    imageActionId ===
                    image.id;

                  return (
                    <article
                      key={
                        image.id
                      }
                      className={`group overflow-hidden rounded-[20px] border bg-black ${
                        isCover
                          ? "border-[#f2c857]/70 shadow-[0_0_35px_rgba(214,166,43,0.12)]"
                          : "border-[#d6a62b]/15"
                      }`}
                    >
                      {/* IMAGE */}

                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={
                            image.image_url
                          }
                          alt={`${vehicle.name} photo ${
                            index +
                            1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                        {isCover && (
                          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#d6a62b] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-black">
                            <FiStar />
                            Cover
                          </span>
                        )}

                        <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-[8px] font-black text-white backdrop-blur">
                          Photo{" "}
                          {index +
                            1}
                        </span>
                      </div>

                      {/* CONTROLS */}

                      <div className="p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={
                              index ===
                                0 ||
                              busy
                            }
                            onClick={() =>
                              moveImage(
                                index,
                                "left"
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-[#d6a62b]/15 px-3 py-2.5 text-[10px] font-bold text-[#c9aa5c] disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <FiChevronLeft />
                            Earlier
                          </button>

                          <button
                            type="button"
                            disabled={
                              index ===
                                images.length -
                                  1 ||
                              busy
                            }
                            onClick={() =>
                              moveImage(
                                index,
                                "right"
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-[#d6a62b]/15 px-3 py-2.5 text-[10px] font-bold text-[#c9aa5c] disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            Later
                            <FiChevronRight />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={
                            isCover ||
                            busy
                          }
                          onClick={() =>
                            setCoverImage(
                              image
                            )
                          }
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d6a62b]/20 bg-[#d6a62b]/5 px-3 py-2.5 text-[10px] font-black text-[#f0c458] transition hover:bg-[#d6a62b]/10 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <FiStar />

                          {isCover
                            ? "Current Cover"
                            : "Set as Cover"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            deleteImage(
                              image
                            )
                          }
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-3 py-2.5 text-[10px] font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                        >
                          {busy ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
                          ) : (
                            <FiTrash2 />
                          )}

                          Remove
                          Photo
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/25 bg-black/25 px-5 py-12 text-center transition hover:bg-[#d6a62b]/5">
              <FiUpload className="text-3xl text-[#f2c857]" />

              <span className="mt-4 text-sm font-black">
                Add vehicle
                photos
              </span>

              <span className="mt-2 text-xs text-slate-500">
                No photos are
                currently attached.
              </span>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={
                  uploadMoreImages
                }
                className="hidden"
              />
            </label>
          )}
        </section>

        {/* =====================================================
            EDIT VEHICLE INFO
        ====================================================== */}

        <form
          onSubmit={
            handleSave
          }
          className="mt-7 space-y-7"
        >
          <section className="rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
            <h2 className="text-lg font-black">
              Vehicle Information
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Edit the vehicle
              information and press
              Save Changes.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Field label="Vehicle Name">
                <input
                  required
                  value={name}
                  onChange={(
                    e
                  ) =>
                    setName(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Brand">
                <input
                  required
                  value={
                    brand
                  }
                  onChange={(
                    e
                  ) =>
                    setBrand(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Model">
                <input
                  value={
                    model
                  }
                  onChange={(
                    e
                  ) =>
                    setModel(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Year">
                <input
                  type="number"
                  min="1950"
                  max="2100"
                  value={year}
                  onChange={(
                    e
                  ) =>
                    setYear(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Price (NGN)">
                <input
                  type="number"
                  min="0"
                  value={
                    price
                  }
                  onChange={(
                    e
                  ) =>
                    setPrice(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Mileage">
                <input
                  type="number"
                  min="0"
                  value={
                    mileage
                  }
                  onChange={(
                    e
                  ) =>
                    setMileage(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Transmission">
                <select
                  value={
                    transmission
                  }
                  onChange={(
                    e
                  ) =>
                    setTransmission(
                      e.target
                        .value
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
                  value={
                    color
                  }
                  onChange={(
                    e
                  ) =>
                    setColor(
                      e.target
                        .value
                    )
                  }
                  className="gz-input"
                />
              </Field>

              <Field label="Status">
                <select
                  value={
                    status
                  }
                  onChange={(
                    e
                  ) =>
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
                    checked={
                      featured
                    }
                    onChange={(
                      e
                    ) =>
                      setFeatured(
                        e.target
                          .checked
                      )
                    }
                    className="h-4 w-4 accent-[#d6a62b]"
                  />

                  <span className="text-sm font-bold text-slate-300">
                    Featured
                    vehicle
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
                value={
                  description
                }
                onChange={(
                  e
                ) =>
                  setDescription(
                    e.target
                      .value
                  )
                }
                className="gz-input resize-none"
              />
            </Field>
          </section>

          {/* VIDEO */}

          {vehicle.video_url && (
            <section className="rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5 sm:p-7">
              <h2 className="text-lg font-black">
                Vehicle Video
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Current walk-around
                video.
              </p>

              <video
                controls
                src={
                  vehicle.video_url
                }
                className="mt-6 max-h-[500px] w-full rounded-2xl bg-black"
              />
            </section>
          )}

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

          {/* SAVE */}

          <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin"
                )
              }
              className="rounded-full border border-[#d6a62b]/20 px-7 py-4 text-sm font-bold text-[#c7a954]"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-8 py-4 text-sm font-black text-[#080603] disabled:opacity-60"
            >
              <FiSave />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>

        {/* =====================================================
            DANGER ZONE
        ====================================================== */}

        <section className="mb-12 mt-10 rounded-[28px] border border-red-500/20 bg-red-500/[0.04] p-5 sm:p-7">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400">
            Danger Zone
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-black">
                Permanently
                delete vehicle
              </h2>

              <p className="mt-2 max-w-[600px] text-sm leading-6 text-slate-500">
                Use this only if
                the record should
                no longer exist.
                For sold vehicles,
                marking them Sold
                is usually better
                than deleting them.
              </p>
            </div>

            <button
              type="button"
              disabled={
                deleting
              }
              onClick={
                deleteVehicle
              }
              className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-3.5 text-sm font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <FiTrash2 />

              {deleting
                ? "Deleting..."
                : "Delete Vehicle"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

/* =========================================================
   FIELD
========================================================= */

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
    <div
      className={
        className
      }
    >
      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-[#9f874d]">
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: VehicleStatus;
}) {
  const styles = {
    available:
      "border-green-500/30 bg-green-500/10 text-green-300",

    reserved:
      "border-amber-400/30 bg-amber-400/10 text-amber-300",

    sold:
      "border-red-500/30 bg-red-500/10 text-red-300",

    hidden:
      "border-slate-500/30 bg-slate-500/10 text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}