
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  AlertTriangle,
  Loader2,
  Building2,
  Eye,
  Heart,
  Star,
} from "lucide-react";

import usePropertyAnalytics from "../../../hooks/usePropertyAnalytics";
import PropertyAnalyticsStats from "./PropertyAnalyticsStats";
import PropertyAnalyticsCharts from "./PropertyAnalyticsCharts";
import PropertyAnalyticsFilters from "./PropertyAnalyticsFilters";
import PropertyAnalyticsCard from "./PropertyAnalyticsCard";
import PropertyAnalyticsTable from "./PropertyAnalyticsTable";
import PropertyAnalyticsSkeleton from "./PropertyAnalyticsSkeleton";

const PropertyAnalyticsList = () => {
  const {
    analytics,
    loading,
    error,
    message,
    pagination,
    getPropertyAnalytics,
  } = usePropertyAnalytics();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const [filters, setFilters] = useState({
    listingType: "",
    status: "",
    rating: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getPropertyAnalytics({
      page: currentPage,
    });
  }, [getPropertyAnalytics, currentPage]);

  const handleRefresh = () => {
    getPropertyAnalytics({
      page: currentPage,
    });
  };

  const filteredAnalytics = useMemo(() => {
    if (!analytics?.length) return [];

    return analytics.filter((item) => {
      const property = item.property || {};

      const matchesSearch =
        !search ||
        property.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        property.property_code
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        property.location?.full_location
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesListingType =
        !filters.listingType ||
        property.listing_type === filters.listingType;

      const matchesStatus =
        !filters.status ||
        property.status === filters.status;

      const matchesRating =
        !filters.rating ||
        Number(item.average_rating) >= Number(filters.rating);

      return (
        matchesSearch &&
        matchesListingType &&
        matchesStatus &&
        matchesRating
      );
    });
  }, [analytics, search, filters]);

  const dashboardStats = useMemo(() => {
    const totalProperties = filteredAnalytics.length;

    const totalViews = filteredAnalytics.reduce(
      (sum, item) => sum + (item.views_count || 0),
      0
    );

    const totalFavorites = filteredAnalytics.reduce(
      (sum, item) => sum + (item.favorites_count || 0),
      0
    );

    const avgRating =
      totalProperties > 0
        ? (
            filteredAnalytics.reduce(
              (sum, item) =>
                sum + Number(item.average_rating || 0),
              0
            ) / totalProperties
          ).toFixed(1)
        : 0;

    const totalVacant = filteredAnalytics.reduce(
      (sum, item) =>
        sum + (item.vacant_units_count || 0),
      0
    );

    const totalOccupied = filteredAnalytics.reduce(
      (sum, item) =>
        sum + (item.occupied_units_count || 0),
      0
    );

    return {
      totalProperties,
      totalViews,
      totalFavorites,
      avgRating,
      totalVacant,
      totalOccupied,
    };
  }, [filteredAnalytics]);

  const chartData = useMemo(() => {
    return filteredAnalytics.slice(0, 10).map((item) => ({
      name:
        item.property?.title?.length > 20
          ? `${item.property.title.substring(0, 20)}...`
          : item.property?.title,

      views: item.views_count || 0,
      favorites: item.favorites_count || 0,
      rating: Number(item.average_rating || 0),
      occupied: item.occupied_units_count || 0,
      vacant: item.vacant_units_count || 0,
    }));
  }, [filteredAnalytics]);

  if (loading && analytics.length === 0) {
    return <PropertyAnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Property Analytics
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor property performance, engagement,
            ratings, occupancy, and popularity metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 ${
                viewMode === "cards"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
      ```jsx
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />

          <div>
            <h3 className="font-semibold text-red-700">
              Unable to load property analytics
            </h3>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Dashboard Stats */}
      <PropertyAnalyticsStats stats={dashboardStats} />

      {/* Search + Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-12">

          {/* Search */}
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search property by title, code or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Filters */}
          <div className="lg:col-span-7">
            <PropertyAnalyticsFilters
              filters={filters}
              setFilters={setFilters}
            />
          </div>

        </div>
      </div>

      {/* Charts */}
      <PropertyAnalyticsCharts data={chartData} />

      {/* Quick Overview */}
      <div className="grid gap-5 lg:grid-cols-4">

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Total Properties
            </span>

            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>

          <h2 className="mt-4 text-3xl font-bold">
            {dashboardStats.totalProperties}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Properties being monitored
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Total Views
            </span>

            <Eye className="h-5 w-5 text-blue-600" />
          </div>

          <h2 className="mt-4 text-3xl font-bold">
            {dashboardStats.totalViews.toLocaleString()}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Total visitor engagements
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Favorites
            </span>

            <Heart className="h-5 w-5 text-pink-600" />
          </div>

          <h2 className="mt-4 text-3xl font-bold">
            {dashboardStats.totalFavorites.toLocaleString()}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Saved by users
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Average Rating
            </span>

            <Star className="h-5 w-5 text-amber-500" />
          </div>

          <h2 className="mt-4 text-3xl font-bold">
            {dashboardStats.avgRating}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Average customer satisfaction
          </p>
        </div>

      </div>
      ```jsx id="5j89rk"
      {/* ==========================================================
          Analytics Content
      ========================================================== */}

      {loading ? (
        <PropertyAnalyticsSkeleton />
      ) : filteredAnalytics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center shadow-sm">
          <Building2 className="mx-auto h-16 w-16 text-gray-300" />

          <h3 className="mt-4 text-xl font-semibold text-gray-700">
            No Property Analytics Found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search keywords or filters.
          </p>

          <button
            onClick={() => {
              setSearch("");

              setFilters({
                listingType: "",
                status: "",
                rating: "",
              });
            }}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-white transition hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* -------------------------------------------------------
              Cards View
          ------------------------------------------------------- */}

          {viewMode === "cards" && (
            <div className="grid gap-6 xl:grid-cols-2">
              {filteredAnalytics.map((analytics) => (
                <PropertyAnalyticsCard
                  key={analytics.id}
                  analytics={analytics}
                />
              ))}
            </div>
          )}

          {/* -------------------------------------------------------
              Table View
          ------------------------------------------------------- */}

          {viewMode === "table" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <PropertyAnalyticsTable
                analytics={filteredAnalytics}
              />
            </div>
          )}

          {/* -------------------------------------------------------
              Pagination
          ------------------------------------------------------- */}

          {pagination?.lastPage > 1 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border bg-white px-6 py-4 shadow-sm md:flex-row">

              <div className="text-sm text-gray-500">
                Showing page{" "}
                <span className="font-semibold">
                  {pagination.currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {pagination.lastPage}
                </span>

                {" • "}

                Total Records{" "}
                <span className="font-semibold">
                  {pagination.total}
                </span>
              </div>

              <div className="flex items-center gap-2">

                {/* Previous */}

                <button
                  disabled={pagination.currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(page - 1, 1)
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {/* Page Numbers */}

                {Array.from(
                  {
                    length: pagination.lastPage,
                  },
                  (_, index) => index + 1
                )
                  .slice(
                    Math.max(
                      pagination.currentPage - 3,
                      0
                    ),
                    Math.min(
                      pagination.currentPage + 2,
                      pagination.lastPage
                    )
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-lg text-sm font-semibold transition ${
                        page === pagination.currentPage
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Next */}

                <button
                  disabled={
                    pagination.currentPage >=
                    pagination.lastPage
                  }
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        page + 1,
                        pagination.lastPage
                      )
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            </div>
          )}
        </>
      )}
      ```jsx
      {/* Footer */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-500 md:flex-row">
          <div>
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filteredAnalytics.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {pagination?.total ?? filteredAnalytics.length}
            </span>{" "}
            property analytics records.
          </div>

          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>
              Last refreshed: {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PropertyAnalyticsList;

