import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import useApartment from "../../../hooks/useApartment";
import useProperty from "../../../hooks/useProperties";

import ApartmentForm from "./ApartmentForm";

const CreateApartment = () => {
  const navigate = useNavigate();

  const {
    addApartment,
    loading,
  } = useApartment();

  const {
    properties,
    getProperties,
  } = useProperty();

  const [form, setForm] = useState({
    property_id: "",
    name: "",
    slug: "",
    code: "",
    description: "",
    block: "",
    floor: 1,
    total_floors: 1,
    total_units: 0,
    status: "active",
    has_elevator: false,
    has_backup_generator: false,
    has_security: false,
    has_parking: false,
    thumbnail: null,
  });

  useEffect(() => {
    getProperties({
      with_relations: true,
    });
  }, [getProperties]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleImage = (file) => {
    setForm((prev) => ({
      ...prev,
      thumbnail: file,
    }));
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          formData.append(key, value);
        }
      });

      await addApartment(formData);

      navigate("/super-admin/apartments");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Create Apartment
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Create a new apartment and assign it to an existing property.
            </p>
          </div>

          <Link
            to="/super-admin/apartments"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Apartments
          </Link>
        </div>
      </div>

      <ApartmentForm
        mode="create"
        form={form}
        setForm={setForm}
        properties={properties}
        loading={loading}
        onChange={handleChange}
        onImageChange={handleImage}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CreateApartment;