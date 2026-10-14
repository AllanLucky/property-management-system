import {
  Eye,
  MapPin,
  Pencil,
  Ruler,
  Layers3,
  Map,
} from "lucide-react";

import PlotStatusBadge from "./PlotStatusBadge";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount, currency = "KES") => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `${currency} 0`;
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 4,
  }).format(number);
};

const getLocation = (plot) => {
  const area =
    plot?.area?.name ||
    plot?.area?.title ||
    plot?.area_name;

  const city =
    plot?.city?.name ||
    plot?.city?.title ||
    plot?.city_name;

  const county =
    plot?.county?.name ||
    plot?.county?.title ||
    plot?.county_name;

  return [area, city, county]
    .filter(Boolean)
    .filter(
      (value, index, values) =>
        values.findIndex(
          (item) =>
            item.toLowerCase() === value.toLowerCase()
        ) === index
    )
    .join(", ");
};

const getPlotId = (plot) =>
  plot?.id ?? plot?.plot_id ?? plot?.uuid;

const getPlotCode = (plot) =>
  plot?.code ||
  plot?.plot_code ||
  (getPlotId(plot) != null
    ? `PLT-${getPlotId(plot)}`
    : "—");

const getPlotTitle = (plot) =>
  plot?.title ||
  plot?.name ||
  plot?.plot_name ||
  "Untitled Plot";

const getPlotSize = (plot) => {
  const size =
    plot?.size ??
    plot?.plot_size ??
    plot?.land_size;

  if (size === null || size === undefined || size === "") {
    return "—";
  }

  const unit =
    plot?.size_unit ||
    plot?.measurement_unit ||
    plot?.unit_of_measure ||
    "";

  if (typeof size === "string" && /[a-z]/i.test(size)) {
    return size;
  }

  return `${formatNumber(size)}${unit ? ` ${unit}` : ""}`;
};

const getPlotPrice = (plot) =>
  plot?.asking_price ??
  plot?.price ??
  plot?.sale_price ??
  0;

const getPlotCurrency = (plot) =>
  plot?.currency ||
  plot?.currency_code ||
  "KES";

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const PlotTable = ({
  plots = [],
  loading = false,
  onView,
  onEdit,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          {/* ============================================================
              TABLE HEADER
          ============================================================ */}

          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Plot
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Location
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Size
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Asking Price
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          {/* ============================================================
              TABLE BODY
          ============================================================ */}

          <tbody className="divide-y divide-slate-100">
            {plots.map((plot, index) => {
              const plotId = getPlotId(plot);
              const plotCode = getPlotCode(plot);
              const plotTitle = getPlotTitle(plot);
              const location = getLocation(plot);
              const plotSize = getPlotSize(plot);
              const price = getPlotPrice(plot);
              const currency = getPlotCurrency(plot);

              return (
                <tr
                  key={
                    plotId ??
                    plotCode ??
                    `plot-${index}`
                  }
                  className="transition hover:bg-slate-50/80"
                >
                  {/* PLOT */}

                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600">
                        <Map className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[250px] truncate text-sm font-bold text-slate-900">
                          {plotTitle}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {plotCode}
                        </p>

                        {plot?.property?.name && (
                          <p className="mt-1 max-w-[250px] truncate text-xs text-slate-400">
                            Property: {plot.property.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* LOCATION */}

                  <td className="px-5 py-4">
                    <div className="flex max-w-[250px] items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700">
                          {location || "Location not specified"}
                        </p>

                        {plot?.address && (
                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                            {plot.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SIZE */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 shrink-0 text-slate-400" />

                      <span className="text-sm font-semibold text-slate-700">
                        {plotSize}
                      </span>
                    </div>
                  </td>

                  {/* ASKING PRICE */}

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-sm font-bold text-slate-900">
                      {formatCurrency(price, currency)}
                    </p>

                    {plot?.deposit_amount !== null &&
                      plot?.deposit_amount !== undefined &&
                      plot?.deposit_amount !== "" && (
                        <p className="mt-1 text-xs text-slate-500">
                          Deposit:{" "}
                          {formatCurrency(
                            plot.deposit_amount,
                            currency
                          )}
                        </p>
                      )}
                  </td>

                  {/* STATUS */}

                  <td className="px-5 py-4">
                    <PlotStatusBadge
                      status={plot?.status || "unavailable"}
                    />

                    {plot?.is_active === false ||
                    plot?.is_active === 0 ? (
                      <p className="mt-1.5 text-xs font-medium text-slate-400">
                        Inactive
                      </p>
                    ) : null}
                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onView?.(plotId)}
                        disabled={plotId == null || loading}
                        title="View plot"
                        aria-label={`View ${plotTitle}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit?.(plotId)}
                        disabled={plotId == null || loading}
                        title="Edit plot"
                        aria-label={`Edit ${plotTitle}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================================================================
          FOOTER
      ================================================================ */}

      {plots.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Displaying{" "}
            <span className="font-semibold text-slate-700">
              {plots.length}
            </span>{" "}
            {plots.length === 1 ? "plot" : "plots"} on this page
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers3 className="h-3.5 w-3.5" />
            Plot inventory
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotTable;