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
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiImage,
  FiInfo,
  FiSave,
  FiStar,
  FiTrash2,
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
    description:
      "Visible to customers and ready for sale.",
  },
  {
    value: "reserved",
    label: "Reserved",
    description:
      "Visible to customers but marked as reserved.",
  },
  {
    value: "sold",
    label: "Sold",
    description:
      "Visible to customers and clearly marked as sold.",
  },
  {
    value: "hidden",
    label: "Hidden",
    description:
      "Saved in admin but completely hidden from customers.",
  },
];

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function getStoragePathFromPublicUrl(
  publicUrl: string,
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
      index + marker.length,
    ),
  );
}

function formatNaira(value: string) {
  const amount = Number(value);

  if (
    !value.trim() ||
    Number.isNaN(amount)
  ) {
    return "Price on request";
  }

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

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

  const [
    uploadingImages,
    setUploadingImages,
  ] = useState(false);

  const [
    uploadingVideo,
    setUploadingVideo,
  ] = useState(false);

  const [
    removingVideo,
    setRemovingVideo,
  ] = useState(false);

  const [
    imageActionId,
    setImageActionId,
  ] = useState<string | null>(
    null,
  );

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

  const [status, setStatus] =
    useState<VehicleStatus>(
      "available",
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
          "Invalid vehicle ID.",
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

      const {
        data: vehicleData,
        error: vehicleError,
      } =
        await supabase
          .from("vehicles")
          .select("*")
          .eq(
            "id",
            vehicleId,
          )
          .single();

      if (vehicleError) {
        setError(
          `Unable to load vehicle: ${vehicleError.message}`,
        );

        setLoading(false);
        return;
      }

      const loaded =
        vehicleData as Vehicle;

      setVehicle(loaded);

      setName(
        loaded.name || "",
      );

      setBrand(
        loaded.brand || "",
      );

      setModel(
        loaded.model || "",
      );

      setYear(
        loaded.year !== null
          ? String(
              loaded.year,
            )
          : "",
      );

      setPrice(
        loaded.price !== null
          ? String(
              loaded.price,
            )
          : "",
      );

      setMileage(
        loaded.mileage !== null
          ? String(
              loaded.mileage,
            )
          : "",
      );

      setTransmission(
        loaded.transmission ||
          "Automatic",
      );

      setColor(
        loaded.color || "",
      );

      setStatus(
        loaded.status,
      );

      setDescription(
        loaded.description ||
          "",
      );

      setFeatured(
        loaded.is_featured,
      );

      const {
        data: imageData,
        error: imageError,
      } =
        await supabase
          .from(
            "vehicle_images",
          )
          .select(
            `
            id,
            image_url,
            sort_order
          `,
          )
          .eq(
            "vehicle_id",
            vehicleId,
          )
          .order(
            "sort_order",
            {
              ascending: true,
            },
          );

      if (imageError) {
        setError(
          `Vehicle loaded, but gallery could not be loaded: ${imageError.message}`,
        );
      }

      setImages(
        (imageData as VehicleImage[]) ||
          [],
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
     SAVE VEHICLE DETAILS
  ========================================================= */

  const handleSave =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!vehicleId) {
        return;
      }

      setError("");
      setSuccess("");

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
                    mileage,
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
            vehicleId,
          );

      if (updateError) {
        setError(
          updateError.message,
        );

        setSaving(false);
        return;
      }

      setSuccess(
        status === "hidden"
          ? "Changes saved. This vehicle is hidden from customers."
          : "Vehicle updated successfully.",
      );

      setSaving(false);

      await loadVehicle();
    };

  /* =========================================================
     PHOTO UPLOAD
  ========================================================= */

  const uploadMoreImages =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      setError("");
      setSuccess("");

      const selected =
        Array.from(
          event.target.files ||
            [],
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
          `You currently have ${images.length} photos. A vehicle can have a maximum of 15 photos.`,
        );

        return;
      }

      const invalid =
        selected.find(
          (file) =>
            !file.type.startsWith(
              "image/",
            ),
        );

      if (invalid) {
        setError(
          `${invalid.name} is not a valid image file.`,
        );

        return;
      }

      const tooLarge =
        selected.find(
          (file) =>
            file.size >
            10 *
              1024 *
              1024,
        );

      if (tooLarge) {
        setError(
          `${tooLarge.name} is larger than 10 MB.`,
        );

        return;
      }

      setUploadingImages(
        true,
      );

      try {
        let nextSortOrder =
          images.length > 0
            ? Math.max(
                ...images.map(
                  (image) =>
                    image.sort_order,
                ),
              ) + 1
            : 0;

        const newRows: {
          vehicle_id: string;
          image_url: string;
          sort_order: number;
        }[] = [];

        for (
          const file of selected
        ) {
          const fileName =
            `${crypto.randomUUID()}-${safeFileName(
              file.name,
            )}`;

          const path =
            `${vehicleId}/images/${fileName}`;

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                "vehicle-media",
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
                },
              );

          if (uploadError) {
            throw new Error(
              `${file.name}: ${uploadError.message}`,
            );
          }

          const {
            data: publicUrlData,
          } =
            supabase.storage
              .from(
                "vehicle-media",
              )
              .getPublicUrl(
                path,
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
              "vehicle_images",
            )
            .insert(
              newRows,
            );

        if (insertError) {
          throw new Error(
            insertError.message,
          );
        }

        if (
          !vehicle
            ?.cover_image_url &&
          newRows[0]
        ) {
          const {
            error:
              coverError,
          } =
            await supabase
              .from(
                "vehicles",
              )
              .update({
                cover_image_url:
                  newRows[0]
                    .image_url,
              })
              .eq(
                "id",
                vehicleId,
              );

          if (coverError) {
            throw new Error(
              coverError.message,
            );
          }
        }

        setSuccess(
          `${selected.length} photo${
            selected.length ===
            1
              ? ""
              : "s"
          } uploaded successfully.`,
        );

        await loadVehicle();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to upload photos.",
        );
      } finally {
        setUploadingImages(
          false,
        );
      }
    };

  /* =========================================================
     SET COVER IMAGE
  ========================================================= */

  const setCoverImage =
    async (
      image: VehicleImage,
    ) => {
      setError("");
      setSuccess("");

      setImageActionId(
        image.id,
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
            vehicleId,
          );

      if (updateError) {
        setError(
          updateError.message,
        );

        setImageActionId(
          null,
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
            : current,
      );

      setSuccess(
        "Cover photo updated.",
      );

      setImageActionId(
        null,
      );
    };

  /* =========================================================
     DELETE IMAGE
  ========================================================= */

  const deleteImage =
    async (
      image: VehicleImage,
    ) => {
      const confirmed =
        window.confirm(
          "Remove this photo from the vehicle?",
        );

      if (!confirmed) {
        return;
      }

      setError("");
      setSuccess("");

      setImageActionId(
        image.id,
      );

      try {
        const storagePath =
          getStoragePathFromPublicUrl(
            image.image_url,
          );

        if (storagePath) {
          const {
            error:
              storageError,
          } =
            await supabase.storage
              .from(
                "vehicle-media",
              )
              .remove([
                storagePath,
              ]);

          if (storageError) {
            throw new Error(
              storageError.message,
            );
          }
        }

        const {
          error:
            deleteError,
        } =
          await supabase
            .from(
              "vehicle_images",
            )
            .delete()
            .eq(
              "id",
              image.id,
            );

        if (deleteError) {
          throw new Error(
            deleteError.message,
          );
        }

        const remaining =
          images.filter(
            (item) =>
              item.id !==
              image.id,
          );

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
                "vehicles",
              )
              .update({
                cover_image_url:
                  nextCover,
              })
              .eq(
                "id",
                vehicleId,
              );

          if (coverError) {
            throw new Error(
              coverError.message,
            );
          }
        }

        setSuccess(
          "Photo removed successfully.",
        );

        await loadVehicle();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove photo.",
        );
      } finally {
        setImageActionId(
          null,
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
        | "right",
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

      const normalized =
        reordered.map(
          (image, order) => ({
            ...image,
            sort_order:
              order,
          }),
        );

      setImages(normalized);

      const results =
        await Promise.all(
          normalized.map(
            (image) =>
              supabase
                .from(
                  "vehicle_images",
                )
                .update({
                  sort_order:
                    image.sort_order,
                })
                .eq(
                  "id",
                  image.id,
                ),
          ),
        );

      const failed =
        results.find(
          (result) =>
            result.error,
        );

      if (failed?.error) {
        setError(
          failed.error.message,
        );

        await loadVehicle();

        return;
      }

      setSuccess(
        "Photo order updated.",
      );
    };

  /* =========================================================
     VIDEO MANAGEMENT
  ========================================================= */

  const uploadVideo =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      setError("");
      setSuccess("");

      const selected =
        event.target.files?.[0];

      event.target.value = "";

      if (!selected) {
        return;
      }

      if (
        !selected.type.startsWith(
          "video/",
        )
      ) {
        setError(
          "Please select a video file.",
        );
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

      setUploadingVideo(true);

      try {
        const oldVideoUrl =
          vehicle?.video_url ||
          null;

        const fileName =
          `${crypto.randomUUID()}-${safeFileName(
            selected.name,
          )}`;

        const path =
          `${vehicleId}/videos/${fileName}`;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "vehicle-media",
            )
            .upload(
              path,
              selected,
              {
                cacheControl:
                  "3600",
                upsert: false,
                contentType:
                  selected.type,
              },
            );

        if (uploadError) {
          throw new Error(
            uploadError.message,
          );
        }

        const {
          data: publicUrlData,
        } =
          supabase.storage
            .from(
              "vehicle-media",
            )
            .getPublicUrl(
              path,
            );

        const {
          error: updateError,
        } =
          await supabase
            .from(
              "vehicles",
            )
            .update({
              video_url:
                publicUrlData.publicUrl,
            })
            .eq(
              "id",
              vehicleId,
            );

        if (updateError) {
          throw new Error(
            updateError.message,
          );
        }

        if (oldVideoUrl) {
          const oldPath =
            getStoragePathFromPublicUrl(
              oldVideoUrl,
            );

          if (oldPath) {
            await supabase.storage
              .from(
                "vehicle-media",
              )
              .remove([
                oldPath,
              ]);
          }
        }

        setSuccess(
          oldVideoUrl
            ? "Walk-around video replaced successfully."
            : "Walk-around video uploaded successfully.",
        );

        await loadVehicle();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to upload video.",
        );
      } finally {
        setUploadingVideo(
          false,
        );
      }
    };

  const removeVideo =
    async () => {
      if (
        !vehicle?.video_url
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove the walk-around video from this vehicle?",
        );

      if (!confirmed) {
        return;
      }

      setRemovingVideo(true);
      setError("");
      setSuccess("");

      try {
        const videoPath =
          getStoragePathFromPublicUrl(
            vehicle.video_url,
          );

        const {
          error: updateError,
        } =
          await supabase
            .from("vehicles")
            .update({
              video_url: null,
            })
            .eq(
              "id",
              vehicleId,
            );

        if (updateError) {
          throw new Error(
            updateError.message,
          );
        }

        if (videoPath) {
          await supabase.storage
            .from(
              "vehicle-media",
            )
            .remove([
              videoPath,
            ]);
        }

        setSuccess(
          "Walk-around video removed.",
        );

        await loadVehicle();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove video.",
        );
      } finally {
        setRemovingVideo(false);
      }
    };

  /* =========================================================
     DELETE VEHICLE
  ========================================================= */

  const deleteVehicle =
    async () => {
      const confirmed =
        window.confirm(
          "Permanently delete this vehicle? This cannot be undone.",
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setError("");

      try {
        for (
          const image of images
        ) {
          const path =
            getStoragePathFromPublicUrl(
              image.image_url,
            );

          if (path) {
            await supabase.storage
              .from(
                "vehicle-media",
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
              vehicle.video_url,
            );

          if (videoPath) {
            await supabase.storage
              .from(
                "vehicle-media",
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
              vehicleId,
            );

        if (deleteError) {
          throw new Error(
            deleteError.message,
          );
        }

        router.push(
          "/admin",
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete vehicle.",
        );

        setDeleting(false);
      }
    };

  /* =========================================================
     LOADING + NOT FOUND
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
                "/admin",
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

  const currentStatus =
    STATUS_OPTIONS.find(
      (item) =>
        item.value === status,
    );

  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#d6a62b]/15 bg-[#050403]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin",
              )
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
                MANAGE VEHICLE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-[1280px] px-4 py-7 sm:px-5 md:px-8 md:py-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* MAIN */}

          <form
            id="manage-vehicle-form"
            onSubmit={handleSave}
            className="space-y-6"
          >
            {/* VEHICLE SUMMARY */}

            <div className="overflow-hidden rounded-[28px] border border-[#d6a62b]/15 bg-[#0c0b08]">
              <div className="grid md:grid-cols-[260px_1fr]">
                <div className="relative min-h-[220px] bg-black">
                  {vehicle.cover_image_url ? (
                    <img
                      src={
                        vehicle.cover_image_url
                      }
                      alt={
                        vehicle.name
                      }
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center text-5xl">
                      🚘
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <span className="absolute left-4 top-4 rounded-full bg-[#d6a62b] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-black">
                    Cover Photo
                  </span>
                </div>

                <div className="flex flex-col justify-center p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={status}
                    />

                    {featured && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d6a62b]/25 bg-[#d6a62b]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#f2c857]">
                        <FiStar />
                        Featured
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    {name ||
                      vehicle.name}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    {[
                      brand,
                      model,
                      year,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>

                  <p className="mt-4 text-xl font-black text-[#f2c857]">
                    {formatNaira(
                      price,
                    )}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {status !==
                      "hidden" && (
                      <a
                        href={`/vehicles/${vehicleId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-full border border-[#d6a62b]/20 px-4 py-2.5 text-[10px] font-black text-[#e4bd58] transition hover:bg-[#d6a62b]/10"
                      >
                        <FiExternalLink />
                        View on Website
                      </a>
                    )}

                    <span className="rounded-full border border-white/5 bg-black/20 px-4 py-2.5 text-[10px] font-black text-slate-500">
                      {images.length}/15 photos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* VEHICLE DETAILS */}

            <Panel
              number="01"
              title="Vehicle details"
              subtitle="Update the main information customers see."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Vehicle Name *">
                  <input
                    required
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Lexus LX 570"
                    className="gz-input"
                  />
                </Field>

                <Field label="Brand *">
                  <input
                    required
                    list="manage-vehicle-brands"
                    value={brand}
                    onChange={(e) =>
                      setBrand(
                        e.target.value,
                      )
                    }
                    placeholder="Choose or type a brand"
                    className="gz-input"
                  />

                  <datalist id="manage-vehicle-brands">
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
                      setModel(
                        e.target.value,
                      )
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
                      setYear(
                        e.target.value,
                      )
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
              subtitle="Keep these details accurate for customers."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Price (NGN)">
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value,
                      )
                    }
                    placeholder="85000000"
                    className="gz-input"
                  />

                  <p className="mt-2 text-xs font-bold text-[#d6a62b]">
                    {formatNaira(
                      price,
                    )}
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
                    value={
                      transmission
                    }
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
                      setColor(
                        e.target.value,
                      )
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
              subtitle="Update condition, notable features and buyer information."
            >
              <textarea
                rows={6}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value,
                  )
                }
                placeholder="Describe the vehicle, condition, specifications and features..."
                className="gz-input resize-none"
              />

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#d6a62b]/10 bg-[#d6a62b]/[0.04] px-4 py-3">
                <FiInfo className="mt-0.5 shrink-0 text-[#d6a62b]" />

                <p className="text-[11px] leading-5 text-slate-500">
                  Keep the description clear and factual. Customers can use
                  the enquiry form for additional questions.
                </p>
              </div>
            </Panel>

            {/* PUBLISHING */}

            <Panel
              number="04"
              title="Publishing"
              subtitle="Control the listing status and homepage visibility."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {STATUS_OPTIONS.map(
                  (item) => {
                    const active =
                      status ===
                      item.value;

                    return (
                      <button
                        key={
                          item.value
                        }
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
                            {
                              item.label
                            }
                          </span>

                          {active && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d6a62b] text-xs text-black">
                              <FiCheck />
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                          {
                            item.description
                          }
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
                      Featured on homepage
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Turn this on to include the vehicle in the owner&apos;s
                      featured homepage selection.
                    </p>
                  </div>
                </div>

                <div
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
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
              subtitle="Add, remove, reorder or choose the main cover photo."
              icon={<FiImage />}
            >
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d6a62b]/10 bg-black/20 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-black text-white">
                    Photo gallery
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    The cover photo is what customers see first.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#d6a62b]/10 px-3 py-1.5 text-[10px] font-black text-[#f2c857]">
                    {images.length}/15
                  </span>

                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-5 py-3 text-[10px] font-black text-black ${
                      uploadingImages
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/25 border-t-black" />
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

              {images.length >
              0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {images.map(
                    (
                      image,
                      index,
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
                          className={`overflow-hidden rounded-2xl border bg-black/30 ${
                            isCover
                              ? "border-[#f2c857]/70 shadow-[0_0_30px_rgba(214,166,43,0.1)]"
                              : "border-[#d6a62b]/15"
                          }`}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-black">
                            <img
                              src={
                                image.image_url
                              }
                              alt={`${name} photo ${index + 1}`}
                              className="h-full w-full object-cover"
                            />

                            {isCover && (
                              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#d6a62b] px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-black">
                                <FiStar />
                                Cover
                              </span>
                            )}

                            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[8px] font-black text-white backdrop-blur">
                              Photo{" "}
                              {index + 1}
                            </span>
                          </div>

                          <div className="p-2.5">
                            {!isCover && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  setCoverImage(
                                    image,
                                  )
                                }
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d6a62b]/15 bg-[#d6a62b]/5 px-2 py-2 text-[9px] font-black text-[#d6a62b] transition hover:bg-[#d6a62b]/10 disabled:opacity-40"
                              >
                                <FiStar />
                                Make Cover
                              </button>
                            )}

                            {isCover && (
                              <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d6a62b]/15 bg-[#d6a62b]/10 px-2 py-2 text-[9px] font-black text-[#f2c857]">
                                <FiCheck />
                                Current Cover
                              </div>
                            )}

                            <div className="mt-2 grid grid-cols-2 gap-2">
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
                                      1 ||
                                  busy
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

                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                deleteImage(
                                  image,
                                )
                              }
                              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/15 bg-red-500/[0.05] px-2 py-2 text-[9px] font-black text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                            >
                              <FiTrash2 />
                              Remove
                            </button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              ) : (
                <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/30 bg-black/25 px-5 py-10 text-center transition hover:bg-[#d6a62b]/5">
                  <FiUpload className="text-3xl text-[#f2c857]" />

                  <span className="mt-4 text-sm font-black">
                    Add vehicle photos
                  </span>

                  <span className="mt-2 text-xs text-slate-500">
                    No photos are attached to this vehicle.
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
            </Panel>

            {/* VIDEO */}

            <Panel
              number="06"
              title="Walk-around video"
              subtitle="Upload, replace or remove the customer-facing vehicle video."
              icon={<FiVideo />}
            >
              {vehicle.video_url ? (
                <>
                  <video
                    controls
                    src={
                      vehicle.video_url
                    }
                    className="max-h-[500px] w-full rounded-2xl bg-black"
                  />

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <label
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d6a62b]/20 bg-[#d6a62b]/5 px-5 py-3 text-xs font-black text-[#e4bd58] transition hover:bg-[#d6a62b]/10 ${
                        uploadingVideo
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <FiUpload />
                      {uploadingVideo
                        ? "Uploading..."
                        : "Replace Video"}

                      <input
                        type="file"
                        accept="video/*"
                        onChange={
                          uploadVideo
                        }
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={
                        removingVideo ||
                        uploadingVideo
                      }
                      onClick={
                        removeVideo
                      }
                      className="flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.05] px-5 py-3 text-xs font-black text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <FiTrash2 />
                      {removingVideo
                        ? "Removing..."
                        : "Remove Video"}
                    </button>
                  </div>
                </>
              ) : (
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6a62b]/30 bg-black/25 px-5 py-9 text-center transition hover:bg-[#d6a62b]/5 ${
                    uploadingVideo
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  {uploadingVideo ? (
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d6a62b]/30 border-t-[#f2c857]" />
                  ) : (
                    <FiUpload className="text-2xl text-[#f2c857]" />
                  )}

                  <span className="mt-3 text-sm font-black">
                    {uploadingVideo
                      ? "Uploading video..."
                      : "Add walk-around video"}
                  </span>

                  <span className="mt-2 text-xs text-slate-500">
                    Optional — maximum 100 MB
                  </span>

                  <input
                    type="file"
                    accept="video/*"
                    onChange={
                      uploadVideo
                    }
                    className="hidden"
                  />
                </label>
              )}
            </Panel>

            {/* MESSAGES */}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm leading-6 text-red-300">
                <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                <span>
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm font-bold text-green-300">
                <FiCheck />
                {success}
              </div>
            )}

            {/* DANGER ZONE */}

            <section className="rounded-[26px] border border-red-500/20 bg-red-500/[0.035] p-5 sm:p-7">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-red-400">
                Danger Zone
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-black">
                    Permanently delete vehicle
                  </h2>

                  <p className="mt-2 max-w-[650px] text-sm leading-6 text-slate-500">
                    Delete only when the record should no longer exist. For a
                    completed sale, changing the status to Sold is usually the
                    better option.
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
          </form>

          {/* SIDEBAR */}

          <aside className="hidden lg:block">
            <div className="sticky top-[96px] space-y-4">
              <div className="rounded-[24px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d6a62b]">
                  Listing Status
                </p>

                <div className="mt-4 rounded-2xl border border-white/5 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-white">
                        {currentStatus
                          ?.label ||
                          status}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        {currentStatus
                          ?.description}
                      </p>
                    </div>

                    {status ===
                    "hidden" ? (
                      <FiEyeOff className="text-xl text-slate-500" />
                    ) : (
                      <FiEye className="text-xl text-[#d6a62b]" />
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <SummaryRow
                    icon={<FiImage />}
                    label="Photos"
                    value={`${images.length}/15`}
                  />

                  <SummaryRow
                    icon={<FiVideo />}
                    label="Video"
                    value={
                      vehicle.video_url
                        ? "Added"
                        : "None"
                    }
                  />

                  <SummaryRow
                    icon={<FiStar />}
                    label="Homepage"
                    value={
                      featured
                        ? "Featured"
                        : "Not featured"
                    }
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#d6a62b]/15 bg-[#0c0b08] p-5">
                <p className="text-xs font-black text-white">
                  Quick links
                </p>

                <div className="mt-4 space-y-2">
                  {status !==
                    "hidden" && (
                    <a
                      href={`/vehicles/${vehicleId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-[10px] font-black text-slate-400 transition hover:border-[#d6a62b]/20 hover:text-white"
                    >
                      View vehicle page
                      <FiExternalLink />
                    </a>
                  )}

                  <a
                    href="/vehicles"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-[10px] font-black text-slate-400 transition hover:border-[#d6a62b]/20 hover:text-white"
                  >
                    Open inventory
                    <FiExternalLink />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/admin",
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-[10px] font-black text-slate-400 transition hover:border-[#d6a62b]/20 hover:text-white"
                  >
                    Admin dashboard
                    <FiArrowLeft />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* STICKY SAVE BAR */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d6a62b]/15 bg-[#050403]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              router.push(
                "/admin",
              )
            }
            className="rounded-full border border-[#d6a62b]/20 px-5 py-3 text-xs font-bold text-[#c7a954] transition hover:bg-[#d6a62b]/5 disabled:opacity-50 sm:px-7"
          >
            Back
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-black text-white">
              {featured
                ? "Featured on homepage"
                : "Regular inventory listing"}
            </p>

            <p className="mt-1 text-[9px] text-slate-600">
              {status ===
              "hidden"
                ? "Hidden from customers"
                : `${currentStatus?.label || status} on public inventory`}
            </p>
          </div>

          <button
            type="submit"
            form="manage-vehicle-form"
            disabled={saving}
            className="flex min-w-[165px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a8750e] via-[#d6a62b] to-[#f2ca61] px-6 py-3.5 text-xs font-black text-[#080603] shadow-[0_15px_45px_rgba(214,166,43,0.18)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[200px] sm:text-sm"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Changes
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
      className={`inline-flex rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}
