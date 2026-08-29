import {
  ArrowLeft,
  Loader2,
  UserRoundPen,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import Swal from "sweetalert2";
import { useEffect, useMemo } from "react";

import TenantForm from "./TenantForm";
import { useTenant } from "../../../hooks/useTenant";

/*
|--------------------------------------------------------------------------
| EDIT TENANT
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| 1. Read tenant ID from the route.
| 2. Load the tenant from the API.
| 3. Display a loading state while fetching.
| 4. Display an error/not-found state when loading fails.
| 5. Pass the loaded tenant to TenantForm.
| 6. Submit tenant updates through useTenant().
| 7. Redirect to the tenant details page after success.
|
|--------------------------------------------------------------------------
*/

const EditTenant = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | TENANT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    tenant,
    loadingTenant,
    updating,
    error,
    updateError,
    getTenant,
    editTenant,
    clear,
    clearError,
  } = useTenant();

  /*
  |--------------------------------------------------------------------------
  | ROUTES
  |--------------------------------------------------------------------------
  */

  const TENANT_ROUTES = {
    index: "/super-admin/tenants",

    show: (tenantId) =>
      `/super-admin/tenants/${tenantId}`,

    edit: (tenantId) =>
      `/super-admin/tenants/${tenantId}/edit`,

    create: "/super-admin/tenants/create",
  };

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE TENANT ID
  |--------------------------------------------------------------------------
  |
  | Route params are strings.
  | The backend may expect a numeric ID.
  |
  */

  const tenantId = useMemo(() => {
    if (!id) {
      return null;
    }

    const parsed = Number(id);

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : null;
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANT
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | The dependency array intentionally uses tenantId only.
  |
  | useTenant() may recreate getTenant(), clear(), and clearError()
  | on every render. Including those functions here can cause:
  |
  |   Maximum update depth exceeded
  |
  | The route tenant ID is what actually determines which tenant
  | should be loaded.
  |
  */

  useEffect(() => {
    let cancelled = false;

    const loadTenant = async () => {
      if (!tenantId) {
        return;
      }

      try {
        /*
        |--------------------------------------------------------------------------
        | CLEAR STALE STATE
        |--------------------------------------------------------------------------
        */

        clear();
        clearError();

        /*
        |--------------------------------------------------------------------------
        | FETCH TENANT
        |--------------------------------------------------------------------------
        */

        if (cancelled) {
          return;
        }

        await getTenant(tenantId);
      } catch (fetchError) {
        /*
        |--------------------------------------------------------------------------
        | ERROR
        |--------------------------------------------------------------------------
        |
        | useTenant() already stores the API error.
        | We only log it here for development/debugging.
        |
        */

        if (!cancelled) {
          console.error(
            "Failed to load tenant:",
            fetchError
          );
        }
      }
    };

    loadTenant();

    return () => {
      cancelled = true;
    };

    // Intentionally depend only on tenantId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE TENANT
  |--------------------------------------------------------------------------
  */

  const handleUpdate = async (payload) => {
    if (!tenantId) {
      const errorObject = new Error(
        "Tenant ID is missing."
      );

      await Swal.fire({
        icon: "error",
        title: "Unable to Update Tenant",
        text: errorObject.message,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });

      throw errorObject;
    }

    try {
      /*
      |--------------------------------------------------------------------------
      | CLEAR PREVIOUS ERROR
      |--------------------------------------------------------------------------
      */

      clearError();

      /*
      |--------------------------------------------------------------------------
      | DEBUG
      |--------------------------------------------------------------------------
      */

      console.log(
        "Updating tenant:",
        tenantId,
        payload
      );

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      const result = await editTenant(
        tenantId,
        payload
      );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      const successMessage =
        result?.message ||
        result?.data?.message ||
        "Tenant updated successfully.";

      await Swal.fire({
        icon: "success",
        title: "Tenant Updated",
        text: successMessage,
        confirmButtonText: "View Tenant",
        confirmButtonColor: "#2563eb",
      });

      /*
      |--------------------------------------------------------------------------
      | REDIRECT
      |--------------------------------------------------------------------------
      */

      navigate(
        TENANT_ROUTES.show(tenantId)
      );

      return result;
    } catch (submitError) {
      /*
      |--------------------------------------------------------------------------
      | LOG ERROR
      |--------------------------------------------------------------------------
      */

      console.error(
        "Tenant update failed:",
        submitError
      );

      /*
      |--------------------------------------------------------------------------
      | EXTRACT ERROR MESSAGE
      |--------------------------------------------------------------------------
      */

      const possibleMessage =
        submitError?.response?.data?.message ||
        submitError?.response?.data?.error ||
        submitError?.message ||
        submitError?.error ||
        updateError?.message ||
        updateError?.error ||
        updateError;

      const displayMessage =
        typeof possibleMessage === "string"
          ? possibleMessage
          : possibleMessage?.message ||
          "Failed to update tenant. Please try again.";

      /*
      |--------------------------------------------------------------------------
      | ERROR ALERT
      |--------------------------------------------------------------------------
      */

      await Swal.fire({
        icon: "error",
        title: "Unable to Update Tenant",
        text: displayMessage,
        confirmButtonText: "Try Again",
        confirmButtonColor: "#dc2626",
      });

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | Re-throw so TenantForm can also handle its local submitting state.
      |
      */

      throw submitError;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (tenantId) {
      navigate(
        TENANT_ROUTES.show(tenantId)
      );

      return;
    }

    navigate(
      TENANT_ROUTES.index
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BACK TO TENANTS
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(
      TENANT_ROUTES.index
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGE HELPER
  |--------------------------------------------------------------------------
  */

  const getErrorMessage = (value) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    return (
      value?.response?.data?.message ||
      value?.response?.data?.error ||
      value?.message ||
      value?.error ||
      "Unable to process tenant request."
    );
  };

  /*
  |--------------------------------------------------------------------------
  | MISSING / INVALID ID
  |--------------------------------------------------------------------------
  */

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <UserRoundPen className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Edit Tenant
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Invalid tenant information.
                  </p>
                </div>
              </div>

              <Link
                to={TENANT_ROUTES.index}
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
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/20
                  sm:w-auto
                "
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tenants
              </Link>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <UserRoundPen className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Tenant ID Missing
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              We could not determine which tenant you want to edit.
              Please return to the tenant list and select a valid tenant.
            </p>

            <button
              type="button"
              onClick={handleBack}
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-primary-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-primary-700
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500
                focus:ring-offset-2
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tenants
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loadingTenant && !tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <UserRoundPen className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Edit Tenant
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Loading tenant information...
                  </p>
                </div>
              </div>

              <Link
                to={TENANT_ROUTES.index}
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
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/20
                  sm:w-auto
                "
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tenants
              </Link>
            </div>
          </div>
        </div>

        {/* LOADING CONTENT */}
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                Loading tenant
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Please wait while we load the tenant details.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND / LOAD ERROR
  |--------------------------------------------------------------------------
  */

  if (!loadingTenant && !tenant) {
    const loadError = error || updateError;

    const errorMessage =
      getErrorMessage(loadError) ||
      "Failed to load tenant.";

    return (
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <UserRoundPen className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Edit Tenant
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Tenant information could not be loaded.
                  </p>
                </div>
              </div>

              <Link
                to={TENANT_ROUTES.index}
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
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  sm:w-auto
                "
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tenants
              </Link>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <UserRoundPen className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Tenant Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
              The tenant you are trying to edit does not exist,
              may have been deleted, or could not be loaded from
              the server.
            </p>

            {loadError && (
              <div className="mx-auto mt-4 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                  Error
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {errorMessage}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleBack}
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-primary-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-primary-700
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500
                focus:ring-offset-2
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tenants
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TENANT DISPLAY DATA
  |--------------------------------------------------------------------------
  */

  const firstName =
    tenant?.first_name ||
    tenant?.user?.first_name ||
    "";

  const lastName =
    tenant?.last_name ||
    tenant?.user?.last_name ||
    "";

  const tenantName =
    tenant?.full_name ||
    tenant?.name ||
    [firstName, lastName]
      .filter(Boolean)
      .join(" ") ||
    "Tenant";

  const initials =
    (
      String(firstName).charAt(0) +
      String(lastName).charAt(0)
    ).toUpperCase() || "T";

  const tenantEmail =
    tenant?.email ||
    tenant?.user?.email ||
    "No email address";

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const tenantStatus =
    typeof tenant?.status === "string"
      ? tenant.status.toLowerCase()
      : "";

  const statusLabel =
    tenantStatus
      ? tenantStatus
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
      : "";

  /*
  |--------------------------------------------------------------------------
  | CURRENT ERROR
  |--------------------------------------------------------------------------
  */

  const currentError =
    updateError || error;

  const currentErrorMessage =
    getErrorMessage(currentError) ||
    "Unable to update tenant.";

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* TITLE */}

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <UserRoundPen className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  Edit Tenant
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Update tenant information and account details.
                </p>
              </div>
            </div>

            {/* BACK */}

            <Link
              to={TENANT_ROUTES.show(tenantId)}
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
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                sm:w-auto
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tenant
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================
          CONTENT
      ================================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==============================================================
            TENANT SUMMARY
        =============================================================== */}

        <div className="mb-5 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* IDENTITY */}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold uppercase text-gray-600">
                {initials}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {tenantName}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {tenantEmail}
                </p>

                {tenant?.tenant_number && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    Tenant Number:{" "}
                    <span className="font-medium text-gray-500">
                      {tenant.tenant_number}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* STATUS */}

            <div className="flex flex-wrap items-center gap-2">
              {statusLabel && (
                <span
                  className={`
                    inline-flex
                    items-center
                    rounded-full
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    ${tenantStatus === "active"
                      ? "bg-green-50 text-green-700"
                      : tenantStatus ===
                        "blacklisted"
                        ? "bg-red-50 text-red-700"
                        : tenantStatus ===
                          "inactive"
                          ? "bg-gray-100 text-gray-600"
                          : tenantStatus ===
                            "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-blue-50 text-blue-700"
                    }
                  `}
                >
                  {statusLabel}
                </span>
              )}

              {Boolean(
                tenant?.is_verified ??
                tenant?.verified
              ) && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Verified
                  </span>
                )}

              {tenant?.is_active === false && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  Inactive Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ==============================================================
            ERROR
        =============================================================== */}

        {currentError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Tenant update error
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {currentErrorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            FORM
        =============================================================== */}

        <TenantForm
          mode="edit"
          tenant={tenant}
          loading={loadingTenant}
          submitting={updating}
          error={updateError}
          onSubmit={handleUpdate}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default EditTenant;
