import { useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import BookingHeader from "./BookingHeader";
import BookingForm from "./BookingForm";
import { useBooking } from "../../../hooks/useBooking";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely normalize API collections.
 *
 * Supports:
 * - []
 * - { data: [] }
 * - { items: [] }
 * - { results: [] }
 * - { data: { data: [] } }
 * - { data: { items: [] } }
 * - { data: { results: [] } }
 */
const safeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  if (Array.isArray(value?.data?.data)) {
    return value.data.data;
  }

  if (Array.isArray(value?.data?.items)) {
    return value.data.items;
  }

  if (Array.isArray(value?.data?.results)) {
    return value.data.results;
  }

  return [];
};

/**
 * Extract a readable API error message.
 */
const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create booking.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    error?.error ||
    "Unable to create booking."
  );
};

/**
 * Extract Laravel validation errors.
 */
const extractValidationErrors = (error) => {
  const validationErrors =
    error?.response?.data?.errors ||
    error?.errors ||
    {};

  return validationErrors &&
    typeof validationErrors === "object"
    ? validationErrors
    : {};
};

/**
 * Normalize an ID from a primitive
 * or an option object.
 */
const getId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value?.id ??
      value?.value ??
      value?.property_id ??
      value?.propertyId ??
      value?.apartment_id ??
      value?.apartmentId ??
      value?.unit_id ??
      value?.unitId ??
      value?.tenant_id ??
      value?.tenantId ??
      value?.tenancy_id ??
      value?.tenancyId ??
      value?.customer_id ??
      value?.customerId ??
      value?.user_id ??
      value?.userId ??
      ""
    );
  }

  return String(value);
};

/**
 * Normalize collection options.
 */
const normalizeOptions = (value) => {
  return safeArray(value).filter(Boolean);
};

/**
 * Extract the useful payload from an API response.
 */
const extractResponseData = (response) => {
  if (!response) {
    return {};
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  return response;
};

/*
|--------------------------------------------------------------------------
| Initial Form
|--------------------------------------------------------------------------
*/

const INITIAL_VALUES = {
  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */
  user_id: "",
  customer_id: "",
  tenant_id: "",
  tenancy_id: "",

  property_id: "",
  apartment_id: "",
  unit_id: "",

  /*
  |--------------------------------------------------------------------------
  | Booking
  |--------------------------------------------------------------------------
  */
  booking_type: "rental",
  source: "website",

  booking_date: "",
  start_date: "",
  end_date: "",

  /*
  |--------------------------------------------------------------------------
  | Financials
  |--------------------------------------------------------------------------
  */
  rent_amount: "",
  deposit_amount: "",
  service_charge: "",
  booking_fee: "",
  discount_amount: "",
  total_amount: "",

  /*
  |--------------------------------------------------------------------------
  | Payment
  |--------------------------------------------------------------------------
  */
  amount_paid: "",
  payment_status: "pending",
  payment_method: "",
  payment_reference: "",

  /*
  |--------------------------------------------------------------------------
  | Guests
  |--------------------------------------------------------------------------
  */
  adults: "1",
  children: "0",

  /*
  |--------------------------------------------------------------------------
  | Check-in / Check-out
  |--------------------------------------------------------------------------
  */
  check_in_at: "",
  check_out_at: "",

  /*
  |--------------------------------------------------------------------------
  | Additional Information
  |--------------------------------------------------------------------------
  */
  special_request: "",
  notes: "",
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CreateBooking = () => {
  const navigate = useNavigate();

  const {
    createBooking,
    getAvailableUnits,
    getAvailableUsers,

    availableUnits,
    availableUsers,

    loading,
    loadingCreate,
    loadingAvailableUnits,
    loadingAvailableUsers,

    error,
    errors,
  } = useBooking();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState(INITIAL_VALUES);

  const [properties, setProperties] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenancies, setTenancies] = useState([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [serverError, setServerError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  const isCreating =
    Boolean(submitting) ||
    Boolean(loadingCreate);

  const isLoadingUnits =
    Boolean(loadingAvailableUnits);

  const isLoadingUsers =
    Boolean(loadingAvailableUsers);

  /*
  |--------------------------------------------------------------------------
  | Hook Collections
  |--------------------------------------------------------------------------
  */

  const hookAvailableUnits =
    normalizeOptions(availableUnits);

  const hookAvailableUsers =
    normalizeOptions(availableUsers);

  /*
  |--------------------------------------------------------------------------
  | Effective Collections
  |--------------------------------------------------------------------------
  */

  const effectiveUnits =
    hookAvailableUnits.length > 0
      ? hookAvailableUnits
      : units;

  const effectiveCustomers =
    hookAvailableUsers.length > 0
      ? hookAvailableUsers
      : customers;

  /*
  |--------------------------------------------------------------------------
  | Load Initial Booking Data
  |--------------------------------------------------------------------------
  |
  | We load the available booking users/customers here.
  |
  | If the API also returns properties, apartments, tenants or
  | tenancies, they are accepted without breaking the component.
  |
  */

  useEffect(() => {
    let mounted = true;

    const loadBookingData = async () => {
      try {
        setServerError("");

        const response =
          await getAvailableUsers();

        if (!mounted) {
          return;
        }

        const data =
          extractResponseData(response);

        /*
        |--------------------------------------------------------------------------
        | Available Customers / Users
        |--------------------------------------------------------------------------
        */

        const users =
          normalizeOptions(
            data?.users ??
            data?.customers ??
            data
          );

        setCustomers(users);

        /*
        |--------------------------------------------------------------------------
        | Optional Related Collections
        |--------------------------------------------------------------------------
        */

        setProperties(
          normalizeOptions(
            data?.properties
          )
        );

        setApartments(
          normalizeOptions(
            data?.apartments
          )
        );

        setTenants(
          normalizeOptions(
            data?.tenants
          )
        );

        setTenancies(
          normalizeOptions(
            data?.tenancies
          )
        );
      } catch (err) {
        if (!mounted) {
          return;
        }

        setServerError(
          extractErrorMessage(err)
        );
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    };

    loadBookingData();

    return () => {
      mounted = false;
    };
  }, [getAvailableUsers]);

  /*
  |--------------------------------------------------------------------------
  | Property Change
  |--------------------------------------------------------------------------
  */

  const handlePropertyChange = (
    propertyId
  ) => {
    const normalizedId =
      getId(propertyId);

    setForm((current) => ({
      ...current,
      property_id: normalizedId,
      apartment_id: "",
      unit_id: "",
      tenancy_id: "",
      rent_amount: "",
      total_amount: "",
    }));

    /*
    |--------------------------------------------------------------------------
    | Clear dependent collections
    |--------------------------------------------------------------------------
    */

    setApartments([]);
    setUnits([]);
    setTenancies([]);

    /*
    |--------------------------------------------------------------------------
    | Clear Related Validation Errors
    |--------------------------------------------------------------------------
    */

    setFieldErrors((current) => {
      const next = {
        ...current,
      };

      delete next.property_id;
      delete next.apartment_id;
      delete next.unit_id;
      delete next.tenancy_id;

      return next;
    });

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Apartment Change
  |--------------------------------------------------------------------------
  */

  const handleApartmentChange = (
    apartmentId
  ) => {
    const normalizedId =
      getId(apartmentId);

    setForm((current) => ({
      ...current,
      apartment_id: normalizedId,
      unit_id: "",
      tenancy_id: "",
      rent_amount: "",
      total_amount: "",
    }));

    /*
    |--------------------------------------------------------------------------
    | Clear Dependent Units
    |--------------------------------------------------------------------------
    */

    setUnits([]);

    /*
    |--------------------------------------------------------------------------
    | Clear Related Errors
    |--------------------------------------------------------------------------
    */

    setFieldErrors((current) => {
      const next = {
        ...current,
      };

      delete next.apartment_id;
      delete next.unit_id;
      delete next.tenancy_id;

      return next;
    });

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Unit Change
  |--------------------------------------------------------------------------
  */

  const handleUnitChange = (
    unitId
  ) => {
    const normalizedId =
      getId(unitId);

    /*
    |--------------------------------------------------------------------------
    | Find Selected Unit
    |--------------------------------------------------------------------------
    */

    const selectedUnit =
      effectiveUnits.find(
        (unit) =>
          String(
            unit?.id ??
            unit?.unit_id ??
            ""
          ) === normalizedId
      );

    /*
    |--------------------------------------------------------------------------
    | Update Unit
    |--------------------------------------------------------------------------
    |
    | If the unit has a price/rent value and rent has not already
    | been entered, use the unit amount as the initial rent.
    |
    */

    setForm((current) => {
      const next = {
        ...current,
        unit_id: normalizedId,
      };

      const currentRent =
        current.rent_amount;

      const hasRent =
        currentRent !== "" &&
        currentRent !== null &&
        currentRent !== undefined;

      if (
        selectedUnit &&
        !hasRent
      ) {
        const unitPrice =
          selectedUnit?.price ??
          selectedUnit?.rent ??
          selectedUnit?.rent_amount ??
          selectedUnit?.monthly_rent;

        if (
          unitPrice !== undefined &&
          unitPrice !== null &&
          unitPrice !== ""
        ) {
          next.rent_amount =
            String(unitPrice);
        }
      }

      return next;
    });

    /*
    |--------------------------------------------------------------------------
    | Clear Validation Error
    |--------------------------------------------------------------------------
    */

    setFieldErrors((current) => {
      const next = {
        ...current,
      };

      delete next.unit_id;

      return next;
    });

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Generic Field Change
  |--------------------------------------------------------------------------
  |
  | Supports both:
  |
  | onChange(event)
  |
  | and:
  |
  | onChange("field", value)
  |
  */

  const handleChange = (
    eventOrField,
    maybeValue
  ) => {
    let name;
    let value;

    if (
      typeof eventOrField ===
      "string"
    ) {
      name = eventOrField;
      value = maybeValue;
    } else {
      name =
        eventOrField?.target?.name;

      value =
        eventOrField?.target?.value;
    }

    if (!name) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Dependent Selects
    |--------------------------------------------------------------------------
    */

    if (name === "property_id") {
      handlePropertyChange(value);
      return;
    }

    if (name === "apartment_id") {
      handleApartmentChange(value);
      return;
    }

    if (name === "unit_id") {
      handleUnitChange(value);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Normal Field
    |--------------------------------------------------------------------------
    */

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    /*
    |--------------------------------------------------------------------------
    | Clear Field Error
    |--------------------------------------------------------------------------
    */

    setFieldErrors((current) => {
      const next = {
        ...current,
      };

      delete next[name];

      return next;
    });

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch Available Units
  |--------------------------------------------------------------------------
  |
  | Whenever property or apartment changes, fetch the units that
  | can be selected for the booking.
  |
  */

  useEffect(() => {
    const propertyId =
      getId(form.property_id);

    const apartmentId =
      getId(form.apartment_id);

    /*
    |--------------------------------------------------------------------------
    | No Property = No Units
    |--------------------------------------------------------------------------
    */

    if (!propertyId) {
      setUnits([]);
      return undefined;
    }

    let mounted = true;

    const loadUnits = async () => {
      try {
        const response =
          await getAvailableUnits({
            property_id: propertyId,

            ...(apartmentId
              ? {
                apartment_id:
                  apartmentId,
              }
              : {}),
          });

        if (!mounted) {
          return;
        }

        const data =
          extractResponseData(
            response
          );

        const list =
          data?.units ??
          data?.available_units ??
          data?.items ??
          data?.results ??
          data;

        setUnits(
          normalizeOptions(list)
        );
      } catch (err) {
        if (!mounted) {
          return;
        }

        setUnits([]);

        setServerError(
          extractErrorMessage(err)
        );
      }
    };

    loadUnits();

    return () => {
      mounted = false;
    };
  }, [
    form.property_id,
    form.apartment_id,
    getAvailableUnits,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Client Validation
  |--------------------------------------------------------------------------
  */

  const validate = (
    values = form
  ) => {
    const nextErrors = {};

    /*
    |--------------------------------------------------------------------------
    | Customer / User / Tenant
    |--------------------------------------------------------------------------
    */

    if (
      !getId(values.customer_id) &&
      !getId(values.user_id) &&
      !getId(values.tenant_id)
    ) {
      nextErrors.customer_id =
        "Please select a customer, tenant or user.";
    }

    /*
    |--------------------------------------------------------------------------
    | Property
    |--------------------------------------------------------------------------
    */

    if (!getId(values.property_id)) {
      nextErrors.property_id =
        "Please select a property.";
    }

    /*
    |--------------------------------------------------------------------------
    | Unit
    |--------------------------------------------------------------------------
    */

    if (!getId(values.unit_id)) {
      nextErrors.unit_id =
        "Please select a unit.";
    }

    /*
    |--------------------------------------------------------------------------
    | Booking Type
    |--------------------------------------------------------------------------
    */

    if (!values.booking_type) {
      nextErrors.booking_type =
        "Please select a booking type.";
    }

    /*
    |--------------------------------------------------------------------------
    | Booking Date
    |--------------------------------------------------------------------------
    */

    if (!values.booking_date) {
      nextErrors.booking_date =
        "Please select the booking date.";
    }

    /*
    |--------------------------------------------------------------------------
    | Start Date
    |--------------------------------------------------------------------------
    */

    if (!values.start_date) {
      nextErrors.start_date =
        "Please select the start date.";
    }

    /*
    |--------------------------------------------------------------------------
    | End Date
    |--------------------------------------------------------------------------
    */

    if (
      values.start_date &&
      values.end_date
    ) {
      const start =
        new Date(
          values.start_date
        );

      const end =
        new Date(
          values.end_date
        );

      if (
        !Number.isNaN(
          start.getTime()
        ) &&
        !Number.isNaN(
          end.getTime()
        ) &&
        end < start
      ) {
        nextErrors.end_date =
          "End date cannot be before start date.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Amount
    |--------------------------------------------------------------------------
    */

    if (
      values.amount_paid !== "" &&
      values.amount_paid !== null &&
      values.amount_paid !== undefined
    ) {
      const amountPaid =
        Number(values.amount_paid);

      if (
        Number.isNaN(amountPaid) ||
        amountPaid < 0
      ) {
        nextErrors.amount_paid =
          "Amount paid must be a valid non-negative amount.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Financial Amounts
    |--------------------------------------------------------------------------
    */

    const financialFields = [
      "rent_amount",
      "deposit_amount",
      "service_charge",
      "booking_fee",
      "discount_amount",
      "total_amount",
    ];

    financialFields.forEach(
      (field) => {
        const value =
          values[field];

        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return;
        }

        const number =
          Number(value);

        if (
          Number.isNaN(number) ||
          number < 0
        ) {
          nextErrors[field] =
            "Amount must be a valid non-negative number.";
        }
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Guests
    |--------------------------------------------------------------------------
    */

    const adults =
      Number(values.adults);

    const children =
      Number(values.children);

    if (
      values.adults !== "" &&
      (Number.isNaN(adults) ||
        adults < 1)
    ) {
      nextErrors.adults =
        "At least one adult is required.";
    }

    if (
      values.children !== "" &&
      (Number.isNaN(children) ||
        children < 0)
    ) {
      nextErrors.children =
        "Children cannot be negative.";
    }

    /*
    |--------------------------------------------------------------------------
    | Save Errors
    |--------------------------------------------------------------------------
    */

    setFieldErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Build Payload
  |--------------------------------------------------------------------------
  |
  | Only fields that contain a meaningful value are submitted.
  |
  | This prevents empty strings from unnecessarily reaching Laravel
  | validation rules such as nullable|integer and nullable|numeric.
  |
  */

  const buildPayload = (
    values
  ) => {
    const payload = {};

    const appendIfValue = (
      key,
      value
    ) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        payload[key] = value;
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "user_id",
      values.user_id
    );

    appendIfValue(
      "customer_id",
      values.customer_id
    );

    appendIfValue(
      "tenant_id",
      values.tenant_id
    );

    appendIfValue(
      "property_id",
      values.property_id
    );

    appendIfValue(
      "apartment_id",
      values.apartment_id
    );

    appendIfValue(
      "unit_id",
      values.unit_id
    );

    appendIfValue(
      "tenancy_id",
      values.tenancy_id
    );

    /*
    |--------------------------------------------------------------------------
    | Booking
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "booking_type",
      values.booking_type
    );

    appendIfValue(
      "source",
      values.source
    );

    appendIfValue(
      "booking_date",
      values.booking_date
    );

    appendIfValue(
      "start_date",
      values.start_date
    );

    appendIfValue(
      "end_date",
      values.end_date
    );

    /*
    |--------------------------------------------------------------------------
    | Financials
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "rent_amount",
      values.rent_amount
    );

    appendIfValue(
      "deposit_amount",
      values.deposit_amount
    );

    appendIfValue(
      "service_charge",
      values.service_charge
    );

    appendIfValue(
      "booking_fee",
      values.booking_fee
    );

    appendIfValue(
      "discount_amount",
      values.discount_amount
    );

    appendIfValue(
      "total_amount",
      values.total_amount
    );

    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "amount_paid",
      values.amount_paid
    );

    appendIfValue(
      "payment_status",
      values.payment_status
    );

    appendIfValue(
      "payment_method",
      values.payment_method
    );

    appendIfValue(
      "payment_reference",
      values.payment_reference
    );

    /*
    |--------------------------------------------------------------------------
    | Guests
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "adults",
      values.adults
    );

    appendIfValue(
      "children",
      values.children
    );

    /*
    |--------------------------------------------------------------------------
    | Check-in / Check-out
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "check_in_at",
      values.check_in_at
    );

    appendIfValue(
      "check_out_at",
      values.check_out_at
    );

    /*
    |--------------------------------------------------------------------------
    | Additional Information
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "special_request",
      values.special_request
    );

    appendIfValue(
      "notes",
      values.notes
    );

    return payload;
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    eventOrValues
  ) => {
    eventOrValues?.preventDefault?.();

    /*
    |--------------------------------------------------------------------------
    | Support:
    |
    | onSubmit(event)
    |
    | and:
    |
    | onSubmit(values)
    |--------------------------------------------------------------------------
    */

    const submittedValues =
      eventOrValues &&
        !eventOrValues?.target &&
        typeof eventOrValues ===
        "object"
        ? {
          ...form,
          ...eventOrValues,
        }
        : {
          ...form,
        };

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (!validate(submittedValues)) {
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");
      setFieldErrors({});

      /*
      |--------------------------------------------------------------------------
      | Build API Payload
      |--------------------------------------------------------------------------
      */

      const payload =
        buildPayload(
          submittedValues
        );

      /*
      |--------------------------------------------------------------------------
      | Create Booking
      |--------------------------------------------------------------------------
      */

      const response =
        await createBooking(
          payload
        );

      /*
      |--------------------------------------------------------------------------
      | Success Message
      |--------------------------------------------------------------------------
      */

      const message =
        response?.message ||
        response?.data?.message ||
        "Booking created successfully.";

      await Swal.fire({
        icon: "success",
        title: "Booking Created",
        text: message,
        confirmButtonText:
          "View Bookings",
        confirmButtonColor:
          "#4f46e5",
      });

      /*
      |--------------------------------------------------------------------------
      | Navigate
      |--------------------------------------------------------------------------
      */

      navigate(
        "/super-admin/bookings",
        {
          replace: true,
        }
      );
    } catch (err) {
      const message =
        extractErrorMessage(err);

      const validationErrors =
        extractValidationErrors(err);

      setServerError(message);

      setFieldErrors(
        validationErrors
      );

      /*
      |--------------------------------------------------------------------------
      | Error Alert
      |--------------------------------------------------------------------------
      */

      await Swal.fire({
        icon: "error",
        title:
          "Unable to Create Booking",
        text: message,
        confirmButtonText:
          "Close",
        confirmButtonColor:
          "#dc2626",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (isCreating) {
      return;
    }

    navigate(
      "/super-admin/bookings"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry = () => {
    window.location.reload();
  };

  /*
  |--------------------------------------------------------------------------
  | Loading Screen
  |--------------------------------------------------------------------------
  */

  if (loadingData) {
    return (
      <div className="space-y-6">
        <BookingHeader />

        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Loading booking form
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Please wait while we
              prepare the booking
              information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* ================================================================== 
          HEADER
      ================================================================== */}

      <BookingHeader
        loading={isCreating}
      />

      {/* ==================================================================
          PAGE ERROR
      ================================================================== */}

      {(serverError || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Unable to prepare booking
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  extractErrorMessage(
                    error
                  )}
              </p>

              <button
                type="button"
                onClick={
                  handleRetry
                }
                disabled={isCreating}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />

                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          BOOKING FORM
      ================================================================== */}

      <BookingForm
        mode="create"
        initialValues={
          INITIAL_VALUES
        }
        values={form}
        properties={properties}
        apartments={apartments}
        units={effectiveUnits}
        customers={
          effectiveCustomers
        }
        tenants={tenants}
        tenancies={tenancies}
        errors={{
          ...(errors || {}),
          ...(fieldErrors || {}),
        }}
        loading={
          Boolean(loading) ||
          loadingData
        }
        submitting={isCreating}
        loadingUnits={
          isLoadingUnits
        }
        loadingUsers={
          isLoadingUsers
        }
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onPropertyChange={
          handlePropertyChange
        }
        onApartmentChange={
          handleApartmentChange
        }
        onUnitChange={
          handleUnitChange
        }
      />
    </div>
  );
};

export default CreateBooking;