import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Globe,
  GlobeLock,
  Star,
  Loader2,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  FileBarChart,
} from "lucide-react";

import {
  fetchPropertyReviews,
  deletePropertyReview,
} from "../../../store/propertyReviewSlice";

const PropertyReviewList = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */
  const {
    reviews = [],
    loading = false,
    error = null,
    meta,
  } = useSelector((state) => state.propertyReviews || {});
  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */
  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH REVIEWS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    dispatch(fetchPropertyReviews());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */
  const handleRefresh = () => {
    dispatch(fetchPropertyReviews());
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER REVIEWS
  |--------------------------------------------------------------------------
  */
  const ratingWords = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
  };

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return reviews;

    return reviews.filter((review) => {
      const searchable = [
        review.title,
        review.comment,
        review.property?.title,
        review.user?.name,
        review.user?.email,
        review.rating_label,
        review.sentiment,
        review.rating,
        `${review.rating} star`,
        `${review.rating} stars`,
        ratingWords[review.rating],
        `${ratingWords[review.rating]} star`,
        `${ratingWords[review.rating]} stars`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [reviews, search]);
  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */
  const stats = useMemo(() => {
    return {
      total: meta?.total || 0,
      published: reviews.filter(r => r.is_published).length,
      verified: reviews.filter(r => r.is_verified).length,
      positive: reviews.filter(r => r.is_positive).length,
      negative: reviews.filter(r => r.is_negative).length,
    };
  }, [reviews, meta]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-3 text-gray-500">
          Loading property reviews...
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
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Property Reviews
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer property reviews, ratings, analytics and moderation.
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Analytics */}
          <Link
            to="/super-admin/property-reviews/analytics"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>

          {/* Reports */}
          <Link
            to="/super-admin/property-reviews/reports"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-100"
          >
            <FileBarChart className="h-4 w-4" />
            Reports
          </Link>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

        </div>

      </div>

      {/* ============================================================
          ERROR ALERT
      ============================================================ */}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border-b text-red-700">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      {/* ============================================================
          STATISTICS
      ============================================================ */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 p-5 border-b">

        <Stat
          title="Total Reviews"
          value={stats.total}
          icon={<MessageSquare className="w-5 h-5" />}
        />

        <Stat
          title="Published"
          value={stats.published}
          icon={<Globe className="w-5 h-5" />}
          color="text-green-600"
        />

        <Stat
          title="Verified"
          value={stats.verified}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="text-blue-600"
        />

        <Stat
          title="Positive"
          value={stats.positive}
          icon={<Star className="w-5 h-5" />}
          color="text-emerald-600"
        />

        <Stat
          title="Negative"
          value={stats.negative}
          icon={<ShieldOff className="w-5 h-5" />}
          color="text-red-600"
        />

      </div>

      {/* ============================================================
          SEARCH
      ============================================================ */}

      <div className="p-5 border-b">

        <div className="relative">

          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search property, review or customer..."
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

        </div>

      </div>

      {/* ============================================================
          TABLE
      ============================================================ */}

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 border-b">

            <tr>

              <th className="p-4 text-left font-semibold text-gray-700">
                Property
              </th>

              <th className="p-4 text-left font-semibold text-gray-700">
                Customer
              </th>

              <th className="p-4 text-center font-semibold text-gray-700">
                Rating
              </th>

              <th className="p-4 text-left font-semibold text-gray-700">
                Review
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

            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* PROPERTY */}
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review?.property?.title || "N/A"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        ID: #{review?.property?.id}
                      </p>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {review?.user?.name || "Unknown User"}
                      </p>

                      {review?.user?.email && (
                        <p className="text-xs text-gray-500">
                          {review.user.email}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* RATING */}
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">

                      <div className="flex items-center gap-1">
                        <Star
                          className="w-4 h-4 text-yellow-500 fill-yellow-400"
                        />

                        <span className="font-semibold text-gray-800">
                          {review?.rating_label || review?.rating || "N/A"}
                        </span>
                      </div>

                      <span className="text-xs text-gray-500">
                        {review?.rating ?? ""}
                      </span>

                    </div>
                  </td>

                  {/* REVIEW */}
                  <td className="p-4">
                    <div>

                      {review?.title && (
                        <p className="font-medium text-gray-900 mb-1">
                          {review.title}
                        </p>
                      )}

                      <p className="text-gray-600 text-sm line-clamp-2">
                        {review?.comment || "No review comment."}
                      </p>

                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-2">

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${review?.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {review?.is_published ? (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            Published
                          </>
                        ) : (
                          <>
                            <GlobeLock className="w-3.5 h-3.5" />
                            Draft
                          </>
                        )}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${review?.is_verified
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {review?.is_verified ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </>
                        ) : (
                          <>
                            <ShieldOff className="w-3.5 h-3.5" />
                            Pending
                          </>
                        )}
                      </span>

                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4">

                    <div className="flex justify-end items-center gap-2">

                      <Link
                        to={`/super-admin/property-reviews/${review.id}`}
                        className="w-4 h-4 rounded-md border flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                        title="View"
                      >
                        <Eye size={16} />
                      </Link>

                      <Link
                        to={`/super-admin/property-reviews/edit/${review.id}`}
                        className="w-4 h-4 rounded-md border flex items-center justify-center text-amber-600 hover:bg-amber-50 transition"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>

                      <button
                        onClick={() =>
                          dispatch(deletePropertyReview(review.id))
                        }
                        className="w-4 h-4 rounded-lg border flex items-center justify-center text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center">

                    <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />

                    <h3 className="text-lg font-semibold text-gray-700">
                      No Property Reviews Found
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      There are currently no property reviews available.
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-t bg-gray-50">

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

            <p className="text-xs text-gray-500 mt-1">
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
              reviews
            </p>
          </div>

          {/* PAGINATION BUTTONS */}
          <div className="flex items-center gap-2">

            <button
              disabled={meta.current_page === 1}
              onClick={() =>
                dispatch(
                  fetchPropertyReviews({
                    page: meta.current_page - 1,
                  })
                )
              }
              className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-sm font-semibold bg-blue-50 border rounded-xl text-blue-700">
              {meta.current_page}
            </span>

            <button
              disabled={!meta.has_more_pages}
              onClick={() =>
                dispatch(
                  fetchPropertyReviews({
                    page: meta.current_page + 1,
                  })
                )
              }
              className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
  <div className="bg-gray-50 hover:bg-gray-100 transition rounded-xl p-4 flex items-center justify-between border">

    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className={`text-2xl font-bold mt-1 ${color}`}>
        {value}
      </p>
    </div>

    <div className="w-11 h-11 rounded-xl bg-white border flex items-center justify-center text-gray-400">
      {icon}
    </div>

  </div>
);

export default PropertyReviewList;