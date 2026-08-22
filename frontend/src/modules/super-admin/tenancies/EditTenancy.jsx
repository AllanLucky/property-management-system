import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import TenancyForm from "./TenancyForm";

import {
  clearTenancyError,
  fetchTenancy,
  updateTenancy,
} from "../../../store/tenancySlice";

import { addNotification } from "../../../store/uiSlice";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
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

  return "Failed to process the tenancy. Please try again.";
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

  const [submitting, setSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | TENANCY
  |--------------------------------------------------------------------------
  */

  const tenancy = useSelector((state) => {
    const tenancyState = state?.tenancy;

    return (
      tenancyState?.currentTenancy ||
      tenancyState?.selectedTenancy ||
      tenancyState?.tenancy ||
      null
    );
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

    return Boolean(
      tenancyState.loading?.fetch ||
      tenancyState.loading?.single ||
      tenancyState.loading?.fetchTenancy ||
      tenancyState.loading?.update
    );
  });

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const tenancyError = useSelector((state) => {
    const tenancyState = state?.tenancy;

    return (
      tenancyState?.error ||
      tenancyState?.fetchError ||
      null
    );
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANCY
  |--------------------------------------------------------------------------
  */

  const loadTenancy = useCallback(async () => {
    if (!id) {
      return null;
    }

    try {
      return await dispatch(fetchTenancy(id)).unwrap();
    } catch (error) {
      const message = getErrorMessage(error);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      | Preserve the original error.
      |
      | Do NOT create a new Error here because that removes the original
      | Redux/API error information and its original cause.
      |--------------------------------------------------------------------------
      */

      throw error;
    }
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | FETCH TENANCY
  |--------------------------------------------------------------------------
  |
  | This effect only starts the external async request.
  | It does not synchronously call setState.
  |
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
        /*
        |--------------------------------------------------------------------------
        | The Redux thunk already updates the Redux error state.
        |
        | Nothing else is required here.
        |--------------------------------------------------------------------------
        */

        if (!active) {
          return;
        }
      }
    };

    void request();

    return () => {
      active = false;
    };
  }, [id, loadTenancy]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR ON UNMOUNT
  |--------------------------------------------------------------------------
  |
  | This is a cleanup action rather than a synchronous state update during
  | the effect body.
  |
  */

  useEffect(() => {
    return () => {
      dispatch(clearTenancyError());
    };
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (payload) => {
    if (!id) {
      const error = new Error("Tenancy ID is missing.");

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
      const response = await dispatch(
        updateTenancy({
          id,
          data: payload,
        })
      ).unwrap();

      const message =
        response?.message ||
        "Tenancy updated successfully.";

      /*
      |--------------------------------------------------------------------------
      | SUCCESS NOTIFICATION
      |--------------------------------------------------------------------------
      */

      dispatch(
        addNotification({
          type: "success",
          message,
        })
      );

      /*
      |--------------------------------------------------------------------------
      | REDIRECT
      |--------------------------------------------------------------------------
      */

      navigate("/super-admin/tenancies");

      return response;
    } catch (error) {
      const message = getErrorMessage(error);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      | Preserve the original error.
      |--------------------------------------------------------------------------
      */

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

    navigate("/super-admin/tenancies");
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

    navigate("/super-admin/tenancies");
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

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
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
          Back to Tenancies
        </button>

        <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />

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

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-xl font-bold text-red-600">
                !
              </span>
            </div>

            <h2 className="mt-4 text-base font-semibold text-red-900">
              Unable to Load Tenancy
            </h2>

            <p className="mt-2 max-w-lg text-sm text-red-700">
              {getErrorMessage(tenancyError)}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void loadTenancy().catch(() => { });
                }}
                disabled={loading}
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
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Try Again
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
      {/* HEADER */}

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
            Back to Tenancies
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Edit Tenancy
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update the tenancy information and rental details.
          </p>
        </div>
      </div>

      {/* ERROR */}

      {tenancyError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
              <span className="text-xs font-bold text-red-600">
                !
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-red-800">
                Tenancy Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {getErrorMessage(tenancyError)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FORM */}

      <TenancyForm
        tenancy={tenancy}
        mode="edit"
        loading={loading}
        submitting={submitting}
        error={tenancyError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditTenancy;