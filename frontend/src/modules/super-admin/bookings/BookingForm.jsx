import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Home,
  Loader2,
  MapPin,
  NotebookPen,
  Save,
  UserRound,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const BOOKING_TYPES = [
  {
    value: "viewing",
    label: "Property Viewing",
  },
  {
    value: "reservation",
    label: "Reservation",
  },
  {
    value: "rental",
    label: "Rental",
  },
];

const BOOKING_SOURCES = [
  {
    value: "website",
    label: "Website",
  },
  {
    value: "walk_in",
    label: "Walk-in",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "referral",
    label: "Referral",
  },
  {
    value: "agent",
    label: "Agent",
  },
  {
    value: "other",
    label: "Other",
  },
];

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "partial",
    label: "Partially Paid",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

const PAYMENT_METHODS = [
  {
    value: "mpesa",
    label: "M-Pesa",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "cheque",
    label: "Cheque",
  },
  {
    value: "online",
    label: "Online",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
|--------------------------------------------------------------------------
| RESPONSE / COLLECTION HELPERS
|--------------------------------------------------------------------------
*/

const unwrapData = (value) => {
  let current = value;

  for (let index = 0; index < 5; index += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      current.data !== undefined &&
      current.data !== current
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
};

const getCollection = (value) => {
  const current = unwrapData(value);

  if (Array.isArray(current)) {
    return current;
  }

  if (!current || typeof current !== "object") {
    return [];
  }

  if (Array.isArray(current.data)) {
    return current.data;
  }

  if (Array.isArray(current.items)) {
    return current.items;
  }

  if (Array.isArray(current.results)) {
    return current.results;
  }

  return [];
};

const getObject = (value) => {
  const current = unwrapData(value);

  if (
    !current ||
    typeof current !== "object" ||
    Array.isArray(current)
  ) {
    return null;
  }

  return current;
};

/*
|--------------------------------------------------------------------------
| ID HELPERS
|--------------------------------------------------------------------------
*/

const normalizeId = (value) => {
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
      "",
    );
  }

  return String(value);
};

const sameId = (first, second) => {
  const firstId = normalizeId(first);
  const secondId = normalizeId(second);

  if (!firstId || !secondId) {
    return false;
  }

  return firstId === secondId;
};

/*
|--------------------------------------------------------------------------
| RELATIONSHIP HELPERS
|--------------------------------------------------------------------------
*/

const getPropertyIdFromApartment = (apartment) =>
  apartment?.property_id ??
  apartment?.propertyId ??
  apartment?.property?.id ??
  apartment?.property?.property_id ??
  "";

const getApartmentIdFromUnit = (unit) =>
  unit?.apartment_id ??
  unit?.apartmentId ??
  unit?.apartment?.id ??
  "";

const getPropertyIdFromUnit = (unit) =>
  unit?.property_id ??
  unit?.propertyId ??
  unit?.property?.id ??
  unit?.apartment?.property_id ??
  unit?.apartment?.propertyId ??
  unit?.apartment?.property?.id ??
  "";

const getPropertyName = (property) =>
  property?.title ||
  property?.name ||
  property?.property_name ||
  property?.slug ||
  `Property #${property?.id ?? "—"}`;

const getApartmentName = (apartment) =>
  apartment?.name ||
  apartment?.title ||
  apartment?.block ||
  apartment?.apartment_name ||
  apartment?.slug ||
  `Apartment #${apartment?.id ?? "—"}`;

const getUnitName = (unit) =>
  unit?.unit_number ||
  unit?.number ||
  unit?.name ||
  unit?.title ||
  unit?.unit_name ||
  `Unit #${unit?.id ?? "—"}`;

const getTenancyPropertyId = (tenancy) =>
  tenancy?.property_id ??
  tenancy?.propertyId ??
  tenancy?.property?.id ??
  tenancy?.property?.property_id ??
  tenancy?.unit?.property_id ??
  tenancy?.unit?.propertyId ??
  tenancy?.unit?.property?.id ??
  tenancy?.apartment?.property_id ??
  tenancy?.apartment?.propertyId ??
  tenancy?.apartment?.property?.id ??
  "";

const getTenancyApartmentId = (tenancy) =>
  tenancy?.apartment_id ??
  tenancy?.apartmentId ??
  tenancy?.apartment?.id ??
  tenancy?.unit?.apartment_id ??
  tenancy?.unit?.apartmentId ??
  tenancy?.unit?.apartment?.id ??
  "";

const getTenancyUnitId = (tenancy) =>
  tenancy?.unit_id ??
  tenancy?.unitId ??
  tenancy?.unit?.id ??
  "";

const getTenancyTenantId = (tenancy) =>
  tenancy?.tenant_id ??
  tenancy?.tenantId ??
  tenancy?.tenant?.id ??
  "";

const getTenantUserId = (tenant) => {
  if (!tenant) {
    return "";
  }

  return (
    tenant?.user_id ??
    tenant?.userId ??
    tenant?.user?.id ??
    tenant?.customer_id ??
    tenant?.customerId ??
    ""
  );
};

const getTenantId = (tenant) => {
  if (!tenant) {
    return "";
  }

  return (
    tenant?.tenant_id ??
    tenant?.id ??
    ""
  );
};

const getTenancyId = (tenancy) => {
  if (!tenancy) {
    return "";
  }

  return (
    tenancy?.tenancy_id ??
    tenancy?.id ??
    ""
  );
};

const getTenantTenancies = (tenant) => {
  if (!tenant) {
    return [];
  }

  return getCollection(
    tenant?.tenancies ??
    tenant?.active_tenancies ??
    tenant?.activeTenancies ??
    [],
  );
};

/*
|--------------------------------------------------------------------------
| USER / CUSTOMER HELPERS
|--------------------------------------------------------------------------
*/

const getCustomerUser = (customer) => {
  if (
    !customer ||
    typeof customer !== "object"
  ) {
    return null;
  }

  return (
    customer?.user ??
    customer?.customer_user ??
    customer?.customer ??
    customer
  );
};

const getUserName = (user) => {
  if (!user) {
    return "";
  }

  const directName =
    user?.name ||
    user?.full_name ||
    user?.fullName;

  if (directName) {
    return directName;
  }

  return [
    user?.first_name,
    user?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
};

const getCustomerUserId = (customer) => {
  if (!customer) {
    return "";
  }

  const user = getCustomerUser(customer);

  return (
    customer?.user_id ??
    customer?.userId ??
    customer?.user?.id ??
    customer?.customer_user?.id ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    ""
  );
};

const getCustomerId = (customer) => {
  if (!customer) {
    return "";
  }

  /*
   * For the booking available-users endpoint:
   *
   * user.id = customer id used by the booking form.
   *
   * For a tenant profile:
   * tenant.user_id = the customer/user account.
   */
  return (
    customer?.customer_id ??
    customer?.customerId ??
    customer?.id ??
    customer?.user?.customer_id ??
    customer?.user?.id ??
    customer?.user_id ??
    customer?.userId ??
    ""
  );
};

const getCustomerLookupId = (customer) =>
  getCustomerUserId(customer) ||
  getCustomerId(customer) ||
  "";

const getCustomerFirstName = (customer) => {
  const user = getCustomerUser(customer);

  return (
    customer?.first_name ??
    customer?.firstName ??
    user?.first_name ??
    user?.firstName ??
    ""
  );
};

const getCustomerLastName = (customer) => {
  const user = getCustomerUser(customer);

  return (
    customer?.last_name ??
    customer?.lastName ??
    user?.last_name ??
    user?.lastName ??
    ""
  );
};

const getCustomerEmail = (customer) => {
  const user = getCustomerUser(customer);

  return (
    customer?.email ??
    user?.email ??
    ""
  );
};

const getCustomerPhone = (customer) => {
  const user = getCustomerUser(customer);

  return (
    customer?.phone ??
    user?.phone ??
    ""
  );
};

const getCustomerName = (customer) => {
  const user = getCustomerUser(customer);

  const name =
    getUserName(user) ||
    getUserName(customer);

  return (
    name ||
    customer?.email ||
    customer?.phone ||
    `Customer #${getCustomerId(customer) || "—"}`
  );
};

/*
|--------------------------------------------------------------------------
| NESTED APARTMENTS
|--------------------------------------------------------------------------
*/

const getNestedApartmentsFromProperties = (
  properties,
) => {
  const propertyList =
    getCollection(properties);

  const result = [];

  propertyList.forEach((property) => {
    if (!property) {
      return;
    }

    const propertyId =
      property?.id ??
      property?.property_id ??
      property?.propertyId;

    const nestedApartments =
      getCollection(
        property?.apartments,
      );

    nestedApartments.forEach(
      (apartment) => {
        if (!apartment) {
          return;
        }

        result.push({
          ...apartment,
          property_id:
            apartment?.property_id ??
            apartment?.propertyId ??
            propertyId,
          property:
            apartment?.property ??
            property,
        });
      },
    );
  });

  return result;
};

/*
|--------------------------------------------------------------------------
| UNIQUE COLLECTION
|--------------------------------------------------------------------------
*/

const getEntityKey = (item) => {
  if (!item || typeof item !== "object") {
    return "";
  }

  return (
    item?.id ??
    item?.property_id ??
    item?.propertyId ??
    item?.apartment_id ??
    item?.apartmentId ??
    item?.unit_id ??
    item?.unitId ??
    item?.tenant_id ??
    item?.tenantId ??
    item?.tenancy_id ??
    item?.tenancyId ??
    item?.customer_id ??
    item?.customerId ??
    item?.user_id ??
    item?.userId ??
    ""
  );
};

const uniqueById = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    if (
      !item ||
      typeof item !== "object"
    ) {
      return false;
    }

    const id = getEntityKey(item);

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      return true;
    }

    const key = String(id);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

/*
|--------------------------------------------------------------------------
| FORMAT HELPERS
|--------------------------------------------------------------------------
*/

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return number.toLocaleString("en-KE");
};

const getUnitPrice = (unit) =>
  unit?.price ??
  unit?.rent ??
  unit?.rent_amount ??
  unit?.monthly_rent ??
  "";

/*
|--------------------------------------------------------------------------
| ERROR HELPERS
|--------------------------------------------------------------------------
*/

const getFieldError = (
  errors,
  name,
) => {
  if (!errors) {
    return "";
  }

  const error = errors?.[name];

  if (Array.isArray(error)) {
    return error.join(" ");
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| FIELD COMPONENTS
|--------------------------------------------------------------------------
*/

const FieldError = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-1 flex items-start gap-1 text-xs text-red-600">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  );
};

const Section = ({
  icon: Icon,
  title,
  description,
  children,
}) => (
  <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-xs leading-5 text-gray-500 sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="p-5 sm:p-6">
      {children}
    </div>
  </section>
);

const InputField = ({
  label,
  name,
  value = "",
  onChange,
  error,
  required = false,
  type = "text",
  placeholder = "",
  min,
  step,
  disabled = false,
  readOnly = false,
}) => {
  const hasError = Boolean(error);

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={hasError}
        className={[
          "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition",
          "placeholder:text-gray-400",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          readOnly && !disabled
            ? "bg-gray-50 text-gray-700"
            : "",
          hasError
            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            : "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
        ].join(" ")}
      />

      <FieldError error={error} />
    </div>
  );
};

const SelectField = ({
  label,
  name,
  value = "",
  onChange,
  options = [],
  error,
  required = false,
  placeholder = "Select an option",
  disabled = false,
}) => {
  const hasError = Boolean(error);

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={hasError}
          className={[
            "w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 outline-none transition",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
          ].join(" ")}
        >
          <option value="">
            {placeholder}
          </option>

          {options.map(
            (option, index) => (
              <option
                key={`${String(
                  option.value,
                )}-${index}`}
                value={option.value}
                disabled={
                  option.disabled
                }
              >
                {option.label}
              </option>
            ),
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      <FieldError error={error} />
    </div>
  );
};

const TextAreaField = ({
  label,
  name,
  value = "",
  onChange,
  error,
  required = false,
  placeholder = "",
  rows = 4,
}) => {
  const hasError = Boolean(error);

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <textarea
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={hasError}
        className={[
          "w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition",
          "placeholder:text-gray-400",
          hasError
            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            : "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
        ].join(" ")}
      />

      <FieldError error={error} />
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const BookingForm = ({
  mode = "create",
  initialValues = {},
  values = {},

  properties = [],
  apartments = [],
  units = [],
  customers = [],
  tenants = [],
  tenancies = [],

  selectedTenant = null,
  customerTenancies = [],
  loadingCustomerRelationship = false,
  loadingCustomerTenancies = false,
  customerRelationshipError = "",

  onCustomerChange,
  onTenantChange,
  onTenancyChange,

  errors = {},

  loading = false,
  submitting = false,
  loadingUnits = false,
  loadingUsers = false,

  onChange,
  onSubmit,
  onCancel,

  onPropertyChange,
  onApartmentChange,
  onUnitChange,
}) => {
  /*
  |--------------------------------------------------------------------------
  | FORM VALUES
  |--------------------------------------------------------------------------
  */

  const form = {
    booking_type: "reservation",
    source: "other",
    payment_status: "pending",
    ...initialValues,
    ...values,
  };

  /*
  |--------------------------------------------------------------------------
  | COLLECTIONS
  |--------------------------------------------------------------------------
  */

  const propertyList = useMemo(
    () => getCollection(properties),
    [properties],
  );

  const explicitApartments =
    useMemo(
      () => getCollection(apartments),
      [apartments],
    );

  const nestedApartments =
    useMemo(
      () =>
        getNestedApartmentsFromProperties(
          propertyList,
        ),
      [propertyList],
    );

  const apartmentList = useMemo(
    () =>
      uniqueById([
        ...explicitApartments,
        ...nestedApartments,
      ]),
    [
      explicitApartments,
      nestedApartments,
    ],
  );

  const unitList = useMemo(
    () => getCollection(units),
    [units],
  );

  const customerList = useMemo(
    () =>
      uniqueById(
        getCollection(customers),
      ),
    [customers],
  );

  const tenantList = useMemo(
    () =>
      uniqueById(
        getCollection(tenants),
      ),
    [tenants],
  );

  /*
  |--------------------------------------------------------------------------
  | SELECTED CUSTOMER
  |--------------------------------------------------------------------------
  */

  const selectedCustomerId =
    normalizeId(
      form.customer_id ||
      form.user_id,
    );

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }

    return (
      customerList.find(
        (customer) =>
          sameId(
            getCustomerId(customer),
            selectedCustomerId,
          ) ||
          sameId(
            getCustomerUserId(customer),
            selectedCustomerId,
          ),
      ) ?? null
    );
  }, [
    customerList,
    selectedCustomerId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RESOLVED TENANT
  |--------------------------------------------------------------------------
  */

  const normalizedSelectedTenant =
    useMemo(
      () => getObject(selectedTenant),
      [selectedTenant],
    );

  const resolvedTenant = useMemo(() => {
    /*
     * Priority 1:
     * Tenant explicitly resolved by useBooking.
     */
    if (normalizedSelectedTenant) {
      return normalizedSelectedTenant;
    }

    /*
     * Priority 2:
     * Existing tenant_id from the booking.
     */
    const tenantId = normalizeId(
      form.tenant_id,
    );

    if (tenantId) {
      const tenant =
        tenantList.find(
          (item) =>
            sameId(
              getTenantId(item),
              tenantId,
            ),
        ) ?? null;

      if (tenant) {
        return tenant;
      }
    }

    /*
     * Priority 3:
     * Match tenant.user_id with selected customer/user.
     */
    const customerUserId =
      normalizeId(
        getCustomerLookupId(
          selectedCustomer,
        ) ||
        form.user_id ||
        form.customer_id,
      );

    if (!customerUserId) {
      return null;
    }

    return (
      tenantList.find(
        (tenant) =>
          sameId(
            getTenantUserId(tenant),
            customerUserId,
          ),
      ) ?? null
    );
  }, [
    normalizedSelectedTenant,
    form.tenant_id,
    form.user_id,
    form.customer_id,
    tenantList,
    selectedCustomer,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER TENANCIES
  |--------------------------------------------------------------------------
  */

  const resolvedCustomerTenancyList =
    useMemo(() => {
      const hookTenancies =
        getCollection(
          customerTenancies,
        );

      const tenantTenancies =
        getTenantTenancies(
          resolvedTenant,
        );

      return uniqueById([
        ...hookTenancies,
        ...tenantTenancies,
      ]);
    }, [
      customerTenancies,
      resolvedTenant,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RELATIONSHIP TENANCY LIST
  |--------------------------------------------------------------------------
  */

  const relationshipTenancyList =
    useMemo(() => {
      const customerId =
        normalizeId(
          form.customer_id ||
          form.user_id,
        );

      /*
       * Once a customer/user is selected,
       * only use that customer's resolved
       * tenancies.
       */
      if (customerId) {
        return resolvedCustomerTenancyList;
      }

      return uniqueById(
        getCollection(tenancies),
      );
    }, [
      form.customer_id,
      form.user_id,
      resolvedCustomerTenancyList,
      tenancies,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FILTER APARTMENTS BY PROPERTY
  |--------------------------------------------------------------------------
  */

  const filteredApartments =
    useMemo(() => {
      const propertyId =
        normalizeId(
          form.property_id,
        );

      if (!propertyId) {
        return [];
      }

      return apartmentList.filter(
        (apartment) =>
          sameId(
            getPropertyIdFromApartment(
              apartment,
            ),
            propertyId,
          ),
      );
    }, [
      apartmentList,
      form.property_id,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FILTER UNITS BY APARTMENT
  |--------------------------------------------------------------------------
  */

  const filteredUnits = useMemo(() => {
    const apartmentId =
      normalizeId(
        form.apartment_id,
      );

    const propertyId =
      normalizeId(
        form.property_id,
      );

    if (!apartmentId) {
      return [];
    }

    return unitList.filter((unit) => {
      const unitApartmentId =
        getApartmentIdFromUnit(unit);

      if (
        unitApartmentId &&
        sameId(
          unitApartmentId,
          apartmentId,
        )
      ) {
        return true;
      }

      /*
       * If the unit has an apartment relation
       * but it does not match the selected
       * apartment, reject it.
       */
      if (unitApartmentId) {
        return false;
      }

      const unitPropertyId =
        getPropertyIdFromUnit(unit);

      if (
        propertyId &&
        unitPropertyId &&
        !sameId(
          unitPropertyId,
          propertyId,
        )
      ) {
        return false;
      }

      return false;
    });
  }, [
    unitList,
    form.apartment_id,
    form.property_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | FILTER TENANCIES
  |--------------------------------------------------------------------------
  */

  const filteredTenancies =
    useMemo(() => {
      const tenantId = normalizeId(
        form.tenant_id,
      );

      const propertyId =
        normalizeId(
          form.property_id,
        );

      const unitId = normalizeId(
        form.unit_id,
      );

      const hasCustomer =
        Boolean(
          normalizeId(
            form.customer_id ||
            form.user_id,
          ),
        );

      return relationshipTenancyList.filter(
        (tenancy) => {
          const tenancyTenantId =
            getTenancyTenantId(
              tenancy,
            );

          const tenancyPropertyId =
            getTenancyPropertyId(
              tenancy,
            );

          const tenancyUnitId =
            getTenancyUnitId(
              tenancy,
            );

          /*
           * Customer-specific tenancies are
           * already resolved for the customer.
           *
           * Do not apply property/unit filtering
           * here because the tenancy itself may
           * be what is going to populate those
           * fields.
           */
          if (hasCustomer) {
            if (
              tenantId &&
              tenancyTenantId &&
              !sameId(
                tenancyTenantId,
                tenantId,
              )
            ) {
              return false;
            }

            return true;
          }

          /*
           * No customer selected:
           * use normal relationship filters.
           */
          if (
            tenantId &&
            tenancyTenantId &&
            !sameId(
              tenancyTenantId,
              tenantId,
            )
          ) {
            return false;
          }

          if (
            propertyId &&
            tenancyPropertyId &&
            !sameId(
              tenancyPropertyId,
              propertyId,
            )
          ) {
            return false;
          }

          if (
            unitId &&
            tenancyUnitId &&
            !sameId(
              tenancyUnitId,
              unitId,
            )
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      relationshipTenancyList,
      form.customer_id,
      form.user_id,
      form.tenant_id,
      form.property_id,
      form.unit_id,
    ]);

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER OPTIONS
  |--------------------------------------------------------------------------
  */

  const customerOptions = useMemo(
    () =>
      customerList
        .map((customer) => {
          /*
           * The booking customer is the user account.
           * Prefer user_id when available, otherwise
           * use the user/customer id.
           */
          const customerId =
            getCustomerUserId(customer) ||
            getCustomerId(customer);

          if (!customerId) {
            return null;
          }

          const email =
            getCustomerEmail(customer);

          return {
            value: String(customerId),
            label:
              getCustomerName(
                customer,
              ) +
              (email
                ? ` — ${email}`
                : ""),
          };
        })
        .filter(Boolean),
    [customerList],
  );

  /*
  |--------------------------------------------------------------------------
  | TENANT OPTIONS
  |--------------------------------------------------------------------------
  */

  const tenantOptions = useMemo(() => {
    const source = uniqueById([
      ...tenantList,
      ...(resolvedTenant
        ? [resolvedTenant]
        : []),
    ]);

    return source
      .map((tenant) => {
        const tenantUser =
          tenant?.user;

        const name =
          getUserName(tenantUser) ||
          getUserName(tenant) ||
          tenant?.tenant_number ||
          `Tenant #${getTenantId(tenant) || "—"}`;

        const tenantId =
          getTenantId(tenant);

        if (!tenantId) {
          return null;
        }

        return {
          value: String(tenantId),
          label: tenant?.tenant_number
            ? `${tenant.tenant_number} — ${name}`
            : name,
        };
      })
      .filter(Boolean);
  }, [
    tenantList,
    resolvedTenant,
  ]);

  /*
  |--------------------------------------------------------------------------
  | TENANCY OPTIONS
  |--------------------------------------------------------------------------
  */

  const tenancyOptions = useMemo(
    () =>
      filteredTenancies
        .map((tenancy) => {
          const tenancyId =
            getTenancyId(tenancy);

          if (!tenancyId) {
            return null;
          }

          const property =
            tenancy?.property;

          const apartment =
            tenancy?.apartment;

          const unit =
            tenancy?.unit;

          const locationParts = [
            property
              ? getPropertyName(property)
              : null,
            apartment
              ? getApartmentName(apartment)
              : null,
            unit
              ? getUnitName(unit)
              : null,
          ].filter(Boolean);

          const status =
            tenancy?.status
              ? ` — ${String(
                tenancy.status,
              )
                .replace(
                  /_/g,
                  " ",
                )
                .replace(
                  /\b\w/g,
                  (char) =>
                    char.toUpperCase(),
                )}`
              : "";

          return {
            value: String(
              tenancyId,
            ),
            label:
              tenancy?.tenancy_number
                ? `${tenancy.tenancy_number}${status}${locationParts.length
                  ? ` — ${locationParts.join(
                    " / ",
                  )}`
                  : ""
                }`
                : `Tenancy #${tenancyId}${locationParts.length
                  ? ` — ${locationParts.join(
                    " / ",
                  )}`
                  : ""
                }`,
          };
        })
        .filter(Boolean),
    [filteredTenancies],
  );

  /*
  |--------------------------------------------------------------------------
  | UNIT OPTIONS
  |--------------------------------------------------------------------------
  */

  const unitOptions = useMemo(
    () =>
      filteredUnits
        .map((unit) => {
          const price =
            getUnitPrice(unit);

          const status =
            unit?.status;

          const normalizedStatus =
            String(
              status || "",
            ).toLowerCase();

          const statusLabel = status
            ? ` — ${String(status)
              .replace(
                /_/g,
                " ",
              )
              .replace(
                /\b\w/g,
                (char) =>
                  char.toUpperCase(),
              )}`
            : "";

          const priceLabel =
            price !== "" &&
              price !== null &&
              price !== undefined
              ? ` — KES ${formatNumber(
                price,
              )}`
              : "";

          const unitId =
            unit?.id ??
            unit?.unit_id ??
            "";

          if (!unitId) {
            return null;
          }

          return {
            value: String(unitId),
            label: `${getUnitName(
              unit,
            )}${statusLabel}${priceLabel}`,
            disabled:
              normalizedStatus ===
              "occupied" ||
              normalizedStatus ===
              "maintenance",
          };
        })
        .filter(Boolean),
    [filteredUnits],
  );

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER SELECTION
  |--------------------------------------------------------------------------
  */

  const handleCustomerSelect = (
    event,
  ) => {
    const customerId =
      event.target.value;

    if (!customerId) {
      const fields = {
        customer_id: "",
        user_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        tenant_id: "",
        tenancy_id: "",
        property_id: "",
        apartment_id: "",
        unit_id: "",
      };

      Object.entries(fields).forEach(
        ([name, value]) => {
          onChange?.({
            target: {
              name,
              value,
            },
          });
        },
      );

      onCustomerChange?.(null);

      return;
    }

    const customer =
      customerList.find(
        (item) =>
          sameId(
            getCustomerUserId(item),
            customerId,
          ) ||
          sameId(
            getCustomerId(item),
            customerId,
          ),
      );

    if (!customer) {
      onChange?.(event);
      onCustomerChange?.(
        customerId,
      );
      return;
    }

    /*
     * The booking customer is the existing
     * user account.
     *
     * available-users response:
     *
     * {
     *   id: 4,
     *   first_name: "...",
     *   roles: [...]
     * }
     *
     * Therefore:
     *
     * user_id = customer.id
     * customer_id = customer.id
     */
    const resolvedUserId =
      getCustomerUserId(customer) ||
      getCustomerId(customer);

    const resolvedCustomerId =
      getCustomerId(customer) ||
      resolvedUserId;

    const fields = {
      customer_id:
        resolvedCustomerId
          ? String(
            resolvedCustomerId,
          )
          : "",

      user_id: resolvedUserId
        ? String(
          resolvedUserId,
        )
        : "",

      first_name:
        getCustomerFirstName(
          customer,
        ),

      last_name:
        getCustomerLastName(
          customer,
        ),

      email:
        getCustomerEmail(
          customer,
        ),

      phone:
        getCustomerPhone(
          customer,
        ),

      /*
       * Changing customer invalidates
       * the previous relationship.
       */
      tenant_id: "",
      tenancy_id: "",
      property_id: "",
      apartment_id: "",
      unit_id: "",
    };

    Object.entries(fields).forEach(
      ([name, value]) => {
        onChange?.({
          target: {
            name,
            value,
          },
        });
      },
    );

    onCustomerChange?.(
      customer,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT SELECTION
  |--------------------------------------------------------------------------
  */

  const handleTenantSelect = (
    event,
  ) => {
    const tenantId =
      event.target.value;

    onChange?.(event);

    /*
     * Tenant change invalidates the
     * selected tenancy/location.
     */
    const clearFields = {
      tenancy_id: "",
      property_id: "",
      apartment_id: "",
      unit_id: "",
    };

    Object.entries(
      clearFields,
    ).forEach(([name, value]) => {
      onChange?.({
        target: {
          name,
          value,
        },
      });
    });

    if (!tenantId) {
      onTenantChange?.(null);
      return;
    }

    const tenant =
      tenantList.find(
        (item) =>
          sameId(
            getTenantId(item),
            tenantId,
          ),
      ) ??
      (sameId(
        getTenantId(
          resolvedTenant,
        ),
        tenantId,
      )
        ? resolvedTenant
        : null);

    onTenantChange?.(tenant);
  };

  /*
  |--------------------------------------------------------------------------
  | TENANCY SELECTION
  |--------------------------------------------------------------------------
  */

  const handleTenancySelect = (
    event,
  ) => {
    const tenancyId =
      event.target.value;

    onChange?.(event);

    if (!tenancyId) {
      onTenancyChange?.(null);
      return;
    }

    /*
     * Only use the resolved customer tenancy
     * collection.
     */
    const tenancy =
      filteredTenancies.find(
        (item) =>
          sameId(
            getTenancyId(item),
            tenancyId,
          ),
      ) ?? null;

    onTenancyChange?.(tenancy);
  };

  /*
  |--------------------------------------------------------------------------
  | AUTO-RESOLVE CUSTOMER
  |--------------------------------------------------------------------------
  */

  const lastResolvedCustomerId =
    useRef("");

  useEffect(() => {
    const customerId =
      normalizeId(
        form.customer_id ||
        form.user_id,
      );

    if (!customerId) {
      lastResolvedCustomerId.current =
        "";
      return;
    }

    if (
      lastResolvedCustomerId.current ===
      customerId
    ) {
      return;
    }

    if (!selectedCustomer) {
      return;
    }

    lastResolvedCustomerId.current =
      customerId;

    onCustomerChange?.(
      selectedCustomer,
    );
  }, [
    form.customer_id,
    form.user_id,
    selectedCustomer,
    onCustomerChange,
  ]);

  /*
  |--------------------------------------------------------------------------
  | APPLY RESOLVED TENANT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!resolvedTenant) {
      return;
    }

    const resolvedTenantId =
      getTenantId(resolvedTenant);

    if (!resolvedTenantId) {
      return;
    }

    const currentTenantId =
      normalizeId(
        form.tenant_id,
      );

    if (
      sameId(
        currentTenantId,
        resolvedTenantId,
      )
    ) {
      return;
    }

    onChange?.({
      target: {
        name: "tenant_id",
        value: String(
          resolvedTenantId,
        ),
      },
    });

    onTenantChange?.(
      resolvedTenant,
    );
  }, [
    resolvedTenant,
    form.tenant_id,
    onChange,
    onTenantChange,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AUTO-SELECT SINGLE TENANCY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const customerId =
      normalizeId(
        form.customer_id ||
        form.user_id,
      );

    if (
      !customerId ||
      resolvedCustomerTenancyList.length !==
      1
    ) {
      return;
    }

    const tenancy =
      resolvedCustomerTenancyList[0];

    const tenancyId =
      getTenancyId(tenancy);

    if (!tenancyId) {
      return;
    }

    const currentTenancyId =
      normalizeId(
        form.tenancy_id,
      );

    if (
      sameId(
        currentTenancyId,
        tenancyId,
      )
    ) {
      return;
    }

    onChange?.({
      target: {
        name: "tenancy_id",
        value: String(
          tenancyId,
        ),
      },
    });

    onTenancyChange?.(tenancy);
  }, [
    form.customer_id,
    form.user_id,
    form.tenancy_id,
    resolvedCustomerTenancyList,
    onChange,
    onTenancyChange,
  ]);

  /*
  |--------------------------------------------------------------------------
  | APPLY SELECTED TENANCY RELATIONSHIP
  |--------------------------------------------------------------------------
  */

  const lastAppliedTenancyId =
    useRef("");

  useEffect(() => {
    const tenancyId =
      normalizeId(
        form.tenancy_id,
      );

    if (!tenancyId) {
      lastAppliedTenancyId.current =
        "";
      return;
    }

    const tenancy =
      relationshipTenancyList.find(
        (item) =>
          sameId(
            getTenancyId(item),
            tenancyId,
          ),
      );

    if (!tenancy) {
      return;
    }

    if (
      lastAppliedTenancyId.current ===
      tenancyId
    ) {
      return;
    }

    lastAppliedTenancyId.current =
      tenancyId;

    /*
     * Resolve property.
     */
    const propertyId =
      getTenancyPropertyId(
        tenancy,
      );

    /*
     * Resolve apartment.
     */
    const apartmentId =
      getTenancyApartmentId(
        tenancy,
      );

    /*
     * Resolve unit.
     */
    const unitId =
      getTenancyUnitId(
        tenancy,
      );

    const relationshipFields = {
      property_id: propertyId,
      apartment_id: apartmentId,
      unit_id: unitId,
    };

    Object.entries(
      relationshipFields,
    ).forEach(
      ([name, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          onChange?.({
            target: {
              name,
              value: String(
                value,
              ),
            },
          });
        }
      },
    );

    /*
     * Populate rent only when empty.
     */
    const tenancyRent =
      tenancy?.rent ??
      tenancy?.rent_amount ??
      tenancy?.monthly_rent ??
      "";

    if (
      tenancyRent !== "" &&
      tenancyRent !== null &&
      tenancyRent !== undefined &&
      (form.rent_amount ===
        undefined ||
        form.rent_amount ===
        null ||
        form.rent_amount === "")
    ) {
      onChange?.({
        target: {
          name: "rent_amount",
          value: String(
            tenancyRent,
          ),
        },
      });
    }

    /*
     * Populate deposit only when empty.
     */
    const tenancyDeposit =
      tenancy?.deposit ??
      tenancy?.deposit_amount ??
      "";

    if (
      tenancyDeposit !== "" &&
      tenancyDeposit !== null &&
      tenancyDeposit !== undefined &&
      (form.deposit_amount ===
        undefined ||
        form.deposit_amount ===
        null ||
        form.deposit_amount === "")
    ) {
      onChange?.({
        target: {
          name: "deposit_amount",
          value: String(
            tenancyDeposit,
          ),
        },
      });
    }

    /*
     * Populate service charge only when empty.
     */
    const tenancyServiceCharge =
      tenancy?.service_charge ??
      tenancy?.service_charge_amount ??
      "";

    if (
      tenancyServiceCharge !== "" &&
      tenancyServiceCharge !== null &&
      tenancyServiceCharge !== undefined &&
      (form.service_charge ===
        undefined ||
        form.service_charge ===
        null ||
        form.service_charge === "")
    ) {
      onChange?.({
        target: {
          name: "service_charge",
          value: String(
            tenancyServiceCharge,
          ),
        },
      });
    }
  }, [
    form.tenancy_id,
    relationshipTenancyList,
    form.rent_amount,
    form.deposit_amount,
    form.service_charge,
    onChange,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AUTO-SUGGEST UNIT FINANCIALS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const selectedUnitId =
      normalizeId(form.unit_id);

    if (!selectedUnitId) {
      return;
    }

    const selectedUnit =
      unitList.find((unit) =>
        sameId(
          unit?.id ??
          unit?.unit_id,
          selectedUnitId,
        ),
      );

    if (!selectedUnit) {
      return;
    }

    const price =
      getUnitPrice(selectedUnit);

    if (
      price === "" ||
      price === null ||
      price === undefined
    ) {
      return;
    }

    if (
      form.rent_amount !==
      undefined &&
      form.rent_amount !== null &&
      form.rent_amount !== ""
    ) {
      return;
    }

    onChange?.({
      target: {
        name: "rent_amount",
        value: String(price),
      },
    });
  }, [
    form.unit_id,
    form.rent_amount,
    unitList,
    onChange,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CALCULATED FINANCIALS
  |--------------------------------------------------------------------------
  |
  | total_amount and balance are calculated values.
  | They must not be written back into the form state because the
  | StoreBookingRequest explicitly prohibits clients from submitting
  | total_amount and balance.
  */

  const calculatedTotal = useMemo(() => {
    const rent = Number(form.rent_amount) || 0;
    const deposit = Number(form.deposit_amount) || 0;
    const service = Number(form.service_charge) || 0;
    const bookingFee = Number(form.booking_fee) || 0;
    const discount = Number(form.discount_amount) || 0;

    const total =
      rent +
      deposit +
      service +
      bookingFee -
      discount;

    return Number.isFinite(total)
      ? Math.max(total, 0)
      : 0;
  }, [
    form.rent_amount,
    form.deposit_amount,
    form.service_charge,
    form.booking_fee,
    form.discount_amount,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PAYMENT BALANCE
  |--------------------------------------------------------------------------
  */

  const calculatedBalance =
    Math.max(
      0,
      calculatedTotal -
      (Number(
        form.amount_paid ??
        form.paid_amount,
      ) || 0),
    );

  /*
  |--------------------------------------------------------------------------
  | HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (
    event,
  ) => {
    onChange?.(event);
  };

  const handlePropertySelect = (
    event,
  ) => {
    if (onPropertyChange) {
      onPropertyChange(
        event.target.value,
      );
      return;
    }

    onChange?.(event);
  };

  const handleApartmentSelect = (
    event,
  ) => {
    if (onApartmentChange) {
      onApartmentChange(
        event.target.value,
      );
      return;
    }

    onChange?.(event);
  };

  const handleUnitSelect = (
    event,
  ) => {
    if (onUnitChange) {
      onUnitChange(
        event.target.value,
      );
      return;
    }

    onChange?.(event);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const formDisabled = Boolean(
    loading || submitting,
  );

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER DISPLAY
  |--------------------------------------------------------------------------
  */

  const customerInformation =
    selectedCustomer
      ? {
        customerId:
          getCustomerId(
            selectedCustomer,
          ),
        userId:
          getCustomerUserId(
            selectedCustomer,
          ) ||
          getCustomerId(
            selectedCustomer,
          ),
        firstName:
          getCustomerFirstName(
            selectedCustomer,
          ),
        lastName:
          getCustomerLastName(
            selectedCustomer,
          ),
        email:
          getCustomerEmail(
            selectedCustomer,
          ),
        phone:
          getCustomerPhone(
            selectedCustomer,
          ),
      }
      : {
        customerId:
          form.customer_id || "",
        userId:
          form.user_id ||
          form.customer_id ||
          "",
        firstName:
          form.first_name || "",
        lastName:
          form.last_name || "",
        email:
          form.email || "",
        phone:
          form.phone || "",
      };

  /*
  |--------------------------------------------------------------------------
  | RELATIONSHIP STATUS
  |--------------------------------------------------------------------------
  */

  const relationshipLoading =
    Boolean(
      loadingCustomerRelationship ||
      loadingCustomerTenancies,
    );

  const customerSelected =
    Boolean(
      normalizeId(
        form.customer_id ||
        form.user_id,
      ),
    );

  const relationshipHasTenancies =
    resolvedCustomerTenancyList.length >
    0;

  const relationshipHasTenant =
    Boolean(resolvedTenant);

  /*
  |--------------------------------------------------------------------------
  | SELECTED RELATIONSHIP OBJECTS
  |--------------------------------------------------------------------------
  */

  const selectedTenancy =
    useMemo(() => {
      const tenancyId =
        normalizeId(
          form.tenancy_id,
        );

      if (!tenancyId) {
        return null;
      }

      return (
        relationshipTenancyList.find(
          (tenancy) =>
            sameId(
              getTenancyId(tenancy),
              tenancyId,
            ),
        ) ?? null
      );
    }, [
      form.tenancy_id,
      relationshipTenancyList,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ================================================================
          CUSTOMER
      ================================================================ */}

      <Section
        icon={UserRound}
        title="Customer Information"
        description="Select a customer to automatically resolve their tenant profile and available tenancies."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            label="Customer"
            name="customer_id"
            value={
              form.customer_id ||
              form.user_id ||
              ""
            }
            onChange={
              handleCustomerSelect
            }
            options={
              customerOptions
            }
            error={getFieldError(
              errors,
              "customer_id",
            )}
            disabled={
              formDisabled ||
              loadingUsers
            }
            placeholder={
              loadingUsers
                ? "Loading customers..."
                : "Select customer (optional)"
            }
          />

          <div>
            <SelectField
              label="Tenant"
              name="tenant_id"
              value={
                form.tenant_id
              }
              onChange={
                handleTenantSelect
              }
              options={
                tenantOptions
              }
              error={getFieldError(
                errors,
                "tenant_id",
              )}
              disabled={
                formDisabled ||
                relationshipLoading
              }
              placeholder={
                relationshipLoading
                  ? "Resolving tenant..."
                  : !customerSelected
                    ? "Select customer first"
                    : relationshipHasTenant
                      ? "Tenant resolved"
                      : "No tenant profile found"
              }
            />

            {relationshipLoading && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading tenant relationship...
              </div>
            )}

            {!relationshipLoading &&
              customerSelected &&
              relationshipHasTenant && (
                <p className="mt-1.5 text-xs text-emerald-600">
                  Tenant{" "}
                  {resolvedTenant?.tenant_number ||
                    `#${getTenantId(
                      resolvedTenant,
                    ) || "—"}`}{" "}
                  resolved successfully.
                </p>
              )}

            {!relationshipLoading &&
              customerSelected &&
              !relationshipHasTenant && (
                <p className="mt-1.5 text-xs text-amber-600">
                  This customer account does
                  not currently have a linked
                  tenant profile.
                </p>
              )}
          </div>

          <div>
            <SelectField
              label="Tenancy"
              name="tenancy_id"
              value={
                form.tenancy_id
              }
              onChange={
                handleTenancySelect
              }
              options={
                tenancyOptions
              }
              error={getFieldError(
                errors,
                "tenancy_id",
              )}
              disabled={
                formDisabled ||
                relationshipLoading ||
                !customerSelected ||
                filteredTenancies.length ===
                0
              }
              placeholder={
                relationshipLoading
                  ? "Loading tenancies..."
                  : !customerSelected
                    ? "Select customer first"
                    : !relationshipHasTenant
                      ? "Tenant profile required"
                      : filteredTenancies.length ===
                        0
                        ? "No tenancies available"
                        : "Select tenancy"
              }
            />

            {loadingCustomerTenancies && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading customer tenancies...
              </div>
            )}

            {!loadingCustomerTenancies &&
              customerSelected &&
              relationshipHasTenancies && (
                <p className="mt-1.5 text-xs text-emerald-600">
                  {
                    resolvedCustomerTenancyList.length
                  }{" "}
                  {resolvedCustomerTenancyList.length ===
                    1
                    ? "tenancy"
                    : "tenancies"}{" "}
                  available for this
                  customer.
                </p>
              )}

            {!loadingCustomerTenancies &&
              customerSelected &&
              relationshipHasTenant &&
              !relationshipHasTenancies && (
                <p className="mt-1.5 text-xs text-gray-500">
                  No tenancy is currently
                  linked to this tenant.
                </p>
              )}
          </div>

          <InputField
            label="User ID"
            name="user_id"
            type="text"
            value={
              customerInformation.userId
            }
            error={getFieldError(
              errors,
              "user_id",
            )}
            placeholder="Automatically populated"
            disabled
            readOnly
          />
        </div>

        {customerRelationshipError && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Customer relationship
                  notice
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  {
                    customerRelationshipError
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Selected Customer Details
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Customer information is
                automatically populated
                from the selected account.
              </p>
            </div>

            {selectedCustomer && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Customer selected
              </span>
            )}
          </div>

          {!selectedCustomer ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center">
              <UserRound className="mx-auto h-6 w-6 text-gray-400" />

              <p className="mt-2 text-sm font-medium text-gray-600">
                No customer selected
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Select a customer above
                to view their information
                and resolve their
                tenancy.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <InputField
                label="Customer ID"
                name="customer_id_display"
                value={
                  customerInformation.customerId
                }
                disabled
                readOnly
              />

              <InputField
                label="First Name"
                name="first_name_display"
                value={
                  customerInformation.firstName
                }
                disabled
                readOnly
              />

              <InputField
                label="Last Name"
                name="last_name_display"
                value={
                  customerInformation.lastName
                }
                disabled
                readOnly
              />

              <InputField
                label="Email"
                name="email_display"
                type="email"
                value={
                  customerInformation.email
                }
                disabled
                readOnly
              />

              <InputField
                label="Phone"
                name="phone_display"
                value={
                  customerInformation.phone
                }
                disabled
                readOnly
              />

              <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3">
                <p className="text-xs font-medium text-gray-500">
                  Account
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {getCustomerName(
                    selectedCustomer,
                  )}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  User ID:{" "}
                  {customerInformation.userId ||
                    "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        {customerSelected && (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                Customer #
                {customerInformation.userId ||
                  customerInformation.customerId ||
                  "—"}
              </span>

              <span className="text-gray-400">
                →
              </span>

              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  relationshipHasTenant
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {relationshipHasTenant
                  ? `Tenant #${getTenantId(
                    resolvedTenant,
                  ) || "—"}`
                  : "Tenant not resolved"}
              </span>

              <span className="text-gray-400">
                →
              </span>

              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  relationshipHasTenancies
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {relationshipHasTenancies
                  ? `${resolvedCustomerTenancyList.length
                  } ${resolvedCustomerTenancyList.length ===
                    1
                    ? "tenancy"
                    : "tenancies"
                  }`
                  : "No tenancy"}
              </span>

              {selectedTenancy && (
                <>
                  <span className="text-gray-400">
                    →
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Tenancy #
                    {getTenancyId(
                      selectedTenancy,
                    ) || "—"}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ================================================================
          PROPERTY
      ================================================================ */}

      <Section
        icon={Home}
        title="Property & Unit"
        description="Select the property, apartment and available unit. These values can be populated automatically from the selected tenancy."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            label="Property"
            name="property_id"
            value={
              form.property_id
            }
            onChange={
              handlePropertySelect
            }
            error={getFieldError(
              errors,
              "property_id",
            )}
            required
            disabled={formDisabled}
            placeholder="Select property"
            options={propertyList.map(
              (property) => ({
                value: String(
                  property?.id ??
                  property?.property_id ??
                  "",
                ),
                label:
                  getPropertyName(
                    property,
                  ),
              }),
            )}
          />

          <SelectField
            label="Apartment"
            name="apartment_id"
            value={
              form.apartment_id
            }
            onChange={
              handleApartmentSelect
            }
            error={getFieldError(
              errors,
              "apartment_id",
            )}
            disabled={
              formDisabled ||
              !form.property_id
            }
            placeholder={
              !form.property_id
                ? "Select property first"
                : filteredApartments.length ===
                  0
                  ? "No apartments available"
                  : "Select apartment"
            }
            options={filteredApartments.map(
              (apartment) => ({
                value: String(
                  apartment?.id ??
                  apartment?.apartment_id ??
                  "",
                ),
                label:
                  getApartmentName(
                    apartment,
                  ),
              }),
            )}
          />

          <div className="md:col-span-2">
            <SelectField
              label="Unit"
              name="unit_id"
              value={form.unit_id}
              onChange={
                handleUnitSelect
              }
              error={getFieldError(
                errors,
                "unit_id",
              )}
              required
              disabled={
                formDisabled ||
                !form.apartment_id ||
                loadingUnits
              }
              placeholder={
                loadingUnits
                  ? "Loading available units..."
                  : !form.apartment_id
                    ? "Select apartment first"
                    : unitOptions.length ===
                      0
                      ? "No available units"
                      : "Select unit"
              }
              options={unitOptions}
            />
          </div>
        </div>

        {form.unit_id && (
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-indigo-900">
                  Selected property unit
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-700">
                  {(() => {
                    const selectedProperty =
                      propertyList.find(
                        (property) =>
                          sameId(
                            property?.id ??
                            property?.property_id,
                            form.property_id,
                          ),
                      );

                    const selectedApartment =
                      filteredApartments.find(
                        (apartment) =>
                          sameId(
                            apartment?.id ??
                            apartment?.apartment_id,
                            form.apartment_id,
                          ),
                      );

                    const selectedUnit =
                      filteredUnits.find(
                        (unit) =>
                          sameId(
                            unit?.id ??
                            unit?.unit_id,
                            form.unit_id,
                          ),
                      );

                    return [
                      selectedProperty
                        ? getPropertyName(
                          selectedProperty,
                        )
                        : null,
                      selectedApartment
                        ? getApartmentName(
                          selectedApartment,
                        )
                        : null,
                      selectedUnit
                        ? getUnitName(
                          selectedUnit,
                        )
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" / ");
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ================================================================
          BOOKING DETAILS
      ================================================================ */}

      <Section
        icon={CalendarDays}
        title="Booking Details"
        description="Define the type, source and booking dates."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            label="Booking Type"
            name="booking_type"
            value={
              form.booking_type
            }
            onChange={
              handleInputChange
            }
            options={
              BOOKING_TYPES
            }
            error={getFieldError(
              errors,
              "booking_type",
            )}
            required
            disabled={formDisabled}
            placeholder="Select booking type"
          />

          <SelectField
            label="Booking Source"
            name="source"
            value={form.source}
            onChange={
              handleInputChange
            }
            options={
              BOOKING_SOURCES
            }
            error={getFieldError(
              errors,
              "source",
            )}
            required
            disabled={formDisabled}
            placeholder="Select source"
          />

          <InputField
            label="Booking Date"
            name="booking_date"
            type="date"
            value={
              form.booking_date
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "booking_date",
            )}
            disabled={formDisabled}
          />

          <InputField
            label="Start Date"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "start_date",
            )}
            disabled={formDisabled}
          />

          <InputField
            label="End Date"
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "end_date",
            )}
            disabled={formDisabled}
          />

          <InputField
            label="Check-in"
            name="check_in_date"
            type="date"
            value={
              form.check_in_date
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "check_in_date",
            )}
            disabled={formDisabled}
          />

          <InputField
            label="Check-out"
            name="check_out_date"
            type="date"
            value={
              form.check_out_date
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "check_out_date",
            )}
            disabled={formDisabled}
          />
        </div>
      </Section>

      {/* ================================================================
          FINANCIALS
      ================================================================ */}

      <Section
        icon={CircleDollarSign}
        title="Financial Information"
        description="Enter the booking charges. The total amount is calculated automatically."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Rent Amount"
            name="rent_amount"
            type="number"
            min="0"
            step="0.01"
            value={
              form.rent_amount
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "rent_amount",
            )}
            placeholder="0.00"
            disabled={formDisabled}
          />

          <InputField
            label="Deposit Amount"
            name="deposit_amount"
            type="number"
            min="0"
            step="0.01"
            value={
              form.deposit_amount
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "deposit_amount",
            )}
            placeholder="0.00"
            disabled={formDisabled}
          />

          <InputField
            label="Service Charge"
            name="service_charge"
            type="number"
            min="0"
            step="0.01"
            value={
              form.service_charge
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "service_charge",
            )}
            placeholder="0.00"
            disabled={formDisabled}
          />

          <InputField
            label="Booking Fee"
            name="booking_fee"
            type="number"
            min="0"
            step="0.01"
            value={
              form.booking_fee
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "booking_fee",
            )}
            placeholder="0.00"
            disabled={formDisabled}
          />

          <InputField
            label="Discount"
            name="discount_amount"
            type="number"
            min="0"
            step="0.01"
            value={
              form.discount_amount
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "discount_amount",
            )}
            placeholder="0.00"
            disabled={formDisabled}
          />

          <InputField
            label="Total Amount"
            name="total_amount_display"
            type="number"
            value={
              calculatedTotal > 0
                ? calculatedTotal
                : form.total_amount ??
                ""
            }
            error={getFieldError(
              errors,
              "total_amount",
            )}
            placeholder="Calculated automatically"
            disabled
            readOnly
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Total Booking Value
            </p>

            <p className="mt-1 text-lg font-bold text-gray-900">
              KES{" "}
              {formatNumber(
                calculatedTotal > 0
                  ? calculatedTotal
                  : form.total_amount || 0,
              ) || "0"}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">
              Amount Paid
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-800">
              KES{" "}
              {formatNumber(
                form.amount_paid ??
                form.paid_amount ??
                0,
              ) || "0"}
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-700">
              Outstanding
            </p>

            <p className="mt-1 text-lg font-bold text-amber-800">
              KES{" "}
              {formatNumber(
                calculatedBalance,
              ) || "0"}
            </p>
          </div>
        </div>
      </Section>

      {/* ================================================================
          PAYMENT
      ================================================================ */}

      <Section
        icon={Wallet}
        title="Payment Information"
        description="Record the payment status, method and transaction reference."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SelectField
            label="Payment Status"
            name="payment_status"
            value={
              form.payment_status
            }
            onChange={
              handleInputChange
            }
            options={
              PAYMENT_STATUSES
            }
            error={getFieldError(
              errors,
              "payment_status",
            )}
            disabled={formDisabled}
            placeholder="Select payment status"
          />

          <SelectField
            label="Payment Method"
            name="payment_method"
            value={
              form.payment_method
            }
            onChange={
              handleInputChange
            }
            options={
              PAYMENT_METHODS
            }
            error={getFieldError(
              errors,
              "payment_method",
            )}
            disabled={formDisabled}
            placeholder="Select payment method"
          />

          <InputField
            label="Amount Paid"
            name="amount_paid"
            type="number"
            min="0"
            step="0.01"
            value={
              form.amount_paid ??
              form.paid_amount ??
              ""
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "amount_paid",
            )}
            placeholder="0.00"
            disabled={formDisabled}
          />

          <InputField
            label="Payment Reference"
            name="payment_reference"
            type="text"
            value={
              form.payment_reference
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "payment_reference",
            )}
            placeholder="e.g. MPESA-ABC123"
            disabled={formDisabled}
          />
        </div>
      </Section>

      {/* ================================================================
          OCCUPANCY
      ================================================================ */}

      <Section
        icon={UsersRound}
        title="Occupancy"
        description="Specify the number of adults and children included in the booking."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Adults"
            name="number_of_adults"
            type="number"
            min="0"
            step="1"
            value={
              form.number_of_adults ??
              form.adults ??
              ""
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "number_of_adults",
            )}
            disabled={formDisabled}
          />

          <InputField
            label="Children"
            name="number_of_children"
            type="number"
            min="0"
            step="1"
            value={
              form.number_of_children ??
              form.children ??
              ""
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "number_of_children",
            )}
            disabled={formDisabled}
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">
              Total Guests
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {(Number(
                form.number_of_adults ??
                form.adults,
              ) || 0) +
                (Number(
                  form.number_of_children ??
                  form.children,
                ) || 0)}
            </p>
          </div>
        </div>
      </Section>

      {/* ================================================================
          NOTES
      ================================================================ */}

      <Section
        icon={NotebookPen}
        title="Additional Information"
        description="Add special requests or internal notes for this booking."
      >
        <div className="grid grid-cols-1 gap-5">
          <TextAreaField
            label="Special Request"
            name="special_requests"
            value={
              form.special_requests ??
              form.special_request ??
              ""
            }
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "special_requests",
            )}
            placeholder="Enter any special request from the customer..."
            rows={4}
          />

          <TextAreaField
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={
              handleInputChange
            }
            error={getFieldError(
              errors,
              "notes",
            )}
            placeholder="Add internal notes about this booking..."
            rows={4}
          />
        </div>
      </Section>

      {/* ================================================================
          FORM ERROR
      ================================================================ */}

      {Object.keys(errors || {})
        .length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h3 className="text-sm font-semibold text-red-900">
                  Please correct the
                  highlighted fields
                </h3>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  Some booking information
                  could not be validated.
                  Review the fields above
                  and try again.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* ================================================================
          ACTIONS
      ================================================================ */}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={formDisabled}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={formDisabled}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                {mode === "edit"
                  ? "Updating..."
                  : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                {mode === "edit"
                  ? "Update Booking"
                  : "Create Booking"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BookingForm;