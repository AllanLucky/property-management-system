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
import { useMemo, useState } from "react";

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
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const normalizeNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  return Number.isNaN(number) ? "" : number;
};

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

const getValue = (source, ...keys) => {
  for (const key of keys) {
    if (
      source?.[key] !== undefined &&
      source?.[key] !== null
    ) {
      return source[key];
    }
  }

  return "";
};

const getId = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return (
      value.id ??
      value.value ??
      value._id ??
      ""
    );
  }

  return value;
};

const getCollection = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    if (Array.isArray(value.data)) {
      return value.data;
    }

    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (Array.isArray(value.results)) {
      return value.results;
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| NORMALIZE TENANCY
|--------------------------------------------------------------------------
*/

const normalizeTenancy = (tenancy = {}) => {
  return {
    property_id: getId(
      getValue(
        tenancy,
        "property_id",
        "propertyId"
      ) ||
      tenancy?.property
    ),

    apartment_id: getId(
      getValue(
        tenancy,
        "apartment_id",
        "apartmentId"
      ) ||
      tenancy?.apartment
    ),

    unit_id: getId(
      getValue(
        tenancy,
        "unit_id",
        "unitId"
      ) ||
      tenancy?.unit
    ),

    tenant_id: getId(
      getValue(
        tenancy,
        "tenant_id",
        "tenantId"
      ) ||
      tenancy?.tenant
    ),

    tenancy_number: getValue(
      tenancy,
      "tenancy_number",
      "tenancyNumber",
      "number"
    ),

    start_date: formatDateForInput(
      getValue(
        tenancy,
        "start_date",
        "startDate"
      )
    ),

    end_date: formatDateForInput(
      getValue(
        tenancy,
        "end_date",
        "endDate"
      )
    ),

    rent_amount: normalizeNumber(
      getValue(
        tenancy,
        "rent_amount",
        "rentAmount",
        "rent",
        "monthly_rent"
      )
    ),

    deposit_amount: normalizeNumber(
      getValue(
        tenancy,
        "deposit_amount",
        "depositAmount",
        "deposit",
        "security_deposit"
      )
    ),

    service_charge: normalizeNumber(
      getValue(
        tenancy,
        "service_charge",
        "serviceCharge"
      )
    ),

    payment_frequency:
      getValue(
        tenancy,
        "payment_frequency",
        "paymentFrequency",
        "frequency"
      ) || "monthly",

    status:
      getValue(
        tenancy,
        "status",
        "tenancy_status"
      ) || "active",

    notes: getValue(
      tenancy,
      "notes",
      "description"
    ),
  };
};

/*
|--------------------------------------------------------------------------
| BUILD INITIAL FORM
|--------------------------------------------------------------------------
*/

const buildInitialForm = (
  tenancy,
  isEdit,
  initialValues
) => {
  return {
    ...DEFAULT_FORM,

    ...(isEdit
      ? normalizeTenancy(tenancy)
      : {}),

    ...(initialValues || {}),
  };
};

/*
|--------------------------------------------------------------------------
| DISPLAY HELPERS
|--------------------------------------------------------------------------
*/

const getPropertyName = (property) => {
  return (
    property?.name ||
    property?.property_name ||
    property?.title ||
    property?.propertyName ||
    property?.code ||
    `Property #${property?.id ?? ""}`
  );
};

const getApartmentName = (apartment) => {
  return (
    apartment?.name ||
    apartment?.apartment_name ||
    apartment?.title ||
    apartment?.apartmentName ||
    apartment?.number ||
    apartment?.code ||
    `Apartment #${apartment?.id ?? ""}`
  );
};

const getUnitName = (unit) => {
  return (
    unit?.name ||
    unit?.unit_name ||
    unit?.unit_number ||
    unit?.unitNumber ||
    unit?.number ||
    unit?.code ||
    `Unit #${unit?.id ?? ""}`
  );
};

const getTenantName = (tenant) => {
  if (
    tenant?.full_name
  ) {
    return tenant.full_name;
  }

  if (
    tenant?.fullName
  ) {
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

  const name = `${firstName} ${lastName}`.trim();

  if (name) {
    return name;
  }

  return (
    tenant?.name ||
    tenant?.email ||
    tenant?.phone ||
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
  /*
  |--------------------------------------------------------------------------
  | EDIT MODE
  |--------------------------------------------------------------------------
  */

  const isEdit =
    mode === "edit" ||
    Boolean(tenancy?.id);

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | There is intentionally NO useEffect/setState combination here.
  |
  | This prevents React's:
  |
  | "Calling setState synchronously within an effect..."
  |
  | warning.
  |
  */

  const [form, setForm] = useState(() =>
    buildInitialForm(
      tenancy,
      isEdit,
      initialValues
    )
  );

  /*
  |--------------------------------------------------------------------------
  | VALIDATION ERRORS
  |--------------------------------------------------------------------------
  */

  const [errors, setErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | LOCAL SERVER ERROR
  |--------------------------------------------------------------------------
  */

  const [serverError, setServerError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE COLLECTIONS
  |--------------------------------------------------------------------------
  */

  const propertyList = useMemo(
    () => getCollection(properties),
    [properties]
  );

  const apartmentList = useMemo(
    () => getCollection(apartments),
    [apartments]
  );

  const unitList = useMemo(
    () => getCollection(units),
    [units]
  );

  const tenantList = useMemo(
    () => getCollection(tenants),
    [tenants]
  );

  /*
  |--------------------------------------------------------------------------
  | FILTER APARTMENTS
  |--------------------------------------------------------------------------
  */

  const filteredApartments = useMemo(() => {
    if (!form.property_id) {
      return apartmentList;
    }

    return apartmentList.filter(
      (apartment) => {
        const apartmentPropertyId =
          getId(
            getValue(
              apartment,
              "property_id",
              "propertyId"
            ) ||
            apartment?.property
          );

        return (
          String(apartmentPropertyId) ===
          String(form.property_id)
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

  const filteredUnits = useMemo(() => {
    let result = unitList;

    if (form.apartment_id) {
      result = result.filter(
        (unit) => {
          const apartmentId =
            getId(
              getValue(
                unit,
                "apartment_id",
                "apartmentId"
              ) ||
              unit?.apartment
            );

          return (
            String(apartmentId) ===
            String(form.apartment_id)
          );
        }
      );
    }

    if (
      !form.apartment_id &&
      form.property_id
    ) {
      result = result.filter(
        (unit) => {
          const propertyId =
            getId(
              getValue(
                unit,
                "property_id",
                "propertyId"
              ) ||
              unit?.property
            );

          return (
            String(propertyId) ===
            String(form.property_id)
          );
        }
      );
    }

    return result;
  }, [
    unitList,
    form.apartment_id,
    form.property_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      /*
      |--------------------------------------------------------------------------
      | PROPERTY CHANGED
      |--------------------------------------------------------------------------
      */

      if (name === "property_id") {
        next.apartment_id = "";
        next.unit_id = "";
      }

      /*
      |--------------------------------------------------------------------------
      | APARTMENT CHANGED
      |--------------------------------------------------------------------------
      */

      if (name === "apartment_id") {
        next.unit_id = "";
      }

      return next;
    });

    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

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

  const fieldError = (field) =>
    errors?.[field];

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    const nextErrors = {};

    const propertyId =
      normalizeString(form.property_id);

    const apartmentId =
      normalizeString(form.apartment_id);

    const unitId =
      normalizeString(form.unit_id);

    const tenantId =
      normalizeString(form.tenant_id);

    const startDate =
      normalizeString(form.start_date);

    const endDate =
      normalizeString(form.end_date);

    const rentAmount =
      normalizeString(form.rent_amount);

    const status =
      normalizeString(form.status);

    /*
    |--------------------------------------------------------------------------
    | PROPERTY
    |--------------------------------------------------------------------------
    */

    if (!propertyId) {
      nextErrors.property_id =
        "Please select a property.";
    }

    /*
    |--------------------------------------------------------------------------
    | APARTMENT
    |--------------------------------------------------------------------------
    */

    if (!apartmentId) {
      nextErrors.apartment_id =
        "Please select an apartment.";
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT
    |--------------------------------------------------------------------------
    */

    if (!unitId) {
      nextErrors.unit_id =
        "Please select a unit.";
    }

    /*
    |--------------------------------------------------------------------------
    | TENANT
    |--------------------------------------------------------------------------
    */

    if (!tenantId) {
      nextErrors.tenant_id =
        "Please select a tenant.";
    }

    /*
    |--------------------------------------------------------------------------
    | START DATE
    |--------------------------------------------------------------------------
    */

    if (!startDate) {
      nextErrors.start_date =
        "Start date is required.";
    }

    /*
    |--------------------------------------------------------------------------
    | END DATE
    |--------------------------------------------------------------------------
    */

    if (
      endDate &&
      startDate &&
      endDate < startDate
    ) {
      nextErrors.end_date =
        "End date cannot be before the start date.";
    }

    /*
    |--------------------------------------------------------------------------
    | RENT
    |--------------------------------------------------------------------------
    */

    if (!rentAmount) {
      nextErrors.rent_amount =
        "Rent amount is required.";
    } else if (
      Number.isNaN(
        Number(form.rent_amount)
      )
    ) {
      nextErrors.rent_amount =
        "Enter a valid rent amount.";
    } else if (
      Number(form.rent_amount) < 0
    ) {
      nextErrors.rent_amount =
        "Rent amount cannot be negative.";
    }

    /*
    |--------------------------------------------------------------------------
    | DEPOSIT
    |--------------------------------------------------------------------------
    */

    if (
      form.deposit_amount !== "" &&
      Number.isNaN(
        Number(form.deposit_amount)
      )
    ) {
      nextErrors.deposit_amount =
        "Enter a valid deposit amount.";
    } else if (
      form.deposit_amount !== "" &&
      Number(form.deposit_amount) < 0
    ) {
      nextErrors.deposit_amount =
        "Deposit amount cannot be negative.";
    }

    /*
    |--------------------------------------------------------------------------
    | SERVICE CHARGE
    |--------------------------------------------------------------------------
    */

    if (
      form.service_charge !== "" &&
      Number.isNaN(
        Number(form.service_charge)
      )
    ) {
      nextErrors.service_charge =
        "Enter a valid service charge.";
    } else if (
      form.service_charge !== "" &&
      Number(form.service_charge) < 0
    ) {
      nextErrors.service_charge =
        "Service charge cannot be negative.";
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (!status) {
      nextErrors.status =
        "Please select tenancy status.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length ===
      0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BUILD PAYLOAD
  |--------------------------------------------------------------------------
  */

  const buildPayload = () => {
    return {
      property_id:
        form.property_id
          ? Number(form.property_id)
          : null,

      apartment_id:
        form.apartment_id
          ? Number(form.apartment_id)
          : null,

      unit_id:
        form.unit_id
          ? Number(form.unit_id)
          : null,

      tenant_id:
        form.tenant_id
          ? Number(form.tenant_id)
          : null,

      /*
      |--------------------------------------------------------------------------
      | TENANCY NUMBER
      |--------------------------------------------------------------------------
      |
      | Leave empty/null when creating if the Laravel backend generates it.
      |
      */

      tenancy_number:
        normalizeString(
          form.tenancy_number
        ) || null,

      start_date:
        form.start_date || null,

      end_date:
        form.end_date || null,

      rent_amount:
        form.rent_amount !== ""
          ? Number(form.rent_amount)
          : null,

      deposit_amount:
        form.deposit_amount !== ""
          ? Number(form.deposit_amount)
          : null,

      service_charge:
        form.service_charge !== ""
          ? Number(form.service_charge)
          : null,

      payment_frequency:
        form.payment_frequency ||
        "monthly",

      status:
        form.status || "active",

      notes:
        normalizeString(
          form.notes
        ) || null,
    };
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

    const valid = validate();

    if (!valid) {
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
  | SERVER ERROR MESSAGE
  |--------------------------------------------------------------------------
  */

  const externalErrorMessage =
    typeof error === "string"
      ? error
      : error?.message ||
      error?.error ||
      "";

  const displayedServerError =
    serverError ||
    externalErrorMessage;

  /*
  |--------------------------------------------------------------------------
  | HAS ERRORS
  |--------------------------------------------------------------------------
  */

  const hasErrors =
    Object.keys(errors).length >
    0;

  /*
  |--------------------------------------------------------------------------
  | FORM COMPLETION
  |--------------------------------------------------------------------------
  */

  const completion = useMemo(() => {
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

  /*
  |--------------------------------------------------------------------------
  | FORM TITLE
  |--------------------------------------------------------------------------
  */

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

          <p className="text-sm text-gray-500">
            Loading tenancy...
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
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      {/* ================================================================
          HEADER
      ================================================================= */}

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
                      {displayedServerError}
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
                              {message}
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

      {/* ================================================================
          TENANCY ASSIGNMENT
      ================================================================= */}

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
                    property.id,
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
                    ? "Select apartment"
                    : "Select property first",
              },

              ...filteredApartments.map(
                (apartment) => ({
                  value:
                    apartment.id,
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
                    ? "Select unit"
                    : "Select apartment first",
              },

              ...filteredUnits.map(
                (unit) => ({
                  value:
                    unit.id,
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
                    tenant.id,
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
              placeholder="e.g. TEN-DZEL20TI"
              hint="The tenancy number assigned to this tenancy."
            />
          )}
        </div>
      </section>

      {/* ================================================================
          TENANCY PERIOD
      ================================================================= */}

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

      {/* ================================================================
          FINANCIAL INFORMATION
      ================================================================= */}

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
                value: "monthly",
                label: "Monthly",
              },
              {
                value: "quarterly",
                label: "Quarterly",
              },
              {
                value: "biannual",
                label: "Biannual",
              },
              {
                value: "annual",
                label: "Annual",
              },
            ]}
          />
        </div>
      </section>

      {/* ================================================================
          STATUS
      ================================================================= */}

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
                value: "active",
                label: "Active",
              },
              {
                value: "pending",
                label: "Pending",
              },
              {
                value: "inactive",
                label: "Inactive",
              },
              {
                value: "terminated",
                label:
                  "Terminated",
              },
              {
                value: "expired",
                label: "Expired",
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

      {/* ================================================================
          NOTES
      ================================================================= */}

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

      {/* ================================================================
          ACTIONS
      ================================================================= */}

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
              focus:outline-none
              focus:ring-2
              focus:ring-gray-400/20
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
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500/30
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
          value={value ?? ""}
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
            ${hasError
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
          value={value ?? ""}
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
            (option) => (
              <option
                key={String(
                  option.value
                )}
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
| TEXTAREA FIELD
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
        value={value ?? ""}
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

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default TenancyForm;