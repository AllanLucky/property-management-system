import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Save,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_FORM = {
  tenancy_id: "",

  /*
   * Lease type describes the structure of the agreement.
   *
   * Supported backend values:
   * - fixed_term
   * - month_to_month
   * - renewal
   */
  lease_type: "fixed_term",

  start_date: "",
  end_date: "",

  rent_amount: "",
  deposit_amount: "",
  service_charge: "",
  late_fee: "",

  /*
   * Payment frequency describes how often rent is payable.
   */
  payment_frequency: "monthly",
  due_day: "1",

  notice_period_days: "30",

  status: "draft",

  signed_at: "",

  termination_reason: "",

  document: null,

  notes: "",
};

/*
|--------------------------------------------------------------------------
| Lease Type Options
|--------------------------------------------------------------------------
|
| These values must match the backend API/database values.
|
*/

const LEASE_TYPE_OPTIONS = [
  {
    value: "fixed_term",
    label: "Fixed Term",
    description:
      "A lease with a clearly defined start date and end date.",
  },
  {
    value: "month_to_month",
    label: "Month to Month",
    description:
      "A recurring lease that continues monthly until it is terminated.",
  },
  {
    value: "renewal",
    label: "Renewal",
    description:
      "A renewed lease agreement extending an existing tenancy arrangement.",
  },
];

/*
|--------------------------------------------------------------------------
| Payment Frequency Options
|--------------------------------------------------------------------------
|
| These values must match the backend API/database values.
|
*/

const PAYMENT_FREQUENCY_OPTIONS = [
  {
    value: "daily",
    label: "Daily",
    description:
      "Rent is payable every day.",
  },
  {
    value: "weekly",
    label: "Weekly",
    description:
      "Rent is payable every week.",
  },
  {
    value: "monthly",
    label: "Monthly",
    description:
      "Rent is payable every month.",
  },
  {
    value: "quarterly",
    label: "Quarterly",
    description:
      "Rent is payable every three months.",
  },
  {
    value: "semi_annually",
    label: "Semi-Annual",
    description:
      "Rent is payable every six months.",
  },
  {
    value: "annually",
    label: "Annual",
    description:
      "Rent is payable once every twelve months.",
  },
  {
    value: "one_time",
    label: "One-Time",
    description:
      "A single payment is required for the lease period.",
  },
];

const STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];


const normalizeDate = (value) => {
  if (!value) {
    return "";
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return "";
  }

  if (stringValue.includes("T")) {
    return stringValue.split("T")[0];
  }

  if (stringValue.includes(" ")) {
    return stringValue.split(" ")[0];
  }

  return stringValue.substring(0, 10);
};

/**
 * Normalize numeric API values for controlled inputs.
 */
const normalizeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  return String(value);
};

/**
 * Safely convert an object-like value into a string.
 *
 * This prevents React errors such as:
 *
 * "Objects are not valid as a React child"
 */
const normalizeDisplayValue = (
  value,
  fallback = "",
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.label ||
      value.name ||
      value.title ||
      value.value ||
      value.reference ||
      value.number ||
      fallback
    );
  }

  return fallback;
};


const normalizeLeaseType = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "object") {
    value =
      value.value ??
      value.code ??
      value.type ??
      value.name ??
      value.label ??
      "";
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    fixed: "fixed_term",
    fixedterm: "fixed_term",
    fixed_term: "fixed_term",

    month_to_month: "month_to_month",
    monthtomonth: "month_to_month",
    month_month: "month_to_month",
    monthly: "month_to_month",

    renewal: "renewal",
    renewed: "renewal",
  };

  return aliases[normalized] ?? normalized;
};

/**
 * Normalize payment frequency values returned by the API.
 *
 * Handles both backend values and common display variations.
 */
const normalizePaymentFrequency = (
  value,
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "object") {
    value =
      value.value ??
      value.code ??
      value.frequency ??
      value.name ??
      value.label ??
      "";
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    daily: "daily",

    weekly: "weekly",

    monthly: "monthly",
    month: "monthly",

    quarterly: "quarterly",
    quarter: "quarterly",

    semi_annually: "semi_annually",
    semi_annual: "semi_annually",
    semiannual: "semi_annually",
    biannual: "semi_annually",
    bi_annually: "semi_annually",

    annually: "annually",
    annual: "annually",
    yearly: "annually",
    year: "annually",

    one_time: "one_time",
    onetime: "one_time",
    once: "one_time",
  };

  return (
    aliases[normalized] ??
    normalized
  );
};

/**
 * Convert an API lease object into the form structure.
 *
 * IMPORTANT:
 *
 * Financial values come directly from the lease.
 * We do not fall back to tenancy financial values.
 */
const normalizeLease = (lease) => {
  if (!lease) {
    return {
      ...DEFAULT_FORM,
    };
  }

  return {
    tenancy_id:
      lease.tenancy_id ??
      lease.tenancy?.id ??
      "",

    lease_type: normalizeLeaseType(
      lease.lease_type ??
      lease.leaseType ??
      lease.type ??
      DEFAULT_FORM.lease_type,
    ),

    start_date: normalizeDate(
      lease.start_date,
    ),

    end_date: normalizeDate(
      lease.end_date,
    ),

    rent_amount: normalizeNumber(
      lease.rent_amount,
    ),

    deposit_amount: normalizeNumber(
      lease.deposit_amount,
    ),

    service_charge: normalizeNumber(
      lease.service_charge,
    ),

    late_fee: normalizeNumber(
      lease.late_fee,
    ),

    payment_frequency:
      normalizePaymentFrequency(
        lease.payment_frequency ??
        lease.paymentFrequency ??
        lease.frequency ??
        DEFAULT_FORM.payment_frequency,
      ),

    due_day:
      lease.due_day !== null &&
        lease.due_day !== undefined
        ? String(lease.due_day)
        : DEFAULT_FORM.due_day,

    notice_period_days:
      lease.notice_period_days !== null &&
        lease.notice_period_days !== undefined
        ? String(
          lease.notice_period_days,
        )
        : DEFAULT_FORM.notice_period_days,

    status:
      normalizeDisplayValue(
        lease.status,
        DEFAULT_FORM.status,
      ),

    signed_at: normalizeDate(
      lease.signed_at,
    ),

    termination_reason:
      typeof lease.termination_reason ===
        "string"
        ? lease.termination_reason
        : "",

    /*
     * Existing documents are not converted
     * into a File object.
     *
     * A new File is created only when the
     * user chooses a replacement document.
     */
    document: null,

    notes:
      typeof lease.notes === "string"
        ? lease.notes
        : "",
  };
};

/**
 * Resolve a human-readable tenancy number.
 */
const getTenancyNumber = (tenancy) => {
  if (!tenancy) {
    return "";
  }

  return (
    normalizeDisplayValue(
      tenancy.tenancy_number,
    ) ||
    normalizeDisplayValue(
      tenancy.number,
    ) ||
    normalizeDisplayValue(
      tenancy.reference,
    ) ||
    (tenancy.id
      ? `Tenancy #${tenancy.id}`
      : "")
  );
};

/**
 * Resolve tenant name from tenant or linked user data.
 */
const getTenantName = (tenancy) => {
  if (!tenancy) {
    return "Tenant not specified";
  }

  const tenant =
    tenancy.tenant ||
    tenancy.tenant_details ||
    null;

  const user =
    tenancy.user ||
    tenant?.user ||
    tenant?.user_account ||
    null;

  if (
    typeof tenant?.full_name ===
    "string" &&
    tenant.full_name.trim()
  ) {
    return tenant.full_name;
  }

  if (tenant) {
    const fullName = [
      tenant.first_name,
      tenant.other_names,
      tenant.last_name,
    ]
      .map((value) =>
        normalizeDisplayValue(value),
      )
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }
  }

  if (
    typeof user?.full_name ===
    "string" &&
    user.full_name.trim()
  ) {
    return user.full_name;
  }

  const userFullName = [
    user?.first_name,
    user?.last_name,
  ]
    .map((value) =>
      normalizeDisplayValue(value),
    )
    .filter(Boolean)
    .join(" ")
    .trim();

  if (userFullName) {
    return userFullName;
  }

  return "Tenant not specified";
};

/**
 * Resolve property name.
 */
const getPropertyName = (tenancy) => {
  if (!tenancy) {
    return "Property not specified";
  }

  const property =
    tenancy.property ||
    tenancy.property_details ||
    null;

  return (
    normalizeDisplayValue(
      property?.name,
    ) ||
    normalizeDisplayValue(
      property?.property_name,
    ) ||
    normalizeDisplayValue(
      property?.title,
    ) ||
    (tenancy.property_id
      ? `Property #${tenancy.property_id}`
      : "Property not specified")
  );
};

/**
 * Resolve apartment name.
 */
const getApartmentName = (tenancy) => {
  if (!tenancy) {
    return "—";
  }

  const apartment =
    tenancy.apartment ||
    tenancy.apartment_details ||
    null;

  return (
    normalizeDisplayValue(
      apartment?.name,
    ) ||
    normalizeDisplayValue(
      apartment?.apartment_name,
    ) ||
    normalizeDisplayValue(
      apartment?.title,
    ) ||
    normalizeDisplayValue(
      apartment?.full_name,
    ) ||
    (tenancy.apartment_id
      ? `Apartment #${tenancy.apartment_id}`
      : "—")
  );
};

/**
 * Resolve unit name.
 */
const getUnitName = (tenancy) => {
  if (!tenancy) {
    return "—";
  }

  const unit =
    tenancy.unit ||
    tenancy.unit_details ||
    null;

  return (
    normalizeDisplayValue(
      unit?.full_unit_name,
    ) ||
    normalizeDisplayValue(
      unit?.unit_name,
    ) ||
    normalizeDisplayValue(
      unit?.name,
    ) ||
    normalizeDisplayValue(
      unit?.unit_number,
    ) ||
    (tenancy.unit_id
      ? `Unit #${tenancy.unit_id}`
      : "—")
  );
};

/**
 * Extract a readable server error message.
 */
const getServerErrorMessage = (
  error,
  fallback = "Please review the form and try again.",
) => {
  if (!error) {
    return fallback;
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  if (
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error.error === "string" &&
    error.error.trim()
  ) {
    return error.error;
  }

  if (
    typeof error.response?.data?.message ===
    "string" &&
    error.response.data.message.trim()
  ) {
    return error.response.data.message;
  }

  if (
    typeof error.data?.message === "string" &&
    error.data.message.trim()
  ) {
    return error.data.message;
  }

  return fallback;
};

/**
 * Convert backend validation errors into a flat object.
 */
const normalizeServerErrors = (
  serverErrors,
) => {
  if (
    !serverErrors ||
    typeof serverErrors !== "object" ||
    Array.isArray(serverErrors)
  ) {
    return {};
  }

  const normalized = {};

  Object.entries(serverErrors).forEach(
    ([field, value]) => {
      if (Array.isArray(value)) {
        const firstMessage = value.find(
          (item) =>
            typeof item === "string" &&
            item.trim(),
        );

        if (firstMessage) {
          normalized[field] =
            firstMessage;
        }

        return;
      }

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        normalized[field] = value;
      }
    },
  );

  return normalized;
};

/**
 * Format an amount as Kenyan Shillings.
 */
const formatCurrency = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "KES 0.00";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "KES 0.00";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/*
|--------------------------------------------------------------------------
| Reusable Form Components
|--------------------------------------------------------------------------
*/

function FormField({
  label,
  name,
  required = false,
  error,
  hint,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}

        {required && (
          <span
            className="ml-1 text-red-500"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}

      {error && (
        <p
          className="mt-1.5 flex items-start gap-1 text-xs leading-5 text-red-600 dark:text-red-400"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function Input({
  className = "",
  ...props
}) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:disabled:bg-gray-900 ${className}`}
    />
  );
}

function Select({
  className = "",
  children,
  ...props
}) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-900 ${className}`}
      >
        {children}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    </div>
  );
}

function Textarea({
  className = "",
  ...props
}) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:disabled:bg-gray-900 ${className}`}
    />
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Icon
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function SelectedTenancyCard({
  tenancy,
}) {
  if (!tenancy) {
    return null;
  }

  const tenantName =
    getTenantName(tenancy);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
          <CheckCircle2
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Selected Tenancy
          </p>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {getTenancyNumber(tenancy)}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-gray-500 dark:text-gray-500">
                Tenant
              </p>

              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {tenantName}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-500">
                Property
              </p>

              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {getPropertyName(tenancy)}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-500">
                Apartment
              </p>

              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {getApartmentName(tenancy)}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-500">
                Unit
              </p>

              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {getUnitName(tenancy)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Main Lease Form
|--------------------------------------------------------------------------
*/

export default function LeaseForm({
  lease = null,
  tenancies = [],
  loadingTenancies = false,

  submitting = false,
  loading = false,

  serverError = null,
  serverErrors = null,

  submitLabel,

  onSubmit,
  onCancel,

  isEdit = false,

  tenancyReadOnly = false,

  leaseNumberReadOnly = false,
}) {
  const isEditMode =
    Boolean(isEdit || lease?.id);

  /*
   * Lease number is generated/protected by
   * the backend and is intentionally not
   * rendered by this form.
   */
  void leaseNumberReadOnly;

  const isSubmitting =
    Boolean(submitting || loading);

  const isTenancyReadOnly =
    Boolean(
      tenancyReadOnly || isEditMode,
    );

  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState(() =>
    normalizeLease(lease),
  );

  const [errors, setErrors] = useState({});

  const [documentName, setDocumentName] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Synchronize Edit Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setForm(normalizeLease(lease));
    setErrors({});
    setDocumentName("");
  }, [lease]);

  /*
  |--------------------------------------------------------------------------
  | Merge Validation Errors
  |--------------------------------------------------------------------------
  */

  const normalizedServerErrors =
    normalizeServerErrors(
      serverErrors,
    );

  const mergedErrors = {
    ...normalizedServerErrors,
    ...errors,
  };

  /*
  |--------------------------------------------------------------------------
  | Tenancy Options
  |--------------------------------------------------------------------------
  */

  const selectedTenancyId = String(
    form.tenancy_id || "",
  );

  const tenancyList = Array.isArray(
    tenancies,
  )
    ? tenancies.filter(Boolean)
    : [];

  const tenancyExists =
    tenancyList.some(
      (tenancy) =>
        String(tenancy?.id) ===
        selectedTenancyId,
    );

  let normalizedTenancies =
    tenancyList;

  /*
   * Preserve selected tenancy in edit mode
   * even when it is not in the current list.
   */
  if (
    form.tenancy_id &&
    !tenancyExists &&
    lease?.tenancy
  ) {
    normalizedTenancies = [
      lease.tenancy,
      ...tenancyList,
    ];
  }

  const selectedTenancy =
    form.tenancy_id
      ? normalizedTenancies.find(
        (tenancy) =>
          String(tenancy?.id) ===
          String(form.tenancy_id),
      ) ||
      lease?.tenancy ||
      null
      : null;

  /*
  |--------------------------------------------------------------------------
  | Selected Configuration Descriptions
  |--------------------------------------------------------------------------
  */

  const selectedLeaseType =
    LEASE_TYPE_OPTIONS.find(
      (option) =>
        option.value ===
        form.lease_type,
    );

  const selectedPaymentFrequency =
    PAYMENT_FREQUENCY_OPTIONS.find(
      (option) =>
        option.value ===
        form.payment_frequency,
    );

  /*
  |--------------------------------------------------------------------------
  | Field Change Handler
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => {
        const next = {
          ...previous,
        };

        delete next[name];

        return next;
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Tenancy Change Handler
  |--------------------------------------------------------------------------
  */

  const handleTenancyChange = (
    event,
  ) => {
    if (isTenancyReadOnly) {
      return;
    }

    const value =
      event.target.value;

    setForm((previous) => ({
      ...previous,
      tenancy_id: value,
    }));

    if (errors.tenancy_id) {
      setErrors((previous) => {
        const next = {
          ...previous,
        };

        delete next.tenancy_id;

        return next;
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Document Handler
  |--------------------------------------------------------------------------
  */

  const handleDocumentChange = (
    event,
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      setForm((previous) => ({
        ...previous,
        document: null,
      }));

      setDocumentName("");

      return;
    }

    if (
      !ALLOWED_DOCUMENT_TYPES.includes(
        file.type,
      )
    ) {
      setErrors((previous) => ({
        ...previous,
        document:
          "Only PDF, DOC and DOCX documents are allowed.",
      }));

      event.target.value = "";

      return;
    }

    if (
      file.size > MAX_DOCUMENT_SIZE
    ) {
      setErrors((previous) => ({
        ...previous,
        document:
          "The lease document must not exceed 10 MB.",
      }));

      event.target.value = "";

      return;
    }

    setForm((previous) => ({
      ...previous,
      document: file,
    }));

    setDocumentName(file.name);

    setErrors((previous) => {
      const next = {
        ...previous,
      };

      delete next.document;

      return next;
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Client Validation
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    const validationErrors = {};

    /*
     * Tenancy
     */
    if (!form.tenancy_id) {
      validationErrors.tenancy_id =
        "Please select a tenancy.";
    }

    /*
     * Lease Type
     */
    if (
      !LEASE_TYPE_OPTIONS.some(
        (option) =>
          option.value ===
          form.lease_type,
      )
    ) {
      validationErrors.lease_type =
        "Please select a valid lease type.";
    }

    /*
     * Dates
     */
    if (!form.start_date) {
      validationErrors.start_date =
        "Start date is required.";
    }

    if (!form.end_date) {
      validationErrors.end_date =
        "End date is required.";
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date <
      form.start_date
    ) {
      validationErrors.end_date =
        "End date must be on or after the start date.";
    }

    /*
     * Rent
     */
    const rentAmount = Number(
      form.rent_amount,
    );

    if (
      form.rent_amount === "" ||
      !Number.isFinite(rentAmount) ||
      rentAmount < 0
    ) {
      validationErrors.rent_amount =
        "Please enter a valid rent amount.";
    }

    /*
     * Deposit
     */
    const depositAmount = Number(
      form.deposit_amount,
    );

    if (
      form.deposit_amount === "" ||
      !Number.isFinite(depositAmount) ||
      depositAmount < 0
    ) {
      validationErrors.deposit_amount =
        "Please enter a valid deposit amount.";
    }

    /*
     * Service Charge
     */
    if (form.service_charge !== "") {
      const serviceCharge = Number(
        form.service_charge,
      );

      if (
        !Number.isFinite(
          serviceCharge,
        ) ||
        serviceCharge < 0
      ) {
        validationErrors.service_charge =
          "Service charge cannot be negative.";
      }
    }

    /*
     * Late Fee
     */
    if (form.late_fee !== "") {
      const lateFee = Number(
        form.late_fee,
      );

      if (
        !Number.isFinite(lateFee) ||
        lateFee < 0
      ) {
        validationErrors.late_fee =
          "Late fee cannot be negative.";
      }
    }

    /*
     * Payment Frequency
     */
    if (
      !PAYMENT_FREQUENCY_OPTIONS.some(
        (option) =>
          option.value ===
          form.payment_frequency,
      )
    ) {
      validationErrors.payment_frequency =
        "Please select a valid payment frequency.";
    }

    /*
     * Due Day
     */
    const dueDay = Number(
      form.due_day,
    );

    if (
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 31
    ) {
      validationErrors.due_day =
        "Due day must be between 1 and 31.";
    }

    /*
     * Notice Period
     */
    const noticePeriod = Number(
      form.notice_period_days,
    );

    if (
      !Number.isInteger(
        noticePeriod,
      ) ||
      noticePeriod < 0
    ) {
      validationErrors.notice_period_days =
        "Notice period must be a valid number of days.";
    }

    /*
     * Status
     */
    if (
      !STATUS_OPTIONS.some(
        (option) =>
          option.value ===
          form.status,
      )
    ) {
      validationErrors.status =
        "Please select a valid lease status.";
    }

    /*
     * Termination Reason
     */
    if (
      form.status === "terminated" &&
      !form.termination_reason.trim()
    ) {
      validationErrors.termination_reason =
        "A termination reason is required when the lease is terminated.";
    }

    setErrors(
      validationErrors,
    );

    return (
      Object.keys(
        validationErrors,
      ).length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Build Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = () => {
    const payload = {
      lease_type:
        form.lease_type,

      start_date:
        form.start_date,

      end_date:
        form.end_date,

      rent_amount:
        form.rent_amount === ""
          ? null
          : Number(
            form.rent_amount,
          ),

      deposit_amount:
        form.deposit_amount === ""
          ? null
          : Number(
            form.deposit_amount,
          ),

      service_charge:
        form.service_charge === ""
          ? 0
          : Number(
            form.service_charge,
          ),

      late_fee:
        form.late_fee === ""
          ? 0
          : Number(
            form.late_fee,
          ),

      payment_frequency:
        form.payment_frequency,

      due_day:
        form.due_day === ""
          ? null
          : Number(
            form.due_day,
          ),

      notice_period_days:
        form.notice_period_days === ""
          ? null
          : Number(
            form.notice_period_days,
          ),

      status:
        form.status,

      signed_at:
        form.signed_at || null,

      termination_reason:
        form.termination_reason?.trim() ||
        null,

      notes:
        form.notes?.trim() ||
        null,
    };

    /*
     * CREATE ONLY
     *
     * tenancy_id must not be included
     * in update requests.
     */
    if (!isEditMode) {
      payload.tenancy_id = Number(
        form.tenancy_id,
      );
    }

    /*
     * Optional document.
     */
    if (form.document) {
      payload.document =
        form.document;
    }

    return payload;
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setErrors({});

    if (!validate()) {
      return;
    }

    const payload =
      buildPayload();

    if (import.meta.env.DEV) {
      console.debug(
        `Lease ${isEditMode
          ? "update"
          : "create"
        } payload:`,
        payload,
      );
    }

    try {
      await onSubmit?.(payload);
    } catch (submitError) {
      console.error(
        "Lease form submission failed:",
        submitError,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Financial Preview
  |--------------------------------------------------------------------------
  */

  const totalInitialAmount =
    Number(
      form.rent_amount || 0,
    ) +
    Number(
      form.deposit_amount || 0,
    ) +
    Number(
      form.service_charge || 0,
    );

  /*
  |--------------------------------------------------------------------------
  | Existing Agreement
  |--------------------------------------------------------------------------
  */

  const existingAgreement =
    lease?.agreement || null;

  const hasExistingAgreement =
    Boolean(
      existingAgreement?.has_agreement ||
      existingAgreement?.file ||
      lease?.document_path ||
      lease?.agreement_file,
    );

  const existingDocumentName =
    normalizeDisplayValue(
      lease?.document_path,
    ) ||
    normalizeDisplayValue(
      lease?.agreement_file,
    ) ||
    normalizeDisplayValue(
      existingAgreement?.file,
    ) ||
    "";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      {/* ================================================================== */}
      {/* Server Error                                                       */}
      {/* ================================================================== */}

      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Unable to save lease
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-400">
                {getServerErrorMessage(
                  serverError,
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Tenancy                                                             */}
      {/* ================================================================== */}

      <SectionCard
        title="Tenancy"
        description={
          isTenancyReadOnly
            ? "The tenancy associated with this lease cannot be changed."
            : "Select the existing tenancy this lease belongs to."
        }
        icon={FileText}
      >
        <div className="space-y-4">
          <FormField
            label="Tenancy"
            name="tenancy_id"
            required
            error={
              mergedErrors.tenancy_id
            }
            hint={
              isTenancyReadOnly
                ? "Tenancy is protected after a lease has been created."
                : "A lease must be attached to an existing tenancy."
            }
          >
            <Select
              id="tenancy_id"
              name="tenancy_id"
              value={form.tenancy_id}
              onChange={
                handleTenancyChange
              }
              disabled={
                isSubmitting ||
                loadingTenancies ||
                isTenancyReadOnly
              }
              aria-invalid={Boolean(
                mergedErrors.tenancy_id,
              )}
              aria-readonly={
                isTenancyReadOnly
              }
            >
              <option value="">
                {loadingTenancies
                  ? "Loading tenancies..."
                  : "Select tenancy"}
              </option>

              {normalizedTenancies.map(
                (tenancy) => (
                  <option
                    key={tenancy.id}
                    value={tenancy.id}
                  >
                    {getTenancyNumber(
                      tenancy,
                    )}{" "}
                    —{" "}
                    {getTenantName(
                      tenancy,
                    )}{" "}
                    —{" "}
                    {getPropertyName(
                      tenancy,
                    )}
                  </option>
                ),
              )}
            </Select>
          </FormField>

          {isTenancyReadOnly && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />

                <p className="text-xs leading-5 text-blue-700 dark:text-blue-300">
                  The tenancy relationship is
                  protected and cannot be changed
                  during a lease update.
                </p>
              </div>
            </div>
          )}

          {loadingTenancies && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />

              <span>
                Loading available
                tenancies...
              </span>
            </div>
          )}

          {!loadingTenancies &&
            normalizedTenancies.length ===
            0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />

                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                      No tenancies
                      available
                    </p>

                    <p className="mt-1 text-sm leading-6 text-yellow-700 dark:text-yellow-400">
                      Create or activate a
                      tenancy before
                      creating a lease.
                    </p>
                  </div>
                </div>
              </div>
            )}

          <SelectedTenancyCard
            tenancy={
              selectedTenancy
            }
          />
        </div>
      </SectionCard>

      {/* ================================================================== */}
      {/* Lease Configuration                                                 */}
      {/* ================================================================== */}

      <SectionCard
        title="Lease Configuration"
        description="Define the agreement structure, lease period and payment schedule."
        icon={Calendar}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Lease Type */}
          <FormField
            label="Lease Type"
            name="lease_type"
            required
            error={
              mergedErrors.lease_type
            }
            hint="Choose the structure of the lease agreement."
          >
            <Select
              id="lease_type"
              name="lease_type"
              value={form.lease_type}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                mergedErrors.lease_type,
              )}
            >
              <option value="">
                Select lease type
              </option>

              {LEASE_TYPE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </Select>

            {selectedLeaseType?.description && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                  {
                    selectedLeaseType.description
                  }
                </p>
              </div>
            )}
          </FormField>

          {/* Status */}
          <FormField
            label="Status"
            name="status"
            required
            error={
              mergedErrors.status
            }
            hint={
              isEditMode
                ? "Lifecycle actions may also be handled separately from the lease edit form."
                : "New leases normally start as draft."
            }
          >
            <Select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                mergedErrors.status,
              )}
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </Select>
          </FormField>

          {/* Start Date */}
          <FormField
            label="Start Date"
            name="start_date"
            required
            error={
              mergedErrors.start_date
            }
          >
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                mergedErrors.start_date,
              )}
            />
          </FormField>

          {/* End Date */}
          <FormField
            label="End Date"
            name="end_date"
            required
            error={
              mergedErrors.end_date
            }
          >
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={form.end_date}
              min={
                form.start_date ||
                undefined
              }
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                mergedErrors.end_date,
              )}
            />
          </FormField>

          {/* Payment Frequency */}
          <FormField
            label="Payment Frequency"
            name="payment_frequency"
            required
            error={
              mergedErrors.payment_frequency
            }
            hint="Choose how frequently the tenant is required to make rent payments."
          >
            <Select
              id="payment_frequency"
              name="payment_frequency"
              value={
                form.payment_frequency
              }
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                mergedErrors.payment_frequency,
              )}
            >
              <option value="">
                Select payment frequency
              </option>

              {PAYMENT_FREQUENCY_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </Select>

            {selectedPaymentFrequency?.description && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                  {
                    selectedPaymentFrequency.description
                  }
                </p>
              </div>
            )}
          </FormField>

          {/* Due Day */}
          <FormField
            label="Payment Due Day"
            name="due_day"
            required
            error={
              mergedErrors.due_day
            }
            hint={
              form.payment_frequency ===
                "monthly"
                ? "For monthly payments, use the calendar day on which rent is due."
                : "Enter a calendar day from 1 to 31 where applicable."
            }
          >
            <Input
              id="due_day"
              name="due_day"
              type="number"
              min="1"
              max="31"
              step="1"
              inputMode="numeric"
              value={form.due_day}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="1"
              aria-invalid={Boolean(
                mergedErrors.due_day,
              )}
            />
          </FormField>

          {/* Notice Period */}
          <FormField
            label="Notice Period"
            name="notice_period_days"
            required
            error={
              mergedErrors.notice_period_days
            }
            hint="Number of days required before termination or non-renewal."
          >
            <div className="relative">
              <Input
                id="notice_period_days"
                name="notice_period_days"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={
                  form.notice_period_days
                }
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="30"
                className="pr-16"
                aria-invalid={Boolean(
                  mergedErrors.notice_period_days,
                )}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                days
              </span>
            </div>
          </FormField>

          {/* Signed Date */}
          <FormField
            label="Signed Date"
            name="signed_at"
            error={
              mergedErrors.signed_at
            }
            hint="Optional. This is normally populated when the lease is formally signed."
          >
            <Input
              id="signed_at"
              name="signed_at"
              type="date"
              value={form.signed_at}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(
                mergedErrors.signed_at,
              )}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* ================================================================== */}
      {/* Financial Terms                                                     */}
      {/* ================================================================== */}

      <SectionCard
        title="Financial Terms"
        description="Configure the financial obligations defined by this lease."
        icon={FileText}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Rent */}
          <FormField
            label="Rent Amount"
            name="rent_amount"
            required
            error={
              mergedErrors.rent_amount
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                KES
              </span>

              <Input
                id="rent_amount"
                name="rent_amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.rent_amount}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="0.00"
                className="pl-12"
                aria-invalid={Boolean(
                  mergedErrors.rent_amount,
                )}
              />
            </div>
          </FormField>

          {/* Deposit */}
          <FormField
            label="Deposit Amount"
            name="deposit_amount"
            required
            error={
              mergedErrors.deposit_amount
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                KES
              </span>

              <Input
                id="deposit_amount"
                name="deposit_amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={
                  form.deposit_amount
                }
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="0.00"
                className="pl-12"
                aria-invalid={Boolean(
                  mergedErrors.deposit_amount,
                )}
              />
            </div>
          </FormField>

          {/* Service Charge */}
          <FormField
            label="Service Charge"
            name="service_charge"
            error={
              mergedErrors.service_charge
            }
            hint="Enter 0 if there is no service charge."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                KES
              </span>

              <Input
                id="service_charge"
                name="service_charge"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={
                  form.service_charge
                }
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="0.00"
                className="pl-12"
                aria-invalid={Boolean(
                  mergedErrors.service_charge,
                )}
              />
            </div>
          </FormField>

          {/* Late Fee */}
          <FormField
            label="Late Fee"
            name="late_fee"
            error={
              mergedErrors.late_fee
            }
            hint="Amount charged when a payment is made after the applicable due date."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                KES
              </span>

              <Input
                id="late_fee"
                name="late_fee"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.late_fee}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="0.00"
                className="pl-12"
                aria-invalid={Boolean(
                  mergedErrors.late_fee,
                )}
              />
            </div>
          </FormField>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Initial Financial
                Commitment
              </p>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Rent + deposit +
                service charge
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(
                totalInitialAmount,
              )}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ================================================================== */}
      {/* Document                                                            */}
      {/* ================================================================== */}

      <SectionCard
        title="Lease Document"
        description="Optionally upload the signed lease agreement."
        icon={FileText}
      >
        <div className="space-y-4">
          <FormField
            label="Lease Document"
            name="document"
            error={
              mergedErrors.document
            }
            hint="Accepted formats: PDF, DOC and DOCX. Maximum size: 10 MB."
          >
            <input
              id="document"
              name="document"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={
                handleDocumentChange
              }
              disabled={isSubmitting}
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:px-4 file:py-2.5 file:text-sm file:font-medium hover:file:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:file:border-gray-700 dark:file:bg-gray-900 dark:hover:file:bg-gray-800"
              aria-invalid={Boolean(
                mergedErrors.document,
              )}
            />
          </FormField>

          {documentName && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/20">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />

              <div className="min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  New document selected
                </p>

                <p className="mt-1 truncate text-xs text-green-700 dark:text-green-400">
                  {documentName}
                </p>

                {isEditMode &&
                  hasExistingAgreement && (
                    <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                      Saving will replace the
                      current agreement.
                    </p>
                  )}
              </div>
            </div>
          )}

          {isEditMode &&
            hasExistingAgreement &&
            !documentName && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Current Agreement
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                      Agreement uploaded
                    </p>

                    {existingDocumentName && (
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {existingDocumentName}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Select a new document above
                      if you want to replace the
                      existing agreement.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {isEditMode &&
            !hasExistingAgreement &&
            !documentName && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      No agreement uploaded
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      You can upload the lease agreement
                      using the field above.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </SectionCard>

      {/* ================================================================== */}
      {/* Termination Information                                             */}
      {/* ================================================================== */}

      {(form.status ===
        "terminated" ||
        form.termination_reason) && (
          <SectionCard
            title="Termination Information"
            description="Provide the reason if this lease is being terminated."
            icon={AlertCircle}
          >
            <FormField
              label="Termination Reason"
              name="termination_reason"
              required={
                form.status ===
                "terminated"
              }
              error={
                mergedErrors.termination_reason
              }
            >
              <Textarea
                id="termination_reason"
                name="termination_reason"
                rows={4}
                value={
                  form.termination_reason
                }
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter the reason for termination..."
                aria-invalid={Boolean(
                  mergedErrors.termination_reason,
                )}
              />
            </FormField>
          </SectionCard>
        )}

      {/* ================================================================== */}
      {/* Notes                                                               */}
      {/* ================================================================== */}

      <SectionCard
        title="Notes"
        description="Add any additional information relevant to this lease."
        icon={FileText}
      >
        <FormField
          label="Notes"
          name="notes"
          error={
            mergedErrors.notes
          }
        >
          <Textarea
            id="notes"
            name="notes"
            rows={5}
            value={form.notes}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="Enter lease notes..."
          />
        </FormField>
      </SectionCard>

      {/* ================================================================== */}
      {/* Form Actions                                                        */}
      {/* ================================================================== */}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <X
              className="h-4 w-4"
              aria-hidden="true"
            />

            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              loadingTenancies ||
              normalizedTenancies.length ===
              0
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />

                Saving...
              </>
            ) : (
              <>
                <Save
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {submitLabel ||
                  (isEditMode
                    ? "Update Lease"
                    : "Create Lease")}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}