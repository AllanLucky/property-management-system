import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  FileImage,
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
| STABLE EMPTY VALUES
|--------------------------------------------------------------------------
*/

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/*
|--------------------------------------------------------------------------
| DEFAULT FORM
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| user_id refers to an EXISTING users.id.
|
| This form does NOT create a new user account.
|
*/

const DEFAULT_FORM = {
  /*
  |--------------------------------------------------------------------------
  | USER ACCOUNT
  |--------------------------------------------------------------------------
  */

  user_id: "",

  /*
  |--------------------------------------------------------------------------
  | PERSONAL INFORMATION
  |--------------------------------------------------------------------------
  */

  first_name: "",
  last_name: "",
  other_names: "",

  email: "",
  phone: "",

  id_number: "",
  passport_number: "",
  gender: "",
  date_of_birth: "",
  nationality: "Kenyan",

  /*
  |--------------------------------------------------------------------------
  | ADDRESS & LOCATION
  |--------------------------------------------------------------------------
  */

  country: "",
  region: "",
  county: "",
  city: "",
  area: "",
  postal_code: "",
  address: "",

  /*
  |--------------------------------------------------------------------------
  | EMERGENCY CONTACT
  |--------------------------------------------------------------------------
  */

  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",

  /*
  |--------------------------------------------------------------------------
  | EMPLOYMENT
  |--------------------------------------------------------------------------
  */

  occupation: "",
  employer: "",
  monthly_income: "",

  /*
  |--------------------------------------------------------------------------
  | DOCUMENTS / MEDIA
  |--------------------------------------------------------------------------
  */

  photo: "",
  id_front: "",
  id_back: "",

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT
  |--------------------------------------------------------------------------
  */

  status: "pending",
  is_active: true,
  is_verified: false,

  /*
  |--------------------------------------------------------------------------
  | NOTES
  |--------------------------------------------------------------------------
  */

  notes: "",
};

/*
|--------------------------------------------------------------------------
| NORMALIZE BOOLEAN
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

/*
|--------------------------------------------------------------------------
| NORMALIZE STRING
|--------------------------------------------------------------------------
|
| Prevents:
|
| Objects are not valid as a React child
|
*/

const normalizeString = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return normalizeString(
      value?.name ??
      value?.label ??
      value?.value ??
      value?.title ??
      value?.text ??
      ""
    );
  }

  return String(value).trim();
};

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

const formatDateForInput = (
  value
) => {
  if (!value) {
    return "";
  }

  const stringValue =
    String(value).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {
    return stringValue;
  }

  const date =
    new Date(stringValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .split("T")[0];
};

/*
|--------------------------------------------------------------------------
| SAFE VALUE
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
    const value =
      source[key];

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
*/

const getUserId = (
  tenant
) => {
  if (
    !tenant ||
    typeof tenant !== "object"
  ) {
    return "";
  }

  if (
    tenant.user_id !== undefined &&
    tenant.user_id !== null
  ) {
    return String(
      tenant.user_id
    );
  }

  if (
    tenant.user?.id !== undefined &&
    tenant.user?.id !== null
  ) {
    return String(
      tenant.user.id
    );
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| LOCATION VALUE
|--------------------------------------------------------------------------
*/

const getLocationValue = (
  tenant,
  objectKey,
  ...fallbackKeys
) => {
  if (
    !tenant ||
    typeof tenant !== "object"
  ) {
    return "";
  }

  const nestedValue =
    tenant?.[objectKey];

  if (
    nestedValue &&
    typeof nestedValue === "object"
  ) {
    return normalizeString(
      nestedValue?.name ??
      nestedValue?.label ??
      nestedValue?.value ??
      nestedValue?.title ??
      ""
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

const normalizeTenant = (
  tenant = {}
) => {
  const safeTenant =
    tenant &&
    typeof tenant === "object"
      ? tenant
      : {};

  const user =
    safeTenant?.user &&
    typeof safeTenant.user === "object"
      ? safeTenant.user
      : {};

  const emergencyContact =
    safeTenant?.emergency_contact &&
    typeof safeTenant.emergency_contact === "object"
      ? safeTenant.emergency_contact
      : {};

  return {
    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    user_id:
      getUserId(
        safeTenant
      ),

    /*
    |--------------------------------------------------------------------------
    | PERSONAL
    |--------------------------------------------------------------------------
    */

    first_name:
      normalizeString(
        getValue(
          safeTenant,
          "first_name",
          "firstName"
        ) ||
        getValue(
          user,
          "first_name",
          "firstName"
        )
      ),

    last_name:
      normalizeString(
        getValue(
          safeTenant,
          "last_name",
          "lastName"
        ) ||
        getValue(
          user,
          "last_name",
          "lastName"
        )
      ),

    other_names:
      normalizeString(
        getValue(
          safeTenant,
          "other_names",
          "otherNames"
        )
      ),

    email:
      normalizeString(
        getValue(
          safeTenant,
          "email"
        ) ||
        getValue(
          user,
          "email"
        )
      ),

    phone:
      normalizeString(
        getValue(
          safeTenant,
          "phone",
          "phone_number"
        ) ||
        getValue(
          user,
          "phone",
          "phone_number"
        )
      ),

    id_number:
      normalizeString(
        getValue(
          safeTenant,
          "id_number",
          "national_id",
          "national_id_number"
        )
      ),

    passport_number:
      normalizeString(
        getValue(
          safeTenant,
          "passport_number",
          "passport"
        )
      ),

    gender:
      normalizeString(
        getValue(
          safeTenant,
          "gender"
        )
      ).toLowerCase(),

    date_of_birth:
      formatDateForInput(
        getValue(
          safeTenant,
          "date_of_birth",
          "dob",
          "birth_date"
        )
      ),

    nationality:
      normalizeString(
        getValue(
          safeTenant,
          "nationality"
        )
      ) || "Kenyan",

    /*
    |--------------------------------------------------------------------------
    | ADDRESS
    |--------------------------------------------------------------------------
    */

    country:
      getLocationValue(
        safeTenant,
        "country",
        "country_name"
      ),

    region:
      getLocationValue(
        safeTenant,
        "region",
        "region_name"
      ),

    county:
      getLocationValue(
        safeTenant,
        "county",
        "county_name"
      ),

    city:
      getLocationValue(
        safeTenant,
        "city",
        "city_name"
      ),

    area:
      getLocationValue(
        safeTenant,
        "area",
        "area_name"
      ),

    postal_code:
      normalizeString(
        getValue(
          safeTenant,
          "postal_code",
          "zip_code"
        )
      ),

    address:
      normalizeString(
        getValue(
          safeTenant,
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
          safeTenant,
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
          safeTenant,
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
          safeTenant,
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

    occupation:
      normalizeString(
        getValue(
          safeTenant,
          "occupation"
        )
      ),

    employer:
      normalizeString(
        getValue(
          safeTenant,
          "employer",
          "company"
        )
      ),

    monthly_income:
      getValue(
        safeTenant,
        "monthly_income",
        "income"
      ),

    /*
    |--------------------------------------------------------------------------
    | DOCUMENTS
    |--------------------------------------------------------------------------
    */

    photo:
      normalizeString(
        getValue(
          safeTenant,
          "photo"
        )
      ),

    id_front:
      normalizeString(
        getValue(
          safeTenant,
          "id_front"
        )
      ),

    id_back:
      normalizeString(
        getValue(
          safeTenant,
          "id_back"
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
          safeTenant,
          "status",
          "tenant_status"
        )
      ).toLowerCase() ||
      "pending",

    is_active:
      normalizeBoolean(
        safeTenant?.is_active,
        true
      ),

    is_verified:
      normalizeBoolean(
        safeTenant?.is_verified,
        false
      ),

    /*
    |--------------------------------------------------------------------------
    | NOTES
    |--------------------------------------------------------------------------
    */

    notes:
      normalizeString(
        getValue(
          safeTenant,
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
| Backend:
|
| {
|   id: 4,
|   first_name: "Allan",
|   last_name: "Nonda",
|   name: "Allan Nonda",
|   email: "allantsory.dev@gmail.com",
|   phone: "0792491361"
| }
|
*/

const normalizeUserOption = (
  user = {}
) => {
  const safeUser =
    user &&
    typeof user === "object"
      ? user
      : {};

  const nestedUser =
    safeUser?.user &&
    typeof safeUser.user === "object"
      ? safeUser.user
      : {};

  const id =
    safeUser?.id ??
    safeUser?.user_id ??
    nestedUser?.id ??
    "";

  const firstName =
    safeUser?.first_name ??
    safeUser?.firstName ??
    nestedUser?.first_name ??
    nestedUser?.firstName ??
    "";

  const lastName =
    safeUser?.last_name ??
    safeUser?.lastName ??
    nestedUser?.last_name ??
    nestedUser?.lastName ??
    "";

  const email =
    safeUser?.email ??
    nestedUser?.email ??
    "";

  const phone =
    safeUser?.phone ??
    safeUser?.phone_number ??
    nestedUser?.phone ??
    nestedUser?.phone_number ??
    "";

  const suppliedName =
    safeUser?.name ??
    safeUser?.full_name ??
    safeUser?.fullName ??
    nestedUser?.name ??
    nestedUser?.full_name ??
    nestedUser?.fullName ??
    "";

  const safeFirstName =
    normalizeString(
      firstName
    );

  const safeLastName =
    normalizeString(
      lastName
    );

  const safeEmail =
    normalizeString(
      email
    );

  const safePhone =
    normalizeString(
      phone
    );

  const safeSuppliedName =
    normalizeString(
      suppliedName
    );

  const generatedName =
    `${safeFirstName} ${safeLastName}`
      .trim();

  const safeId =
    id !== "" &&
    id !== null &&
    id !== undefined
      ? String(id)
      : "";

  const name =
    safeSuppliedName ||
    generatedName ||
    safeEmail ||
    (
      safeId
        ? `User #${safeId}`
        : "Unnamed User"
    );

  return {
    ...safeUser,

    id: safeId,

    user_id:
      safeId,

    first_name:
      safeFirstName,

    last_name:
      safeLastName,

    email:
      safeEmail,

    phone:
      safePhone,

    name,
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE USER COLLECTION
|--------------------------------------------------------------------------
*/

const normalizeUserCollection = (
  users
) => {
  if (
    !Array.isArray(users)
  ) {
    return [];
  }

  const normalized =
    users
      .map(
        normalizeUserOption
      )
      .filter(
        (user) =>
          Boolean(user.id)
      );

  const uniqueUsers =
    new Map();

  normalized.forEach(
    (user) => {
      uniqueUsers.set(
        String(user.id),
        user
      );
    }
  );

  return Array.from(
    uniqueUsers.values()
  );
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
      ? normalizeTenant(
          tenant
        )
      : {};

  const safeInitialValues =
    initialValues &&
    typeof initialValues === "object"
      ? initialValues
      : {};

  const form = {
    ...DEFAULT_FORM,

    ...(isEdit
      ? normalizedTenant
      : {}),

    ...safeInitialValues,
  };

  /*
  |--------------------------------------------------------------------------
  | USER ID
  |--------------------------------------------------------------------------
  */

  form.user_id =
    String(
      safeInitialValues?.user_id ??
      normalizedTenant?.user_id ??
      ""
    );

  /*
  |--------------------------------------------------------------------------
  | BOOLEAN VALUES
  |--------------------------------------------------------------------------
  */

  form.is_active =
    normalizeBoolean(
      form.is_active,
      true
    );

  form.is_verified =
    normalizeBoolean(
      form.is_verified,
      false
    );

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  form.date_of_birth =
    formatDateForInput(
      form.date_of_birth
    );

  /*
  |--------------------------------------------------------------------------
  | STRING FIELDS
  |--------------------------------------------------------------------------
  */

  const stringFields = [
    "first_name",
    "last_name",
    "other_names",
    "email",
    "phone",
    "id_number",
    "passport_number",
    "gender",
    "nationality",
    "country",
    "region",
    "county",
    "city",
    "area",
    "postal_code",
    "address",
    "emergency_contact_name",
    "emergency_contact_phone",
    "emergency_contact_relationship",
    "occupation",
    "employer",
    "photo",
    "id_front",
    "id_back",
    "status",
    "notes",
  ];

  stringFields.forEach(
    (field) => {
      form[field] =
        normalizeString(
          form[field]
        );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | MONTHLY INCOME
  |--------------------------------------------------------------------------
  */

  if (
    form.monthly_income === null ||
    form.monthly_income === undefined
  ) {
    form.monthly_income = "";
  }

  return form;
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
  | AVAILABLE TENANT USERS
  |--------------------------------------------------------------------------
  */

  users = EMPTY_ARRAY,

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE USER LOADING
  |--------------------------------------------------------------------------
  */

  availableUsersLoading = false,

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE USER ERROR
  |--------------------------------------------------------------------------
  */

  availableUsersError = null,

  mode = "create",
  loading = false,
  submitting = false,
  error = null,
  initialValues = EMPTY_OBJECT,
  onSubmit,
  onCancel,
}) => {
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

  const [errors, setErrors] =
    useState({});

  const [
    serverError,
    setServerError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE AVAILABLE USERS
  |--------------------------------------------------------------------------
  */

  const normalizedUsers =
    useMemo(
      () =>
        normalizeUserCollection(
          users
        ),
      [users]
    );

  /*
  |--------------------------------------------------------------------------
  | CURRENT TENANT USER
  |--------------------------------------------------------------------------
  */

  const currentTenantUser =
    useMemo(() => {
      if (!isEdit) {
        return null;
      }

      const currentUserId =
        String(
          form.user_id || ""
        );

      if (!currentUserId) {
        return null;
      }

      /*
      |--------------------------------------------------------------------------
      | First try the available-user list.
      |--------------------------------------------------------------------------
      */

      const existingUser =
        normalizedUsers.find(
          (user) =>
            String(user.id) ===
            currentUserId
        );

      if (existingUser) {
        return existingUser;
      }

      /*
      |--------------------------------------------------------------------------
      | If the current tenant user is not in the available-user
      | endpoint, construct it from the tenant relationship.
      |--------------------------------------------------------------------------
      */

      const tenantUser =
        tenant?.user &&
        typeof tenant.user === "object"
          ? tenant.user
          : {
              id: currentUserId,

              first_name:
                tenant?.first_name,

              last_name:
                tenant?.last_name,

              name:
                tenant?.name,

              email:
                tenant?.email,

              phone:
                tenant?.phone,
            };

      const normalized =
        normalizeUserOption({
          ...tenantUser,
          id: currentUserId,
        });

      return normalized.id
        ? normalized
        : null;
    }, [
      isEdit,
      form.user_id,
      normalizedUsers,
      tenant,
    ]);

  /*
  |--------------------------------------------------------------------------
  | USER OPTIONS
  |--------------------------------------------------------------------------
  */

  const userOptions =
    useMemo(() => {
      const options = [
        ...normalizedUsers,
      ];

      if (
        currentTenantUser &&
        !options.some(
          (user) =>
            String(user.id) ===
            String(
              currentTenantUser.id
            )
        )
      ) {
        options.unshift(
          currentTenantUser
        );
      }

      return options;
    }, [
      normalizedUsers,
      currentTenantUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RESET FORM WHEN EDIT TARGET CHANGES
  |--------------------------------------------------------------------------
  |
  | We intentionally do not use the entire `initialValues` object
  | as an effect dependency because parents may create a new object
  | reference on every render.
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
    tenant?.user?.id,
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

    if (
      typeof error === "string"
    ) {
      setServerError(
        error
      );

      return;
    }

    const responseData =
      error?.response?.data ||
      error?.data ||
      error;

    const validationErrors =
      responseData?.errors;

    if (
      validationErrors &&
      typeof validationErrors === "object"
    ) {
      const normalizedErrors =
        {};

      Object.entries(
        validationErrors
      ).forEach(
        ([field, message]) => {
          normalizedErrors[
            field
          ] =
            Array.isArray(
              message
            )
              ? message
                  .filter(Boolean)
                  .map(
                    normalizeString
                  )
                  .join(" ")
              : normalizeString(
                  message
                );
        }
      );

      if (
        Object.keys(
          normalizedErrors
        ).length
      ) {
        setErrors(
          normalizedErrors
        );
      }
    }

    const message =
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      "";

    setServerError(
      typeof message === "string"
        ? message
        : "Something went wrong. Please check the form and try again."
    );
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE USER ERROR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !availableUsersError
    ) {
      return;
    }

    const responseData =
      availableUsersError?.response
        ?.data ||
      availableUsersError?.data ||
      availableUsersError;

    const message =
      responseData?.message ||
      responseData?.error ||
      availableUsersError?.message ||
      "";

    if (message) {
      setServerError(
        normalizeString(
          message
        )
      );
    }
  }, [
    availableUsersError,
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

    const nextValue =
      type === "checkbox"
        ? checked
        : value;

    setForm(
      (current) => ({
        ...current,
        [name]: nextValue,
      })
    );

    setErrors(
      (current) => {
        if (!current[name]) {
          return current;
        }

        const next = {
          ...current,
        };

        if (
          name === "id_number" ||
          name === "passport_number"
        ) {
          delete next.id_number;
          delete next.passport_number;
        } else {
          delete next[name];
        }

        return next;
      }
    );

    setServerError("");
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE USER CHANGE
  |--------------------------------------------------------------------------
  |
  | Selecting an existing tenant-role user automatically fills:
  |
  | first_name
  | last_name
  | email
  | phone
  |
  */

  const handleUserChange = (
    event
  ) => {
    const userId =
      String(
        event.target.value || ""
      );

    const selectedUser =
      userOptions.find(
        (user) =>
          String(user.id) ===
          userId
      );

    setForm(
      (current) => ({
        ...current,

        user_id:
          userId,

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
      })
    );

    setErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next.user_id;

        return next;
      }
    );

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
    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setErrors(
      (current) => {
        if (!current[name]) {
          return current;
        }

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
    | USER
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
    } else {
      const phoneDigits =
        phone.replace(
          /\D/g,
          ""
        );

      if (
        phoneDigits.length < 7
      ) {
        nextErrors.phone =
          "Enter a valid phone number.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | IDENTIFICATION
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

    if (
      !normalizeString(
        form.gender
      )
    ) {
      nextErrors.gender =
        "Please select gender.";
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (
      !normalizeString(
        form.status
      )
    ) {
      nextErrors.status =
        "Please select tenant status.";
    }

    /*
    |--------------------------------------------------------------------------
    | DATE OF BIRTH
    |--------------------------------------------------------------------------
    */

    if (
      form.date_of_birth
    ) {
      const birthDate =
        new Date(
          form.date_of_birth
        );

      if (
        Number.isNaN(
          birthDate.getTime()
        )
      ) {
        nextErrors.date_of_birth =
          "Enter a valid date of birth.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY INCOME
    |--------------------------------------------------------------------------
    */

    if (
      normalizeString(
        form.monthly_income
      )
    ) {
      const income =
        Number(
          form.monthly_income
        );

      if (
        Number.isNaN(
          income
        ) ||
        income < 0
      ) {
        nextErrors.monthly_income =
          "Enter a valid monthly income.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | EMERGENCY CONTACT
    |--------------------------------------------------------------------------
    */

    const hasEmergencyContact =
      Boolean(
        emergencyName ||
        emergencyPhone ||
        emergencyRelationship
      );

    if (
      hasEmergencyContact
    ) {
      if (!emergencyName) {
        nextErrors.emergency_contact_name =
          "Emergency contact name is required.";
      }

      if (!emergencyPhone) {
        nextErrors.emergency_contact_phone =
          "Emergency contact phone is required.";
      }

      if (
        !emergencyRelationship
      ) {
        nextErrors.emergency_contact_relationship =
          "Emergency contact relationship is required.";
      }
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

    const userId =
      normalizeString(
        form.user_id
      );

    return {
      /*
      |--------------------------------------------------------------------------
      | EXISTING USER RELATION
      |--------------------------------------------------------------------------
      |
      | This MUST be the existing users.id.
      |
      | No tenant_id is sent.
      |
      */

      user_id:
        userId
          ? Number(userId)
          : null,

      /*
      |--------------------------------------------------------------------------
      | PERSONAL
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

      other_names:
        normalizeString(
          form.other_names
        ) || null,

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

      postal_code:
        normalizeString(
          form.postal_code
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

      monthly_income:
        normalizeString(
          form.monthly_income
        )
          ? Number(
              form.monthly_income
            )
          : null,

      /*
      |--------------------------------------------------------------------------
      | DOCUMENTS
      |--------------------------------------------------------------------------
      */

      photo:
        normalizeString(
          form.photo
        ) || null,

      id_front:
        normalizeString(
          form.id_front
        ) || null,

      id_back:
        normalizeString(
          form.id_back
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

      /*
      |--------------------------------------------------------------------------
      | NOTES
      |--------------------------------------------------------------------------
      */

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

    if (!validate()) {
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
    } catch (
      submitError
    ) {
      const responseData =
        submitError?.response
          ?.data ||
        submitError?.data ||
        {};

      if (
        responseData?.errors &&
        typeof responseData.errors ===
          "object"
      ) {
        const validationErrors =
          {};

        Object.entries(
          responseData.errors
        ).forEach(
          ([field, message]) => {
            validationErrors[
              field
            ] =
              Array.isArray(
                message
              )
                ? message
                    .filter(Boolean)
                    .map(
                      normalizeString
                    )
                    .join(" ")
                : normalizeString(
                    message
                  );
          }
        );

        setErrors(
          validationErrors
        );
      }

      const message =
        responseData?.message ||
        responseData?.error ||
        submitError?.message ||
        "Failed to save tenant. Please try again.";

      setServerError(
        normalizeString(
          message
        )
      );

      /*
      |--------------------------------------------------------------------------
      | KEEP ORIGINAL ERROR AVAILABLE TO PARENT
      |--------------------------------------------------------------------------
      */

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
  | UI VALUES
  |--------------------------------------------------------------------------
  */

  const formTitle =
    isEdit
      ? "Update Tenant"
      : "Create Tenant";

  const submitLabel =
    isEdit
      ? "Update Tenant"
      : "Create Tenant";

  const fieldError = (
    field
  ) => {
    const error =
      errors?.[field];

    if (
      Array.isArray(error)
    ) {
      return error
        .map(
          normalizeString
        )
        .join(" ");
    }

    return normalizeString(
      error
    );
  };

  const hasErrors =
    Object.keys(
      errors
    ).length > 0;

  /*
  |--------------------------------------------------------------------------
  | FORM COMPLETION
  |--------------------------------------------------------------------------
  */

  const completion =
    useMemo(() => {
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
        (
          completed /
          requiredFields.length
        ) * 100
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
                      .slice(
                        0,
                        8
                      )
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
                            {normalizeString(
                              message
                            )}
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

      {/* TENANT USER ACCOUNT */}

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
            value={
              form.user_id
            }
            onChange={
              handleUserChange
            }
            error={fieldError(
              "user_id"
            )}
            required
            disabled={
              submitting ||
              availableUsersLoading
            }
            options={[
              {
                value: "",
                label:
                  availableUsersLoading
                    ? "Loading tenant users..."
                    : userOptions.length >
                        0
                      ? "Select tenant user"
                      : "No tenant users available",
              },

              ...userOptions.map(
                (user) => ({
                  value:
                    String(
                      user.id
                    ),

                  label:
                    normalizeString(
                      user.name
                    ) +
                    (
                      user.email
                        ? ` — ${normalizeString(
                            user.email
                          )}`
                        : ""
                    ),
                })
              ),
            ]}
          />

          {/* USER LOADING */}

          {availableUsersLoading && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />

              <p className="text-xs text-blue-700">
                Loading available tenant users...
              </p>
            </div>
          )}

          {/* USER API ERROR */}

          {availableUsersError && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                <div>
                  <p className="text-xs font-semibold text-red-800">
                    Unable to load tenant users.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">
                    {normalizeString(
                      availableUsersError?.response
                        ?.data?.message ||
                      availableUsersError
                        ?.data?.message ||
                      availableUsersError?.message ||
                      availableUsersError
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INFORMATION */}

          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <p className="text-xs leading-5 text-blue-700">
                Only select a user who already has the{" "}
                <strong>
                  tenant
                </strong>{" "}
                role. The selected user's ID will be
                stored as{" "}
                <strong>
                  user_id
                </strong>{" "}
                on the tenant profile.
              </p>
            </div>
          </div>

          {/* NO USERS */}

          {!availableUsersLoading &&
            userOptions.length ===
              0 && (
              <p className="mt-2 text-xs text-amber-600">
                No tenant users are currently available.
                Make sure users have the tenant role and
                are not already linked to another tenant.
              </p>
            )}

          {/* USER COUNT */}

          {!availableUsersLoading &&
            userOptions.length >
              0 && (
              <p className="mt-2 text-xs text-gray-400">
                {userOptions.length} tenant user
                {userOptions.length ===
                1
                  ? ""
                  : "s"}{" "}
                available.
              </p>
            )}
        </div>
      </section>

      {/* PERSONAL INFORMATION */}

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
            value={
              form.first_name
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "first_name"
            )}
            required
            placeholder="e.g. John"
            autoComplete="given-name"
            disabled={
              submitting
            }
          />

          <InputField
            label="Last Name"
            name="last_name"
            value={
              form.last_name
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "last_name"
            )}
            required
            placeholder="e.g. Kamau"
            autoComplete="family-name"
            disabled={
              submitting
            }
          />

          <InputField
            label="Other Names"
            name="other_names"
            value={
              form.other_names
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Mwangi"
            hint="Optional additional or middle names."
            disabled={
              submitting
            }
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={
              form.email
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "email"
            )}
            required
            placeholder="tenant@example.com"
            icon={
              <Mail className="h-4 w-4" />
            }
            autoComplete="email"
            disabled={
              submitting
            }
          />

          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            value={
              form.phone
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "phone"
            )}
            required
            placeholder="e.g. 0712345678"
            icon={
              <Phone className="h-4 w-4" />
            }
            autoComplete="tel"
            disabled={
              submitting
            }
          />

          <InputField
            label="National ID Number"
            name="id_number"
            value={
              form.id_number
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "id_number"
            )}
            placeholder="e.g. 12345678"
            hint="Provide either National ID or Passport number."
            disabled={
              submitting
            }
          />

          <InputField
            label="Passport Number"
            name="passport_number"
            value={
              form.passport_number
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "passport_number"
            )}
            placeholder="e.g. A12345678"
            disabled={
              submitting
            }
          />

          <SelectField
            label="Gender"
            name="gender"
            value={
              form.gender
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "gender"
            )}
            required
            disabled={
              submitting
            }
            options={[
              {
                value: "",
                label:
                  "Select gender",
              },
              {
                value:
                  "male",
                label:
                  "Male",
              },
              {
                value:
                  "female",
                label:
                  "Female",
              },
              {
                value:
                  "other",
                label:
                  "Other",
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
            onChange={
              handleChange
            }
            error={fieldError(
              "date_of_birth"
            )}
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            disabled={
              submitting
            }
          />

          <InputField
            label="Nationality"
            name="nationality"
            value={
              form.nationality
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Kenyan"
            icon={
              <Globe2 className="h-4 w-4" />
            }
            disabled={
              submitting
            }
          />
        </div>
      </section>

      {/* ADDRESS */}

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
            value={
              form.country
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Kenya"
            disabled={
              submitting
            }
          />

          <InputField
            label="Region"
            name="region"
            value={
              form.region
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Nairobi Region"
            disabled={
              submitting
            }
          />

          <InputField
            label="County"
            name="county"
            value={
              form.county
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Nairobi"
            disabled={
              submitting
            }
          />

          <InputField
            label="City"
            name="city"
            value={
              form.city
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Nairobi"
            disabled={
              submitting
            }
          />

          <InputField
            label="Area"
            name="area"
            value={
              form.area
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Westlands"
            disabled={
              submitting
            }
          />

          <InputField
            label="Postal Code"
            name="postal_code"
            value={
              form.postal_code
            }
            onChange={
              handleChange
            }
            placeholder="e.g. 00100"
            autoComplete="postal-code"
            disabled={
              submitting
            }
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <TextAreaField
              label="Residential Address"
              name="address"
              value={
                form.address
              }
              onChange={
                handleChange
              }
              error={fieldError(
                "address"
              )}
              placeholder="Enter the tenant's residential address..."
              rows={3}
              disabled={
                submitting
              }
            />
          </div>
        </div>
      </section>

      {/* EMPLOYMENT */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <Wallet className="h-5 w-5" />
          }
          title="Employment & Financial Information"
          description="Employment, occupation and income details."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="Occupation"
            name="occupation"
            value={
              form.occupation
            }
            onChange={
              handleChange
            }
            placeholder="e.g. Software Engineer"
            disabled={
              submitting
            }
          />

          <InputField
            label="Employer / Company"
            name="employer"
            value={
              form.employer
            }
            onChange={
              handleChange
            }
            placeholder="e.g. ABC Technologies Ltd"
            disabled={
              submitting
            }
          />

          <InputField
            label="Monthly Income"
            name="monthly_income"
            type="number"
            min="0"
            step="0.01"
            value={
              form.monthly_income
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "monthly_income"
            )}
            placeholder="e.g. 85000"
            hint="Enter the tenant's monthly income in KES."
            disabled={
              submitting
            }
          />
        </div>
      </section>

      {/* EMERGENCY CONTACT */}

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
            onChange={
              handleChange
            }
            error={fieldError(
              "emergency_contact_name"
            )}
            placeholder="e.g. Jane Kamau"
            disabled={
              submitting
            }
          />

          <InputField
            label="Contact Phone"
            name="emergency_contact_phone"
            type="tel"
            value={
              form.emergency_contact_phone
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "emergency_contact_phone"
            )}
            placeholder="e.g. 0712345678"
            disabled={
              submitting
            }
          />

          <InputField
            label="Relationship"
            name="emergency_contact_relationship"
            value={
              form.emergency_contact_relationship
            }
            onChange={
              handleChange
            }
            error={fieldError(
              "emergency_contact_relationship"
            )}
            placeholder="e.g. Spouse, Parent, Sibling"
            disabled={
              submitting
            }
          />
        </div>
      </section>

      {/* DOCUMENTS */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={
            <FileImage className="h-5 w-5" />
          }
          title="Documents & Media"
          description="Tenant profile photo and identification document references."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="Profile Photo"
            name="photo"
            value={
              form.photo
            }
            onChange={
              handleChange
            }
            placeholder="e.g. tenants/profile.jpg"
            hint="Stored photo path or URL."
            disabled={
              submitting
            }
          />

          <InputField
            label="ID Front"
            name="id_front"
            value={
              form.id_front
            }
            onChange={
              handleChange
            }
            placeholder="e.g. tenants/id-front.jpg"
            hint="Stored ID front path or URL."
            disabled={
              submitting
            }
          />

          <InputField
            label="ID Back"
            name="id_back"
            value={
              form.id_back
            }
            onChange={
              handleChange
            }
            placeholder="e.g. tenants/id-back.jpg"
            hint="Stored ID back path or URL."
            disabled={
              submitting
            }
          />
        </div>
      </section>

      {/* ACCOUNT SETTINGS */}

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
            disabled={
              submitting
            }
            options={[
              {
                value:
                  "pending",
                label:
                  "Pending",
              },
              {
                value:
                  "active",
                label:
                  "Active",
              },
              {
                value:
                  "inactive",
                label:
                  "Inactive",
              },
              {
                value:
                  "blacklisted",
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
            onChange={
              handleChange
            }
            disabled={
              submitting
            }
          />

          <ToggleField
            label="Verified Tenant"
            description="Mark this tenant as identity verified."
            name="is_verified"
            checked={
              form.is_verified
            }
            onChange={
              handleChange
            }
            disabled={
              submitting
            }
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
          description="Optional notes about this tenant."
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
            error={fieldError(
              "notes"
            )}
            placeholder="Enter any additional notes about this tenant..."
            rows={5}
            disabled={
              submitting
            }
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
  min,
  step,
}) => {
  const hasError =
    Boolean(error);

  const errorId =
    `${name}-error`;

  const hintId =
    `${name}-hint`;

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
            value === null ||
            value === undefined
              ? ""
              : normalizeString(
                  value
                )
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
          step={step}
          aria-invalid={
            hasError
          }
          aria-describedby={
            hasError
              ? errorId
              : hint
                ? hintId
                : undefined
          }
          className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
            icon
              ? "pl-10"
              : ""
          } ${
            hasError
              ? "border-red-300 ring-1 ring-red-100 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          }`}
        />
      </div>

      {hint &&
        !error && (
          <p
            id={hintId}
            className="text-xs text-gray-400"
          >
            {hint}
          </p>
        )}

      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1 text-xs text-red-600"
        >
          <AlertCircle className="h-3.5 w-3.5" />

          {normalizeString(
            error
          )}
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
  options = EMPTY_ARRAY,
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
            value === null ||
            value === undefined
              ? ""
              : String(value)
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
          className={`h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          }`}
        >
          {Array.isArray(
            options
          ) &&
            options.map(
              (
                option,
                index
              ) => (
                <option
                  key={`${String(
                    option?.value ??
                      ""
                  )}-${index}`}
                  value={
                    option?.value ??
                    ""
                  }
                >
                  {normalizeString(
                    option?.label
                  )}
                </option>
              )
            )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />

          {normalizeString(
            error
          )}
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

      <textarea
        id={name}
        name={name}
        value={
          value === null ||
          value === undefined
            ? ""
            : normalizeString(
                value
              )
        }
        onChange={
          onChange
        }
        rows={rows}
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        aria-invalid={
          hasError
        }
        className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
          hasError
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        }`}
      />

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />

          {normalizeString(
            error
          )}
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
  disabled = false,
}) => {
  return (
    <label
      htmlFor={name}
      className={`flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-gray-100"
      }`}
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
          onChange={
            onChange
          }
          disabled={
            disabled
          }
          className="peer sr-only"
        />

        <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500/30" />

        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </div>
    </label>
  );
};

export default TenantForm;
