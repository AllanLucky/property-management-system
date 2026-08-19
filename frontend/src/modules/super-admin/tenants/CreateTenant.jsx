import { ArrowLeft, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import TenantForm from "./TenantForm";

/*
|--------------------------------------------------------------------------
| REDUX
|--------------------------------------------------------------------------
*/

import { useDispatch, useSelector } from "react-redux";

import {
  clearTenantError,
  createTenant,
} from "../../../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
*/

const CreateTenant = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | TENANT STATE
  |--------------------------------------------------------------------------
  */

  const {
    creating,
    error,
  } = useSelector(
    (state) =>
      state.tenants || {}
  );

  /*
  |--------------------------------------------------------------------------
  | CREATE TENANT
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (
    payload
  ) => {
    try {
      /*
      |----------------------------------------------------------------------
      | CLEAR PREVIOUS ERROR
      |----------------------------------------------------------------------
      */

      dispatch(
        clearTenantError()
      );

      /*
      |----------------------------------------------------------------------
      | CREATE
      |----------------------------------------------------------------------
      */

      const result =
        await dispatch(
          createTenant(payload)
        );

      /*
      |----------------------------------------------------------------------
      | CHECK THUNK RESULT
      |----------------------------------------------------------------------
      */

      if (
        createTenant.fulfilled.match(
          result
        )
      ) {
        /*
        |--------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------
        */

        await Swal.fire({
          icon: "success",
          title: "Tenant Created",
          text:
            result?.payload?.message ||
            "Tenant created successfully.",
          confirmButtonText:
            "View Tenants",
          confirmButtonColor:
            "#2563eb",
        });

        /*
        |--------------------------------------------------------------------
        | REDIRECT
        |--------------------------------------------------------------------
        */

        navigate(
          "/super-admin/tenants"
        );

        return result.payload;
      }

      /*
      |----------------------------------------------------------------------
      | THUNK REJECTED
      |----------------------------------------------------------------------
      */

      const message =
        result?.payload?.message ||
        result?.payload?.error ||
        result?.error?.message ||
        "Failed to create tenant.";

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
        "Failed to create tenant. Please try again.";

      /*
      |--------------------------------------------------------------------------
      | SHOW ERROR
      |--------------------------------------------------------------------------
      */

      await Swal.fire({
        icon: "error",
        title: "Unable to Create Tenant",
        text: message,
        confirmButtonText:
          "Try Again",
        confirmButtonColor:
          "#dc2626",
      });

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      | Throw the error back to TenantForm so its local error handling
      | can also work.
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
    navigate(
      "/super-admin/tenants"
    );
  };

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
                <UserPlus className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Create Tenant
                  </h1>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Add a new tenant to your estate management system.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------
                BACK BUTTON
            ------------------------------------------------------------- */}

            <Link
              to="/super-admin/tenants"
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
            ERROR BANNER
        ---------------------------------------------------------------- */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Tenant creation failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {typeof error ===
                    "string"
                    ? error
                    : error?.message ||
                    error?.error ||
                    "Unable to create tenant."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------
            FORM
        ---------------------------------------------------------------- */}

        <TenantForm
          mode="create"
          loading={false}
          submitting={creating}
          error={error}
          onSubmit={
            handleCreate
          }
          onCancel={
            handleCancel
          }
        />
      </main>
    </div>
  );
};

export default CreateTenant;