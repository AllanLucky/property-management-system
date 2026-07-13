import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  Loader2,
  Save,
  ArrowLeft,
  Tag,
  FileText,
  BadgeCheck,
  Star,
} from "lucide-react";

import {
  fetchPropertyType,
  updatePropertyType,
} from "../../../store/propertyTypeSlice";

const PropertyTypeEdit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    is_featured: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const loadPropertyType = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dispatch(
          fetchPropertyType(id)
        ).unwrap();

        const data = response?.data || response;

        setForm({
          name: data?.name || "",
          description: data?.description || "",
          status:
            data?.status?.value ||
            data?.status ||
            "active",
          is_featured:
            data?.status?.is_featured ??
            data?.is_featured ??
            false,
        });

      } catch (err) {
        setError(
          err?.message ||
          "Unable to load property type details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPropertyType();
    }
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE FORM CHANGE
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
  | UPDATE PROPERTY TYPE
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await dispatch(
        updatePropertyType({
          id,
          data: form,
        })
      ).unwrap();

      navigate("/super-admin/property-types");

    } catch (err) {
      setError(
        err?.message ||
        "Failed to update property type."
      );
    } finally {
      setSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | LOADING UI
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-500">
          Loading property type...
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              h-11 w-11
              rounded-xl border
              flex items-center justify-center
              hover:bg-gray-100 transition
            "
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Property Type
            </h1>

            <p className="text-gray-500">
              Update and manage property type information
            </p>
          </div>

        </div>

      </div>


      {/* ERROR */}
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

          {/* DETAILS SECTION */}
          <div>

            <h2 className="text-lg font-semibold mb-5">
              Property Type Details
            </h2>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* NAME */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm font-medium">

                  <Tag size={16} />
                  Name

                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Apartment, Villa, Office..."
                  className="
                    w-full rounded-xl border
                    px-4 py-3
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-500
                  "
                  required
                />
              </div>


              {/* STATUS */}
              <div>

                <label className="flex items-center gap-2 mb-2 text-sm font-medium">

                  <BadgeCheck size={16}/>
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

            <label className="flex items-center gap-2 mb-2 text-sm font-medium">

              <FileText size={16}/>
              Description

            </label>


            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Enter a detailed description..."
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

              <h3 className="font-medium flex items-center gap-2">

                <Star size={16} className="text-yellow-500"/>
                Featured Property Type

              </h3>


              <p className="text-sm text-gray-500 mt-1">
                Highlight this property type in listings.
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
                w-12 h-6
                bg-gray-300
                rounded-full
                peer-checked:bg-blue-600
                after:content-['']
                after:absolute
                after:top-[2px]
                after:left-[2px]
                after:w-5
                after:h-5
                after:bg-white
                after:rounded-full
                after:transition-all
                peer-checked:after:translate-x-6
              "/>

            </label>

          </div>


          {/* FOOTER ACTIONS */}
          <div className="
            flex flex-col-reverse
            sm:flex-row
            justify-end gap-3
            border-t pt-6
          ">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
                rounded-xl border
                px-5 py-3
                hover:bg-gray-100
                transition
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={saving}
              className="
                rounded-xl
                bg-blue-600
                px-6 py-3
                text-white
                flex items-center justify-center gap-2
                hover:bg-blue-700
                disabled:opacity-60
                transition
              "
            >

              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={18}/>
                  Save Changes
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default PropertyTypeEdit;