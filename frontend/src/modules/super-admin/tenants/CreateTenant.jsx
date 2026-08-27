import {
  ArrowLeft,
  UserPlus,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import TenantForm from "./TenantForm";

import {
  clearTenantError,
  createTenant,
} from "../../../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| - Render the tenant creation page.
| - Connect TenantForm to Redux.
| - Submit tenant data through createTenant thunk.
| - Display success/error feedback.
| - Redirect to the tenant list after successful creation.
|
|--------------------------------------------------------------------------
*/

const CreateTenant = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | TENANT REDUX STATE
  |--------------------------------------------------------------------------
  */

  const tenantState = useSelector(
    (state) => state?.tenants || {}
  );

  const creating = Boolean(
    tenantState?.creating
  );

  const error =
    tenantState?.error || null;

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const getErrorMessage = (
    value,
    fallback = "Unable to create tenant."
  ) => {
    if (!value) {
      return fallback;
    }

    /*
    |----------------------------------------------------------------------
    | STRING
    |----------------------------------------------------------------------
    */

    if (typeof value === "string") {
      return value;
    }

    /*
    |----------------------------------------------------------------------
    | API RESPONSE OBJECT
    |----------------------------------------------------------------------
    */

    if (
      typeof value === "object"
    ) {
      /*
      | Common Laravel/API formats
      */

      if (
        typeof value.message ===
        "string"
      ) {
        return value.message;
      }

      if (
        typeof value.error ===
        "string"
      ) {
        return value.error;
      }

      if (
        typeof value.detail ===
        "string"
      ) {
        return value.detail;
      }

      /*
      | Laravel validation errors:
      |
      | {
      |   errors: {
      |     email: ["The email has already been taken."]
      |   }
      | }
      */

      if (
        value.errors &&
        typeof value.errors ===
        "object"
      ) {
        const validationMessages =
          Object.values(
            value.errors
          )
            .flat()
            .filter(
              (message) =>
                typeof message ===
                "string"
            );

        if (
          validationMessages.length
        ) {
          return validationMessages.join(
            " "
          );
        }
      }

      /*
      | Axios-style response
      */

      if (
        value.response?.data
      ) {
        return getErrorMessage(
          value.response.data,
          fallback
        );
      }

      /*
      | Axios error message
      */

      if (
        typeof value.message ===
        "string"
      ) {
        return value.message;
      }
    }

    return fallback;
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE TENANT
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (
    payload
  ) => {
    /*
    |----------------------------------------------------------------------
    | SAFETY CHECK
    |----------------------------------------------------------------------
    */

    if (creating) {
      return;
    }

    try {
      /*
      |----------------------------------------------------------------------
      | CLEAR PREVIOUS REDUX ERROR
      |----------------------------------------------------------------------
      */

      dispatch(
        clearTenantError()
      );

      /*
      |----------------------------------------------------------------------
      | DISPATCH CREATE TENANT
      |----------------------------------------------------------------------
      */

      const result =
        await dispatch(
          createTenant(payload)
        );

      /*
      |----------------------------------------------------------------------
      | SUCCESS
      |----------------------------------------------------------------------
      */

      if (
        createTenant.fulfilled.match(
          result
        )
      ) {
        const successMessage =
          result?.payload?.message ||
          result?.payload?.data
            ?.message ||
          "Tenant created successfully.";

        await Swal.fire({
          icon: "success",
          title: "Tenant Created",
          text: successMessage,
          confirmButtonText:
            "View Tenants",
          confirmButtonColor:
            "#2563eb",
          allowOutsideClick: false,
        });

        /*
        |--------------------------------------------------------------------
        | REDIRECT
        |--------------------------------------------------------------------
        */

        navigate(
          "/super-admin/tenants",
          {
            replace: true,
          }
        );

        return (
          result?.payload
        );
      }

      /*
      |----------------------------------------------------------------------
      | REJECTED THUNK
      |----------------------------------------------------------------------
      */

      const message =
        getErrorMessage(
          result?.payload,
          ""
        ) ||
        getErrorMessage(
          result?.error,
          "Failed to create tenant."
        );

      throw new Error(
        message
      );
    } catch (submitError) {
      /*
      |----------------------------------------------------------------------
      | ERROR MESSAGE
      |----------------------------------------------------------------------
      */

      const message =
        getErrorMessage(
          submitError,
          "Failed to create tenant. Please try again."
        );

      /*
      |----------------------------------------------------------------------
      | SHOW ERROR
      |----------------------------------------------------------------------
      */

      await Swal.fire({
        icon: "error",
        title:
          "Unable to Create Tenant",
        text: message,
        confirmButtonText:
          "Try Again",
        confirmButtonColor:
          "#dc2626",
      });

      /*
      |----------------------------------------------------------------------
      | IMPORTANT
      |----------------------------------------------------------------------
      |
      | TenantForm also handles rejected submissions locally.
      | Re-throw so TenantForm can display the error state.
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
    if (creating) {
      return;
    }

    navigate(
      "/super-admin/tenants"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | REDUX ERROR MESSAGE
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    error
      ? getErrorMessage(
        error,
        "Unable to create tenant."
      )
      : "";

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

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* ------------------------------------------------------------
                TITLE
            ------------------------------------------------------------- */}

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <UserPlus className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  Create Tenant
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Add a new tenant to your
                  estate management system.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------
                BACK BUTTON
            ------------------------------------------------------------- */}

            <Link
              to="/super-admin/tenants"
              onClick={(event) => {
                if (creating) {
                  event.preventDefault();
                }
              }}
              aria-disabled={creating}
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
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back to Tenants
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================================
          CONTENT
      ================================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------
            REDUX ERROR BANNER
        ---------------------------------------------------------------- */}

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Tenant creation failed
                </p>

                <p className="mt-1 break-words text-sm text-red-700">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      clearTenantError()
                    )
                  }
                  className="
                    mt-2
                    text-xs
                    font-medium
                    text-red-700
                    underline
                    underline-offset-2
                    hover:text-red-900
                  "
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------
            TENANT FORM
        ---------------------------------------------------------------- */}

        <TenantForm
          mode="create"
          loading={false}
          submitting={creating}
          error={error}
          onSubmit={handleCreate}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default CreateTenant;

