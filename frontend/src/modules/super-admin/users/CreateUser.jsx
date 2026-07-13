import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import { useDispatch } from "react-redux";

/*
|--------------------------------------------------------------------------
| UI NOTIFICATIONS
|--------------------------------------------------------------------------
*/
import { addNotification } from "../../../store/uiSlice";

const CreateUser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | IMAGE PREVIEW
  |--------------------------------------------------------------------------
  */
  const [preview, setPreview] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",

    // RBAC roles
    roles: [],

    // Profile image
    image: null,
  });


  /*
  |--------------------------------------------------------------------------
  | FETCH AVAILABLE ROLES
  |--------------------------------------------------------------------------
  */
  const getRoles = async () => {
    setLoadingRoles(true);

    try {
      const res = await api.get("/rbac/roles");

      const data =
        res?.data?.data ||
        res?.data?.roles ||
        res?.data ||
        [];

      setRoles(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error("ROLE FETCH ERROR:", err);

      dispatch(
        addNotification({
          type: "error",
          message: "Failed to load roles",
        })
      );

    } finally {

      setLoadingRoles(false);
    }
  };


  useEffect(() => {
    getRoles();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | HANDLE TEXT INPUTS
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
  | HANDLE IMAGE INPUT
  |--------------------------------------------------------------------------
  */
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setError(null);

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      const message = "Only JPG, PNG, WEBP, and GIF images are allowed.";

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      return;
    }


    if (file.size > 5 * 1024 * 1024) {
      const message = "Image size must not exceed 5MB";

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

      return;
    }


    setForm((prev) => ({
      ...prev,
      image: file,
    }));


    setPreview(
      URL.createObjectURL(file)
    );
  };


  /*
  |--------------------------------------------------------------------------
  | TOGGLE USER ROLES
  |--------------------------------------------------------------------------
  */
  const toggleRole = (roleName) => {

    setForm((prev) => {

      const exists =
        prev.roles.includes(roleName);


      return {
        ...prev,

        roles: exists
          ? prev.roles.filter(
            (role) => role !== roleName
          )
          : [
            ...prev.roles,
            roleName,
          ],
      };
    });
  };
  /*
|--------------------------------------------------------------------------
| SUBMIT CREATE USER
|--------------------------------------------------------------------------
*/
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setValidationErrors({});


    /*
    |--------------------------------------------------------------------------
    | PASSWORD CHECK
    |--------------------------------------------------------------------------
    */
    if (form.password !== form.password_confirmation) {

      const message =
        "Passwords do not match";


      setError(message);


      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );


      return;
    }


    /*
    |--------------------------------------------------------------------------
    | ROLE CHECK
    |--------------------------------------------------------------------------
    */
    if (form.roles.length === 0) {

      const message =
        "Please select at least one role";


      setError(message);


      dispatch(
        addNotification({
          type: "warning",
          message,
        })
      );


      return;
    }


    setSaving(true);


    try {

      /*
      |--------------------------------------------------------------------------
      | CREATE FORM DATA FOR IMAGE UPLOAD
      |--------------------------------------------------------------------------
      */
      const formData = new FormData();


      formData.append(
        "first_name",
        form.first_name.trim()
      );


      formData.append(
        "last_name",
        form.last_name.trim()
      );


      formData.append(
        "email",
        form.email.trim()
      );


      formData.append(
        "phone",
        form.phone.trim()
      );


      formData.append(
        "password",
        form.password
      );


      formData.append(
        "password_confirmation",
        form.password_confirmation
      );


      /*
      |--------------------------------------------------------------------------
      | ROLES ARRAY
      |--------------------------------------------------------------------------
      */
      form.roles.forEach((role) => {

        formData.append(
          "roles[]",
          role
        );

      });


      /*
      |--------------------------------------------------------------------------
      | PROFILE IMAGE (OPTIONAL)
      |--------------------------------------------------------------------------
      */
      if (form.image) {

        formData.append(
          "image",
          form.image
        );
      }


      /*
      |--------------------------------------------------------------------------
      | CREATE USER API CALL
      |--------------------------------------------------------------------------
      */
      const res = await api.post(
        "/users",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );


      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */
      dispatch(
        addNotification({
          type: "success",
          message:
            res?.data?.message ||
            "User created successfully",
        })
      );


      navigate(
        "/super-admin/users",
        {
          replace: true,
        }
      );


    } catch (err) {

      const backend =
        err?.response?.data;


      console.error(
        "CREATE USER ERROR:",
        backend || err
      );


      /*
      |--------------------------------------------------------------------------
      | LARAVEL VALIDATION ERRORS
      |--------------------------------------------------------------------------
      */
      if (backend?.errors) {

        setValidationErrors(
          backend.errors
        );


        const message =
          Object.values(
            backend.errors
          )
            .flat()
            .join(", ");


        setError(message);


        dispatch(
          addNotification({
            type: "error",
            message,
            sticky: true,
          })
        );


        return;
      }


      /*
      |--------------------------------------------------------------------------
      | GENERAL ERROR
      |--------------------------------------------------------------------------
      */
      const message =
        backend?.message ||
        "Failed to create user";


      setError(message);


      dispatch(
        addNotification({
          type: "error",
          message,
          sticky: true,
        })
      );

    } finally {

      setSaving(false);
    }
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-md shadow">

      <div className="bg-white shadow rounded-lg p-6">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b mb-6">

          <h4 className="text-xl font-semibold text-gray-800">
            Create User
          </h4>

          <Link
            to="/super-admin/users"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back
          </Link>

        </div>


        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}


        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* PROFILE IMAGE */}
          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Profile Image
            </label>


            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />


            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG or WEBP. Maximum 5MB.
            </p>


            {/* IMAGE PREVIEW */}
            {preview && (
              <div className="mt-4">

                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />

              </div>
            )}

          </div>


          {/* FIRST NAME */}
          <div>

            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className="w-full p-2 border rounded"
              required
            />

          </div>


          {/* LAST NAME */}
          <div>

            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className="w-full p-2 border rounded"
              required
            />

          </div>


          {/* EMAIL */}
          <div>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full p-2 border rounded"
              required
            />

          </div>


          {/* PHONE */}
          <div>

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full p-2 border rounded"
            />

          </div>


          {/* PASSWORD */}
          <div>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full p-2 border rounded"
              required
            />

          </div>


          {/* CONFIRM PASSWORD */}
          <div>

            <input
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full p-2 border rounded"
              required
            />

          </div>


          {/* ROLES */}
          <div>

            <h5 className="font-medium text-gray-700 mb-2">
              Assign Roles
            </h5>


            {loadingRoles ? (

              <p className="text-gray-500">
                Loading roles...
              </p>

            ) : (

              <div className="grid grid-cols-2 gap-3">

                {roles.length > 0 ? (
                  roles.map((role) => (

                    <label
                      key={role.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >

                      <input
                        type="checkbox"
                        checked={form.roles.includes(role.name)}
                        onChange={() => toggleRole(role.name)}
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

            )}

          </div>


          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={saving}
            className="
              w-full
              bg-blue-600
              text-white
              p-3
              rounded-lg
              hover:bg-blue-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            {saving
              ? "Creating User..."
              : "Create User"}
          </button>


        </form>

      </div>

    </div>
  );
};


export default CreateUser;