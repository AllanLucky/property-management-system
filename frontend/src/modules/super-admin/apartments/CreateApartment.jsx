
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";

import useApartment from "../../../hooks/useApartment";
import useProperty from "../../../hooks/useProperties";

import ApartmentForm from "./ApartmentForm";

const CreateApartment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    createApartment,
    loading,
  } = useApartment();

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
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD PROPERTIES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    getProperties({
      with_relations: true,
    });
  }, [getProperties]);

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
    e.preventDefault();

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

      await createApartment(formData);

      dispatch(
        addNotification({
          type: "success",
          message: "Apartment created successfully.",
        })
      );

      navigate("/super-admin/apartments");
    } catch (error) {
      console.error(
        "Failed to create apartment:",
        error
      );

      dispatch(
        addNotification({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Failed to create apartment.",
        })
      );
    }
  };

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

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
              "
            >
              <ArrowLeft
                className="
                  h-5
                  w-5
                  text-indigo-600
                "
              />
            </div>

            <div>

              <h1
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-gray-900
                "
              >
                Create Apartment
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Create a new apartment and
                assign it to an existing property.
              </p>

            </div>

          </div>

        </div>

        {/* ============================================================
            BACK BUTTON
        ============================================================= */}

        <Link
          to="/super-admin/apartments"
          className="
            inline-flex
            items-center
            justify-center
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
          APARTMENT FORM
      ================================================================= */}

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

