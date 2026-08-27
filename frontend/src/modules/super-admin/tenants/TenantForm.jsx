import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| DEFAULT FORM
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We use user_id to connect the tenant profile to an existing user account.
|
| We DO NOT use tenant_id when creating a tenant.
|
*/

const DEFAULT_FORM = {
  user_id: "",

  first_name: "",
  last_name: "",
  email: "",
  phone: "",

  id_number: "",
  passport_number: "",

  gender: "",
  date_of_birth: "",

  nationality: "Kenyan",

  country: "",
  region: "",
  county: "",
  city: "",
  area: "",
  address: "",

  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",

  occupation: "",
  employer: "",

  status: "pending",

  is_active: true,
  is_verified: false,

  notes: "",
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeBoolean = (value, fallback = false) => {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE" ||
    value === "yes" ||
    value === "YES"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false" ||
    value === "FALSE" ||
    value === "no" ||
    value === "NO"
  ) {
    return false;
  }

  return fallback;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  const stringValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

const getValue = (source, ...keys) => {
  for (const key of keys) {
    const value = source?.[key];

    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| GET USER ID
|--------------------------------------------------------------------------
|
| Supports:
|
| user_id
| id
| user.id
|
*/

const getUserId = (tenant) => {
  if (!tenant) {
    return "";
  }

  if (
    tenant.user_id !== undefined &&
    tenant.user_id !== null
  ) {
    return String(tenant.user_id);
  }

  if (
    tenant.user?.id !== undefined &&
    tenant.user?.id !== null
  ) {
    return String(tenant.user.id);
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| EXTRACT NESTED LOCATION VALUE
|--------------------------------------------------------------------------
*/

const getLocationValue = (
  tenant,
  objectKey,
  ...fallbackKeys
) => {
  const nestedValue = tenant?.[objectKey];

  if (
    nestedValue &&
    typeof nestedValue === "object"
  ) {
    return normalizeString(
      nestedValue.name ??
      nestedValue.label ??
      nestedValue.value
    );
  }

  return normalizeString(
    getValue(
      tenant,
      ...fallbackKeys,
      objectKey
    )
  );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE TENANT
|--------------------------------------------------------------------------
*/

const normalizeTenant = (tenant = {}) => {
  /*
  |--------------------------------------------------------------------------
  | EMERGENCY CONTACT
  |--------------------------------------------------------------------------
  */

  const emergencyContact =
    tenant?.emergency_contact &&
      typeof tenant.emergency_contact === "object"
      ? tenant.emergency_contact
      : {};

  /*
  |--------------------------------------------------------------------------
  | USER
  |--------------------------------------------------------------------------
  */

  const user =
    tenant?.user &&
      typeof tenant.user === "object"
      ? tenant.user
      : {};

  return {
    /*
    |--------------------------------------------------------------------------
    | USER ACCOUNT
    |--------------------------------------------------------------------------
    */

    user_id: getUserId(tenant),

    /*
    |--------------------------------------------------------------------------
    | PERSONAL INFORMATION
    |--------------------------------------------------------------------------
    */

    first_name: normalizeString(
      getValue(
        tenant,
        "first_name",
        "firstName"
      ) ||
      getValue(
        user,
        "first_name",
        "firstName"
      )
    ),

    last_name: normalizeString(
      getValue(
        tenant,
        "last_name",
        "lastName"
      ) ||
      getValue(
        user,
        "last_name",
        "lastName"
      )
    ),

    email: normalizeString(
      getValue(
        tenant,
        "email"
      ) ||
      getValue(
        user,
        "email"
      )
    ),

    phone: normalizeString(
      getValue(
        tenant,
        "phone",
        "phone_number"
      ) ||
      getValue(
        user,
        "phone",
        "phone_number"
      )
    ),

    id_number: normalizeString(
      getValue(
        tenant,
        "id_number",
        "national_id",
        "national_id_number"
      )
    ),

    passport_number: normalizeString(
      getValue(
        tenant,
        "passport_number",
        "passport"
      )
    ),

    gender: normalizeString(
      getValue(
        tenant,
        "gender"
      )
    ),

    date_of_birth: formatDateForInput(
      getValue(
        tenant,
        "date_of_birth",
        "dob",
        "birth_date"
      )
    ),

    nationality:
      normalizeString(
        getValue(
          tenant,
          "nationality"
        )
      ) || "Kenyan",

    /*
    |--------------------------------------------------------------------------
    | ADDRESS
    |--------------------------------------------------------------------------
    */

    country: getLocationValue(
      tenant,
      "country",
      "country_name"
    ),

    region: getLocationValue(
      tenant,
      "region",
      "region_name"
    ),

    county: getLocationValue(
      tenant,
      "county",
      "county_name"
    ),

    city: getLocationValue(
      tenant,
      "city",
      "city_name"
    ),

    area: getLocationValue(
      tenant,
      "area",
      "area_name"
    ),

    address: normalizeString(
      getValue(
        tenant,
        "address",
        "street_address",
        "residential_address"
      )
    ),

    /*
    |--------------------------------------------------------------------------
    | EMERGENCY CONTACT
    |--------------------------------------------------------------------------
    */

    emergency_contact_name:
      normalizeString(
        getValue(
          tenant,
          "emergency_contact_name"
        ) ||
        getValue(
          emergencyContact,
          "name",
          "full_name",
          "contact_name"
        )
      ),

    emergency_contact_phone:
      normalizeString(
        getValue(
          tenant,
          "emergency_contact_phone"
        ) ||
        getValue(
          emergencyContact,
          "phone",
          "phone_number",
          "contact_phone"
        )
      ),

    emergency_contact_relationship:
      normalizeString(
        getValue(
          tenant,
          "emergency_contact_relationship"
        ) ||
        getValue(
          emergencyContact,
          "relationship",
          "relation"
        )
      ),

    /*
    |--------------------------------------------------------------------------
    | EMPLOYMENT
    |--------------------------------------------------------------------------
    */

    occupation: normalizeString(
      getValue(
        tenant,
        "occupation"
      )
    ),

    employer: normalizeString(
      getValue(
        tenant,
        "employer",
        "company"
      )
    ),

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT
    |--------------------------------------------------------------------------
    */

    status:
      normalizeString(
        getValue(
          tenant,
          "status",
          "tenant_status"
        )
      ) || "pending",

    is_active: normalizeBoolean(
      tenant?.is_active,
      true
    ),

    is_verified: normalizeBoolean(
      tenant?.is_verified,
      false
    ),

    notes: normalizeString(
      getValue(
        tenant,
        "notes"
      )
    ),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE USER OPTION
|--------------------------------------------------------------------------
|
| Supports different API structures.
|
*/

const normalizeUserOption = (user = {}) => {
  const id =
    user?.id ??
    user?.user_id ??
    "";

  const firstName =
    user?.first_name ??
    user?.firstName ??
    user?.user?.first_name ??
    user?.user?.firstName ??
    "";

  const lastName =
    user?.last_name ??
    user?.lastName ??
    user?.user?.last_name ??
    user?.user?.lastName ??
    "";

  const email =
    user?.email ??
    user?.user?.email ??
    "";

  const phone =
    user?.phone ??
    user?.phone_number ??
    user?.user?.phone ??
    user?.user?.phone_number ??
    "";

  const name = `${firstName} ${lastName}`.trim();

  return {
    id: id !== "" ? String(id) : "",
    first_name: normalizeString(firstName),
    last_name: normalizeString(lastName),
    email: normalizeString(email),
    phone: normalizeString(phone),
    name: name || email || `User #${id}`,
  };
};

/*
|--------------------------------------------------------------------------
| BUILD INITIAL FORM
|--------------------------------------------------------------------------
*/

const buildInitialForm = (
  tenant,
  isEdit,
  initialValues
) => {
  const normalizedTenant =
    isEdit
      ? normalizeTenant(tenant)
      : {};

  return {
    ...DEFAULT_FORM,
    ...normalizedTenant,
    ...(initialValues || {}),

    /*
    |--------------------------------------------------------------------------
    | Always normalize user_id to string for select compatibility.
    |--------------------------------------------------------------------------
    */

    user_id: String(
      initialValues?.user_id ??
      normalizedTenant?.user_id ??
      ""
    ),
  };
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const TenantForm = ({
  tenant = null,

  /*
  |--------------------------------------------------------------------------
  | Existing users with tenant role.
  |
  | Parent should pass:
  |
  | users={tenantUsers}
  |--------------------------------------------------------------------------
  */

  users = [],

  mode = "create",

  loading = false,
  submitting = false,

  error = null,

  initialValues = {},

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
    Boolean(tenant?.id);

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [form, setForm] =
    useState(() =>
      buildInitialForm(
        tenant,
        isEdit,
        initialValues
      )
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDATION ERRORS
  |--------------------------------------------------------------------------
  */

  const [errors, setErrors] =
    useState({});

  /*
  |--------------------------------------------------------------------------
  | SERVER ERROR
  |--------------------------------------------------------------------------
  */

  const [serverError, setServerError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE USERS
  |--------------------------------------------------------------------------
  */

  const normalizedUsers = useMemo(() => {
    if (!Array.isArray(users)) {
      return [];
    }

    return users
      .map(normalizeUserOption)
      .filter((user) => user.id !== "");
  }, [users]);

  /*
  |--------------------------------------------------------------------------
  | RESET WHEN TENANT / MODE CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setForm(
      buildInitialForm(
        tenant,
        isEdit,
        initialValues
      )
    );

    setErrors({});
    setServerError("");
  }, [
    tenant?.id,
    tenant?.user_id,
    mode,
    isEdit,
  ]);

  /*
  |--------------------------------------------------------------------------
  | EXTERNAL ERROR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!error) {
      return;
    }

    if (typeof error === "string") {
      setServerError(error);
      return;
    }

    const message =
      error?.message ||
      error?.error ||
      error?.errors?.message ||
      "Something went wrong. Please check the form and try again.";

    setServerError(
      typeof message === "string"
        ? message
        : "Something went wrong. Please check the form and try again."
    );
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    const nextValue =
      type === "checkbox"
        ? checked
        : value;

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

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
  | HANDLE USER CHANGE
  |--------------------------------------------------------------------------
  |
  | When an existing tenant user is selected, we automatically populate:
  |
  | first_name
  | last_name
  | email
  | phone
  |
  */

  const handleUserChange = (event) => {
    const userId = event.target.value;

    const selectedUser =
      normalizedUsers.find(
        (user) =>
          String(user.id) === String(userId)
      );

    setForm((current) => ({
      ...current,

      user_id: userId,

      ...(selectedUser
        ? {
          first_name:
            selectedUser.first_name ||
            current.first_name,

          last_name:
            selectedUser.last_name ||
            current.last_name,

          email:
            selectedUser.email ||
            current.email,

          phone:
            selectedUser.phone ||
            current.phone,
        }
        : {}),
    }));

    setErrors((current) => {
      const next = {
        ...current,
      };

      delete next.user_id;

      return next;
    });

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | SET FIELD
  |--------------------------------------------------------------------------
  */

  const setField = (
    name,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

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
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    const nextErrors = {};

    const userId =
      normalizeString(
        form.user_id
      );

    const firstName =
      normalizeString(
        form.first_name
      );

    const lastName =
      normalizeString(
        form.last_name
      );

    const email =
      normalizeString(
        form.email
      );

    const phone =
      normalizeString(
        form.phone
      );

    const idNumber =
      normalizeString(
        form.id_number
      );

    const passportNumber =
      normalizeString(
        form.passport_number
      );

    const emergencyName =
      normalizeString(
        form.emergency_contact_name
      );

    const emergencyPhone =
      normalizeString(
        form.emergency_contact_phone
      );

    const emergencyRelationship =
      normalizeString(
        form.emergency_contact_relationship
      );

    /*
    |--------------------------------------------------------------------------
    | USER ACCOUNT
    |--------------------------------------------------------------------------
    */

    if (!userId) {
      nextErrors.user_id =
        "Please select a tenant user account.";
    }

    /*
    |--------------------------------------------------------------------------
    | FIRST NAME
    |--------------------------------------------------------------------------
    */

    if (!firstName) {
      nextErrors.first_name =
        "First name is required.";
    } else if (
      firstName.length < 2
    ) {
      nextErrors.first_name =
        "First name must be at least 2 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | LAST NAME
    |--------------------------------------------------------------------------
    */

    if (!lastName) {
      nextErrors.last_name =
        "Last name is required.";
    } else if (
      lastName.length < 2
    ) {
      nextErrors.last_name =
        "Last name must be at least 2 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | EMAIL
    |--------------------------------------------------------------------------
    */

    if (!email) {
      nextErrors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    /*
    |--------------------------------------------------------------------------
    | PHONE
    |--------------------------------------------------------------------------
    */

    if (!phone) {
      nextErrors.phone =
        "Phone number is required.";
    } else if (
      phone.length < 7
    ) {
      nextErrors.phone =
        "Enter a valid phone number.";
    }

    /*
    |--------------------------------------------------------------------------
    | ID / PASSPORT
    |--------------------------------------------------------------------------
    */

    if (
      !idNumber &&
      !passportNumber
    ) {
      nextErrors.id_number =
        "National ID or passport number is required.";
    }

    /*
    |--------------------------------------------------------------------------
    | GENDER
    |--------------------------------------------------------------------------
    */

    if (!form.gender) {
      nextErrors.gender =
        "Please select gender.";
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (!form.status) {
      nextErrors.status =
        "Please select tenant status.";
    }

    /*
    |--------------------------------------------------------------------------
    | EMERGENCY CONTACT
    |--------------------------------------------------------------------------
    |
    | 0 fields = valid
    | 3 fields = valid
    | 1 or 2 fields = invalid
    |
    */

    const hasEmergencyContact =
      Boolean(
        emergencyName ||
        emergencyPhone ||
        emergencyRelationship
      );

    if (hasEmergencyContact) {
      if (!emergencyName) {
        nextErrors.emergency_contact_name =
          "Emergency contact name is required.";
      }

      if (!emergencyPhone) {
        nextErrors.emergency_contact_phone =
          "Emergency contact phone is required.";
      }

      if (!emergencyRelationship) {
        nextErrors.emergency_contact_relationship =
          "Emergency contact relationship is required.";
      }
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BUILD PAYLOAD
  |--------------------------------------------------------------------------
  */

  const buildPayload = () => {
    const emergencyName =
      normalizeString(
        form.emergency_contact_name
      );

    const emergencyPhone =
      normalizeString(
        form.emergency_contact_phone
      );

    const emergencyRelationship =
      normalizeString(
        form.emergency_contact_relationship
      );

    const hasEmergencyContact =
      Boolean(
        emergencyName ||
        emergencyPhone ||
        emergencyRelationship
      );

    const payload = {
      /*
      |--------------------------------------------------------------------------
      | USER RELATION
      |--------------------------------------------------------------------------
      |
      | This is the important field.
      |
      | DO NOT send tenant_id here.
      |
      */

      user_id: form.user_id
        ? Number(form.user_id)
        : null,

      /*
      |--------------------------------------------------------------------------
      | PERSONAL INFORMATION
      |--------------------------------------------------------------------------
      */

      first_name:
        normalizeString(
          form.first_name
        ),

      last_name:
        normalizeString(
          form.last_name
        ),

      email:
        normalizeString(
          form.email
        ),

      phone:
        normalizeString(
          form.phone
        ),

      id_number:
        normalizeString(
          form.id_number
        ) || null,

      passport_number:
        normalizeString(
          form.passport_number
        ) || null,

      gender:
        normalizeString(
          form.gender
        ) || null,

      date_of_birth:
        form.date_of_birth
          ? formatDateForInput(
            form.date_of_birth
          )
          : null,

      nationality:
        normalizeString(
          form.nationality
        ) || null,

      /*
      |--------------------------------------------------------------------------
      | ADDRESS
      |--------------------------------------------------------------------------
      */

      country:
        normalizeString(
          form.country
        ) || null,

      region:
        normalizeString(
          form.region
        ) || null,

      county:
        normalizeString(
          form.county
        ) || null,

      city:
        normalizeString(
          form.city
        ) || null,

      area:
        normalizeString(
          form.area
        ) || null,

      address:
        normalizeString(
          form.address
        ) || null,

      /*
      |--------------------------------------------------------------------------
      | EMERGENCY CONTACT
      |--------------------------------------------------------------------------
      */

      emergency_contact_name:
        hasEmergencyContact
          ? emergencyName
          : null,

      emergency_contact_phone:
        hasEmergencyContact
          ? emergencyPhone
          : null,

      emergency_contact_relationship:
        hasEmergencyContact
          ? emergencyRelationship
          : null,

      /*
      |--------------------------------------------------------------------------
      | EMPLOYMENT
      |--------------------------------------------------------------------------
      */

      occupation:
        normalizeString(
          form.occupation
        ) || null,

      employer:
        normalizeString(
          form.employer
        ) || null,

      /*
      |--------------------------------------------------------------------------
      | ACCOUNT
      |--------------------------------------------------------------------------
      */

      status:
        normalizeString(
          form.status
        ) || "pending",

      is_active:
        normalizeBoolean(
          form.is_active,
          true
        ),

      is_verified:
        normalizeBoolean(
          form.is_verified,
          false
        ),

      notes:
        normalizeString(
          form.notes
        ) || null,
    };

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

    const isValid = validate();

    if (!isValid) {
      return;
    }

    if (
      typeof onSubmit !==
      "function"
    ) {
      setServerError(
        "Unable to submit the form."
      );

      return;
    }

    const payload =
      buildPayload();

    try {
      await onSubmit(
        payload,
        tenant
      );
    } catch (submitError) {
      const message =
        submitError?.response
          ?.data?.message ||
        submitError?.message ||
        "Failed to save tenant. Please try again.";

      setServerError(message);

      throw submitError;
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
  | FORM TITLE
  |--------------------------------------------------------------------------
  */

  const formTitle = isEdit
    ? "Update Tenant"
    : "Create Tenant";

  const submitLabel = isEdit
    ? "Update Tenant"
    : "Create Tenant";

  /*
  |--------------------------------------------------------------------------
  | FIELD ERROR
  |--------------------------------------------------------------------------
  */

  const fieldError = (
    field
  ) => errors?.[field];

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
      "user_id",
      "first_name",
      "last_name",
      "email",
      "phone",
      "gender",
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
            Loading tenant...
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
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {formTitle}
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                {isEdit
                  ? "Update tenant information and account details."
                  : "Add a new tenant to your estate management system."}
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

        {(serverError ||
          hasErrors) && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-4 sm:px-6">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Please check the form
                  </p>

                  {serverError && (
                    <p className="mt-1 text-sm text-red-700">
                      {serverError}
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
          TENANT USER ACCOUNT
      ================================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <UserRound className="h-5 w-5" />
          }
          title="Tenant User Account"
          description="Select an existing user account that has the tenant role."
        />

        <div className="p-5 sm:p-6">
          <SelectField
            label="Tenant User"
            name="user_id"
            value={form.user_id}
            onChange={handleUserChange}
            error={fieldError(
              "user_id"
            )}
            required
            disabled={
              submitting ||
              (isEdit &&
                Boolean(
                  form.user_id
                ))
            }
            options={[
              {
                value: "",
                label:
                  normalizedUsers.length
                    ? "Select tenant user"
                    : "No tenant users available",
              },

              ...normalizedUsers.map(
                (user) => ({
                  value: user.id,

                  label:
                    user.name +
                    (user.email
                      ? ` — ${user.email}`
                      : ""),
                })
              ),
            ]}
          />

          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <p className="text-xs leading-5 text-blue-700">
                Only select a user who already has the{" "}
                <strong>tenant</strong>{" "}
                role. The selected user's ID will be
                stored as <strong>user_id</strong> on
                the tenant profile.
              </p>
            </div>
          </div>

          {normalizedUsers.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              No tenant users were provided. Create
              or assign users the tenant role first,
              then return here.
            </p>
          )}
        </div>
      </section>

      {/* ================================================================
          PERSONAL INFORMATION
      ================================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <User className="h-5 w-5" />
          }
          title="Personal Information"
          description="Basic identification and personal details."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={fieldError(
              "first_name"
            )}
            required
            placeholder="e.g. John"
            autoComplete="given-name"
          />

          <InputField
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            error={fieldError(
              "last_name"
            )}
            required
            placeholder="e.g. Kamau"
            autoComplete="family-name"
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={fieldError(
              "email"
            )}
            required
            placeholder="tenant@example.com"
            icon={
              <Mail className="h-4 w-4" />
            }
            autoComplete="email"
          />

          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            error={fieldError(
              "phone"
            )}
            required
            placeholder="e.g. 0712345678"
            icon={
              <Phone className="h-4 w-4" />
            }
            autoComplete="tel"
          />

          <InputField
            label="National ID Number"
            name="id_number"
            value={form.id_number}
            onChange={handleChange}
            error={fieldError(
              "id_number"
            )}
            placeholder="e.g. 12345678"
            hint="Provide either National ID or Passport number."
          />

          <InputField
            label="Passport Number"
            name="passport_number"
            value={
              form.passport_number
            }
            onChange={handleChange}
            placeholder="e.g. A12345678"
          />

          <SelectField
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            error={fieldError(
              "gender"
            )}
            required
            options={[
              {
                value: "",
                label:
                  "Select gender",
              },
              {
                value: "male",
                label: "Male",
              },
              {
                value: "female",
                label: "Female",
              },
              {
                value: "other",
                label: "Other",
              },
            ]}
          />

          <InputField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={
              form.date_of_birth
            }
            onChange={handleChange}
            icon={
              <CalendarDays className="h-4 w-4" />
            }
          />

          <InputField
            label="Nationality"
            name="nationality"
            value={
              form.nationality
            }
            onChange={handleChange}
            placeholder="e.g. Kenyan"
            icon={
              <Globe2 className="h-4 w-4" />
            }
          />
        </div>
      </section>

      {/* ================================================================
          ADDRESS & LOCATION
      ================================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <MapPin className="h-5 w-5" />
          }
          title="Address & Location"
          description="Tenant residence and location information."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          <InputField
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="e.g. Kenya"
          />

          <InputField
            label="Region"
            name="region"
            value={form.region}
            onChange={handleChange}
            placeholder="e.g. Nairobi Region"
          />

          <InputField
            label="County"
            name="county"
            value={form.county}
            onChange={handleChange}
            placeholder="e.g. Nairobi"
          />

          <InputField
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="e.g. Nairobi"
          />

          <InputField
            label="Area"
            name="area"
            value={form.area}
            onChange={handleChange}
            placeholder="e.g. Westlands"
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <TextAreaField
              label="Residential Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter the tenant's residential address..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* ================================================================
          EMPLOYMENT
      ================================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <FileText className="h-5 w-5" />
          }
          title="Employment Information"
          description="Optional employment and occupation details."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="Occupation"
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            placeholder="e.g. Software Engineer"
          />

          <InputField
            label="Employer / Company"
            name="employer"
            value={form.employer}
            onChange={handleChange}
            placeholder="e.g. ABC Technologies Ltd"
          />
        </div>
      </section>

      {/* ================================================================
          EMERGENCY CONTACT
      ================================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <Phone className="h-5 w-5" />
          }
          title="Emergency Contact"
          description="Leave all fields empty if the tenant does not have an emergency contact."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="Contact Name"
            name="emergency_contact_name"
            value={
              form.emergency_contact_name
            }
            onChange={handleChange}
            error={fieldError(
              "emergency_contact_name"
            )}
            placeholder="e.g. Jane Kamau"
          />

          <InputField
            label="Contact Phone"
            name="emergency_contact_phone"
            type="tel"
            value={
              form.emergency_contact_phone
            }
            onChange={handleChange}
            error={fieldError(
              "emergency_contact_phone"
            )}
            placeholder="e.g. 0712345678"
          />

          <InputField
            label="Relationship"
            name="emergency_contact_relationship"
            value={
              form.emergency_contact_relationship
            }
            onChange={handleChange}
            error={fieldError(
              "emergency_contact_relationship"
            )}
            placeholder="e.g. Spouse, Parent, Sibling"
          />
        </div>
      </section>

      {/* ================================================================
          ACCOUNT SETTINGS
      ================================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
          title="Account Settings"
          description="Manage tenant status, activity and verification."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <SelectField
            label="Tenant Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            error={fieldError(
              "status"
            )}
            required
            options={[
              {
                value: "pending",
                label: "Pending",
              },
              {
                value: "active",
                label: "Active",
              },
              {
                value: "inactive",
                label: "Inactive",
              },
              {
                value: "blacklisted",
                label:
                  "Blacklisted",
              },
            ]}
          />

          <ToggleField
            label="Active Account"
            description="Allow this tenant account to remain active."
            name="is_active"
            checked={
              form.is_active
            }
            onChange={handleChange}
          />

          <ToggleField
            label="Verified Tenant"
            description="Mark this tenant as identity verified."
            name="is_verified"
            checked={
              form.is_verified
            }
            onChange={handleChange}
          />
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
          description="Optional notes about this tenant."
        />

        <div className="p-5 sm:p-6">
          <TextAreaField
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Enter any additional notes about this tenant..."
            rows={5}
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
            onClick={handleCancel}
            disabled={submitting}
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
              submitting ||
              loading
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
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={hasError}
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

      {error && (
        <p
          id={`${name}-error`}
          className="flex items-center gap-1 text-xs text-red-600"
        >
          <AlertCircle className="h-3.5 w-3.5" />

          {error}
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
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={hasError}
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
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />

          {error}
        </p>
      )}
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
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={hasError}
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

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />

          {error}
        </p>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| TOGGLE FIELD
|--------------------------------------------------------------------------
*/

const ToggleField = ({
  label,
  description,
  name,
  checked = false,
  onChange,
}) => {
  return (
    <label
      htmlFor={name}
      className="
        flex
        cursor-pointer
        items-center
        justify-between
        gap-4
        rounded-xl
        border
        border-gray-200
        bg-gray-50
        p-4
        transition
        hover:bg-gray-100
      "
    >
      <div>
        <p className="text-sm font-medium text-gray-800">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <div className="relative shrink-0">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={Boolean(
            checked
          )}
          onChange={onChange}
          className="peer sr-only"
        />

        <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500/30" />

        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </div>
    </label>
  );
};

export default TenantForm;
