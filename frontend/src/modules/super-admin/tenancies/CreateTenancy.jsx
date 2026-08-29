import {
  ArrowLeft,
  Building2,
  Loader2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";
import { addNotification } from "../../../store/uiSlice";
import TenancyForm from "./TenancyForm";

/**
 * ============================================================================
 * CREATE TENANCY
 * ============================================================================
 *
 * Responsibilities:
 * - Load properties, apartments, units and tenants needed by TenancyForm
 * - Keep Create Tenancy independent from the Edit Tenancy page
 * - Support Laravel response shapes such as:
 *      { data: [...] }
 *      { data: { data: [...] } }
 *      { items: [...] }
 *      { results: [...] }
 * - Use apartments returned inside a property response when available
 * - Fall back to the standalone /apartments endpoint when necessary
 * - Submit the tenancy payload
 * - Display useful API errors
 * - Show a success notification
 * - Redirect after successful creation
 * - Prevent duplicate submissions
 */

/**
 * ============================================================================
 * API / COLLECTION HELPERS
 * ============================================================================
 */

/**
 * Convert common Laravel/Axios collection response shapes into an array.
 */
const extractCollection = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value.data)) {
    return value.data;
  }

  if (Array.isArray(value.items)) {
    return value.items;
  }

  if (Array.isArray(value.results)) {
    return value.results;
  }

  if (
    value.data &&
    typeof value.data === "object"
  ) {
    if (Array.isArray(value.data.data)) {
      return value.data.data;
    }

    if (Array.isArray(value.data.items)) {
      return value.data.items;
    }

    if (Array.isArray(value.data.results)) {
      return value.data.results;
    }
  }

  return [];
};

/**
 * Extract a useful error message from Laravel/Axios errors.
 */
const getErrorMessage = (error) => {
  if (!error) {
    return "Unable to load tenancy data. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData =
    error?.response?.data;

  if (
    responseData?.message &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  if (
    responseData?.error &&
    typeof responseData.error === "string"
  ) {
    return responseData.error;
  }

  if (responseData?.errors) {
    if (typeof responseData.errors === "string") {
      return responseData.errors;
    }

    if (
      typeof responseData.errors === "object"
    ) {
      const messages = Object.values(
        responseData.errors
      )
        .flat()
        .filter(Boolean)
        .map(String);

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }

  if (
    error?.message &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to load tenancy data. Please try again.";
};

/**
 * Add parent property_id to nested apartments when the property endpoint
 * does not include it.
 */
const getNestedApartments = (properties) => {
  const propertyList =
    extractCollection(properties);

  const apartments = [];

  for (const property of propertyList) {
    if (
      !property ||
      typeof property !== "object"
    ) {
      continue;
    }

    const propertyId =
      property?.id ??
      property?.property_id ??
      property?.propertyId;

    const nestedApartments =
      extractCollection(
        property?.apartments
      );

    for (const apartment of nestedApartments) {
      if (
        !apartment ||
        typeof apartment !== "object"
      ) {
        continue;
      }

      apartments.push({
        ...apartment,
        property_id:
          apartment?.property_id ??
          apartment?.propertyId ??
          propertyId,
      });
    }
  }

  return apartments;
};

/**
 * Remove duplicate apartments/units/tenants by numeric/string id.
 */
const uniqueById = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const id =
      item?.id ??
      item?.property_id ??
      item?.propertyId ??
      item?.apartment_id ??
      item?.apartmentId ??
      item?.unit_id ??
      item?.unitId ??
      item?.tenant_id ??
      item?.tenantId;

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      return true;
    }

    const key = String(id);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

/**
 * ============================================================================
 * COMPONENT
 * ============================================================================
 */

const CreateTenancy = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [properties, setProperties] =
    useState([]);

  const [apartments, setApartments] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  const [tenants, setTenants] =
    useState([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState(null);

  /**
   * --------------------------------------------------------------------------
   * LOAD FORM DATA
   * --------------------------------------------------------------------------
   *
   * We intentionally do not depend on TenancyForm's internal field state.
   * CreateTenancy owns the data collections and passes them to TenancyForm.
   *
   * The property response is checked first for embedded apartments. This
   * matches property API responses that include:
   *
   *   property.apartments = [...]
   *
   * If no apartments are embedded, we fall back to /apartments.
   */

  useEffect(() => {
    let cancelled = false;

    const loadFormData = async () => {
      setLoadingData(true);
      setError(null);

      try {
        /**
         * Load properties first because they may already contain apartments.
         */
        const propertiesResponse =
          await api.get("/properties");

        if (cancelled) {
          return;
        }

        const propertyList =
          extractCollection(
            propertiesResponse?.data
          );

        setProperties(propertyList);

        /**
         * Apartments can be embedded inside properties.
         */
        let apartmentList =
          uniqueById(
            getNestedApartments(
              propertiesResponse?.data
            )
          );

        /**
         * Load tenants and units together.
         *
         * Keep these independent so a failure in one endpoint can be reported
         * clearly instead of silently producing empty dropdowns.
         */
        const [
          tenantsResult,
          unitsResult,
        ] = await Promise.all([
          api.get("/tenants"),
          api.get("/units"),
        ]);

        if (cancelled) {
          return;
        }

        setTenants(
          uniqueById(
            extractCollection(
              tenantsResult?.data
            )
          )
        );

        setUnits(
          uniqueById(
            extractCollection(
              unitsResult?.data
            )
          )
        );

        /**
         * Fallback:
         * Some property endpoints do not include apartments.
         *
         * In that case fetch the standalone apartments collection.
         */
        if (apartmentList.length === 0) {
          const apartmentsResponse =
            await api.get("/apartments");

          if (cancelled) {
            return;
          }

          apartmentList =
            uniqueById(
              extractCollection(
                apartmentsResponse?.data
              )
            );
        }

        if (!cancelled) {
          setApartments(apartmentList);
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message =
          getErrorMessage(loadError);

        setError({
          message,
        });
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    };

    loadFormData();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * --------------------------------------------------------------------------
   * BACK / CANCEL
   * --------------------------------------------------------------------------
   */

  const handleCancel = useCallback(() => {
    if (submitting) {
      return;
    }

    navigate("/super-admin/tenancies");
  }, [navigate, submitting]);

  /**
   * --------------------------------------------------------------------------
   * SUBMIT
   * --------------------------------------------------------------------------
   */

  const handleSubmit = useCallback(
    async (payload) => {
      if (submitting) {
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await api.post(
            "/tenancies",
            payload
          );

        const responseData =
          response?.data ?? response;

        /**
         * Treat explicit API failure responses as errors.
         */
        if (
          responseData?.status === false
        ) {
          throw new Error(
            responseData?.message ||
            "Failed to create tenancy."
          );
        }

        dispatch(
          addNotification({
            type: "success",
            message:
              responseData?.message ||
              "Tenancy created successfully.",
          })
        );

        navigate(
          "/super-admin/tenancies",
          {
            replace: true,
          }
        );
      } catch (submitError) {
        const message =
          getErrorMessage(
            submitError
          );

        setError({
          message,
        });

        throw submitError;
      } finally {
        setSubmitting(false);
      }
    },
    [
      dispatch,
      navigate,
      submitting,
    ]
  );

  /**
   * --------------------------------------------------------------------------
   * FORM COLLECTIONS
   * --------------------------------------------------------------------------
   *
   * These memoized references prevent unnecessary TenancyForm renders when
   * the underlying collections have not changed.
   */

  const formProperties =
    useMemo(
      () => properties,
      [properties]
    );

  const formApartments =
    useMemo(
      () => apartments,
      [apartments]
    );

  const formUnits =
    useMemo(
      () => units,
      [units]
    );

  const formTenants =
    useMemo(
      () => tenants,
      [tenants]
    );

  /**
   * ==========================================================================
   * RENDER
   * ==========================================================================
   */

  return (
    <div className="min-h-full space-y-6">
      {/* ================================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          className="
            flex
            flex-col
            gap-4
            px-5
            py-5
            sm:px-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* -------------------------------------------------------------- */}
          {/* LEFT SIDE */}
          {/* -------------------------------------------------------------- */}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              aria-label="Back to tenancies"
              title="Back to tenancies"
              className="
                inline-flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-gray-300
                bg-white
                text-gray-600
                shadow-sm
                transition
                hover:bg-gray-50
                hover:text-gray-900
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">
                Create Tenancy
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Create a new tenancy and assign it
                to a tenant and unit.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* LOADING / SUBMITTING INDICATOR */}
          {/* -------------------------------------------------------------- */}

          {(loadingData || submitting) && (
            <div className="inline-flex items-center gap-2 self-start text-sm text-gray-500 lg:self-auto">
              <Loader2 className="h-4 w-4 animate-spin" />

              <span>
                {submitting
                  ? "Creating tenancy..."
                  : "Loading tenancy data..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* LOAD ERROR */}
      {/* ================================================================== */}

      {error && !loadingData && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <p className="font-semibold">
            Unable to load tenancy data
          </p>

          <p className="mt-1">
            {error.message ||
              "Please try again."}
          </p>
        </div>
      )}

      {/* ================================================================== */}
      {/* TENANCY FORM */}
      {/* ================================================================== */}

      <TenancyForm
        key="create-tenancy-form"
        mode="create"
        loading={loadingData}
        submitting={submitting}
        error={error}
        initialValues={{}}
        properties={formProperties}
        apartments={formApartments}
        units={formUnits}
        tenants={formTenants}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateTenancy;
