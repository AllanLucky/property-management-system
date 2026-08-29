import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Home,
  Loader2,
  MapPin,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  assignUnit,
  clearTenancyError,
  fetchTenancy,
} from "../../../store/tenancySlice";

import { addNotification } from "../../../store/uiSlice";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

/**
 * A tenancy ID must be numeric.
 *
 * This is important because:
 *
 * /super-admin/tenancies/26/assign-unit
 *
 * should give:
 *
 * id = "26"
 *
 * and NEVER:
 *
 * id = "assign-unit"
 */
const isValidTenancyId = (value) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return false;
  }

  return /^\d+$/.test(normalized) && Number(normalized) > 0;
};

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

      if (typeof data.errors === "object") {
        const messages = Object.values(data.errors)
          .flat()
          .filter(Boolean)
          .map((message) => String(message));

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    }
  }

  return "Failed to assign the unit. Please try again.";
};

const getId = (item) => {
  if (!item) {
    return "";
  }

  return (
    item.id ??
    item.unit_id ??
    item.value ??
    ""
  );
};

const getName = (item) => {
  if (!item) {
    return "";
  }

  return (
    item.name ||
    item.unit_name ||
    item.unit_number ||
    item.number ||
    item.title ||
    `Unit ${getId(item)}`
  );
};

const getPropertyName = (unit) => {
  if (!unit) {
    return "";
  }

  return (
    unit.property?.name ||
    unit.property?.property_name ||
    unit.property_name ||
    ""
  );
};

const getApartmentName = (unit) => {
  if (!unit) {
    return "";
  }

  return (
    unit.apartment?.name ||
    unit.apartment?.apartment_name ||
    unit.apartment_name ||
    ""
  );
};

const getUnitStatus = (unit) => {
  if (!unit) {
    return "Unknown";
  }

  const status =
    unit.status_label ||
    unit.status ||
    "Unknown";

  /*
   * Prevent:
   *
   * Objects are not valid as a React child
   */
  if (typeof status === "object") {
    return (
      status?.label ||
      status?.name ||
      status?.value ||
      "Unknown"
    );
  }

  return String(status);
};

const formatMoney = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(number);
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const AssignUnit = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | ROUTE PARAMETER
  |--------------------------------------------------------------------------
  */

  const { id } = useParams();

  const tenancyId = useMemo(() => {
    const value = normalizeString(id);

    if (!isValidTenancyId(value)) {
      return "";
    }

    return value;
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [unitId, setUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | TENANCY STATE
  |--------------------------------------------------------------------------
  */

  const tenancy = useSelector((state) => {
    const tenancyState = state?.tenancy;

    if (!tenancyState) {
      return null;
    }

    return (
      tenancyState.currentTenancy ||
      tenancyState.selectedTenancy ||
      tenancyState.tenancy ||
      null
    );
  });

  /*
  |--------------------------------------------------------------------------
  | UNIT STATE
  |--------------------------------------------------------------------------
  */

  const units = useSelector((state) => {
    const tenancyState = state?.tenancy;

    if (!tenancyState) {
      return [];
    }

    /*
     * Support the different names that may exist
     * in the tenancy Redux slice.
     */
    if (Array.isArray(tenancyState.availableUnits)) {
      return tenancyState.availableUnits;
    }

    if (Array.isArray(tenancyState.units)) {
      return tenancyState.units;
    }

    if (Array.isArray(tenancyState.unitOptions)) {
      return tenancyState.unitOptions;
    }

    /*
     * Some APIs may return units directly inside
     * the current tenancy.
     */
    if (
      Array.isArray(
        tenancyState.currentTenancy?.available_units
      )
    ) {
      return tenancyState.currentTenancy.available_units;
    }

    return [];
  });

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const loading = useSelector((state) => {
    const tenancyState = state?.tenancy;

    if (!tenancyState) {
      return false;
    }

    if (typeof tenancyState.loading === "boolean") {
      return tenancyState.loading;
    }

    if (
      tenancyState.loading &&
      typeof tenancyState.loading === "object"
    ) {
      return Boolean(
        tenancyState.loading.fetch ||
        tenancyState.loading.single ||
        tenancyState.loading.fetchTenancy ||
        tenancyState.loading.units ||
        tenancyState.loading.availableUnits
      );
    }

    return false;
  });

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const tenancyError = useSelector((state) => {
    const tenancyState = state?.tenancy;

    if (!tenancyState) {
      return null;
    }

    return (
      tenancyState.error ||
      tenancyState.fetchError ||
      null
    );
  });

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED UNITS
  |--------------------------------------------------------------------------
  */

  const normalizedUnits = useMemo(() => {
    if (!Array.isArray(units)) {
      return [];
    }

    return units.filter(Boolean);
  }, [units]);

  /*
  |--------------------------------------------------------------------------
  | CURRENT UNIT
  |--------------------------------------------------------------------------
  */

  const currentUnit =
    tenancy?.unit ||
    tenancy?.current_unit ||
    null;

  /*
  |--------------------------------------------------------------------------
  | CURRENT UNIT ID
  |--------------------------------------------------------------------------
  */

  const currentUnitId = useMemo(() => {
    if (currentUnit) {
      return normalizeString(
        getId(currentUnit)
      );
    }

    return normalizeString(
      tenancy?.unit_id
    );
  }, [
    currentUnit,
    tenancy?.unit_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | EFFECTIVE UNIT ID
  |--------------------------------------------------------------------------
  */

  const effectiveUnitId =
    normalizeString(unitId);

  /*
  |--------------------------------------------------------------------------
  | SELECTED UNIT
  |--------------------------------------------------------------------------
  */

  const selectedUnit = useMemo(() => {
    if (!effectiveUnitId) {
      return null;
    }

    return (
      normalizedUnits.find(
        (unit) =>
          normalizeString(
            getId(unit)
          ) === effectiveUnitId
      ) || null
    );
  }, [
    effectiveUnitId,
    normalizedUnits,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANCY
  |--------------------------------------------------------------------------
  |
  | VERY IMPORTANT:
  |
  | Never call:
  |
  | fetchTenancy("assign-unit")
  |
  | because that produces:
  |
  | GET /api/tenancies/assign-unit
  |
  | Laravel correctly rejects that because:
  |
  | POST /api/tenancies/assign-unit
  |
  | is the assignment endpoint.
  |
  */

  useEffect(() => {
    /*
     * Do absolutely nothing if the route parameter
     * is not a numeric tenancy ID.
     */
    if (!tenancyId) {
      return undefined;
    }

    let cancelled = false;

    const loadTenancy = async () => {
      try {
        await dispatch(
          fetchTenancy(
            Number(tenancyId)
          )
        ).unwrap();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          getErrorMessage(error);

        setLocalError(message);

        dispatch(
          addNotification({
            type: "error",
            message,
          })
        );
      }
    };

    loadTenancy();

    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    tenancyId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SET CURRENT UNIT
  |--------------------------------------------------------------------------
  |
  | If the tenancy already has a unit, show it as
  | selected initially.
  |
  */

  useEffect(() => {
    if (!currentUnitId) {
      return;
    }

    /*
     * Do not overwrite a user's selection.
     */
    setUnitId((previous) => {
      if (previous) {
        return previous;
      }

      return currentUnitId;
    });
  }, [currentUnitId]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR ON UNMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      dispatch(clearTenancyError());
    };
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    if (!tenancyId) {
      const message =
        "Invalid tenancy ID. Please open Assign Unit from a valid tenancy.";

      setLocalError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      return false;
    }

    if (!effectiveUnitId) {
      const message =
        "Please select a unit.";

      setLocalError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      return false;
    }

    const numericUnitId =
      Number(effectiveUnitId);

    if (
      !Number.isInteger(numericUnitId) ||
      numericUnitId <= 0
    ) {
      const message =
        "Please select a valid unit.";

      setLocalError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      return false;
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT ASSIGNMENT
  |--------------------------------------------------------------------------
  |
  | Backend:
  |
  | POST /api/tenancies/assign-unit
  |
  | Payload:
  |
  | {
  |   tenancy_id,
  |   unit_id
  | }
  |
  | The service should send this POST request.
  |
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setLocalError("");

    if (!validate()) {
      return;
    }

    const numericTenancyId =
      Number(tenancyId);

    const numericUnitId =
      Number(effectiveUnitId);

    setSubmitting(true);

    try {
      const response =
        await dispatch(
          assignUnit({
            tenancy_id: numericTenancyId,
            unit_id: numericUnitId,
          })
        ).unwrap();

      const message =
        response?.message ||
        "Unit assigned successfully.";

      dispatch(
        addNotification({
          type: "success",
          message,
        })
      );

      /*
       * Go back to tenancy details after
       * successful assignment.
       */
      navigate(
        `/super-admin/tenancies/${numericTenancyId}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      setLocalError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );
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

    if (tenancyId) {
      navigate(
        `/super-admin/tenancies/${tenancyId}`
      );
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

    if (tenancyId) {
      navigate(
        `/super-admin/tenancies/${tenancyId}`
      );
      return;
    }

    navigate(
      "/super-admin/tenancies"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | INVALID TENANCY ID
  |--------------------------------------------------------------------------
  */

  if (!tenancyId) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/super-admin/tenancies"
            )
          }
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
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Tenancies
        </button>

        <ErrorCard
          title="Invalid Tenancy"
          message="
            The Assign Unit page requires a valid numeric tenancy ID.
            Please open this page from a tenancy record.
          "
          onBack={() =>
            navigate(
              "/super-admin/tenancies"
            )
          }
        />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading && !tenancy) {
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

          Back
        </button>

        <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />

            <p className="text-sm font-semibold text-gray-700">
              Loading tenancy...
            </p>

            <p className="text-xs text-gray-500">
              Please wait while we load the tenancy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TENANCY NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/super-admin/tenancies"
            )
          }
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
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Tenancies
        </button>

        <ErrorCard
          title="Unable to Load Tenancy"
          message={
            getErrorMessage(
              tenancyError
            )
          }
          onBack={() =>
            navigate(
              "/super-admin/tenancies"
            )
          }
        />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TENANT DISPLAY
  |--------------------------------------------------------------------------
  */

  const tenant =
    tenancy?.tenant ||
    tenancy?.user ||
    null;

  const tenantName =
    tenant?.full_name ||
    [
      tenant?.first_name,
      tenant?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    tenancy?.tenant_name ||
    "Tenant";

  const tenancyNumber =
    tenancy?.tenancy_number ||
    tenancy?.number ||
    `#${tenancy?.id}`;

  /*
  |--------------------------------------------------------------------------
  | CURRENT UNIT DISPLAY
  |--------------------------------------------------------------------------
  */

  const currentUnitDisplay =
    currentUnit
      ? getName(currentUnit)
      : tenancy?.unit_id
        ? `Unit #${tenancy.unit_id}`
        : "Not assigned";

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

            Back to Tenancy
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Assign Unit
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Select a rental unit for this tenancy.
          </p>
        </div>
      </div>

      {/* ================================================================
          TENANCY INFORMATION
      ================================================================ */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Tenancy Information
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Current tenant and tenancy details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3 sm:p-6">
          <SummaryItem
            label="Tenant"
            value={tenantName}
          />

          <SummaryItem
            label="Tenancy Number"
            value={tenancyNumber}
          />

          <SummaryItem
            label="Current Unit"
            value={currentUnitDisplay}
          />
        </div>
      </section>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {(localError || tenancyError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to Assign Unit
              </p>

              <p className="mt-1 text-sm text-red-700">
                {localError ||
                  getErrorMessage(
                    tenancyError
                  )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          ASSIGNMENT FORM
      ================================================================ */}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Home className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Unit Assignment
              </h2>

              <p className="mt-0.5 text-xs leading-5 text-gray-500">
                Select the unit that should be assigned to this tenancy.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="space-y-2">
              <label
                htmlFor="unit_id"
                className="block text-sm font-medium text-gray-700"
              >
                Rental Unit

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <select
                  id="unit_id"
                  name="unit_id"
                  value={effectiveUnitId}
                  onChange={(event) => {
                    setUnitId(
                      event.target.value
                    );

                    if (localError) {
                      setLocalError("");
                    }
                  }}
                  disabled={
                    submitting ||
                    loading ||
                    normalizedUnits.length === 0
                  }
                  className="
                    h-11
                    w-full
                    appearance-none
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    pr-10
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    focus:border-primary-500
                    focus:ring-2
                    focus:ring-primary-500/20
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:text-gray-500
                  "
                >
                  <option value="">
                    {normalizedUnits.length === 0
                      ? "No available units"
                      : "Select a unit"}
                  </option>

                  {normalizedUnits.map(
                    (unit) => {
                      const value =
                        getId(unit);

                      if (!value) {
                        return null;
                      }

                      return (
                        <option
                          key={String(value)}
                          value={String(value)}
                        >
                          {getName(unit)}

                          {getApartmentName(
                            unit
                          )
                            ? ` — ${getApartmentName(
                              unit
                            )}`
                            : ""}

                          {getPropertyName(
                            unit
                          )
                            ? ` — ${getPropertyName(
                              unit
                            )}`
                            : ""}
                        </option>
                      );
                    }
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {normalizedUnits.length ===
                0 && (
                  <p className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />

                    No available units were returned by the system.
                  </p>
                )}
            </div>
          </div>
        </section>

        {/* ================================================================
            SELECTED UNIT
        ================================================================ */}

        {selectedUnit && (
          <section className="rounded-xl border border-primary-100 bg-primary-50/50 shadow-sm">
            <div className="border-b border-primary-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Selected Unit
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Review the selected unit before saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
              <UnitSummary
                icon={
                  <Home className="h-4 w-4" />
                }
                label="Unit"
                value={getName(
                  selectedUnit
                )}
              />

              <UnitSummary
                icon={
                  <Building2 className="h-4 w-4" />
                }
                label="Apartment"
                value={
                  getApartmentName(
                    selectedUnit
                  ) || "—"
                }
              />

              <UnitSummary
                icon={
                  <MapPin className="h-4 w-4" />
                }
                label="Property"
                value={
                  getPropertyName(
                    selectedUnit
                  ) || "—"
                }
              />

              <UnitSummary
                icon={
                  <Check className="h-4 w-4" />
                }
                label="Status"
                value={getUnitStatus(
                  selectedUnit
                )}
              />

              {(selectedUnit?.price ??
                selectedUnit?.rent ??
                selectedUnit?.rent_amount) !==
                undefined && (
                  <UnitSummary
                    icon={
                      <Save className="h-4 w-4" />
                    }
                    label="Rent"
                    value={formatMoney(
                      selectedUnit?.price ??
                      selectedUnit?.rent ??
                      selectedUnit?.rent_amount
                    )}
                  />
                )}
            </div>
          </section>
        )}

        {/* ================================================================
            ACTIONS
        ================================================================ */}

        <div className="sticky bottom-0 z-10 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
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
                focus:outline-none
                focus:ring-2
                focus:ring-gray-400/20
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              <X className="h-4 w-4" />

              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                !effectiveUnitId ||
                normalizedUnits.length === 0
              }
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-primary-600
                px-6
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-primary-700
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/30
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:w-auto
              "
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Assigning...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />

                  Assign Unit
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| SUMMARY ITEM
|--------------------------------------------------------------------------
*/

const SummaryItem = ({
  label,
  value,
}) => {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| UNIT SUMMARY
|--------------------------------------------------------------------------
*/

const UnitSummary = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}

        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| ERROR CARD
|--------------------------------------------------------------------------
*/

const ErrorCard = ({
  title,
  message,
  onBack,
}) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>

        <h2 className="mt-4 text-base font-semibold text-red-900">
          {title}
        </h2>

        <p className="mt-2 max-w-lg text-sm text-red-700">
          {message}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="
            mt-5
            inline-flex
            items-center
            gap-2
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
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Tenancies
        </button>
      </div>
    </div>
  );
};

export default AssignUnit;

