
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../../../api/axios";

import PropertyHeader from "./PropertyHeader";
import PropertyForm from "./PropertyForm";

import useProperty from "../../../hooks/useProperties";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PROPERTY_INDEX_PATH = "/super-admin/properties";

const INITIAL_VALUES = {
  title: "",
  description: "",
  property_type_id: "",
  property_category_id: "",
  listing_type: "rent",
  status: "draft",

  country_id: "",
  region_id: "",
  county_id: "",
  city_id: "",
  area_id: "",

  country_name: "Kenya",
  region_name: "",
  county_name: "",
  city_name: "",
  area_name: "",
  street_address: "",
  latitude: "",
  longitude: "",

  bedrooms: "",
  bathrooms: "",
  toilets: "",
  floors: "",
  size: "",
  size_unit: "sqm",

  price: "",
  monthly_rent: "",
  service_charge: "",
  currency: "KES",

  is_featured: false,
  is_verified: false,
  is_published: false,

  image_url: "",
  thumbnail_url: "",
  video_url: "",
  virtual_tour_url: "",
};

/*
|--------------------------------------------------------------------------
| Extract Error Message
|--------------------------------------------------------------------------
*/

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create property.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to create property."
  );
};

/*
|--------------------------------------------------------------------------
| Extract Validation Errors
|--------------------------------------------------------------------------
*/

const extractValidationErrors = (error) => {
  const errors =
    error?.response?.data?.errors ||
    error?.data?.errors ||
    error?.errors ||
    {};

  return (
    errors &&
    typeof errors === "object" &&
    !Array.isArray(errors)
  )
    ? errors
    : {};
};

/*
|--------------------------------------------------------------------------
| Extract Collection Data
|--------------------------------------------------------------------------
*/

const extractCollection = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.data?.data)) {
    return response.data.data.data;
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Extract Created Property
|--------------------------------------------------------------------------
*/

const extractPropertyData = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  let current = response;

  // Unwrap Axios response.
  if (
    current.data &&
    typeof current.data === "object" &&
    (
      current.status === undefined ||
      typeof current.status === "number"
    )
  ) {
    current = current.data;
  }

  // Unwrap API response.
  if (
    current.data &&
    typeof current.data === "object" &&
    !Array.isArray(current.data)
  ) {
    current = current.data;
  }

  // Handle nested property wrappers.
  for (let index = 0; index < 4; index += 1) {
    if (
      current?.property &&
      typeof current.property === "object"
    ) {
      current = current.property;
      continue;
    }

    if (
      current?.data &&
      typeof current.data === "object" &&
      !Array.isArray(current.data)
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return (
    current &&
    typeof current === "object" &&
    current.id
  )
    ? current
    : null;
};

/*
|--------------------------------------------------------------------------
| Check Request Success
|--------------------------------------------------------------------------
*/

const isSuccessfulResponse = (response, createdProperty) => {
  if (createdProperty?.id) {
    return true;
  }

  if (response?.success === true) {
    return true;
  }

  if (response?.status === true) {
    return true;
  }

  if (
    response?.status === 201 ||
    response?.status === 200
  ) {
    return true;
  }

  return false;
};

/*
|--------------------------------------------------------------------------
| Normalize Boolean
|--------------------------------------------------------------------------
*/

const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Optional Number
|--------------------------------------------------------------------------
*/

const optionalNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

/*
|--------------------------------------------------------------------------
| Build Property Payload
|--------------------------------------------------------------------------
*/

const buildPropertyPayload = (values) => {
  return {
    ...values,

    // Location IDs
    country_id: optionalNumber(values.country_id),
    region_id: optionalNumber(values.region_id),
    county_id: optionalNumber(values.county_id),
    city_id: optionalNumber(values.city_id),
    area_id: optionalNumber(values.area_id),

    // Location Names
    country_name: values.country_name || null,
    region_name: values.region_name || null,
    county_name: values.county_name || null,
    city_name: values.city_name || null,
    area_name: values.area_name || null,

    // Coordinates
    latitude: optionalNumber(values.latitude),
    longitude: optionalNumber(values.longitude),

    // Property Features
    bedrooms: optionalNumber(values.bedrooms),
    bathrooms: optionalNumber(values.bathrooms),
    toilets: optionalNumber(values.toilets),
    floors: optionalNumber(values.floors),
    size: optionalNumber(values.size),

    // Pricing
    price: optionalNumber(values.price),
    monthly_rent: optionalNumber(values.monthly_rent),
    service_charge: optionalNumber(values.service_charge),

    // Boolean Fields
    is_featured: normalizeBoolean(values.is_featured),
    is_verified: normalizeBoolean(values.is_verified),
    is_published: normalizeBoolean(values.is_published),

    // Text Fields
    title: String(values.title || "").trim(),
    description: String(values.description || "").trim(),
    street_address: String(
      values.street_address || ""
    ).trim(),

    image_url: values.image_url || null,
    thumbnail_url: values.thumbnail_url || null,
    video_url: values.video_url || null,
    virtual_tour_url: values.virtual_tour_url || null,
  };
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CreateProperty = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Property Hook
  |--------------------------------------------------------------------------
  */

  const {
    addProperty,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [propertyTypes, setPropertyTypes] = useState([]);
  const [propertyCategories, setPropertyCategories] = useState([]);

  const [lookupLoading, setLookupLoading] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Stable Function Refs
  |--------------------------------------------------------------------------
  */

  const addPropertyRef = useRef(addProperty);

  useEffect(() => {
    addPropertyRef.current = addProperty;
  }, [addProperty]);

  /*
  |--------------------------------------------------------------------------
  | Request Guard
  |--------------------------------------------------------------------------
  */

  const submissionStartedRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  const isCreating =
    Boolean(submittingForm) ||
    Boolean(propertyLoading);

  /*
  |--------------------------------------------------------------------------
  | Fetch Property Types and Categories
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const fetchLookups = async () => {
      setLookupLoading(true);
      setServerError("");

      try {
        const [
          propertyTypesResponse,
          propertyCategoriesResponse,
        ] = await Promise.all([
          api.get("/property-types"),
          api.get("/property-categories"),
        ]);

        if (!mounted) {
          return;
        }

        setPropertyTypes(
          extractCollection(propertyTypesResponse)
        );

        setPropertyCategories(
          extractCollection(propertyCategoriesResponse)
        );

      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "[CreateProperty] Lookup loading failed:",
          error
        );

        setServerError(
          "Unable to load property types and categories. Please refresh the page and try again."
        );

        await Swal.fire({
          icon: "error",
          title: "Unable to Load Property Data",
          text: extractErrorMessage(error),
          confirmButtonText: "Close",
          confirmButtonColor: "#dc2626",
        });

      } finally {
        if (mounted) {
          setLookupLoading(false);
        }
      }
    };

    fetchLookups();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Handle Form Changes
  |--------------------------------------------------------------------------
  */

  const handleChange = useCallback((eventOrField, maybeValue) => {
    let name;
    let value;

    if (typeof eventOrField === "string") {
      name = eventOrField;
      value = maybeValue;
    } else {
      name = eventOrField?.target?.name;

      if (eventOrField?.target?.type === "checkbox") {
        value = eventOrField.target.checked;
      } else {
        value = eventOrField?.target?.value;
      }
    }

    if (!name) {
      return;
    }

    setFieldErrors((current) => {
      const next = { ...current };

      delete next[name];

      return next;
    });

    setServerError("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Client Validation
  |--------------------------------------------------------------------------
  */

  const validate = useCallback((values) => {
    const errors = {};

    /*
    |--------------------------------------------------------------------------
    | Title
    |--------------------------------------------------------------------------
    */

    const title = String(
      values.title || ""
    ).trim();

    if (!title) {
      errors.title = "Property title is required.";
    } else if (title.length < 3 || title.length > 180) {
      errors.title =
        "Property title must contain between 3 and 180 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | Property Type
    |--------------------------------------------------------------------------
    */

    if (!values.property_type_id) {
      errors.property_type_id =
        "Please select a property type.";
    }

    /*
    |--------------------------------------------------------------------------
    | Property Category
    |--------------------------------------------------------------------------
    */

    if (!values.property_category_id) {
      errors.property_category_id =
        "Please select a property category.";
    }

    /*
    |--------------------------------------------------------------------------
    | Listing Type
    |--------------------------------------------------------------------------
    */

    if (!values.listing_type) {
      errors.listing_type =
        "Please select a listing type.";
    }

    /*
    |--------------------------------------------------------------------------
    | Location
    |--------------------------------------------------------------------------
    */

    if (!values.country_id) {
      errors.country_id =
        "Please select a country.";
    }

    if (!values.region_id) {
      errors.region_id =
        "Please select a region.";
    }

    if (!values.county_id) {
      errors.county_id =
        "Please select a county.";
    }

    if (!values.city_id) {
      errors.city_id =
        "Please select a city.";
    }

    /*
    |--------------------------------------------------------------------------
    | Coordinates
    |--------------------------------------------------------------------------
    */

    if (values.latitude !== "" && values.latitude !== null) {
      const latitude = Number(values.latitude);

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.latitude =
          "Latitude must be between -90 and 90.";
      }
    }

    if (values.longitude !== "" && values.longitude !== null) {
      const longitude = Number(values.longitude);

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        errors.longitude =
          "Longitude must be between -180 and 180.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing
    |--------------------------------------------------------------------------
    */

    const numericFields = [
      "price",
      "monthly_rent",
      "service_charge",
      "size",
    ];

    numericFields.forEach((field) => {
      const value = values[field];

      if (value === "" || value === null || value === undefined) {
        return;
      }

      const number = Number(value);

      if (!Number.isFinite(number) || number < 0) {
        errors[field] =
          "Please enter a valid non-negative number.";
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Set Errors
    |--------------------------------------------------------------------------
    */

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit Property
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (formValues = {}) => {
    if (submissionStartedRef.current) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Form Values
    |--------------------------------------------------------------------------
    */

    const values = {
      ...INITIAL_VALUES,
      ...formValues,
    };

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (!validate(values)) {
      return;
    }

    try {
      submissionStartedRef.current = true;

      setSubmittingForm(true);
      setServerError("");
      setFieldErrors({});

      /*
      |--------------------------------------------------------------------------
      | Build Payload
      |--------------------------------------------------------------------------
      */

      const payload = buildPropertyPayload(values);

      /*
      |--------------------------------------------------------------------------
      | Development Debugging
      |--------------------------------------------------------------------------
      */

      if (import.meta.env.DEV) {
        console.group("[CreateProperty] Create property");
        console.log("Form values:", values);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const result = await addPropertyRef.current(payload);

      /*
      |--------------------------------------------------------------------------
      | Extract Created Property
      |--------------------------------------------------------------------------
      */

      const createdProperty = extractPropertyData(result);

      /*
      |--------------------------------------------------------------------------
      | Determine Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        result,
        createdProperty
      );

      if (!requestSucceeded) {
        const message =
          result?.message ||
          "Unable to create property.";

        const errors =
          result?.errors || {};

        setServerError(message);
        setFieldErrors(errors);

        if (import.meta.env.DEV) {
          console.error(
            "[CreateProperty] Creation failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Create Property",
          text: message,
          confirmButtonText: "Close",
          confirmButtonColor: "#dc2626",
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      const message =
        result?.message ||
        `${createdProperty?.title || "Property"} created successfully.`;

      if (import.meta.env.DEV) {
        console.log(
          "[CreateProperty] Created property:",
          createdProperty
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Property Created Successfully",
        text: message,
        confirmButtonText: "View Properties",
        confirmButtonColor: "#4f46e5",
      });

      navigate(PROPERTY_INDEX_PATH, {
        replace: true,
      });

    } catch (error) {
      const message = extractErrorMessage(error);
      const errors = extractValidationErrors(error);

      setServerError(message);
      setFieldErrors(errors);

      if (import.meta.env.DEV) {
        console.error(
          "[CreateProperty] Create failed:",
          error
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Create Property",
        text: message,
        confirmButtonText: "Close",
        confirmButtonColor: "#dc2626",
      });

    } finally {
      submissionStartedRef.current = false;
      setSubmittingForm(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    if (isCreating) {
      return;
    }

    navigate(PROPERTY_INDEX_PATH);
  }, [isCreating, navigate]);

  /*
  |--------------------------------------------------------------------------
  | Dismiss Error
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    setServerError("");
    setFieldErrors({});
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* Property Header */}

      <PropertyHeader
        loading={isCreating}
        backTo={PROPERTY_INDEX_PATH}
      />

      {/* Error Message */}

      {(serverError || propertyError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">

          <div className="flex gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="text-sm font-semibold text-red-800">
                Unable to create property
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  extractErrorMessage(propertyError)}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isCreating}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Dismiss Error
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Lookup Loading Notice */}

      {lookupLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">

          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />

          <p className="text-sm font-medium text-indigo-700">
            Loading property types and categories...
          </p>
        </div>
      )}

      {/* Property Form */}

      <PropertyForm
        propertyTypes={propertyTypes}
        propertyCategories={propertyCategories}
        loading={lookupLoading}
        submitting={isCreating || lookupLoading}
        errors={{
          ...(fieldErrors || {}),
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Property"
        cancelLabel="Cancel"
      />

    </div>
  );
};

export default CreateProperty;
