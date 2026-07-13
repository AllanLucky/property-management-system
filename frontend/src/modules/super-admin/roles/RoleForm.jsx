import { useState, useEffect } from "react";

const RoleForm = ({ initialValues = null, onSubmit, loading }) => {
  const [form, setForm] = useState({
    name: "",
  });

  const [errors, setErrors] = useState({});

  /*
  |----------------------------------------------------------------------
  | INIT FORM (EDIT MODE)
  |----------------------------------------------------------------------
  */
  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
      });
    }
  }, [initialValues]);

  /*
  |----------------------------------------------------------------------
  | HANDLE INPUT
  |----------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // clear error when user types
    setErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  /*
  |----------------------------------------------------------------------
  | VALIDATION
  |----------------------------------------------------------------------
  */
  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Role name is required";
    } else if (form.name.length < 2) {
      newErrors.name = "Role name must be at least 2 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
  |----------------------------------------------------------------------
  | SUBMIT
  |----------------------------------------------------------------------
  */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(form);
  };

  /*
  |----------------------------------------------------------------------
  | UI
  |----------------------------------------------------------------------
  */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ROLE NAME */}
      <div>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Role name (e.g. admin)"
          className={`border p-2 rounded w-full focus:outline-none focus:ring-2
            ${errors.name ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-400"}
          `}
        />

        {/* ERROR MESSAGE */}
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Role"}
      </button>

    </form>
  );
};

export default RoleForm;