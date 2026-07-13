import { useState, useEffect } from "react";
import {
  ACCOUNT_STATUS_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
} from "../../../utils/userStatusOptions";


/*
|--------------------------------------------------------------------------
| INPUT COMPONENT
|--------------------------------------------------------------------------
*/
const Input = ({
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}) => {
  return (
    <div>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="
          border border-gray-300
          p-3 rounded-lg w-full
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />

      {error && (
        <p className="text-red-500 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
};


/*
|--------------------------------------------------------------------------
| DEFAULT FORM STATE
|--------------------------------------------------------------------------
*/
const defaultForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",

  password: "",
  password_confirmation: "",

  account_status: "inactive",
  approval_status: "pending",

  roles: [],

  // Cloudinary image upload
  image: null,
};


/*
|--------------------------------------------------------------------------
| USER FORM COMPONENT
|--------------------------------------------------------------------------
*/
const UserForm = ({
  initialValues,
  roles = [],
  onSubmit,
  loading = false,
}) => {

  const isEdit = Boolean(initialValues);

  const [form, setForm] = useState(defaultForm);

  const [errors, setErrors] = useState({});


  /*
  |--------------------------------------------------------------------------
  | IMAGE PREVIEW
  |--------------------------------------------------------------------------
  */
  const [imagePreview, setImagePreview] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | NORMALIZE ROLES
  |--------------------------------------------------------------------------
  */
  const normalizeRoles = (data) => {

    if (!Array.isArray(data?.roles)) {
      return [];
    }

    return data.roles
      .map((role) =>
        typeof role === "string"
          ? role
          : role?.name
      )
      .filter(Boolean);
  };


  /*
  |--------------------------------------------------------------------------
  | NORMALIZE USER DATA
  |--------------------------------------------------------------------------
  */
  const normalizeUser = (data) => {

    // Existing Cloudinary image
    if (data?.image) {
      setImagePreview(data.image);
    }

    return {
      first_name: data?.first_name ?? "",
      last_name: data?.last_name ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",

      password: "",
      password_confirmation: "",

      account_status:
        data?.account_status ?? "inactive",

      approval_status:
        data?.approval_status ?? "pending",

      roles: normalizeRoles(data),

      // Do not store URL as File
      image: null,
    };
  };


  /*
  |--------------------------------------------------------------------------
  | LOAD INITIAL USER DATA
  |--------------------------------------------------------------------------
  */
  useEffect(() => {

    if (!initialValues) {

      setForm(defaultForm);
      setImagePreview(null);

      return;
    }

    setForm((prev) => ({
      ...prev,
      ...normalizeUser(initialValues),
    }));

  }, [initialValues]);


  /*
  |--------------------------------------------------------------------------
  | HANDLE INPUT CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  /*
  |--------------------------------------------------------------------------
  | HANDLE IMAGE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleImageChange = (e) => {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | 5MB CLIENT VALIDATION
    |--------------------------------------------------------------------------
    */
    if (file.size > 5 * 1024 * 1024) {

      setErrors((prev) => ({
        ...prev,
        image: "Image must not exceed 5MB",
      }));

      return;
    }


    // Remove old image errors
    setErrors((prev) => ({
      ...prev,
      image: null,
    }));


    setForm((prev) => ({
      ...prev,
      image: file,
    }));


    /*
    |--------------------------------------------------------------------------
    | LOCAL PREVIEW
    |--------------------------------------------------------------------------
    */
    setImagePreview(
      URL.createObjectURL(file)
    );
  };
    /*
  |--------------------------------------------------------------------------
  | TOGGLE ROLES
  |--------------------------------------------------------------------------
  */
  const toggleRole = (roleName) => {

    setForm((prev) => {

      const currentRoles = Array.isArray(prev.roles)
        ? prev.roles
        : [];

      return {
        ...prev,

        roles: currentRoles.includes(roleName)
          ? currentRoles.filter(
              (role) => role !== roleName
            )
          : [
              ...currentRoles,
              roleName,
            ],
      };
    });
  };


  /*
  |--------------------------------------------------------------------------
  | FORM VALIDATION
  |--------------------------------------------------------------------------
  */
  const validate = () => {

    const validationErrors = {};


    if (!form.first_name.trim()) {
      validationErrors.first_name =
        "First name is required";
    }


    if (!form.last_name.trim()) {
      validationErrors.last_name =
        "Last name is required";
    }


    if (!form.email.trim()) {
      validationErrors.email =
        "Email is required";
    }


    if (
      !Array.isArray(form.roles) ||
      form.roles.length === 0
    ) {
      validationErrors.roles =
        "At least one role is required";
    }


    /*
    |--------------------------------------------------------------------------
    | PASSWORD RULES
    |--------------------------------------------------------------------------
    | Create = password required
    | Edit = password optional
    |--------------------------------------------------------------------------
    */
    if (!isEdit && !form.password.trim()) {

      validationErrors.password =
        "Password is required";
    }


    if (
      form.password &&
      form.password !== form.password_confirmation
    ) {

      validationErrors.password_confirmation =
        "Passwords do not match";
    }


    setErrors(validationErrors);


    return Object.keys(validationErrors).length === 0;
  };


  /*
  |--------------------------------------------------------------------------
  | SUBMIT FORM
  |--------------------------------------------------------------------------
  */
  const handleSubmit = (e) => {

    e.preventDefault();


    if (!validate()) {
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | CLEAN PAYLOAD
    |--------------------------------------------------------------------------
    | Image is File object.
    | Parent component/API will convert to FormData.
    |--------------------------------------------------------------------------
    */
    const payload = {

      first_name: form.first_name.trim(),

      last_name: form.last_name.trim(),

      email: form.email.trim(),

      phone: form.phone.trim(),

      roles: form.roles,


      /*
      |--------------------------------------------------------------------------
      | IMAGE
      |--------------------------------------------------------------------------
      | Only send if user selected a new image.
      | Existing Cloudinary image remains unchanged.
      |--------------------------------------------------------------------------
      */
      ...(form.image && {
        image: form.image,
      }),
    };


    /*
    |--------------------------------------------------------------------------
    | EDIT MODE STATUS CONTROL
    |--------------------------------------------------------------------------
    */
    if (isEdit) {

      if (form.account_status) {

        payload.account_status =
          form.account_status;
      }


      if (form.approval_status) {

        payload.approval_status =
          form.approval_status;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | PASSWORD
    |--------------------------------------------------------------------------
    */
    if (form.password.trim()) {

      payload.password =
        form.password;

      payload.password_confirmation =
        form.password_confirmation;
    }


    /*
    |--------------------------------------------------------------------------
    | SEND DATA TO PARENT
    |--------------------------------------------------------------------------
    */
    onSubmit(payload);
  };
    /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* PROFILE IMAGE */}
      <div>

        <label className="block text-sm font-medium mb-2">
          Profile Image
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageChange}
          className="w-full border border-gray-300 p-3 rounded-lg"
        />

        <p className="text-gray-500 text-xs mt-1">
          JPG, PNG, WEBP or GIF. Maximum size 5MB.
        </p>

        {/* IMAGE ERROR */}
        {errors.image && (
          <p className="text-red-500 text-xs mt-2">
            {errors.image}
          </p>
        )}

        {/* IMAGE PREVIEW */}
        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="User preview"
              className="w-24 h-24 rounded-full object-cover border"
            />
          </div>
        )}

      </div>


      {/* NAME */}
      <div className="grid md:grid-cols-2 gap-4">

        <Input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="First Name"
          error={errors.first_name}
        />

        <Input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Last Name"
          error={errors.last_name}
        />

      </div>


      {/* EMAIL */}
      <Input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email Address"
        error={errors.email}
      />


      {/* PHONE */}
      <Input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone Number"
        error={errors.phone}
      />


      {/* PASSWORD */}
      <Input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder={
          isEdit
            ? "New Password (Optional)"
            : "Password"
        }
        error={errors.password}
      />


      {/* PASSWORD CONFIRMATION */}
      <Input
        type="password"
        name="password_confirmation"
        value={form.password_confirmation}
        onChange={handleChange}
        placeholder="Confirm Password"
        error={errors.password_confirmation}
      />


      {/* ACCOUNT STATUS */}
      {isEdit && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              Account Status
            </label>

            <select
              name="account_status"
              value={form.account_status}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg"
            >
              {ACCOUNT_STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>


          {/* APPROVAL STATUS */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Approval Status
            </label>

            <select
              name="approval_status"
              value={form.approval_status}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg"
            >
              {APPROVAL_STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}


      {/* ROLES */}
      <div>

        <label className="block text-sm font-medium mb-2">
          Roles
        </label>

        <div className="grid md:grid-cols-2 gap-3">

          {roles.length > 0 ? (
            roles.map((role) => (

              <label
                key={role.id}
                className="
                  flex items-center gap-2
                  border border-gray-300
                  rounded-lg p-3 cursor-pointer
                "
              >

                <input
                  type="checkbox"
                  checked={form.roles.includes(role.name)}
                  onChange={() =>
                    toggleRole(role.name)
                  }
                />

                <span>
                  {role.name}
                </span>

              </label>

            ))
          ) : (

            <p className="text-gray-500">
              No roles available
            </p>

          )}

        </div>


        {errors.roles && (
          <p className="text-red-500 text-xs mt-2">
            {errors.roles}
          </p>
        )}

      </div>


      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          bg-blue-600
          hover:bg-blue-700
          text-white
          p-3
          rounded-lg
          transition
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        {loading
          ? "Saving..."
          : isEdit
            ? "Update User"
            : "Create User"}
      </button>

    </form>
  );
};

export default UserForm;