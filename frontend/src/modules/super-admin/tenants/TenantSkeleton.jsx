import {
  CircleUserRound,
  Loader2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TenantSkeleton
|--------------------------------------------------------------------------
| Loading skeleton for the Tenant module.
|--------------------------------------------------------------------------
|
| Supports:
| - Tenant table loading
| - Tenant list loading
| - Tenant cards loading
| - Full-page loading
|--------------------------------------------------------------------------
*/

const TenantSkeleton = ({
  variant = "table",
  rows = 8,
  showHeader = true,
  showFooter = true,
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE ROWS
  |--------------------------------------------------------------------------
  */

  const skeletonRows = Math.max(
    Number(rows) || 8,
    1
  );

  /*
  |--------------------------------------------------------------------------
  | TABLE SKELETON
  |--------------------------------------------------------------------------
  */

  if (variant === "table") {
    return (
      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-gray-200
          bg-white
          shadow-sm
        "
      >
        {/* ==============================================================
            HEADER
        ============================================================== */}

        {showHeader && (
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-5">
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />

              <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
            </div>

            <div className="hidden h-9 w-24 animate-pulse rounded-lg bg-gray-100 sm:block" />
          </div>
        )}

        {/* ==============================================================
            TABLE
        ============================================================== */}

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            {/* ==========================================================
                THEAD
            =========================================================== */}

            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {[
                  "Tenant",
                  "Contact",
                  "Property / Unit",
                  "Location",
                  "Status",
                  "Verification",
                  "Created",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left"
                  >
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                  </th>
                ))}
              </tr>
            </thead>

            {/* ==========================================================
                TBODY
            =========================================================== */}

            <tbody className="divide-y divide-gray-100">
              {Array.from({
                length: skeletonRows,
              }).map((_, index) => (
                <tr
                  key={index}
                  className="animate-pulse"
                >
                  {/* ----------------------------------------------------
                      TENANT
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <CircleUserRound className="h-5 w-5 text-gray-300" />
                      </div>

                      <div className="space-y-2">
                        <div className="h-4 w-28 rounded bg-gray-200" />

                        <div className="h-3 w-20 rounded bg-gray-100" />
                      </div>
                    </div>
                  </td>

                  {/* ----------------------------------------------------
                      CONTACT
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="h-3 w-36 rounded bg-gray-200" />

                      <div className="h-3 w-28 rounded bg-gray-100" />
                    </div>
                  </td>

                  {/* ----------------------------------------------------
                      PROPERTY / UNIT
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-200" />

                      <div className="h-3 w-24 rounded bg-gray-100" />
                    </div>
                  </td>

                  {/* ----------------------------------------------------
                      LOCATION
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                  </td>

                  {/* ----------------------------------------------------
                      STATUS
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="h-6 w-20 rounded-full bg-gray-200" />
                  </td>

                  {/* ----------------------------------------------------
                      VERIFICATION
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="h-6 w-24 rounded-full bg-gray-200" />

                      <div className="h-3 w-16 rounded bg-gray-100" />
                    </div>
                  </td>

                  {/* ----------------------------------------------------
                      CREATED
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-gray-200" />
                  </td>

                  {/* ----------------------------------------------------
                      ACTIONS
                  ----------------------------------------------------- */}

                  <td className="px-4 py-4">
                    <div className="ml-auto h-9 w-9 rounded-lg bg-gray-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ==============================================================
            FOOTER
        ============================================================== */}

        {showFooter && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />

              <div className="flex items-center gap-1">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />

                <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />

                <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />

                <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />

                <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CARD SKELETON
  |--------------------------------------------------------------------------
  */

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: skeletonRows,
        }).map((_, index) => (
          <div
            key={index}
            className="
              animate-pulse
              rounded-xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            "
          >
            {/* Avatar + Name */}

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />

                <div className="h-3 w-24 rounded bg-gray-100" />
              </div>

              <div className="h-7 w-16 rounded-full bg-gray-200" />
            </div>

            {/* Contact */}

            <div className="mt-5 space-y-3">
              <div className="h-3 w-full rounded bg-gray-100" />

              <div className="h-3 w-4/5 rounded bg-gray-100" />

              <div className="h-3 w-3/5 rounded bg-gray-100" />
            </div>

            {/* Property */}

            <div className="mt-5 rounded-lg bg-gray-50 p-3">
              <div className="h-3 w-20 rounded bg-gray-200" />

              <div className="mt-2 h-4 w-32 rounded bg-gray-200" />

              <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
            </div>

            {/* Footer */}

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="h-3 w-20 rounded bg-gray-100" />

              <div className="h-8 w-20 rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LIST SKELETON
  |--------------------------------------------------------------------------
  */

  if (variant === "list") {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {Array.from({
          length: skeletonRows,
        }).map((_, index) => (
          <div
            key={index}
            className="
              flex
              animate-pulse
              items-center
              gap-4
              border-b
              border-gray-100
              px-4
              py-4
              last:border-b-0
            "
          >
            {/* Avatar */}

            <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />

            {/* Main */}

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-gray-200" />

              <div className="h-3 w-52 max-w-full rounded bg-gray-100" />
            </div>

            {/* Status */}

            <div className="hidden h-6 w-20 rounded-full bg-gray-200 sm:block" />

            {/* Action */}

            <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STATS SKELETON
  |--------------------------------------------------------------------------
  */

  if (variant === "stats") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="
              animate-pulse
              rounded-xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            "
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-gray-200" />

              <div className="h-10 w-10 rounded-lg bg-gray-100" />
            </div>

            <div className="mt-4 h-8 w-20 rounded bg-gray-200" />

            <div className="mt-3 h-3 w-28 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DETAILS SKELETON
  |--------------------------------------------------------------------------
  */

  if (variant === "details") {
    return (
      <div className="space-y-6">
        {/* Profile Header */}

        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-20 w-20 rounded-full bg-gray-200" />

            <div className="flex-1 space-y-3">
              <div className="h-5 w-40 rounded bg-gray-200" />

              <div className="h-3 w-28 rounded bg-gray-100" />

              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-gray-200" />

                <div className="h-6 w-24 rounded-full bg-gray-100" />
              </div>
            </div>

            <div className="h-9 w-24 rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* Information */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({
            length: 2,
          }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-32 rounded bg-gray-200" />

              <div className="mt-5 space-y-5">
                {Array.from({
                  length: 4,
                }).map(
                  (_, fieldIndex) => (
                    <div
                      key={fieldIndex}
                      className="space-y-2"
                    >
                      <div className="h-3 w-20 rounded bg-gray-100" />

                      <div className="h-4 w-40 rounded bg-gray-200" />
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DEFAULT SKELETON
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary-600" />

        <p className="text-sm text-gray-500">
          Loading tenants...
        </p>
      </div>
    </div>
  );
};

export default TenantSkeleton;