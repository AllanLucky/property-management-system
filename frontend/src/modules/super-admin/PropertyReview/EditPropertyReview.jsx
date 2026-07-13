import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  ArrowLeft,
  Save,
  Loader2,
  Home,
  ChevronRight,
  Building2,
  User,
  Mail,
  CalendarDays,
  Clock3,
  MessageSquareText,
  Heart,
  BadgeCheck,
  Globe,
  GlobeLock,
  ShieldCheck,
  ShieldOff,
  ThumbsUp,
  Sparkles,
  Star,
  PencilLine,
} from "lucide-react";

import {
  fetchPropertyReview,
  updatePropertyReview,
} from "../../../store/propertyReviewSlice";

const ratingLabels = {
  1: {
    text: "Poor",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  2: {
    text: "Fair",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  3: {
    text: "Good",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  4: {
    text: "Very Good",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  5: {
    text: "Excellent",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

const EditPropertyReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    review,
    loading,
    error,
    saving,
  } = useSelector((state) => state.propertyReviews || {});

  const [form, setForm] = useState({
    title: "",
    comment: "",
    rating: 1,
    is_published: false,
    is_verified: false,
  });

  useEffect(() => {
    dispatch(fetchPropertyReview(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (review) {
      setForm({
        title: review.title ?? "",
        comment: review.comment ?? "",
        rating: Number(review.rating) || 1,
        is_published: Boolean(review.is_published),
        is_verified: Boolean(review.is_verified),
      });
    }
  }, [review]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "rating"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await dispatch(
      updatePropertyReview({
        id,
        data: form,
      })
    );

    navigate("/super-admin/property-reviews");
  };

  const characterCount = useMemo(
    () => form.comment.length,
    [form.comment]
  );

  const hasChanges = useMemo(() => {
    if (!review) return false;

    return (
      form.title !== (review.title ?? "") ||
      form.comment !== (review.comment ?? "") ||
      Number(form.rating) !== Number(review.rating) ||
      form.is_published !== Boolean(review.is_published) ||
      form.is_verified !== Boolean(review.is_verified)
    );
  }, [form, review]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-bold text-red-700">
          Failed to load review
        </h2>

        <p className="mt-2 text-red-600">
          {error.message || "Something went wrong."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ================= HEADER ================= */}

      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">

        <div className="p-4 sm:p-6 lg:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              {/* Breadcrumb */}

              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300 flex-wrap">

                <Home className="w-4 h-4" />

                <Link
                  to="/super-admin/dashboard"
                  className="hover:text-white"
                >
                  Dashboard
                </Link>

                <ChevronRight className="w-4 h-4" />

                <Link
                  to="/super-admin/property-reviews"
                  className="hover:text-white"
                >
                  Property Reviews
                </Link>

                <ChevronRight className="w-4 h-4" />

                <span className="text-white font-semibold">
                  Edit Review
                </span>

              </div>

              <div className="mt-5 flex items-center gap-3">

                <button
                  onClick={() => navigate(-1)}
                  className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words">
                    Edit Property Review
                  </h1>

                  <p className="text-slate-300 mt-1">
                    Review #{review?.id}
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-5 py-3 font-semibold shadow-lg transition disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}

                Save Changes
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="rounded-2xl bg-white shadow-sm border p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Rating
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {form.rating}.0
              </h2>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center">

              <Star className="text-yellow-500" />

            </div>

          </div>

          <span
            className={`inline-flex mt-4 px-3 py-1 rounded-full border text-sm font-semibold ${ratingLabels[form.rating]?.color}`}
          >
            {ratingLabels[form.rating]?.text}
          </span>

        </div>

        <div className="rounded-2xl bg-white shadow-sm border p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Likes
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {review?.likes_count ?? 0}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center">

              <Heart className="text-pink-600" />

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white shadow-sm border p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Sentiment
              </p>

              <h2 className="mt-2 text-xl font-bold capitalize">
                {review?.sentiment}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">

              <Sparkles className="text-indigo-600" />

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white shadow-sm border p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Recommendation
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {review?.would_recommend ? "Yes" : "No"}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">

              <ThumbsUp className="text-green-600" />

            </div>

          </div>

        </div>

      </div>
      {/* ================= CONTENT ================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ================= LEFT COLUMN ================= */}

        <div className="xl:col-span-2 space-y-8">

          {/* Review Information */}

          <div className="bg-white rounded-3xl shadow-sm border">

            <div className="border-b px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <MessageSquareText className="w-6 h-6 text-blue-600" />
                </div>

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Review Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Update the review title, comment and rating.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-6 space-y-6">

              {/* Title */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Review Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter review title..."
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-5 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

              </div>

              {/* Comment */}

              <div>

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm font-semibold text-gray-700">
                    Review Comment
                  </label>

                  <span className="text-xs text-gray-500">
                    {characterCount} Characters
                  </span>

                </div>

                <textarea
                  rows={7}
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  placeholder="Write review..."
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 resize-none"
                />

              </div>

              {/* Rating */}

              <div>

                <div className="flex items-center justify-between mb-3">

                  <label className="text-sm font-semibold text-gray-700">
                    Property Rating
                  </label>

                  <span
                    className={`px-4 py-1 rounded-full border text-sm font-semibold ${ratingLabels[form.rating]?.color}`}
                  >
                    {ratingLabels[form.rating]?.text}
                  </span>

                </div>

                <div className="flex flex-wrap gap-2">

                  {[1, 2, 3, 4, 5].map((star) => (

                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          rating: star,
                        }))
                      }
                      className="transition hover:scale-110"
                    >
                      <Star
                        className={`w-9 h-9 ${star <= form.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    </button>

                  ))}

                </div>

              </div>

            </div>

          </div>

          {/* Publishing */}

          <div className="bg-white rounded-3xl shadow-sm border">

            <div className="border-b px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-green-600" />
                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Publication Settings
                  </h2>

                  <p className="text-sm text-gray-500">
                    Control review visibility.
                  </p>

                </div>

              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6">

              {/* Published */}

              <label className="flex items-center justify-between rounded-2xl border p-5 hover:border-blue-400 transition cursor-pointer">

                <div className="flex gap-4">

                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">

                    {form.is_published ? (
                      <Globe className="text-green-600" />
                    ) : (
                      <GlobeLock className="text-gray-500" />
                    )}

                  </div>

                  <div>

                    <h3 className="font-semibold">
                      Published
                    </h3>

                    <p className="text-sm text-gray-500">
                      Visible to visitors.
                    </p>

                  </div>

                </div>

                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleChange}
                  className="w-5 h-5"
                />

              </label>

              {/* Verified */}

              <label className="flex items-center justify-between rounded-2xl border p-5 hover:border-blue-400 transition cursor-pointer">

                <div className="flex gap-4">

                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">

                    {form.is_verified ? (
                      <ShieldCheck className="text-blue-600" />
                    ) : (
                      <ShieldOff className="text-gray-500" />
                    )}

                  </div>

                  <div>

                    <h3 className="font-semibold">
                      Verified
                    </h3>

                    <p className="text-sm text-gray-500">
                      Mark review as verified.
                    </p>

                  </div>

                </div>

                <input
                  type="checkbox"
                  name="is_verified"
                  checked={form.is_verified}
                  onChange={handleChange}
                  className="w-5 h-5"
                />

              </label>

            </div>

          </div>

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}

        <div className="space-y-6">

          {/* Property */}

          <div className="bg-white rounded-3xl shadow-sm border">

            <div className="p-6">

              <div className="flex items-center gap-3 mb-5">

                <Building2 className="text-blue-600" />

                <h3 className="font-bold text-lg">
                  Property Information
                </h3>

              </div>

              <div className="space-y-5">

                <div>

                  <p className="text-xs uppercase text-gray-500">
                    Property
                  </p>

                  <p className="font-semibold mt-1">
                    {review?.property?.title}
                  </p>

                </div>

                <div>

                  <p className="text-xs uppercase text-gray-500">
                    Slug
                  </p>

                  <p className="text-sm mt-1 break-all text-gray-700">
                    {review?.property?.slug}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Reviewer */}

          <div className="bg-white rounded-3xl shadow-sm border">

            <div className="p-6">

              <div className="flex items-center gap-3 mb-5">

                <User className="text-green-600" />

                <h3 className="font-bold text-lg">
                  Reviewer
                </h3>

              </div>

              <div className="space-y-5">

                <div className="flex items-center gap-3">

                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">

                    {review?.user?.name?.charAt(0)}

                  </div>

                  <div>

                    <h4 className="font-semibold">
                      {review?.user?.name}
                    </h4>

                    <p className="text-sm text-gray-500">
                      Property Reviewer
                    </p>

                  </div>

                </div>

                <div className="flex gap-3">

                  <Mail className="w-4 h-4 mt-1 text-gray-400" />

                  <span className="text-sm break-all">
                    {review?.user?.email}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* Timeline */}

          <div className="bg-white rounded-3xl shadow-sm border">

            <div className="p-6">

              <div className="flex items-center gap-3 mb-6">

                <Clock3 className="text-purple-600" />

                <h3 className="font-bold text-lg">
                  Timeline
                </h3>

              </div>

              <div className="space-y-5">

                <div className="flex gap-3">

                  <CalendarDays className="w-5 h-5 text-blue-500" />

                  <div>

                    <p className="font-medium">
                      Created
                    </p>

                    <p className="text-sm text-gray-500">
                      {review?.created_at_human}
                    </p>

                  </div>

                </div>

                <div className="flex gap-3">

                  <PencilLine className="w-5 h-5 text-orange-500" />

                  <div>

                    <p className="font-medium">
                      Updated
                    </p>

                    <p className="text-sm text-gray-500">
                      {review?.updated_at_human}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>
          {/* ================= ACTIONS ================= */}

          <div className="bg-white rounded-3xl border shadow-sm">

            <div className="p-6">

              {hasChanges && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">

                      <PencilLine className="w-5 h-5 text-amber-600" />

                    </div>

                    <div>

                      <h4 className="font-semibold text-amber-800">
                        Unsaved Changes
                      </h4>

                      <p className="text-sm text-amber-700 mt-1">
                        You have modified this review. Click
                        <strong> Save Changes </strong>
                        to update the review.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div className="text-sm text-gray-500">

                  Review ID

                  <span className="ml-2 font-semibold text-gray-800">
                    #{review?.id}
                  </span>

                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 rounded-2xl border border-gray-300 bg-white hover:bg-gray-100 transition font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!review) return;

                      setForm({
                        title: review.title ?? "",
                        comment: review.comment ?? "",
                        rating: Number(review.rating) || 1,
                        is_published: Boolean(review.is_published),
                        is_verified: Boolean(review.is_verified),
                      });
                    }}
                    className="px-6 py-3 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-medium"
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default EditPropertyReview;
