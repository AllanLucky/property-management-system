import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import StreetOpenMap from "../../../modules/super-admin/maps/StreetOpenMap";
import { createPropertyApi } from "../../../services/property.service";
import api from "../../../api/axios";

import {
  Loader2,
  ArrowLeft,
  UploadCloud,
  Wifi,
  Shield,
  PawPrint,
  Home,
  Building2,
  MapPin,
  DollarSign,
} from "lucide-react";

const CreateProperty = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  // DROPDOWNS DATA
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [propertyCategories, setPropertyCategories] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | FETCH DROPDOWNS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          countriesRes,
          regionsRes,
          countiesRes,
          citiesRes,
          areasRes,
          typesRes,
          categoriesRes,
        ] = await Promise.all([
          api.get("/countries"),
          api.get("/regions"),
          api.get("/counties"),
          api.get("/cities"),
          api.get("/areas"),
          api.get("/property-types"),
          api.get("/property-categories"),
        ]);

        setCountries(countriesRes.data || []);
        setRegions(regionsRes.data || []);
        setCounties(countiesRes.data || []);
        setCities(citiesRes.data || []);
        setAreas(areasRes.data || []);
        setPropertyTypes(typesRes.data || []);
        setPropertyCategories(categoriesRes.data || []);
      } catch (err) {
        console.log("Dropdown load error", err);
      }
    };

    fetchData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SLUG GENERATOR
  |--------------------------------------------------------------------------
  */
  const generateSlug = (text) =>
    text
      ?.toLowerCase()
      ?.trim()
      ?.replace(/[^a-z0-9]+/g, "-")
      ?.replace(/(^-|-$)+/g, "");

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",

    listing_type: "sale",
    status: "draft",

    property_type_id: "",
    property_category_id: "",

    country: "",
    region: "",
    county: "",
    city: "",
    area: "",
    street_address: "",

    latitude: "",
    longitude: "",

    bedrooms: "",
    bathrooms: "",
    toilets: "",
    garages: "",
    parking_spaces: "",
    floors: "",
    size: "",
    size_unit: "sqm",

    price: "",
    monthly_rent: "",

    is_featured: false,
    is_verified: false,
    is_published: true,

    has_wifi: false,
    has_security: false,
    has_garden: false,
    has_swimming_pool: false,

    thumbnail: null,
  });

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "title") {
      setForm((prev) => ({
        ...prev,
        title: value,
        slug: generateSlug(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  */
  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, thumbnail: file }));
    setPreview(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | MAP
  |--------------------------------------------------------------------------
  */
  const handleMapChange = ({ latitude, longitude, address }) => {
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude,
      street_address: address || prev.street_address,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) return;

        if (typeof value === "boolean") {
          formData.append(key, value ? 1 : 0);
        } else if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value);
        }
      });

      await createPropertyApi(formData);

      navigate("/super-admin/properties");
    } catch (err) {
      setErrors(
        err?.response?.data?.errors || {
          general: ["Property creation failed"],
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const Feature = ({ name, label, icon: Icon }) => (
    <label className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={form[name]}
        onChange={handleChange}
      />
      <Icon size={18} className="text-blue-600" />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create Property</h1>

        <Link
          to="/super-admin/properties"
          className="flex items-center gap-2 border px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </Link>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* BASIC */}
          <div className="bg-white border rounded-2xl p-6">
            <Building2 className="text-blue-600 mb-2" />
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Property title"
              className="w-full border p-3 rounded-xl mb-3"
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full border p-3 rounded-xl"
              rows={5}
            />
          </div>

          {/* LOCATION */}
          <div className="bg-white border rounded-2xl p-6">

            <MapPin className="text-blue-600 mb-3" />

            {/* COUNTRY */}
            <select name="country" value={form.country} onChange={handleChange} className="w-full border p-3 rounded-xl mb-2">
              <option>Select Country</option>
              {countries.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* REGION */}
            <select name="region" value={form.region} onChange={handleChange} className="w-full border p-3 rounded-xl mb-2">
              <option>Select Region</option>
              {regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>

            {/* COUNTY */}
            <select name="county" value={form.county} onChange={handleChange} className="w-full border p-3 rounded-xl mb-2">
              <option>Select County</option>
              {counties.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* CITY */}
            <select name="city" value={form.city} onChange={handleChange} className="w-full border p-3 rounded-xl mb-2">
              <option>Select City</option>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* AREA */}
            <select name="area" value={form.area} onChange={handleChange} className="w-full border p-3 rounded-xl mb-2">
              <option>Select Area</option>
              {areas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>

            <input
              name="street_address"
              value={form.street_address}
              onChange={handleChange}
              placeholder="Street address"
              className="w-full border p-3 rounded-xl mb-3"
            />

            <div className="h-[300px] border rounded-xl overflow-hidden">
              <StreetOpenMap
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={handleMapChange}
              />
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* PROPERTY TYPE */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold mb-2">Property Type</h2>
            <select
              name="property_type_id"
              value={form.property_type_id}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
            >
              <option>Select Type</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold mb-2">Category</h2>
            <select
              name="property_category_id"
              value={form.property_category_id}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
            >
              <option>Select Category</option>
              {propertyCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* IMAGE */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold mb-3">Thumbnail</h2>

            {preview ? (
              <img src={preview} className="h-48 w-full object-cover rounded-xl" />
            ) : (
              <div className="h-48 border-dashed border-2 flex items-center justify-center rounded-xl">
                <UploadCloud className="text-gray-400" />
              </div>
            )}

            <input type="file" onChange={handleImage} className="mt-3" />
          </div>

          {/* FEATURES */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold mb-3">Features</h2>

            <div className="grid grid-cols-2 gap-2">
              <Feature name="has_wifi" label="WiFi" icon={Wifi} />
              <Feature name="has_security" label="Security" icon={Shield} />
              <Feature name="has_garden" label="Garden" icon={PawPrint} />
              <Feature name="has_swimming_pool" label="Pool" icon={Home} />
            </div>
          </div>

          {/* PRICE */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold mb-2">Pricing</h2>

            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price"
              className="w-full border p-3 rounded-xl mb-2"
            />

            <input
              name="monthly_rent"
              value={form.monthly_rent}
              onChange={handleChange}
              placeholder="Monthly Rent"
              className="w-full border p-3 rounded-xl"
            />
          </div>

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-xl"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Property"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProperty;