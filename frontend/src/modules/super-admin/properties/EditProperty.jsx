
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import PropertyForm from "./PropertyForm";
import PropertyHeader from "./PropertyHeader";

import useProperty from "../../../hooks/useProperties";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PROPERTY_INDEX_PATH = "/super-admin/properties";

/*
|--------------------------------------------------------------------------
| Extract Error Message
|--------------------------------------------------------------------------
*/

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to update property.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to update property."
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
| Extract Property Data
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
| Check Update Success
|--------------------------------------------------------------------------
*/

const isSuccessfulResponse = (response, updatedProperty) => {
  if (updatedProperty?.id) {
    return true;
  }

  if (response?.success === true) {
    return true;
  }

  if (response?.status === true) {
    return true;
  }

  if (
    response?.status === 200 ||
    response?.status === 201 ||
    response?.status === 204
  ) {
    return true;
  }

  return false;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Property Hook
  |--------------------------------------------------------------------------
  */

  const {
    getProperty,
    updateProperty,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [property, setProperty] = useState(null);

  const [fetching, setFetching] = useState(true);

  const [submittingForm, setSubmittingForm] = useState(false);

  const [serverError, setServerError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Stable Function Refs
  |--------------------------------------------------------------------------
  */

  const getPropertyRef = useRef(getProperty);
  const updatePropertyRef = useRef(updateProperty);

  useEffect(() => {
    getPropertyRef.current = getProperty;
  }, [getProperty]);

  useEffect(() => {
    updatePropertyRef.current = updateProperty;
  }, [updateProperty]);

  /*
  |--------------------------------------------------------------------------
  | Request Guards
  |--------------------------------------------------------------------------
  */

  const submissionStartedRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  const isSubmitting =
    Boolean(submittingForm) ||
    Boolean(propertyLoading);

  /*
  |--------------------------------------------------------------------------
  | Fetch Property
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      if (!id) {
        setServerError("Property ID is missing.");
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        setServerError("");
        setFieldErrors({});
        setProperty(null);

        if (typeof getPropertyRef.current !== "function") {
          throw new Error(
            "getProperty is not available in useProperty."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | API Request
        |--------------------------------------------------------------------------
        */

        const response = await getPropertyRef.current(id);

        /*
        |--------------------------------------------------------------------------
        | Normalize Response
        |--------------------------------------------------------------------------
        */

        const fetchedProperty = extractPropertyData(response);

        if (!fetchedProperty) {
          throw new Error(
            "The requested property could not be found."
          );
        }

        if (mounted) {
          setProperty(fetchedProperty);
        }

        if (import.meta.env.DEV) {
          console.log(
            "[EditProperty] Loaded property:",
            fetchedProperty
          );
        }

      } catch (error) {
        console.error(
          "[EditProperty] Failed to fetch property:",
          error
        );

        if (mounted) {
          setServerError(extractErrorMessage(error));

          setFieldErrors(
            extractValidationErrors(error)
          );
        }

      } finally {
        if (mounted) {
          setFetching(false);
        }
      }
    };

    fetchProperty();

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Submit Property Update
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (formData = {}) => {
    if (!id || submissionStartedRef.current) {
      return;
    }

    try {
      submissionStartedRef.current = true;

      setSubmittingForm(true);
      setServerError("");
      setFieldErrors({});

      /*
      |--------------------------------------------------------------------------
      | Check Update Method
      |--------------------------------------------------------------------------
      */

      if (typeof updatePropertyRef.current !== "function") {
        throw new Error(
          "updateProperty is not available in useProperty."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Development Debugging
      |--------------------------------------------------------------------------
      */

      if (import.meta.env.DEV) {
        console.group("[EditProperty] Update property");
        console.log("Property ID:", id);
        console.log("Form data:", formData);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const response = await updatePropertyRef.current(
        id,
        formData
      );

      /*
      |--------------------------------------------------------------------------
      | Extract Updated Property
      |--------------------------------------------------------------------------
      */

      const updatedProperty = extractPropertyData(response);

      /*
      |--------------------------------------------------------------------------
      | Check Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        response,
        updatedProperty
      );

      if (!requestSucceeded) {
        const message =
          response?.message ||
          "Unable to update property.";

        setServerError(message);

        setFieldErrors(
          extractValidationErrors(response)
        );

        await Swal.fire({
          icon: "error",
          title: "Unable to Update Property",
          text: message,
          confirmButtonText: "Close",
          confirmButtonColor: "#dc2626",
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Update Local Property
      |--------------------------------------------------------------------------
      */

      if (updatedProperty) {
        setProperty(updatedProperty);
      }

      /*
      |--------------------------------------------------------------------------
      | Success Notification
      |--------------------------------------------------------------------------
      */

      const message =
        response?.message ||
        "Property updated successfully.";

      if (import.meta.env.DEV) {
        console.log(
          "[EditProperty] Updated property:",
          updatedProperty
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Property Updated Successfully",
        text: message,
        confirmButtonText: "View Properties",
        confirmButtonColor: "#4f46e5",
      });

      navigate(PROPERTY_INDEX_PATH, {
        replace: true,
      });

    } catch (error) {
      console.error(
        "[EditProperty] Property update failed:",
        error
      );

      const message = extractErrorMessage(error);

      setServerError(message);

      setFieldErrors(
        extractValidationErrors(error)
      );

      await Swal.fire({
        icon: "error",
        title: "Unable to Update Property",
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
    if (isSubmitting) {
      return;
    }

    navigate(PROPERTY_INDEX_PATH);
  }, [isSubmitting, navigate]);

  /*
  |--------------------------------------------------------------------------
  | Dismiss Error
  |--------------------------------------------------------------------------
  */

  const handleDismissError = useCallback(() => {
    setServerError("");
    setFieldErrors({});
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (fetching) {
    return (
      <div className="min-w-0 space-y-6">

        <PropertyHeader
          title="Edit Property"
          description="Update property information, location, pricing and media."
          backUrl={PROPERTY_INDEX_PATH}
          backLabel="Back to Properties"
        />

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">

          <div className="flex flex-col items-center gap-3 text-center">

            <Loader2
              size={38}
              className="animate-spin text-indigo-600"
            />

            <div>
              <p className="text-sm font-semibold text-gray-800">
                Loading property details...
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Preparing the property information for editing.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Property Not Found
  |--------------------------------------------------------------------------
  */

  if (!property) {
    return (
      <div className="min-w-0 space-y-6">

        <PropertyHeader
          title="Edit Property"
          description="Update property information."
          backUrl={PROPERTY_INDEX_PATH}
          backLabel="Back to Properties"
        />

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-5">

          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={24} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-red-800">
              Unable to Load Property
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-600">
              {serverError ||
                "The requested property could not be found."}
            </p>

            <button
              type="button"
              onClick={handleCancel}
              className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Properties
            </button>

          </div>
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
    <div className="min-w-0 space-y-6">

      {/* Property Header */}

      <PropertyHeader
        title="Edit Property"
        description="Update the property information, location, pricing and media."
        backUrl={PROPERTY_INDEX_PATH}
        backLabel="Back to Properties"
        loading={isSubmitting}
      />

      {/* General Error */}

      {(serverError || propertyError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">

          <div className="flex gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="text-sm font-semibold text-red-800">
                Unable to update property
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  extractErrorMessage(propertyError)}
              </p>

              <button
                type="button"
                onClick={handleDismissError}
                disabled={isSubmitting}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Dismiss Error
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Property Form */}

      <PropertyForm
        property={property}
        propertyTypes={
          property?.property_types ||
          property?.propertyTypes ||
          []
        }
        propertyCategories={
          property?.property_categories ||
          property?.propertyCategories ||
          []
        }
        errors={fieldErrors}
        loading={false}
        submitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Update Property"
        cancelLabel="Cancel"
      />

    </div>
  );
};

export default EditProperty;
