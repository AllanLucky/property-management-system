
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import PropertyHeader from "./PropertyHeader";
import PropertyForm from "./PropertyForm";

import useProperty from "../../../hooks/useProperties";
import api from "../../../api/axios";

const CreateProperty = () => {
  const navigate = useNavigate();

  const {
    addProperty,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | FORM OPTIONS
  |--------------------------------------------------------------------------
  */

  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);

  const [propertyTypes, setPropertyTypes] = useState([]);
  const [propertyCategories, setPropertyCategories] = useState([]);

  const [dropdownLoading, setDropdownLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | LOAD FORM OPTIONS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        setDropdownLoading(true);

        const [
          countriesRes,
          regionsRes,
          countiesRes,
          citiesRes,
          areasRes,
          propertyTypesRes,
          propertyCategoriesRes,
        ] = await Promise.all([
          api.get("/countries"),
          api.get("/regions"),
          api.get("/counties"),
          api.get("/cities"),
          api.get("/areas"),
          api.get("/property-types"),
          api.get("/property-categories"),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Extract API Data
        |--------------------------------------------------------------------------
        */

        const extractData = (response) => {
          const data = response?.data;

          if (Array.isArray(data)) {
            return data;
          }

          if (Array.isArray(data?.data)) {
            return data.data;
          }

          return [];
        };

        if (!mounted) {
          return;
        }

        setCountries(extractData(countriesRes));
        setRegions(extractData(regionsRes));
        setCounties(extractData(countiesRes));
        setCities(extractData(citiesRes));
        setAreas(extractData(areasRes));

        setPropertyTypes(
          extractData(propertyTypesRes)
        );

        setPropertyCategories(
          extractData(propertyCategoriesRes)
        );
      } catch (error) {
        console.error(
          "Failed to load property form options:",
          error
        );

        if (mounted) {
          setErrors({
            general: [
              "Unable to load the property form options. Please refresh the page and try again.",
            ],
          });
        }
      } finally {
        if (mounted) {
          setDropdownLoading(false);
        }
      }
    };

    loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT PROPERTY
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setErrors({});

      await addProperty(formData);

      navigate("/super-admin/properties");
    } catch (error) {
      console.error(
        "Property creation failed:",
        error
      );

      const validationErrors =
        error?.response?.data?.errors;

      if (validationErrors) {
        setErrors(validationErrors);
      } else {
        setErrors({
          general: [
            error?.response?.data?.message ||
              propertyError ||
              "Unable to create the property. Please try again.",
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    navigate("/super-admin/properties");
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMITTING STATE
  |--------------------------------------------------------------------------
  */

  const isSubmitting =
    loading || propertyLoading;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================================
          PROPERTY HEADER
      ============================================================ */}

      <PropertyHeader
        title="Create Property"
        description="Add a new property to your portfolio."
        backLabel="Back to Properties"
        backTo="/super-admin/properties"
      />

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ============================================================
            GENERAL ERROR
        ============================================================ */}

        {errors?.general && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {Array.isArray(errors.general)
              ? errors.general[0]
              : errors.general}
          </div>
        )}

        {/* ============================================================
            FORM LOADING
        ============================================================ */}

        {dropdownLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Preparing property form
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Loading property types, categories and
                  location information...
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             PROPERTY FORM
          ============================================================ */

          <PropertyForm
            countries={countries}
            regions={regions}
            counties={counties}
            cities={cities}
            areas={areas}
            propertyTypes={propertyTypes}
            propertyCategories={propertyCategories}
            errors={errors}
            loading={isSubmitting}
            submitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Create Property"
            cancelLabel="Cancel"
          />
        )}
      </main>
    </div>
  );
};

export default CreateProperty;
