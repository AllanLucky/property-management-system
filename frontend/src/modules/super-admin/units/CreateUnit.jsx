import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

import {
  ArrowLeft,
  Building2,
  Home,
  Loader2,
  Save,
  DollarSign,
  FileText,
  Hash,
  CheckCircle2,
  Layers3,
  Bath,
  BedDouble,
  AlertTriangle,
} from "lucide-react";

const CreateUnit = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */
  const [properties, setProperties] = useState([]);

  const [loadingProperties, setLoadingProperties] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [validationErrors, setValidationErrors] =
    useState({});

  /*
  |--------------------------------------------------------------------------
  | FORM DATA
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Backend Unit model uses "type" not "unit_type"
  |--------------------------------------------------------------------------
  */
  const [formData, setFormData] = useState({
    property_id: "",
    unit_number: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    rent_amount: "",
    deposit_amount: "",
    size: "",
    status: "vacant",
    description: "",
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTIES
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoadingProperties(true);

        const response = await api.get(
          "/properties?with_relations=true"
        );

        console.log(
          "PROPERTIES RESPONSE:",
          response?.data
        );

        const data =
          response?.data?.data ||
          response?.data ||
          [];

        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(
          "FAILED TO FETCH PROPERTIES:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to load properties."
        );
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    /*
    |--------------------------------------------------------------------------
    | CLEAR FIELD ERROR
    |--------------------------------------------------------------------------
    */
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      setError("");
      setSuccess("");
      setValidationErrors({});

      /*
      |--------------------------------------------------------------------------
      | CLEAN PAYLOAD
      |--------------------------------------------------------------------------
      */
      const payload = {
        property_id: Number(formData.property_id),
        unit_number: formData.unit_number,
        type: formData.type,
        bedrooms: formData.bedrooms
          ? Number(formData.bedrooms)
          : 0,
        bathrooms: formData.bathrooms
          ? Number(formData.bathrooms)
          : 0,
        floor: formData.floor
          ? Number(formData.floor)
          : null,
        rent_amount: Number(formData.rent_amount),
        deposit_amount: formData.deposit_amount
          ? Number(formData.deposit_amount)
          : 0,
        size: formData.size
          ? Number(formData.size)
          : null,
        status: formData.status,
        description: formData.description,
      };

      console.log("UNIT PAYLOAD:", payload);

      const response = await api.post(
        "/units",
        payload
      );

      console.log(
        "CREATE UNIT RESPONSE:",
        response?.data
      );

      setSuccess("Unit created successfully.");

      /*
      |--------------------------------------------------------------------------
      | RESET FORM
      |--------------------------------------------------------------------------
      */
      setFormData({
        property_id: "",
        unit_number: "",
        type: "",
        bedrooms: "",
        bathrooms: "",
        floor: "",
        rent_amount: "",
        deposit_amount: "",
        size: "",
        status: "vacant",
        description: "",
      });

      setTimeout(() => {
        navigate("/super-admin/units");
      }, 1500);
    } catch (err) {
      console.error(
        "CREATE UNIT ERROR:",
        err?.response?.data || err
      );

      /*
      |--------------------------------------------------------------------------
      | VALIDATION ERRORS
      |--------------------------------------------------------------------------
      */
      if (err?.response?.status === 422) {
        setValidationErrors(
          err?.response?.data?.errors || {}
        );

        setError(
          err?.response?.data?.message ||
            "Validation failed."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SERVER ERROR
      |--------------------------------------------------------------------------
      */
      if (err?.response?.status === 500) {
        setError(
          err?.response?.data?.message ||
            "Internal server error. Check Laravel logs."
        );

        return;
      }

      setError(
        err?.response?.data?.message ||
          "Failed to create unit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INPUT ERROR
  |--------------------------------------------------------------------------
  */
  const getInputError = (field) => {
    return validationErrors?.[field]?.[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Create Unit
            </h1>

            <p className="text-gray-500 mt-2">
              Add a new apartment, office,
              rental or room unit.
            </p>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3">

            <AlertTriangle
              size={20}
              className="mt-0.5"
            />

            <div>{error}</div>

          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-2">

            <CheckCircle2 size={18} />

            {success}

          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
        >

          {/* TOP */}
          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center gap-3">

              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">

                <Building2 className="text-blue-600" />

              </div>

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Unit Information
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Fill in all required fields
                  below.
                </p>

              </div>

            </div>

          </div>

          {/* BODY */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* PROPERTY */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Property
              </label>

              <div className="relative">

                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  required
                  disabled={loadingProperties}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                >
                  <option value="">
                    {loadingProperties
                      ? "Loading properties..."
                      : "Select Property"}
                  </option>

                  {properties.map((property) => (
                    <option
                      key={property.id}
                      value={property.id}
                    >
                      {property.name}
                    </option>
                  ))}
                </select>

              </div>

              {getInputError(
                "property_id"
              ) && (
                <p className="text-sm text-red-500">
                  {
                    getInputError(
                      "property_id"
                    )
                  }
                </p>
              )}

            </div>

            {/* UNIT NUMBER */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Unit Number
              </label>

              <div className="relative">

                <Hash
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="unit_number"
                  value={formData.unit_number}
                  onChange={handleChange}
                  placeholder="A-101"
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />

              </div>

              {getInputError(
                "unit_number"
              ) && (
                <p className="text-sm text-red-500">
                  {
                    getInputError(
                      "unit_number"
                    )
                  }
                </p>
              )}

            </div>

            {/* TYPE */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Unit Type
              </label>

              <div className="relative">

                <Home
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                >
                  <option value="">
                    Select Type
                  </option>

                  <option value="bedsitter">
                    Bedsitter
                  </option>

                  <option value="studio">
                    Studio
                  </option>

                  <option value="single_room">
                    Single Room
                  </option>

                  <option value="double_room">
                    Double Room
                  </option>

                  <option value="one_bedroom">
                    One Bedroom
                  </option>

                  <option value="two_bedroom">
                    Two Bedroom
                  </option>

                  <option value="three_bedroom">
                    Three Bedroom
                  </option>

                  <option value="penthouse">
                    Penthouse
                  </option>

                  <option value="office">
                    Office
                  </option>

                  <option value="shop">
                    Shop
                  </option>

                  <option value="warehouse">
                    Warehouse
                  </option>

                  <option value="villa">
                    Villa
                  </option>

                  <option value="airbnb">
                    Airbnb
                  </option>

                </select>

              </div>

              {getInputError("type") && (
                <p className="text-sm text-red-500">
                  {getInputError("type")}
                </p>
              )}

            </div>

            {/* BEDROOMS */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Bedrooms
              </label>

              <div className="relative">

                <BedDouble
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  placeholder="2"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />

              </div>

            </div>

            {/* BATHROOMS */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Bathrooms
              </label>

              <div className="relative">

                <Bath
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  placeholder="1"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />

              </div>

            </div>

            {/* FLOOR */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Floor
              </label>

              <div className="relative">

                <Layers3
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="3"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />

              </div>

            </div>

            {/* RENT */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Rent Amount
              </label>

              <div className="relative">

                <DollarSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="rent_amount"
                  value={formData.rent_amount}
                  onChange={handleChange}
                  placeholder="25000"
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />

              </div>

            </div>

            {/* DEPOSIT */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Deposit Amount
              </label>

              <div className="relative">

                <DollarSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="deposit_amount"
                  value={
                    formData.deposit_amount
                  }
                  onChange={handleChange}
                  placeholder="25000"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />

              </div>

            </div>

            {/* SIZE */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Size (sq ft)
              </label>

              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="500"
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />

            </div>

            {/* STATUS */}
            <div className="space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
              >
                <option value="vacant">
                  Vacant
                </option>

                <option value="occupied">
                  Occupied
                </option>

                <option value="reserved">
                  Reserved
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2 space-y-2">

              <label className="text-sm font-semibold text-gray-700">
                Description
              </label>

              <div className="relative">

                <FileText
                  size={18}
                  className="absolute left-4 top-4 text-gray-400"
                />

                <textarea
                  rows="5"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter unit description..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
                />

              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="border-t border-gray-100 p-6 flex flex-col sm:flex-row justify-end gap-3">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-12 px-6 rounded-2xl border border-gray-200 bg-white hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Unit
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateUnit;