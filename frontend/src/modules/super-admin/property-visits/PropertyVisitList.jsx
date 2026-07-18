import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  User,
  Phone,
  Building2,
  Clock3,
  Plus,
} from "lucide-react";

import {
  fetchPropertyVisits,
  deletePropertyVisit,
} from "../../../store/propertyVisitSlice";

const PropertyVisitList = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const {
    visits = [],
    loading = false,
    error = null,
    meta,
  } = useSelector((state) => state.propertyVisit || {});

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY VISITS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    dispatch(fetchPropertyVisits());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    dispatch(fetchPropertyVisits());
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER VISITS
  |--------------------------------------------------------------------------
  */

  const filteredVisits = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return visits;

    return visits.filter((visit) => {
      const searchable = [
        visit.property?.title,
        visit.property?.name,
        visit.visitor_name,
        visit.visitor_email,
        visit.visitor_phone,
        visit.agent?.name,
        visit.status,
        visit.visit_date,
        visit.visit_time,
        visit.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [visits, search]);

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    return {
      total: meta?.total || visits.length,

      scheduled: visits.filter(
        (visit) =>
          visit.status?.toLowerCase() === "scheduled"
      ).length,

      completed: visits.filter(
        (visit) =>
          visit.status?.toLowerCase() === "completed"
      ).length,

      cancelled: visits.filter(
        (visit) =>
          visit.status?.toLowerCase() === "cancelled"
      ).length,

      today: visits.filter((visit) => {
        if (!visit.visit_date) return false;

        const today = new Date().toISOString().split("T")[0];

        return visit.visit_date === today;
      }).length,
    };
  }, [visits, meta]);

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
          Loading property visits...
        </p>

      </div>
    );
  }
    return (
    <div className="bg-white rounded-xl shadow border">

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">

        {/* LEFT */}
        <div>

          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            Property Visits
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage scheduled property visits, appointments and customer
            bookings.
          </p>

        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Schedule Visit */}
          <Link
            to="/super-admin/property-visits/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Schedule Visit
          </Link>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

        </div>

      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <div className="flex items-center gap-2 border-b bg-red-50 p-4 text-red-700">

          <AlertTriangle className="w-4 h-4" />

          <span>
            {error?.message || error}
          </span>

        </div>
      )}

      {/* ============================================================
          STATISTICS
      ============================================================ */}

      <div className="grid grid-cols-1 gap-3 border-b p-5 md:grid-cols-2 xl:grid-cols-5">

        <Stat
          title="Total Visits"
          value={stats.total}
          icon={<CalendarDays className="w-5 h-5" />}
        />

        <Stat
          title="Scheduled"
          value={stats.scheduled}
          icon={<CalendarClock className="w-5 h-5" />}
          color="text-blue-600"
        />

        <Stat
          title="Completed"
          value={stats.completed}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="text-green-600"
        />

        <Stat
          title="Cancelled"
          value={stats.cancelled}
          icon={<CalendarX2 className="w-5 h-5" />}
          color="text-red-600"
        />

        <Stat
          title="Today's Visits"
          value={stats.today}
          icon={<Clock3 className="w-5 h-5" />}
          color="text-amber-600"
        />

      </div>

      {/* ============================================================
          SEARCH
      ============================================================ */}

      <div className="border-b p-5">

        <div className="relative">

          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search property, visitor, phone, email or agent..."
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>

      {/* ============================================================
          TABLE
      ============================================================ */}

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="border-b bg-gray-50">

            <tr>

              <th className="p-4 text-left font-semibold text-gray-700">
                Property
              </th>

              <th className="p-4 text-left font-semibold text-gray-700">
                Visitor
              </th>

              <th className="p-4 text-left font-semibold text-gray-700">
                Phone
              </th>

              <th className="p-4 text-left font-semibold text-gray-700">
                Agent
              </th>

              <th className="p-4 text-center font-semibold text-gray-700">
                Visit Date
              </th>

              <th className="p-4 text-center font-semibold text-gray-700">
                Time
              </th>

              <th className="p-4 text-center font-semibold text-gray-700">
                Status
              </th>

              <th className="p-4 text-right font-semibold text-gray-700">
                Actions
              </th>

            </tr>

          </thead>
          <tbody>
                        {filteredVisits.length > 0 ? (
              filteredVisits.map((visit) => (
                <tr
                  key={visit.id}
                  className="border-t transition hover:bg-gray-50"
                >
                  {/* ============================================================
                      PROPERTY
                  ============================================================ */}

                  <td className="p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border">

                        <Building2 className="h-5 w-5 text-blue-600" />

                      </div>

                      <div>

                        <p className="font-semibold text-gray-900">
                          {visit.property?.title ||
                            visit.property?.name ||
                            "N/A"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Property ID: #{visit.property?.id ?? "-"}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* ============================================================
                      VISITOR
                  ============================================================ */}

                  <td className="p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">

                        <User className="h-5 w-5 text-gray-500" />

                      </div>

                      <div>

                        <p className="font-medium text-gray-900">
                          {visit.visitor_name || "Unknown Visitor"}
                        </p>

                        {visit.visitor_email && (
                          <p className="text-xs text-gray-500">
                            {visit.visitor_email}
                          </p>
                        )}

                      </div>

                    </div>

                  </td>

                  {/* ============================================================
                      PHONE
                  ============================================================ */}

                  <td className="p-4">

                    <div className="flex items-center gap-2">

                      <Phone className="h-4 w-4 text-gray-400" />

                      <span>
                        {visit.visitor_phone || "-"}
                      </span>

                    </div>

                  </td>

                  {/* ============================================================
                      AGENT
                  ============================================================ */}

                  <td className="p-4">

                    <div>

                      <p className="font-medium text-gray-900">
                        {visit.agent?.name ||
                          visit.agent_name ||
                          "Not Assigned"}
                      </p>

                      {visit.agent?.email && (
                        <p className="text-xs text-gray-500">
                          {visit.agent.email}
                        </p>
                      )}

                    </div>

                  </td>

                  {/* ============================================================
                      DATE
                  ============================================================ */}

                  <td className="p-4 text-center">

                    <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {visit.visit_date || "-"}
                    </span>

                  </td>

                  {/* ============================================================
                      TIME
                  ============================================================ */}

                  <td className="p-4 text-center">

                    <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {visit.visit_time || "-"}
                    </span>

                  </td>

                  {/* ============================================================
                      STATUS
                  ============================================================ */}

                  <td className="p-4 text-center">

                    {visit.status === "scheduled" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">

                        <CalendarClock className="h-3.5 w-3.5" />

                        Scheduled

                      </span>
                    )}

                    {visit.status === "completed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">

                        <CalendarCheck className="h-3.5 w-3.5" />

                        Completed

                      </span>
                    )}

                    {visit.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">

                        <CalendarX2 className="h-3.5 w-3.5" />

                        Cancelled

                      </span>
                    )}

                    {![
                      "scheduled",
                      "completed",
                      "cancelled",
                    ].includes(visit.status) && (
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">

                        {visit.status || "Pending"}

                      </span>
                    )}

                  </td>

                  {/* ============================================================
                      ACTIONS
                  ============================================================ */}

                  <td className="p-4">

                    <div className="flex items-center justify-end gap-2">

                      <Link
                        to={`/super-admin/property-visits/${visit.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border text-blue-600 transition hover:bg-blue-50"
                        title="View"
                      >
                        <Eye size={17} />
                      </Link>

                      <Link
                        to={`/super-admin/property-visits/edit/${visit.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border text-amber-600 transition hover:bg-amber-50"
                        title="Edit"
                      >
                        <Pencil size={17} />
                      </Link>

                      <button
                        onClick={() =>
                          dispatch(deletePropertyVisit(visit.id))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border text-red-600 transition hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            ) : (
              <tr>

                <td
                  colSpan={8}
                  className="py-16 text-center"
                >

                  <div className="flex flex-col items-center">

                    <CalendarDays className="mb-3 h-14 w-14 text-gray-300" />

                    <h3 className="text-lg font-semibold text-gray-700">
                      No Property Visits Found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      There are currently no scheduled property visits.
                    </p>

                  </div>

                </td>

              </tr>
            )}

          </tbody>

        </table>
      </div>
            {/* ============================================================
          PAGINATION
      ============================================================ */}

      {meta && (
        <div className="flex flex-col gap-4 border-t bg-gray-50 p-5 md:flex-row md:items-center md:justify-between">

          {/* PAGE INFO */}
          <div>

            <p className="text-sm text-gray-600">
              Showing page{" "}
              <span className="font-semibold text-gray-900">
                {meta.current_page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {meta.last_page}
              </span>
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium">
                {meta.from}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {meta.to}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {meta.total}
              </span>{" "}
              property visits
            </p>

          </div>

          {/* PAGINATION BUTTONS */}
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
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="rounded-xl border bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {meta.current_page}
            </span>

            <button
              disabled={!meta.has_more_pages}
              onClick={() =>
                dispatch(
                  fetchPropertyVisits({
                    page: meta.current_page + 1,
                  })
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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

const Stat = ({
  title,
  value,
  icon,
  color = "text-gray-900",
}) => (
  <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-4 transition hover:bg-gray-100">

    <div>

      <p className="text-xs uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className={`mt-1 text-2xl font-bold ${color}`}>
        {value}
      </p>

    </div>

    <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white text-gray-400">

      {icon}

    </div>

  </div>
);

export default PropertyVisitList;