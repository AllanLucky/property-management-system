import {
  ArrowLeft,
  Building2,
  Layers3,
  FileText,
  Hash,
  CheckCircle2,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

const ViewApartment = ({
  apartment = {},
}) => {
  const property = apartment?.property || {};

  const image =
    apartment?.image_url ||
    apartment?.image ||
    apartment?.thumbnail ||
    "https://placehold.co/800x500?text=Apartment";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Apartment Details
          </h1>

          <p className="mt-1 text-gray-500">
            View complete apartment information.
          </p>
        </div>

        <Link
          to="/super-admin/apartments"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <img
            src={image}
            alt={apartment?.name}
            className="h-72 w-full object-cover"
          />

          <div className="border-t border-gray-200 p-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">
                Apartment Image
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Apartment Information */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Apartment Information
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <InfoCard
                icon={<Building2 className="h-5 w-5 text-indigo-600" />}
                label="Apartment Name"
                value={apartment?.name}
              />

              <InfoCard
                icon={<Hash className="h-5 w-5 text-blue-600" />}
                label="Code"
                value={apartment?.code}
              />

              <InfoCard
                icon={<Hash className="h-5 w-5 text-purple-600" />}
                label="Slug"
                value={apartment?.slug}
              />

              <InfoCard
                icon={<Layers3 className="h-5 w-5 text-orange-600" />}
                label="Total Floors"
                value={apartment?.total_floors}
              />

              <InfoCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                label="Status"
                value={apartment?.status}
              />

              <InfoCard
                icon={<Building2 className="h-5 w-5 text-pink-600" />}
                label="Property"
                value={property?.title}
              />
            </div>
          </div>

          {/* Property Information */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Property Information
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <InfoCard
                icon={<Building2 className="h-5 w-5 text-indigo-600" />}
                label="Property Name"
                value={property?.title}
              />

              <InfoCard
                icon={<Hash className="h-5 w-5 text-blue-600" />}
                label="Property Code"
                value={property?.property_code}
              />

              <InfoCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                label="Status"
                value={property?.status}
              />

              <InfoCard
                icon={<MapPin className="h-5 w-5 text-red-600" />}
                label="Location"
                value={
                  property?.location?.full_location ||
                  property?.location?.street_address
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Description
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 text-indigo-600" />

                <p className="leading-7 text-gray-700">
                  {apartment?.description ||
                    "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Metadata
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <InfoCard
                label="Created At"
                value={apartment?.created_at}
              />

              <InfoCard
                label="Updated At"
                value={apartment?.updated_at}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <div className="mb-2 flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium text-gray-500">
        {label}
      </span>
    </div>

    <p className="break-words text-base font-semibold text-gray-900">
      {value || "N/A"}
    </p>
  </div>
);

export default ViewApartment;