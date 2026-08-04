import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import ApartmentDetails from "./ApartmentDetails";

const ViewApartment = ({
  apartment,
  loading = false,
}) => {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Apartment Details
          </h1>

          <p className="mt-2 text-gray-600">
            View complete apartment information including property,
            units, features, and location.
          </p>
        </div>

        <Link
          to="/super-admin/apartments"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Apartments
        </Link>
      </div>

      {/* Apartment Details */}
      <ApartmentDetails
        apartment={apartment}
        loading={loading}
      />
    </div>
  );
};

export default ViewApartment;