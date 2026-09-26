import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const extractResponseData = (response) => {
  if (!response) {
    return {};
  }

  const axiosData = response?.data;

  if (
    axiosData &&
    typeof axiosData === "object" &&
    !Array.isArray(axiosData)
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        axiosData,
        "data"
      )
    ) {
      return axiosData.data;
    }

    return axiosData;
  }

  if (
    response &&
    typeof response === "object" &&
    !Array.isArray(response)
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        response,
        "data"
      )
    ) {
      return response.data;
    }

    return response;
  }

  return response;
};

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create booking.";
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData =
    error?.response?.data;

  return (
    responseData?.message ||
    responseData?.error ||
    error?.message ||
    error?.error ||
    "Unable to create booking."
  );
};

const extractValidationErrors = (error) => {
  const validationErrors =
    error?.response?.data?.errors ||
    error?.errors ||
    {};

  return (
    validationErrors &&
    typeof validationErrors === "object" &&
    !Array.isArray(validationErrors)
  )
    ? validationErrors
    : {};
};

const getId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    const id =
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
      value?.userId;

    if (
      id !== undefined &&
      id !== null &&
      id !== ""
    ) {
      return String(id);
    }
  }

  return "";
};

const normalizeOptions = (value) => {
  return safeArray(value).filter(Boolean);
};

const findById = (
  collection,
  id
) => {
  const normalizedId =
    getId(id);

  if (!normalizedId) {
    return null;
  }

  return (
    collection.find(
      (item) =>
        getId(item) ===
        normalizedId
    ) || null
  );
};

const sameCollectionById = (
  first,
  second
) => {
  if (first === second) {
    return true;
  }

  if (
    !Array.isArray(first) ||
    !Array.isArray(second)
  ) {
    return false;
  }

  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  return first.every(
    (item, index) =>
      getId(item) ===
      getId(second[index])
  );
};

const uniqueById = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    if (!item) {
      return false;
    }

    const id = getId(item);

    if (!id) {
      return true;
    }

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);

    return true;
  });
};

const normalizeAmount = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : value;
};

const normalizeGuestCount = (
  value,
  fallback = undefined
) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.trunc(number);
};

/*
|--------------------------------------------------------------------------
| Relationship Helpers
|--------------------------------------------------------------------------
*/

const getTenantId = (tenant) => {
  if (!tenant) {
    return "";
  }

  return getId(
    tenant?.tenant_id ??
    tenant?.id
  );
};

const getTenancyTenantId = (tenancy) => {
  if (!tenancy) {
    return "";
  }

  return getId(
    tenancy?.tenant_id ??
    tenancy?.tenant?.id ??
    tenancy?.tenant?.tenant_id
  );
};

const getTenancyPropertyId = (tenancy) => {
  if (!tenancy) {
    return "";
  }

  return getId(
    tenancy?.property_id ??
    tenancy?.property?.id ??
    tenancy?.property?.property_id
  );
};

const getTenancyApartmentId = (tenancy) => {
  if (!tenancy) {
    return "";
  }

  return getId(
    tenancy?.apartment_id ??
    tenancy?.apartment?.id ??
    tenancy?.apartment?.apartment_id
  );
};

const getTenancyUnitId = (tenancy) => {
  if (!tenancy) {
    return "";
  }

  return getId(
    tenancy?.unit_id ??
    tenancy?.unit?.id ??
    tenancy?.unit?.unit_id
  );
};

const getCustomerUserId = (customer) => {
  if (!customer) {
    return "";
  }

  return getId(
    customer?.user_id ??
    customer?.user?.id ??
    customer?.customer_id ??
    customer?.id
  );
};

const getNestedTenancies = (tenant) => {
  if (!tenant) {
    return [];
  }

  return normalizeOptions(
    tenant?.tenancies ??
    tenant?.active_tenancies ??
    tenant?.activeTenancies
  );
};

const getNestedApartments = (property) => {
  if (!property) {
    return [];
  }

  return normalizeOptions(
    property?.apartments ??
    property?.apartment_list
  );
};

const getNestedUnits = (apartment) => {
  if (!apartment) {
    return [];
  }

  return normalizeOptions(
    apartment?.units ??
    apartment?.unit_list
  );
};

const mergeIntoState = (
  setter,
  incoming
) => {
  const list =
    normalizeOptions(incoming);

  if (!list.length) {
    return;
  }

  setter((current) => {
    const merged =
      uniqueById([
        ...current,
        ...list,
      ]);

    return sameCollectionById(
      current,
      merged
    )
      ? current
      : merged;
  });
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
  tenancy_id: "",

  property_id: "",
  apartment_id: "",
  unit_id: "",

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

  amount_paid: "",
  payment_status: "pending",
  payment_method: "",
  payment_reference: "",

  number_of_adults: "1",
  number_of_children: "0",

  check_in_date: "",
  check_out_date: "",

  special_requests: "",
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
    addBooking,

    getAvailableUnits,
    getAvailableUsers,

    availableUnits,
    availableUsers,

    selectedTenant,
    customerTenancies,

    customerTenanciesLoading,
    customerTenanciesError,

    resolveCustomerTenancies,
    getTenantByCustomer,

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

  const [form, setForm] =
    useState(INITIAL_VALUES);

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

  const [submitting, setSubmitting] =
    useState(false);

  const [serverError, setServerError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  /*
  |--------------------------------------------------------------------------
  | Stable Function Refs
  |--------------------------------------------------------------------------
  |
  | These refs allow the initial-data effect and async relationship
  | handlers to use the latest hook functions without putting unstable
  | hook functions into effect dependencies.
  |--------------------------------------------------------------------------
  */

  const getAvailableUsersRef =
    useRef(getAvailableUsers);

  const getAvailableUnitsRef =
    useRef(getAvailableUnits);

  const resolveCustomerTenanciesRef =
    useRef(resolveCustomerTenancies);

  const getTenantByCustomerRef =
    useRef(getTenantByCustomer);

  const addBookingRef =
    useRef(addBooking);

  useEffect(() => {
    getAvailableUsersRef.current =
      getAvailableUsers;
  }, [getAvailableUsers]);

  useEffect(() => {
    getAvailableUnitsRef.current =
      getAvailableUnits;
  }, [getAvailableUnits]);

  useEffect(() => {
    resolveCustomerTenanciesRef.current =
      resolveCustomerTenancies;
  }, [resolveCustomerTenancies]);

  useEffect(() => {
    getTenantByCustomerRef.current =
      getTenantByCustomer;
  }, [getTenantByCustomer]);

  useEffect(() => {
    addBookingRef.current =
      addBooking;
  }, [addBooking]);

  /*
  |--------------------------------------------------------------------------
  | Request Guards
  |--------------------------------------------------------------------------
  */

  const initialLoadStartedRef =
    useRef(false);

  const relationshipRequestRef =
    useRef(0);

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

  const isLoadingRelationship =
    Boolean(customerTenanciesLoading);

  /*
  |--------------------------------------------------------------------------
  | Hook Collections
  |--------------------------------------------------------------------------
  */

  const hookAvailableUnits =
    useMemo(
      () =>
        normalizeOptions(
          availableUnits
        ),
      [availableUnits]
    );

  const hookAvailableUsers =
    useMemo(
      () =>
        normalizeOptions(
          availableUsers
        ),
      [availableUsers]
    );

  /*
  |--------------------------------------------------------------------------
  | Effective Units
  |--------------------------------------------------------------------------
  */

  const effectiveUnits =
    useMemo(() => {
      return uniqueById([
        ...units,
        ...hookAvailableUnits,
      ]);
    }, [
      units,
      hookAvailableUnits,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Effective Customers
  |--------------------------------------------------------------------------
  */

  const effectiveCustomers =
    useMemo(() => {
      return uniqueById([
        ...customers,
        ...hookAvailableUsers,
      ]);
    }, [
      customers,
      hookAvailableUsers,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Effective Tenants
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do not synchronize selectedTenant into local state from an effect.
  | selectedTenant may be recreated by useBooking() and doing setState from
  | an effect watching it can cause a Maximum Update Depth loop.
  |--------------------------------------------------------------------------
  */

  const effectiveTenants =
    useMemo(() => {
      const selected =
        selectedTenant
          ? [selectedTenant]
          : [];

      return uniqueById([
        ...tenants,
        ...selected,
      ]);
    }, [
      tenants,
      selectedTenant,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Effective Tenancies
  |--------------------------------------------------------------------------
  */

  const effectiveTenancies =
    useMemo(() => {
      const relationshipList =
        normalizeOptions(
          customerTenancies
        );

      const localList =
        normalizeOptions(
          tenancies
        );

      const nestedList =
        effectiveTenants.flatMap(
          getNestedTenancies
        );

      return uniqueById([
        ...relationshipList,
        ...localList,
        ...nestedList,
      ]);
    }, [
      customerTenancies,
      tenancies,
      effectiveTenants,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Initial Booking Data
  |--------------------------------------------------------------------------
  */

  const loadBookingData =
    useCallback(
      async () => {
        try {
          setLoadingData(true);
          setServerError("");

          const response =
            await getAvailableUsersRef.current();

          const data =
            extractResponseData(
              response
            );

          /*
          |----------------------------------------------------------------------
          | Customers / Users
          |----------------------------------------------------------------------
          */

          const users =
            normalizeOptions(
              data?.users ??
              data?.customers ??
              data
            );

          mergeIntoState(
            setCustomers,
            users
          );

          /*
          |----------------------------------------------------------------------
          | Properties
          |----------------------------------------------------------------------
          */

          const suppliedProperties =
            normalizeOptions(
              data?.properties ??
              data?.property_list
            );

          /*
          |----------------------------------------------------------------------
          | Apartments
          |----------------------------------------------------------------------
          */

          const suppliedApartments =
            normalizeOptions(
              data?.apartments ??
              data?.apartment_list
            );

          /*
          |----------------------------------------------------------------------
          | Units
          |----------------------------------------------------------------------
          */

          const suppliedUnits =
            normalizeOptions(
              data?.units ??
              data?.available_units ??
              data?.unit_list
            );

          /*
          |----------------------------------------------------------------------
          | Tenants
          |----------------------------------------------------------------------
          */

          const suppliedTenants =
            normalizeOptions(
              data?.tenants ??
              data?.tenant_list
            );

          /*
          |----------------------------------------------------------------------
          | Tenancies
          |----------------------------------------------------------------------
          */

          const suppliedTenancies =
            normalizeOptions(
              data?.tenancies ??
              data?.active_tenancies ??
              data?.activeTenancies
            );

          mergeIntoState(
            setProperties,
            suppliedProperties
          );

          mergeIntoState(
            setApartments,
            suppliedApartments
          );

          mergeIntoState(
            setUnits,
            suppliedUnits
          );

          mergeIntoState(
            setTenants,
            suppliedTenants
          );

          mergeIntoState(
            setTenancies,
            suppliedTenancies
          );

          /*
          |----------------------------------------------------------------------
          | Extract apartments and units nested inside properties
          |----------------------------------------------------------------------
          */

          const nestedApartments =
            suppliedProperties.flatMap(
              getNestedApartments
            );

          const nestedUnits =
            nestedApartments.flatMap(
              getNestedUnits
            );

          mergeIntoState(
            setApartments,
            nestedApartments
          );

          mergeIntoState(
            setUnits,
            nestedUnits
          );

          /*
          |----------------------------------------------------------------------
          | Extract tenancies nested inside tenants
          |----------------------------------------------------------------------
          */

          const nestedTenancies =
            suppliedTenants.flatMap(
              getNestedTenancies
            );

          mergeIntoState(
            setTenancies,
            nestedTenancies
          );
        } catch (err) {
          if (
            import.meta.env.DEV
          ) {
            console.error(
              "[CreateBooking] Initial booking data failed:",
              err
            );
          }

          setServerError(
            extractErrorMessage(err)
          );
        } finally {
          setLoadingData(false);
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Initial Data Effect
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      initialLoadStartedRef.current
    ) {
      return;
    }

    initialLoadStartedRef.current =
      true;

    loadBookingData();
  }, [
    loadBookingData,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Customer Change
  |--------------------------------------------------------------------------
  |
  | Customer
  |   ↓
  | Tenant
  |   ↓
  | Tenancy
  |   ↓
  | Property / Apartment / Unit
  |--------------------------------------------------------------------------
  */

  const handleCustomerChange =
    useCallback(
      async (customerValue) => {
        const customer =
          typeof customerValue ===
            "object"
            ? customerValue
            : findById(
              effectiveCustomers,
              customerValue
            );

        const customerId =
          getId(customer);

        const userId =
          getCustomerUserId(
            customer
          );

        const requestId =
          ++relationshipRequestRef.current;

        /*
        |----------------------------------------------------------------------
        | Reset relationship selections.
        |
        | IMPORTANT:
        | Do not clear the global collections. They may contain the records
        | required to populate the next relationship select.
        |----------------------------------------------------------------------
        */

        setForm((current) => {
          const next = {
            ...current,

            customer_id:
              customerId,

            user_id:
              userId,

            tenant_id: "",
            tenancy_id: "",

            property_id: "",
            apartment_id: "",
            unit_id: "",

            rent_amount: "",
            deposit_amount: "",
            service_charge: "",
            total_amount: "",
          };

          const changed =
            Object.keys(next).some(
              (key) =>
                next[key] !==
                current[key]
            );

          return changed
            ? next
            : current;
        });

        setFieldErrors((current) => {
          const next = {
            ...current,
          };

          delete next.customer_id;
          delete next.user_id;
          delete next.tenant_id;
          delete next.tenancy_id;
          delete next.property_id;
          delete next.apartment_id;
          delete next.unit_id;

          return next;
        });

        setServerError("");

        if (!customer) {
          return;
        }

        try {
          /*
          |--------------------------------------------------------------------
          | Resolve customer → tenant → tenancy
          |--------------------------------------------------------------------
          */

          const result =
            await resolveCustomerTenanciesRef.current(
              customer
            );

          if (
            requestId !==
            relationshipRequestRef.current
          ) {
            return;
          }

          const resolvedTenant =
            result?.tenant ??
            result?.selectedTenant ??
            result?.data?.tenant ??
            null;

          const resolvedTenancies =
            normalizeOptions(
              result?.tenancies ??
              result?.customerTenancies ??
              result?.data?.tenancies ??
              result?.data?.customerTenancies
            );

          /*
          |--------------------------------------------------------------------
          | Tenant
          |--------------------------------------------------------------------
          */

          if (resolvedTenant) {
            mergeIntoState(
              setTenants,
              [resolvedTenant]
            );

            const tenantId =
              getTenantId(
                resolvedTenant
              );

            /*
            |------------------------------------------------------------------
            | Guard the state update.
            |------------------------------------------------------------------
            */

            if (tenantId) {
              setForm((current) => {
                if (
                  current.tenant_id ===
                  tenantId
                ) {
                  return current;
                }

                return {
                  ...current,
                  tenant_id:
                    tenantId,
                };
              });
            }

            /*
            |------------------------------------------------------------------
            | Load tenant's nested tenancies.
            |------------------------------------------------------------------
            */

            mergeIntoState(
              setTenancies,
              getNestedTenancies(
                resolvedTenant
              )
            );
          }

          /*
          |--------------------------------------------------------------------
          | Customer relationship tenancies
          |--------------------------------------------------------------------
          */

          mergeIntoState(
            setTenancies,
            resolvedTenancies
          );

          /*
          |--------------------------------------------------------------------
          | Preload related property/apartment/unit records.
          |--------------------------------------------------------------------
          */

          resolvedTenancies.forEach(
            (tenancy) => {
              if (tenancy?.property) {
                mergeIntoState(
                  setProperties,
                  [tenancy.property]
                );

                mergeIntoState(
                  setApartments,
                  getNestedApartments(
                    tenancy.property
                  )
                );
              }

              if (tenancy?.apartment) {
                mergeIntoState(
                  setApartments,
                  [tenancy.apartment]
                );

                mergeIntoState(
                  setUnits,
                  getNestedUnits(
                    tenancy.apartment
                  )
                );
              }

              if (tenancy?.unit) {
                mergeIntoState(
                  setUnits,
                  [tenancy.unit]
                );
              }
            }
          );

          /*
          |--------------------------------------------------------------------
          | Fallback tenant lookup
          |--------------------------------------------------------------------
          */

          if (
            !resolvedTenant &&
            getTenantByCustomerRef.current
          ) {
            const tenant =
              await getTenantByCustomerRef.current(
                customer
              );

            if (
              requestId !==
              relationshipRequestRef.current
            ) {
              return;
            }

            if (tenant) {
              mergeIntoState(
                setTenants,
                [tenant]
              );

              const tenantId =
                getTenantId(
                  tenant
                );

              if (tenantId) {
                setForm((current) => {
                  if (
                    current.tenant_id ===
                    tenantId
                  ) {
                    return current;
                  }

                  return {
                    ...current,
                    tenant_id:
                      tenantId,
                  };
                });
              }

              mergeIntoState(
                setTenancies,
                getNestedTenancies(
                  tenant
                )
              );
            }
          }
        } catch (err) {
          if (
            import.meta.env.DEV
          ) {
            console.error(
              "[CreateBooking] Customer relationship resolution failed:",
              err
            );
          }

          if (
            requestId ===
            relationshipRequestRef.current
          ) {
            setServerError(
              extractErrorMessage(err)
            );
          }
        }
      },
      [
        effectiveCustomers,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Tenant Change
  |--------------------------------------------------------------------------
  */

  const handleTenantChange =
    useCallback(
      (tenantValue) => {
        const tenant =
          typeof tenantValue ===
            "object"
            ? tenantValue
            : findById(
              effectiveTenants,
              tenantValue
            );

        const tenantId =
          getTenantId(
            tenant
          );

        const tenantTenancies =
          getNestedTenancies(
            tenant
          );

        /*
        |----------------------------------------------------------------------
        | Invalidate an older async customer relationship request.
        |----------------------------------------------------------------------
        */

        relationshipRequestRef.current += 1;

        setForm((current) => ({
          ...current,

          tenant_id:
            tenantId,

          tenancy_id: "",
          property_id: "",
          apartment_id: "",
          unit_id: "",

          rent_amount: "",
          deposit_amount: "",
          service_charge: "",
          total_amount: "",
        }));

        mergeIntoState(
          setTenancies,
          tenantTenancies
        );

        setFieldErrors((current) => {
          const next = {
            ...current,
          };

          delete next.tenant_id;
          delete next.tenancy_id;
          delete next.property_id;
          delete next.apartment_id;
          delete next.unit_id;

          return next;
        });

        setServerError("");
      },
      [
        effectiveTenants,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Tenancy Change
  |--------------------------------------------------------------------------
  */

  const handleTenancyChange =
    useCallback(
      (tenancyValue) => {
        const tenancy =
          typeof tenancyValue ===
            "object"
            ? tenancyValue
            : findById(
              effectiveTenancies,
              tenancyValue
            );

        if (!tenancy) {
          return;
        }

        const tenancyId =
          getId(tenancy);

        if (!tenancyId) {
          return;
        }

        const tenantId =
          getTenancyTenantId(
            tenancy
          );

        const propertyId =
          getTenancyPropertyId(
            tenancy
          );

        const apartmentId =
          getTenancyApartmentId(
            tenancy
          );

        const unitId =
          getTenancyUnitId(
            tenancy
          );

        const rentAmount =
          tenancy?.rent_amount ??
          tenancy?.rent ??
          tenancy?.monthly_rent ??
          "";

        const depositAmount =
          tenancy?.deposit_amount ??
          tenancy?.deposit ??
          "";

        const serviceCharge =
          tenancy?.service_charge ??
          "";

        setForm((current) => ({
          ...current,

          tenancy_id:
            tenancyId,

          tenant_id:
            tenantId ||
            current.tenant_id,

          property_id:
            propertyId ||
            current.property_id,

          apartment_id:
            apartmentId ||
            current.apartment_id,

          unit_id:
            unitId ||
            current.unit_id,

          rent_amount:
            rentAmount !== ""
              ? String(rentAmount)
              : current.rent_amount,

          deposit_amount:
            depositAmount !== ""
              ? String(depositAmount)
              : current.deposit_amount,

          service_charge:
            serviceCharge !== ""
              ? String(serviceCharge)
              : current.service_charge,
        }));

        /*
        |----------------------------------------------------------------------
        | Tenant
        |----------------------------------------------------------------------
        */

        if (tenancy?.tenant) {
          mergeIntoState(
            setTenants,
            [tenancy.tenant]
          );
        }

        /*
        |----------------------------------------------------------------------
        | Property
        |----------------------------------------------------------------------
        */

        if (tenancy?.property) {
          mergeIntoState(
            setProperties,
            [tenancy.property]
          );

          mergeIntoState(
            setApartments,
            getNestedApartments(
              tenancy.property
            )
          );
        }

        /*
        |----------------------------------------------------------------------
        | Apartment
        |----------------------------------------------------------------------
        */

        if (tenancy?.apartment) {
          mergeIntoState(
            setApartments,
            [tenancy.apartment]
          );

          mergeIntoState(
            setUnits,
            getNestedUnits(
              tenancy.apartment
            )
          );
        }

        /*
        |----------------------------------------------------------------------
        | Unit
        |----------------------------------------------------------------------
        */

        if (tenancy?.unit) {
          mergeIntoState(
            setUnits,
            [tenancy.unit]
          );
        }

        setFieldErrors((current) => {
          const next = {
            ...current,
          };

          delete next.tenancy_id;
          delete next.tenant_id;
          delete next.property_id;
          delete next.apartment_id;
          delete next.unit_id;

          return next;
        });

        setServerError("");
      },
      [
        effectiveTenancies,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Property Change
  |--------------------------------------------------------------------------
  */

  const handlePropertyChange =
    useCallback(
      (propertyValue) => {
        const propertyId =
          getId(propertyValue);

        const selectedProperty =
          findById(
            properties,
            propertyId
          );

        const propertyApartments =
          getNestedApartments(
            selectedProperty
          );

        setForm((current) => ({
          ...current,

          property_id:
            propertyId,

          apartment_id: "",
          unit_id: "",
          tenancy_id: "",

          rent_amount: "",
          deposit_amount: "",
          service_charge: "",
          total_amount: "",
        }));

        /*
        |----------------------------------------------------------------------
        | Only replace apartment/unit collections when the selected property
        | is actually known. Otherwise retain records loaded from tenancy
        | resolution.
        |----------------------------------------------------------------------
        */

        if (
          propertyApartments.length
        ) {
          setApartments(
            propertyApartments
          );
        } else {
          setApartments([]);
        }

        setUnits([]);

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
      },
      [
        properties,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Apartment Change
  |--------------------------------------------------------------------------
  */

  const handleApartmentChange =
    useCallback(
      (apartmentValue) => {
        const apartmentId =
          getId(apartmentValue);

        const selectedApartment =
          findById(
            apartments,
            apartmentId
          );

        const apartmentUnits =
          getNestedUnits(
            selectedApartment
          );

        setForm((current) => ({
          ...current,

          apartment_id:
            apartmentId,

          unit_id: "",
          tenancy_id: "",

          rent_amount: "",
          deposit_amount: "",
          service_charge: "",
          total_amount: "",
        }));

        setUnits(
          apartmentUnits
        );

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
      },
      [
        apartments,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Unit Change
  |--------------------------------------------------------------------------
  */

  const handleUnitChange =
    useCallback(
      (unitValue) => {
        const unitId =
          getId(unitValue);

        const selectedUnit =
          findById(
            effectiveUnits,
            unitId
          );

        setForm((current) => {
          const next = {
            ...current,
            unit_id:
              unitId,
          };

          const unitApartmentId =
            getId(
              selectedUnit?.apartment_id ??
              selectedUnit?.apartment?.id
            );

          if (unitApartmentId) {
            next.apartment_id =
              unitApartmentId;
          }

          const unitPropertyId =
            getId(
              selectedUnit?.property_id ??
              selectedUnit?.property?.id
            );

          if (unitPropertyId) {
            next.property_id =
              unitPropertyId;
          }

          const hasRent =
            current.rent_amount !== "" &&
            current.rent_amount !== null &&
            current.rent_amount !== undefined;

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

          const tenancyId =
            getId(
              selectedUnit?.tenancy_id ??
              selectedUnit?.active_tenancy_id ??
              selectedUnit?.activeTenancy?.id
            );

          if (
            tenancyId &&
            !current.tenancy_id
          ) {
            next.tenancy_id =
              tenancyId;
          }

          const changed =
            Object.keys(next).some(
              (key) =>
                next[key] !==
                current[key]
            );

          return changed
            ? next
            : current;
        });

        setFieldErrors((current) => {
          if (
            !Object.prototype.hasOwnProperty.call(
              current,
              "unit_id"
            )
          ) {
            return current;
          }

          const next = {
            ...current,
          };

          delete next.unit_id;

          return next;
        });

        setServerError("");
      },
      [
        effectiveUnits,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Generic Field Change
  |--------------------------------------------------------------------------
  */

  const handleChange =
    useCallback(
      (eventOrField, maybeValue) => {
        let name;
        let value;

        if (
          typeof eventOrField ===
          "string"
        ) {
          name =
            eventOrField;

          value =
            maybeValue;
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
          name ===
          "customer_id"
        ) {
          handleCustomerChange(
            value
          );

          return;
        }

        if (
          name ===
          "tenant_id"
        ) {
          handleTenantChange(
            value
          );

          return;
        }

        if (
          name ===
          "tenancy_id"
        ) {
          handleTenancyChange(
            value
          );

          return;
        }

        if (
          name ===
          "property_id"
        ) {
          handlePropertyChange(
            value
          );

          return;
        }

        if (
          name ===
          "apartment_id"
        ) {
          handleApartmentChange(
            value
          );

          return;
        }

        if (
          name ===
          "unit_id"
        ) {
          handleUnitChange(
            value
          );

          return;
        }

        const relationshipFields = [
          "user_id",
        ];

        const normalizedValue =
          relationshipFields.includes(
            name
          )
            ? getId(value)
            : value;

        setForm((current) => {
          if (
            current[name] ===
            normalizedValue
          ) {
            return current;
          }

          return {
            ...current,
            [name]:
              normalizedValue,
          };
        });

        setFieldErrors((current) => {
          if (
            !Object.prototype.hasOwnProperty.call(
              current,
              name
            )
          ) {
            return current;
          }

          const next = {
            ...current,
          };

          delete next[name];

          return next;
        });

        setServerError("");
      },
      [
        handleCustomerChange,
        handleTenantChange,
        handleTenancyChange,
        handlePropertyChange,
        handleApartmentChange,
        handleUnitChange,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Fetch Available Units
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const propertyId =
      getId(
        form.property_id
      );

    const apartmentId =
      getId(
        form.apartment_id
      );

    const startDate =
      form.start_date;

    const endDate =
      form.end_date;

    if (
      !propertyId ||
      !startDate ||
      !endDate
    ) {
      return undefined;
    }

    let mounted = true;

    const loadUnits =
      async () => {
        try {
          const response =
            await getAvailableUnitsRef.current({
              property_id:
                propertyId,

              start_date:
                startDate,

              end_date:
                endDate,

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

          const normalizedUnits =
            normalizeOptions(
              list
            );

          mergeIntoState(
            setUnits,
            normalizedUnits
          );
        } catch (err) {
          if (!mounted) {
            return;
          }

          if (
            import.meta.env.DEV
          ) {
            console.error(
              "[CreateBooking] Failed to load available units:",
              err
            );
          }
        }
      };

    loadUnits();

    return () => {
      mounted = false;
    };
  }, [
    form.property_id,
    form.apartment_id,
    form.start_date,
    form.end_date,
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

    if (
      !getId(
        values.customer_id
      ) &&
      !getId(
        values.user_id
      ) &&
      !getId(
        values.tenant_id
      )
    ) {
      nextErrors.customer_id =
        "Please select a customer, tenant or user.";
    }

    if (
      !getId(
        values.tenant_id
      )
    ) {
      nextErrors.tenant_id =
        "Please select a tenant.";
    }

    if (
      !getId(
        values.tenancy_id
      )
    ) {
      nextErrors.tenancy_id =
        "Please select a tenancy.";
    }

    if (
      !getId(
        values.property_id
      )
    ) {
      nextErrors.property_id =
        "Please select a property.";
    }

    if (
      !getId(
        values.unit_id
      )
    ) {
      nextErrors.unit_id =
        "Please select a unit.";
    }

    if (
      !values.booking_type
    ) {
      nextErrors.booking_type =
        "Please select a booking type.";
    }

    if (
      !values.booking_date
    ) {
      nextErrors.booking_date =
        "Please select the booking date.";
    }

    if (
      !values.start_date
    ) {
      nextErrors.start_date =
        "Please select the start date.";
    }

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

    if (
      values.amount_paid !== "" &&
      values.amount_paid !== null &&
      values.amount_paid !== undefined
    ) {
      const amountPaid =
        Number(
          values.amount_paid
        );

      if (
        !Number.isFinite(
          amountPaid
        ) ||
        amountPaid < 0
      ) {
        nextErrors.amount_paid =
          "Amount paid must be a valid non-negative amount.";
      }
    }

    const financialFields = [
      "rent_amount",
      "deposit_amount",
      "service_charge",
      "booking_fee",
      "discount_amount",
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
          !Number.isFinite(
            number
          ) ||
          number < 0
        ) {
          nextErrors[field] =
            "Amount must be a valid non-negative number.";
        }
      }
    );

    const adults =
      Number(
        values.number_of_adults
      );

    if (
      values.number_of_adults !== "" &&
      (
        !Number.isFinite(adults) ||
        adults < 1
      )
    ) {
      nextErrors.number_of_adults =
        "At least one adult is required.";
    }

    const children =
      Number(
        values.number_of_children
      );

    if (
      values.number_of_children !== "" &&
      (
        !Number.isFinite(children) ||
        children < 0
      )
    ) {
      nextErrors.number_of_children =
        "Children cannot be negative.";
    }

    setFieldErrors(
      nextErrors
    );

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Build Payload
  |--------------------------------------------------------------------------
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
        payload[key] =
          value;
      }
    };

    appendIfValue(
      "user_id",
      getId(
        values.user_id
      )
    );

    appendIfValue(
      "customer_id",
      getId(
        values.customer_id
      )
    );

    appendIfValue(
      "tenant_id",
      getId(
        values.tenant_id
      )
    );

    appendIfValue(
      "tenancy_id",
      getId(
        values.tenancy_id
      )
    );

    appendIfValue(
      "property_id",
      getId(
        values.property_id
      )
    );

    appendIfValue(
      "apartment_id",
      getId(
        values.apartment_id
      )
    );

    appendIfValue(
      "unit_id",
      getId(
        values.unit_id
      )
    );

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
      "check_in_date",
      values.check_in_date ||
      values.start_date
    );

    appendIfValue(
      "check_out_date",
      values.check_out_date ||
      values.end_date
    );

    appendIfValue(
      "rent_amount",
      normalizeAmount(
        values.rent_amount
      )
    );

    appendIfValue(
      "deposit_amount",
      normalizeAmount(
        values.deposit_amount
      )
    );

    appendIfValue(
      "service_charge",
      normalizeAmount(
        values.service_charge
      )
    );

    appendIfValue(
      "booking_fee",
      normalizeAmount(
        values.booking_fee
      )
    );

    appendIfValue(
      "discount_amount",
      normalizeAmount(
        values.discount_amount
      )
    );

    appendIfValue(
      "amount_paid",
      normalizeAmount(
        values.amount_paid
      )
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
      "number_of_adults",
      normalizeGuestCount(
        values.number_of_adults,
        1
      )
    );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | Laravel expects number_of_children to be an integer count.
    |--------------------------------------------------------------------------
    */

    appendIfValue(
      "number_of_children",
      normalizeGuestCount(
        values.number_of_children,
        0
      )
    );

    appendIfValue(
      "special_requests",
      values.special_requests
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

  const handleSubmit =
    async (eventOrValues) => {
      eventOrValues?.preventDefault?.();

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

      const normalizedValues = {
        ...submittedValues,

        user_id:
          getId(
            submittedValues.user_id
          ),

        customer_id:
          getId(
            submittedValues.customer_id
          ),

        tenant_id:
          getId(
            submittedValues.tenant_id
          ),

        tenancy_id:
          getId(
            submittedValues.tenancy_id
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

        if (
          import.meta.env.DEV
        ) {
          console.group(
            "[CreateBooking] Create booking"
          );

          console.log(
            "Form values:",
            normalizedValues
          );

          console.log(
            "API payload:",
            payload
          );

          console.groupEnd();
        }

        const response =
          await addBookingRef.current(
            payload
          );

        const responseData =
          response?.data;

        const message =
          response?.message ||
          responseData?.message ||
          "Booking created successfully.";

        await Swal.fire({
          icon: "success",
          title:
            "Booking Created",
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
          extractValidationErrors(
            err
          );

        setServerError(
          message
        );

        setFieldErrors(
          validationErrors
        );

        if (
          import.meta.env.DEV
        ) {
          console.group(
            "[CreateBooking] Create failed"
          );

          console.error(
            "Error:",
            err
          );

          console.error(
            "Message:",
            message
          );

          console.error(
            "Validation errors:",
            validationErrors
          );

          console.groupEnd();
        }

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

  const handleCancel =
    useCallback(() => {
      if (isCreating) {
        return;
      }

      navigate(
        "/super-admin/bookings"
      );
    }, [
      isCreating,
      navigate,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry =
    async () => {
      if (isCreating) {
        return;
      }

      await loadBookingData();
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

            <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
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
      <BookingHeader
        loading={isCreating}
      />

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
                disabled={
                  isCreating
                }
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />

                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <BookingForm
        mode="create"
        initialValues={
          INITIAL_VALUES
        }
        values={form}
        properties={
          properties
        }
        apartments={
          apartments
        }
        units={
          effectiveUnits
        }
        customers={
          effectiveCustomers
        }
        tenants={
          effectiveTenants
        }
        tenancies={
          effectiveTenancies
        }
        selectedTenant={
          selectedTenant
        }
        customerTenancies={
          customerTenancies
        }
        loadingCustomerRelationship={
          isLoadingRelationship
        }
        loadingCustomerTenancies={
          isLoadingRelationship
        }
        customerRelationshipError={
          customerTenanciesError
        }
        errors={{
          ...(errors || {}),
          ...(fieldErrors || {}),
        }}
        loading={
          Boolean(loading) ||
          loadingData
        }
        submitting={
          isCreating
        }
        loadingUnits={
          isLoadingUnits
        }
        loadingUsers={
          isLoadingUsers
        }
        onChange={
          handleChange
        }
        onSubmit={
          handleSubmit
        }
        onCancel={
          handleCancel
        }
        onCustomerChange={
          handleCustomerChange
        }
        onTenantChange={
          handleTenantChange
        }
        onTenancyChange={
          handleTenancyChange
        }
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