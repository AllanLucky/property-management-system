import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";

import useApartment from "../../../hooks/useApartment";
import useProperty from "../../../hooks/useProperties";

import ApartmentForm from "./ApartmentForm";

const EditApartment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | APARTMENT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    apartment,
    getApartment,
    updateApartment,
    loading,
  } = useApartment();

  /*
  |--------------------------------------------------------------------------
  | PROPERTY HOOK
  |--------------------------------------------------------------------------
  */

  const {
    properties = [],
    getProperties,
  } = useProperty();

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

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
  | LOAD APARTMENT + PROPERTIES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    getProperties({
      with_relations: true,
    });

    getApartment(id);
  }, [
    id,
    getApartment,
    getProperties,
  ]);

  /*
  |--------------------------------------------------------------------------
  | POPULATE FORM
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!apartment) {
      return;
    }

    console.log(
      "Apartment:",
      apartment
    );

    setForm({
      /*
      |--------------------------------------------------------------------------
      | PROPERTY
      |--------------------------------------------------------------------------
      */

      property_id:
        apartment.property_id ??
        apartment.property?.id ??
        "",

      /*
      |--------------------------------------------------------------------------
      | BASIC INFORMATION
      |--------------------------------------------------------------------------
      */

      name:
        apartment.name ?? "",

      slug:
        apartment.slug ?? "",

      code:
        apartment.code ?? "",

      description:
        apartment.description ?? "",

      /*
      |--------------------------------------------------------------------------
      | BUILDING INFORMATION
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      status:
        apartment.status?.value ??
        apartment.status ??
        "active",

      /*
      |--------------------------------------------------------------------------
      | FEATURES
      |--------------------------------------------------------------------------
      */

      has_elevator:
        Boolean(
          apartment.features?.has_elevator ??
          apartment.has_elevator ??
          false
        ),

      has_backup_generator:
        Boolean(
          apartment.features
            ?.has_backup_generator ??
          apartment.has_backup_generator ??
          false
        ),

      has_security:
        Boolean(
          apartment.features?.has_security ??
          apartment.has_security ??
          false
        ),

      has_parking:
        Boolean(
          apartment.features?.has_parking ??
          apartment.has_parking ??
          false
        ),

      /*
      |--------------------------------------------------------------------------
      | IMAGE
      |--------------------------------------------------------------------------
      */

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
  | HANDLE FORM CHANGE
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
  | HANDLE IMAGE
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
  | HANDLE SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    try {
      /*
      |--------------------------------------------------------------------------
      | BUILD FORM DATA
      |--------------------------------------------------------------------------
      */

      const formData = new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            formData.append(
              key,
              value
            );
          }
        }
      );

      /*
      |--------------------------------------------------------------------------
      | UPDATE APARTMENT
      |--------------------------------------------------------------------------
      */

      await updateApartment(
        id,
        formData
      );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS NOTIFICATION
      |--------------------------------------------------------------------------
      */

      dispatch(
        addNotification({
          type: "success",
          message:
            "Apartment updated successfully.",
        })
      );

      /*
      |--------------------------------------------------------------------------
      | REDIRECT
      |--------------------------------------------------------------------------
      */

      navigate(
        "/super-admin/apartments"
      );
    } catch (error) {
      console.error(
        "Failed to update apartment:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | ERROR NOTIFICATION
      |--------------------------------------------------------------------------
      */

      dispatch(
        addNotification({
          type: "error",
          message:
            error?.response?.data
              ?.message ||
            error?.message ||
            "Failed to update apartment. Please try again.",
        })
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING APARTMENT
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !apartment
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">

          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-indigo-600
            "
          />

          <p className="mt-4 text-sm text-gray-500">
            Loading apartment...
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
    <div className="space-y-6">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-bold
              tracking-tight
              text-gray-900
            "
          >
            Edit Apartment
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-600
            "
          >
            Update apartment details,
            features and property
            assignment.
          </p>

        </div>

        {/* ============================================================
            BACK BUTTON
        ============================================================= */}

        <Link
          to="/super-admin/apartments"
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
            focus:outline-none
            focus:ring-2
            focus:ring-indigo-500
            focus:ring-offset-2
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Apartments
        </Link>

      </div>

      {/* ================================================================
          FORM
      ================================================================= */}

      <div
        className="
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
        "
      >

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