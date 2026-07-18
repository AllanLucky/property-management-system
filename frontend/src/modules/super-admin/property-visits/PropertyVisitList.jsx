import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import {
  Activity,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Clock3,
  Bookmark,
  Share2,
  Phone,
  MessageCircle,
  CalendarCheck,
  Users,
  BarChart3,
  TrendingUp,
  Filter,
  Plus,
} from "lucide-react";

import {
  fetchPropertyVisits,
  deletePropertyVisit,
} from "../../../store/propertyVisitSlice";
import { addNotification } from "../../../store/uiSlice";

const PropertyVisitList = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX
  |--------------------------------------------------------------------------
  */

  const {
    visits = [],
    loading = false,
    error = null,
    meta = {},
  } = useSelector((state) => state.propertyVisits);

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    dispatch(fetchPropertyVisits());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchPropertyVisits());
  };

  /*
|--------------------------------------------------------------------------
| DELETE PROPERTY VISIT (SWAL CONFIRM)
|--------------------------------------------------------------------------
*/
  const deletePropertyVisitHandler = async (id) => {
    const result = await Swal.fire({
      title: "Delete Property Visit?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      await dispatch(deletePropertyVisit(id)).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: "Property visit deleted successfully",
        })
      );

    } catch (err) {

      const message =
        err?.message ||
        "Failed to delete property visit.";

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

    } finally {

      setDeletingId(null);

    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const filteredVisits = useMemo(() => {
    let data = [...visits];

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter((visit) => {
        return [
          visit.property?.title,
          visit.property?.name,
          visit.country,
          visit.region,
          visit.county,
          visit.city,
          visit.browser,
          visit.operating_system,
          visit.platform,
          visit.device,
          visit.device_type,
          visit.source,
          visit.medium,
          visit.campaign,
          visit.ip_address,
          visit.visit_uuid,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }

    if (deviceFilter !== "all") {
      data = data.filter(
        (visit) =>
          visit.device?.toLowerCase() ===
          deviceFilter.toLowerCase()
      );
    }

    return data;
  }, [visits, search, deviceFilter]);

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD STATS
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    return {
      total: visits.length,

      unique: visits.filter((v) => v.is_unique).length,

      mobile: visits.filter((v) => v.is_mobile).length,

      desktop: visits.filter((v) => v.is_desktop).length,

      tablet: visits.filter((v) => v.is_tablet).length,

      avgDuration:
        visits.length > 0
          ? Math.round(
            visits.reduce(
              (sum, item) => sum + (item.duration || 0),
              0
            ) / visits.length
          )
          : 0,

      avgViews:
        visits.length > 0
          ? (
            visits.reduce(
              (sum, item) => sum + (item.page_views || 0),
              0
            ) / visits.length
          ).toFixed(1)
          : 0,

      scheduled: visits.filter(
        (v) => Number(v.scheduled_visit) === 1
      ).length,

      bookmarked: visits.filter(
        (v) => Number(v.bookmarked) === 1
      ).length,

      shared: visits.filter(
        (v) => Number(v.shared) === 1
      ).length,

      contacts: visits.filter(
        (v) => Number(v.contact_clicked) === 1
      ).length,

      whatsapp: visits.filter(
        (v) => Number(v.whatsapp_clicked) === 1
      ).length,
    };
  }, [visits]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-gray-500">
          Loading property analytics...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* =======================================================
          HEADER
      ======================================================= */}

      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b p-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">

              <Activity className="h-8 w-8 text-blue-600" />

              Property Visit Analytics

            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Monitor visitor behaviour, engagement, devices,
              traffic sources and interactions across your
              properties.
            </p>

          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-black transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <Link
            to="/super-admin/property-visits/create"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl"
          >
            <Plus size={16} />
            Create
          </Link>


        </div>
        {/* =======================================================
            ERROR
        ======================================================= */}

        {error && (
          <div className="m-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />

            <div>
              <h3 className="font-semibold">
                Unable to load property visit analytics
              </h3>

              <p className="text-sm">
                {error?.message || error}
              </p>
            </div>
          </div>
        )}

        {/* =======================================================
            ANALYTICS CARDS
        ======================================================= */}

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Visits"
            value={stats.total}
            icon={<Activity className="h-6 w-6" />}
            color="blue"
          />

          <StatCard
            title="Unique Visitors"
            value={stats.unique}
            icon={<Users className="h-6 w-6" />}
            color="emerald"
          />

          <StatCard
            title="Mobile Devices"
            value={stats.mobile}
            icon={<Smartphone className="h-6 w-6" />}
            color="indigo"
          />

          <StatCard
            title="Desktop Devices"
            value={stats.desktop}
            icon={<Monitor className="h-6 w-6" />}
            color="cyan"
          />

          <StatCard
            title="Tablet Devices"
            value={stats.tablet}
            icon={<Tablet className="h-6 w-6" />}
            color="purple"
          />

          <StatCard
            title="Avg Duration"
            value={`${stats.avgDuration}s`}
            icon={<Clock3 className="h-6 w-6" />}
            color="amber"
          />

          <StatCard
            title="Avg Page Views"
            value={stats.avgViews}
            icon={<BarChart3 className="h-6 w-6" />}
            color="pink"
          />

          <StatCard
            title="Scheduled Visits"
            value={stats.scheduled}
            icon={<CalendarCheck className="h-6 w-6" />}
            color="green"
          />

          <StatCard
            title="Bookmarks"
            value={stats.bookmarked}
            icon={<Bookmark className="h-6 w-6" />}
            color="yellow"
          />

          <StatCard
            title="Shares"
            value={stats.shared}
            icon={<Share2 className="h-6 w-6" />}
            color="orange"
          />

          <StatCard
            title="Contact Clicks"
            value={stats.contacts}
            icon={<Phone className="h-6 w-6" />}
            color="red"
          />

          <StatCard
            title="WhatsApp Clicks"
            value={stats.whatsapp}
            icon={<MessageCircle className="h-6 w-6" />}
            color="lime"
          />

        </div>
        {/* =======================================================
            SEARCH & FILTERS
        ======================================================= */}

        <div className="rounded-2xl border-t bg-gray-50/50 p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* SEARCH */}

            <div className="relative flex-1">

              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search property, visitor, browser, country, campaign..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* DEVICE FILTER */}

            <div className="flex items-center gap-3">

              <Filter className="h-5 w-5 text-gray-500" />

              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Devices</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
              </select>

            </div>

          </div>

        </div>

      </div>

      {/* =======================================================
          VISITS TABLE
      ======================================================= */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-gray-50">

              <tr className="border-b">

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Visitor
                </th>

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Location
                </th>

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Device
                </th>

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Browser
                </th>

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Traffic Source
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Engagement
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Actions
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Visited
                </th>

                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  Manage
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* =======================================================
                        VISITOR
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {visit.user
                            ? visit.user.first_name?.charAt(0) || "U"
                            : "G"}
                        </div>

                        <div>

                          <p className="font-semibold text-gray-900">
                            {visit.user
                              ? `${visit.user.first_name ?? ""} ${visit.user.last_name ?? ""}`
                              : "Guest Visitor"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {visit.user?.email ??
                              visit.visit_uuid}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* =======================================================
                        LOCATION
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="space-y-1">

                        <div className="flex items-center gap-2">

                          <Globe className="h-4 w-4 text-blue-600" />

                          <span className="font-medium">
                            {visit.country || "-"}
                          </span>

                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">

                          <MapPin className="h-3 w-3" />

                          {visit.city || "-"},{" "}
                          {visit.region || "-"}

                        </div>

                      </div>

                    </td>

                    {/* =======================================================
                        DEVICE
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="space-y-2">

                        {visit.is_mobile ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                            <Smartphone className="h-3.5 w-3.5" />

                            Mobile

                          </span>
                        ) : visit.is_tablet ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">

                            <Tablet className="h-3.5 w-3.5" />

                            Tablet

                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                            <Monitor className="h-3.5 w-3.5" />

                            Desktop

                          </span>
                        )}

                        <p className="text-xs text-gray-500">
                          {visit.device_type || "-"}
                        </p>

                      </div>

                    </td>

                    {/* =======================================================
                        BROWSER
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div>

                        <p className="font-medium">
                          {visit.browser || "-"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {visit.operating_system || "-"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {visit.browser_version
                            ? `v${visit.browser_version}`
                            : "-"}
                        </p>

                      </div>

                    </td>

                    {/* =======================================================
                        TRAFFIC SOURCE
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="space-y-2">

                        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {visit.source || "Direct"}
                        </span>

                        <p className="text-xs text-gray-500">
                          {visit.medium || "-"}
                        </p>

                        <p className="text-xs text-blue-600">
                          {visit.campaign || "-"}
                        </p>

                      </div>
                    </td>
                    {/* =======================================================
                        ENGAGEMENT
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="space-y-2">

                        <div className="flex items-center gap-2 text-xs">

                          <Clock3 className="h-3.5 w-3.5 text-gray-400" />

                          <span>{visit.duration || 0}s</span>

                        </div>

                        <div className="flex items-center gap-2 text-xs">

                          <BarChart3 className="h-3.5 w-3.5 text-gray-400" />

                          <span>{visit.page_views || 0} Views</span>

                        </div>

                        <div className="flex items-center gap-2 text-xs">

                          <TrendingUp className="h-3.5 w-3.5 text-gray-400" />

                          <span>{visit.scroll_percentage || 0}%</span>

                        </div>

                      </div>

                    </td>

                    {/* =======================================================
                        ACTIONS PERFORMED
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="flex flex-wrap gap-2">

                        {visit.contact_clicked == 1 && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                            Contact
                          </span>
                        )}

                        {visit.call_clicked == 1 && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">
                            Call
                          </span>
                        )}

                        {visit.whatsapp_clicked == 1 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                            WhatsApp
                          </span>
                        )}

                        {visit.email_clicked == 1 && (
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-[11px] font-semibold text-purple-700">
                            Email
                          </span>
                        )}

                        {visit.bookmarked == 1 && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-semibold text-yellow-700">
                            Saved
                          </span>
                        )}

                        {visit.shared == 1 && (
                          <span className="rounded-full bg-pink-100 px-2 py-1 text-[11px] font-semibold text-pink-700">
                            Shared
                          </span>
                        )}

                      </div>

                    </td>

                    {/* =======================================================
                        VISITED DATE
                    ======================================================= */}

                    <td className="px-5 py-4 text-center">

                      <div className="space-y-1">

                        <p className="font-medium text-gray-900">
                          {visit.visited_at
                            ? new Date(
                              visit.visited_at
                            ).toLocaleDateString()
                            : "-"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {visit.visited_at
                            ? new Date(
                              visit.visited_at
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : ""}
                        </p>

                      </div>

                    </td>

                    {/* =======================================================
                        MANAGE
                    ======================================================= */}

                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-2">

                        <Link
                          to={`/super-admin/property-visits/${visit.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          title="View Visit"
                        >
                          <Eye size={18} />
                        </Link>

                        <button
                          onClick={() =>
                            deletePropertyVisitHandler(visit.id)
                          }
                          disabled={deletingId === visit.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete Visit"
                        >

                          {deletingId === visit.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={18} />
                          )}

                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              ) : (
                <tr>

                  <td
                    colSpan={9}
                    className="py-20 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <Activity className="mb-4 h-16 w-16 text-gray-300" />

                      <h3 className="text-xl font-semibold text-gray-700">
                        No Property Visits Found
                      </h3>

                      <p className="mt-2 max-w-md text-sm text-gray-500">
                        No property visit analytics match your
                        current search or filters.
                      </p>

                    </div>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>
      {/* =======================================================
          PAGINATION
      ======================================================= */}

      {meta?.total > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="mx-1 font-semibold">
                {meta.from}
              </span>
              -
              <span className="mx-1 font-semibold">
                {meta.to}
              </span>{" "}
              of{" "}
              <span className="mx-1 font-semibold">
                {meta.total}
              </span>{" "}
              visits
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Page {meta.current_page} of {meta.last_page}
            </p>

          </div>


          <div className="flex items-center gap-2">

            <button
              disabled={meta.current_page === 1}
              onClick={() =>
                dispatch(
                  fetchPropertyVisits({
                    page: meta.current_page - 1,
                  })
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>


            <button
              disabled={!meta.has_more_pages}
              onClick={() =>
                dispatch(
                  fetchPropertyVisits({
                    page: meta.current_page + 1,
                  })
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>
      )}

    </div>
  );
};


/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

const colorClasses = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  pink: "bg-pink-50 text-pink-600 border-pink-100",
  green: "bg-green-50 text-green-600 border-green-100",
  yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
  red: "bg-red-50 text-red-600 border-red-100",
  lime: "bg-lime-50 text-lime-600 border-lime-100",
};


const StatCard = ({
  title,
  value,
  icon,
  color = "blue",
}) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>


        <h3 className="mt-2 text-3xl font-bold text-gray-900">
          {value}
        </h3>

      </div>


      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${colorClasses[color]}`}
      >
        {icon}
      </div>

    </div>

  </div>
);


export default PropertyVisitList;