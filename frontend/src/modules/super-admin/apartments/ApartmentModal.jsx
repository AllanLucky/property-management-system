import { X, Building2, Layers3, DoorOpen, MapPin, CheckCircle2 } from "lucide-react";

const ApartmentModal = ({
  isOpen,
  onClose,
  apartment = {},
}) => {
  if (!isOpen) return null;

  const property = apartment?.property || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Apartment Details
            </h2>
            <p className="text-sm text-gray-500">
              View apartment information.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Apartment */}
          <div className="grid gap-5 md:grid-cols-2">
            <InfoCard
              icon={<Building2 className="h-5 w-5 text-indigo-600" />}
              title="Apartment Name"
              value={apartment?.name || "N/A"}
            />

            <InfoCard
              icon={<Layers3 className="h-5 w-5 text-blue-600" />}
              title="Block"
              value={apartment?.block || "N/A"}
            />

            <InfoCard
              icon={<DoorOpen className="h-5 w-5 text-green-600" />}
              title="Floor"
              value={apartment?.floor ?? "N/A"}
            />

            <InfoCard
              icon={<DoorOpen className="h-5 w-5 text-purple-600" />}
              title="Total Floors"
              value={apartment?.total_floors ?? "N/A"}
            />

            <InfoCard
              icon={<DoorOpen className="h-5 w-5 text-orange-600" />}
              title="Total Units"
              value={apartment?.total_units ?? 0}
            />

            <InfoCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              title="Status"
              value={apartment?.status || "N/A"}
            />
          </div>

          {/* Property */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Property Information
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <InfoCard
                icon={<Building2 className="h-5 w-5 text-indigo-600" />}
                title="Property"
                value={property?.title || "N/A"}
              />

              <InfoCard
                icon={<MapPin className="h-5 w-5 text-red-600" />}
                title="Location"
                value={
                  property?.location?.full_location ||
                  property?.address ||
                  "N/A"
                }
              />

              <InfoCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                title="Property Status"
                value={property?.status || "N/A"}
              />

              <InfoCard
                icon={<Layers3 className="h-5 w-5 text-blue-600" />}
                title="Property Code"
                value={property?.property_code || "N/A"}
              />
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Description
            </h3>

            <p className="text-sm leading-7 text-gray-600">
              {apartment?.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({
  icon,
  title,
  value,
}) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <div className="mb-2 flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium text-gray-500">
        {title}
      </span>
    </div>

    <p className="text-base font-semibold text-gray-900">
      {value}
    </p>
  </div>
);

export default ApartmentModal;