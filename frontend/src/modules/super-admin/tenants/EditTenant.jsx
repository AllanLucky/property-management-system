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
import { useDispatch, useSelector } from "react-redux";

/*
|--------------------------------------------------------------------------
| TENANT FORM
|--------------------------------------------------------------------------
*/

import TenantForm from "./TenantForm";

/*
|--------------------------------------------------------------------------
| TENANT REDUX
|--------------------------------------------------------------------------
*/

import {
  clearTenant,
  clearTenantError,
  fetchTenant,
  updateTenant,
} from "../../../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const EditTenant = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | TENANT STATE
  |--------------------------------------------------------------------------
  */

  const {
    tenant,
    loading,
    updating,
    error,
  } = useSelector(
    (state) =>
      state.tenants || {}
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    /*
    |----------------------------------------------------------------------
    | CLEAR PREVIOUS STATE
    |----------------------------------------------------------------------
    */

    dispatch(
      clearTenant()
    );

    dispatch(
      clearTenantError()
    );

    /*
    |----------------------------------------------------------------------
    | FETCH TENANT
    |----------------------------------------------------------------------
    */

    dispatch(
      fetchTenant(id)
    );

    /*
    |----------------------------------------------------------------------
    | CLEANUP
    |----------------------------------------------------------------------
    */

    return () => {
      dispatch(
        clearTenant()
      );

      dispatch(
        clearTenantError()
      );
    };
  }, [
    dispatch,
    id,
  ]);

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
      /*
      |--------------------------------------------------------------------
      | CLEAR PREVIOUS ERROR
      |--------------------------------------------------------------------
      */

      dispatch(
        clearTenantError()
      );

      /*
      |--------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------
      */

      const result =
        await dispatch(
          updateTenant({
            id,
            data: payload,
          })
        );

      /*
      |--------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------
      */

      if (
        updateTenant.fulfilled.match(
          result
        )
      ) {
        await Swal.fire({
          icon: "success",
          title: "Tenant Updated",
          text:
            result?.payload?.message ||
            "Tenant updated successfully.",
          confirmButtonText:
            "View Tenant",
          confirmButtonColor:
            "#2563eb",
        });

        /*
        |------------------------------------------------------------------
        | REDIRECT
        |------------------------------------------------------------------
        */

        navigate(
          `/tenants/${id}`
        );

        return result.payload;
      }

      /*
      |--------------------------------------------------------------------
      | FAILED
      |--------------------------------------------------------------------
      */

      const message =
        result?.payload?.message ||
        result?.payload?.error ||
        result?.error?.message ||
        "Failed to update tenant.";

      throw new Error(
        message
      );
    } catch (submitError) {
      /*
      |--------------------------------------------------------------------------
      | ERROR MESSAGE
      |--------------------------------------------------------------------------
      */

      const message =
        submitError?.message ||
        "Failed to update tenant. Please try again.";

      /*
      |--------------------------------------------------------------------------
      | SHOW ERROR
      |--------------------------------------------------------------------------
      */

      await Swal.fire({
        icon: "error",
        title: "Unable to Update Tenant",
        text: message,
        confirmButtonText:
          "Try Again",
        confirmButtonColor:
          "#dc2626",
      });

      /*
      |--------------------------------------------------------------------------
      | RETURN ERROR TO FORM
      |--------------------------------------------------------------------------
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
    if (id) {
      navigate(
        `/tenants/${id}`
      );

      return;
    }

    navigate(
      "/tenants"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BACK TO TENANTS
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(
      "/tenants"
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
              We could not determine which tenant
              you want to edit.
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
                transition
                hover:bg-primary-700
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
  | LOADING TENANT
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !tenant
  ) {
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
                    Loading tenant information...
                  </p>
                </div>
              </div>

              <Link
                to="/tenants"
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

        {/* ================================================================
            LOADING
        ================================================================= */}

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
  | TENANT NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !loading &&
    !tenant
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* ================================================================
            HEADER
        ================================================================= */}

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
                to="/tenants"
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

        {/* ================================================================
            NOT FOUND
        ================================================================= */}

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <UserRoundPen className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Tenant Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
              The tenant you are trying to edit does not
              exist, may have been deleted, or could not be
              loaded from the server.
            </p>

            {error && (
              <p className="mx-auto mt-3 max-w-lg rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {typeof error ===
                "string"
                  ? error
                  : error?.message ||
                    error?.error ||
                    "Failed to load tenant."}
              </p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* ------------------------------------------------------------
                TITLE
            ------------------------------------------------------------- */}

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

            {/* ------------------------------------------------------------
                BACK
            ------------------------------------------------------------- */}

            <Link
              to="/tenants"
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

      {/* ================================================================
          CONTENT
      ================================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------
            TENANT SUMMARY
        ---------------------------------------------------------------- */}

        <div className="mb-5 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold uppercase text-gray-600">
                {String(
                  tenant?.first_name ||
                    ""
                )
                  .charAt(0)
                  .concat(
                    String(
                      tenant?.last_name ||
                        ""
                    ).charAt(0)
                  ) || "T"}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {tenant?.full_name ||
                    [
                      tenant?.first_name,
                      tenant?.last_name,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(" ") ||
                    "Tenant"}
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
                    ${
                      tenant.status ===
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

        {/* ---------------------------------------------------------------
            ERROR
        ---------------------------------------------------------------- */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Tenant update error
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {typeof error ===
                  "string"
                    ? error
                    : error?.message ||
                      error?.error ||
                      "Unable to update tenant."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------
            FORM
        ---------------------------------------------------------------- */}

        <TenantForm
          mode="edit"
          tenant={tenant}
          loading={
            loading &&
            !tenant
          }
          submitting={
            updating
          }
          error={error}
          onSubmit={
            handleUpdate
          }
          onCancel={
            handleCancel
          }
        />
      </main>
    </div>
  );
};

export default EditTenant;