import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useApartment from "../../../hooks/useApartment";
import useProperty from "../../../hooks/useProperties";

import ApartmentForm from "./ApartmentForm";

const EditApartment = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    apartment,
    getApartment,
    updateApartment,
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
    thumbnail_url: "",
  });

  /*
  |--------------------------------------------------------------------------
  | Load Data
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    getProperties({
      with_relations: true,
    });

    getApartment(id);
  }, [id, getApartment, getProperties]);

  /*
  |--------------------------------------------------------------------------
  | Populate Form
  |--------------------------------------------------------------------------
  */
  /*
 |--------------------------------------------------------------------------
 | Populate Form
 |--------------------------------------------------------------------------
 */
  useEffect(() => {
    if (!apartment) return;

    console.log("Apartment:", apartment);

    setForm({
      // Property
      property_id:
        apartment.property_id ??
        apartment.property?.id ??
        "",

      // Basic Information
      name: apartment.name ?? "",
      slug: apartment.slug ?? "",
      code: apartment.code ?? "",
      description: apartment.description ?? "",

      // Building Information
      block:
        apartment.building?.block ??
        apartment.block ??
        "",

      floor:
        apartment.building?.floor ??
        apartment.floor ??
        1,

      total_floors:
        apartment.building?.total_floors ??
        apartment.total_floors ??
        1,

      total_units:
        apartment.counts?.units ??
        apartment.total_units ??
        0,

      // Status
      status:
        apartment.status?.value ??
        apartment.status ??
        "active",

      // Featuress
      has_elevator:
        apartment.features?.has_elevator ??
        apartment.has_elevator ??
        false,

      has_backup_generator:
        apartment.features?.has_backup_generator ??
        apartment.has_backup_generator ??
        false,

      has_security:
        apartment.features?.has_security ??
        apartment.has_security ??
        false,

      has_parking:
        apartment.features?.has_parking ??
        apartment.has_parking ??
        false,

      // Image
      thumbnail: null,

      thumbnail_url:
        apartment.media?.thumbnail_url ??
        apartment.media?.thumbnail ??
        apartment.thumbnail_url ??
        apartment.thumbnail ??
        "",
    });
  }, [apartment]);

  /*
  |--------------------------------------------------------------------------
  | Form Change
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Image
  |--------------------------------------------------------------------------
  */
  const handleImage = (file) => {
    setForm((prev) => ({
      ...prev,
      thumbnail: file,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            formData.append(key, value);
          }
        }
      );

      await updateApartment(id, formData);

      navigate("/super-admin/apartments");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Edit Apartment
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Update apartment details,
              features and property
              assignment.
            </p>
          </div>

          <Link
            to="/super-admin/apartments"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Apartments
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <ApartmentForm
          mode="edit"
          form={form}
          setForm={setForm}
          properties={properties}
          loading={loading}
          onChange={handleChange}
          onImageChange={handleImage}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default EditApartment;