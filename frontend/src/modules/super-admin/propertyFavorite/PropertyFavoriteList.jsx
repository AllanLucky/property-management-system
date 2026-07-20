import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import {
  Heart,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Plus,
  User,
  Home,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import {
  fetchPropertyFavorites,
  deletePropertyFavorite,
  clearErrors,
  setFilters,
  selectPropertyFavorites,
  selectFavoriteMeta,
  selectFavoriteLoading,
  selectFavoriteDeleting,
  selectFavoriteError,
} from "../../../store/propertyFavoriteSlice";

import { addNotification } from "../../../store/uiSlice";

const PropertyFavoriteList = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX
  |--------------------------------------------------------------------------
  */

  const favorites = useSelector(selectPropertyFavorites);
  const meta = useSelector(selectFavoriteMeta);
  const loading = useSelector(selectFavoriteLoading);
  const deleting = useSelector(selectFavoriteDeleting);
  const error = useSelector(selectFavoriteError);

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  /*
  |--------------------------------------------------------------------------
  | FETCH FAVORITES
  |--------------------------------------------------------------------------
  */

  const loadFavorites = useCallback(
    async (mode = "initial") => {
      try {
        if (mode === "refresh") {
          setRefreshing(true);
        }

        dispatch(clearErrors());

        await dispatch(
          fetchPropertyFavorites({
            page,
            per_page: 15,
          })
        ).unwrap();
      } catch (err) {
        dispatch(
          addNotification({
            type: "error",
            message:
              err?.message ||
              err?.error ||
              "Failed to load property favorites.",
          })
        );
      } finally {
        setRefreshing(false);
      }
    },
    [dispatch, page]
  );

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    loadFavorites("refresh");
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (favorite) => {
    const result = await Swal.fire({
      title: "Delete Favorite?",
      text: "This property will be removed from favorites.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2563eb",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(favorite.id);

      await dispatch(deletePropertyFavorite(favorite.id)).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: "Favorite deleted successfully.",
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          message:
            err?.message ||
            err?.error ||
            "Unable to delete favorite.",
        })
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */

  const filteredFavorites = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return favorites;

    return favorites.filter((item) => {
      return (
        item?.property?.title?.toLowerCase().includes(q) ||
        item?.property?.property_code?.toLowerCase().includes(q) ||
        item?.property?.slug?.toLowerCase().includes(q) ||
        item?.user?.name?.toLowerCase().includes(q) ||
        item?.user?.email?.toLowerCase().includes(q) ||
        item?.property?.category?.name?.toLowerCase().includes(q) ||
        item?.property?.type?.name?.toLowerCase().includes(q)
      );
    });
  }, [favorites, search]);

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    return favorites.reduce(
      (acc, item) => {
        acc.total++;

        if (item.is_active) {
          acc.active++;
        } else {
          acc.inactive++;
        }

        if (item.notes) {
          acc.withNotes++;
        }

        return acc;
      },
      {
        total: 0,
        active: 0,
        inactive: 0,
        withNotes: 0,
      }
    );
  }, [favorites]);

  /*
  |--------------------------------------------------------------------------
  | PAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const goToPage = (newPage) => {
    setPage(newPage);

    dispatch(
      setFilters({
        page: newPage,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />

        <p className="mt-3 text-gray-500">
          Loading property favorites...
        </p>
      </div>
    );
  }
    return (
    <div className="bg-white rounded-xl shadow border">

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b">

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Heart className="w-6 h-6 text-red-600 fill-red-500" />
            Property Favorites
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage users' favourite properties across the platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <Link
            to="/super-admin/property-favorites/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
          >
            <Plus size={17} />
            Add Favorite
          </Link>

        </div>
      </div>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error && (
        <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

          <div className="flex items-center gap-3 text-red-700">

            <AlertTriangle className="w-5 h-5" />

            <span className="font-medium">
              {error?.message ||
                error?.error ||
                error ||
                "Something went wrong."}
            </span>

          </div>

        </div>
      )}

      {/* ==========================================================
          STATISTICS
      ========================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-6 border-b">

        <StatCard
          title="Total Favorites"
          value={stats.total}
          icon={<Heart className="w-6 h-6 text-red-600" />}
          color="text-red-600"
        />

        <StatCard
          title="Active"
          value={stats.active}
          icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
          color="text-green-600"
        />

        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={<XCircle className="w-6 h-6 text-gray-600" />}
          color="text-gray-600"
        />

        <StatCard
          title="With Notes"
          value={stats.withNotes}
          icon={<CalendarDays className="w-6 h-6 text-blue-600" />}
          color="text-blue-600"
        />

      </div>

      {/* ==========================================================
          SEARCH
      ========================================================== */}

      <div className="p-6 border-b">

        <div className="relative max-w-xl">

          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by property, user, category, type, email..."
            className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />

        </div>

      </div>

      {/* ==========================================================
          SUMMARY BAR
      ========================================================== */}

      <div className="px-6 py-4 bg-gray-50 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold">
            {filteredFavorites.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold">
            {meta?.total ?? favorites.length}
          </span>{" "}
          favorites
        </div>

        <div className="flex items-center gap-6 text-sm">

          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>{stats.total} Total</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>{stats.active} Active</span>
          </div>

          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-gray-500" />
            <span>{stats.inactive} Inactive</span>
          </div>

        </div>

      </div>

      {/* ==========================================================
          TABLE STARTS HERE
      ========================================================== */}

      <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">

          {/* ======================================================
              TABLE HEAD
          ====================================================== */}

          <thead className="bg-gray-50">

            <tr>

              <th className="px-6 py-4 text-left font-semibold text-gray-600">
                User
              </th>

              <th className="px-6 py-4 text-left font-semibold text-gray-600">
                Property
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-600">
                Category
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-600">
                Type
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-600">
                Status
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-600">
                Created
              </th>

              <th className="px-6 py-4 text-right font-semibold text-gray-600">
                Actions
              </th>

            </tr>

          </thead>

          {/* ======================================================
              TABLE BODY
          ====================================================== */}

          <tbody className="divide-y divide-gray-100 bg-white">

            {filteredFavorites.length > 0 ? (
              filteredFavorites.map((favorite) => (
                <tr
                  key={favorite.id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {/* ================= USER ================= */}

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      {favorite.user?.avatar ? (
                        <img
                          src={favorite.user.avatar}
                          alt={favorite.user.name}
                          className="w-11 h-11 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-red-600" />
                        </div>
                      )}

                      <div>

                        <p className="font-semibold text-gray-900">
                          {favorite.user?.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {favorite.user?.email}
                        </p>

                        <span className="inline-flex mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          {favorite.user?.role ?? "N/A"}
                        </span>

                      </div>

                    </div>

                  </td>

                  {/* ================= PROPERTY ================= */}

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      {favorite.property?.thumbnail ? (
                        <img
                          src={favorite.property.thumbnail}
                          alt={favorite.property.title}
                          className="w-16 h-12 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Home className="w-5 h-5 text-gray-400" />
                        </div>
                      )}

                      <div>

                        <p className="font-semibold text-gray-900">
                          {favorite.property?.title}
                        </p>

                        <p className="text-xs text-gray-500">
                          {favorite.property?.property_code}
                        </p>

                        <p className="text-xs text-gray-400">
                          {favorite.property?.price
                            ? Number(
                                favorite.property.price
                              ).toLocaleString()
                            : "-"}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* ================= CATEGORY ================= */}

                  <td className="px-6 py-4 text-center">

                    <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      {favorite.property?.category?.name ?? "-"}
                    </span>

                  </td>

                  {/* ================= TYPE ================= */}

                  <td className="px-6 py-4 text-center">

                    <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                      {favorite.property?.type?.name ?? "-"}
                    </span>

                  </td>

                  {/* ================= STATUS ================= */}

                  <td className="px-6 py-4 text-center">

                    {favorite.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}

                  </td>

                  {/* ================= CREATED ================= */}

                  <td className="px-6 py-4 text-center">

                    <div>

                      <p className="text-gray-700">
                        {favorite.created_at_human}
                      </p>

                      <p className="text-xs text-gray-400">
                        {favorite.created_at?.substring(0, 10)}
                      </p>

                    </div>

                  </td>

                  {/* ================= ACTIONS ================= */}

                  <td className="px-6 py-4">

                    <div className="flex items-center justify-end gap-2">

                      <Link
                        to={`/super-admin/property-favorites/${favorite.id}`}
                        className="rounded-lg border p-2 text-blue-600 hover:bg-blue-50"
                        title="View"
                      >
                        <Eye size={17} />
                      </Link>

                      <Link
                        to={`/super-admin/property-favorites/edit/${favorite.id}`}
                        className="rounded-lg border p-2 text-amber-600 hover:bg-amber-50"
                        title="Edit"
                      >
                        <Pencil size={17} />
                      </Link>

                      <button
                        onClick={() => handleDelete(favorite)}
                        disabled={
                          deleting &&
                          deletingId === favorite.id
                        }
                        className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        {deleting &&
                        deletingId === favorite.id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            ) : (
              <tr>

                <td
                  colSpan={7}
                  className="px-6 py-20 text-center"
                >

                  <div className="flex flex-col items-center">

                    <Heart className="w-16 h-16 text-gray-300 mb-4" />

                    <h3 className="text-lg font-semibold text-gray-700">
                      No Property Favorites Found
                    </h3>

                    <p className="mt-2 text-gray-500">
                      No property favorites match your current
                      search.
                    </p>

                  </div>

                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* Mobile cards & Pagination will be added in Part 4 */}
            {/* ==========================================================
          PAGINATION
      ========================================================== */}

      {meta && meta.last_page > 1 && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-t p-6">

          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold">
              {meta.from ?? 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {meta.to ?? 0}
            </span>{" "}
            of{" "}
            <span className="font-semibold">
              {meta.total ?? 0}
            </span>{" "}
            favorites
          </div>

          <div className="flex items-center gap-2">

            <button
              disabled={meta.current_page === 1}
              onClick={() => goToPage(meta.current_page - 1)}
              className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>

            <span className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold">
              {meta.current_page}
            </span>

            <span className="text-gray-500">
              of {meta.last_page}
            </span>

            <button
              disabled={!meta.has_more_pages}
              onClick={() => goToPage(meta.current_page + 1)}
              className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

/* ==============================================================
   STAT CARD
============================================================== */

const StatCard = ({
  title,
  value,
  icon,
  color = "text-gray-900",
}) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h2 className={`mt-2 text-3xl font-bold ${color}`}>
          {value}
        </h2>

      </div>

      <div className="rounded-xl bg-gray-100 p-3">
        {icon}
      </div>

    </div>

  </div>
);

export default PropertyFavoriteList;