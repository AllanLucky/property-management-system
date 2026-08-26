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
  useMemo,
  useState,
} from "react";

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

  rent_amount: "",
  deposit_amount: "",
  service_charge: "",

  payment_frequency: "monthly",

  status: "active",

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

  /*
  |--------------------------------------------------------------------------
  | Handle Laravel resource / nested object
  |--------------------------------------------------------------------------
  */

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    /*
    | Common shapes:
    |
    | { id: 7 }
    | { value: 7 }
    | { data: { id: 7 } }
    | { property_id: 2 }
    | { apartment_id: 7 }
    */

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
      const nested = normalizeId(
        value.data
      );

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
        const result = normalizeId(
          value[key]
        );

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
| VALUE HELPERS
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

  /*
  |--------------------------------------------------------------------------
  | { data: [...] }
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(value.data)) {
    return value.data;
  }

  /*
  |--------------------------------------------------------------------------
  | { items: [...] }
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(value.items)) {
    return value.items;
  }

  /*
  |--------------------------------------------------------------------------
  | { results: [...] }
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(value.results)) {
    return value.results;
  }

  /*
  |--------------------------------------------------------------------------
  | Laravel nested paginator/resource:
  |
  | {
  |   data: {
  |     data: [...]
  |   }
  | }
  |--------------------------------------------------------------------------
  */

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
| APARTMENT COLLECTION BUILDER
|--------------------------------------------------------------------------
|
| Create forms often receive properties with their apartments embedded
| in the property response, while edit forms may receive a standalone
| apartments collection. Support both shapes.
|
*/

const getApartmentsFromProperties = (properties) => {
  const propertyList = getCollection(properties);
  const result = [];

  for (const property of propertyList) {
    const propertyId = normalizeId(
      property?.id ??
      property?.property_id ??
      property?.propertyId
    );

    const nestedApartments = getCollection(
      property?.apartments
    );

    for (const apartment of nestedApartments) {
      if (!apartment || typeof apartment !== "object") {
        continue;
      }

      result.push({
        ...apartment,

        /*
        | Preserve the relationship when the nested API response
        | does not include property_id.
        */
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
    ...getCollection(explicitApartments),
    ...propertyApartments,
  ];

  const seen = new Set();

  return merged.filter((apartment) => {
    const id = normalizeId(
      apartment?.id ??
      apartment?.apartment_id ??
      apartment?.apartmentId
    );

    /*
    | If an apartment has no usable id, keep it.
    */
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

/*
|--------------------------------------------------------------------------
| RELATIONSHIP HELPERS
|--------------------------------------------------------------------------
*/

const getEntityId = (
  entity,
  ...keys
) => {
  if (!entity) {
    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | Primitive
  |--------------------------------------------------------------------------
  */

  if (
    typeof entity !== "object"
  ) {
    return normalizeId(entity);
  }

  /*
  |--------------------------------------------------------------------------
  | Direct keys
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Nested data
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Direct ID fallback
  |--------------------------------------------------------------------------
  */

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
| GET PROPERTY ID FROM APARTMENT
|--------------------------------------------------------------------------
|
| Supports:
|
| {
|   id: 7,
|   property_id: 2
| }
|
| {
|   id: 7,
|   propertyId: 2
| }
|
| {
|   id: 7,
|   property: {
|     id: 2
|   }
| }
|
| {
|   id: 7,
|   property: {
|     data: {
|       id: 2
|     }
|   }
| }
|
*/

const getPropertyIdFromApartment = (
  apartment
) => {
  if (!apartment) {
    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | Direct property ID
  |--------------------------------------------------------------------------
  */

  const directId =
    getEntityId(
      apartment,
      "property_id",
      "propertyId"
    );

  if (directId) {
    return directId;
  }

  /*
  |--------------------------------------------------------------------------
  | Nested property
  |--------------------------------------------------------------------------
  */

  const nestedPropertyId =
    getEntityId(
      apartment.property,
      "id",
      "property_id",
      "propertyId"
    );

  if (nestedPropertyId) {
    return nestedPropertyId;
  }

  /*
  |--------------------------------------------------------------------------
  | Additional possible API shapes
  |--------------------------------------------------------------------------
  */

  const relationId =
    getEntityId(
      apartment.property_relation,
      "id",
      "property_id",
      "propertyId"
    );

  if (relationId) {
    return relationId;
  }

  /*
  |--------------------------------------------------------------------------
  | Resource wrapper
  |--------------------------------------------------------------------------
  */

  if (apartment.data) {
    return getPropertyIdFromApartment(
      apartment.data
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| GET APARTMENT ID FROM UNIT
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
      unit.apartment,
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
| GET PROPERTY ID FROM UNIT
|--------------------------------------------------------------------------
*/

const getPropertyIdFromUnit = (
  unit
) => {
  if (!unit) {
    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | Direct
  |--------------------------------------------------------------------------
  */

  const directId =
    getEntityId(
      unit,
      "property_id",
      "propertyId"
    );

  if (directId) {
    return directId;
  }

  /*
  |--------------------------------------------------------------------------
  | Nested property
  |--------------------------------------------------------------------------
  */

  const propertyId =
    getEntityId(
      unit.property,
      "id",
      "property_id",
      "propertyId"
    );

  if (propertyId) {
    return propertyId;
  }

  /*
  |--------------------------------------------------------------------------
  | Through apartment
  |--------------------------------------------------------------------------
  */

  const apartmentPropertyId =
    getEntityId(
      unit.apartment,
      "property_id",
      "propertyId"
    );

  if (apartmentPropertyId) {
    return apartmentPropertyId;
  }

  const nestedApartmentPropertyId =
    getEntityId(
      unit.apartment?.property,
      "id",
      "property_id",
      "propertyId"
    );

  if (nestedApartmentPropertyId) {
    return nestedApartmentPropertyId;
  }

  /*
  |--------------------------------------------------------------------------
  | Resource wrapper
  |--------------------------------------------------------------------------
  */

  if (unit.data) {
    return getPropertyIdFromUnit(
      unit.data
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| TENANCY NORMALIZATION
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

    rent_amount:
      normalizeNumber(
        getValue(
          tenancy,
          "rent_amount",
          "rentAmount",
          "rent",
          "monthly_rent",
          "monthlyRent"
        )
      ),

    deposit_amount:
      normalizeNumber(
        getValue(
          tenancy,
          "deposit_amount",
          "depositAmount",
          "deposit",
          "security_deposit",
          "securityDeposit"
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

    payment_frequency:
      normalizePaymentFrequency(
        getValue(
          tenancy,
          "payment_frequency",
          "paymentFrequency",
          "frequency"
        )
      ),

    status:
      getValue(
        tenancy,
        "status",
        "tenancy_status"
      ) || "active",

    notes:
      getValue(
        tenancy,
        "notes",
        "description"
      ) || "",
  };
};

const normalizePaymentFrequency = (value) => {
  const normalized =
    String(value ?? "")
      .trim()
      .toLowerCase();

  /*
  |-------------------------------------------------------------------------- 
  | Backend-supported values:
  | daily, weekly, monthly, quarterly, yearly
  |-------------------------------------------------------------------------- 
  |
  | Convert old frontend values so stale edit data cannot be submitted with
  | an invalid value.
  |
  */
  if (normalized === "annual") {
    return "yearly";
  }

  if (normalized === "biannual") {
    return "quarterly";
  }

  const allowed = new Set([
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
  ]);

  return allowed.has(normalized)
    ? normalized
    : "monthly";
};

const buildInitialForm = (
  tenancy,
  isEdit,
  initialValues
) => {
  return {
    ...DEFAULT_FORM,

    ...(isEdit
      ? normalizeTenancy(
        tenancy
      )
      : {}),

    ...(initialValues || {}),
  };
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
  if (tenant?.full_name) {
    return tenant.full_name;
  }

  if (tenant?.fullName) {
    return tenant.fullName;
  }

  const firstName =
    tenant?.first_name ||
    tenant?.firstName ||
    "";

  const lastName =
    tenant?.last_name ||
    tenant?.lastName ||
    "";

  const name =
    `${firstName} ${lastName}`.trim();

  if (name) {
    return name;
  }

  return (
    tenant?.name ||
    tenant?.email ||
    tenant?.phone ||
    tenant?.tenant_number ||
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
  | COLLECTIONS
  |--------------------------------------------------------------------------
  */

  const propertyList =
    useMemo(
      () =>
        getCollection(
          properties
        ),
      [properties]
    );

  const apartmentList =
    useMemo(() => {
      /*
      |--------------------------------------------------------------------------
      | Preferred source
      |--------------------------------------------------------------------------
      |
      | Use the standalone apartments prop when the parent already loaded
      | apartments separately.
      |
      */

      const explicitApartments =
        getCollection(apartments);

      /*
      |--------------------------------------------------------------------------
      | Create-form fallback
      |--------------------------------------------------------------------------
      |
      | Some property endpoints return:
      |
      | property.apartments = [...]
      |
      | This is especially useful on Create because the selected property
      | can already contain its apartments even when the parent did not
      | separately request /apartments.
      |
      */

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
        getCollection(units),
      [units]
    );

  const tenantList =
    useMemo(
      () =>
        getCollection(
          tenants
        ),
      [tenants]
    );

  /*
  |--------------------------------------------------------------------------
  | FILTER APARTMENTS
  |--------------------------------------------------------------------------
  |
  | FIX:
  |
  | The previous implementation depended too heavily on apartment.property_id.
  | This version checks every supported relationship shape.
  |
  */

  const filteredApartments =
    useMemo(() => {
      const propertyId =
        normalizeId(
          form.property_id
        );

      /*
      |--------------------------------------------------------------------------
      | No property selected
      |--------------------------------------------------------------------------
      */

      if (!propertyId) {
        return [];
      }

      /*
      |--------------------------------------------------------------------------
      | Filter apartments belonging to selected property
      |--------------------------------------------------------------------------
      */

      return apartmentList.filter(
        (apartment) => {
          const apartmentPropertyId =
            getPropertyIdFromApartment(
              apartment
            );

          /*
          | Exact match
          */

          if (
            apartmentPropertyId &&
            sameId(
              apartmentPropertyId,
              propertyId
            )
          ) {
            return true;
          }

          /*
          | Some APIs return apartment.property_id
          | as an object.
          */

          const alternativePropertyId =
            normalizeId(
              apartment?.property_id
            );

          if (
            alternativePropertyId &&
            sameId(
              alternativePropertyId,
              propertyId
            )
          ) {
            return true;
          }

          /*
          | Nested property object.
          */

          const nestedPropertyId =
            normalizeId(
              apartment?.property?.id
            );

          if (
            nestedPropertyId &&
            sameId(
              nestedPropertyId,
              propertyId
            )
          ) {
            return true;
          }

          /*
          |--------------------------------------------------------------------------
          | Some nested property resources expose only the parent
          | relationship after the apartment has been flattened.
          |--------------------------------------------------------------------------
          */

          const apartmentParentId =
            normalizeId(
              apartment?.property?.property_id
            );

          if (
            apartmentParentId &&
            sameId(
              apartmentParentId,
              propertyId
            )
          ) {
            return true;
          }

          return false;
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
    } = event.target;

    /*
    |--------------------------------------------------------------------------
    | PROPERTY CHANGE
    |--------------------------------------------------------------------------
    |
    | Property changed:
    |
    | property = new value
    | apartment = reset
    | unit = reset
    |
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
    | APARTMENT CHANGE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Only reset unit.
    |
    | Do NOT reset property.
    |
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
    | OTHER FIELDS
    |--------------------------------------------------------------------------
    */

    setForm((current) => ({
      ...current,
      [name]: value,
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

    const rentAmount =
      normalizeString(
        form.rent_amount
      );

    const status =
      normalizeString(
        form.status
      );

    const paymentFrequency =
      normalizePaymentFrequency(
        form.payment_frequency
      );

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

    if (!startDate) {
      nextErrors.start_date =
        "Start date is required.";
    }

    if (
      endDate &&
      startDate &&
      endDate < startDate
    ) {
      nextErrors.end_date =
        "End date cannot be before the start date.";
    }

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

    if (
      form.deposit_amount !==
      ""
    ) {
      if (
        Number.isNaN(
          Number(
            form.deposit_amount
          )
        )
      ) {
        nextErrors.deposit_amount =
          "Enter a valid deposit amount.";
      } else if (
        Number(
          form.deposit_amount
        ) < 0
      ) {
        nextErrors.deposit_amount =
          "Deposit amount cannot be negative.";
      }
    }

    if (
      form.service_charge !==
      ""
    ) {
      if (
        Number.isNaN(
          Number(
            form.service_charge
          )
        )
      ) {
        nextErrors.service_charge =
          "Enter a valid service charge.";
      } else if (
        Number(
          form.service_charge
        ) < 0
      ) {
        nextErrors.service_charge =
          "Service charge cannot be negative.";
      }
    }

    if (!status) {
      nextErrors.status =
        "Please select tenancy status.";
    }

    const allowedPaymentFrequencies = [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "yearly",
    ];

    if (
      !allowedPaymentFrequencies.includes(
        paymentFrequency
      )
    ) {
      nextErrors.payment_frequency =
        "Please select a valid payment frequency.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BUILD PAYLOAD
  |--------------------------------------------------------------------------
  */

  const buildPayload = () => {
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

      rent_amount:
        form.rent_amount !==
          ""
          ? Number(
            form.rent_amount
          )
          : null,

      deposit_amount:
        form.deposit_amount !==
          ""
          ? Number(
            form.deposit_amount
          )
          : null,

      service_charge:
        form.service_charge !==
          ""
          ? Number(
            form.service_charge
          )
          : null,

      payment_frequency:
        normalizePaymentFrequency(
          form.payment_frequency
        ),

      status:
        form.status ||
        "active",

      notes:
        normalizeString(
          form.notes
        ) || null,
    };

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
    } catch (
    submitError
    ) {
      setServerError(
        submitError?.message ||
        submitError?.error ||
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
  | EXTERNAL ERROR
  |--------------------------------------------------------------------------
  */

  const getExternalErrorMessage =
    () => {
      if (!error) {
        return "";
      }

      if (
        typeof error ===
        "string"
      ) {
        return error;
      }

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

      if (error?.errors) {
        if (
          typeof error.errors ===
          "string"
        ) {
          return error.errors;
        }

        if (
          typeof error.errors ===
          "object"
        ) {
          const messages =
            Object.values(
              error.errors
            )
              .flat()
              .filter(Boolean)
              .map(String);

          if (
            messages.length
          ) {
            return messages.join(
              " "
            );
          }
        }
      }

      if (
        error?.response?.data
      ) {
        const data =
          error.response.data;

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

        if (data?.errors) {
          if (
            typeof data.errors ===
            "string"
          ) {
            return data.errors;
          }

          if (
            typeof data.errors ===
            "object"
          ) {
            const messages =
              Object.values(
                data.errors
              )
                .flat()
                .filter(Boolean)
                .map(String);

            if (
              messages.length
            ) {
              return messages.join(
                " "
              );
            }
          }
        }
      }

      return "";
    };

  const externalErrorMessage =
    getExternalErrorMessage();

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
                  : "Create a new tenancy and assign a tenant to a unit."}
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
                    <p className="mt-1 text-sm text-red-700">
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
                        .slice(0, 8)
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

      {/* TENANCY ASSIGNMENT */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <Building2 className="h-5 w-5" />
          }
          title="Tenancy Assignment"
          description="Select the property, apartment, unit and tenant for this tenancy."
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
                  "Select tenant",
              },

              ...tenantList.map(
                (tenant) => ({
                  value:
                    String(
                      tenant.id
                    ),
                  label:
                    getTenantName(
                      tenant
                    ),
                })
              ),
            ]}
          />

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
              placeholder="e.g. TEN-W7Q4TEBQ"
              hint="The tenancy number assigned to this tenancy."
              disabled
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
          description="Define when the tenancy starts and when it ends."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
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
            hint="Leave empty for an open-ended tenancy if supported by your backend."
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
          description="Set rent, deposit, service charge and payment frequency."
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
            placeholder="e.g. 25000"
            min="0"
            step="0.01"
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
            placeholder="e.g. 25000"
            min="0"
            step="0.01"
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
            placeholder="e.g. 3000"
            min="0"
            step="0.01"
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
        </div>
      </section>

      {/* STATUS */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
          title="Tenancy Status"
          description="Manage the current status of this tenancy."
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
                  "inactive",
                label:
                  "Inactive",
              },
              {
                value:
                  "terminated",
                label:
                  "Terminated",
              },
              {
                value:
                  "expired",
                label:
                  "Expired",
              },
            ]}
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800">
                  Current tenancy status
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {form.status ===
                    "active"
                    ? "This tenancy is currently active."
                    : "The tenancy is not currently marked as active."}
                </p>
              </div>
            </div>
          </div>
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

                {
                  submitLabel
                }
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
            ${hasError
              ? "border-red-300 ring-1 ring-red-100 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            }
          `}
        />
      </div>

      {hint && !error && (
        <p className="text-xs text-gray-400">
          {hint}
        </p>
      )}

      <FieldError
        error={error}
      />
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
            ${hasError
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

      <FieldError
        error={error}
      />
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
          ${hasError
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          }
        `}
      />

      <FieldError
        error={error}
      />
    </div>
  );
};

export default TenancyForm;