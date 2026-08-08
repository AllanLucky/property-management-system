import { useMemo, useState } from "react";
import {
  Building2,
  Hash,
  Layers3,
  FileText,
  Image as ImageIcon,
  Save,
  Loader2,
  ShieldCheck,
  Car,
  Zap,
} from "lucide-react";

const ApartmentForm = ({
  mode = "create",
  form,
  setForm,
  properties = [],
  loading = false,
  onChange,
  onImageChange,
  onSubmit,
}) => {
  const [preview, setPreview] = useState(form?.thumbnail_url || null);

  const propertyList = useMemo(() => {
    if (Array.isArray(properties)) return properties;
    if (Array.isArray(properties?.data)) return properties.data;
    return [];
  }, [properties]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    if (onImageChange) {
      onImageChange(file);
    } else {
      setForm((prev) => ({
        ...prev,
        thumbnail: file,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e); // ✅ forward the event
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl bg-white p-8 shadow-md"
    >
      {/* General Information */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          General Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField icon={<Building2 className="h-4 w-4" />} label="Property">
            <select
              name="property_id"
              value={form.property_id}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="">Select Property</option>
              {propertyList.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField icon={<Building2 className="h-4 w-4" />} label="Apartment Name">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none"
              placeholder="Apartment Name"
              required
            />
          </FormField>

          <FormField icon={<Hash className="h-4 w-4" />} label="Block">
            <input
              type="text"
              name="block"
              value={form.block}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              placeholder="A, B, C..."
            />
          </FormField>

          <FormField icon={<Layers3 className="h-4 w-4" />} label="Total Floors">
            <input
              type="number"
              min="1"
              name="total_floors"
              value={form.total_floors}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </FormField>

          <FormField icon={<Building2 className="h-4 w-4" />} label="Total Units">
            <input
              type="number"
              min="0"
              name="total_units"
              value={form.total_units}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </FormField>

          <FormField label="Status">
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </FormField>
        </div>
      </section>

      <section>
        <FormField icon={<FileText className="h-4 w-4" />} label="Description">
          <textarea
            rows={5}
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="Apartment description..."
          />
        </FormField>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Checkbox
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Security"
            name="has_security"
            checked={form.has_security}
            onChange={onChange}
          />
          <Checkbox
            icon={<Car className="h-4 w-4" />}
            label="Parking"
            name="has_parking"
            checked={form.has_parking}
            onChange={onChange}
          />
          <Checkbox
            icon={<Zap className="h-4 w-4" />}
            label="Backup Generator"
            name="has_backup_generator"
            checked={form.has_backup_generator}
            onChange={onChange}
          />
          <Checkbox
            icon={<Building2 className="h-4 w-4" />}
            label="Elevator"
            name="has_elevator"
            checked={form.has_elevator}
            onChange={onChange}
          />
        </div>
      </section>

      <section>
        <FormField icon={<ImageIcon className="h-4 w-4" />} label="Apartment Thumbnail">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 h-56 w-full rounded-xl border object-cover"
            />
          )}
        </FormField>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {mode === "edit" ? "Update Apartment" : "Create Apartment"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const FormField = ({ icon, label, children }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

const Checkbox = ({ icon, label, name, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4"
    />
    <span className="text-indigo-600">{icon}</span>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </label>
);

export default ApartmentForm;
