import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
 *
 * []
 * { data: [] }
 * { data: { data: [] } }
 * { items: [] }
 * { results: [] }
 * { records: [] }
 */
const safeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    if (Array.isArray(value.data)) {
      return value.data;
    }

    if (
      value.data &&
      typeof value.data === "object" &&
      Array.isArray(value.data.data)
    ) {
      return value.data.data;
    }

    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (Array.isArray(value.results)) {
      return value.results;
    }

    if (Array.isArray(value.records)) {
      return value.records;
    }
  }

  return [];
};

/**
 * Extract readable API error message.
 */
const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to load booking.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to load booking."
  );
};

/**
 * Extract Laravel validation errors.
 */
const extractValidationErrors = (error) => {
  return (
    error?.response?.data?.errors ||
    error?.errors ||
    {}
  );
};

/**
 * Extract data from common Laravel/API response wrappers.
 */
const unwrapData = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    value?.data !== undefined &&
    value?.data !== null
  ) {
    if (
      value.data?.data !== undefined &&
      value.data?.data !== null
    ) {
      return value.data.data;
    }

    return value.data;
  }

  return value;
};

/**
 * Determine whether an object looks like a booking.
 *
 * This prevents the Laravel API envelope itself from being
 * incorrectly treated as the booking object.
 */
const looksLikeBooking = (value) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  return Boolean(
    value.id ??
    value.booking_id ??
    value.booking_number ??
    value.reference ??
    value.slug ??
    value.booking_type ??
    value.start_date ??
    value.end_date
  );
};

/**
 * Extract a single booking object from common API response shapes.
 *
 * Prefer nested data before the outer API envelope.
 */
const extractObject = (value) => {
  const candidates = [
    value?.data?.data?.data,
    value?.data?.data,
    value?.data,
    value,
  ];

  for (const candidate of candidates) {
    if (looksLikeBooking(candidate)) {
      return candidate;
    }

    /*
     * Some APIs return:
     *
     * {
     *   booking: {...}
     * }
     */
    if (looksLikeBooking(candidate?.booking)) {
      return candidate.booking;
    }
  }

  return null;
};

/**
 * Normalize a generic ID.
 *
 * IMPORTANT:
 * Never return "[object Object]".
 */
const getId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const normalized = String(value).trim();

    if (
      !normalized ||
      normalized === "[object Object]" ||
      normalized.includes("[object Object]")
    ) {
      return "";
    }

    return normalized;
  }

  if (typeof value === "object") {
    const nestedId =
      value?.id ??
      value?.value ??
      value?.booking_id ??
      value?.tenancy_id ??
      value?.unit_id ??
      value?.apartment_id ??
      value?.property_id;

    if (
      nestedId !== undefined &&
      nestedId !== null &&
      nestedId !== ""
    ) {
      return getId(nestedId);
    }
  }

  return "";
};

/**
 * Normalize route ID specifically.
 *
 * This prevents:
 *
 * /bookings/[object Object]/edit
 *
 * from being used as an API identifier.
 */
const normalizeRouteId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const normalized = String(value).trim();

    if (
      !normalized ||
      normalized === "[object Object]" ||
      normalized.includes("[object Object]")
    ) {
      return "";
    }

    return normalized;
  }

  return getId(value);
};

/**
 * Get USER ID from a customer/user object.
 *
 * Customer = users.id
 *
 * Tenant profile:
 *     tenants.id
 *     tenants.user_id
 *
 * Therefore customer resolution must prefer user_id/user.id.
 */
const getCustomerUserId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return getId(value);
  }

  if (typeof value === "object") {
    return (
      getId(value?.user_id) ||
      getId(value?.user?.id) ||
      getId(value?.customer_id) ||
      getId(value?.customer?.id) ||
      getId(value?.id) ||
      getId(value?.value) ||
      ""
    );
  }

  return "";
};

/**
 * Get TENANT PROFILE ID.
 *
 * Tenancy queries require tenants.id.
 */
const getTenantProfileId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return getId(value);
  }

  if (typeof value === "object") {
    return (
      getId(value?.tenant_id) ||
      getId(value?.tenant?.id) ||
      getId(value?.id) ||
      getId(value?.value) ||
      ""
    );
  }

  return "";
};

/**
 * Normalize collection options.
 */
const normalizeOptions = (value) => {
  return safeArray(value).filter(Boolean);
};

/**
 * Return the first non-empty value.
 */
const firstValue = (...values) => {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
};

/**
 * Add an item to a collection if its ID is not already present.
 */
const appendUniqueById = (
  collection,
  item
) => {
  if (!item) {
    return collection;
  }

  const itemId = getId(item);

  if (!itemId) {
    return collection.includes(item)
      ? collection
      : [...collection, item];
  }

  const exists = collection.some(
    (current) =>
      getId(current) === itemId
  );

  if (exists) {
    return collection;
  }

  return [
    ...collection,
    item,
  ];
};

/**
 * Merge multiple collections without duplicate IDs.
 */
const mergeUnique = (...collections) => {
  let result = [];

  collections.forEach((collection) => {
    normalizeOptions(collection).forEach(
      (item) => {
        result = appendUniqueById(
          result,
          item
        );
      }
    );
  });

  return result;
};

/**
 * Extract a tenant from different response shapes.
 */
const extractTenant = (response) => {
  const candidates = [
    response?.tenant,
    response?.data?.tenant,
    response?.data?.data?.tenant,
    response?.data?.data?.data?.tenant,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  const direct = [
    response?.data,
    response?.data?.data,
    response?.data?.data?.data,
  ];

  for (const candidate of direct) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      candidate?.id
    ) {
      if (!Array.isArray(candidate?.data)) {
        return candidate;
      }
    }
  }

  return null;
};

/**
 * Extract tenancies from a tenant object.
 */
const extractTenantTenancies = (tenant) => {
  if (!tenant) {
    return [];
  }

  return mergeUnique(
    tenant?.tenancies,
    tenant?.active_tenancies,
    tenant?.activeTenancies
  );
};

/**
 * Extract tenancies from an API response.
 */
const extractTenancies = (response) => {
  const directCandidates = [
    response?.tenancies,
    response?.data?.tenancies,
    response?.data?.data?.tenancies,
    response?.data?.data?.data?.tenancies,
  ];

  for (const candidate of directCandidates) {
    const list =
      normalizeOptions(candidate);

    if (list.length > 0) {
      return list;
    }
  }

  return safeArray(response);
};

/**
 * Extract a property from a tenancy.
 */
const extractPropertyFromTenancy = (tenancy) => {
  if (!tenancy) {
    return null;
  }

  return tenancy?.property ?? null;
};

/**
 * Extract an apartment from a tenancy.
 */
const extractApartmentFromTenancy = (tenancy) => {
  if (!tenancy) {
    return null;
  }

  return tenancy?.apartment ?? null;
};

/**
 * Extract a unit from a tenancy.
 */
const extractUnitFromTenancy = (tenancy) => {
  if (!tenancy) {
    return null;
  }

  return tenancy?.unit ?? null;
};

/*
|--------------------------------------------------------------------------
| Initial Form
|--------------------------------------------------------------------------
*/

const INITIAL_VALUES = {
  user_id: "",
  customer_id: "",
  tenant_id: "",

  property_id: "",
  apartment_id: "",
  unit_id: "",
  tenancy_id: "",

  booking_type: "rental",
  source: "website",

  booking_date: "",
  start_date: "",
  end_date: "",

  rent_amount: "",
  deposit_amount: "",
  service_charge: "",
  booking_fee: "",
  discount_amount: "",

  total_amount: "",
  paid_amount: "",

  payment_status: "pending",
  payment_method: "",
  payment_reference: "",

  adults: "1",
  children: "0",

  check_in_at: "",
  check_out_at: "",

  special_request: "",
  notes: "",
};

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

/**
 * Convert API date/time into YYYY-MM-DD.
 */
const normalizeDate = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return value;
    }

    if (value.includes("T")) {
      return value.slice(0, 10);
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
        .toISOString()
        .slice(0, 10);
    }
  }

  return "";
};

/**
 * Normalize datetime-local values.
 */
const normalizeDateTime = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(
    "Z",
    ""
  );

  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(
      normalized
    )
  ) {
    return normalized.slice(0, 16);
  }

  return normalized;
};

/*
|--------------------------------------------------------------------------
| Booking Normalizer
|--------------------------------------------------------------------------
*/

/**
 * Convert API booking object into BookingForm values.
 */
const normalizeBooking = (booking) => {
  if (!booking) {
    return {
      ...INITIAL_VALUES,
    };
  }

  const customer =
    firstValue(
      booking.customer,
      booking.user
    );

  const tenant =
    firstValue(
      booking.tenant,
      booking.tenant_profile
    );

  const tenancy =
    firstValue(
      booking.tenancy
    );

  const property =
    firstValue(
      booking.property,
      tenancy?.property
    );

  const apartment =
    firstValue(
      booking.apartment,
      tenancy?.apartment
    );

  const unit =
    firstValue(
      booking.unit,
      tenancy?.unit
    );

  const customerUserId =
    firstValue(
      booking.user_id,
      booking.customer_id,
      customer?.user_id,
      customer?.id
    );

  const tenantId =
    firstValue(
      booking.tenant_id,
      tenant?.id
    );

  const tenancyId =
    firstValue(
      booking.tenancy_id,
      tenancy?.id
    );

  return {
    ...INITIAL_VALUES,

    /*
    |--------------------------------------------------------------------------
    | Customer
    |--------------------------------------------------------------------------
    */

    user_id:
      getCustomerUserId(
        firstValue(
          booking.user,
          customer,
          booking.user_id
        )
      ),

    customer_id:
      getCustomerUserId(
        firstValue(
          booking.customer_id,
          customer,
          booking.user
        )
      ) ||
      getId(customerUserId),

    tenant_id:
      getTenantProfileId(
        firstValue(
          booking.tenant_id,
          tenant
        )
      ) ||
      getId(tenantId),

    /*
    |--------------------------------------------------------------------------
    | Property
    |--------------------------------------------------------------------------
    */

    property_id:
      getId(
        firstValue(
          booking.property_id,
          property
        )
      ),

    apartment_id:
      getId(
        firstValue(
          booking.apartment_id,
          apartment
        )
      ),

    unit_id:
      getId(
        firstValue(
          booking.unit_id,
          unit
        )
      ),

    tenancy_id:
      getId(
        firstValue(
          booking.tenancy_id,
          tenancy
        )
      ) ||
      getId(tenancyId),

    /*
    |--------------------------------------------------------------------------
    | Booking
    |--------------------------------------------------------------------------
    */

    booking_type:
      booking.booking_type ??
      "rental",

    source:
      booking.source ??
      "website",

    booking_date:
      normalizeDate(
        booking.booking_date
      ),

    start_date:
      normalizeDate(
        booking.start_date
      ),

    end_date:
      normalizeDate(
        booking.end_date
      ),

    rent_amount:
      booking.rent_amount ??
      booking.rent ??
      "",

    deposit_amount:
      booking.deposit_amount ??
      booking.deposit ??
      "",

    service_charge:
      booking.service_charge ??
      "",

    booking_fee:
      booking.booking_fee ??
      "",

    discount_amount:
      booking.discount_amount ??
      "",

    total_amount:
      booking.total_amount ??
      "",

    paid_amount:
      booking.paid_amount ??
      booking.amount_paid ??
      "",

    payment_status:
      booking.payment_status ??
      "pending",

    payment_method:
      booking.payment_method ??
      "",

    payment_reference:
      booking.payment_reference ??
      "",

    adults:
      booking.adults ??
      "1",

    children:
      booking.children ??
      "0",

    check_in_at:
      normalizeDateTime(
        booking.check_in_at
      ),

    check_out_at:
      normalizeDateTime(
        booking.check_out_at
      ),

    special_request:
      booking.special_request ??
      "",

    notes:
      booking.notes ??
      "",
  };
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditBooking = () => {
  const navigate = useNavigate();

  const params = useParams();

  /*
  |--------------------------------------------------------------------------
  | CRITICAL ID NORMALIZATION
  |--------------------------------------------------------------------------
  */

  const rawId = params?.id;

  const bookingId = useMemo(
    () => normalizeRouteId(rawId),
    [rawId]
  );

  const {
    getBooking,
    updateBooking,
    getAvailableUnits,
    getAvailableUsers,

    resolveCustomerTenancies,
    getTenantByCustomer,
    getTenanciesByTenant,

    availableUnits,
    availableUsers,

    loading,
    loadingGet,
    loadingUpdate,
    loadingAvailableUnits,
    loadingAvailableUsers,

    currentBooking,
    error,
    errors,
  } = useBooking();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [form, setForm] =
    useState(INITIAL_VALUES);

  const [booking, setBooking] =
    useState(null);

  const [properties, setProperties] =
    useState([]);

  const [apartments, setApartments] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [tenants, setTenants] =
    useState([]);

  const [tenancies, setTenancies] =
    useState([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [
    loadingRelationship,
    setLoadingRelationship,
  ] = useState(false);

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

  const isLoadingBooking =
    Boolean(loadingGet) ||
    Boolean(loadingData);

  const isUpdating =
    Boolean(submitting) ||
    Boolean(loadingUpdate);

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
    normalizeOptions(
      availableUnits
    );

  const hookAvailableUsers =
    normalizeOptions(
      availableUsers
    );

  /*
  |--------------------------------------------------------------------------
  | Effective Collections
  |--------------------------------------------------------------------------
  */

  const effectiveUnits =
    mergeUnique(
      units,
      hookAvailableUnits
    );

  const effectiveCustomers =
    mergeUnique(
      customers,
      hookAvailableUsers
    );

  /*
  |--------------------------------------------------------------------------
  | Load Booking + Supporting Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!bookingId) {
        if (mounted) {
          setServerError(
            rawId
              ? "Invalid booking ID."
              : "Booking ID is missing."
          );

          setLoadingData(false);
        }

        return;
      }

      try {
        setServerError("");

        /*
        |--------------------------------------------------------------------------
        | Load Booking
        |--------------------------------------------------------------------------
        */

        const bookingResponse =
          await getBooking(
            bookingId
          );

        if (!mounted) {
          return;
        }

        const bookingData =
          extractObject(
            bookingResponse
          );

        if (!bookingData) {
          throw new Error(
            "Booking information could not be loaded."
          );
        }

        const normalizedBooking =
          normalizeBooking(
            bookingData
          );

        setBooking(
          bookingData
        );

        setForm(
          normalizedBooking
        );

        /*
        |--------------------------------------------------------------------------
        | Preserve Existing Related Objects
        |--------------------------------------------------------------------------
        */

        const bookingCustomer =
          firstValue(
            bookingData.customer,
            bookingData.user
          );

        const bookingTenant =
          firstValue(
            bookingData.tenant,
            bookingData.tenant_profile
          );

        const bookingTenancy =
          bookingData.tenancy;

        const bookingProperty =
          firstValue(
            bookingData.property,
            bookingTenancy?.property
          );

        const bookingApartment =
          firstValue(
            bookingData.apartment,
            bookingTenancy?.apartment
          );

        const bookingUnit =
          firstValue(
            bookingData.unit,
            bookingTenancy?.unit
          );

        if (bookingProperty) {
          setProperties(
            (current) =>
              appendUniqueById(
                current,
                bookingProperty
              )
          );
        }

        if (bookingApartment) {
          setApartments(
            (current) =>
              appendUniqueById(
                current,
                bookingApartment
              )
          );
        }

        if (bookingUnit) {
          setUnits(
            (current) =>
              appendUniqueById(
                current,
                bookingUnit
              )
          );
        }

        if (bookingCustomer) {
          setCustomers(
            (current) =>
              appendUniqueById(
                current,
                bookingCustomer
              )
          );
        }

        if (bookingTenant) {
          setTenants(
            (current) =>
              appendUniqueById(
                current,
                bookingTenant
              )
          );
        }

        if (bookingTenancy) {
          setTenancies(
            (current) =>
              appendUniqueById(
                current,
                bookingTenancy
              )
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Load Available Booking Users
        |--------------------------------------------------------------------------
        */

        try {
          const usersResponse =
            await getAvailableUsers();

          if (!mounted) {
            return;
          }

          const usersData =
            unwrapData(
              usersResponse
            );

          const users =
            normalizeOptions(
              usersData?.users ??
              usersData
            );

          setCustomers(
            (current) =>
              mergeUnique(
                current,
                users,
                bookingCustomer
                  ? [bookingCustomer]
                  : []
              )
          );
        } catch (usersError) {
          if (mounted) {
            setServerError(
              extractErrorMessage(
                usersError
              )
            );
          }
        }
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

    loadData();

    return () => {
      mounted = false;
    };
  }, [
    bookingId,
    getBooking,
    getAvailableUsers,
    rawId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Resolve Customer → Tenant → Tenancy
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const customerId =
      getCustomerUserId(
        firstValue(
          form.customer_id,
          form.user_id
        )
      );

    if (
      !customerId ||
      loadingData
    ) {
      setLoadingRelationship(false);
      return;
    }

    let mounted = true;

    const resolveRelationship =
      async () => {
        try {
          setLoadingRelationship(true);

          if (
            typeof resolveCustomerTenancies ===
            "function"
          ) {
            const result =
              await resolveCustomerTenancies(
                customerId
              );

            if (!mounted) {
              return;
            }

            const resolvedTenant =
              extractTenant(result);

            const resolvedTenancies =
              extractTenancies(result);

            const embeddedTenancies =
              extractTenantTenancies(
                resolvedTenant
              );

            const allTenancies =
              mergeUnique(
                resolvedTenancies,
                embeddedTenancies
              );

            if (resolvedTenant) {
              setTenants(
                (current) =>
                  appendUniqueById(
                    current,
                    resolvedTenant
                  )
              );

              setForm(
                (current) => ({
                  ...current,

                  user_id:
                    current.user_id ||
                    customerId,

                  customer_id:
                    current.customer_id ||
                    customerId,

                  tenant_id:
                    getTenantProfileId(
                      resolvedTenant
                    ) ||
                    current.tenant_id,

                  tenancy_id:
                    current.tenancy_id ||
                    getId(
                      allTenancies[0]
                    ),
                })
              );
            }

            if (
              allTenancies.length > 0
            ) {
              setTenancies(
                (current) =>
                  mergeUnique(
                    current,
                    allTenancies
                  )
              );
            }

            if (resolvedTenant) {
              return;
            }
          }

          if (
            typeof getTenantByCustomer !==
            "function"
          ) {
            return;
          }

          const tenantResponse =
            await getTenantByCustomer(
              customerId
            );

          if (!mounted) {
            return;
          }

          const tenant =
            extractTenant(
              tenantResponse
            );

          if (!tenant) {
            return;
          }

          setTenants(
            (current) =>
              appendUniqueById(
                current,
                tenant
              )
          );

          setForm(
            (current) => ({
              ...current,

              user_id:
                current.user_id ||
                customerId,

              customer_id:
                current.customer_id ||
                customerId,

              tenant_id:
                getTenantProfileId(
                  tenant
                ) ||
                current.tenant_id,
            })
          );

          if (
            typeof getTenanciesByTenant ===
            "function"
          ) {
            const tenantId =
              getTenantProfileId(
                tenant
              );

            if (tenantId) {
              const tenancyResponse =
                await getTenanciesByTenant(
                  tenantId
                );

              if (!mounted) {
                return;
              }

              const apiTenancies =
                extractTenancies(
                  tenancyResponse
                );

              const embeddedTenancies =
                extractTenantTenancies(
                  tenant
                );

              const allTenancies =
                mergeUnique(
                  apiTenancies,
                  embeddedTenancies
                );

              setTenancies(
                (current) =>
                  mergeUnique(
                    current,
                    allTenancies
                  )
              );
            }
          }
        } catch (err) {
          if (!mounted) {
            return;
          }

          const message =
            extractErrorMessage(err);

          if (
            message &&
            !message
              .toLowerCase()
              .includes("not found")
          ) {
            setServerError(message);
          }
        } finally {
          if (mounted) {
            setLoadingRelationship(false);
          }
        }
      };

    resolveRelationship();

    return () => {
      mounted = false;
    };
  }, [
    form.customer_id,
    form.user_id,
    loadingData,
    resolveCustomerTenancies,
    getTenantByCustomer,
    getTenanciesByTenant,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Keep Existing Tenancy Related Objects Available
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const tenancyId =
      getId(form.tenancy_id);

    if (!tenancyId) {
      return;
    }

    const selectedTenancy =
      tenancies.find(
        (item) =>
          getId(item) === tenancyId
      );

    if (!selectedTenancy) {
      return;
    }

    const property =
      extractPropertyFromTenancy(
        selectedTenancy
      );

    const apartment =
      extractApartmentFromTenancy(
        selectedTenancy
      );

    const unit =
      extractUnitFromTenancy(
        selectedTenancy
      );

    if (property) {
      setProperties(
        (current) =>
          appendUniqueById(
            current,
            property
          )
      );
    }

    if (apartment) {
      setApartments(
        (current) =>
          appendUniqueById(
            current,
            apartment
          )
      );
    }

    if (unit) {
      setUnits(
        (current) =>
          appendUniqueById(
            current,
            unit
          )
      );
    }
  }, [
    form.tenancy_id,
    tenancies,
  ]);

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

      property_id:
        normalizedId,

      apartment_id: "",
      unit_id: "",
      tenancy_id: "",
    }));

    setApartments([]);
    setUnits([]);
    setTenancies([]);

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.property_id;
        delete next.apartment_id;
        delete next.unit_id;
        delete next.tenancy_id;

        return next;
      }
    );

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

      apartment_id:
        normalizedId,

      unit_id: "",
      tenancy_id: "",
    }));

    setUnits([]);

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.apartment_id;
        delete next.unit_id;
        delete next.tenancy_id;

        return next;
      }
    );

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

    const selectedUnit =
      effectiveUnits.find(
        (unit) =>
          getId(unit) ===
          normalizedId
      );

    setForm((current) => {
      const next = {
        ...current,

        unit_id:
          normalizedId,
      };

      if (
        selectedUnit &&
        (
          current.rent_amount === "" ||
          current.rent_amount === null ||
          current.rent_amount === undefined
        )
      ) {
        const unitPrice =
          firstValue(
            selectedUnit?.price,
            selectedUnit?.rent,
            selectedUnit?.rent_amount
          );

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

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.unit_id;

        return next;
      }
    );

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Customer Change
  |--------------------------------------------------------------------------
  */

  const handleCustomerChange = (
    customerValue
  ) => {
    const customerId =
      getCustomerUserId(
        customerValue
      );

    setForm((current) => ({
      ...current,

      user_id:
        customerId,

      customer_id:
        customerId,

      tenant_id: "",
      tenancy_id: "",
    }));

    setTenants([]);
    setTenancies([]);

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.customer_id;
        delete next.user_id;
        delete next.tenant_id;
        delete next.tenancy_id;

        return next;
      }
    );

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Tenant Change
  |--------------------------------------------------------------------------
  */

  const handleTenantChange = (
    tenantValue
  ) => {
    const tenantId =
      getTenantProfileId(
        tenantValue
      );

    setForm((current) => ({
      ...current,

      tenant_id:
        tenantId,

      tenancy_id: "",
    }));

    setTenancies([]);

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.tenant_id;
        delete next.tenancy_id;

        return next;
      }
    );

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Tenancy Change
  |--------------------------------------------------------------------------
  */

  const handleTenancyChange = (
    tenancyValue
  ) => {
    const tenancyId =
      getId(tenancyValue);

    const selectedTenancy =
      tenancies.find(
        (item) =>
          getId(item) === tenancyId
      );

    const property =
      extractPropertyFromTenancy(
        selectedTenancy
      );

    const apartment =
      extractApartmentFromTenancy(
        selectedTenancy
      );

    const unit =
      extractUnitFromTenancy(
        selectedTenancy
      );

    setForm((current) => ({
      ...current,

      tenancy_id:
        tenancyId,

      property_id:
        getId(property) ||
        current.property_id,

      apartment_id:
        getId(apartment) ||
        current.apartment_id,

      unit_id:
        getId(unit) ||
        current.unit_id,

      rent_amount:
        firstValue(
          selectedTenancy?.rent,
          selectedTenancy?.rent_amount,
          current.rent_amount
        ),

      deposit_amount:
        firstValue(
          selectedTenancy?.deposit,
          selectedTenancy?.deposit_amount,
          current.deposit_amount
        ),

      service_charge:
        firstValue(
          selectedTenancy?.service_charge,
          current.service_charge
        ),
    }));

    if (property) {
      setProperties(
        (current) =>
          appendUniqueById(
            current,
            property
          )
      );
    }

    if (apartment) {
      setApartments(
        (current) =>
          appendUniqueById(
            current,
            apartment
          )
      );
    }

    if (unit) {
      setUnits(
        (current) =>
          appendUniqueById(
            current,
            unit
          )
      );
    }

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.tenancy_id;

        return next;
      }
    );

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Generic Field Change
  |--------------------------------------------------------------------------
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

    if (
      name === "property_id"
    ) {
      handlePropertyChange(value);
      return;
    }

    if (
      name === "apartment_id"
    ) {
      handleApartmentChange(value);
      return;
    }

    if (
      name === "unit_id"
    ) {
      handleUnitChange(value);
      return;
    }

    if (
      name === "customer_id" ||
      name === "user_id"
    ) {
      handleCustomerChange(value);
      return;
    }

    if (
      name === "tenant_id"
    ) {
      handleTenantChange(value);
      return;
    }

    if (
      name === "tenancy_id"
    ) {
      handleTenancyChange(value);
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next[name];

        return next;
      }
    );

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch Available Units
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Laravel validates:
  |
  | start_date
  | end_date
  |
  | Therefore we MUST NOT call the endpoint until both dates exist.
  |
  | For edit mode we also pass booking_id so the backend can exclude
  | the current booking from availability conflicts.
  |
  */

  useEffect(() => {
    const propertyId =
      getId(form.property_id);

    const apartmentId =
      getId(form.apartment_id);

    const startDate =
      normalizeDate(
        form.start_date
      );

    const endDate =
      normalizeDate(
        form.end_date
      );

    /*
    |--------------------------------------------------------------------------
    | Do not call availability endpoint without required dates.
    |--------------------------------------------------------------------------
    */

    if (
      !propertyId ||
      !startDate ||
      !endDate
    ) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Do not query when date range is invalid.
    |--------------------------------------------------------------------------
    */

    const start =
      new Date(startDate);

    const end =
      new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return;
    }

    let mounted = true;

    const loadUnits = async () => {
      try {
        /*
        |--------------------------------------------------------------------------
        | Build availability parameters.
        |--------------------------------------------------------------------------
        */

        const params = {
          property_id:
            propertyId,

          start_date:
            startDate,

          end_date:
            endDate,

          /*
          | Exclude the booking currently being edited.
          */
          ...(bookingId
            ? {
              booking_id:
                bookingId,
            }
            : {}),

          ...(apartmentId
            ? {
              apartment_id:
                apartmentId,
            }
            : {}),
        };

        console.debug(
          "[EditBooking] Loading available units:",
          params
        );

        const response =
          await getAvailableUnits(
            params
          );

        if (!mounted) {
          return;
        }

        const data =
          unwrapData(response);

        const list =
          data?.units ??
          data?.available_units ??
          data;

        const fetchedUnits =
          normalizeOptions(list);

        /*
        |--------------------------------------------------------------------------
        | Always preserve currently selected unit.
        |--------------------------------------------------------------------------
        */

        const selectedUnit =
          units.find(
            (unit) =>
              getId(unit) ===
              getId(form.unit_id)
          );

        setUnits(
          mergeUnique(
            fetchedUnits,
            selectedUnit
              ? [selectedUnit]
              : []
          )
        );

        /*
        |--------------------------------------------------------------------------
        | Clear availability error after successful request.
        |--------------------------------------------------------------------------
        */

        setFieldErrors(
          (current) => {
            const next = {
              ...current,
            };

            delete next.start_date;
            delete next.end_date;

            return next;
          }
        );
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "[EditBooking] Available units request failed:",
          err
        );

        /*
        |--------------------------------------------------------------------------
        | Show availability validation errors.
        |--------------------------------------------------------------------------
        */

        const validationErrors =
          extractValidationErrors(err);

        if (
          validationErrors &&
          Object.keys(
            validationErrors
          ).length > 0
        ) {
          setFieldErrors(
            (current) => ({
              ...current,
              ...validationErrors,
            })
          );
        }

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
    bookingId,
    form.property_id,
    form.apartment_id,
    form.start_date,
    form.end_date,
    form.unit_id,
    getAvailableUnits,
    units,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validate = (
    values = form
  ) => {
    const nextErrors = {};

    if (
      !getId(values.property_id)
    ) {
      nextErrors.property_id =
        "Please select a property.";
    }

    if (
      !getId(values.unit_id)
    ) {
      nextErrors.unit_id =
        "Please select a unit.";
    }

    if (
      !getCustomerUserId(
        firstValue(
          values.customer_id,
          values.user_id
        )
      ) &&
      !getTenantProfileId(
        values.tenant_id
      )
    ) {
      nextErrors.customer_id =
        "Please select a customer.";
    }

    if (!values.booking_type) {
      nextErrors.booking_type =
        "Please select a booking type.";
    }

    if (!values.booking_date) {
      nextErrors.booking_date =
        "Please select the booking date.";
    }

    if (!values.start_date) {
      nextErrors.start_date =
        "Please select the start date.";
    }

    if (
      values.start_date &&
      values.end_date
    ) {
      const start =
        new Date(values.start_date);

      const end =
        new Date(values.end_date);

      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end < start
      ) {
        nextErrors.end_date =
          "End date cannot be before start date.";
      }
    }

    setFieldErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Build Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = (values) => {
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
    | Customer
    |--------------------------------------------------------------------------
    */

    const customerId =
      getCustomerUserId(
        firstValue(
          values.customer_id,
          values.user_id
        )
      );

    appendIfValue(
      "user_id",
      customerId
    );

    appendIfValue(
      "customer_id",
      customerId
    );

    appendIfValue(
      "tenant_id",
      getTenantProfileId(
        values.tenant_id
      )
    );

    /*
    |--------------------------------------------------------------------------
    | Property
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "property_id",
      getId(values.property_id)
    );

    appendIfValue(
      "apartment_id",
      getId(values.apartment_id)
    );

    appendIfValue(
      "unit_id",
      getId(values.unit_id)
    );

    appendIfValue(
      "tenancy_id",
      getId(values.tenancy_id)
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

    appendIfValue(
      "paid_amount",
      values.paid_amount
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

    appendIfValue(
      "adults",
      values.adults
    );

    appendIfValue(
      "children",
      values.children
    );

    appendIfValue(
      "check_in_at",
      values.check_in_at
    );

    appendIfValue(
      "check_out_at",
      values.check_out_at
    );

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
  | Submit Update
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    eventOrValues
  ) => {
    eventOrValues?.preventDefault?.();

    /*
    |--------------------------------------------------------------------------
    | Never update using an invalid/object ID.
    |--------------------------------------------------------------------------
    */

    if (!bookingId) {
      const message =
        "A valid booking ID is required to update this booking.";

      setServerError(message);

      await Swal.fire({
        icon: "error",
        title:
          "Invalid Booking",
        text: message,
        confirmButtonText:
          "Close",
        confirmButtonColor:
          "#dc2626",
      });

      return;
    }

    const submittedValues =
      eventOrValues &&
        !eventOrValues?.target &&
        typeof eventOrValues ===
        "object"
        ? {
          ...form,
          ...eventOrValues,
        }
        : form;

    /*
    |--------------------------------------------------------------------------
    | Normalize IDs before validation.
    |--------------------------------------------------------------------------
    */

    const normalizedValues = {
      ...submittedValues,

      user_id:
        getCustomerUserId(
          firstValue(
            submittedValues.user_id,
            submittedValues.customer_id
          )
        ),

      customer_id:
        getCustomerUserId(
          firstValue(
            submittedValues.customer_id,
            submittedValues.user_id
          )
        ),

      tenant_id:
        getTenantProfileId(
          submittedValues.tenant_id
        ),

      property_id:
        getId(
          submittedValues.property_id
        ),

      apartment_id:
        getId(
          submittedValues.apartment_id
        ),

      unit_id:
        getId(
          submittedValues.unit_id
        ),

      tenancy_id:
        getId(
          submittedValues.tenancy_id
        ),
    };

    if (
      !validate(
        normalizedValues
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");
      setFieldErrors({});

      const payload =
        buildPayload(
          normalizedValues
        );

      console.debug(
        "[EditBooking] Updating booking:",
        {
          bookingId,
          payload,
        }
      );

      const response =
        await updateBooking(
          bookingId,
          payload
        );

      const message =
        response?.message ||
        "Booking updated successfully.";

      await Swal.fire({
        icon: "success",
        title:
          "Booking Updated",
        text: message,
        confirmButtonText:
          "View Bookings",
        confirmButtonColor:
          "#4f46e5",
      });

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
        validationErrors || {}
      );

      await Swal.fire({
        icon: "error",
        title:
          "Unable to Update Booking",
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
    if (isUpdating) {
      return;
    }

    if (!bookingId) {
      navigate(
        "/super-admin/bookings"
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FIXED:
    |
    | The previous version had:
    |
    | / super- admin / bookings / ${bookingId}
    |
    | which creates an invalid URL.
    |--------------------------------------------------------------------------
    */

    navigate(
      `/super-admin/bookings/${encodeURIComponent(
        bookingId
      )}`
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
  | Invalid ID
  |--------------------------------------------------------------------------
  */

  if (!bookingId) {
    return (
      <div className="space-y-6">
        <BookingHeader />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-red-800">
                Invalid booking
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {rawId
                  ? "The booking URL contains an invalid booking ID."
                  : "No booking ID was provided."}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/super-admin/bookings"
                  )
                }
                className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading Screen
  |--------------------------------------------------------------------------
  */

  if (isLoadingBooking) {
    return (
      <div className="space-y-6">
        <BookingHeader />

        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Loading booking
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Please wait while we
              load the booking
              information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Booking Not Found
  |--------------------------------------------------------------------------
  */

  const displayedBooking =
    booking ||
    currentBooking;

  if (
    !displayedBooking &&
    !loading
  ) {
    return (
      <div className="space-y-6">
        <BookingHeader />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Booking not found
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  "The requested booking could not be found."}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/super-admin/bookings"
                  )
                }
                className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Back to Bookings
              </button>
            </div>
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
      {/* ================================================================
          HEADER
      ================================================================ */}

      <BookingHeader
        loading={isUpdating}
      />

      {/* ================================================================
          RELATIONSHIP LOADING
      ================================================================ */}

      {loadingRelationship && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />

          <span>
            Resolving customer, tenant and tenancy information...
          </span>
        </div>
      )}

      {/* ================================================================
          PAGE ERROR
      ================================================================ */}

      {(serverError || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Unable to load booking
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  extractErrorMessage(error)}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          FORM
      ================================================================ */}

      <BookingForm
        mode="edit"
        initialValues={
          INITIAL_VALUES
        }
        values={form}
        properties={properties}
        apartments={apartments}
        units={effectiveUnits}
        customers={effectiveCustomers}
        tenants={tenants}
        tenancies={tenancies}
        errors={{
          ...errors,
          ...fieldErrors,
        }}
        loading={
          loading ||
          isLoadingBooking ||
          loadingRelationship
        }
        submitting={isUpdating}
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

export default EditBooking;