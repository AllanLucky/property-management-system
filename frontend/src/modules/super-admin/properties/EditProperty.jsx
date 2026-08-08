
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import PropertyForm from "./PropertyForm";
import PropertyHeader from "./PropertyHeader";
import useProperty from "../../../hooks/useProperties";

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    getProperty,
    updateProperty,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();

  const [property, setProperty] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      if (!id) {
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        setErrors({});

        let response;

        /*
        |--------------------------------------------------------------------------
        | Use hook method when available
        |--------------------------------------------------------------------------
        */

        if (typeof getProperty === "function") {
          response = await getProperty(id);
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize response
        |--------------------------------------------------------------------------
        */

        const fetchedProperty =
          response?.data?.data ??
          response?.data ??
          response ??
          null;

        if (mounted) {
          setProperty(fetchedProperty);
        }
      } catch (error) {
        console.error(
          "Failed to fetch property:",
          error
        );

        if (mounted) {
          setErrors(
            error?.response?.data?.errors || {
              general: [
                error?.response?.data?.message ||
                  "Failed to load property.",
              ],
            }
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
  }, [id, getProperty]);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (formData) => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      if (typeof updateProperty !== "function") {
        throw new Error(
          "updateProperty is not available in useProperty."
        );
      }

      await updateProperty(id, formData);

      navigate("/super-admin/properties");
    } catch (error) {
      console.error(
        "Property update failed:",
        error
      );

      setErrors(
        error?.response?.data?.errors || {
          general: [
            error?.response?.data?.message ||
              propertyError ||
              "Failed to update property.",
          ],
        }
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    navigate("/super-admin/properties");
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMITTING STATE
  |--------------------------------------------------------------------------
  */

  const isSubmitting =
    loading || propertyLoading;

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (fetching) {
    return (
      <div className="min-h-[500px]">
        <div className="flex min-h-[500px] items-center justify-center">
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
  | PROPERTY NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!property) {
    return (
      <div className="min-h-[500px]">
        <div className="mx-auto flex min-h-[500px] max-w-3xl items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800">
              Unable to load property
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {errors?.general?.[0] ||
                errors?.general ||
                "The requested property could not be found."}
            </p>

            <button
              type="button"
              onClick={handleCancel}
              className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
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
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* PROPERTY HEADER                                                     */}
      {/* ------------------------------------------------------------------ */}

      <PropertyHeader
        title="Edit Property"
        description="Update the property information, location, pricing and media."
        backUrl="/super-admin/properties"
        backLabel="Back to Properties"
      />

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT                                                             */}
      {/* ------------------------------------------------------------------ */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* General Error */}

        {errors?.general && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {Array.isArray(errors.general)
                ? errors.general[0]
                : errors.general}
            </p>
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
          errors={errors}
          loading={isSubmitting}
          submitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update Property"
          cancelLabel="Cancel"
        />
      </main>
    </div>
  );
};

export default EditProperty;

