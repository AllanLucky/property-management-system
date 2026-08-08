
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useDispatch } from "react-redux";

import { addNotification } from "../../../store/uiSlice";

import UnitForm from "./unitForm";

import useUnit from "../../../hooks/useUnits";
import useProperty from "../../../hooks/useProperties";
import useApartment from "../../../hooks/useApartment";

const CreateUnit = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | UNIT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    createUnit,
    loading: unitLoading,
    error: unitError,
  } = useUnit();

  /*
  |--------------------------------------------------------------------------
  | PROPERTY HOOK
  |--------------------------------------------------------------------------
  */

  const {
    properties,
    loading: propertiesLoading,
    error: propertiesError,
    getProperties,
  } = useProperty();

  /*
  |--------------------------------------------------------------------------
  | APARTMENT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    apartments,
    loading: apartmentsLoading,
    error: apartmentsError,
    getApartments,
  } = useApartment();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [submitting, setSubmitting] =
    useState(false);

  const [fetching, setFetching] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | LOAD FORM DATA
  |--------------------------------------------------------------------------
  */

  const loadFormData = useCallback(
    async () => {
      setFetching(true);

      try {
        await Promise.all([
          getProperties?.({
            with_relations: true,
          }),

          getApartments?.({
            with_relations: true,
          }),
        ]);
      } catch (error) {
        console.error(
          "FAILED TO LOAD UNIT FORM DATA:",
          error
        );

        dispatch(
          addNotification({
            type: "error",
            message:
              error?.response?.data
                ?.message ||
              error?.message ||
              "Failed to load properties and apartments.",
          })
        );
      } finally {
        setFetching(false);
      }
    },
    [
      getProperties,
      getApartments,
      dispatch,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = useCallback(
    async (payload) => {
      setSubmitting(true);

      try {
        await createUnit(payload);

        dispatch(
          addNotification({
            type: "success",
            message:
              "Unit created successfully.",
          })
        );

        navigate(
          "/super-admin/units"
        );
      } catch (error) {
        console.error(
          "CREATE UNIT ERROR:",
          error
        );

        dispatch(
          addNotification({
            type: "error",
            message:
              error?.response?.data
                ?.message ||
              error?.message ||
              "Failed to create unit.",
          })
        );

        /*
        |--------------------------------------------------------------------------
        | Re-throw so UnitForm can also receive the error
        |--------------------------------------------------------------------------
        */

        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      createUnit,
      dispatch,
      navigate,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    navigate(
      "/super-admin/units"
    );
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    loadFormData();
  }, [loadFormData]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (fetching) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
          <Loader2
            className="h-7 w-7 animate-spin text-indigo-600"
          />
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading unit form...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Loading properties and apartments.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FORM DATA ERROR
  |--------------------------------------------------------------------------
  */

  const formDataError =
    propertiesError ||
    apartmentsError;

  if (formDataError) {
    const message =
      typeof formDataError ===
        "string"
        ? formDataError
        : formDataError?.message ||
        formDataError?.error ||
        "Unable to load the unit form data.";

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle
                size={24}
                className="text-red-600"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-800">
                Unable to Load Form
              </h2>

              <p className="mt-2 text-sm leading-6 text-red-700">
                {message}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    handleRetry
                  }
                  disabled={
                    fetching
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw
                    size={
                      17
                    }
                    className={
                      fetching
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Retry
                </button>

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft
                    size={
                      17
                    }
                  />

                  Back to Units
                </button>
              </div>
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={
              handleCancel
            }
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft
              size={17}
            />

            Back to Units
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Unit
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add a new unit to your
            property with pricing,
            features and availability
            information.
          </p>
        </div>
      </div>

      {/* FORM */}

      <UnitForm
        properties={
          properties ?? []
        }
        apartments={
          apartments ?? []
        }
        loading={
          unitLoading ||
          propertiesLoading ||
          apartmentsLoading
        }
        submitting={
          submitting
        }
        error={unitError}
        onSubmit={
          handleSubmit
        }
        onCancel={
          handleCancel
        }
        title="Create Unit"
        submitLabel="Create Unit"
      />
    </div>
  );
};

export default CreateUnit;

