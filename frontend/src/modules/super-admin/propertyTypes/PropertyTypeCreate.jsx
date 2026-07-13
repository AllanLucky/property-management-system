import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  Plus,
  Loader2,
  ArrowLeft,
  Tag,
  FileText,
  BadgeCheck,
  Star,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/
import { createPropertyType } from "../../../store/propertyTypeSlice";
import { addNotification } from "../../../store/uiSlice";

const PropertyTypeCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    is_featured: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | HANDLE INPUT CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE PROPERTY TYPE
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const response = await dispatch(
        createPropertyType(form)
      ).unwrap();

      dispatch(
        addNotification({
          type: "success",
          title: "Property Type Created",
          message:
            response?.message ||
            `${form.name} was created successfully.`,
        })
      );

      navigate("/super-admin/property-types");

    } catch (err) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to create property type.";

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          title: "Creation Failed",
          message,
        })
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              h-11 w-11 rounded-xl border
              flex items-center justify-center
              hover:bg-gray-100 transition
            "
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Property Type
            </h1>

            <p className="text-gray-500">
              Add a new property type such as Apartment,
              Villa, Office, or Commercial Space.
            </p>
          </div>

        </div>

      </div>


      {/* ERROR MESSAGE */}
      {error && (
        <div className="
          rounded-2xl
          border border-red-200
          bg-red-50
          px-5 py-4
          text-red-600
        ">
          {error}
        </div>
      )}


      {/* FORM CARD */}
      <div className="
        rounded-3xl
        border
        bg-white
        shadow-sm
      ">

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8"
        >

          {/* DETAILS */}
          <div>

            <h2 className="text-lg font-semibold mb-5">
              Property Type Details
            </h2>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* NAME */}
              <div>

                <label className="
                  flex items-center gap-2
                  text-sm font-medium mb-2
                ">
                  <Tag size={16} />
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Apartment, Villa, Office..."
                  required
                  className="
                    w-full rounded-xl border
                    px-4 py-3
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-500
                  "
                />

              </div>


              {/* STATUS */}
              <div>

                <label className="
                  flex items-center gap-2
                  text-sm font-medium mb-2
                ">
                  <BadgeCheck size={16} />
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="
                    w-full rounded-xl border
                    px-4 py-3
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-500
                  "
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

          </div>


          {/* DESCRIPTION */}
          <div>

            <label className="
              flex items-center gap-2
              text-sm font-medium mb-2
            ">
              <FileText size={16} />
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Write a short description about this property type..."
              className="
                w-full rounded-xl border
                px-4 py-3
                resize-none
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
              "
            />

          </div>


          {/* FEATURED SWITCH */}
          <div className="
            flex items-center justify-between
            rounded-2xl border
            p-5
          ">

            <div>

              <h3 className="
                flex items-center gap-2
                font-medium
              ">
                <Star
                  size={16}
                  className="text-yellow-500"
                />
                Featured Property Type
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Display this property type in featured sections.
              </p>

            </div>


            <label className="relative inline-flex cursor-pointer">

              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="sr-only peer"
              />

              <div className="
                relative w-12 h-6
                rounded-full bg-gray-300
                transition
                peer-checked:bg-blue-600
                after:absolute
                after:left-[2px]
                after:top-[2px]
                after:h-5
                after:w-5
                after:rounded-full
                after:bg-white
                after:transition-all
                peer-checked:after:translate-x-6
              " />

            </label>

          </div>


          {/* ACTIONS */}
          <div className="
            flex flex-col-reverse
            sm:flex-row
            justify-end gap-3
            border-t pt-6
          ">

            <button
              type="button"
              disabled={loading}
              onClick={() => navigate(-1)}
              className="
                rounded-xl border
                px-5 py-3
                hover:bg-gray-100
                transition
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={loading}
              className="
                rounded-xl
                bg-blue-600
                text-white
                px-6 py-3
                flex items-center justify-center gap-2
                hover:bg-blue-700
                transition
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Property Type
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default PropertyTypeCreate;