import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Globe,
  GlobeLock,
  ShieldCheck,
  ShieldOff,
  ThumbsUp,
  Calendar,
} from "lucide-react";

import { fetchPropertyReview } from "../../../store/propertyReviewSlice";

const PropertyReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { review, loading, error } = useSelector(
    (state) => state.propertyReviews || {}
  );

  useEffect(() => {
    dispatch(fetchPropertyReview(id));
  }, [dispatch, id]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }
      />
    ));

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link> {" > "}
        <Link to="/properties" className="hover:text-gray-700">Properties</Link> {" > "}
        <Link to="/reviews" className="hover:text-gray-700">Reviews</Link> {" > "}
        <span className="text-gray-800 font-semibold">Details</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800"
            onClick={() => navigate(-1)}
          />
          Review Details
        </h1>
      </div>

      {/* Statistics header */}
      {review && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Verified</p>
            <p className="text-lg font-bold text-blue-600">
              {review.is_verified ? "Yes" : "No"}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-lg font-bold text-green-600">
              {review.is_published ? "Yes" : "No"}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Likes</p>
            <p className="text-lg font-bold text-gray-800">
              {review.likes_count}
            </p>
          </div>
        </div>
      )}
      {loading ? (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
        </div>
      ) : error ? (
        <p className="text-red-600 text-center">
          {error.message || "Error loading review"}
        </p>
      ) : review ? (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          {/* Property */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Property
            </h2>
            <p className="text-lg font-semibold text-gray-800">
              {review.property?.title}
            </p>
          </section>

          {/* User */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              User
            </h2>
            <p className="text-gray-700">{review.user?.name}</p>
            <p className="text-xs text-gray-500">{review.user?.email}</p>
          </section>

          {/* Rating */}
          <section className="flex items-center gap-2">
            {renderStars(review.rating)}
            <span className="font-medium text-gray-700">
              {review.rating_label}
            </span>
          </section>

          {/* Comment */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Comment
            </h2>
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </section>

          {/* Status */}
          <section className="flex flex-wrap gap-4">
            {review.is_published ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <Globe size={14} /> Published
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                <GlobeLock size={14} /> Unpublished
              </span>
            )}
            {review.is_verified ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <ShieldCheck size={14} /> Verified
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                <ShieldOff size={14} /> Unverified
              </span>
            )}
          </section>

          {/* Sentiment */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Sentiment
            </h2>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                review.sentiment === "positive"
                  ? "bg-green-100 text-green-700"
                  : review.sentiment === "negative"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {review.sentiment}
            </span>
          </section>

          {/* Likes */}
          <section className="flex items-center gap-2">
            <ThumbsUp className="text-blue-600" size={16} />
            <span className="text-gray-700">{review.likes_count} likes</span>
          </section>

          {/* Dates + Audit trail */}
          <section className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={14} /> Created: {review.created_at_human}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} /> Updated: {review.updated_at_human}
            </div>
            {review.published_at_human && (
              <div className="flex items-center gap-2">
                <Calendar size={14} /> Published: {review.published_at_human}
              </div>
            )}
            {review.edited_at_human && (
              <div className="flex items-center gap-2">
                <Calendar size={14} /> Edited: {review.edited_at_human}
              </div>
            )}
            {review.moderated_by && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} /> Moderated by: {review.moderated_by}
              </div>
            )}
          </section>

          {/* Actions */}
          {/* <section className="flex gap-4 pt-4 border-t">
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <Edit size={16} /> Edit
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              <Trash size={16} /> Delete
            </button>
            {!review.is_published && (
              <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <CheckCircle size={16} /> Approve
              </button>
            )}
          </section> */}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No review found.</p>
      )}
    </div>
  );
};

export default PropertyReviewDetails