import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Home,
  DollarSign,
  Image as ImageIcon,
  Video,
  Globe,
  Star,
  BadgeCheck,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  FileText,
  Search,
  Navigation,
  MapPinned,
  LocateFixed,
} from "lucide-react";

import StreetOpenMap from "../../../modules/super-admin/maps/StreetOpenMap";

/*
|--------------------------------------------------------------------------
| Default Form
|--------------------------------------------------------------------------
*/

const DEFAULT_FORM = {
  // General Information
  title: "",
  description: "",
  property_type_id: "",
  property_category_id: "",
  listing_type: "rent",
  status: "draft",

  // Location
  country_name: "Kenya",
  region_name: "",
  county_name: "",
  city_name: "",
  area_name: "",
  street_address: "",
  latitude: "",
  longitude: "",

  // Features
  bedrooms: "",
  bathrooms: "",
  toilets: "",
  floors: "",
  size: "",
  size_unit: "sqm",

  // Pricing
  price: "",
  monthly_rent: "",
  service_charge: "",
  currency: "KES",

  // Flags
  is_featured: false,
  is_verified: false,
  is_published: false,

  // Media
  image_url: "",
  thumbnail_url: "",
  video_url: "",
  virtual_tour_url: "",
};

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50";

const selectClasses = inputClasses;

const labelClasses =
  "mb-1.5 block text-sm font-medium text-gray-700";

const sectionClasses =
  "rounded-xl border border-gray-200 bg-white shadow-sm";

const sectionHeaderClasses =
  "flex items-center gap-3 border-b border-gray-200 px-5 py-4";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getValue = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return value;
};

const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

const normalizeId = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return value?.id ?? value?.value ?? "";
  }

  return value;
};

const normalizeStatus = (value, fallback = "draft") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return (
      value?.value ??
      value?.status ??
      value?.key ??
      fallback
    );
  }

  return value;
};

/*
|--------------------------------------------------------------------------
| Normalize Property
|--------------------------------------------------------------------------
*/

const normalizeProperty = (property = {}) => {
  const location = property?.location || {};
  const features = property?.features || {};
  const pricing = property?.pricing || {};
  const flags = property?.flags || {};
  const media = property?.media || {};

  const propertyTypeId =
    property?.property_type_id ??
    property?.property_type?.id ??
    property?.propertyType?.id ??
    "";

  const propertyCategoryId =
    property?.property_category_id ??
    property?.property_category?.id ??
    property?.propertyCategory?.id ??
    "";

  return {
    /*
    |--------------------------------------------------------------------------
    | General Information
    |--------------------------------------------------------------------------
    */

    title: getValue(property?.title),

    description: getValue(property?.description),

    property_type_id: normalizeId(propertyTypeId),

    property_category_id: normalizeId(propertyCategoryId),

    listing_type: getValue(
      property?.listing_type,
      "rent"
    ),

    status: normalizeStatus(
      property?.status,
      "draft"
    ),

    /*
    |--------------------------------------------------------------------------
    | Location
    |--------------------------------------------------------------------------
    */

    country_name: getValue(
      location?.country_name ??
        property?.country_name,
      "Kenya"
    ),

    region_name: getValue(
      location?.region_name ??
        property?.region_name
    ),

    county_name: getValue(
      location?.county_name ??
        property?.county_name
    ),

    city_name: getValue(
      location?.city_name ??
        property?.city_name
    ),

    area_name: getValue(
      location?.area_name ??
        property?.area_name
    ),

    street_address: getValue(
      location?.street_address ??
        property?.street_address
    ),

    latitude: getValue(
      location?.latitude ??
        property?.latitude
    ),

    longitude: getValue(
      location?.longitude ??
        property?.longitude
    ),

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    */

    bedrooms: getValue(
      features?.bedrooms ??
        property?.bedrooms
    ),

    bathrooms: getValue(
      features?.bathrooms ??
        property?.bathrooms
    ),

    toilets: getValue(
      features?.toilets ??
        property?.toilets
    ),

    floors: getValue(
      features?.floors ??
        property?.floors
    ),

    size: getValue(
      features?.size ??
        property?.size
    ),

    size_unit: getValue(
      features?.size_unit ??
        property?.size_unit,
      "sqm"
    ),

    /*
    |--------------------------------------------------------------------------
    | Pricing
    |--------------------------------------------------------------------------
    */

    price: getValue(
      pricing?.price ??
        property?.price
    ),

    monthly_rent: getValue(
      pricing?.monthly_rent ??
        property?.monthly_rent
    ),

    service_charge: getValue(
      pricing?.service_charge ??
        property?.service_charge
    ),

    currency: getValue(
      pricing?.currency ??
        property?.currency,
      "KES"
    ),

    /*
    |--------------------------------------------------------------------------
    | Flags
    |--------------------------------------------------------------------------
    */

    is_featured: normalizeBoolean(
      flags?.is_featured ??
        property?.is_featured
    ),

    is_verified: normalizeBoolean(
      flags?.is_verified ??
        property?.is_verified
    ),

    is_published: normalizeBoolean(
      flags?.is_published ??
        property?.is_published
    ),

    /*
    |--------------------------------------------------------------------------
    | Media
    |--------------------------------------------------------------------------
    */

    image_url: getValue(
      media?.image_url ??
        property?.image_url
    ),

    thumbnail_url: getValue(
      media?.thumbnail_url ??
        property?.thumbnail_url
    ),

    video_url: getValue(
      media?.video_url ??
        property?.video_url
    ),

    virtual_tour_url: getValue(
      media?.virtual_tour_url ??
        property?.virtual_tour_url
    ),
  };
};

/*
|--------------------------------------------------------------------------
| Section Header
|--------------------------------------------------------------------------
*/

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className={sectionHeaderClasses}>
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={18} />
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          {title}
        </h2>

        {description && (
          <p className="mt-0.5 text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Field Error
|--------------------------------------------------------------------------
*/

const FieldError = ({ error }) => {
  if (!error) {
    return null;
  }

  const message = Array.isArray(error)
    ? error[0]
    : typeof error === "object"
    ? error?.message ||
      error?.error ||
      "Invalid value."
    : error;

  return (
    <p className="mt-1.5 text-xs font-medium text-red-600">
      {message}
    </p>
  );
};

/*
|--------------------------------------------------------------------------
| Property Form
|--------------------------------------------------------------------------
*/

const PropertyForm = ({
  property = null,
  propertyTypes = [],
  propertyCategories = [],
  loading = false,
  submitting = false,
  errors = {},
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel = "Cancel",
}) => {
  const isEditMode = Boolean(property?.id);

  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState(() =>
    property
      ? normalizeProperty(property)
      : { ...DEFAULT_FORM }
  );

  const [imagePreview, setImagePreview] = useState(
    property?.media?.image_url ||
      property?.image_url ||
      ""
  );

  /*
  |--------------------------------------------------------------------------
  | Map Search State
  |--------------------------------------------------------------------------
  */

  const [mapSearch, setMapSearch] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const [searchingLocation, setSearchingLocation] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

  const [showSearchResults, setShowSearchResults] =
    useState(false);

  const [locatingUser, setLocatingUser] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Sync Property
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (property) {
      const normalized =
        normalizeProperty(property);

      setForm(normalized);

      setImagePreview(
        normalized.image_url || ""
      );

      /*
      |--------------------------------------------------------------------------
      | Set Search Text From Existing Address
      |--------------------------------------------------------------------------
      */

      setMapSearch(
        normalized.street_address ||
          normalized.area_name ||
          normalized.city_name ||
          ""
      );
    } else {
      setForm({ ...DEFAULT_FORM });
      setImagePreview("");
      setMapSearch("");
      setSearchResults([]);
    }
  }, [property]);

  /*
  |--------------------------------------------------------------------------
  | Submit Text
  |--------------------------------------------------------------------------
  */

  const submitText = useMemo(() => {
    if (submitLabel) {
      return submitLabel;
    }

    return isEditMode
      ? "Update Property"
      : "Create Property";
  }, [submitLabel, isEditMode]);

  /*
  |--------------------------------------------------------------------------
  | Handle Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Apply Location To Form
  |--------------------------------------------------------------------------
  */

  const applyLocationToForm = ({
    latitude,
    longitude,
    address,
  }) => {
    const locationAddress =
      address || {};

    const displayAddress =
      address?.display_name ||
      address ||
      "";

    setForm((previous) => ({
      ...previous,

      latitude:
        latitude !== undefined &&
        latitude !== null
          ? String(latitude)
          : previous.latitude,

      longitude:
        longitude !== undefined &&
        longitude !== null
          ? String(longitude)
          : previous.longitude,

      country_name:
        locationAddress?.country ||
        previous.country_name,

      region_name:
        locationAddress?.state ||
        locationAddress?.region ||
        previous.region_name,

      county_name:
        locationAddress?.county ||
        previous.county_name,

      city_name:
        locationAddress?.city ||
        locationAddress?.town ||
        locationAddress?.municipality ||
        locationAddress?.village ||
        previous.city_name,

      area_name:
        locationAddress?.suburb ||
        locationAddress?.neighbourhood ||
        locationAddress?.quarter ||
        locationAddress?.residential ||
        previous.area_name,

      street_address:
        displayAddress ||
        locationAddress?.road ||
        previous.street_address,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Map Location
  |--------------------------------------------------------------------------
  |
  | StreetOpenMap returns:
  |
  | {
  |   latitude,
  |   longitude,
  |   address
  | }
  |
  */

  const handleMapLocationChange = (location) => {
    if (!location) {
      return;
    }

    const latitude =
      location?.latitude ?? "";

    const longitude =
      location?.longitude ?? "";

    const address =
      location?.address ?? "";

    setForm((previous) => ({
      ...previous,

      latitude: String(latitude),

      longitude: String(longitude),

      ...(address
        ? {
            street_address: address,
          }
        : {}),
    }));

    /*
    |--------------------------------------------------------------------------
    | Keep Search Box In Sync
    |--------------------------------------------------------------------------
    */

    if (address) {
      setMapSearch(
        typeof address === "string"
          ? address
          : address?.display_name || ""
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Search Places
  |--------------------------------------------------------------------------
  |
  | Uses OpenStreetMap Nominatim.
  |
  */

  const searchPlaces = async () => {
    const query = mapSearch.trim();

    if (!query) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchingLocation(true);
    setSearchError("");
    setShowSearchResults(true);

    try {
      const params = new URLSearchParams({
        q: `${query}, Kenya`,
        format: "jsonv2",
        addressdetails: "1",
        limit: "8",
        countrycodes: "ke",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to search for this location."
        );
      }

      const data = await response.json();

      setSearchResults(
        Array.isArray(data) ? data : []
      );

      if (!data?.length) {
        setSearchError(
          "No locations found. Try another place name."
        );
      }
    } catch (error) {
      console.error(
        "Location search error:",
        error
      );

      setSearchResults([]);

      setSearchError(
        "Unable to search for this location. Please try again."
      );
    } finally {
      setSearchingLocation(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Search On Enter
  |--------------------------------------------------------------------------
  */

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchPlaces();
    }

    if (event.key === "Escape") {
      setShowSearchResults(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Select Search Result
  |--------------------------------------------------------------------------
  */

  const handleSearchResultSelect = (result) => {
    if (!result) {
      return;
    }

    const latitude = result?.lat;
    const longitude = result?.lon;

    const address = result?.address || {};

    applyLocationToForm({
      latitude,
      longitude,
      address: {
        ...address,
        display_name:
          result?.display_name || "",
      },
    });

    setMapSearch(
      result?.display_name || ""
    );

    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Use Current Location
  |--------------------------------------------------------------------------
  */

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLocatingUser(true);
    setSearchError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        try {
          const params = new URLSearchParams({
            lat: String(latitude),
            lon: String(longitude),
            format: "jsonv2",
            addressdetails: "1",
          });

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              "Unable to detect your address."
            );
          }

          const data =
            await response.json();

          applyLocationToForm({
            latitude,
            longitude,
            address: {
              ...(data?.address || {}),
              display_name:
                data?.display_name || "",
            },
          });

          setMapSearch(
            data?.display_name ||
              `${latitude}, ${longitude}`
          );
        } catch (error) {
          console.error(
            "Reverse geocoding error:",
            error
          );

          /*
          |--------------------------------------------------------------------------
          | Even If Address Lookup Fails,
          | Keep The GPS Coordinates
          |--------------------------------------------------------------------------
          */

          setForm((previous) => ({
            ...previous,
            latitude: String(latitude),
            longitude: String(longitude),
          }));

          setMapSearch(
            `${latitude}, ${longitude}`
          );

          setSearchError(
            "Location detected, but the address could not be retrieved."
          );
        } finally {
          setLocatingUser(false);
        }
      },
      (error) => {
        console.error(
          "Geolocation error:",
          error
        );

        let message =
          "Unable to access your current location.";

        if (error?.code === 1) {
          message =
            "Location permission was denied. Please allow location access in your browser.";
        }

        if (error?.code === 2) {
          message =
            "Your current location could not be determined.";
        }

        if (error?.code === 3) {
          message =
            "Location detection timed out. Please try again.";
        }

        setSearchError(message);
        setLocatingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Image URL Change
  |--------------------------------------------------------------------------
  */

  const handleImageUrlChange = (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      image_url: value,
    }));

    setImagePreview(value);
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (typeof onSubmit !== "function") {
      return;
    }

    onSubmit(form);
  };

  /*
  |--------------------------------------------------------------------------
  | Get Error
  |--------------------------------------------------------------------------
  */

  const getError = (field) => {
    return errors?.[field] || null;
  };

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={30}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm font-medium text-gray-700">
            Loading property...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ============================================================
          GENERAL INFORMATION
      ============================================================ */}

      <section className={sectionClasses}>
        <SectionHeader
          icon={Home}
          title="General Information"
          description="Provide the basic information about the property."
        />

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          {/* Property Title */}

          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className={labelClasses}
            >
              Property Title{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. The Grand Royale Residences"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("title")}
            />
          </div>

          {/* Property Type */}

          <div>
            <label
              htmlFor="property_type_id"
              className={labelClasses}
            >
              Property Type{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              id="property_type_id"
              name="property_type_id"
              value={form.property_type_id}
              onChange={handleChange}
              className={selectClasses}
              disabled={submitting}
            >
              <option value="">
                Select Property Type
              </option>

              {propertyTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.name}
                </option>
              ))}
            </select>

            <FieldError
              error={getError(
                "property_type_id"
              )}
            />
          </div>

          {/* Property Category */}

          <div>
            <label
              htmlFor="property_category_id"
              className={labelClasses}
            >
              Property Category{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              id="property_category_id"
              name="property_category_id"
              value={
                form.property_category_id
              }
              onChange={handleChange}
              className={selectClasses}
              disabled={submitting}
            >
              <option value="">
                Select Property Category
              </option>

              {propertyCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            <FieldError
              error={getError(
                "property_category_id"
              )}
            />
          </div>

          {/* Listing Type */}

          <div>
            <label
              htmlFor="listing_type"
              className={labelClasses}
            >
              Listing Type{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              id="listing_type"
              name="listing_type"
              value={form.listing_type}
              onChange={handleChange}
              className={selectClasses}
              disabled={submitting}
            >
              <option value="rent">
                For Rent
              </option>

              <option value="sale">
                For Sale
              </option>

              <option value="lease">
                For Lease
              </option>
            </select>

            <FieldError
              error={getError("listing_type")}
            />
          </div>

          {/* Status */}

          <div>
            <label
              htmlFor="status"
              className={labelClasses}
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className={selectClasses}
              disabled={submitting}
            >
              <option value="draft">
                Draft
              </option>

              <option value="published">
                Published
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="archived">
                Archived
              </option>
            </select>

            <FieldError
              error={getError("status")}
            />
          </div>

          {/* Description */}

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className={labelClasses}
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the property..."
              className={`${inputClasses} resize-y`}
              disabled={submitting}
            />

            <FieldError
              error={getError("description")}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          LOCATION
      ============================================================ */}

      <section className={sectionClasses}>
        <SectionHeader
          icon={MapPin}
          title="Property Location"
          description="Search for a place or select the exact property location on the map."
        />

        <div className="space-y-5 p-5">
          {/* ========================================================
              LOCATION SEARCH
          ======================================================== */}

          <div>
            <label
              htmlFor="map-search"
              className={labelClasses}
            >
              Search Property Location
            </label>

            <div className="relative">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="map-search"
                    type="text"
                    value={mapSearch}
                    onChange={(event) => {
                      setMapSearch(
                        event.target.value
                      );

                      setSearchError("");

                      if (
                        !event.target.value.trim()
                      ) {
                        setSearchResults([]);
                        setShowSearchResults(
                          false
                        );
                      }
                    }}
                    onKeyDown={
                      handleSearchKeyDown
                    }
                    onFocus={() => {
                      if (
                        searchResults.length
                      ) {
                        setShowSearchResults(
                          true
                        );
                      }
                    }}
                    placeholder="Search Westlands, Nairobi, Kilimani, Two Rivers..."
                    className={`${inputClasses} pl-10`}
                    disabled={submitting}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="button"
                  onClick={searchPlaces}
                  disabled={
                    submitting ||
                    searchingLocation ||
                    !mapSearch.trim()
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searchingLocation ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={17} />

                      Search
                    </>
                  )}
                </button>
              </div>

              {/* ====================================================
                  SEARCH RESULTS
              ==================================================== */}

              {showSearchResults &&
                searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Location Results
                      </p>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map(
                        (result, index) => (
                          <button
                            key={
                              result?.place_id ||
                              `${result?.lat}-${result?.lon}-${index}`
                            }
                            type="button"
                            onClick={() =>
                              handleSearchResultSelect(
                                result
                              )
                            }
                            className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-indigo-50"
                          >
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                              <MapPinned
                                size={17}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {result?.name ||
                                  result?.display_name?.split(
                                    ","
                                  )?.[0] ||
                                  "Location"}
                              </p>

                              <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                                {
                                  result?.display_name
                                }
                              </p>

                              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                                <span>
                                  {result?.lat}
                                </span>

                                <span>•</span>

                                <span>
                                  {result?.lon}
                                </span>
                              </div>
                            </div>

                            <Navigation
                              size={16}
                              className="mt-1 shrink-0 text-gray-400"
                            />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Search Error */}

            {searchError && (
              <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {searchError}
              </div>
            )}

            <div className="mt-2 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Search by estate, building, street,
                area, town, or landmark.
              </p>

              <button
                type="button"
                onClick={
                  handleUseCurrentLocation
                }
                disabled={
                  submitting ||
                  locatingUser
                }
                className="inline-flex items-center justify-center gap-1.5 font-medium text-indigo-600 transition hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {locatingUser ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />

                    Detecting location...
                  </>
                ) : (
                  <>
                    <LocateFixed size={14} />

                    Use my current location
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================
              MAP
          ======================================================== */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Exact Location
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Search for a place above, select a
                  result, then fine-tune the exact
                  location by clicking the map.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 sm:flex">
                <MapPin size={15} />

                Pick location
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-300 bg-gray-100">
              <div
                className={
                  submitting
                    ? "pointer-events-none opacity-60"
                    : ""
                }
                style={{
                  height: "420px",
                }}
              >
                <StreetOpenMap
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={
                    handleMapLocationChange
                  }
                />
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Powered by OpenStreetMap.
              </p>

              <p>
                Click the map to select the exact
                property position.
              </p>
            </div>
          </div>

          {/* ========================================================
              SELECTED COORDINATES
          ======================================================== */}

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <MapPin size={16} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Selected Coordinates
                </h3>

                <p className="text-xs text-gray-500">
                  Exact GPS position selected on
                  the map.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Latitude */}

              <div>
                <label
                  htmlFor="latitude"
                  className={labelClasses}
                >
                  Latitude
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="-1.286389"
                  className={inputClasses}
                  disabled={submitting}
                />

                <FieldError
                  error={getError(
                    "latitude"
                  )}
                />
              </div>

              {/* Longitude */}

              <div>
                <label
                  htmlFor="longitude"
                  className={labelClasses}
                >
                  Longitude
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="36.817223"
                  className={inputClasses}
                  disabled={submitting}
                />

                <FieldError
                  error={getError(
                    "longitude"
                  )}
                />
              </div>
            </div>

            {form.latitude &&
              form.longitude && (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
                  <span>
                    <strong>
                      Latitude:
                    </strong>{" "}
                    {form.latitude}
                  </span>

                  <span>
                    <strong>
                      Longitude:
                    </strong>{" "}
                    {form.longitude}
                  </span>
                </div>
              )}
          </div>

          {/* ========================================================
              ADDRESS FIELDS
          ======================================================== */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Country */}

            <div>
              <label
                htmlFor="country_name"
                className={labelClasses}
              >
                Country
              </label>

              <input
                id="country_name"
                name="country_name"
                type="text"
                value={form.country_name}
                onChange={handleChange}
                placeholder="Kenya"
                className={inputClasses}
                disabled={submitting}
              />

              <FieldError
                error={getError(
                  "country_name"
                )}
              />
            </div>

            {/* Region */}

            <div>
              <label
                htmlFor="region_name"
                className={labelClasses}
              >
                Region
              </label>

              <input
                id="region_name"
                name="region_name"
                type="text"
                value={form.region_name}
                onChange={handleChange}
                placeholder="Nairobi Region"
                className={inputClasses}
                disabled={submitting}
              />

              <FieldError
                error={getError(
                  "region_name"
                )}
              />
            </div>

            {/* County */}

            <div>
              <label
                htmlFor="county_name"
                className={labelClasses}
              >
                County
              </label>

              <input
                id="county_name"
                name="county_name"
                type="text"
                value={form.county_name}
                onChange={handleChange}
                placeholder="Nairobi"
                className={inputClasses}
                disabled={submitting}
              />

              <FieldError
                error={getError(
                  "county_name"
                )}
              />
            </div>

            {/* City */}

            <div>
              <label
                htmlFor="city_name"
                className={labelClasses}
              >
                City
              </label>

              <input
                id="city_name"
                name="city_name"
                type="text"
                value={form.city_name}
                onChange={handleChange}
                placeholder="Nairobi"
                className={inputClasses}
                disabled={submitting}
              />

              <FieldError
                error={getError(
                  "city_name"
                )}
              />
            </div>

            {/* Area */}

            <div>
              <label
                htmlFor="area_name"
                className={labelClasses}
              >
                Area
              </label>

              <input
                id="area_name"
                name="area_name"
                type="text"
                value={form.area_name}
                onChange={handleChange}
                placeholder="Westlands"
                className={inputClasses}
                disabled={submitting}
              />

              <FieldError
                error={getError(
                  "area_name"
                )}
              />
            </div>

            {/* Street */}

            <div>
              <label
                htmlFor="street_address"
                className={labelClasses}
              >
                Street Address
              </label>

              <input
                id="street_address"
                name="street_address"
                type="text"
                value={form.street_address}
                onChange={handleChange}
                placeholder="Search or click the map to detect address"
                className={inputClasses}
                disabled={submitting}
              />

              <FieldError
                error={getError(
                  "street_address"
                )}
              />

              {form.street_address && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Address detected from the selected
                  map location. You can edit it if
                  necessary.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PROPERTY FEATURES
      ============================================================ */}

      <section className={sectionClasses}>
        <SectionHeader
          icon={Home}
          title="Property Features"
          description="Specify the physical characteristics of the property."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Bedrooms */}

          <div>
            <label
              htmlFor="bedrooms"
              className={labelClasses}
            >
              Bedrooms
            </label>

            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={handleChange}
              placeholder="3"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("bedrooms")}
            />
          </div>

          {/* Bathrooms */}

          <div>
            <label
              htmlFor="bathrooms"
              className={labelClasses}
            >
              Bathrooms
            </label>

            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={handleChange}
              placeholder="2"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("bathrooms")}
            />
          </div>

          {/* Toilets */}

          <div>
            <label
              htmlFor="toilets"
              className={labelClasses}
            >
              Toilets
            </label>

            <input
              id="toilets"
              name="toilets"
              type="number"
              min="0"
              value={form.toilets}
              onChange={handleChange}
              placeholder="3"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("toilets")}
            />
          </div>

          {/* Floors */}

          <div>
            <label
              htmlFor="floors"
              className={labelClasses}
            >
              Floors
            </label>

            <input
              id="floors"
              name="floors"
              type="number"
              min="0"
              value={form.floors}
              onChange={handleChange}
              placeholder="10"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("floors")}
            />
          </div>

          {/* Size */}

          <div>
            <label
              htmlFor="size"
              className={labelClasses}
            >
              Property Size
            </label>

            <input
              id="size"
              name="size"
              type="number"
              min="0"
              step="0.01"
              value={form.size}
              onChange={handleChange}
              placeholder="500"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("size")}
            />
          </div>

          {/* Size Unit */}

          <div>
            <label
              htmlFor="size_unit"
              className={labelClasses}
            >
              Size Unit
            </label>

            <select
              id="size_unit"
              name="size_unit"
              value={form.size_unit}
              onChange={handleChange}
              className={selectClasses}
              disabled={submitting}
            >
              <option value="sqm">
                Square Metres (sqm)
              </option>

              <option value="sqft">
                Square Feet (sqft)
              </option>

              <option value="acres">
                Acres
              </option>

              <option value="hectares">
                Hectares
              </option>
            </select>

            <FieldError
              error={getError("size_unit")}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          PRICING
      ============================================================ */}

      <section className={sectionClasses}>
        <SectionHeader
          icon={DollarSign}
          title="Pricing"
          description="Configure the property's pricing information."
        />

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Sale Price */}

          <div>
            <label
              htmlFor="price"
              className={labelClasses}
            >
              Sale Price
            </label>

            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="25000000"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError("price")}
            />
          </div>

          {/* Monthly Rent */}

          <div>
            <label
              htmlFor="monthly_rent"
              className={labelClasses}
            >
              Monthly Rent
            </label>

            <input
              id="monthly_rent"
              name="monthly_rent"
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_rent}
              onChange={handleChange}
              placeholder="250000"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError(
                "monthly_rent"
              )}
            />
          </div>

          {/* Service Charge */}

          <div>
            <label
              htmlFor="service_charge"
              className={labelClasses}
            >
              Service Charge
            </label>

            <input
              id="service_charge"
              name="service_charge"
              type="number"
              min="0"
              step="0.01"
              value={form.service_charge}
              onChange={handleChange}
              placeholder="25000"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError(
                "service_charge"
              )}
            />
          </div>

          {/* Currency */}

          <div>
            <label
              htmlFor="currency"
              className={labelClasses}
            >
              Currency
            </label>

            <select
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className={selectClasses}
              disabled={submitting}
            >
              <option value="KES">
                KES — Kenyan Shilling
              </option>

              <option value="USD">
                USD — US Dollar
              </option>

              <option value="EUR">
                EUR — Euro
              </option>

              <option value="GBP">
                GBP — British Pound
              </option>
            </select>

            <FieldError
              error={getError("currency")}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          PROPERTY SETTINGS
      ============================================================ */}

      <section className={sectionClasses}>
        <SectionHeader
          icon={BadgeCheck}
          title="Property Settings"
          description="Control visibility and property status."
        />

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          {/* Featured */}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured}
              onChange={handleChange}
              disabled={submitting}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Star size={16} />

                Featured Property
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Highlight this property in featured
                listings.
              </p>
            </div>
          </label>

          {/* Verified */}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30">
            <input
              type="checkbox"
              name="is_verified"
              checked={form.is_verified}
              onChange={handleChange}
              disabled={submitting}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <BadgeCheck size={16} />

                Verified Property
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Mark this property as verified.
              </p>
            </div>
          </label>

          {/* Published */}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30">
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
              disabled={submitting}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                {form.is_published ? (
                  <Eye size={16} />
                ) : (
                  <EyeOff size={16} />
                )}

                Published
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Make this property visible to
                users.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ============================================================
          MEDIA
      ============================================================ */}

      <section className={sectionClasses}>
        <SectionHeader
          icon={ImageIcon}
          title="Media"
          description="Add property images and virtual media."
        />

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          {/* Image URL */}

          <div className="md:col-span-2">
            <label
              htmlFor="image_url"
              className={labelClasses}
            >
              Property Image URL
            </label>

            <div className="relative">
              <ImageIcon
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="image_url"
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={
                  handleImageUrlChange
                }
                placeholder="https://example.com/property.jpg"
                className={`${inputClasses} pl-10`}
                disabled={submitting}
              />
            </div>

            <FieldError
              error={getError("image_url")}
            />
          </div>

          {/* Image Preview */}

          {imagePreview && (
            <div className="md:col-span-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <ImageIcon size={16} />

                    Image Preview
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");

                      setForm(
                        (previous) => ({
                          ...previous,
                          image_url: "",
                        })
                      );
                    }}
                    className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    disabled={submitting}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4">
                  <img
                    src={imagePreview}
                    alt="Property preview"
                    className="h-64 w-full rounded-lg object-cover"
                    onError={() =>
                      setImagePreview("")
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail URL */}

          <div>
            <label
              htmlFor="thumbnail_url"
              className={labelClasses}
            >
              Thumbnail URL
            </label>

            <input
              id="thumbnail_url"
              name="thumbnail_url"
              type="url"
              value={form.thumbnail_url}
              onChange={handleChange}
              placeholder="https://example.com/thumbnail.jpg"
              className={inputClasses}
              disabled={submitting}
            />

            <FieldError
              error={getError(
                "thumbnail_url"
              )}
            />
          </div>

          {/* Video URL */}

          <div>
            <label
              htmlFor="video_url"
              className={labelClasses}
            >
              Video URL
            </label>

            <div className="relative">
              <Video
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="video_url"
                name="video_url"
                type="url"
                value={form.video_url}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
                className={`${inputClasses} pl-10`}
                disabled={submitting}
              />
            </div>

            <FieldError
              error={getError("video_url")}
            />
          </div>

          {/* Virtual Tour */}

          <div className="md:col-span-2">
            <label
              htmlFor="virtual_tour_url"
              className={labelClasses}
            >
              Virtual Tour URL
            </label>

            <div className="relative">
              <Globe
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="virtual_tour_url"
                name="virtual_tour_url"
                type="url"
                value={form.virtual_tour_url}
                onChange={handleChange}
                placeholder="https://example.com/virtual-tour"
                className={`${inputClasses} pl-10`}
                disabled={submitting}
              />
            </div>

            <FieldError
              error={getError(
                "virtual_tour_url"
              )}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          FORM ACTIONS
      ============================================================ */}

      <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FileText size={15} />

          <span>
            {isEditMode
              ? "Update the property information and save your changes."
              : "Complete the property information before creating it."}
          </span>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          {/* Cancel */}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <X size={17} />

              {cancelLabel}
            </button>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {submitting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Saving...
              </>
            ) : (
              <>
                <Save size={17} />

                {submitText}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PropertyForm;