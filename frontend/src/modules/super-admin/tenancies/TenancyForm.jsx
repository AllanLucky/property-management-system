import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Home,
  Loader2,
  Save,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| BACKEND CONSTANTS
|--------------------------------------------------------------------------
|
| These values MUST match Laravel Tenancy::STATUSES.
|
*/

const TENANCY_STATUSES = [
  "active",
  "pending",
  "expired",
  "terminated",
  "cancelled",
];

const PAYMENT_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

/*
|--------------------------------------------------------------------------
| TENANT ASSIGNMENT RULE
|--------------------------------------------------------------------------
|
| A tenant cannot be assigned to another tenancy when they already have
| an active or pending tenancy.
|
| Expired, terminated and cancelled tenancies do not block reassignment.
|
| The backend remains the source of truth. This helper is only for the
| frontend dropdown UX.
|
*/

const BLOCKING_TENANCY_STATUSES = [
  "active",
  "pending",
];

/*
|--------------------------------------------------------------------------
| DEFAULT FORM
|--------------------------------------------------------------------------
*/

const DEFAULT_FORM = {
  property_id: "",
  apartment_id: "",
  unit_id: "",
  tenant_id: "",

  tenancy_number: "",

  start_date: "",
  end_date: "",

  move_in_date: "",
  move_out_date: "",

  rent_amount: "",
  deposit_amount: "",
  service_charge: "",
  late_fee: "",

  payment_frequency: "monthly",
  due_day: "",

  status: "active",
  is_active: true,

  agreement_file: "",
  agreement_public_id: "",

  notes: "",
};

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  return Number.isNaN(number) ? "" : number;
};

const normalizeId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (
      value.id !== undefined &&
      value.id !== null &&
      value.id !== ""
    ) {
      return normalizeId(value.id);
    }

    if (
      value.value !== undefined &&
      value.value !== null &&
      value.value !== ""
    ) {
      return normalizeId(value.value);
    }

    if (value.data) {
      const nested = normalizeId(value.data);

      if (nested) {
        return nested;
      }
    }

    const possibleKeys = [
      "property_id",
      "propertyId",
      "apartment_id",
      "apartmentId",
      "unit_id",
      "unitId",
      "tenant_id",
      "tenantId",
      "_id",
    ];

    for (const key of possibleKeys) {
      if (
        value[key] !== undefined &&
        value[key] !== null &&
        value[key] !== ""
      ) {
        const result = normalizeId(value[key]);

        if (result) {
          return result;
        }
      }
    }

    return "";
  }

  return String(value).trim();
};

const sameId = (first, second) => {
  const firstId = normalizeId(first);
  const secondId = normalizeId(second);

  if (!firstId || !secondId) {
    return false;
  }

  return String(firstId) === String(secondId);
};

/*
|--------------------------------------------------------------------------
| DATE
|--------------------------------------------------------------------------
*/

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  const stringValue = String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {
    return stringValue;
  }

  const directMatch =
    stringValue.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  if (directMatch) {
    return directMatch[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
};

/*
|--------------------------------------------------------------------------
| PAYMENT FREQUENCY
|--------------------------------------------------------------------------
*/

const normalizePaymentFrequency = (
  value
) => {
  const normalized =
    String(value ?? "")
      .trim()
      .toLowerCase();

  if (normalized === "annual") {
    return "yearly";
  }

  if (normalized === "biannual") {
    return "quarterly";
  }

  return PAYMENT_FREQUENCIES.includes(
    normalized
  )
    ? normalized
    : "monthly";
};

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const normalizeStatus = (value) => {
  let normalized = value;

  if (
    value &&
    typeof value === "object"
  ) {
    normalized =
      value.value ??
      value.name ??
      value.status ??
      value.data ??
      "";
  }

  normalized = String(
    normalized ?? ""
  )
    .trim()
    .toLowerCase();

  /*
  | Old frontend value.
  */

  if (normalized === "inactive") {
    return "terminated";
  }

  if (
    TENANCY_STATUSES.includes(
      normalized
    )
  ) {
    return normalized;
  }

  return "active";
};

/*
|--------------------------------------------------------------------------
| BOOLEAN
|--------------------------------------------------------------------------
*/

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return false;
  }

  return fallback;
};

/*
|--------------------------------------------------------------------------
| VALUE HELPER
|--------------------------------------------------------------------------
*/

const getValue = (
  source,
  ...keys
) => {
  if (
    !source ||
    typeof source !== "object"
  ) {
    return "";
  }

  for (const key of keys) {
    if (
      source[key] !== undefined &&
      source[key] !== null
    ) {
      return source[key];
    }
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| COLLECTION NORMALIZER
|--------------------------------------------------------------------------
*/

const getCollection = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [];
  }

  if (Array.isArray(value.data)) {
    return value.data;
  }

  if (Array.isArray(value.items)) {
    return value.items;
  }

  if (Array.isArray(value.results)) {
    return value.results;
  }

  if (
    value.data &&
    typeof value.data === "object"
  ) {
    if (
      Array.isArray(
        value.data.data
      )
    ) {
      return value.data.data;
    }

    if (
      Array.isArray(
        value.data.items
      )
    ) {
      return value.data.items;
    }

    if (
      Array.isArray(
        value.data.results
      )
    ) {
      return value.data.results;
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| UNIQUE COLLECTION
|--------------------------------------------------------------------------
*/

const uniqueById = (
  collection
) => {
  const list =
    getCollection(collection);

  const seen = new Set();

  return list.filter(
    (item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return false;
      }

      const id =
        normalizeId(
          item.id ??
          item.value ??
          item._id
        );

      if (!id) {
        return true;
      }

      if (seen.has(id)) {
        return false;
      }

      seen.add(id);

      return true;
    }
  );
};

/*
|--------------------------------------------------------------------------
| TENANT ASSIGNMENT HELPERS
|--------------------------------------------------------------------------
*/

const getTenantBlockingStatus = (
  tenant
) => {
  if (
    !tenant ||
    typeof tenant !== "object"
  ) {
    return false;
  }

  /*
  | Backend explicit flag.
  */

  if (
    typeof tenant.blocks_tenant_assignment ===
    "boolean"
  ) {
    return tenant.blocks_tenant_assignment;
  }

  /*
  | Backend assignment status.
  */

  if (
    typeof tenant.tenant_assignment_status ===
    "string"
  ) {
    return (
      tenant.tenant_assignment_status
        .trim()
        .toLowerCase() ===
      "blocked"
    );
  }

  /*
  | Backend counts.
  */

  const activeCount =
    Number(
      tenant.active_tenancy_count ??
      0
    );

  const pendingCount =
    Number(
      tenant.pending_tenancy_count ??
      0
    );

  if (
    activeCount > 0 ||
    pendingCount > 0
  ) {
    return true;
  }

  /*
  | Possible current tenancy structure.
  */

  const currentTenancy =
    tenant?.current_tenancy ??
    tenant?.currentTenancy;

  if (
    currentTenancy &&
    typeof currentTenancy ===
      "object"
  ) {
    const currentStatus =
      normalizeStatus(
        currentTenancy.status
      );

    if (
      BLOCKING_TENANCY_STATUSES.includes(
        currentStatus
      ) &&
      normalizeBoolean(
        currentTenancy.is_active,
        true
      )
    ) {
      return true;
    }
  }

  /*
  | Possible nested tenancies collection.
  */

  const tenantTenancies =
    getCollection(
      tenant?.tenancies
    );

  if (
    tenantTenancies.some(
      (tenancy) => {
        if (
          !tenancy ||
          typeof tenancy !==
            "object"
        ) {
          return false;
        }

        const status =
          normalizeStatus(
            tenancy.status
          );

        return (
          BLOCKING_TENANCY_STATUSES.includes(
            status
          ) &&
          normalizeBoolean(
            tenancy.is_active,
            true
          )
        );
      }
    )
  ) {
    return true;
  }

  return false;
};

const isTenantBlocked = (
  tenant
) =>
  getTenantBlockingStatus(
    tenant
  );

/*
|--------------------------------------------------------------------------
| TENANT ID
|--------------------------------------------------------------------------
*/

const getTenantId = (
  tenant
) => {
  return normalizeId(
    tenant?.id ??
    tenant?.tenant_id ??
    tenant?.tenantId
  );
};

/*
|--------------------------------------------------------------------------
| APARTMENTS FROM PROPERTIES
|--------------------------------------------------------------------------
*/

const getApartmentsFromProperties = (
  properties
) => {
  const propertyList =
    getCollection(properties);

  const result = [];

  for (const property of propertyList) {
    if (
      !property ||
      typeof property !==
        "object"
    ) {
      continue;
    }

    const propertyId =
      normalizeId(
        property?.id ??
        property?.property_id ??
        property?.propertyId
      );

    const nestedApartments =
      getCollection(
        property?.apartments
      );

    for (const apartment of nestedApartments) {
      if (
        !apartment ||
        typeof apartment !==
          "object"
      ) {
        continue;
      }

      result.push({
        ...apartment,

        property_id:
          apartment?.property_id ??
          apartment?.propertyId ??
          propertyId,
      });
    }
  }

  return result;
};

const mergeUniqueApartments = (
  explicitApartments,
  propertyApartments
) => {
  const merged = [
    ...getCollection(
      explicitApartments
    ),
    ...propertyApartments,
  ];

  const seen = new Set();

  return merged.filter(
    (apartment) => {
      if (
        !apartment ||
        typeof apartment !==
          "object"
      ) {
        return false;
      }

      const id = normalizeId(
        apartment?.id ??
        apartment?.apartment_id ??
        apartment?.apartmentId
      );

      if (!id) {
        return true;
      }

      if (seen.has(id)) {
        return false;
      }

      seen.add(id);

      return true;
    }
  );
};

/*
|--------------------------------------------------------------------------
| ENTITY ID
|--------------------------------------------------------------------------
*/

const getEntityId = (
  entity,
  ...keys
) => {
  if (!entity) {
    return "";
  }

  if (
    typeof entity !== "object"
  ) {
    return normalizeId(entity);
  }

  for (const key of keys) {
    const value =
      entity[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const id =
        normalizeId(value);

      if (id) {
        return id;
      }
    }
  }

  if (entity.data) {
    const nestedId =
      getEntityId(
        entity.data,
        ...keys
      );

    if (nestedId) {
      return nestedId;
    }
  }

  if (
    entity.id !== undefined &&
    entity.id !== null
  ) {
    return normalizeId(
      entity.id
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| APARTMENT -> PROPERTY
|--------------------------------------------------------------------------
*/

const getPropertyIdFromApartment = (
  apartment
) => {
  if (!apartment) {
    return "";
  }

  const directId =
    getEntityId(
      apartment,
      "property_id",
      "propertyId"
    );

  if (directId) {
    return directId;
  }

  const nestedPropertyId =
    getEntityId(
      apartment?.property,
      "id",
      "property_id",
      "propertyId"
    );

  if (nestedPropertyId) {
    return nestedPropertyId;
  }

  if (apartment.data) {
    return getPropertyIdFromApartment(
      apartment.data
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| UNIT -> APARTMENT
|--------------------------------------------------------------------------
*/

const getApartmentIdFromUnit = (
  unit
) => {
  if (!unit) {
    return "";
  }

  const directId =
    getEntityId(
      unit,
      "apartment_id",
      "apartmentId"
    );

  if (directId) {
    return directId;
  }

  const nestedId =
    getEntityId(
      unit?.apartment,
      "id",
      "apartment_id",
      "apartmentId"
    );

  if (nestedId) {
    return nestedId;
  }

  if (unit.data) {
    return getApartmentIdFromUnit(
      unit.data
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| NORMALIZE TENANCY FOR EDIT
|--------------------------------------------------------------------------
*/

const normalizeTenancy = (
  tenancy = {}
) => {
  const propertyValue =
    getValue(
      tenancy,
      "property_id",
      "propertyId"
    ) ||
    tenancy?.property;

  const apartmentValue =
    getValue(
      tenancy,
      "apartment_id",
      "apartmentId"
    ) ||
    tenancy?.apartment;

  const unitValue =
    getValue(
      tenancy,
      "unit_id",
      "unitId"
    ) ||
    tenancy?.unit;

  const tenantValue =
    getValue(
      tenancy,
      "tenant_id",
      "tenantId"
    ) ||
    tenancy?.tenant;

  const statusValue =
    getValue(
      tenancy,
      "status",
      "tenancy_status"
    );

  const isActiveValue =
    getValue(
      tenancy,
      "is_active",
      "isActive"
    );

  const normalizedStatus =
    normalizeStatus(
      statusValue
    );

  return {
    property_id:
      normalizeId(
        propertyValue
      ),

    apartment_id:
      normalizeId(
        apartmentValue
      ),

    unit_id:
      normalizeId(
        unitValue
      ),

    tenant_id:
      normalizeId(
        tenantValue
      ),

    tenancy_number:
      normalizeString(
        getValue(
          tenancy,
          "tenancy_number",
          "tenancyNumber",
          "number"
        )
      ),

    start_date:
      formatDateForInput(
        getValue(
          tenancy,
          "start_date",
          "startDate"
        )
      ),

    end_date:
      formatDateForInput(
        getValue(
          tenancy,
          "end_date",
          "endDate"
        )
      ),

    move_in_date:
      formatDateForInput(
        getValue(
          tenancy,
          "move_in_date",
          "moveInDate"
        )
      ),

    move_out_date:
      formatDateForInput(
        getValue(
          tenancy,
          "move_out_date",
          "moveOutDate"
        )
      ),

    rent_amount:
      normalizeNumber(
        getValue(
          tenancy,
          "rent_amount",
          "rentAmount",
          "rent"
        )
      ),

    deposit_amount:
      normalizeNumber(
        getValue(
          tenancy,
          "deposit_amount",
          "depositAmount",
          "deposit"
        )
      ),

    service_charge:
      normalizeNumber(
        getValue(
          tenancy,
          "service_charge",
          "serviceCharge"
        )
      ),

    late_fee:
      normalizeNumber(
        getValue(
          tenancy,
          "late_fee",
          "lateFee"
        )
      ),

    payment_frequency:
      normalizePaymentFrequency(
        getValue(
          tenancy,
          "payment_frequency",
          "paymentFrequency",
          "frequency"
        )
      ),

    due_day:
      normalizeNumber(
        getValue(
          tenancy,
          "due_day",
          "dueDay"
        )
      ),

    status:
      normalizedStatus,

    is_active:
      normalizeBoolean(
        isActiveValue,
        normalizedStatus ===
          "active"
      ),

    agreement_file:
      normalizeString(
        getValue(
          tenancy,
          "agreement_file",
          "agreementFile"
        )
      ),

    agreement_public_id:
      normalizeString(
        getValue(
          tenancy,
          "agreement_public_id",
          "agreementPublicId"
        )
      ),

    notes:
      normalizeString(
        getValue(
          tenancy,
          "notes",
          "description"
        )
      ),
  };
};

/*
|--------------------------------------------------------------------------
| INITIAL FORM
|--------------------------------------------------------------------------
*/

const buildInitialForm = (
  tenancy,
  isEdit,
  initialValues
) => {
  const normalized =
    isEdit
      ? normalizeTenancy(
        tenancy
      )
      : {};

  const merged = {
    ...DEFAULT_FORM,
    ...normalized,
    ...(initialValues || {}),
  };

  /*
  | Make sure IDs are normalized.
  */

  merged.property_id =
    normalizeId(
      merged.property_id
    );

  merged.apartment_id =
    normalizeId(
      merged.apartment_id
    );

  merged.unit_id =
    normalizeId(
      merged.unit_id
    );

  merged.tenant_id =
    normalizeId(
      merged.tenant_id
    );

  /*
  | Status.
  */

  merged.status =
    normalizeStatus(
      merged.status
    );

  /*
  | Payment frequency.
  */

  merged.payment_frequency =
    normalizePaymentFrequency(
      merged.payment_frequency
    );

  /*
  | Dates.
  */

  merged.start_date =
    formatDateForInput(
      merged.start_date
    );

  merged.end_date =
    formatDateForInput(
      merged.end_date
    );

  merged.move_in_date =
    formatDateForInput(
      merged.move_in_date
    );

  merged.move_out_date =
    formatDateForInput(
      merged.move_out_date
    );

  /*
  | Keep is_active consistent with status.
  */

  if (
    merged.status !== "active"
  ) {
    merged.is_active = false;
  } else {
    merged.is_active =
      normalizeBoolean(
        merged.is_active,
        true
      );
  }

  return merged;
};

/*
|--------------------------------------------------------------------------
| DISPLAY HELPERS
|--------------------------------------------------------------------------
*/

const getPropertyName = (
  property
) => {
  return (
    property?.name ||
    property?.property_name ||
    property?.propertyName ||
    property?.title ||
    property?.code ||
    property?.property_number ||
    property?.propertyNumber ||
    `Property #${property?.id ?? ""}`
  );
};

const getApartmentName = (
  apartment
) => {
  return (
    apartment?.name ||
    apartment?.apartment_name ||
    apartment?.apartmentName ||
    apartment?.title ||
    apartment?.number ||
    apartment?.code ||
    apartment?.apartment_number ||
    apartment?.apartmentNumber ||
    `Apartment #${apartment?.id ?? ""}`
  );
};

const getUnitName = (
  unit
) => {
  return (
    unit?.name ||
    unit?.unit_name ||
    unit?.unitName ||
    unit?.unit_number ||
    unit?.unitNumber ||
    unit?.number ||
    unit?.code ||
    `Unit #${unit?.id ?? ""}`
  );
};

const getTenantName = (
  tenant
) => {
  if (!tenant) {
    return "Tenant";
  }

  if (
    tenant?.full_name
  ) {
    return String(
      tenant.full_name
    ).trim();
  }

  if (
    tenant?.fullName
  ) {
    return String(
      tenant.fullName
    ).trim();
  }

  const firstName =
    normalizeString(
      tenant?.first_name ??
      tenant?.firstName
    );

  const lastName =
    normalizeString(
      tenant?.last_name ??
      tenant?.lastName
    );

  const otherNames =
    normalizeString(
      tenant?.other_names ??
      tenant?.otherNames ??
      tenant?.other_name
    );

  /*
  | Prefer the backend's normal name ordering:
  |
  | First Name + Last Name + Other Names
  */

  const fullName = [
    firstName,
    lastName,
    otherNames,
  ]
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  return (
    normalizeString(
      tenant?.name
    ) ||
    normalizeString(
      tenant?.email
    ) ||
    normalizeString(
      tenant?.phone
    ) ||
    normalizeString(
      tenant?.tenant_number
    ) ||
    `Tenant #${tenant?.id ?? ""}`
  );
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const TenancyForm = ({
  tenancy = null,

  mode = "create",

  loading = false,

  submitting = false,

  error = null,

  initialValues = {},

  properties = [],

  apartments = [],

  units = [],

  tenants = [],

  onSubmit,

  onCancel,
}) => {
  const isEdit =
    mode === "edit" ||
    Boolean(tenancy?.id);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [form, setForm] =
    useState(() =>
      buildInitialForm(
        tenancy,
        isEdit,
        initialValues
      )
    );

  const [errors, setErrors] =
    useState({});

  const [
    serverError,
    setServerError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | SYNCHRONIZE EDIT DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isEdit || !tenancy) {
      return;
    }

    setForm(
      buildInitialForm(
        tenancy,
        true,
        initialValues
      )
    );

    setErrors({});
    setServerError("");
  }, [
    tenancy,
    isEdit,
    initialValues,
  ]);

  /*
  |--------------------------------------------------------------------------
  | COLLECTIONS
  |--------------------------------------------------------------------------
  */

  const propertyList =
    useMemo(
      () =>
        uniqueById(
          properties
        ),
      [properties]
    );

  const apartmentList =
    useMemo(() => {
      const explicitApartments =
        getCollection(
          apartments
        );

      const nestedApartments =
        getApartmentsFromProperties(
          propertyList
        );

      return mergeUniqueApartments(
        explicitApartments,
        nestedApartments
      );
    }, [
      apartments,
      propertyList,
    ]);

  const unitList =
    useMemo(
      () =>
        uniqueById(
          units
        ),
      [units]
    );

  const tenantList =
    useMemo(
      () =>
        uniqueById(
          tenants
        ),
      [tenants]
    );

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE TENANTS
  |--------------------------------------------------------------------------
  |
  | Create:
  |   Only tenants without active/pending tenancy.
  |
  | Edit:
  |   Keep the current tenant visible even if they are blocked by the
  |   tenancy being edited.
  |
  */

  const availableTenants =
    useMemo(() => {
      const currentTenantId =
        normalizeId(
          form.tenant_id
        );

      return tenantList.filter(
        (tenant) => {
          const tenantId =
            getTenantId(
              tenant
            );

          /*
          | Never hide the tenant already assigned to this tenancy while
          | editing it.
          */

          if (
            isEdit &&
            currentTenantId &&
            sameId(
              tenantId,
              currentTenantId
            )
          ) {
            return true;
          }

          return !isTenantBlocked(
            tenant
          );
        }
      );
    }, [
      tenantList,
      form.tenant_id,
      isEdit,
    ]);

  /*
  |--------------------------------------------------------------------------
  | CURRENT TENANT
  |--------------------------------------------------------------------------
  */

  const currentTenant =
    useMemo(() => {
      const tenantId =
        normalizeId(
          form.tenant_id
        );

      if (!tenantId) {
        return null;
      }

      return (
        tenantList.find(
          (tenant) =>
            sameId(
              getTenantId(
                tenant
              ),
              tenantId
            )
        ) ?? null
      );
    }, [
      tenantList,
      form.tenant_id,
    ]);

  const currentTenantBlocked =
    Boolean(
      currentTenant &&
      isTenantBlocked(
        currentTenant
      )
    );

  /*
  |--------------------------------------------------------------------------
  | FILTER APARTMENTS
  |--------------------------------------------------------------------------
  */

  const filteredApartments =
    useMemo(() => {
      const propertyId =
        normalizeId(
          form.property_id
        );

      if (!propertyId) {
        return [];
      }

      return apartmentList.filter(
        (apartment) => {
          const apartmentPropertyId =
            getPropertyIdFromApartment(
              apartment
            );

          return sameId(
            apartmentPropertyId,
            propertyId
          );
        }
      );
    }, [
      apartmentList,
      form.property_id,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FILTER UNITS
  |--------------------------------------------------------------------------
  */

  const filteredUnits =
    useMemo(() => {
      const apartmentId =
        normalizeId(
          form.apartment_id
        );

      if (!apartmentId) {
        return [];
      }

      return unitList.filter(
        (unit) => {
          const unitApartmentId =
            getApartmentIdFromUnit(
              unit
            );

          return sameId(
            unitApartmentId,
            apartmentId
          );
        }
      );
    }, [
      unitList,
      form.apartment_id,
    ]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    /*
    |--------------------------------------------------------------------------
    | PROPERTY
    |--------------------------------------------------------------------------
    */

    if (
      name ===
      "property_id"
    ) {
      setForm((current) => ({
        ...current,

        property_id:
          normalizeId(value),

        apartment_id: "",
        unit_id: "",
      }));

      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next.property_id;
        delete next.apartment_id;
        delete next.unit_id;

        return next;
      });

      setServerError("");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | APARTMENT
    |--------------------------------------------------------------------------
    */

    if (
      name ===
      "apartment_id"
    ) {
      setForm((current) => ({
        ...current,

        apartment_id:
          normalizeId(value),

        unit_id: "",
      }));

      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next.apartment_id;
        delete next.unit_id;

        return next;
      });

      setServerError("");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | TENANT
    |--------------------------------------------------------------------------
    */

    if (
      name === "tenant_id"
    ) {
      const selectedTenantId =
        normalizeId(value);

      const selectedTenant =
        tenantList.find(
          (tenant) =>
            sameId(
              getTenantId(
                tenant
              ),
              selectedTenantId
            )
        );

      /*
      | Frontend protection against selecting a blocked tenant.
      |
      | The backend MUST still enforce this.
      */

      if (
        selectedTenant &&
        isTenantBlocked(
          selectedTenant
        ) &&
        !(
          isEdit &&
          sameId(
            selectedTenantId,
            form.tenant_id
          )
        )
      ) {
        setErrors((current) => ({
          ...current,
          tenant_id:
            "This tenant is already assigned to an active or pending tenancy.",
        }));

        setServerError(
          "The selected tenant is already assigned to an active or pending tenancy."
        );

        return;
      }

      setForm((current) => ({
        ...current,
        tenant_id:
          selectedTenantId,
      }));

      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next.tenant_id;

        return next;
      });

      setServerError("");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    |
    | Backend rule:
    |
    | active => is_active true
    | everything else => is_active false
    |
    */

    if (
      name === "status"
    ) {
      const normalizedStatus =
        normalizeStatus(value);

      setForm((current) => ({
        ...current,

        status:
          normalizedStatus,

        is_active:
          normalizedStatus ===
          "active",
      }));

      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next.status;
        delete next.is_active;

        return next;
      });

      setServerError("");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | IS ACTIVE
    |--------------------------------------------------------------------------
    */

    if (
      name === "is_active"
    ) {
      const nextIsActive =
        type === "checkbox"
          ? checked
          : normalizeBoolean(
            value
          );

      setForm((current) => ({
        ...current,

        is_active:
          nextIsActive,

        /*
        | If activating, status becomes active.
        |
        | If deactivating an active tenancy, use pending.
        | This prevents backend consistency errors.
        */

        status:
          nextIsActive
            ? "active"
            : current.status ===
              "active"
              ? "pending"
              : current.status,
      }));

      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next.is_active;
        delete next.status;

        return next;
      });

      setServerError("");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | NORMAL FIELD
    |--------------------------------------------------------------------------
    */

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setErrors((current) => {
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
  | FIELD ERROR
  |--------------------------------------------------------------------------
  */

  const fieldError = (
    field
  ) =>
    errors?.[field];

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    const nextErrors = {};

    const propertyId =
      normalizeString(
        form.property_id
      );

    const apartmentId =
      normalizeString(
        form.apartment_id
      );

    const unitId =
      normalizeString(
        form.unit_id
      );

    const tenantId =
      normalizeString(
        form.tenant_id
      );

    const startDate =
      normalizeString(
        form.start_date
      );

    const endDate =
      normalizeString(
        form.end_date
      );

    const moveInDate =
      normalizeString(
        form.move_in_date
      );

    const moveOutDate =
      normalizeString(
        form.move_out_date
      );

    const rentAmount =
      normalizeString(
        form.rent_amount
      );

    const status =
      normalizeStatus(
        form.status
      );

    const paymentFrequency =
      normalizePaymentFrequency(
        form.payment_frequency
      );

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (!propertyId) {
      nextErrors.property_id =
        "Please select a property.";
    }

    if (!apartmentId) {
      nextErrors.apartment_id =
        "Please select an apartment.";
    }

    if (!unitId) {
      nextErrors.unit_id =
        "Please select a unit.";
    }

    if (!tenantId) {
      nextErrors.tenant_id =
        "Please select a tenant.";
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant assignment protection
    |--------------------------------------------------------------------------
    */

    if (tenantId) {
      const selectedTenant =
        tenantList.find(
          (tenant) =>
            sameId(
              getTenantId(
                tenant
              ),
              tenantId
            )
        );

      if (
        selectedTenant &&
        isTenantBlocked(
          selectedTenant
        )
      ) {
        const isCurrentTenant =
          isEdit &&
          sameId(
            tenantId,
            tenancy?.tenant_id ??
              tenancy?.tenant?.id
          );

        /*
        | A tenant can remain assigned to the tenancy being edited.
        | They cannot be assigned to a different tenancy.
        */

        if (!isCurrentTenant) {
          nextErrors.tenant_id =
            "The selected tenant is already assigned to an active or pending tenancy.";
        }
      }
    }

    if (!startDate) {
      nextErrors.start_date =
        "Start date is required.";
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    if (
      !TENANCY_STATUSES.includes(
        status
      )
    ) {
      nextErrors.status =
        "Please select a valid tenancy status.";
    }

    /*
    |--------------------------------------------------------------------------
    | Payment frequency
    |--------------------------------------------------------------------------
    */

    if (
      !PAYMENT_FREQUENCIES.includes(
        paymentFrequency
      )
    ) {
      nextErrors.payment_frequency =
        "Please select a valid payment frequency.";
    }

    /*
    |--------------------------------------------------------------------------
    | Rent
    |--------------------------------------------------------------------------
    */

    if (!rentAmount) {
      nextErrors.rent_amount =
        "Rent amount is required.";
    } else if (
      Number.isNaN(
        Number(
          form.rent_amount
        )
      )
    ) {
      nextErrors.rent_amount =
        "Enter a valid rent amount.";
    } else if (
      Number(
        form.rent_amount
      ) < 0
    ) {
      nextErrors.rent_amount =
        "Rent amount cannot be negative.";
    }

    /*
    |--------------------------------------------------------------------------
    | Optional numeric fields
    |--------------------------------------------------------------------------
    */

    const numericFields = [
      [
        "deposit_amount",
        "Deposit amount",
      ],
      [
        "service_charge",
        "Service charge",
      ],
      [
        "late_fee",
        "Late fee",
      ],
      [
        "due_day",
        "Due day",
      ],
    ];

    numericFields.forEach(
      ([field, label]) => {
        if (
          form[field] !== "" &&
          form[field] !== null &&
          form[field] !== undefined
        ) {
          if (
            Number.isNaN(
              Number(form[field])
            )
          ) {
            nextErrors[field] =
              `${label} must be a valid number.`;
          }
        }
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Non-negative amounts
    |--------------------------------------------------------------------------
    */

    [
      "deposit_amount",
      "service_charge",
      "late_fee",
    ].forEach((field) => {
      if (
        form[field] !== "" &&
        form[field] !== null &&
        form[field] !== undefined &&
        !Number.isNaN(
          Number(form[field])
        ) &&
        Number(form[field]) < 0
      ) {
        nextErrors[field] =
          `${field.replaceAll("_", " ")} cannot be negative.`;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Due day
    |--------------------------------------------------------------------------
    */

    if (
      form.due_day !== "" &&
      form.due_day !== null &&
      form.due_day !== undefined
    ) {
      const dueDay =
        Number(form.due_day);

      if (
        !Number.isInteger(
          dueDay
        ) ||
        dueDay < 1 ||
        dueDay > 31
      ) {
        nextErrors.due_day =
          "Due day must be between 1 and 31.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Dates
    |--------------------------------------------------------------------------
    */

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      nextErrors.end_date =
        "The end date must be on or after the start date.";
    }

    if (
      startDate &&
      moveInDate &&
      moveInDate < startDate
    ) {
      nextErrors.move_in_date =
        "The move-in date cannot be before the tenancy start date.";
    }

    if (
      moveInDate &&
      moveOutDate &&
      moveOutDate < moveInDate
    ) {
      nextErrors.move_out_date =
        "The move-out date must be on or after the move-in date.";
    }

    if (
      endDate &&
      moveOutDate &&
      moveOutDate > endDate
    ) {
      nextErrors.move_out_date =
        "The move-out date cannot be after the tenancy end date.";
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE STATUS CONSISTENCY
    |--------------------------------------------------------------------------
    */

    if (
      status !== "active" &&
      form.is_active === true
    ) {
      nextErrors.is_active =
        "Only an active tenancy can be marked as active.";
    }

    if (
      form.move_out_date &&
      form.is_active === true
    ) {
      nextErrors.is_active =
        "A tenancy with a move-out date cannot be active.";
    }

    setErrors(
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
  | BUILD BACKEND PAYLOAD
  |--------------------------------------------------------------------------
  */

  const buildPayload = () => {
    const status =
      normalizeStatus(
        form.status
      );

    const isActive =
      status === "active";

    const payload = {
      property_id:
        form.property_id
          ? Number(
            form.property_id
          )
          : null,

      apartment_id:
        form.apartment_id
          ? Number(
            form.apartment_id
          )
          : null,

      unit_id:
        form.unit_id
          ? Number(
            form.unit_id
          )
          : null,

      tenant_id:
        form.tenant_id
          ? Number(
            form.tenant_id
          )
          : null,

      start_date:
        form.start_date ||
        null,

      end_date:
        form.end_date ||
        null,

      move_in_date:
        form.move_in_date ||
        null,

      move_out_date:
        form.move_out_date ||
        null,

      rent_amount:
        form.rent_amount !==
          "" &&
        form.rent_amount !==
          null
          ? Number(
            form.rent_amount
          )
          : null,

      deposit_amount:
        form.deposit_amount !==
          "" &&
        form.deposit_amount !==
          null
          ? Number(
            form.deposit_amount
          )
          : null,

      service_charge:
        form.service_charge !==
          "" &&
        form.service_charge !==
          null
          ? Number(
            form.service_charge
          )
          : null,

      late_fee:
        form.late_fee !==
          "" &&
        form.late_fee !==
          null
          ? Number(
            form.late_fee
          )
          : null,

      payment_frequency:
        normalizePaymentFrequency(
          form.payment_frequency
        ),

      due_day:
        form.due_day !==
          "" &&
        form.due_day !==
          null
          ? Number(
            form.due_day
          )
          : null,

      status,

      is_active:
        isActive,

      agreement_file:
        normalizeString(
          form.agreement_file
        ) || null,

      agreement_public_id:
        normalizeString(
          form.agreement_public_id
        ) || null,

      notes:
        normalizeString(
          form.notes
        ) || null,
    };

    /*
    |--------------------------------------------------------------------------
    | Tenancy number
    |--------------------------------------------------------------------------
    |
    | Backend normally generates this during creation.
    | During update, keep the existing number.
    |
    */

    if (isEdit) {
      payload.tenancy_number =
        normalizeString(
          form.tenancy_number
        ) || null;
    }

    return payload;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setServerError("");

    if (!validate()) {
      return;
    }

    if (
      typeof onSubmit !==
      "function"
    ) {
      setServerError(
        "Unable to submit the tenancy form."
      );

      return;
    }

    const payload =
      buildPayload();

    try {
      await onSubmit(
        payload,
        tenancy
      );
    } catch (submitError) {
      const message =
        getErrorMessage(
          submitError
        );

      setServerError(
        message ||
        "Failed to save tenancy. Please try again."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (
      typeof onCancel ===
      "function"
    ) {
      onCancel();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGE
  |--------------------------------------------------------------------------
  */

  const externalErrorMessage =
    getErrorMessage(error);

  const displayedServerError =
    serverError ||
    externalErrorMessage;

  const hasErrors =
    Object.keys(errors)
      .length > 0;

  /*
  |--------------------------------------------------------------------------
  | COMPLETION
  |--------------------------------------------------------------------------
  */

  const completion =
    useMemo(() => {
      const requiredFields = [
        "property_id",
        "apartment_id",
        "unit_id",
        "tenant_id",
        "start_date",
        "rent_amount",
        "status",
      ];

      const completed =
        requiredFields.filter(
          (field) =>
            normalizeString(
              form[field]
            ) !== ""
        ).length;

      return Math.round(
        (completed /
          requiredFields.length) *
        100
      );
    }, [form]);

  const formTitle = isEdit
    ? "Update Tenancy"
    : "Create Tenancy";

  const submitLabel = isEdit
    ? "Update Tenancy"
    : "Create Tenancy";

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    isEdit
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-white">
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
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      noValidate
      className="space-y-6"
    >
      {/* HEADER */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Home className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {formTitle}
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                {isEdit
                  ? "Update tenancy details, rental terms and status."
                  : "Create a new tenancy and assign an eligible tenant to a unit."}
              </p>
            </div>
          </div>

          <div className="min-w-[180px]">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Form completion
              </span>

              <span className="text-xs font-semibold text-gray-700">
                {completion}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-300"
                style={{
                  width: `${completion}%`,
                }}
              />
            </div>
          </div>
        </div>

        {(displayedServerError ||
          hasErrors) && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-4 sm:px-6">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Please check the form
                </p>

                {displayedServerError && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                    {
                      displayedServerError
                    }
                  </p>
                )}

                {hasErrors && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-red-700">
                    {Object.entries(
                      errors
                    )
                      .slice(0, 10)
                      .map(
                        ([
                          field,
                          message,
                        ]) => (
                          <li
                            key={
                              field
                            }
                          >
                            {
                              message
                            }
                          </li>
                        )
                      )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGNMENT */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <Building2 className="h-5 w-5" />
          }
          title="Tenancy Assignment"
          description="Select the property, apartment, unit and eligible tenant for this tenancy."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <SelectField
            label="Property"
            name="property_id"
            value={
              form.property_id
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "property_id"
            )}
            required
            options={[
              {
                value: "",
                label:
                  "Select property",
              },
              ...propertyList.map(
                (property) => ({
                  value:
                    String(
                      property.id
                    ),
                  label:
                    getPropertyName(
                      property
                    ),
                })
              ),
            ]}
          />

          <SelectField
            label="Apartment"
            name="apartment_id"
            value={
              form.apartment_id
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "apartment_id"
            )}
            required
            disabled={
              !form.property_id
            }
            options={[
              {
                value: "",
                label:
                  form.property_id
                    ? filteredApartments.length
                      ? "Select apartment"
                      : "No apartments available for this property"
                    : "Select property first",
              },
              ...filteredApartments.map(
                (apartment) => ({
                  value:
                    String(
                      apartment.id
                    ),
                  label:
                    getApartmentName(
                      apartment
                    ),
                })
              ),
            ]}
          />

          <SelectField
            label="Unit"
            name="unit_id"
            value={
              form.unit_id
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "unit_id"
            )}
            required
            disabled={
              !form.apartment_id
            }
            options={[
              {
                value: "",
                label:
                  form.apartment_id
                    ? filteredUnits.length
                      ? "Select unit"
                      : "No units available for this apartment"
                    : "Select apartment first",
              },
              ...filteredUnits.map(
                (unit) => ({
                  value:
                    String(
                      unit.id
                    ),
                  label:
                    getUnitName(
                      unit
                    ),
                })
              ),
            ]}
          />

          <div>
            <SelectField
              label="Tenant"
              name="tenant_id"
              value={
                form.tenant_id
              }
              onChange={
                handleChange
              }
              error={fieldError(
                "tenant_id"
              )}
              required
              options={[
                {
                  value: "",
                  label:
                    availableTenants.length
                      ? "Select tenant"
                      : "No eligible tenants available",
                },
                ...availableTenants.map(
                  (tenant) => ({
                    value:
                      String(
                        getTenantId(
                          tenant
                        )
                      ),
                    label:
                      getTenantName(
                        tenant
                      ),
                  })
                ),
              ]}
            />

            {!isEdit &&
              tenantList.length >
                0 &&
              availableTenants.length ===
                0 && (
                <p className="mt-1.5 text-xs text-gray-500">
                  All tenants currently have an active or pending tenancy.
                </p>
              )}

            {isEdit &&
              currentTenantBlocked &&
              currentTenant && (
                <p className="mt-1.5 text-xs text-amber-600">
                  Current tenant is retained because this tenant is already assigned to this tenancy.
                </p>
              )}
          </div>

          {isEdit && (
            <InputField
              label="Tenancy Number"
              name="tenancy_number"
              value={
                form.tenancy_number
              }
              onChange={
                handleChange
              }
              disabled
              hint="The tenancy number assigned to this tenancy."
            />
          )}
        </div>
      </section>

      {/* PERIOD */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          title="Tenancy Period"
          description="Define the tenancy start, end, move-in and move-out dates."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <InputField
            label="Start Date"
            name="start_date"
            type="date"
            value={
              form.start_date
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "start_date"
            )}
            required
          />

          <InputField
            label="End Date"
            name="end_date"
            type="date"
            value={
              form.end_date
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "end_date"
            )}
          />

          <InputField
            label="Move-In Date"
            name="move_in_date"
            type="date"
            value={
              form.move_in_date
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "move_in_date"
            )}
          />

          <InputField
            label="Move-Out Date"
            name="move_out_date"
            type="date"
            value={
              form.move_out_date
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "move_out_date"
            )}
          />
        </div>
      </section>

      {/* FINANCIAL */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <Wallet className="h-5 w-5" />
          }
          title="Financial Information"
          description="Set rent, deposit, service charge, late fee and payment configuration."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <InputField
            label="Rent Amount"
            name="rent_amount"
            type="number"
            value={
              form.rent_amount
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "rent_amount"
            )}
            required
            min="0"
            step="0.01"
            placeholder="e.g. 60000"
          />

          <InputField
            label="Deposit Amount"
            name="deposit_amount"
            type="number"
            value={
              form.deposit_amount
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "deposit_amount"
            )}
            min="0"
            step="0.01"
            placeholder="e.g. 60000"
          />

          <InputField
            label="Service Charge"
            name="service_charge"
            type="number"
            value={
              form.service_charge
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "service_charge"
            )}
            min="0"
            step="0.01"
            placeholder="e.g. 5000"
          />

          <InputField
            label="Late Fee"
            name="late_fee"
            type="number"
            value={
              form.late_fee
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "late_fee"
            )}
            min="0"
            step="0.01"
            placeholder="e.g. 3500"
          />

          <SelectField
            label="Payment Frequency"
            name="payment_frequency"
            value={
              form.payment_frequency
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "payment_frequency"
            )}
            required
            options={[
              {
                value:
                  "daily",
                label:
                  "Daily",
              },
              {
                value:
                  "weekly",
                label:
                  "Weekly",
              },
              {
                value:
                  "monthly",
                label:
                  "Monthly",
              },
              {
                value:
                  "quarterly",
                label:
                  "Quarterly",
              },
              {
                value:
                  "yearly",
                label:
                  "Yearly",
              },
            ]}
          />

          <InputField
            label="Due Day"
            name="due_day"
            type="number"
            value={
              form.due_day
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "due_day"
            )}
            min="1"
            max="31"
            step="1"
            placeholder="e.g. 1"
          />
        </div>
      </section>

      {/* STATUS */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
          title="Tenancy Status"
          description="Manage the current status and active state of this tenancy."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <SelectField
            label="Tenancy Status"
            name="status"
            value={
              form.status
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "status"
            )}
            required
            options={[
              {
                value: "",
                label:
                  "Select status",
              },
              {
                value:
                  "active",
                label:
                  "Active",
              },
              {
                value:
                  "pending",
                label:
                  "Pending",
              },
              {
                value:
                  "expired",
                label:
                  "Expired",
              },
              {
                value:
                  "terminated",
                label:
                  "Terminated",
              },
              {
                value:
                  "cancelled",
                label:
                  "Cancelled",
              },
            ]}
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Current tenancy status
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {form.status ===
                  "active"
                    ? "This tenancy is currently active."
                    : `This tenancy is ${form.status}.`}
                </p>

                <label className="mt-4 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      form.is_active ===
                      true
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      form.status !==
                      "active"
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    Mark tenancy as active
                  </span>
                </label>

                {fieldError(
                  "is_active"
                ) && (
                  <p className="mt-2 text-xs text-red-600">
                    {
                      fieldError(
                        "is_active"
                      )
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGREEMENT */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <FileText className="h-5 w-5" />
          }
          title="Agreement"
          description="Store agreement information for this tenancy."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="Agreement File"
            name="agreement_file"
            value={
              form.agreement_file
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "agreement_file"
            )}
            placeholder="Agreement file path or URL"
          />

          <InputField
            label="Agreement Public ID"
            name="agreement_public_id"
            value={
              form.agreement_public_id
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "agreement_public_id"
            )}
            placeholder="Optional public ID"
          />
        </div>
      </section>

      {/* NOTES */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <FileText className="h-5 w-5" />
          }
          title="Additional Notes"
          description="Add any additional information about this tenancy."
        />

        <div className="p-5 sm:p-6">
          <TextAreaField
            label="Notes"
            name="notes"
            value={
              form.notes
            }
            onChange={
              handleChange
            }
            placeholder="Enter any additional notes about this tenancy..."
            rows={5}
            error={fieldError(
              "notes"
            )}
          />
        </div>
      </section>

      {/* ACTIONS */}

      <div className="sticky bottom-0 z-10 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={
              handleCancel
            }
            disabled={
              submitting
            }
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
              px-5
              py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            <X className="h-4 w-4" />

            Cancel
          </button>

          <button
            type="submit"
            disabled={
              submitting
            }
            className="
              inline-flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-primary-600
              px-6
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-primary-700
              disabled:cursor-not-allowed
              disabled:opacity-60
              sm:w-auto
            "
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                {isEdit
                  ? "Updating..."
                  : "Creating..."}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

/*
|--------------------------------------------------------------------------
| ERROR MESSAGE HELPER
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error
) {
  if (!error) {
    return "";
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  /*
  | Direct message.
  */

  if (error?.message) {
    return String(
      error.message
    );
  }

  if (error?.error) {
    return String(
      error.error
    );
  }

  /*
  | Axios response.
  */

  const data =
    error?.response?.data;

  if (data?.message) {
    return String(
      data.message
    );
  }

  if (data?.error) {
    return String(
      data.error
    );
  }

  /*
  | Laravel validation errors.
  */

  const validationErrors =
    data?.errors ||
    error?.errors;

  if (
    validationErrors &&
    typeof validationErrors ===
      "object"
  ) {
    const messages =
      Object.entries(
        validationErrors
      )
        .flatMap(
          ([
            field,
            values,
          ]) => {
            const list =
              Array.isArray(
                values
              )
                ? values
                : [values];

            return list.map(
              (message) =>
                `${field}: ${message}`
            );
          }
        )
        .filter(Boolean);

    if (messages.length) {
      return messages.join(
        "\n"
      );
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| SECTION HEADER
|--------------------------------------------------------------------------
*/

const SectionHeader = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>

        <p className="mt-0.5 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| FIELD ERROR
|--------------------------------------------------------------------------
*/

const FieldError = ({
  error,
}) => {
  if (!error) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />

      {error}
    </p>
  );
};

/*
|--------------------------------------------------------------------------
| INPUT FIELD
|--------------------------------------------------------------------------
*/

const InputField = ({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  error,
  required = false,
  placeholder,
  hint,
  icon,
  autoComplete,
  disabled = false,
  min,
  max,
  step,
}) => {
  const hasError =
    Boolean(error);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={
            value ?? ""
          }
          onChange={
            onChange
          }
          placeholder={
            placeholder
          }
          autoComplete={
            autoComplete
          }
          disabled={
            disabled
          }
          min={min}
          max={max}
          step={step}
          aria-invalid={
            hasError
          }
          aria-describedby={
            hasError
              ? `${name}-error`
              : hint
                ? `${name}-hint`
                : undefined
          }
          className={`
            h-10
            w-full
            rounded-lg
            border
            bg-white
            px-3
            text-sm
            text-gray-900
            outline-none
            transition
            placeholder:text-gray-400
            disabled:cursor-not-allowed
            disabled:bg-gray-50
            disabled:text-gray-500
            ${icon ? "pl-10" : ""}
            ${
              hasError
                ? "border-red-300 ring-1 ring-red-100 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            }
          `}
        />
      </div>

      {hint && !error && (
        <p
          id={`${name}-hint`}
          className="text-xs text-gray-400"
        >
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${name}-error`}
        >
          <FieldError
            error={error}
          />
        </p>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| SELECT FIELD
|--------------------------------------------------------------------------
*/

const SelectField = ({
  label,
  name,
  value = "",
  onChange,
  error,
  required = false,
  options = [],
  disabled = false,
}) => {
  const hasError =
    Boolean(error);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
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
          value={
            value ?? ""
          }
          onChange={
            onChange
          }
          disabled={
            disabled
          }
          aria-invalid={
            hasError
          }
          aria-describedby={
            hasError
              ? `${name}-error`
              : undefined
          }
          className={`
            h-10
            w-full
            appearance-none
            rounded-lg
            border
            bg-white
            px-3
            pr-10
            text-sm
            text-gray-900
            outline-none
            transition
            disabled:cursor-not-allowed
            disabled:bg-gray-50
            disabled:text-gray-500
            ${
              hasError
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            }
          `}
        >
          {options.map(
            (
              option,
              index
            ) => (
              <option
                key={`${String(
                  option.value
                )}-${index}`}
                value={
                  option.value
                }
                disabled={
                  option.disabled
                }
              >
                {
                  option.label
                }
              </option>
            )
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {error && (
        <div
          id={`${name}-error`}
        >
          <FieldError
            error={error}
          />
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| TEXTAREA
|--------------------------------------------------------------------------
*/

const TextAreaField = ({
  label,
  name,
  value = "",
  onChange,
  error,
  required = false,
  placeholder,
  rows = 4,
}) => {
  const hasError =
    Boolean(error);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
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
        value={
          value ?? ""
        }
        onChange={
          onChange
        }
        rows={rows}
        placeholder={
          placeholder
        }
        aria-invalid={
          hasError
        }
        aria-describedby={
          hasError
            ? `${name}-error`
            : undefined
        }
        className={`
          w-full
          resize-y
          rounded-lg
          border
          bg-white
          px-3
          py-2.5
          text-sm
          text-gray-900
          outline-none
          transition
          placeholder:text-gray-400
          ${
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          }
        `}
      />

      {error && (
        <div
          id={`${name}-error`}
        >
          <FieldError
            error={error}
          />
        </div>
      )}
    </div>
  );
};

export default TenancyForm;