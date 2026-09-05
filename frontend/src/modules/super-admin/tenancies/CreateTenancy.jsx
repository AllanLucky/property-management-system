import {
  ArrowLeft,
  Building2,
  Loader2,
  RefreshCw,
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
 *
 * - Load properties
 * - Load apartments
 * - Load units
 * - Load tenants
 * - Normalize Laravel/Axios collection responses
 * - Use apartments embedded in property responses when available
 * - Fall back to /apartments when necessary
 * - Hide tenants already assigned to an active/pending tenancy
 * - Submit a new tenancy
 * - Display useful API errors
 * - Prevent duplicate submissions
 * - Show success notification
 * - Redirect after successful creation
 *
 * Important:
 *
 * Tenant eligibility is a frontend UX filter only.
 *
 * The backend MUST still enforce the rule that a tenant cannot have
 * multiple active/pending tenancies.
 *
 * No routes are changed by this component.
 */

/**
 * ============================================================================
 * API / COLLECTION HELPERS
 * ============================================================================
 */

/**
 * Convert common Laravel/Axios response shapes into an array.
 *
 * Supported:
 *
 * [
 *   ...
 * ]
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   data: {
 *     data: [...]
 *   }
 * }
 *
 * {
 *   items: [...]
 * }
 *
 * {
 *   results: [...]
 * }
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
 * ============================================================================
 * ERROR HELPERS
 * ============================================================================
 */

/**
 * Extract a useful Laravel/Axios error message.
 */
const getErrorMessage = (
  error,
  fallback = "Unable to load tenancy data. Please try again."
) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData =
    error?.response?.data;

  /**
   * Standard API message.
   */
  if (
    responseData?.message &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  /**
   * Generic API error.
   */
  if (
    responseData?.error &&
    typeof responseData.error === "string"
  ) {
    return responseData.error;
  }

  /**
   * Laravel validation errors.
   *
   * Example:
   *
   * {
   *   tenant_id: [
   *     "The selected tenant is already assigned..."
   *   ]
   * }
   */
  if (responseData?.errors) {
    if (
      typeof responseData.errors === "string"
    ) {
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

  /**
   * Axios / JavaScript error.
   */
  if (
    error?.message &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
};

/**
 * Extract Laravel validation details so the form can optionally
 * consume field-level errors.
 */
const getValidationErrors = (error) => {
  const errors =
    error?.response?.data?.errors;

  if (
    errors &&
    typeof errors === "object" &&
    !Array.isArray(errors)
  ) {
    return errors;
  }

  return {};
};

/**
 * ============================================================================
 * PROPERTY / APARTMENT HELPERS
 * ============================================================================
 */

/**
 * Extract apartments embedded inside property responses.
 *
 * Adds property_id to each apartment when the nested apartment
 * does not already provide it.
 */
const getNestedApartments = (
  properties
) => {
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

    for (
      const apartment of nestedApartments
    ) {
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
 * ============================================================================
 * UNIQUE COLLECTION HELPER
 * ============================================================================
 *
 * Removes duplicate records by ID.
 */
const uniqueById = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();

  return items.filter((item) => {
    if (
      !item ||
      typeof item !== "object"
    ) {
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

    /**
     * Keep objects without an identifiable ID.
     *
     * This preserves API records that may use another identifier.
     */
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
 * TENANT ASSIGNMENT ELIGIBILITY
 * ============================================================================
 *
 * A tenant is considered blocked when:
 *
 * - blocks_tenant_assignment === true
 * - tenant_assignment_status === "blocked"
 * - active_tenancy_count > 0
 * - pending_tenancy_count > 0
 *
 * This is only a frontend filter.
 *
 * The backend remains the source of truth.
 */
const isTenantBlocked = (
  tenant
) => {
  if (
    !tenant ||
    typeof tenant !== "object"
  ) {
    return false;
  }

  /**
   * Preferred backend flag.
   */
  if (
    typeof tenant.blocks_tenant_assignment ===
    "boolean"
  ) {
    return tenant.blocks_tenant_assignment;
  }

  /**
   * Secondary backend status.
   */
  if (
    typeof tenant.tenant_assignment_status ===
    "string"
  ) {
    return (
      tenant.tenant_assignment_status
        .trim()
        .toLowerCase() ===
      "blocked"
    );
  }

  /**
   * Backend tenancy counts.
   */
  const activeCount = Number(
    tenant.active_tenancy_count ?? 0
  );

  const pendingCount = Number(
    tenant.pending_tenancy_count ?? 0
  );

  if (
    activeCount > 0 ||
    pendingCount > 0
  ) {
    return true;
  }

  /**
   * Some API responses may expose the current tenancy
   * directly rather than counts.
   */
  const tenancyStatus =
    tenant?.current_tenancy?.status ??
    tenant?.currentTenancy?.status;

  if (
    typeof tenancyStatus === "string" &&
    [
      "active",
      "pending",
    ].includes(
      tenancyStatus
        .trim()
        .toLowerCase()
    )
  ) {
    return true;
  }

  return false;
};

/**
 * ============================================================================
 * TENANT COLLECTION NORMALIZATION
 * ============================================================================
 */

const getAvailableTenants = (
  tenants
) => {
  const tenantList =
    uniqueById(
      extractCollection(tenants)
    );

  return tenantList.filter(
    (tenant) =>
      !isTenantBlocked(tenant)
  );
};

/**
 * ============================================================================
 * COMPONENT
 * ============================================================================
 */

const CreateTenancy = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | Collections
  |--------------------------------------------------------------------------
  */

  const [
    properties,
    setProperties,
  ] = useState([]);

  const [
    apartments,
    setApartments,
  ] = useState([]);

  const [
    units,
    setUnits,
  ] = useState([]);

  const [
    tenants,
    setTenants,
  ] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  const [
    loadingData,
    setLoadingData,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError,
  ] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Load Form Data
  |--------------------------------------------------------------------------
  */

  const loadFormData =
    useCallback(
      async (
        signal
      ) => {
        setLoadingData(true);
        setError(null);

        /**
         * --------------------------------------------------------------
         * Reset collections before loading.
         * --------------------------------------------------------------
         */
        setProperties([]);
        setApartments([]);
        setUnits([]);
        setTenants([]);

        try {
          /**
           * ============================================================
           * PROPERTIES
           * ============================================================
           *
           * Properties are loaded first because they may contain
           * nested apartments.
           */
          const propertiesResponse =
            await api.get(
              "/properties",
              {
                signal,
              }
            );

          if (
            signal?.aborted
          ) {
            return;
          }

          const propertyList =
            uniqueById(
              extractCollection(
                propertiesResponse?.data
              )
            );

          setProperties(
            propertyList
          );

          /**
           * ============================================================
           * NESTED APARTMENTS
           * ============================================================
           */

          let apartmentList =
            uniqueById(
              getNestedApartments(
                propertiesResponse?.data
              )
            );

          /**
           * ============================================================
           * TENANTS + UNITS
           * ============================================================
           *
           * These endpoints are independent of properties.
           */
          const [
            tenantsResult,
            unitsResult,
          ] =
            await Promise.all([
              api.get(
                "/tenants",
                {
                  signal,
                }
              ),

              api.get(
                "/units",
                {
                  signal,
                }
              ),
            ]);

          if (
            signal?.aborted
          ) {
            return;
          }

          /**
           * ----------------------------------------------------------
           * TENANTS
           * ----------------------------------------------------------
           *
           * Only tenants eligible for a new tenancy are exposed
           * to TenancyForm.
           */
          const tenantList =
            getAvailableTenants(
              tenantsResult?.data
            );

          setTenants(
            tenantList
          );

          /**
           * ----------------------------------------------------------
           * UNITS
           * ----------------------------------------------------------
           */
          const unitList =
            uniqueById(
              extractCollection(
                unitsResult?.data
              )
            );

          setUnits(
            unitList
          );

          /**
           * ============================================================
           * APARTMENTS FALLBACK
           * ============================================================
           *
           * If properties did not include apartments, use the
           * standalone apartments endpoint.
           */
          if (
            apartmentList.length === 0
          ) {
            const apartmentsResponse =
              await api.get(
                "/apartments",
                {
                  signal,
                }
              );

            if (
              signal?.aborted
            ) {
              return;
            }

            apartmentList =
              uniqueById(
                extractCollection(
                  apartmentsResponse?.data
                )
              );
          }

          if (
            !signal?.aborted
          ) {
            setApartments(
              apartmentList
            );
          }
        } catch (loadError) {
          /**
           * Ignore cancelled requests.
           */
          if (
            signal?.aborted ||
            loadError?.code ===
            "ERR_CANCELED" ||
            loadError?.name ===
            "CanceledError"
          ) {
            return;
          }

          const message =
            getErrorMessage(
              loadError,
              "Unable to load tenancy data. Please try again."
            );

          setError({
            message,
            validationErrors:
              getValidationErrors(
                loadError
              ),
          });
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoadingData(false);
          }
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Initial Data Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const controller =
      new AbortController();

    loadFormData(
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [loadFormData]);

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry =
    useCallback(() => {
      if (submitting) {
        return;
      }

      const controller =
        new AbortController();

      loadFormData(
        controller.signal
      );
    }, [
      loadFormData,
      submitting,
    ]);

  /*
  |--------------------------------------------------------------------------
  | BACK / CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel =
    useCallback(() => {
      if (submitting) {
        return;
      }

      navigate(
        "/super-admin/tenancies"
      );
    }, [
      navigate,
      submitting,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    useCallback(
      async (payload) => {
        if (submitting) {
          return;
        }

        if (
          !payload ||
          typeof payload !==
          "object" ||
          Array.isArray(payload)
        ) {
          const validationError =
            new Error(
              "Tenancy data is required."
            );

          setError({
            message:
              validationError.message,
          });

          throw validationError;
        }

        setSubmitting(true);
        setError(null);

        try {
          /**
           * ------------------------------------------------------------
           * Create tenancy
           * ------------------------------------------------------------
           */
          const response =
            await api.post(
              "/tenancies",
              payload
            );

          const responseData =
            response?.data ??
            response;

          /**
           * ------------------------------------------------------------
           * Explicit API failure
           * ------------------------------------------------------------
           */
          if (
            responseData?.status ===
            false
          ) {
            const apiError =
              new Error(
                responseData?.message ||
                "Failed to create tenancy."
              );

            apiError.response = {
              data: responseData,
            };

            throw apiError;
          }

          /**
           * ------------------------------------------------------------
           * Success
           * ------------------------------------------------------------
           */
          dispatch(
            addNotification({
              type: "success",
              message:
                responseData?.message ||
                "Tenancy created successfully.",
            })
          );

          /**
           * ------------------------------------------------------------
           * Redirect
           * ------------------------------------------------------------
           */
          navigate(
            "/super-admin/tenancies",
            {
              replace: true,
            }
          );

          return responseData;
        } catch (submitError) {
          const message =
            getErrorMessage(
              submitError,
              "Failed to create tenancy. Please try again."
            );

          const validationErrors =
            getValidationErrors(
              submitError
            );

          setError({
            message,
            validationErrors,
          });

          /**
           * Keep the rejected promise so TenancyForm can
           * optionally handle submission-level errors.
           */
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

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE TENANTS
  |--------------------------------------------------------------------------
  |
  | Defensive second-level filtering.
  |
  | This ensures that if tenant state changes while the component
  | is mounted, a blocked tenant is not accidentally passed to the form.
  |
  */

  const availableTenants =
    useMemo(
      () =>
        Array.isArray(tenants)
          ? tenants.filter(
            (tenant) =>
              !isTenantBlocked(
                tenant
              )
          )
          : [],
      [tenants]
    );

  /*
  |--------------------------------------------------------------------------
  | FORM COLLECTIONS
  |--------------------------------------------------------------------------
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
      () => availableTenants,
      [availableTenants]
    );

  /*
  |--------------------------------------------------------------------------
  | Derived UI State
  |--------------------------------------------------------------------------
  */

  const hasLoadError =
    Boolean(
      error &&
      !loadingData
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
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
                Create a new tenancy and assign
                it to an eligible tenant and unit.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* LOADING / SUBMITTING */}
          {/* -------------------------------------------------------------- */}

          {(loadingData ||
            submitting) && (
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

      {hasLoadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">
                Unable to load tenancy data
              </p>

              <p className="mt-1">
                {error?.message ||
                  "Please try again."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              disabled={submitting}
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-red-300
                bg-white
                px-3
                py-2
                text-sm
                font-medium
                text-red-700
                shadow-sm
                transition
                hover:bg-red-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RefreshCw className="h-4 w-4" />

              Try Again
            </button>
          </div>
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