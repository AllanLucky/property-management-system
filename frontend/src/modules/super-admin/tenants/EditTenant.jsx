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
import { useEffect } from "react";

import TenantForm from "./TenantForm";
import { useTenant } from "../../../hooks/useTenant";

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

    create:
      "/super-admin/tenants/create",
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANT
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Do not put getTenant(), clear(), or clearError() in this dependency
  | array if useTenant recreates those functions on every render.
  |
  | The route ID is the actual thing that determines which tenant we load.
  |
  */

  useEffect(() => {
    let mounted = true;

    const loadTenant = async () => {
      if (!id) {
        return;
      }

      try {
        /*
        |----------------------------------------------------------------------
        | Clear stale state once when route changes.
        |----------------------------------------------------------------------
        */

        clear();
        clearError();

        /*
        |----------------------------------------------------------------------
        | Fetch tenant.
        |----------------------------------------------------------------------
        */

        if (!mounted) {
          return;
        }

        await getTenant(id);
      } catch (fetchError) {
        /*
        |----------------------------------------------------------------------
        | The hook already stores the error.
        |----------------------------------------------------------------------
        */

        console.error(
          "Failed to load tenant:",
          fetchError
        );
      }
    };

    loadTenant();

    return () => {
      mounted = false;
    };

    /*
    |--------------------------------------------------------------------------
    | INTENTIONALLY DEPEND ONLY ON ID
    |--------------------------------------------------------------------------
    */

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE TENANT
  |--------------------------------------------------------------------------
  */

  const handleUpdate = async (
    payload
  ) => {
    if (!id) {
      throw new Error(
        "Tenant ID is missing."
      );
    }

    try {
      clearError();

      console.log(
        "Updating tenant:",
        payload
      );

      const result =
        await editTenant(
          id,
          payload
        );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      await Swal.fire({
        icon: "success",
        title: "Tenant Updated",
        text:
          result?.message ||
          "Tenant updated successfully.",
        confirmButtonText:
          "View Tenant",
        confirmButtonColor:
          "#2563eb",
      });

      /*
      |--------------------------------------------------------------------------
      | REDIRECT
      |--------------------------------------------------------------------------
      */

      navigate(
        TENANT_ROUTES.show(id)
      );

      return result;
    } catch (submitError) {
      console.error(
        "Tenant update failed:",
        submitError
      );

      const message =
        submitError?.message ||
        submitError?.error ||
        updateError?.message ||
        updateError?.error ||
        updateError ||
        "Failed to update tenant. Please try again.";

      const displayMessage =
        typeof message === "string"
          ? message
          : "Failed to update tenant. Please try again.";

      await Swal.fire({
        icon: "error",
        title:
          "Unable to Update Tenant",
        text: displayMessage,
        confirmButtonText:
          "Try Again",
        confirmButtonColor:
          "#dc2626",
      });

      throw submitError;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (id) {
      navigate(
        TENANT_ROUTES.show(id)
      );

      return;
    }

    navigate(
      TENANT_ROUTES.index
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(
      TENANT_ROUTES.index
    );
  };

  /*
  |--------------------------------------------------------------------------
  | MISSING ID
  |--------------------------------------------------------------------------
  */

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <UserRoundPen className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Tenant ID Missing
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              We could not determine which tenant you want to edit.
            </p>

            <button
              type="button"
              onClick={
                handleBack
              }
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
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loadingTenant &&
    !tenant
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                to={
                  TENANT_ROUTES.index
                }
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

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col items-center">
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
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !loadingTenant &&
    !tenant
  ) {
    const loadError =
      error || updateError;

    const errorMessage =
      typeof loadError ===
        "string"
        ? loadError
        : loadError?.message ||
        loadError?.error ||
        "Failed to load tenant.";

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <UserRoundPen className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Edit Tenant
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Tenant information could not be loaded.
                  </p>
                </div>
              </div>

              <Link
                to={
                  TENANT_ROUTES.index
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
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                <ArrowLeft className="h-4 w-4" />

                Back to Tenants
              </Link>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <UserRoundPen className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Tenant Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
              The tenant you are trying to edit does not exist, may have been deleted, or could not be loaded from the server.
            </p>

            {loadError && (
              <p className="mx-auto mt-3 max-w-lg rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              onClick={
                handleBack
              }
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
  | PAGE
  |--------------------------------------------------------------------------
  */

  const initials =
    (
      String(
        tenant?.first_name ||
        ""
      ).charAt(0) +
      String(
        tenant?.last_name ||
        ""
      ).charAt(0)
    ).toUpperCase() || "T";

  const tenantName =
    tenant?.full_name ||
    [
      tenant?.first_name,
      tenant?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Tenant";

  const currentError =
    updateError || error;

  const currentErrorMessage =
    typeof currentError ===
      "string"
      ? currentError
      : currentError?.message ||
      currentError?.error ||
      "Unable to update tenant.";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================================================================
          HEADER
      ================================================================= */}

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
                  Update tenant information and account details.
                </p>
              </div>
            </div>

            <Link
              to={
                TENANT_ROUTES.show(id)
              }
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

              Back to Tenant
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================
          CONTENT
      ================================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* TENANT SUMMARY */}

        <div className="mb-5 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold uppercase text-gray-600">
                {initials}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {tenantName}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {tenant?.email ||
                    "No email address"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tenant?.status && (
                <span
                  className={`
                    inline-flex
                    items-center
                    rounded-full
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    ${tenant.status ===
                      "active"
                      ? "bg-green-50 text-green-700"
                      : tenant.status ===
                        "blacklisted"
                        ? "bg-red-50 text-red-700"
                        : tenant.status ===
                          "inactive"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-50 text-yellow-700"
                    }
                  `}
                >
                  {String(
                    tenant.status
                  )
                    .replace(
                      /_/g,
                      " "
                    )
                    .replace(
                      /\b\w/g,
                      (char) =>
                        char.toUpperCase()
                    )}
                </span>
              )}

              {tenant?.is_verified && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ERROR */}

        {currentError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Tenant error
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {currentErrorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FORM */}

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