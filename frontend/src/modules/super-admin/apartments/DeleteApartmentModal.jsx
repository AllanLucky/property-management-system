import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

const DeleteApartmentModal = ({
  isOpen,
  apartment = {},
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const handleDelete = () => {
    if (typeof onConfirm === "function") {
      onConfirm(apartment);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Delete Apartment
              </h2>

              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-6">
          <p className="text-sm leading-7 text-gray-700">
            Are you sure you want to permanently delete the apartment
            <span className="mx-1 font-semibold text-gray-900">
              "{apartment?.name || "Unknown Apartment"}"
            </span>
            ?
          </p>

          {apartment?.property?.title && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Property
                </span>

                <p className="mt-1 font-semibold text-gray-900">
                  {apartment.property.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </span>

                  <p className="mt-1 text-sm text-gray-700">
                    {apartment?.status || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Floors
                  </span>

                  <p className="mt-1 text-sm text-gray-700">
                    {apartment?.total_floors ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Deleting this apartment may also affect related units,
              tenants, leases, and reports depending on your backend
              configuration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Apartment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteApartmentModal;