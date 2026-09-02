import {
  ArrowLeft,
  Loader2,
  UserPlus,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import {
  useCallback,
  useEffect,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import TenantForm from "./TenantForm";

import {
  clearTenantError,
  createTenant,
  fetchAvailableTenantUsers,
} from "../../../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| 1. Render the tenant creation page.
| 2. Fetch existing users who already have the tenant role.
| 3. Allow selecting one existing User account.
| 4. Pass the selected user to TenantForm.
| 5. Submit tenant profile data through createTenant().
| 6. Display success/error feedback.
| 7. Redirect to the tenant list after successful creation.
|
| IMPORTANT:
|
| A Tenant is linked to an EXISTING User account.
|
| This page must NOT create another User account.
|
| The selected User's ID becomes:
|
|     tenants.user_id
|
| TenantForm is responsible for constructing the create payload.
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
  |
  | Support both:
  |
  | state.tenant
  | state.tenants
  |
  */

  const tenantState = useSelector((state) => {
    if (
      state?.tenant &&
      typeof state.tenant === "object"
    ) {
      return state.tenant;
    }

    if (
      state?.tenants &&
      typeof state.tenants === "object"
    ) {
      return state.tenants;
    }

    return {};
  });

  /*
  |--------------------------------------------------------------------------
  | CREATE STATE
  |--------------------------------------------------------------------------
  */

  const creating = Boolean(
    tenantState?.creating
  );

  const error =
    tenantState?.error || null;

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE TENANT USERS
  |--------------------------------------------------------------------------
  |
  | These are existing User accounts that:
  |
  | - have the tenant role
  | - are not already linked to a tenant
  |
  | Backend endpoint:
  |
  | GET /api/tenants/available-users
  |
  */

  const availableTenantUsers =
    Array.isArray(
      tenantState?.availableTenantUsers
    )
      ? tenantState.availableTenantUsers
      : [];

  const loadingAvailableUsers =
    Boolean(
      tenantState?.loadingAvailableTenantUsers
    );

  const availableTenantUsersError =
    tenantState?.availableTenantUsersError ||
    null;

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGE HELPER
  |--------------------------------------------------------------------------
  */

  const getErrorMessage = useCallback(
    (
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
      | OBJECT
      |----------------------------------------------------------------------
      */

      if (
        typeof value === "object" &&
        value !== null
      ) {
        /*
        |--------------------------------------------------------------------
        | Axios response
        |--------------------------------------------------------------------
        */

        if (value?.response?.data) {
          return getErrorMessage(
            value.response.data,
            fallback
          );
        }

        /*
        |--------------------------------------------------------------------
        | Direct message
        |--------------------------------------------------------------------
        */

        if (
          typeof value.message ===
          "string"
        ) {
          return value.message;
        }

        /*
        |--------------------------------------------------------------------
        | Error
        |--------------------------------------------------------------------
        */

        if (
          typeof value.error ===
          "string"
        ) {
          return value.error;
        }

        /*
        |--------------------------------------------------------------------
        | Detail
        |--------------------------------------------------------------------
        */

        if (
          typeof value.detail ===
          "string"
        ) {
          return value.detail;
        }

        /*
        |--------------------------------------------------------------------
        | Laravel validation errors
        |--------------------------------------------------------------------
        |
        | {
        |   errors: {
        |     email: [
        |       "The email has already been taken."
        |     ]
        |   }
        | }
        |
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
            validationMessages.length >
            0
          ) {
            return validationMessages.join(
              " "
            );
          }
        }

        /*
        |--------------------------------------------------------------------
        | Nested payload
        |--------------------------------------------------------------------
        */

        if (
          value.payload &&
          typeof value.payload ===
          "object"
        ) {
          return getErrorMessage(
            value.payload,
            fallback
          );
        }
      }

      return fallback;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH AVAILABLE TENANT USERS
  |--------------------------------------------------------------------------
  */

  const loadAvailableTenantUsers =
    useCallback(async () => {
      try {
        const result =
          await dispatch(
            fetchAvailableTenantUsers()
          );

        if (
          fetchAvailableTenantUsers.fulfilled.match(
            result
          )
        ) {
          console.log(
            "[CreateTenant] Available tenant users loaded:",
            result?.payload
          );

          return result;
        }

        console.error(
          "[CreateTenant] Failed to load available tenant users:",
          result?.payload ||
          result?.error
        );

        return result;
      } catch (fetchError) {
        console.error(
          "[CreateTenant] Unexpected error loading available tenant users:",
          fetchError
        );

        return null;
      }
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | LOAD USERS WHEN PAGE OPENS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadAvailableTenantUsers();
  }, [
    loadAvailableTenantUsers,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CREATE TENANT
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (
    payload
  ) => {
    /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATE SUBMISSIONS
    |--------------------------------------------------------------------------
    */

    if (creating) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CLEAR PREVIOUS ERROR
    |--------------------------------------------------------------------------
    */

    dispatch(
      clearTenantError()
    );

    try {
      /*
      |--------------------------------------------------------------------------
      | VALIDATE LINKED USER
      |--------------------------------------------------------------------------
      |
      | A tenant must always be connected to
      | an existing User account.
      |
      */

      const userId =
        payload?.user_id;

      if (
        userId === null ||
        userId === undefined ||
        String(userId).trim() === ""
      ) {
        throw new Error(
          "Please select an existing tenant user."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | NORMALIZE USER ID
      |--------------------------------------------------------------------------
      |
      | Ensure the API receives a numeric
      | user_id rather than a select string.
      |
      */

      const createPayload = {
        ...payload,
        user_id: Number(userId),
      };

      /*
      |--------------------------------------------------------------------------
      | DEBUG
      |--------------------------------------------------------------------------
      */

      console.log(
        "[CreateTenant] Creating tenant:",
        createPayload
      );

      /*
      |--------------------------------------------------------------------------
      | DISPATCH CREATE TENANT
      |--------------------------------------------------------------------------
      */

      const result =
        await dispatch(
          createTenant(
            createPayload
          )
        );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
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
          allowEscapeKey: false,
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

        return result?.payload;
      }

      /*
      |--------------------------------------------------------------------------
      | REJECTED THUNK
      |--------------------------------------------------------------------------
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
      console.error(
        "[CreateTenant] Tenant creation failed:",
        submitError
      );

      const message =
        getErrorMessage(
          submitError,
          "Failed to create tenant. Please try again."
        );

      /*
      |--------------------------------------------------------------------------
      | SHOW ERROR
      |--------------------------------------------------------------------------
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
      |--------------------------------------------------------------------------
      | RE-THROW
      |--------------------------------------------------------------------------
      |
      | TenantForm can also use the rejected
      | submission to maintain its own error state.
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
  | BACK TO TENANTS
  |--------------------------------------------------------------------------
  */

  const handleBackClick = (
    event
  ) => {
    if (creating) {
      event.preventDefault();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGES
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    error
      ? getErrorMessage(
        error,
        "Unable to create tenant."
      )
      : "";

  const availableUsersErrorMessage =
    availableTenantUsersError
      ? getErrorMessage(
        availableTenantUsersError,
        "Unable to fetch available tenant users."
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
                  Create a tenant profile using
                  an existing tenant user account.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------
                BACK BUTTON
            ------------------------------------------------------------- */}

            <Link
              to="/super-admin/tenants"
              onClick={
                handleBackClick
              }
              aria-disabled={
                creating
              }
              className={`
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
                ${creating
                  ? "pointer-events-none cursor-not-allowed opacity-50"
                  : ""
                }
              `}
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
            REDUX ERROR
        ---------------------------------------------------------------- */}

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Tenant creation failed
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-red-700">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      clearTenantError()
                    )
                  }
                  disabled={
                    creating
                  }
                  className="
                    mt-2
                    text-xs
                    font-medium
                    text-red-700
                    underline
                    underline-offset-2
                    transition
                    hover:text-red-900
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------
            AVAILABLE USERS LOADING
        ---------------------------------------------------------------- */}

        {loadingAvailableUsers && (
          <div
            className="
              mb-5
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-blue-200
              bg-blue-50
              px-4
              py-3
            "
          >
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-800">
                Loading tenant users...
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Fetching existing User accounts
                with the tenant role.
              </p>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------
            AVAILABLE USERS ERROR
        ---------------------------------------------------------------- */}

        {availableUsersErrorMessage && (
          <div
            role="alert"
            className="
              mb-5
              rounded-xl
              border
              border-amber-200
              bg-amber-50
              px-4
              py-3
            "
          >
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  Unable to load tenant users
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                  {
                    availableUsersErrorMessage
                  }
                </p>

                <button
                  type="button"
                  onClick={
                    loadAvailableTenantUsers
                  }
                  disabled={
                    loadingAvailableUsers ||
                    creating
                  }
                  className="
                    mt-2
                    inline-flex
                    items-center
                    gap-2
                    rounded-md
                    border
                    border-amber-300
                    bg-white
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    text-amber-800
                    shadow-sm
                    transition
                    hover:bg-amber-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {loadingAvailableUsers && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------
            AVAILABLE USERS SUMMARY
        ---------------------------------------------------------------- */}

        {!loadingAvailableUsers &&
          !availableUsersErrorMessage &&
          availableTenantUsers.length >
          0 && (
            <div
              className="
                mb-5
                rounded-xl
                border
                border-green-200
                bg-green-50
                px-4
                py-3
              "
            >
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />

                <div>
                  <p className="text-sm font-semibold text-green-800">
                    {
                      availableTenantUsers.length
                    }{" "}
                    existing tenant{" "}
                    {availableTenantUsers.length ===
                      1
                      ? "user"
                      : "users"}{" "}
                    available
                  </p>

                  <p className="mt-1 text-xs leading-5 text-green-700">
                    Select an existing user
                    account below to create the
                    tenant profile.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* ---------------------------------------------------------------
            NO AVAILABLE USERS
        ---------------------------------------------------------------- */}

        {!loadingAvailableUsers &&
          !availableUsersErrorMessage &&
          availableTenantUsers.length ===
          0 && (
            <div
              className="
                mb-5
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-4
                shadow-sm
              "
            >
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-400" />

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    No available tenant users
                  </p>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    There are currently no existing
                    User accounts with the tenant
                    role available for assignment.
                    Create or assign the tenant role
                    to a User account first.
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadAvailableTenantUsers
                    }
                    disabled={
                      loadingAvailableUsers ||
                      creating
                    }
                    className="
                      mt-3
                      inline-flex
                      items-center
                      gap-2
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-gray-700
                      shadow-sm
                      transition
                      hover:bg-gray-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {loadingAvailableUsers && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}

                    Refresh Users
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
          users={
            availableTenantUsers
          }
          availableUsersLoading={
            loadingAvailableUsers
          }
          availableUsersError={
            availableTenantUsersError
          }
          onSubmit={handleCreate}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default CreateTenant;