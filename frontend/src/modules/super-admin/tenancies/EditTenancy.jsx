import {
  AlertCircle,
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

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import TenancyForm from "./TenancyForm";

import {
  clearTenancyError,
  fetchTenancy,
  updateTenancy,
} from "../../../store/tenancySlice";

import { addNotification } from "../../../store/uiSlice";

import api from "../../../api/axios";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Safely extract an ID from:
 *
 * 12
 * "12"
 * { id: 12 }
 * { property_id: 12 }
 * { apartment_id: 12 }
 * { unit_id: 12 }
 * { tenant_id: 12 }
 */
const normalizeId = (...values) => {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    if (
      typeof value === "number" ||
      typeof value === "string"
    ) {
      const text = String(value).trim();

      if (text !== "") {
        return text;
      }

      continue;
    }

    if (
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const nestedId =
        value?.id ??
        value?.property_id ??
        value?.apartment_id ??
        value?.unit_id ??
        value?.tenant_id;

      if (
        nestedId !== null &&
        nestedId !== undefined &&
        nestedId !== ""
      ) {
        return String(nestedId);
      }
    }
  }

  return "";
};

/**
 * Convert different API response wrappers into an array.
 *
 * Supports:
 *
 * []
 *
 * { data: [] }
 *
 * { data: { data: [] } }
 *
 * { items: [] }
 *
 * { results: [] }
 */
const extractCollection = (response) => {
  if (!response) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Axios response
  |--------------------------------------------------------------------------
  */

  const body = response?.data ?? response;

  /*
  |--------------------------------------------------------------------------
  | Direct array
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(body)) {
    return body;
  }

  if (
    body &&
    typeof body === "object"
  ) {
    /*
    |--------------------------------------------------------------------------
    | Laravel:
    |
    | {
    |   status: true,
    |   data: [...]
    | }
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(body.data)) {
      return body.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Laravel pagination:
    |
    | {
    |   status: true,
    |   data: {
    |     data: [...]
    |   }
    | }
    |--------------------------------------------------------------------------
    */

    if (
      body.data &&
      typeof body.data === "object" &&
      Array.isArray(body.data.data)
    ) {
      return body.data.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Other common wrappers
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(body.items)) {
      return body.items;
    }

    if (Array.isArray(body.results)) {
      return body.results;
    }
  }

  return [];
};

/**
 * Safely extract an API error message.
 */
const getErrorMessage = (error) => {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return String(error.message);
  }

  if (error?.error) {
    return String(error.error);
  }

  /*
  |--------------------------------------------------------------------------
  | errors
  |--------------------------------------------------------------------------
  */

  if (error?.errors) {
    if (typeof error.errors === "string") {
      return error.errors;
    }

    if (
      typeof error.errors === "object" &&
      !Array.isArray(error.errors)
    ) {
      const messages = Object.values(error.errors)
        .flat()
        .filter(Boolean)
        .map((message) => String(message));

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (Array.isArray(error.errors)) {
      const messages = error.errors
        .flat()
        .filter(Boolean)
        .map((message) => String(message));

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Axios response
  |--------------------------------------------------------------------------
  */

  if (error?.response?.data) {
    const data = error.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data?.message) {
      return String(data.message);
    }

    if (data?.error) {
      return String(data.error);
    }

    if (data?.errors) {
      if (typeof data.errors === "string") {
        return data.errors;
      }

      if (
        typeof data.errors === "object"
      ) {
        const messages = Object.values(
          data.errors
        )
          .flat()
          .filter(Boolean)
          .map((message) => String(message));

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    }
  }

  return "Failed to process the tenancy. Please try again.";
};

/*
|--------------------------------------------------------------------------
| TENANCY NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Normalize tenancy returned by Laravel.
 *
 * Supports both IDs and relationships:
 *
 * property_id
 * apartment_id
 * unit_id
 * tenant_id
 *
 * and:
 *
 * property: {}
 * apartment: {}
 * unit: {}
 * tenant: {}
 */
const normalizeTenancy = (value) => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const propertyId = normalizeId(
    value.property_id,
    value.propertyId,
    value.property?.id,
    value.property?.property_id
  );

  const apartmentId = normalizeId(
    value.apartment_id,
    value.apartmentId,
    value.apartment?.id,
    value.apartment?.apartment_id
  );

  const unitId = normalizeId(
    value.unit_id,
    value.unitId,
    value.unit?.id,
    value.unit?.unit_id
  );

  const tenantId = normalizeId(
    value.tenant_id,
    value.tenantId,
    value.tenant?.id,
    value.tenant?.tenant_id
  );

  return {
    ...value,

    property_id: propertyId,
    apartment_id: apartmentId,
    unit_id: unitId,
    tenant_id: tenantId,

    property:
      value.property || null,

    apartment:
      value.apartment || null,

    unit:
      value.unit || null,

    tenant:
      value.tenant || null,
  };
};

/**
 * Normalize different thunk response shapes.
 */
const extractTenancy = (response) => {
  if (!response) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Direct object
  |--------------------------------------------------------------------------
  */

  if (
    response?.id ||
    response?.tenancy_number
  ) {
    return response;
  }

  /*
  |--------------------------------------------------------------------------
  | Axios / Laravel response
  |--------------------------------------------------------------------------
  */

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    /*
    |----------------------------------------------------------------------
    | { data: { data: tenancy } }
    |----------------------------------------------------------------------
    */

    if (
      response.data?.data &&
      typeof response.data.data === "object" &&
      !Array.isArray(response.data.data)
    ) {
      return response.data.data;
    }

    /*
    |----------------------------------------------------------------------
    | { data: tenancy }
    |----------------------------------------------------------------------
    */

    if (
      response.data?.id ||
      response.data?.tenancy_number
    ) {
      return response.data;
    }
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE OPTION COLLECTION
|--------------------------------------------------------------------------
*/

/**
 * Keep the selected tenancy relationships in the dropdown collections.
 *
 * This is important when the API returns a tenancy relationship but the
 * general collection endpoint does not include that record.
 */
const ensureSelectedOption = (
  collection,
  selected,
  id
) => {
  const list = Array.isArray(collection)
    ? collection
    : [];

  if (!id) {
    return list;
  }

  const exists = list.some(
    (item) =>
      String(
        item?.id ??
        item?.property_id ??
        item?.apartment_id ??
        item?.unit_id ??
        item?.tenant_id ??
        ""
      ) === String(id)
  );

  if (exists || !selected) {
    return list;
  }

  return [
    selected,
    ...list,
  ];
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const EditTenancy = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [submitting, setSubmitting] =
    useState(false);

  const [
    assignmentLoading,
    setAssignmentLoading,
  ] = useState(false);

  const [
    assignmentError,
    setAssignmentError,
  ] = useState("");

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
  | TENANCY FROM REDUX
  |--------------------------------------------------------------------------
  */

  const tenancyFromStore = useSelector(
    (state) => {
      const tenancyState =
        state?.tenancy;

      return (
        tenancyState?.currentTenancy ||
        tenancyState?.selectedTenancy ||
        tenancyState?.tenancy ||
        null
      );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED TENANCY
  |--------------------------------------------------------------------------
  */

  const tenancy = useMemo(() => {
    return normalizeTenancy(
      tenancyFromStore
    );
  }, [tenancyFromStore]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const loading = useSelector(
    (state) => {
      const tenancyState =
        state?.tenancy;

      if (!tenancyState) {
        return false;
      }

      if (
        typeof tenancyState.loading ===
        "boolean"
      ) {
        return tenancyState.loading;
      }

      return Boolean(
        tenancyState.loading?.fetch ||
        tenancyState.loading?.single ||
        tenancyState.loading?.fetchTenancy ||
        tenancyState.loading?.update
      );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const tenancyError = useSelector(
    (state) => {
      const tenancyState =
        state?.tenancy;

      return (
        tenancyState?.error ||
        tenancyState?.fetchError ||
        null
      );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANCY
  |--------------------------------------------------------------------------
  */

  const loadTenancy = useCallback(
    async () => {
      if (!id) {
        return null;
      }

      try {
        const response =
          await dispatch(
            fetchTenancy(id)
          ).unwrap();

        return extractTenancy(
          response
        );
      } catch (error) {
        const message =
          getErrorMessage(error);

        dispatch(
          addNotification({
            type: "error",
            message,
          })
        );

        throw error;
      }
    },
    [dispatch, id]
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD ASSIGNMENT DATA
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | TenancyForm cannot display Property/Apartment/Unit/Tenant options unless
  | these collections are actually loaded.
  |
  | We therefore load them directly here and pass them to TenancyForm.
  |
  */

  const loadAssignmentData =
    useCallback(
      async () => {
        setAssignmentLoading(true);
        setAssignmentError("");

        try {
          const [
            propertiesResponse,
            apartmentsResponse,
            unitsResponse,
            tenantsResponse,
          ] = await Promise.all([
            api.get("/properties"),
            api.get("/apartments"),
            api.get("/units"),
            api.get("/tenants"),
          ]);

          const propertyData =
            extractCollection(
              propertiesResponse
            );

          const apartmentData =
            extractCollection(
              apartmentsResponse
            );

          const unitData =
            extractCollection(
              unitsResponse
            );

          const tenantData =
            extractCollection(
              tenantsResponse
            );

          setProperties(
            propertyData
          );

          setApartments(
            apartmentData
          );

          setUnits(
            unitData
          );

          setTenants(
            tenantData
          );

          return {
            properties:
              propertyData,
            apartments:
              apartmentData,
            units: unitData,
            tenants:
              tenantData,
          };
        } catch (error) {
          const message =
            getErrorMessage(error);

          setAssignmentError(
            message
          );

          /*
          |--------------------------------------------------------------------------
          | Do not prevent the tenancy from displaying if assignment endpoints
          | fail. The selected relationships can still be used as fallback.
          |--------------------------------------------------------------------------
          */

          return {
            properties: [],
            apartments: [],
            units: [],
            tenants: [],
          };
        } finally {
          setAssignmentLoading(false);
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | FETCH TENANCY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let active = true;

    const request = async () => {
      try {
        await loadTenancy();
      } catch {
        if (!active) {
          return;
        }
      }
    };

    void request();

    return () => {
      active = false;
    };
  }, [
    id,
    loadTenancy,
  ]);

  /*
  |--------------------------------------------------------------------------
  | FETCH ASSIGNMENT COLLECTIONS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let active = true;

    const request = async () => {
      const result =
        await loadAssignmentData();

      if (!active) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Collections have already been placed into state by
      | loadAssignmentData().
      |--------------------------------------------------------------------------
      */
      void result;
    };

    void request();

    return () => {
      active = false;
    };
  }, [
    id,
    loadAssignmentData,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR ON UNMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      dispatch(
        clearTenancyError()
      );
    };
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | GUARANTEE SELECTED RELATIONSHIPS EXIST IN OPTIONS
  |--------------------------------------------------------------------------
  */

  const propertyOptions = useMemo(() => {
    return ensureSelectedOption(
      properties,
      tenancy?.property,
      tenancy?.property_id
    );
  }, [
    properties,
    tenancy?.property,
    tenancy?.property_id,
  ]);

  const apartmentOptions = useMemo(() => {
    return ensureSelectedOption(
      apartments,
      tenancy?.apartment,
      tenancy?.apartment_id
    );
  }, [
    apartments,
    tenancy?.apartment,
    tenancy?.apartment_id,
  ]);

  const unitOptions = useMemo(() => {
    return ensureSelectedOption(
      units,
      tenancy?.unit,
      tenancy?.unit_id
    );
  }, [
    units,
    tenancy?.unit,
    tenancy?.unit_id,
  ]);

  const tenantOptions = useMemo(() => {
    return ensureSelectedOption(
      tenants,
      tenancy?.tenant,
      tenancy?.tenant_id
    );
  }, [
    tenants,
    tenancy?.tenant,
    tenancy?.tenant_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    payload
  ) => {
    if (!id) {
      const error =
        new Error(
          "Tenancy ID is missing."
        );

      dispatch(
        addNotification({
          type: "error",
          message: error.message,
        })
      );

      throw error;
    }

    setSubmitting(true);

    try {
      /*
      |--------------------------------------------------------------------------
      | Normalize assignment IDs
      |--------------------------------------------------------------------------
      */

      const normalizedPayload = {
        ...(payload || {}),

        property_id: normalizeId(
          payload?.property_id,
          payload?.property?.id
        ),

        apartment_id: normalizeId(
          payload?.apartment_id,
          payload?.apartment?.id
        ),

        unit_id: normalizeId(
          payload?.unit_id,
          payload?.unit?.id
        ),

        tenant_id: normalizeId(
          payload?.tenant_id,
          payload?.tenant?.id
        ),
      };

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      const response =
        await dispatch(
          updateTenancy({
            id,
            data: normalizedPayload,
          })
        ).unwrap();

      const message =
        response?.message ||
        response?.data?.message ||
        "Tenancy updated successfully.";

      dispatch(
        addNotification({
          type: "success",
          message,
        })
      );

      navigate(
        "/super-admin/tenancies"
      );

      return response;
    } catch (error) {
      const message =
        getErrorMessage(error);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (submitting) {
      return;
    }

    navigate(
      "/super-admin/tenancies"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    if (submitting) {
      return;
    }

    navigate(
      "/super-admin/tenancies"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = async () => {
    if (loading || assignmentLoading) {
      return;
    }

    setAssignmentError("");

    try {
      await Promise.all([
        loadTenancy(),
        loadAssignmentData(),
      ]);
    } catch {
      /*
      |--------------------------------------------------------------------------
      | Individual loaders already handle their errors.
      |--------------------------------------------------------------------------
      */
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INVALID ID
  |--------------------------------------------------------------------------
  */

  if (!id) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={submitting}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Tenancies
        </button>

        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-6
          "
        >
          <h2 className="text-base font-semibold text-red-900">
            Invalid Tenancy
          </h2>

          <p className="mt-2 text-sm text-red-700">
            No tenancy ID was provided.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !tenancy
  ) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={submitting}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Tenancies
        </button>

        <div
          className="
            flex
            min-h-[450px]
            items-center
            justify-center
            rounded-xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
          role="status"
          aria-live="polite"
          aria-label="Loading tenancy"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="
                h-9
                w-9
                animate-spin
                text-primary-600
              "
            />

            <p className="text-sm font-semibold text-gray-700">
              Loading tenancy...
            </p>

            <p className="text-xs text-gray-500">
              Please wait while we load the tenancy information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND / LOAD ERROR
  |--------------------------------------------------------------------------
  */

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={submitting}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Tenancies
        </button>

        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-6
          "
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-red-100
              "
            >
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-red-900">
              Unable to Load Tenancy
            </h2>

            <p className="mt-2 max-w-lg text-sm text-red-700">
              {getErrorMessage(
                tenancyError
              )}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleRetry();
                }}
                disabled={
                  loading ||
                  assignmentLoading
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-primary-600
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-primary-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ||
                  assignmentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                {loading ||
                  assignmentLoading
                  ? "Loading..."
                  : "Try Again"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Back to Tenancies
              </button>
            </div>
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
    <div className="space-y-6">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <button
            type="button"
            onClick={handleBack}
            disabled={submitting}
            className="
              mb-4
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-gray-600
              transition
              hover:text-gray-900
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Tenancies
          </button>

          <h1
            className="
              text-2xl
              font-bold
              tracking-tight
              text-gray-900
              dark:text-white
            "
          >
            Edit Tenancy
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Update the tenancy assignment,
            rental information and tenancy
            details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={
            loading ||
            assignmentLoading ||
            submitting
          }
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {assignmentLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh Options
        </button>
      </div>

      {/* ================================================================
          ASSIGNMENT DATA ERROR
      ================================================================ */}

      {assignmentError && (
        <div
          className="
            rounded-lg
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
          "
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Assignment options could not be fully loaded
              </p>

              <p className="mt-1 text-sm text-amber-700">
                {assignmentError}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                disabled={
                  assignmentLoading
                }
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-amber-300
                  bg-white
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-amber-800
                  hover:bg-amber-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw className="h-3.5 w-3.5" />

                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          ASSIGNMENT LOADING
      ================================================================ */}

      {assignmentLoading && (
        <div
          className="
            flex
            items-center
            gap-3
            rounded-lg
            border
            border-blue-100
            bg-blue-50
            px-4
            py-3
          "
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

          <div>
            <p className="text-sm font-medium text-blue-900">
              Loading assignment options...
            </p>

            <p className="text-xs text-blue-700">
              Loading properties, apartments, units and tenants.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          TENANCY ERROR
      ================================================================ */}

      {tenancyError && (
        <div
          className="
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
          "
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div
              className="
                mt-0.5
                flex
                h-5
                w-5
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-red-100
              "
            >
              <span className="text-xs font-bold text-red-600">
                !
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-red-800">
                Tenancy Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {getErrorMessage(
                  tenancyError
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          ASSIGNMENT SUMMARY
      ================================================================ */}

      <div
        className="
          rounded-xl
          border
          border-indigo-100
          bg-indigo-50/60
          px-4
          py-3
          dark:border-indigo-900/40
          dark:bg-indigo-950/20
        "
      >
        <div className="mb-2 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600" />

          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-900 dark:text-indigo-200">
            Current Assignment
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            Tenancy:
            <span className="ml-1 font-normal">
              {tenancy.tenancy_number ||
                "—"}
            </span>
          </span>

          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            Property:
            <span className="ml-1 font-normal">
              {tenancy.property_id ||
                "—"}
            </span>
          </span>

          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            Apartment:
            <span className="ml-1 font-normal">
              {tenancy.apartment_id ||
                "—"}
            </span>
          </span>

          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            Unit:
            <span className="ml-1 font-normal">
              {tenancy.unit_id ||
                "—"}
            </span>
          </span>

          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            Tenant:
            <span className="ml-1 font-normal">
              {tenancy.tenant_id ||
                "—"}
            </span>
          </span>
        </div>
      </div>

      {/* ================================================================
          FORM
      ================================================================ */}

      <TenancyForm
        tenancy={tenancy}
        mode="edit"
        loading={loading}
        submitting={submitting}
        error={tenancyError}
        properties={propertyOptions}
        apartments={apartmentOptions}
        units={unitOptions}
        tenants={tenantOptions}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditTenancy;