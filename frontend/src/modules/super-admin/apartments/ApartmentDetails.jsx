import {
  Building2,
  Home,
  Layers3,
  DoorOpen,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  Car,
  Zap,
  Users,
  Loader2,
} from "lucide-react";

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
      {icon}
    </div>

    <div className="flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value ?? "—"}
      </p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusValue =
    typeof status === "object"
      ? status?.value
      : status;

  const statusLabel =
    typeof status === "object"
      ? status?.label
      : status;

  const colors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
    maintenance: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        colors[statusValue] || "bg-gray-100 text-gray-700"
      }`}
    >
      {statusLabel || "Unknown"}
    </span>
  );
};

const FeatureBadge = ({ active, label, icon }) => (
  <div
    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
      active
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-gray-200 bg-gray-50 text-gray-400"
    }`}
  >
    {icon}

    <span className="text-sm font-medium">
      {label}
    </span>

    {active ? (
      <CheckCircle2 className="ml-auto h-4 w-4" />
    ) : (
      <XCircle className="ml-auto h-4 w-4" />
    )}
  </div>
);

const ApartmentDetails = ({
  apartment,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />

        <h2 className="text-xl font-semibold text-gray-700">
          Apartment not found
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          No apartment details are available.
        </p>
      </div>
    );
  }

  const property = apartment.property ?? {};
  const building = apartment.building ?? {};
  const counts = apartment.counts ?? {};

  const features = apartment.features ?? {
    has_security: apartment.has_security,
    has_parking: apartment.has_parking,
    has_backup_generator:
      apartment.has_backup_generator,
    has_elevator: apartment.has_elevator,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {apartment.name}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {apartment.description ||
                "No description available."}
            </p>
          </div>

          <StatusBadge
            status={apartment.status}
          />
        </div>
      </div>

      {/* Apartment Information */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Apartment Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem
            icon={<Building2 className="h-5 w-5" />}
            label="Property"
            value={
              property.title ||
              property.name
            }
          />

          <DetailItem
            icon={<Layers3 className="h-5 w-5" />}
            label="Block"
            value={
              building.block ??
              apartment.block
            }
          />

          <DetailItem
            icon={<Home className="h-5 w-5" />}
            label="Apartment Name"
            value={apartment.name}
          />

          <DetailItem
            icon={<DoorOpen className="h-5 w-5" />}
            label="Total Units"
            value={
              counts.units ??
              apartment.total_units
            }
          />

          <DetailItem
            icon={<Building2 className="h-5 w-5" />}
            label="Floor"
            value={
              building.floor ??
              apartment.floor
            }
          />

          <DetailItem
            icon={<Layers3 className="h-5 w-5" />}
            label="Total Floors"
            value={
              building.total_floors ??
              apartment.total_floors
            }
          />

          <DetailItem
            icon={<Users className="h-5 w-5" />}
            label="Occupied Units"
            value={
              counts.occupied_units ??
              apartment.occupied_units_count
            }
          />

          <DetailItem
            icon={<Home className="h-5 w-5" />}
            label="Vacant Units"
            value={
              counts.vacant_units ??
              apartment.vacant_units_count
            }
          />

          <DetailItem
            icon={<Calendar className="h-5 w-5" />}
            label="Created"
            value={
              apartment.created_at
                ? new Date(
                    apartment.created_at
                  ).toLocaleDateString()
                : "—"
            }
          />
        </div>
      </div>

      {/* Features */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Apartment Features
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FeatureBadge
            active={features.has_security}
            label="Security"
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
          />

          <FeatureBadge
            active={features.has_parking}
            label="Parking"
            icon={<Car className="h-5 w-5" />}
          />

          <FeatureBadge
            active={
              features.has_backup_generator
            }
            label="Generator"
            icon={<Zap className="h-5 w-5" />}
          />

          <FeatureBadge
            active={features.has_elevator}
            label="Elevator"
            icon={
              <Building2 className="h-5 w-5" />
            }
          />
        </div>
      </div>

      {/* Property Location */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Property Location
        </h2>

        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
          <MapPin className="mt-1 h-5 w-5 text-blue-600" />

          <div>
            <p className="font-medium text-gray-900">
              {property?.location
                ?.full_location ||
                property?.location
                  ?.street_address ||
                property?.street_address ||
                "No location available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentDetails;